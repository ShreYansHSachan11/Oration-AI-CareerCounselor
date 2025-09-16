import { lazy } from 'react';
import React from 'react';

// Lazy load heavy components for better initial bundle size
export const LazyOptimizedMessageList = lazy(() =>
  import('@/components/chat/optimized-message-list').then(module => ({
    default: module.OptimizedMessageList,
  }))
);

export const LazyChatSidebar = lazy(() =>
  import('@/components/chat/chat-sidebar').then(module => ({
    default: module.ChatSidebar,
  }))
);

export const LazySessionSearch = lazy(() =>
  import('@/components/chat/session-search').then(module => ({
    default: module.SessionSearch,
  }))
);

export const LazyUserProfile = lazy(() =>
  import('@/components/auth/user-profile').then(module => ({
    default: module.UserProfile,
  }))
);

// Loading fallback components
export const MessageListFallback: React.FC = () => {
  return (
    <div className="flex-1 animate-pulse">
      <div className="p-4 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 bg-muted rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SidebarFallback: React.FC = () => {
  return (
    <div className="w-80 border-r bg-background animate-pulse">
      <div className="p-4 space-y-4">
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded" />
          ))}
        </div>
      </div>
    </div>
  );
};

export const ProfileFallback: React.FC = () => {
  return (
    <div className="p-6 animate-pulse">
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-16 h-16 bg-muted rounded-full" />
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-32" />
          <div className="h-3 bg-muted rounded w-24" />
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
      </div>
    </div>
  );
};
