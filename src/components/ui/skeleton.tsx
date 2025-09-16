'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export function Skeleton({ className, children, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-skeleton rounded-md bg-muted', className)}
      {...props}
    >
      {children}
    </div>
  );
}

// Specific skeleton components for different UI elements
export function MessageSkeleton({ isUser = false }: { isUser?: boolean }) {
  return (
    <div
      className={cn(
        'flex gap-3 animate-fade-in',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0">
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      )}

      <div className={cn('flex flex-col max-w-[80%]', isUser && 'items-end')}>
        <div className={cn('p-4 rounded-lg', isUser ? 'ml-12' : 'mr-12')}>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-3 w-16 mt-1" />
      </div>

      {isUser && (
        <div className="flex-shrink-0">
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      )}
    </div>
  );
}

export function ChatSidebarSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-10 w-full" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChatInputSkeleton() {
  return (
    <div className="p-4 border-t">
      <div className="flex items-end gap-2 p-3 border rounded-lg">
        <Skeleton className="flex-1 h-5" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </div>
  );
}

export function ChatContainerSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden p-4 space-y-4">
        <MessageSkeleton />
        <MessageSkeleton isUser />
        <MessageSkeleton />
        <MessageSkeleton isUser />
      </div>
      <ChatInputSkeleton />
    </div>
  );
}
