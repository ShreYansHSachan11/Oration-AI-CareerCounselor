'use client';

import React, { useState } from 'react';
import { User, Bot, Copy, RotateCcw, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { MessageStatusIndicator } from './message-status-indicator';
import { cn } from '@/lib/utils';
import { MessageWithStatus } from '@/types/message';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageBubbleProps {
  message: MessageWithStatus;
  isLastMessage?: boolean;
  onRegenerate?: () => void;
  onDelete?: () => void;
  isRegenerating?: boolean;
}

export function MessageBubble({
  message,
  isLastMessage,
  onRegenerate,
  onDelete,
  isRegenerating,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);

  const isUser = message.role === 'USER';
  const isAssistant = message.role === 'ASSISTANT';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
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
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.2 }}
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          </div>
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
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: message.isOptimistic ? 0.7 : 1,
          }}
          transition={{ duration: 0.2, delay: 0.1 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <Card
            className={cn(
              'p-3 sm:p-4 relative transition-all duration-200 touch-manipulation',
              'shadow-sm hover:shadow-md',
              isUser
                ? 'bg-primary text-primary-foreground ml-6 sm:ml-8 md:ml-12'
                : 'bg-muted mr-6 sm:mr-8 md:mr-12',
              message.isOptimistic && 'opacity-70 animate-pulse',
              isRegenerating && 'opacity-50'
            )}
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

            {/* Message text */}
            <div className="whitespace-pre-wrap break-words text-sm sm:text-base leading-relaxed select-text">
              {message.content}
            </div>

            {/* Actions overlay */}
            <AnimatePresence>
              {(showActions || isLastMessage) &&
                !message.isOptimistic &&
                !isRegenerating && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute -top-2 right-2 flex items-center gap-1 bg-background border rounded-md shadow-sm"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 sm:h-7 sm:w-7 touch-manipulation hover:bg-accent/80"
                        onClick={handleCopy}
                        title="Copy message"
                      >
                        <AnimatePresence mode="wait">
                          {copied ? (
                            <motion.div
                              key="check"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                            >
                              <Check className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-green-600" />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="copy"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                            >
                              <Copy className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Button>
                    </motion.div>

                    {isAssistant && onRegenerate && (
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 sm:h-7 sm:w-7 touch-manipulation hover:bg-accent/80"
                          onClick={onRegenerate}
                          title="Regenerate response"
                        >
                          <RotateCcw className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                        </Button>
                      </motion.div>
                    )}

                    {onDelete && (
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 sm:h-7 sm:w-7 text-destructive hover:text-destructive hover:bg-destructive/10 touch-manipulation"
                          onClick={onDelete}
                          title="Delete message"
                        >
                          <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                        </Button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Message metadata */}
        <div
          className={cn(
            'flex items-center gap-2 mt-1 text-xs text-muted-foreground'
          )}
        >
          {/* Timestamp */}
          <span>{formatTimestamp(message.createdAt)}</span>

          {/* Status indicator for user messages */}
          {isUser && message.status && (
            <>
              <span>•</span>
              <MessageStatusIndicator
                status={message.status}
                timestamp={message.createdAt}
              />
            </>
          )}
        </div>
      </div>

      {/* Avatar for user messages */}
      {isUser && (
        <motion.div
          className="flex-shrink-0"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.2 }}
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
