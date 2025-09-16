import React from 'react';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000;

  startTimer(name: string, metadata?: Record<string, any>) {
    const startTime = performance.now();

    return {
      end: () => {
        const duration = performance.now() - startTime;
        this.addMetric(name, duration, metadata);
        return duration;
      },
    };
  }

  addMetric(name: string, duration: number, metadata?: Record<string, any>) {
    // Remove oldest metrics if we're at capacity
    if (this.metrics.length >= this.maxMetrics) {
      this.metrics.shift();
    }

    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    });
  }

  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(metric => metric.name === name);
    }
    return [...this.metrics];
  }

  getAverageTime(name: string): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;

    const total = metrics.reduce((sum, metric) => sum + metric.duration, 0);
    return total / metrics.length;
  }

  getStats(name?: string) {
    const metrics = this.getMetrics(name);

    if (metrics.length === 0) {
      return {
        count: 0,
        average: 0,
        min: 0,
        max: 0,
        p95: 0,
        p99: 0,
      };
    }

    const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
    const count = durations.length;
    const sum = durations.reduce((a, b) => a + b, 0);

    return {
      count,
      average: sum / count,
      min: durations[0],
      max: durations[count - 1],
      p95: durations[Math.floor(count * 0.95)],
      p99: durations[Math.floor(count * 0.99)],
    };
  }

  clear(name?: string) {
    if (name) {
      this.metrics = this.metrics.filter(metric => metric.name !== name);
    } else {
      this.metrics = [];
    }
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Performance middleware for tRPC
export function createPerformanceMiddleware(name: string) {
  return async (opts: { next: () => Promise<any> }) => {
    const timer = performanceMonitor.startTimer(name);

    try {
      const result = await opts.next();
      timer.end();
      return result;
    } catch (error) {
      timer.end();
      throw error;
    }
  };
}

// Database query performance wrapper
export async function measureQuery<T>(
  name: string,
  query: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const timer = performanceMonitor.startTimer(`db:${name}`, metadata);

  try {
    const result = await query();
    const duration = timer.end();

    // Log slow queries (> 1 second)
    if (duration > 1000) {
      console.warn(
        `Slow query detected: ${name} took ${duration.toFixed(2)}ms`,
        metadata
      );
    }

    return result;
  } catch (error) {
    timer.end();
    throw error;
  }
}

// API endpoint performance wrapper
export function measureAPIEndpoint(name: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const timer = performanceMonitor.startTimer(`api:${name}`);

      try {
        const result = await originalMethod.apply(this, args);
        timer.end();
        return result;
      } catch (error) {
        timer.end();
        throw error;
      }
    };

    return descriptor;
  };
}

// React component performance wrapper
export function measureComponent(name: string) {
  return function <T extends React.ComponentType<any>>(Component: T): T {
    const WrappedComponent = (props: any) => {
      const timer = performanceMonitor.startTimer(`component:${name}`);

      React.useEffect(() => {
        return () => {
          timer.end();
        };
      }, []);

      return React.createElement(Component, props);
    };

    WrappedComponent.displayName = `Measured(${Component.displayName || Component.name})`;

    return WrappedComponent as T;
  };
}

// Performance reporting
export function getPerformanceReport() {
  const allMetrics = performanceMonitor.getMetrics();
  const groupedMetrics: Record<string, PerformanceMetric[]> = {};

  // Group metrics by name
  allMetrics.forEach(metric => {
    if (!groupedMetrics[metric.name]) {
      groupedMetrics[metric.name] = [];
    }
    groupedMetrics[metric.name].push(metric);
  });

  // Generate stats for each group
  const report: Record<string, any> = {};
  Object.keys(groupedMetrics).forEach(name => {
    report[name] = performanceMonitor.getStats(name);
  });

  return report;
}

// Memory usage monitoring
export function getMemoryUsage() {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
    };
  }

  return null;
}

// Performance logging
export function logPerformanceMetrics() {
  const report = getPerformanceReport();
  const memory = getMemoryUsage();

  console.log('Performance Report:', {
    timestamp: new Date().toISOString(),
    metrics: report,
    memory,
  });
}

// Auto-log performance metrics every 5 minutes in development
if (process.env.NODE_ENV === 'development') {
  setInterval(logPerformanceMetrics, 5 * 60 * 1000);
}
