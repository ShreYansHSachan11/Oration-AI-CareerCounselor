'use client';

import React, { useState } from 'react';
import { 
  Copy, 
  RotateCcw, 
  Trash2, 
  Check, 
  Bookmark, 
  BookmarkCheck,
  Edit3,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageWithStatus } from '@/types/message';

interface MessageActionsProps {
  message: MessageWithStatus;
  isLastMessage?: boolean;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onDelete?: () => void;
  onBookmark?: () => void;
  onEdit?: () => void;
  showActions?: boolean;
  className?: string;
}

export function MessageActions({
  message,
  isLastMessage,
  onCopy,
  onRegenerate,
  onDelete,
  onBookmark,
  onEdit,
  showActions = false,
  className,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isUser = message.role === 'USER';
  const isAssistant = message.role === 'ASSISTANT';
  const canEdit = isUser && !message.isOptimistic;
  const canRegenerate = isAssistant && onRegenerate;
  const canDelete = onDelete && !message.isOptimistic;
  const canBookmark = onBookmark && !message.isOptimistic;

  const handleCopy = async () => {
    if (onCopy) {
      onCopy();
    } else {
      try {
        await navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy message:', error);
      }
    }
  };

  const handleBookmark = () => {
    if (onBookmark) {
      onBookmark();
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    }
  };

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate();
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  // Quick actions (always visible on hover/touch)
  const quickActions = [
    {
      icon: copied ? Check : Copy,
      onClick: handleCopy,
      title: 'Copy message',
      show: true,
      variant: copied ? 'default' : 'ghost' as const,
      className: copied ? 'text-green-600' : '',
    },
    {
      icon: message.isBookmarked ? BookmarkCheck : Bookmark,
      onClick: handleBookmark,
      title: message.isBookmarked ? 'Remove bookmark' : 'Bookmark message',
      show: canBookmark,
      variant: message.isBookmarked ? 'default' : 'ghost' as const,
      className: message.isBookmarked ? 'text-yellow-600' : '',
    },
  ];

  // More actions (in dropdown menu)
  const moreActions = [
    {
      icon: Edit3,
      label: 'Edit message',
      onClick: handleEdit,
      show: canEdit,
    },
    {
      icon: RotateCcw,
      label: 'Regenerate response',
      onClick: handleRegenerate,
      show: canRegenerate,
    },
    {
      icon: Trash2,
      label: 'Delete message',
      onClick: handleDelete,
      show: canDelete,
      destructive: true,
    },
  ];

  const hasMoreActions = moreActions.some(action => action.show);

  if (!showActions && !isLastMessage) {
    return null;
  }

  return (
    <AnimatePresence>
      {(showActions || isLastMessage) && !message.isOptimistic && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 5 }}
          transition={{ duration: 0.2, type: "spring" }}
          className={cn(
            'flex items-center gap-1 glass rounded-xl shadow-large border-white/20 p-1',
            className
          )}
        >
          {/* Quick Actions */}
          {quickActions.map((action, index) => 
            action.show && (
              <motion.div
                key={index}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant={action.variant}
                  size="icon-sm"
                  className={cn(
                    'h-7 w-7 touch-manipulation hover:bg-white/20 dark:hover:bg-black/20 backdrop-blur-sm rounded-lg',
                    action.className
                  )}
                  onClick={action.onClick}
                  title={action.title}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={action.icon.name}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <action.icon className="h-3.5 w-3.5" />
                    </motion.div>
                  </AnimatePresence>
                </Button>
              </motion.div>
            )
          )}

          {/* More Actions Dropdown */}
          {hasMoreActions && (
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-7 w-7 touch-manipulation hover:bg-white/20 dark:hover:bg-black/20 backdrop-blur-sm rounded-lg"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {moreActions.map((action, index) => 
                  action.show && (
                    <React.Fragment key={index}>
                      <DropdownMenuItem
                        onClick={action.onClick}
                        className={cn(
                          'flex items-center gap-2 cursor-pointer',
                          action.destructive && 'text-destructive focus:text-destructive'
                        )}
                      >
                        <action.icon className="h-4 w-4" />
                        {action.label}
                      </DropdownMenuItem>
                      {action.destructive && index < moreActions.length - 1 && (
                        <DropdownMenuSeparator />
                      )}
                    </React.Fragment>
                  )
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}