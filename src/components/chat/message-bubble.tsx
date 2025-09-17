'use client';

import React, { useState } from 'react';
import { User, Bot, Sparkles, Edit3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageStatusIndicator } from './message-status-indicator';
import { MessageActions } from './message-actions';
import { MessageReactions } from './message-reactions';
import { ReadReceipts } from './read-receipts';
import { cn } from '@/lib/utils';
import { MessageWithStatus, ReactionSummary } from '@/types/message';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageBubbleProps {
  message: MessageWithStatus;
  isLastMessage?: boolean;
  onRegenerate?: () => void;
  onDelete?: () => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string) => void;
  onToggleBookmark?: (messageId: string) => void;
  onMarkAsRead?: (messageId: string) => void;
  isRegenerating?: boolean;
  reactions?: ReactionSummary[];
}

export function MessageBubble({
  message,
  isLastMessage,
  onRegenerate,
  onDelete,
  onEdit,
  onAddReaction,
  onRemoveReaction,
  onToggleBookmark,
  onMarkAsRead,
  isRegenerating,
  reactions = [],
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const isUser = message.role === 'USER';
  const isAssistant = message.role === 'ASSISTANT';

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (onEdit && editContent.trim() !== message.content) {
      onEdit(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleAddReaction = (emoji: string) => {
    if (onAddReaction) {
      onAddReaction(message.id, emoji);
    }
  };

  const handleRemoveReaction = () => {
    if (onRemoveReaction) {
      onRemoveReaction(message.id);
    }
  };

  const handleToggleBookmark = () => {
    if (onToggleBookmark) {
      onToggleBookmark(message.id);
    }
  };

  const formatTimestamp = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{
        duration: 0.3,
        ease: 'easeOut',
        delay: message.isOptimistic ? 0 : 0.1,
      }}
      className={cn(
        'flex gap-2 sm:gap-3 group px-1 sm:px-0',
        isUser ? 'justify-end' : 'justify-start'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onTouchStart={() => setShowActions(true)} // Show actions on touch
      onTouchEnd={() => {
        // Auto-hide actions on mobile after delay
        setTimeout(() => setShowActions(false), 3000);
      }}
    >
      {/* Avatar - only show for assistant messages */}
      {isAssistant && (
        <motion.div
          className="flex-shrink-0"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, duration: 0.4, type: "spring" }}
        >
          <Avatar size="default" variant="gradient" className="shadow-large hover-glow">
            <AvatarFallback className="gradient-primary text-primary-foreground">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="w-4 h-4 icon-monochrome" />
              </motion.div>
            </AvatarFallback>
          </Avatar>
        </motion.div>
      )}

      {/* Message Content */}
      <div
        className={cn(
          'flex flex-col max-w-[90%] sm:max-w-[85%] md:max-w-[80%]',
          isUser && 'items-end'
        )}
      >
        {/* Message Bubble */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{
            scale: 1,
            opacity: message.isOptimistic ? 0.7 : 1,
            y: 0,
          }}
          transition={{ 
            duration: 0.3, 
            delay: 0.1,
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card
            variant={isUser ? "monochrome" : "glass-strong"}
            padding="default"
            className={cn(
              'relative transition-all duration-300 touch-manipulation overflow-hidden',
              'shadow-medium hover:shadow-large min-h-0 hover-lift',
              isUser
                ? 'ml-6 sm:ml-8 md:ml-12 bg-foreground text-background'
                : 'mr-6 sm:mr-8 md:mr-12 glass-strong backdrop-blur-xl',
              message.isOptimistic && 'opacity-70 pulse-modern',
              isRegenerating && 'opacity-50',
              'before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-foreground/5 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700'
            )}
            style={{
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              minHeight: 'auto',
            }}
          >
            {/* Regenerating indicator */}
            <AnimatePresence>
              {isRegenerating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg backdrop-blur-sm"
                >
                  <motion.div
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Spinner className="w-4 h-4" />
                    Regenerating...
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message text or edit input */}
            {isEditing ? (
              <div className="space-y-2 relative z-10">
                <Input
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className={cn(
                    "border-border/30 backdrop-blur-sm",
                    isUser 
                      ? "bg-background/20 text-background placeholder:text-background/60" 
                      : "bg-foreground/10 text-foreground placeholder:text-foreground/60"
                  )}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSaveEdit();
                    } else if (e.key === 'Escape') {
                      handleCancelEdit();
                    }
                  }}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={isUser ? "monochrome-outline" : "monochrome"}
                    onClick={handleSaveEdit}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className={cn(
                'whitespace-pre-wrap break-words select-text relative z-10',
                'text-sm sm:text-base leading-relaxed font-medium',
                'max-w-none overflow-wrap-anywhere',
                'hyphens-auto tracking-wide',
                isUser ? 'text-background' : 'text-foreground/90'
              )}>
                {message.content}
                {message.isEdited && (
                  <Badge variant="outline" className="ml-2 text-xs opacity-70">
                    edited
                  </Badge>
                )}
              </div>
            )}

            {/* Actions overlay */}
            {!isEditing && (
              <div className="absolute -top-3 right-2">
                <MessageActions
                  message={message}
                  isLastMessage={isLastMessage}
                  onRegenerate={onRegenerate}
                  onDelete={onDelete}
                  onBookmark={handleToggleBookmark}
                  onEdit={isUser ? handleEdit : undefined}
                  showActions={showActions || isLastMessage}
                />
              </div>
            )}
          </Card>
        </motion.div>

        {/* Message reactions */}
        {!isEditing && reactions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-2"
          >
            <MessageReactions
              messageId={message.id}
              reactions={reactions}
              onAddReaction={handleAddReaction}
              onRemoveReaction={handleRemoveReaction}
            />
          </motion.div>
        )}

        {/* Message metadata */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={cn(
            'flex items-center justify-between mt-2 text-xs text-muted-foreground/70'
          )}
        >
          <div className="flex items-center gap-2">
            {/* Timestamp */}
            <Badge variant="outline" size="sm" className="text-xs font-normal">
              {formatTimestamp(message.createdAt)}
            </Badge>

            {/* Bookmark indicator */}
            {message.isBookmarked && (
              <Badge variant="secondary" size="sm" className="text-xs">
                bookmarked
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Status indicator for user messages */}
            {isUser && message.status && (
              <MessageStatusIndicator
                status={message.status}
                timestamp={message.createdAt}
              />
            )}

            {/* Read receipts */}
            {isUser && (
              <ReadReceipts
                messageId={message.id}
                isRead={!!message.readAt}
                readAt={message.readAt}
                showReadStatus={true}
              />
            )}
          </div>
        </motion.div>
      </div>

      {/* Avatar for user messages */}
      {isUser && (
        <motion.div
          className="flex-shrink-0"
          initial={{ scale: 0, rotate: 180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, duration: 0.4, type: "spring" }}
        >
          <Avatar size="default" variant="glass" className="shadow-medium hover-lift">
            <AvatarFallback className="gradient-accent text-primary-foreground">
              <User className="w-4 h-4 icon-monochrome" />
            </AvatarFallback>
          </Avatar>
        </motion.div>
      )}
    </motion.div>
  );
}
