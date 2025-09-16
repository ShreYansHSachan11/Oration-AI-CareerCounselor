'use client';

import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './message-bubble';
import { Spinner } from '@/components/ui/spinner';
import { MessageSkeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';
import { MessageWithStatus } from '@/types/message';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageListProps {
  messages: MessageWithStatus[];
  isLoading?: boolean;
  onRegenerateResponse?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  isRegenerating?: boolean;
  className?: string;
}

export function MessageList({
  messages,
  isLoading,
  onRegenerateResponse,
  onDeleteMessage,
  isRegenerating,
  className,
}: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

      if (isNearBottom) {
        scrollAreaRef.current.scrollTop = scrollHeight;
      }
    }
  }, [messages]);

  if (isLoading && messages.length === 0) {
    return (
      <div className={cn('flex-1 overflow-y-auto p-4 space-y-4', className)}>
        <MessageSkeleton />
        <MessageSkeleton isUser />
        <MessageSkeleton />
        <MessageSkeleton isUser />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <motion.div
          className="text-center max-w-md mx-auto p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <motion.svg
                className="w-8 h-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </motion.svg>
            </div>
          </motion.div>
          <motion.h3
            className="text-lg font-semibold mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Start a conversation
          </motion.h3>
          <motion.p
            className="text-muted-foreground text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Ask me anything about your career path, job search, skills
            development, or professional growth. I&apos;m here to help guide you
            through your career journey.
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      ref={scrollAreaRef}
      className={cn(
        'flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-3 sm:space-y-4',
        'scroll-smooth webkit-overflow-scrolling-touch', // Better mobile scrolling
        className
      )}
      style={{
        // Improve scrolling performance on mobile
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: 'smooth',
      }}
    >
      <AnimatePresence initial={false}>
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{
              duration: 0.3,
              layout: { duration: 0.2 },
            }}
          >
            <MessageBubble
              message={message}
              isLastMessage={index === messages.length - 1}
              onRegenerate={
                message.role === 'ASSISTANT' && onRegenerateResponse
                  ? () => onRegenerateResponse(message.id)
                  : undefined
              }
              onDelete={
                onDeleteMessage ? () => onDeleteMessage(message.id) : undefined
              }
              isRegenerating={isRegenerating && index === messages.length - 1}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
