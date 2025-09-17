'use client';

import React from 'react';
import {
  X,
  Trash2,
  Archive,
  ArchiveRestore,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface BulkActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onBulkArchive: () => void;
  onBulkUnarchive: () => void;
  onBulkExport: () => void;
  isLoading: boolean;
  showArchiveActions: boolean;
}

export function BulkActionsToolbar({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkArchive,
  onBulkUnarchive,
  onBulkExport,
  isLoading,
  showArchiveActions,
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{ duration: 0.2 }}
        className="border-b bg-primary/5 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearSelection}
              className="h-8 w-8"
              title="Clear selection"
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-medium">
                {selectedCount} selected
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkExport}
              disabled={isLoading}
              className="h-8 px-3"
            >
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>

            {showArchiveActions && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkArchive}
                disabled={isLoading}
                className="h-8 px-3"
              >
                <Archive className="h-3 w-3 mr-1" />
                Archive
              </Button>
            )}

            {!showArchiveActions && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkUnarchive}
                disabled={isLoading}
                className="h-8 px-3"
              >
                <ArchiveRestore className="h-3 w-3 mr-1" />
                Unarchive
              </Button>
            )}

            <Button
              variant="destructive"
              size="sm"
              onClick={onBulkDelete}
              disabled={isLoading}
              className="h-8 px-3"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}