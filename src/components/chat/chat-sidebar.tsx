'use client';

import React, { useState } from 'react';
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

interface ChatSession {
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    messages: number;
  };
}

interface ChatSidebarProps {
  selectedSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
  className?: string;
}

export function ChatSidebar({
  selectedSessionId,
  onSessionSelect,
  onNewChat,
  className,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const { handleAPIError } = useAPIErrorHandler();

  // Create new session mutation
  const createSessionMutation = api.chat.createSession.useMutation({
    onSuccess: (session) => {
      refetch();
      onSessionSelect(session.id);
    },
    onError: (error) => {
      handleAPIError(error, 'Create Session');
    },
  });

  // Fetch sessions with search
  const {
    data: sessionsData,
    isLoading,
    refetch,
  } = api.chat.getSessions.useQuery({
    limit: 50,
    search: searchQuery || undefined,
  });

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

  const sessions = sessionsData?.items || [];

  const handleEditStart = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setEditTitle(session.title || 'Untitled Chat');
  };

  const handleEditSave = () => {
    if (editingSessionId && editTitle.trim()) {
      updateSessionMutation.mutate({
        sessionId: editingSessionId,
        title: editTitle.trim(),
      });
    }
  };

  const handleEditCancel = () => {
    setEditingSessionId(null);
    setEditTitle('');
  };

  const handleDelete = (sessionId: string) => {
    if (confirm('Are you sure you want to delete this chat session?')) {
      deleteSessionMutation.mutate({ sessionId });
    }
  };

  const getSessionTitle = (session: ChatSession) => {
    return session.title || 'Untitled Chat';
  };

  const getSessionPreview = (session: ChatSession) => {
    const messageCount = session._count.messages;
    const timeAgo = formatDistanceToNow(new Date(session.updatedAt), {
      addSuffix: true,
    });
    return `${messageCount} messages • ${timeAgo}`;
  };

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Header */}
      <div className="p-3 sm:p-4 border-b bg-background/95 backdrop-blur">
        <Button
          onClick={() => createSessionMutation.mutate({})}
          disabled={createSessionMutation.isPending}
          className="w-full justify-start gap-2 mb-3 sm:mb-4 h-11 sm:h-10 touch-manipulation disabled:opacity-50"
          variant="default"
        >
          {createSessionMutation.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              New Chat
            </>
          )}
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
      <div className="flex-1 overflow-y-auto overscroll-contain webkit-overflow-scrolling-touch">
        <SmartFallback
          isLoading={isLoading}
          error={sessionsData?.error}
          isEmpty={sessions.length === 0}
          onRetry={() => refetch()}
          onAction={() => createSessionMutation.mutate({})}
        />

        {!isLoading &&
          !sessionsData?.error &&
          sessions.length === 0 &&
          (searchQuery ? (
            <EmptySearchFallback searchQuery={searchQuery} className="p-4" />
          ) : (
            <EmptySessionsFallback 
              onAction={() => createSessionMutation.mutate({})} 
              className="p-4" 
            />
          ))}

        {!isLoading && !sessionsData?.error && sessions.length > 0 && (
          <div className="p-2 space-y-1 pb-safe">
            {sessions.map(session => (
              <SessionItem
                key={session.id}
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
            ))}
          </div>
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onEditSave();
    } else if (e.key === 'Escape') {
      onEditCancel();
    }
  };

  return (
    <Card
      className={cn(
        'p-3 cursor-pointer transition-all duration-200 hover:bg-accent/50 group touch-manipulation',
        'active:bg-accent/70 active:scale-[0.98] sm:active:bg-accent/50 sm:active:scale-100', // Enhanced touch feedback with scale
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1', // Better focus states
        isSelected && 'bg-accent border-accent-foreground/20 shadow-sm',
        (isUpdating || isDeleting) && 'opacity-50 pointer-events-none'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onTouchStart={() => setShowActions(true)} // Show actions on touch
      onTouchEnd={() => {
        // Hide actions after a delay on touch devices
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
              className="h-9 w-9 sm:h-7 sm:w-7 touch-manipulation hover:bg-accent/80" // Larger touch targets on mobile
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
