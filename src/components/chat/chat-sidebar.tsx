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
import { Badge } from '@/components/ui/badge';
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
    <div className={cn('flex flex-col h-full glass border-r border-white/10', className)}>
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent backdrop-blur-xl">
        <Button
          onClick={() => createSessionMutation.mutate({})}
          disabled={createSessionMutation.isPending}
          className="w-full justify-start gap-3 mb-4 h-12 touch-manipulation disabled:opacity-50 font-semibold"
          variant="gradient"
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
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-12 h-12 text-base glass border-white/20 rounded-xl backdrop-blur-sm placeholder:text-muted-foreground/60 focus:border-primary/40 transition-all duration-200"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto overscroll-contain webkit-overflow-scrolling-touch scrollbar-thin scrollbar-thumb-muted">
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
          <div className="p-3 space-y-2 pb-safe">
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
      variant={isSelected ? "elevated" : "glass"}
      padding="default"
      className={cn(
        'cursor-pointer transition-all duration-300 group touch-manipulation hover-lift',
        'active:scale-[0.98] sm:active:scale-100',
        'focus-within:ring-2 focus-within:ring-primary/50 focus-within:ring-offset-2',
        isSelected && 'gradient-primary text-white shadow-large border-primary/30',
        !isSelected && 'hover:bg-white/10 dark:hover:bg-black/10',
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
          <div className="flex items-center gap-3 mb-2">
            <div className={cn(
              "p-2 rounded-lg transition-colors",
              isSelected ? "bg-white/20" : "bg-primary/10"
            )}>
              <MessageSquare className={cn(
                "h-4 w-4 flex-shrink-0",
                isSelected ? "text-white" : "text-primary"
              )} />
            </div>
            {isEditing ? (
              <Input
                value={editTitle}
                onChange={e => onEditTitleChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={onEditSave}
                className="h-8 text-sm font-semibold glass border-white/30 rounded-lg"
                autoFocus
              />
            ) : (
              <h3 className={cn(
                "text-sm font-semibold truncate",
                isSelected ? "text-white" : "text-foreground"
              )}>
                {session.title || 'Untitled Chat'}
              </h3>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={isSelected ? "outline" : "secondary"} 
              size="sm"
              className={cn(
                "text-xs",
                isSelected && "border-white/30 text-white/80 bg-white/10"
              )}
            >
              {session._count.messages} messages
            </Badge>
            <span className={cn(
              "text-xs",
              isSelected ? "text-white/70" : "text-muted-foreground"
            )}>
              {formatDistanceToNow(new Date(session.updatedAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>

        {/* Actions */}
        {(showActions || isSelected) && !isEditing && (
          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200">
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn(
                "h-8 w-8 touch-manipulation rounded-lg backdrop-blur-sm",
                isSelected 
                  ? "hover:bg-white/20 text-white/80 hover:text-white" 
                  : "hover:bg-accent/80"
              )}
              onClick={e => {
                e.stopPropagation();
                onEditStart();
              }}
              title="Edit session title"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn(
                "h-8 w-8 touch-manipulation rounded-lg backdrop-blur-sm",
                isSelected
                  ? "text-red-300 hover:text-red-200 hover:bg-red-500/20"
                  : "text-destructive hover:text-destructive hover:bg-destructive/10"
              )}
              onClick={e => {
                e.stopPropagation();
                onDelete();
              }}
              title="Delete session"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
