'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  MoreHorizontal,
  Trash2,
  Edit3,
  Archive,
  ArchiveRestore,
  Download,
  Clock,
  Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  showSelection: boolean;
  showArchiveActions: boolean;
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
  showSelection,
  showArchiveActions,
}: EnhancedSessionItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [isSelectionChecked, setIsSelectionChecked] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onEditSave();
    } else if (e.key === 'Escape') {
      onEditCancel();
    }
  };

  const handleSelectionChange = (checked: boolean) => {
    setIsSelectionChecked(checked);
    onToggleSelection(checked);
  };

  const isLoading = isUpdating || isDeleting || isArchiving;

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-300 group touch-manipulation hover:shadow-md',
        'active:scale-[0.98] sm:active:scale-100',
        'focus-within:ring-2 focus-within:ring-primary/50 focus-within:ring-offset-2',
        isSelected && 'bg-primary/10 border-primary/30 shadow-lg',
        !isSelected && 'hover:bg-accent/50',
        isLoading && 'opacity-50 pointer-events-none',
        session.isArchived && 'opacity-75'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onTouchStart={() => setShowActions(true)}
      onTouchEnd={() => {
        setTimeout(() => setShowActions(false), 3000);
      }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Selection checkbox */}
          {showSelection && (
            <div className="flex-shrink-0 pt-1">
              <Checkbox
                checked={isSelectionChecked}
                onCheckedChange={handleSelectionChange}
                className="h-4 w-4"
              />
            </div>
          )}

          {/* Session icon */}
          <div className={cn(
            "p-2 rounded-lg transition-colors flex-shrink-0",
            isSelected ? "bg-primary/20" : "bg-muted/50"
          )}>
            <MessageSquare className={cn(
              "h-4 w-4",
              isSelected ? "text-primary" : "text-muted-foreground"
            )} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0" onClick={onSelect}>
            {/* Title */}
            <div className="mb-2">
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
                <h3 className={cn(
                  "text-sm font-semibold truncate",
                  isSelected ? "text-foreground" : "text-foreground"
                )}>
                  {session.title || 'Untitled Chat'}
                  {session.isArchived && (
                    <Badge variant="outline" size="sm" className="ml-2">
                      Archived
                    </Badge>
                  )}
                </h3>
              )}
            </div>

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

          {/* Actions */}
          {(showActions || isSelected) && !isEditing && !showSelection && (
            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 touch-manipulation rounded-lg backdrop-blur-sm hover:bg-accent/80"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={onEditStart}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Title
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Chat
                  </DropdownMenuItem>
                  {showArchiveActions && (
                    <>
                      <DropdownMenuSeparator />
                      {session.isArchived ? (
                        <DropdownMenuItem onClick={onUnarchive}>
                          <ArchiveRestore className="h-4 w-4 mr-2" />
                          Unarchive
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={onArchive}>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={onDelete}
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
      </div>
    </Card>
  );
}