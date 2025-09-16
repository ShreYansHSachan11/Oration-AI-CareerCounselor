'use client';

import React, { useState } from 'react';
import { User, Bot, Copy, RotateCcw, Trash2, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, duration: 0.4, type: "spring" }}
        >
          <Avatar size="default" variant="gradient" className="shadow-large hover-glow">
            <AvatarFallback className="gradient-primary text-white">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="w-4 h-4" />
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
            variant={isUser ? "gradient" : "glass"}
            padding="default"
            className={cn(
              'relative transition-all duration-300 touch-manipulation overflow-hidden',
              'shadow-medium hover:shadow-large min-h-0',
              isUser
                ? 'ml-6 sm:ml-8 md:ml-12 gradient-primary text-white'
                : 'mr-6 sm:mr-8 md:mr-12 glass backdrop-blur-xl border-white/20 dark:border-white/10',
              message.isOptimistic && 'opacity-70 pulse-modern',
              isRegenerating && 'opacity-50',
              'before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700'
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

            {/* Message text */}
            <div className={cn(
              'whitespace-pre-wrap break-words select-text relative z-10',
              'text-sm sm:text-base leading-relaxed font-medium',
              'max-w-none overflow-wrap-anywhere',
              'hyphens-auto tracking-wide',
              isUser ? 'text-white' : 'text-foreground/90'
            )}>
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
                    transition={{ duration: 0.2, type: "spring" }}
                    className="absolute -top-3 right-2 flex items-center gap-1 glass rounded-xl shadow-large border-white/20"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="h-8 w-8 sm:h-7 sm:w-7 touch-manipulation hover:bg-white/20 dark:hover:bg-black/20 backdrop-blur-sm rounded-lg"
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
                          size="icon-sm"
                          className="h-8 w-8 sm:h-7 sm:w-7 touch-manipulation hover:bg-white/20 dark:hover:bg-black/20 backdrop-blur-sm rounded-lg"
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
                          size="icon-sm"
                          className="h-8 w-8 sm:h-7 sm:w-7 text-red-400 hover:text-red-300 hover:bg-red-500/20 touch-manipulation backdrop-blur-sm rounded-lg"
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={cn(
            'flex items-center gap-2 mt-2 text-xs text-muted-foreground/70'
          )}
        >
          {/* Timestamp */}
          <Badge variant="outline" size="sm" className="text-xs font-normal">
            {formatTimestamp(message.createdAt)}
          </Badge>

          {/* Status indicator for user messages */}
          {isUser && message.status && (
            <MessageStatusIndicator
              status={message.status}
              timestamp={message.createdAt}
            />
          )}
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
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        </motion.div>
      )}
    </motion.div>
  );
}
