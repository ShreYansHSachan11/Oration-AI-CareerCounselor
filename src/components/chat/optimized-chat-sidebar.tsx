'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  MoreHorizontal,
  Trash2,
  Edit3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { VirtualScroll } from '@/components/ui/virtual-scroll';
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';
import { formatDistanceToNow } from 'date-fns';
import {
  useAPIErrorHandler,
  InlineErrorDisplay,
} from '@/components/providers/error-provider';
import {
  SmartFallback,
  EmptySessionsFallback,
  EmptySearchFallback,
} from '@/components/error';
import { useDebounce } from '@/hooks/use-debounce';

interface ChatSession {
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    messages: number;
  };
}

interface OptimizedChatSidebarProps {
  selectedSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
  className?: string;
  containerHeight?: number;
}

const SESSION_ITEM_HEIGHT = 80; // Height of each session item

export function OptimizedChatSidebar({
  selectedSessionId,
  onSessionSelect,
  onNewChat,
  className,
  containerHeight = 600,
}: OptimizedChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const { handleAPIError } = useAPIErrorHandler();

  // Debounce search query to avoid too many API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Use infinite query for sessions with search
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = api.chat.getSessions.useInfiniteQuery(
    {
      limit: 20,
      search: debouncedSearchQuery || undefined,
    },
    {
      getNextPageParam: lastPage => lastPage.nextCursor,
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    }
  );

  // Flatten all sessions from pages
  const allSessions = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page.items);
  }, [data?.pages]);

  // Mutations
  const updateSessionMutation = api.chat.updateSession.useMutation({
    onSuccess: () => {
      refetch();
      setEditingSessionId(null);
    },
    onError: error => {
      handleAPIError(error, 'Update Session');
    },
  });

  const deleteSessionMutation = api.chat.deleteSession.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: error => {
      handleAPIError(error, 'Delete Session');
    },
  });

  const handleEditStart = useCallback((session: ChatSession) => {
    setEditingSessionId(session.id);
    setEditTitle(session.title || 'Untitled Chat');
  }, []);

  const handleEditSave = useCallback(() => {
    if (editingSessionId && editTitle.trim()) {
      updateSessionMutation.mutate({
        sessionId: editingSessionId,
        title: editTitle.trim(),
      });
    }
  }, [editingSessionId, editTitle, updateSessionMutation]);

  const handleEditCancel = useCallback(() => {
    setEditingSessionId(null);
    setEditTitle('');
  }, []);

  const handleDelete = useCallback(
    (sessionId: string) => {
      if (confirm('Are you sure you want to delete this chat session?')) {
        deleteSessionMutation.mutate({ sessionId });
      }
    },
    [deleteSessionMutation]
  );

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderSessionItem = useCallback(
    (session: ChatSession, index: number) => {
      return (
        <div className="px-2 py-1">
          <SessionItem
            session={session}
            isSelected={selectedSessionId === session.id}
            isEditing={editingSessionId === session.id}
            editTitle={editTitle}
            onSelect={() => onSessionSelect(session.id)}
            onEditStart={() => handleEditStart(session)}
            onEditSave={handleEditSave}
            onEditCancel={handleEditCancel}
            onEditTitleChange={setEditTitle}
            onDelete={() => handleDelete(session.id)}
            isUpdating={updateSessionMutation.isPending}
            isDeleting={deleteSessionMutation.isPending}
          />
        </div>
      );
    },
    [
      selectedSessionId,
      editingSessionId,
      editTitle,
      onSessionSelect,
      handleEditStart,
      handleEditSave,
      handleEditCancel,
      handleDelete,
      updateSessionMutation.isPending,
      deleteSessionMutation.isPending,
    ]
  );

  const getSessionKey = useCallback((session: ChatSession, index: number) => {
    return session.id;
  }, []);

  const loadingComponent = useMemo(
    () => (
      <div className="flex items-center justify-center py-4">
        <Spinner className="h-4 w-4 mr-2" />
        <span className="text-sm text-muted-foreground">
          Loading sessions...
        </span>
      </div>
    ),
    []
  );

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Header */}
      <div className="p-3 sm:p-4 border-b bg-background/95 backdrop-blur">
        <Button
          onClick={onNewChat}
          className="w-full justify-start gap-2 mb-3 sm:mb-4 h-11 sm:h-10 touch-manipulation"
          variant="default"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 h-11 sm:h-10 text-base sm:text-sm touch-manipulation"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 relative">
        {isLoading && allSessions.length === 0 ? (
          <div className="p-4">
            <SmartFallback
              isLoading={true}
              error={null}
              isEmpty={false}
              onRetry={() => refetch()}
              onAction={onNewChat}
            />
          </div>
        ) : isError ? (
          <div className="p-4">
            <SmartFallback
              isLoading={false}
              error={error}
              isEmpty={false}
              onRetry={() => refetch()}
              onAction={onNewChat}
            />
          </div>
        ) : allSessions.length === 0 ? (
          <div className="p-4">
            {debouncedSearchQuery ? (
              <EmptySearchFallback searchQuery={debouncedSearchQuery} />
            ) : (
              <EmptySessionsFallback onAction={onNewChat} />
            )}
          </div>
        ) : (
          <>
            {/* Load more indicator at top */}
            {isFetchingNextPage && (
              <div className="absolute top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm border-b">
                <div className="flex items-center justify-center py-2">
                  <Spinner className="h-4 w-4 mr-2" />
                  <span className="text-sm text-muted-foreground">
                    Loading more sessions...
                  </span>
                </div>
              </div>
            )}

            <VirtualScroll
              items={allSessions}
              itemHeight={SESSION_ITEM_HEIGHT}
              containerHeight={containerHeight - 120} // Subtract header height
              renderItem={renderSessionItem}
              getItemKey={getSessionKey}
              onLoadMore={handleLoadMore}
              hasMore={hasNextPage}
              isLoading={isFetchingNextPage}
              loadingComponent={loadingComponent}
              overscan={2}
              className={cn(
                'overflow-y-auto overscroll-contain webkit-overflow-scrolling-touch',
                isFetchingNextPage && 'pt-12' // Add padding when loading indicator is shown
              )}
            />
          </>
        )}
      </div>
    </div>
  );
}

interface SessionItemProps {
  session: ChatSession;
  isSelected: boolean;
  isEditing: boolean;
  editTitle: string;
  onSelect: () => void;
  onEditStart: () => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onEditTitleChange: (title: string) => void;
  onDelete: () => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

function SessionItem({
  session,
  isSelected,
  isEditing,
  editTitle,
  onSelect,
  onEditStart,
  onEditSave,
  onEditCancel,
  onEditTitleChange,
  onDelete,
  isUpdating,
  isDeleting,
}: SessionItemProps) {
  const [showActions, setShowActions] = useState(false);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        onEditSave();
      } else if (e.key === 'Escape') {
        onEditCancel();
      }
    },
    [onEditSave, onEditCancel]
  );

  return (
    <Card
      className={cn(
        'p-3 cursor-pointer transition-all duration-200 hover:bg-accent/50 group touch-manipulation',
        'active:bg-accent/70 active:scale-[0.98] sm:active:bg-accent/50 sm:active:scale-100',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1',
        isSelected && 'bg-accent border-accent-foreground/20 shadow-sm',
        (isUpdating || isDeleting) && 'opacity-50 pointer-events-none'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onTouchStart={() => setShowActions(true)}
      onTouchEnd={() => {
        setTimeout(() => setShowActions(false), 3000);
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0" onClick={onSelect}>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            {isEditing ? (
              <Input
                value={editTitle}
                onChange={e => onEditTitleChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={onEditSave}
                className="h-7 sm:h-6 text-sm font-medium"
                autoFocus
              />
            ) : (
              <h3 className="text-sm font-medium truncate">
                {session.title || 'Untitled Chat'}
              </h3>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {session._count.messages} messages •{' '}
            {formatDistanceToNow(new Date(session.updatedAt), {
              addSuffix: true,
            })}
          </p>
        </div>

        {/* Actions */}
        {(showActions || isSelected) && !isEditing && (
          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 sm:h-7 sm:w-7 touch-manipulation hover:bg-accent/80"
              onClick={e => {
                e.stopPropagation();
                onEditStart();
              }}
              title="Edit session title"
            >
              <Edit3 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 sm:h-7 sm:w-7 text-destructive hover:text-destructive hover:bg-destructive/10 touch-manipulation"
              onClick={e => {
                e.stopPropagation();
                onDelete();
              }}
              title="Delete session"
            >
              <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
