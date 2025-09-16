'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Plus,
  Search,
  Archive,
  ArchiveRestore,
  Filter,
  Download,
  CheckSquare,
  Square,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';
import { useDebounce } from '@/hooks/use-debounce';
import {
  useAPIErrorHandler,
  InlineErrorDisplay,
} from '@/components/providers/error-provider';
import {
  SmartFallback,
  EmptySessionsFallback,
  EmptySearchFallback,
} from '@/components/error';
import { EnhancedSessionItem } from './enhanced-session-item';
import { BulkActionsToolbar } from './bulk-actions-toolbar';

interface ChatSession {
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  isArchived?: boolean;
  archivedAt?: Date | null;
  _count: {
    messages: number;
  };
}

interface EnhancedChatSidebarProps {
  selectedSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
  className?: string;
}

export function EnhancedChatSidebar({
  selectedSessionId,
  onSessionSelect,
  onNewChat,
  className,
}: EnhancedChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const { handleAPIError } = useAPIErrorHandler();

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

  // Fetch sessions with search and archive filter
  const {
    data: sessionsData,
    isLoading,
    refetch,
  } = api.chat.getSessions.useQuery({
    limit: 50,
    search: debouncedSearchQuery || undefined,
    includeArchived: showArchived,
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
      setSelectedSessions(new Set());
    },
    onError: error => {
      handleAPIError(error, 'Delete Session');
    },
  });

  const bulkDeleteMutation = api.chat.bulkDeleteSessions.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedSessions(new Set());
      setSelectionMode(false);
    },
    onError: error => {
      handleAPIError(error, 'Bulk Delete');
    },
  });

  const archiveSessionMutation = api.chat.archiveSession.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: error => {
      handleAPIError(error, 'Archive Session');
    },
  });

  const unarchiveSessionMutation = api.chat.unarchiveSession.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: error => {
      handleAPIError(error, 'Unarchive Session');
    },
  });

  const bulkArchiveMutation = api.chat.bulkArchiveSessions.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedSessions(new Set());
      setSelectionMode(false);
    },
    onError: error => {
      handleAPIError(error, 'Bulk Archive');
    },
  });

  const bulkUnarchiveMutation = api.chat.bulkUnarchiveSessions.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedSessions(new Set());
      setSelectionMode(false);
    },
    onError: error => {
      handleAPIError(error, 'Bulk Unarchive');
    },
  });

  const exportSessionMutation = api.chat.exportSession.useMutation({
    onError: error => {
      handleAPIError(error, 'Export Session');
    },
  });

  const exportSessionsMutation = api.chat.exportSessions.useMutation({
    onError: error => {
      handleAPIError(error, 'Export Sessions');
    },
  });

  const sessions = sessionsData?.items || [];

  // Selection handlers
  const handleToggleSelection = useCallback((sessionId: string, selected: boolean) => {
    setSelectedSessions(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(sessionId);
      } else {
        newSet.delete(sessionId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    const allSessionIds = sessions.map(s => s.id);
    setSelectedSessions(new Set(allSessionIds));
  }, [sessions]);

  const handleClearSelection = useCallback(() => {
    setSelectedSessions(new Set());
    setSelectionMode(false);
  }, []);

  const handleToggleSelectionMode = useCallback(() => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedSessions(new Set());
    }
  }, [selectionMode]);

  // Edit handlers
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

  // Action handlers
  const handleDelete = useCallback((sessionId: string) => {
    deleteSessionMutation.mutate({ sessionId });
  }, [deleteSessionMutation]);

  const handleArchive = useCallback((sessionId: string) => {
    archiveSessionMutation.mutate({ sessionId });
  }, [archiveSessionMutation]);

  const handleUnarchive = useCallback((sessionId: string) => {
    unarchiveSessionMutation.mutate({ sessionId });
  }, [unarchiveSessionMutation]);

  const handleExport = useCallback(async (sessionId: string) => {
    try {
      const data = await exportSessionMutation.mutateAsync({ sessionId });
      
      // Create and download file
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-${data.session.title || 'untitled'}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      // Error handled by mutation
    }
  }, [exportSessionMutation]);

  // Bulk action handlers
  const handleBulkDelete = useCallback(() => {
    const sessionIds = Array.from(selectedSessions);
    bulkDeleteMutation.mutate({ sessionIds });
  }, [selectedSessions, bulkDeleteMutation]);

  const handleBulkArchive = useCallback(() => {
    const sessionIds = Array.from(selectedSessions);
    bulkArchiveMutation.mutate({ sessionIds });
  }, [selectedSessions, bulkArchiveMutation]);

  const handleBulkUnarchive = useCallback(() => {
    const sessionIds = Array.from(selectedSessions);
    bulkUnarchiveMutation.mutate({ sessionIds });
  }, [selectedSessions, bulkUnarchiveMutation]);

  const handleBulkExport = useCallback(async () => {
    try {
      const sessionIds = Array.from(selectedSessions);
      const data = await exportSessionsMutation.mutateAsync({ 
        sessionIds,
        includeArchived: showArchived 
      });
      
      // Create and download file
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chats-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      // Error handled by mutation
    }
  }, [selectedSessions, showArchived, exportSessionsMutation]);

  const isAnyLoading = 
    createSessionMutation.isPending ||
    updateSessionMutation.isPending ||
    deleteSessionMutation.isPending ||
    bulkDeleteMutation.isPending ||
    archiveSessionMutation.isPending ||
    unarchiveSessionMutation.isPending ||
    bulkArchiveMutation.isPending ||
    bulkUnarchiveMutation.isPending ||
    exportSessionMutation.isPending ||
    exportSessionsMutation.isPending;

  const archivedCount = sessions.filter(s => s.isArchived).length;
  const activeCount = sessions.filter(s => !s.isArchived).length;

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedCount={selectedSessions.size}
        onClearSelection={handleClearSelection}
        onBulkDelete={handleBulkDelete}
        onBulkArchive={handleBulkArchive}
        onBulkUnarchive={handleBulkUnarchive}
        onBulkExport={handleBulkExport}
        isLoading={isAnyLoading}
        showArchiveActions={!showArchived}
      />

      {/* Header */}
      <div className="p-3 sm:p-4 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Button
            onClick={() => createSessionMutation.mutate({})}
            disabled={createSessionMutation.isPending}
            className="flex-1 justify-start gap-2 h-11 sm:h-10 touch-manipulation disabled:opacity-50"
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

          <Button
            variant="outline"
            size="icon"
            onClick={handleToggleSelectionMode}
            className="h-11 sm:h-10 w-11 sm:w-10 touch-manipulation"
            title={selectionMode ? 'Exit selection mode' : 'Enter selection mode'}
          >
            {selectionMode ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
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

        {/* Filters */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={showArchived ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
              className="h-8 px-3"
            >
              {showArchived ? (
                <>
                  <ArchiveRestore className="h-4 w-4 mr-1" />
                  Archived ({archivedCount})
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4 mr-1" />
                  Active ({activeCount})
                </>
              )}
            </Button>
          </div>

          {selectionMode && sessions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="h-8 px-3"
            >
              Select All
            </Button>
          )}
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
          (debouncedSearchQuery ? (
            <EmptySearchFallback searchQuery={debouncedSearchQuery} className="p-4" />
          ) : (
            <EmptySessionsFallback 
              onAction={() => createSessionMutation.mutate({})} 
              className="p-4" 
            />
          ))}

        {!isLoading && !sessionsData?.error && sessions.length > 0 && (
          <div className="p-2 space-y-1 pb-safe">
            {sessions.map(session => (
              <EnhancedSessionItem
                key={session.id}
                session={session}
                isSelected={selectedSessionId === session.id}
                isEditing={editingSessionId === session.id}
                editTitle={editTitle}
                onSelect={() => onSessionSelect(session.id)}
                onToggleSelection={(selected) => handleToggleSelection(session.id, selected)}
                onEditStart={() => handleEditStart(session)}
                onEditSave={handleEditSave}
                onEditCancel={handleEditCancel}
                onEditTitleChange={setEditTitle}
                onDelete={() => handleDelete(session.id)}
                onArchive={() => handleArchive(session.id)}
                onUnarchive={() => handleUnarchive(session.id)}
                onExport={() => handleExport(session.id)}
                isUpdating={updateSessionMutation.isPending}
                isDeleting={deleteSessionMutation.isPending}
                isArchiving={archiveSessionMutation.isPending}
                showSelection={selectionMode}
                showArchiveActions={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}