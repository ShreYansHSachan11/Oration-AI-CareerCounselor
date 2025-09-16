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
}

export function AppLayout({
  children,
  sidebar,
  className,
  onSwipeRight,
}: AppLayoutProps) {
  return (
    <div className={cn('h-screen overflow-hidden relative', className)}>
      {/* Modern gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(102,126,234,0.1),transparent_50%)]" />
      
      <MobileGestureHandler onSwipeRight={onSwipeRight} className="h-full relative z-10">
        <MobileNavigation sidebarContent={sidebar}>{children}</MobileNavigation>
      </MobileGestureHandler>
    </div>
  );
}
