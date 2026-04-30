# @lookout/telemetry

Telemetry package for the Lookout Platform - provides automatic OpenTelemetry instrumentation and Prometheus metrics.

## Installation

```bash
pnpm add @lookout/telemetry
```

## Usage

### OpenTelemetry Initialization

```typescript
import { initTelemetry, shutdownTelemetry } from '@lookout/telemetry';

// Initialize at application startup
initTelemetry({
  serviceName: 'my-service',
  serviceVersion: '1.0.0',
  environment: 'production',
  deploymentProfile: 'production',
  component: 'api',
  traceExporterUrl: 'http://lookout-telemetry.internal:4317',
  metricExporterUrl: 'http://lookout-telemetry.internal:4317',
});

// Shutdown gracefully
await shutdownTelemetry();
```

### Prometheus Metrics

```typescript
import { getMetricsRegistry, HttpMetrics } from '@lookout/telemetry';
import express from 'express';

const app = express();

// Get metrics registry
const registry = getMetricsRegistry({
  defaultLabels: {
    service: 'my-service',
    environment: 'production',
  },
});

// Add HTTP metrics middleware
const httpMetrics = new HttpMetrics({ registry });
app.use(httpMetrics.middleware());

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', registry.getRegistry().contentType);
  res.send(await registry.getMetrics());
});
```

## Features

- **Automatic Instrumentation**: HTTP and Express instrumentation out of the box
- **Prometheus Metrics**: Built-in metrics registry with common metric types
- **HTTP Metrics**: Request duration, request count, and in-flight request tracking
- **Resource Attributes**: Automatic service metadata from environment variables
- **OpenTelemetry**: Standard-compliant tracing and metrics export

## Environment Variables

The package automatically reads these environment variables:

- `NODE_ENV`: Application environment (default: production)
- `DEPLOYMENT_PROFILE`: Deployment profile (default: unknown)
- `LOG_COMPONENT`: Component name (default: unknown)
- `GIT_SHA`: Git commit SHA (default: unknown)

## License

MIT
