'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Menu,
  X,
  MessageSquare,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { UserMenu } from '@/components/auth/user-menu';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';

interface MobileNavigationProps {
  children?: React.ReactNode;
  sidebarContent?: React.ReactNode;
  className?: string;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export function MobileNavigation({
  children,
  sidebarContent,
  className,
  title,
  showBackButton = false,
  onBack,
  sidebarCollapsed = false,
  onToggleSidebar,
}: MobileNavigationProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Handle orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      setIsLandscape(
        window.innerHeight < window.innerWidth && window.innerWidth < 1024
      );
    };

    handleOrientationChange();
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Close sidebar when route changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  // Enhanced swipe gesture handling
  const handlePanStart = useCallback(() => {
    setDragOffset(0);
  }, []);

  const handlePan = useCallback((event: any, info: PanInfo) => {
    const { offset } = info;
    
    // Only allow opening gesture from left edge
    if (!isSidebarOpen && offset.x > 0 && offset.x < 200) {
      setDragOffset(offset.x);
    }
    // Allow closing gesture when sidebar is open
    else if (isSidebarOpen && offset.x < 0 && offset.x > -200) {
      setDragOffset(offset.x);
    }
  }, [isSidebarOpen]);

  const handlePanEnd = useCallback((event: any, info: PanInfo) => {
    const { offset, velocity } = info;
    const threshold = 100;
    const velocityThreshold = 500;

    // Determine if we should open/close based on distance and velocity
    if (!isSidebarOpen) {
      if (offset.x > threshold || velocity.x > velocityThreshold) {
        setIsSidebarOpen(true);
      }
    } else {
      if (offset.x < -threshold || velocity.x < -velocityThreshold) {
        setIsSidebarOpen(false);
      }
    }
    
    setDragOffset(0);
  }, [isSidebarOpen]);

  return (
    <div className={cn('flex flex-col h-screen bg-background', className)}>
      {/* Mobile Header */}
      <header
        className={cn(
          'flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 lg:hidden safe-area-inset-top',
          isLandscape ? 'px-2 py-2' : 'px-4 py-3'
        )}
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {showBackButton ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className={cn(
                'flex-shrink-0',
                isLandscape ? 'h-8 w-8' : 'h-9 w-9'
              )}
              aria-label="Go back"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className={cn(
                'flex-shrink-0',
                isLandscape ? 'h-8 w-8' : 'h-9 w-9'
              )}
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          <div className="flex items-center gap-2 min-w-0 flex-1">
            <MessageSquare
              className={cn(
                'text-primary flex-shrink-0',
                isLandscape ? 'h-5 w-5' : 'h-6 w-6'
              )}
            />
            <span
              className={cn(
                'font-semibold truncate',
                isLandscape ? 'text-base' : 'text-lg'
              )}
            >
              {title || 'Career Chat'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className={cn(
          "hidden lg:flex lg:flex-col lg:border-r transition-all duration-300",
          sidebarCollapsed ? "lg:w-16" : "lg:w-80"
        )}>
          {sidebarContent}
        </aside>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeSidebar}
                style={{ touchAction: 'none' }} // Prevent scroll on backdrop
              />

              {/* Sidebar */}
              <motion.aside
                ref={sidebarRef}
                className={cn(
                  'fixed left-0 top-0 h-full bg-background/95 backdrop-blur-xl border-r z-50 lg:hidden safe-area-inset-top shadow-2xl',
                  isLandscape ? 'w-72 max-w-[75vw]' : 'w-80 max-w-[85vw]'
                )}
                initial={{ x: '-100%' }}
                animate={{ 
                  x: dragOffset || 0,
                }}
                exit={{ x: '-100%' }}
                transition={{
                  type: 'spring',
                  damping: 35,
                  stiffness: 400,
                  mass: 0.6,
                }}
                drag="x"
                dragConstraints={{ left: -50, right: 50 }}
                dragElastic={0.2}
                onPanStart={handlePanStart}
                onPan={handlePan}
                onPanEnd={handlePanEnd}
              >
                {/* Mobile Sidebar Header */}
                <div
                  className={cn(
                    'flex items-center justify-between border-b bg-background/95 backdrop-blur',
                    isLandscape ? 'px-3 py-2' : 'px-4 py-3'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MessageSquare
                      className={cn(
                        'text-primary flex-shrink-0',
                        isLandscape ? 'h-5 w-5' : 'h-6 w-6'
                      )}
                    />
                    <span
                      className={cn(
                        'font-semibold truncate',
                        isLandscape ? 'text-base' : 'text-lg'
                      )}
                    >
                      Career Chat
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={closeSidebar}
                    className={cn(
                      'flex-shrink-0',
                      isLandscape ? 'h-8 w-8' : 'h-9 w-9'
                    )}
                    aria-label="Close sidebar"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Sidebar Content */}
                <div className="flex-1 overflow-hidden">{sidebarContent}</div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content with swipe gesture detection */}
        <motion.main 
          className="flex-1 flex flex-col overflow-hidden"
          onPanStart={handlePanStart}
          onPan={handlePan}
          onPanEnd={handlePanEnd}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}

// Hook for managing mobile sidebar state
export function useMobileNavigation() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);
  const openSidebar = () => setIsSidebarOpen(true);

  return {
    isSidebarOpen,
    toggleSidebar,
    closeSidebar,
    openSidebar,
  };
}
