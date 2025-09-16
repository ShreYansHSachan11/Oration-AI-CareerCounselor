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
    <div className={cn('h-screen overflow-hidden', className)}>
      <MobileGestureHandler onSwipeRight={onSwipeRight} className="h-full">
        <MobileNavigation sidebarContent={sidebar}>{children}</MobileNavigation>
      </MobileGestureHandler>
    </div>
  );
}
