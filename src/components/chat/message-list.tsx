'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MessageBubble } from './message-bubble';
import { Spinner } from '@/components/ui/spinner';
import { MessageSkeleton } from '@/components/ui/skeleton';
import { ScrollButtons, NewMessageIndicator } from '@/components/ui/scroll-buttons';
import { cn } from '@/lib/utils';
import { MessageWithStatus } from '@/types/message';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollBehavior } from '@/hooks/use-scroll-behavior';

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
  const [newMessageCount, setNewMessageCount] = useState(0);
  const lastMessageCount = useRef(0);

  // Enhanced scroll behavior
  const {
    scrollRef,
    isNearBottom,
    showScrollToTop,
    showScrollToBottom,
    handleScroll,
    scrollToBottom,
    scrollToTop,
    autoScrollToBottom,
  } = useScrollBehavior({
    threshold: 200,
    autoScrollThreshold: 100,
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const currentMessageCount = messages.length;
    const hasNewMessages = currentMessageCount > lastMessageCount.current;
    
    if (hasNewMessages) {
      const newCount = currentMessageCount - lastMessageCount.current;
      
      if (isNearBottom) {
        // Auto-scroll if user is near bottom
        autoScrollToBottom();
        setNewMessageCount(0);
      } else {
        // Show new message indicator if user is not near bottom
        setNewMessageCount(prev => prev + newCount);
      }
    }
    
    lastMessageCount.current = currentMessageCount;
  }, [messages.length, isNearBottom, autoScrollToBottom]);

  // Reset new message count when user scrolls to bottom
  useEffect(() => {
    if (isNearBottom) {
      setNewMessageCount(0);
    }
  }, [isNearBottom]);

  const handleScrollToBottomWithNewMessages = () => {
    scrollToBottom();
    setNewMessageCount(0);
  };

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
    <div className={cn('flex-1 relative', className)}>
      {/* Messages container with improved scrolling */}
      <div
        ref={scrollRef}
        className={cn(
          'h-full overflow-y-auto overscroll-contain scroll-smooth',
          'webkit-overflow-scrolling-touch scrollbar-thin scrollbar-thumb-muted',
          'scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/20'
        )}
        style={{
          // Improve text rendering and scrolling performance
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
          overflowAnchor: 'auto', // Prevent scroll jumping
        }}
        onScroll={handleScroll}
      >
        <div className="min-h-full flex flex-col">
          {/* Messages */}
          <div className="flex-1 space-y-3 sm:space-y-4 p-3 sm:p-4">
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
          
          {/* Bottom spacer for better UX */}
          <div className="h-4" />
        </div>
      </div>

      {/* Scroll buttons */}
      <ScrollButtons
        showScrollToTop={showScrollToTop}
        showScrollToBottom={showScrollToBottom}
        onScrollToTop={scrollToTop}
        onScrollToBottom={scrollToBottom}
      />

      {/* New message indicator */}
      <NewMessageIndicator
        show={newMessageCount > 0}
        messageCount={newMessageCount}
        onScrollToBottom={handleScrollToBottomWithNewMessages}
      />
    </div>
  );
}
