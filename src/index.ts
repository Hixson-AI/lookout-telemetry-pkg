import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';

export interface TelemetryConfig {
  serviceName: string;
  serviceVersion?: string;
  environment?: string;
  deploymentProfile?: string;
  component?: string;
  traceExporterUrl?: string;
  metricExporterUrl?: string;
}

let sdk: NodeSDK | null = null;

/**
 * Initialize OpenTelemetry SDK with automatic instrumentation
 */
export function initTelemetry(config: TelemetryConfig): NodeSDK {
  if (sdk) {
    return sdk;
  }

  const resource = Resource.default().merge(
    new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: config.serviceVersion || 'unknown',
      'deployment.environment': config.environment || process.env.NODE_ENV || 'production',
      'deployment.profile': config.deploymentProfile || process.env.DEPLOYMENT_PROFILE || 'unknown',
      'component': config.component || process.env.LOG_COMPONENT || 'unknown',
      'git.sha': process.env.GIT_SHA || 'unknown',
    })
  );

  sdk = new NodeSDK({
    resource,
    traceExporter: config.traceExporterUrl
      ? new OTLPTraceExporter({ url: config.traceExporterUrl })
      : undefined,
    metricReader: config.metricExporterUrl
      ? new PeriodicExportingMetricReader({
          exporter: new OTLPMetricExporter({ url: config.metricExporterUrl }),
          exportIntervalMillis: 15000,
        }) as any
      : undefined,
    instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()],
  });

  sdk.start();
  return sdk;
}

/**
 * Shutdown OpenTelemetry SDK
 */
export async function shutdownTelemetry(): Promise<void> {
  if (sdk) {
    await sdk.shutdown();
    sdk = null;
  }
}

/**
 * Get current OpenTelemetry SDK instance
 */
export function getTelemetrySDK(): NodeSDK | null {
  return sdk;
}
