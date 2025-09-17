'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  MoreHorizontal,
  Trash2,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Clock,
  Hash,
  Keyboard,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
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
import { useKeyboardShortcuts, KEYBOARD_SHORTCUTS } from '@/hooks/use-keyboard-shortcuts';

interface ChatSession {
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    messages: number;
  };
  // Add preview snippet from the latest message
  latestMessage?: {
    content: string;
    role: 'USER' | 'ASSISTANT';
    createdAt: Date;
  };
}

interface ImprovedChatSidebarProps {
  selectedSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ImprovedChatSidebar({
  selectedSessionId,
  onSessionSelect,
  onNewChat,
  className,
  isCollapsed = false,
  onToggleCollapse,
}: ImprovedChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const { handleAPIError } = useAPIErrorHandler();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

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

  // Fetch sessions with search and preview data
  const {
    data: sessionsData,
    isLoading,
    refetch,
  } = api.chat.getSessions.useQuery({
    limit: 50,
    search: debouncedSearchQuery || undefined,
    includeLatestMessage: true, // Include latest message for preview
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

  // Keyboard shortcuts
  const shortcuts = useMemo(() => [
    {
      ...KEYBOARD_SHORTCUTS.NEW_CHAT,
      callback: () => createSessionMutation.mutate({}),
    },
    {
      ...KEYBOARD_SHORTCUTS.SEARCH,
      callback: () => searchInputRef.current?.focus(),
    },
    {
      ...KEYBOARD_SHORTCUTS.TOGGLE_SIDEBAR,
      callback: () => onToggleCollapse?.(),
    },
    {
      ...KEYBOARD_SHORTCUTS.ESCAPE,
      callback: () => {
        if (editingSessionId) {
          handleEditCancel();
        } else if (searchQuery) {
          setSearchQuery('');
        }
      },
    },
    {
      ...KEYBOARD_SHORTCUTS.NEXT_CHAT,
      callback: () => navigateToNextChat(1),
    },
    {
      ...KEYBOARD_SHORTCUTS.PREV_CHAT,
      callback: () => navigateToNextChat(-1),
    },
  ], [createSessionMutation, onToggleCollapse, editingSessionId, searchQuery]);

  useKeyboardShortcuts(shortcuts);

  // Navigate between chats with keyboard
  const navigateToNextChat = useCallback((direction: 1 | -1) => {
    if (sessions.length === 0) return;
    
    const currentIndex = selectedSessionId 
      ? sessions.findIndex(s => s.id === selectedSessionId)
      : -1;
    
    let nextIndex;
    if (currentIndex === -1) {
      nextIndex = direction === 1 ? 0 : sessions.length - 1;
    } else {
      nextIndex = (currentIndex + direction + sessions.length) % sessions.length;
    }
    
    onSessionSelect(sessions[nextIndex]!.id);
  }, [sessions, selectedSessionId, onSessionSelect]);

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

  const handleDelete = useCallback((sessionId: string) => {
    if (confirm('Are you sure you want to delete this chat session?')) {
      deleteSessionMutation.mutate({ sessionId });
    }
  }, [deleteSessionMutation]);

  const getSessionPreview = useCallback((session: ChatSession) => {
    if (!session.latestMessage) {
      return 'No messages yet';
    }

    const content = session.latestMessage.content;
    const preview = content.length > 60 ? content.substring(0, 60) + '...' : content;
    const isUser = session.latestMessage.role === 'USER';
    
    return {
      text: preview,
      isUser,
      timestamp: session.latestMessage.createdAt,
    };
  }, []);

  // Animation variants
  const sidebarVariants = {
    expanded: { width: 320 },
    collapsed: { width: 64 },
  };

  const contentVariants = {
    expanded: { opacity: 1, x: 0 },
    collapsed: { opacity: 0, x: -20 },
  };

  return (
    <motion.div
      className={cn(
        'flex flex-col h-full bg-background/95 backdrop-blur-sm border-r border-border/50 relative',
        className
      )}
      variants={sidebarVariants}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Collapse Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleCollapse}
        className="absolute -right-3 top-4 z-10 h-6 w-6 rounded-full border bg-background shadow-md hover:shadow-lg transition-shadow"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      <AnimatePresence mode="wait">
        {isCollapsed ? (
          <CollapsedSidebar
            key="collapsed"
            onNewChat={() => createSessionMutation.mutate({})}
            sessions={sessions}
            selectedSessionId={selectedSessionId}
            onSessionSelect={onSessionSelect}
            isCreating={createSessionMutation.isPending}
          />
        ) : (
          <motion.div
            key="expanded"
            variants={contentVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            transition={{ duration: 0.2 }}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <div className="p-4 border-b border-border/50 bg-gradient-to-r from-background/80 to-background/60 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Conversations</h2>
                <div className="flex items-center gap-1">
                  <Popover open={showKeyboardShortcuts} onOpenChange={setShowKeyboardShortcuts}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Keyboard shortcuts"
                      >
                        <Keyboard className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                      <KeyboardShortcutsHelp />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Button
                onClick={() => createSessionMutation.mutate({})}
                disabled={createSessionMutation.isPending}
                className="w-full justify-start gap-3 mb-4 h-11 touch-manipulation disabled:opacity-50 font-medium"
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

              {/* Enhanced Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search conversations... (Press / to focus)"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 text-base bg-background/50 border-border/50 rounded-xl backdrop-blur-sm placeholder:text-muted-foreground/60 focus:border-primary/40 transition-all duration-200"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
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
                (debouncedSearchQuery ? (
                  <EmptySearchFallback searchQuery={debouncedSearchQuery} className="p-4" />
                ) : (
                  <EmptySessionsFallback 
                    onAction={() => createSessionMutation.mutate({})} 
                    className="p-4" 
                  />
                ))}

              {!isLoading && !sessionsData?.error && sessions.length > 0 && (
                <div className="p-3 space-y-2 pb-safe">
                  <AnimatePresence>
                    {sessions.map((session, index) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <EnhancedSessionItem
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
                          preview={getSessionPreview(session)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Collapsed sidebar component
interface CollapsedSidebarProps {
  onNewChat: () => void;
  sessions: ChatSession[];
  selectedSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
  isCreating: boolean;
}

function CollapsedSidebar({
  onNewChat,
  sessions,
  selectedSessionId,
  onSessionSelect,
  isCreating,
}: CollapsedSidebarProps) {
  return (
    <div className="flex flex-col h-full p-2">
      {/* New Chat Button */}
      <Button
        onClick={onNewChat}
        disabled={isCreating}
        size="icon"
        className="mb-4 h-12 w-12 rounded-xl"
        title="New Chat (Ctrl+N)"
      >
        {isCreating ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <Plus className="h-5 w-5" />
        )}
      </Button>

      {/* Session Icons */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {sessions.slice(0, 10).map((session) => (
          <Button
            key={session.id}
            variant={selectedSessionId === session.id ? "default" : "ghost"}
            size="icon"
            onClick={() => onSessionSelect(session.id)}
            className="h-12 w-12 rounded-xl relative group"
            title={session.title || 'Untitled Chat'}
          >
            <MessageSquare className="h-5 w-5" />
            {session._count.messages > 0 && (
              <Badge
                variant="secondary"
                className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs rounded-full"
              >
                {session._count.messages > 99 ? '99+' : session._count.messages}
              </Badge>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}

// Enhanced session item with preview
interface EnhancedSessionItemProps {
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
  preview: {
    text: string;
    isUser: boolean;
    timestamp: Date;
  } | string;
}

function EnhancedSessionItem({
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
  preview,
}: EnhancedSessionItemProps) {
  const [showActions, setShowActions] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onEditSave();
    } else if (e.key === 'Escape') {
      onEditCancel();
    }
  };

  const previewData = typeof preview === 'string' ? { text: preview, isUser: false, timestamp: session.updatedAt } : preview;

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-300 group touch-manipulation hover:shadow-md',
        'active:scale-[0.98] sm:active:scale-100',
        'focus-within:ring-2 focus-within:ring-primary/50 focus-within:ring-offset-2',
        isSelected && 'bg-primary/10 border-primary/30 shadow-lg',
        !isSelected && 'hover:bg-accent/50',
        (isUpdating || isDeleting) && 'opacity-50 pointer-events-none'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onTouchStart={() => setShowActions(true)}
      onTouchEnd={() => {
        setTimeout(() => setShowActions(false), 3000);
      }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0" onClick={onSelect}>
            <div className="flex items-center gap-3 mb-2">
              <div className={cn(
                "p-2 rounded-lg transition-colors flex-shrink-0",
                isSelected ? "bg-primary/20" : "bg-muted/50"
              )}>
                <MessageSquare className={cn(
                  "h-4 w-4",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              {isEditing ? (
                <Input
                  value={editTitle}
                  onChange={e => onEditTitleChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={onEditSave}
                  className="h-8 text-sm font-semibold bg-background/50 border-border/50 rounded-lg"
                  autoFocus
                />
              ) : (
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    "text-sm font-semibold truncate mb-1",
                    isSelected ? "text-foreground" : "text-foreground"
                  )}>
                    {session.title || 'Untitled Chat'}
                  </h3>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {(showActions || isSelected) && !isEditing && (
            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 touch-manipulation rounded-lg backdrop-blur-sm hover:bg-accent/80"
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
                size="icon"
                className="h-8 w-8 touch-manipulation rounded-lg backdrop-blur-sm text-destructive hover:text-destructive hover:bg-destructive/10"
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

        {/* Preview and metadata */}
        <div className="space-y-2" onClick={onSelect}>
          {/* Preview text */}
          <p className={cn(
            "text-xs leading-relaxed line-clamp-2",
            isSelected ? "text-foreground/80" : "text-muted-foreground"
          )}>
            {previewData.isUser && (
              <span className="text-primary font-medium">You: </span>
            )}
            {previewData.text}
          </p>

          {/* Metadata */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge 
                variant={isSelected ? "outline" : "secondary"} 
                size="sm"
                className={cn(
                  "text-xs flex items-center gap-1",
                  isSelected && "border-primary/30 text-primary bg-primary/10"
                )}
              >
                <Hash className="h-3 w-3" />
                {session._count.messages}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {formatDistanceToNow(new Date(session.updatedAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Keyboard shortcuts help component
function KeyboardShortcutsHelp() {
  const shortcuts = [
    { key: 'Ctrl + N', description: 'Create new chat' },
    { key: '/', description: 'Focus search' },
    { key: 'Ctrl + B', description: 'Toggle sidebar' },
    { key: 'Ctrl + ↑/↓', description: 'Navigate chats' },
    { key: 'Esc', description: 'Cancel/Close' },
  ];

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm">Keyboard Shortcuts</h3>
      <div className="space-y-2">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{shortcut.description}</span>
            <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">
              {shortcut.key}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  );
}