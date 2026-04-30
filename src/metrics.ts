import * as promClient from 'prom-client';

export interface MetricsConfig {
  defaultLabels?: Record<string, string>;
  tenantId?: string;
}

/**
 * Create and configure Prometheus metrics registry
 */
export class MetricsRegistry {
  private registry: promClient.Registry;

  constructor(config?: MetricsConfig) {
    this.registry = new promClient.Registry();
    
    const labels = config?.defaultLabels || {};
    if (config?.tenantId) {
      labels.tenant_id = config.tenantId;
    }
    
    if (Object.keys(labels).length > 0) {
      this.registry.setDefaultLabels(labels);
    }

    // Default metrics (process, GC, etc.)
    promClient.collectDefaultMetrics({ register: this.registry });
  }

  /**
   * Create a counter metric
   */
  createCounter(name: string, help: string, labelNames?: string[]): promClient.Counter<string> {
    return new promClient.Counter({
      name,
      help,
      labelNames,
      registers: [this.registry],
    });
  }

  /**
   * Create a gauge metric
   */
  createGauge(name: string, help: string, labelNames?: string[]): promClient.Gauge<string> {
    return new promClient.Gauge({
      name,
      help,
      labelNames,
      registers: [this.registry],
    });
  }

  /**
   * Create a histogram metric
   */
  createHistogram(name: string, help: string, labelNames?: string[]): promClient.Histogram<string> {
    return new promClient.Histogram({
      name,
      help,
      labelNames,
      registers: [this.registry],
    });
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Get the underlying registry
   */
  getRegistry(): promClient.Registry {
    return this.registry;
  }
}

let globalRegistry: MetricsRegistry | null = null;

/**
 * Get or create the global metrics registry
 */
export function getMetricsRegistry(config?: MetricsConfig): MetricsRegistry {
  if (!globalRegistry) {
    globalRegistry = new MetricsRegistry(config);
  }
  return globalRegistry;
}
