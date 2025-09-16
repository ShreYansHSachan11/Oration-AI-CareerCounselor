'use client';

import React, { useState, useCallback } from 'react';
import {
  MessageSquare,
  Edit3,
  Trash2,
  Archive,
  ArchiveRestore,
  Download,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

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

interface EnhancedSessionItemProps {
  session: ChatSession;
  isSelected: boolean;
  isEditing: boolean;
  editTitle: string;
  onSelect: () => void;
  onToggleSelection: (selected: boolean) => void;
  onEditStart: () => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onEditTitleChange: (title: string) => void;
  onDelete: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onExport: () => void;
  isUpdating: boolean;
  isDeleting: boolean;
  isArchiving: boolean;
  showSelection?: boolean;
  showArchiveActions?: boolean;
}

export function EnhancedSessionItem({
  session,
  isSelected,
  isEditing,
  editTitle,
  onSelect,
  onToggleSelection,
  onEditStart,
  onEditSave,
  onEditCancel,
  onEditTitleChange,
  onDelete,
  onArchive,
  onUnarchive,
  onExport,
  isUpdating,
  isDeleting,
  isArchiving,
  showSelection = false,
  showArchiveActions = true,
}: EnhancedSessionItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

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

  const handleDelete = () => {
    onDelete();
    setDeleteDialogOpen(false);
  };

  const handleArchive = () => {
    onArchive();
    setArchiveDialogOpen(false);
  };

  const isLoading = isUpdating || isDeleting || isArchiving;

  return (
    <>
      <Card
        className={cn(
          'p-3 cursor-pointer transition-all duration-200 hover:bg-accent/50 group touch-manipulation',
          'active:bg-accent/70 active:scale-[0.98] sm:active:bg-accent/50 sm:active:scale-100',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1',
          isSelected && 'bg-accent border-accent-foreground/20 shadow-sm',
          isLoading && 'opacity-50 pointer-events-none',
          session.isArchived && 'opacity-75 border-dashed'
        )}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        onTouchStart={() => setShowActions(true)}
        onTouchEnd={() => {
          setTimeout(() => setShowActions(false), 3000);
        }}
      >
        <div className="flex items-start gap-3">
          {/* Selection Checkbox */}
          {showSelection && (
            <div className="flex items-center pt-1">
              <Checkbox
                checked={isSelected}
                onCheckedChange={onToggleSelection}
                onClick={e => e.stopPropagation()}
                className="touch-manipulation"
              />
            </div>
          )}

          {/* Session Content */}
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
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <h3 className="text-sm font-medium truncate">
                    {session.title || 'Untitled Chat'}
                  </h3>
                  {session.isArchived && (
                    <Badge variant="outline" className="text-xs">
                      Archived
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {session._count.messages} messages •{' '}
              {session.isArchived && session.archivedAt
                ? `Archived ${formatDistanceToNow(new Date(session.archivedAt), {
                    addSuffix: true,
                  })}`
                : formatDistanceToNow(new Date(session.updatedAt), {
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
                disabled={isLoading}
              >
                <Edit3 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 sm:h-7 sm:w-7 touch-manipulation hover:bg-accent/80"
                    onClick={e => e.stopPropagation()}
                    disabled={isLoading}
                  >
                    <MoreHorizontal className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation();
                      onExport();
                    }}
                    disabled={isLoading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Chat
                  </DropdownMenuItem>

                  {showArchiveActions && (
                    <>
                      <DropdownMenuSeparator />
                      {session.isArchived ? (
                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation();
                            onUnarchive();
                          }}
                          disabled={isLoading}
                        >
                          <ArchiveRestore className="h-4 w-4 mr-2" />
                          Unarchive
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation();
                            setArchiveDialogOpen(true);
                          }}
                          disabled={isLoading}
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      )}
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation();
                      setDeleteDialogOpen(true);
                    }}
                    disabled={isLoading}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Chat"
        description={`Are you sure you want to permanently delete "${
          session.title || 'Untitled Chat'
        }"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="destructive"
      />

      {/* Archive Confirmation Dialog */}
      <ConfirmationDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        title="Archive Chat"
        description={`Are you sure you want to archive "${
          session.title || 'Untitled Chat'
        }"? You can restore it later from the archived chats.`}
        confirmText="Archive"
        onConfirm={handleArchive}
        isLoading={isArchiving}
      />
    </>
  );
}