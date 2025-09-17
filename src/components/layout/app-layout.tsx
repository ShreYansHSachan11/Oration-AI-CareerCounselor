'use client';

import React from 'react';
import { MobileNavigation } from './mobile-navigation';
import { MobileGestureHandler } from '@/components/ui/mobile-gesture-handler';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  className?: string;
  onSwipeRight?: () => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export function AppLayout({
  children,
  sidebar,
  className,
  onSwipeRight,
  sidebarCollapsed = false,
  onToggleSidebar,
}: AppLayoutProps) {
  return (
    <div className={cn('h-screen overflow-hidden relative', className)}>
      {/* Monochromatic gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-black dark:via-gray-900 dark:to-gray-800" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.05),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_50%)]" />
      <div className="absolute inset-0 animated-gradient opacity-5" />
      
      <MobileGestureHandler onSwipeRight={onSwipeRight} className="h-full relative z-10">
        <MobileNavigation 
          sidebarContent={sidebar}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={onToggleSidebar}
        >
          {children}
        </MobileNavigation>
      </MobileGestureHandler>
    </div>
  );
}
