import { MetricsRegistry } from './metrics';

export interface HttpMetricsConfig {
  registry?: MetricsRegistry;
}

/**
 * HTTP request metrics middleware
 */
export class HttpMetrics {
  private registry: MetricsRegistry;
  private httpRequestDuration: ReturnType<MetricsRegistry['createHistogram']>;
  private httpRequestsTotal: ReturnType<MetricsRegistry['createCounter']>;
  private httpRequestsInProgress: ReturnType<MetricsRegistry['createGauge']>;

  constructor(config?: HttpMetricsConfig) {
    this.registry = config?.registry || require('./metrics').getMetricsRegistry();

    // Request duration histogram
    this.httpRequestDuration = this.registry.createHistogram(
      'http_request_duration_seconds',
      'HTTP request duration in seconds',
      ['method', 'route', 'status_code']
    );

    // Request counter
    this.httpRequestsTotal = this.registry.createCounter(
      'http_requests_total',
      'Total HTTP requests',
      ['method', 'route', 'status_code']
    );

    // In-flight requests gauge
    this.httpRequestsInProgress = this.registry.createGauge(
      'http_requests_in_progress',
      'Number of HTTP requests in progress',
      ['method', 'route']
    );
  }

  /**
   * Middleware function for Express
   */
  middleware() {
    return (req: any, res: any, next: any) => {
      const start = Date.now();
      const method = req.method;
      const route = req.route?.path || req.path;

      // Increment in-flight gauge
      this.httpRequestsInProgress.inc({ method, route });

      res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const statusCode = res.statusCode.toString();

        // Record duration
        this.httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);

        // Increment request counter
        this.httpRequestsTotal.inc({ method, route, status_code: statusCode });

        // Decrement in-flight gauge
        this.httpRequestsInProgress.dec({ method, route });
      });

      next();
    };
  }
}
