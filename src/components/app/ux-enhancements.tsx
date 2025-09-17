/**
 * User Experience Enhancements
 * Comprehensive UX improvements including animations, feedback, and accessibility
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useResponsive } from '@/hooks/use-responsive';
import { cn } from '@/lib/utils';

// UX Enhancement Types
interface UXState {
  isOnline: boolean;
  hasInteracted: boolean;
  showOnboarding: boolean;
  performanceMode: 'high' | 'medium' | 'low';
  accessibilityMode: boolean;
}

interface UXAction {
  type: 'SET_ONLINE' | 'SET_INTERACTED' | 'SET_ONBOARDING' | 'SET_PERFORMANCE' | 'SET_ACCESSIBILITY';
  payload: any;
}

// UX State Reducer
function uxReducer(state: UXState, action: UXAction): UXState {
  switch (action.type) {
    case 'SET_ONLINE':
      return { ...state, isOnline: action.payload };
    case 'SET_INTERACTED':
      return { ...state, hasInteracted: action.payload };
    case 'SET_ONBOARDING':
      return { ...state, showOnboarding: action.payload };
    case 'SET_PERFORMANCE':
      return { ...state, performanceMode: action.payload };
    case 'SET_ACCESSIBILITY':
      return { ...state, accessibilityMode: action.payload };
    default:
      return state;
  }
}

// Enhanced Loading Component
export function EnhancedLoading({ 
  isLoading, 
  message = 'Loading...', 
  progress 
}: { 
  isLoading: boolean; 
  message?: string; 
  progress?: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  if (!isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <div className="text-center space-y-4 p-8 rounded-lg bg-card border shadow-lg">
        <div className="relative w-16 h-16 mx-auto">
          {!shouldReduceMotion ? (
            <motion.div
              className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          ) : (
            <div className="w-full h-full border-4 border-primary/20 border-t-primary rounded-full animate-pulse" />
          )}
        </div>
        
        <p className="text-sm text-muted-foreground">{message}</p>
        
        {progress !== undefined && (
          <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Connection Status Indicator
export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addToast('Connection restored', 'success');
    };

    const handleOffline = () => {
      setIsOnline(false);
      addToast('Connection lost. Some features may be unavailable.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addToast]);

  if (isOnline) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white text-center py-2 text-sm"
    >
      <div className="flex items-center justify-center gap-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        You are currently offline. Some features may not work.
      </div>
    </motion.div>
  );
}

// Accessibility Announcer
export function AccessibilityAnnouncer({ 
  message, 
  priority = 'polite' 
}: { 
  message: string; 
  priority?: 'polite' | 'assertive';
}) {
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

// Skip to Content Link
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md"
    >
      Skip to main content
    </a>
  );
}

// Focus Trap for Modals
export function FocusTrap({ 
  children, 
  isActive 
}: { 
  children: React.ReactNode; 
  isActive: boolean;
}) {
  const trapRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const trap = trapRef.current;
    if (!trap) return;

    const focusableElements = trap.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isActive]);

  return (
    <div ref={trapRef} className="contents">
      {children}
    </div>
  );
}

// Performance Mode Selector
export function PerformanceModeSelector() {
  const [performanceMode, setPerformanceMode] = useState<'high' | 'medium' | 'low'>('high');
  const { addToast } = useToast();

  const handleModeChange = (mode: 'high' | 'medium' | 'low') => {
    setPerformanceMode(mode);
    
    // Apply performance mode classes
    document.body.classList.remove('performance-high', 'performance-medium', 'performance-low');
    document.body.classList.add(`performance-${mode}`);
    
    const messages = {
      high: 'High performance mode enabled - Full animations and effects',
      medium: 'Medium performance mode enabled - Reduced animations',
      low: 'Low performance mode enabled - Minimal animations for better performance'
    };
    
    addToast(messages[mode], 'info');
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Performance Mode</label>
      <div className="flex gap-2">
        {(['high', 'medium', 'low'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => handleModeChange(mode)}
            className={cn(
              'px-3 py-1 text-xs rounded-md border transition-colors',
              performanceMode === mode
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-border hover:bg-muted'
            )}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

// Gesture Handler for Mobile
export function MobileGestureHandler({ 
  children, 
  onSwipeLeft, 
  onSwipeRight 
}: {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const { isMobile } = useResponsive();

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    }
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    }
  };

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="touch-pan-y"
    >
      {children}
    </div>
  );
}

// Main UX Enhancement Provider
export function UXEnhancementProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(uxReducer, {
    isOnline: true,
    hasInteracted: false,
    showOnboarding: false,
    performanceMode: 'high',
    accessibilityMode: false,
  });

  const { isMobile } = useResponsive();
  const shouldReduceMotion = useReducedMotion();

  // Detect user preferences
  useEffect(() => {
    // Check for reduced motion preference
    if (shouldReduceMotion) {
      dispatch({ type: 'SET_PERFORMANCE', payload: 'low' });
    }

    // Check for high contrast preference
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    if (prefersHighContrast) {
      dispatch({ type: 'SET_ACCESSIBILITY', payload: true });
      document.body.classList.add('high-contrast');
    }

    // Auto-detect performance mode based on device
    if (isMobile) {
      const connection = (navigator as any).connection;
      if (connection && connection.effectiveType === '2g') {
        dispatch({ type: 'SET_PERFORMANCE', payload: 'low' });
      }
    }
  }, [shouldReduceMotion, isMobile]);

  // Apply performance mode classes
  useEffect(() => {
    document.body.classList.remove('performance-high', 'performance-medium', 'performance-low');
    document.body.classList.add(`performance-${state.performanceMode}`);
  }, [state.performanceMode]);

  return (
    <div className="ux-enhancement-provider">
      <SkipToContent />
      <ConnectionStatus />
      
      {children}
      
      {/* Global UX enhancements */}
      <div id="ux-announcements" aria-live="polite" aria-atomic="true" className="sr-only" />
    </div>
  );
}

// Smooth Scroll Behavior
export function useSmoothScroll() {
  const scrollToElement = useCallback((elementId: string, offset: number = 0) => {
    const element = document.getElementById(elementId);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  return { scrollToElement, scrollToTop };
}

// Intersection Observer Hook for Animations
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, options]);

  return isIntersecting;
}