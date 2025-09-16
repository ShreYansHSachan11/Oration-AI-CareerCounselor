'use client';

import React, { useState } from 'react';
import {
  Trash2,
  Archive,
  ArchiveRestore,
  Download,
  X,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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

interface BulkActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onBulkArchive: () => void;
  onBulkUnarchive: () => void;
  onBulkExport: () => void;
  isLoading?: boolean;
  showArchiveActions?: boolean;
  className?: string;
}

export function BulkActionsToolbar({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkArchive,
  onBulkUnarchive,
  onBulkExport,
  isLoading = false,
  showArchiveActions = true,
  className,
}: BulkActionsToolbarProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

  if (selectedCount === 0) {
    return null;
  }

  const handleDelete = () => {
    onBulkDelete();
    setDeleteDialogOpen(false);
  };

  const handleArchive = () => {
    onBulkArchive();
    setArchiveDialogOpen(false);
  };

  return (
    <>
      <div
        className={cn(
          'flex items-center justify-between p-3 bg-accent/50 border-b backdrop-blur-sm',
          'animate-in slide-in-from-top-2 duration-200',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="font-medium">
            {selectedCount} selected
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-8 px-2"
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Actions */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onBulkExport}
            disabled={isLoading}
            className="h-8 px-3"
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>

          {showArchiveActions && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setArchiveDialogOpen(true)}
              disabled={isLoading}
              className="h-8 px-3"
            >
              <Archive className="h-4 w-4 mr-1" />
              Archive
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isLoading}
            className="h-8 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>

          {/* More Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isLoading}
                className="h-8 w-8 p-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onBulkExport} disabled={isLoading}>
                <Download className="h-4 w-4 mr-2" />
                Export Selected
              </DropdownMenuItem>
              
              {showArchiveActions && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setArchiveDialogOpen(true)}
                    disabled={isLoading}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archive Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onBulkUnarchive} disabled={isLoading}>
                    <ArchiveRestore className="h-4 w-4 mr-2" />
                    Unarchive Selected
                  </DropdownMenuItem>
                </>
              )}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isLoading}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Selected Chats"
        description={`Are you sure you want to permanently delete ${selectedCount} chat${
          selectedCount === 1 ? '' : 's'
        }? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        isLoading={isLoading}
        variant="destructive"
      />

      {/* Archive Confirmation Dialog */}
      <ConfirmationDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        title="Archive Selected Chats"
        description={`Are you sure you want to archive ${selectedCount} chat${
          selectedCount === 1 ? '' : 's'
        }? Archived chats can be restored later.`}
        confirmText="Archive"
        onConfirm={handleArchive}
        isLoading={isLoading}
      />
    </>
  );
}