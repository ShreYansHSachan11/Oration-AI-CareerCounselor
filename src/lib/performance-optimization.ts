/**
 * Performance Optimization Utilities
 * Comprehensive performance monitoring and optimization tools
 */

// Performance metrics interface
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  memoryUsage: number;
  bundleSize: number;
  cacheHitRate: number;
}

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  LOAD_TIME: 3000, // 3 seconds
  RENDER_TIME: 16, // 60fps = 16ms per frame
  INTERACTION_TIME: 100, // 100ms for interactions
  MEMORY_USAGE: 100, // 100MB
  BUNDLE_SIZE: 500, // 500KB initial bundle
  CACHE_HIT_RATE: 0.8, // 80% cache hit rate
} as const;

// Performance monitoring class
export class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];
  private startTime: number = 0;

  constructor() {
    this.startTime = performance.now();
    this.initializeObservers();
  }

  private initializeObservers() {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Observe navigation timing
    if ('PerformanceObserver' in window) {
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.metrics.loadTime = navEntry.loadEventEnd - navEntry.fetchStart;
          }
        });
      });

      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);

      // Observe paint timing
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.renderTime = entry.startTime;
          }
        });
      });

      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);

      // Observe largest contentful paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.metrics.renderTime = lastEntry.startTime;
        }
      });

      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    }
  }

  // Measure component render time
  measureRender<T>(componentName: string, renderFn: () => T): T {
    const start = performance.now();
    const result = renderFn();
    const end = performance.now();
    
    console.log(`${componentName} render time: ${(end - start).toFixed(2)}ms`);
    
    if (end - start > PERFORMANCE_THRESHOLDS.RENDER_TIME) {
      console.warn(`${componentName} render time exceeds threshold`);
    }
    
    return result;
  }

  // Measure interaction time
  measureInteraction<T>(interactionName: string, interactionFn: () => T): T {
    const start = performance.now();
    const result = interactionFn();
    const end = performance.now();
    
    const duration = end - start;
    this.metrics.interactionTime = duration;
    
    if (duration > PERFORMANCE_THRESHOLDS.INTERACTION_TIME) {
      console.warn(`${interactionName} interaction time exceeds threshold: ${duration.toFixed(2)}ms`);
    }
    
    return result;
  }

  // Monitor memory usage
  monitorMemory(): number {
    if (typeof window === 'undefined') return 0;
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      this.metrics.memoryUsage = usedMB;
      
      if (usedMB > PERFORMANCE_THRESHOLDS.MEMORY_USAGE) {
        console.warn(`High memory usage: ${usedMB.toFixed(2)}MB`);
      }
      
      return usedMB;
    }
    return 0;
  }

  // Get current metrics
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  // Generate performance report
  generateReport(): string {
    const metrics = this.getMetrics();
    const report = [
      '=== Performance Report ===',
      `Load Time: ${metrics.loadTime?.toFixed(2) || 'N/A'}ms`,
      `Render Time: ${metrics.renderTime?.toFixed(2) || 'N/A'}ms`,
      `Interaction Time: ${metrics.interactionTime?.toFixed(2) || 'N/A'}ms`,
      `Memory Usage: ${metrics.memoryUsage?.toFixed(2) || 'N/A'}MB`,
      `Bundle Size: ${metrics.bundleSize?.toFixed(2) || 'N/A'}KB`,
      `Cache Hit Rate: ${((metrics.cacheHitRate || 0) * 100).toFixed(1)}%`,
      '========================',
    ].join('\n');
    
    return report;
  }

  // Cleanup observers
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Bundle size analyzer
export class BundleAnalyzer {
  private static instance: BundleAnalyzer;
  private bundleMetrics: Map<string, number> = new Map();

  static getInstance(): BundleAnalyzer {
    if (!BundleAnalyzer.instance) {
      BundleAnalyzer.instance = new BundleAnalyzer();
    }
    return BundleAnalyzer.instance;
  }

  // Track chunk loading
  trackChunkLoad(chunkName: string, size: number) {
    this.bundleMetrics.set(chunkName, size);
    console.log(`Loaded chunk: ${chunkName} (${(size / 1024).toFixed(2)}KB)`);
  }

  // Get total bundle size
  getTotalBundleSize(): number {
    return Array.from(this.bundleMetrics.values()).reduce((total, size) => total + size, 0);
  }

  // Get bundle breakdown
  getBundleBreakdown(): Record<string, number> {
    return Object.fromEntries(this.bundleMetrics);
  }
}

// Cache performance monitor
export class CacheMonitor {
  private cacheHits: number = 0;
  private cacheMisses: number = 0;

  recordHit() {
    this.cacheHits++;
  }

  recordMiss() {
    this.cacheMisses++;
  }

  getHitRate(): number {
    const total = this.cacheHits + this.cacheMisses;
    return total > 0 ? this.cacheHits / total : 0;
  }

  reset() {
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
}

// Performance optimization utilities
export const performanceUtils = {
  // Debounce function
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // Memoization with LRU cache
  memoize<T extends (...args: any[]) => any>(
    func: T,
    maxSize: number = 100
  ): T {
    const cache = new Map();
    const keys: any[] = [];

    return ((...args: Parameters<T>) => {
      const key = JSON.stringify(args);
      
      if (cache.has(key)) {
        // Move to end (most recently used)
        keys.splice(keys.indexOf(key), 1);
        keys.push(key);
        return cache.get(key);
      }

      const result = func(...args);
      
      // Add to cache
      cache.set(key, result);
      keys.push(key);
      
      // Remove oldest if over limit
      if (keys.length > maxSize) {
        const oldestKey = keys.shift();
        cache.delete(oldestKey);
      }
      
      return result;
    }) as T;
  },

  // Lazy loading utility
  lazyLoad: <T>(importFn: () => Promise<T>): (() => Promise<T>) => {
    let promise: Promise<T> | null = null;
    
    return () => {
      if (!promise) {
        promise = importFn();
      }
      return promise;
    };
  },

  // Virtual scrolling helper
  calculateVisibleItems: (
    containerHeight: number,
    itemHeight: number,
    scrollTop: number,
    totalItems: number,
    overscan: number = 5
  ) => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(totalItems - 1, startIndex + visibleCount + overscan * 2);
    
    return { startIndex, endIndex, visibleCount };
  },

  // Image optimization
  optimizeImage: (
    src: string,
    width?: number,
    height?: number,
    quality: number = 80
  ): string => {
    // This would integrate with Next.js Image optimization or a CDN
    const params = new URLSearchParams();
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    params.set('q', quality.toString());
    
    return `${src}?${params.toString()}`;
  },

  // Preload critical resources
  preloadResource: (href: string, as: string, crossorigin?: string) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (crossorigin) link.crossOrigin = crossorigin;
    document.head.appendChild(link);
  },

  // Prefetch next page resources
  prefetchPage: (href: string) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  },
};

// Device-specific optimizations
export const deviceOptimizations = {
  // Detect device capabilities
  getDeviceCapabilities: () => {
    if (typeof window === 'undefined') {
      return {
        connectionType: 'unknown',
        memory: 'unknown',
        cores: 'unknown',
        isMobile: false,
        isLowEnd: false,
        isSlowConnection: false,
      };
    }
    
    const connection = (navigator as any).connection;
    const memory = (navigator as any).deviceMemory;
    const cores = navigator.hardwareConcurrency;
    
    return {
      connectionType: connection?.effectiveType || 'unknown',
      memory: memory || 'unknown',
      cores: cores || 'unknown',
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      isLowEnd: memory && memory <= 4,
      isSlowConnection: connection && ['slow-2g', '2g', '3g'].includes(connection.effectiveType),
    };
  },

  // Apply device-specific optimizations
  applyOptimizations: () => {
    const capabilities = deviceOptimizations.getDeviceCapabilities();
    
    if (typeof window === 'undefined') return capabilities;
    
    if (capabilities.isLowEnd) {
      // Reduce animations and effects
      document.body.classList.add('low-end-device');
    }
    
    if (capabilities.isSlowConnection) {
      // Reduce image quality and defer non-critical resources
      document.body.classList.add('slow-connection');
    }
    
    if (capabilities.isMobile) {
      // Mobile-specific optimizations
      document.body.classList.add('mobile-device');
    }
    
    return capabilities;
  },
};

// Global performance monitor instance (only on client)
export const globalPerformanceMonitor = typeof window !== 'undefined' ? new PerformanceMonitor() : null;
export const globalBundleAnalyzer = typeof window !== 'undefined' ? BundleAnalyzer.getInstance() : null;
export const globalCacheMonitor = typeof window !== 'undefined' ? new CacheMonitor() : null;

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    globalPerformanceMonitor.cleanup();
  });
}