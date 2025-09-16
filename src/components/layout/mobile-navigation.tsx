'use client';

import React, { useState, useEffect } from 'react';
import {
  Menu,
  X,
  MessageSquare,
  User,
  Settings,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { UserMenu } from '@/components/auth/user-menu';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';

interface MobileNavigationProps {
  children?: React.ReactNode;
  sidebarContent?: React.ReactNode;
  className?: string;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export function MobileNavigation({
  children,
  sidebarContent,
  className,
  title,
  showBackButton = false,
  onBack,
}: MobileNavigationProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

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
        <aside className="hidden lg:flex lg:w-80 lg:flex-col lg:border-r">
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
                className={cn(
                  'fixed left-0 top-0 h-full bg-background border-r z-50 lg:hidden safe-area-inset-top',
                  isLandscape ? 'w-72 max-w-[75vw]' : 'w-80 max-w-[85vw]'
                )}
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{
                  type: 'spring',
                  damping: 30,
                  stiffness: 300,
                  mass: 0.8,
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -100) {
                    closeSidebar();
                  }
                }}
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

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
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
