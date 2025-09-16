/**
 * Performance monitoring and optimization utilities
 */

interface PerformanceMetrics {
  lcp?: number;
  fid?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
}

interface NavigationTiming {
  loadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
            startTime: number;
          };
          this.metrics.lcp = lastEntry.startTime;
          this.reportMetric('LCP', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            const fidEntry = entry as PerformanceEntry & {
              processingStart: number;
              startTime: number;
            };
            const fid = fidEntry.processingStart - fidEntry.startTime;
            this.metrics.fid = fid;
            this.reportMetric('FID', fid);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (e) {
        console.warn('FID observer not supported');
      }

      // Cumulative Layout Shift (CLS)
      try {
        const clsObserver = new PerformanceObserver(list => {
          let clsValue = 0;
          const entries = list.getEntries();
          entries.forEach(entry => {
            const layoutShiftEntry = entry as PerformanceEntry & {
              value: number;
              hadRecentInput: boolean;
            };
            if (!layoutShiftEntry.hadRecentInput) {
              clsValue += layoutShiftEntry.value;
            }
          });
          this.metrics.cls = clsValue;
          this.reportMetric('CLS', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (e) {
        console.warn('CLS observer not supported');
      }

      // First Contentful Paint (FCP)
      try {
        const fcpObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.fcp = entry.startTime;
              this.reportMetric('FCP', entry.startTime);
            }
          });
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(fcpObserver);
      } catch (e) {
        console.warn('FCP observer not supported');
      }
    }
  }

  private reportMetric(name: string, value: number) {
    // In production, send to analytics service
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance Metric - ${name}:`, value);
    }

    // Send to analytics service in production
    if (
      process.env.NODE_ENV === 'production' &&
      typeof window !== 'undefined'
    ) {
      // Example: Send to Google Analytics, Vercel Analytics, etc.
      if ('gtag' in window) {
        (window as any).gtag('event', 'web_vitals', {
          event_category: 'Performance',
          event_label: name,
          value: Math.round(value),
          non_interaction: true,
        });
      }
    }
  }

  getNavigationTiming(): NavigationTiming | null {
    if (typeof window === 'undefined' || !window.performance) {
      return null;
    }

    const navigation = window.performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming;
    const paint = window.performance.getEntriesByType('paint');

    const firstPaint =
      paint.find(entry => entry.name === 'first-paint')?.startTime || 0;
    const firstContentfulPaint =
      paint.find(entry => entry.name === 'first-contentful-paint')?.startTime ||
      0;

    return {
      loadTime: navigation.loadEventEnd - navigation.navigationStart,
      domContentLoaded:
        navigation.domContentLoadedEventEnd - navigation.navigationStart,
      firstPaint,
      firstContentfulPaint,
    };
  }

  getResourceTiming() {
    if (typeof window === 'undefined' || !window.performance) {
      return [];
    }

    return window.performance.getEntriesByType('resource').map(entry => {
      const resource = entry as PerformanceResourceTiming;
      return {
        name: resource.name,
        duration: resource.duration,
        size: resource.transferSize,
        type: this.getResourceType(resource.name),
      };
    });
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    if (url.includes('.woff') || url.includes('.ttf')) return 'font';
    return 'other';
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics>({});
  const [navigationTiming, setNavigationTiming] =
    React.useState<NavigationTiming | null>(null);

  React.useEffect(() => {
    // Get initial metrics
    setMetrics(performanceMonitor.getMetrics());
    setNavigationTiming(performanceMonitor.getNavigationTiming());

    // Update metrics periodically
    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getMetrics());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return { metrics, navigationTiming };
}

// Bundle size analyzer
export function analyzeBundleSize() {
  if (typeof window === 'undefined') return;

  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const stylesheets = Array.from(
    document.querySelectorAll('link[rel="stylesheet"]')
  );

  console.group('Bundle Analysis');

  scripts.forEach(script => {
    const src = (script as HTMLScriptElement).src;
    if (src.includes('/_next/static/')) {
      console.log('Script:', src.split('/').pop(), 'Size: Checking...');
    }
  });

  stylesheets.forEach(link => {
    const href = (link as HTMLLinkElement).href;
    if (href.includes('/_next/static/')) {
      console.log('Stylesheet:', href.split('/').pop(), 'Size: Checking...');
    }
  });

  console.groupEnd();
}

// Memory usage monitoring
export function getMemoryUsage() {
  if (typeof window === 'undefined' || !('memory' in performance)) {
    return null;
  }

  const memory = (performance as any).memory;
  return {
    used: Math.round(memory.usedJSHeapSize / 1048576), // MB
    total: Math.round(memory.totalJSHeapSize / 1048576), // MB
    limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
  };
}

// Import React for the hook
import React from 'react';
