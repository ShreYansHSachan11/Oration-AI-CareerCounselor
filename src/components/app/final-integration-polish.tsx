/**
 * Final Integration and Polish Component
 * Provides comprehensive application integration with performance monitoring,
 * error handling, and user experience enhancements
 */

'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ErrorBoundary } from '@/components/error/error-boundary';
import { AppLoading } from '@/components/layout/app-loading';
import { performanceMonitor } from '@/lib/performance-monitor';
import { useToast } from '@/hooks/use-toast';
import { useResponsive } from '@/hooks/use-responsive';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { cn } from '@/lib/utils';

// Performance monitoring and analytics
interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  memoryUsage: number;
}

// Enhanced error tracking
interface ErrorMetrics {
  errorCount: number;
  lastError: string | null;
  errorTypes: Record<string, number>;
}

// User experience metrics
interface UXMetrics {
  sessionDuration: number;
  interactionCount: number;
  featureUsage: Record<string, number>;
}

export function FinalIntegrationPolish({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { addToast } = useToast();
  const { isMobile, isTablet } = useResponsive();
  
  // Performance state
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    interactionTime: 0,
    memoryUsage: 0,
  });

  // Error tracking state
  const [errorMetrics, setErrorMetrics] = useState<ErrorMetrics>({
    errorCount: 0,
    lastError: null,
    errorTypes: {},
  });

  // UX metrics state
  const [uxMetrics, setUXMetrics] = useState<UXMetrics>({
    sessionDuration: 0,
    interactionCount: 0,
    featureUsage: {},
  });

  // Application state
  const [isOptimized, setIsOptimized] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'offline'>('good');

  // Initialize performance monitoring
  useEffect(() => {
    const startTime = performance.now();
    
    // Monitor initial load performance
    const measureLoadTime = () => {
      const loadTime = performance.now() - startTime;
      setPerformanceMetrics(prev => ({ ...prev, loadTime }));
    };

    // Monitor memory usage
    const monitorMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setPerformanceMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024, // MB
        }));
      }
    };

    // Monitor network quality
    const monitorConnection = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        const quality = connection.effectiveType === '4g' ? 'good' : 
                       connection.effectiveType === '3g' ? 'poor' : 'offline';
        setConnectionQuality(quality);
      }
    };

    measureLoadTime();
    monitorMemory();
    monitorConnection();

    // Set up periodic monitoring
    const memoryInterval = setInterval(monitorMemory, 5000);
    const connectionInterval = setInterval(monitorConnection, 10000);

    return () => {
      clearInterval(memoryInterval);
      clearInterval(connectionInterval);
    };
  }, []);

  // Track user interactions
  useEffect(() => {
    let interactionCount = 0;
    const startTime = Date.now();

    const trackInteraction = (event: Event) => {
      interactionCount++;
      setUXMetrics(prev => ({
        ...prev,
        interactionCount,
        sessionDuration: Date.now() - startTime,
      }));
    };

    // Track various interaction types
    const events = ['click', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, trackInteraction, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackInteraction);
      });
    };
  }, []);

  // Error boundary handler
  const handleError = (error: Error, errorInfo: any) => {
    setErrorMetrics(prev => ({
      errorCount: prev.errorCount + 1,
      lastError: error.message,
      errorTypes: {
        ...prev.errorTypes,
        [error.name]: (prev.errorTypes[error.name] || 0) + 1,
      },
    }));

    // Log error for monitoring
    console.error('Application Error:', error, errorInfo);
    
    // Show user-friendly error message
    addToast('An unexpected error occurred. Please try again.', 'error');
  };

  // Keyboard shortcuts setup
  useKeyboardShortcuts({
    'ctrl+k': () => {
      // Quick search functionality
      addToast('Quick search activated', 'info');
    },
    'ctrl+/': () => {
      // Show help
      addToast('Keyboard shortcuts: Ctrl+K (search), Ctrl+/ (help)', 'info');
    },
    'esc': () => {
      // Close modals/overlays
      // This would be handled by individual components
    },
  });

  // Optimize application based on device and performance
  useEffect(() => {
    const optimizeForDevice = () => {
      if (isMobile) {
        // Mobile optimizations
        document.body.classList.add('mobile-optimized');
        
        // Reduce animations on low-end devices
        if (performanceMetrics.memoryUsage > 100) {
          document.body.classList.add('reduced-motion');
        }
      }

      if (connectionQuality === 'poor') {
        // Reduce data usage
        document.body.classList.add('low-bandwidth');
      }

      setIsOptimized(true);
    };

    optimizeForDevice();
  }, [isMobile, performanceMetrics.memoryUsage, connectionQuality]);

  // Performance warnings
  useEffect(() => {
    if (performanceMetrics.memoryUsage > 150) {
      addToast('High memory usage detected. Consider refreshing the page.', 'warning');
    }

    if (errorMetrics.errorCount > 5) {
      addToast('Multiple errors detected. Please refresh the page.', 'error');
    }
  }, [performanceMetrics.memoryUsage, errorMetrics.errorCount, addToast]);

  // Loading state with enhanced animations
  if (status === 'loading' || !isOptimized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 mx-auto">
            <motion.div
              className="w-full h-full border-4 border-primary/20 border-t-primary rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground"
          >
            Optimizing your experience...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <ErrorBoundary onError={handleError}>
      <div className={cn(
        "min-h-screen transition-all duration-300",
        isMobile && "mobile-optimized",
        connectionQuality === 'poor' && "low-bandwidth"
      )}>
        {/* Performance indicator */}
        {performanceMetrics.memoryUsage > 100 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-4 right-4 z-50 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 text-xs text-yellow-600 dark:text-yellow-400"
          >
            High memory usage: {Math.round(performanceMetrics.memoryUsage)}MB
          </motion.div>
        )}

        {/* Connection quality indicator */}
        {connectionQuality !== 'good' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "fixed top-4 left-4 z-50 rounded-lg p-2 text-xs",
              connectionQuality === 'poor' 
                ? "bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400"
                : "bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400"
            )}
          >
            {connectionQuality === 'poor' ? 'Slow connection' : 'Offline'}
          </motion.div>
        )}

        {/* Main application content */}
        <Suspense fallback={<AppLoading isLoading={true} />}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen"
          >
            {children}
          </motion.div>
        </Suspense>

        {/* Development metrics (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed bottom-4 left-4 z-50 bg-black/80 text-white text-xs p-2 rounded font-mono max-w-xs"
          >
            <div>Load: {Math.round(performanceMetrics.loadTime)}ms</div>
            <div>Memory: {Math.round(performanceMetrics.memoryUsage)}MB</div>
            <div>Interactions: {uxMetrics.interactionCount}</div>
            <div>Errors: {errorMetrics.errorCount}</div>
            <div>Device: {isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}</div>
          </motion.div>
        )}
      </div>
    </ErrorBoundary>
  );
}

// Performance optimization utilities
export const performanceUtils = {
  // Lazy load images
  lazyLoadImage: (src: string, placeholder?: string) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = reject;
      img.src = src;
    });
  },

  // Debounce function calls
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function calls
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // Measure component render time
  measureRenderTime: (componentName: string) => {
    const start = performance.now();
    return () => {
      const end = performance.now();
      console.log(`${componentName} render time: ${end - start}ms`);
    };
  },
};

// Bundle size optimization
export const bundleOptimization = {
  // Dynamic imports for code splitting
  loadComponent: async (componentPath: string) => {
    if (typeof window === 'undefined') {
      throw new Error('Dynamic imports only available on client side');
    }
    
    try {
      // This would be used with actual component paths in real implementation
      console.log(`Loading component: ${componentPath}`);
      return null; // Placeholder for actual dynamic import
    } catch (error) {
      console.error(`Failed to load component: ${componentPath}`, error);
      throw error;
    }
  },

  // Preload critical resources
  preloadResource: (href: string, as: string) => {
    if (typeof window === 'undefined') return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  },
};