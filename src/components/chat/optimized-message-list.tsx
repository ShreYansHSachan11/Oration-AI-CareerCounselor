'use client';

import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { MessageBubble } from './message-bubble';
import { Spinner } from '@/components/ui/spinner';
import { MessageSkeleton } from '@/components/ui/skeleton';
import { ScrollButtons, NewMessageIndicator } from '@/components/ui/scroll-buttons';
import { cn } from '@/lib/utils';
import { MessageWithStatus } from '@/types/message';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/trpc/react';
import { useScrollBehavior } from '@/hooks/use-scroll-behavior';

interface OptimizedMessageListProps {
  sessionId: string;
  onRegenerateResponse?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  isRegenerating?: boolean;
  className?: string;
  containerHeight?: number;
}

const LOAD_MORE_THRESHOLD = 5; // Load more when 5 messages from top

export function OptimizedMessageList({
  sessionId,
  onRegenerateResponse,
  onDeleteMessage,
  isRegenerating,
  className,
  containerHeight = 600,
}: OptimizedMessageListProps) {
  const [newMessageCount, setNewMessageCount] = useState(0);
  const lastMessageCount = useRef(0);
  const lastScrollHeight = useRef(0);
  
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

  // Use infinite query for pagination
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = api.chat.getMessages.useInfiniteQuery(
    {
      sessionId,
      limit: 50,
    },
    {
      getNextPageParam: lastPage => lastPage.nextCursor,
      enabled: !!sessionId,
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    }
  );

  // Flatten all messages from pages
  const allMessages = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page.items).reverse(); // Reverse to show newest at bottom
  }, [data?.pages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const currentMessageCount = allMessages.length;
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
  }, [allMessages.length, isNearBottom, autoScrollToBottom]);

  // Reset new message count when user scrolls to bottom
  useEffect(() => {
    if (isNearBottom) {
      setNewMessageCount(0);
    }
  }, [isNearBottom]);

  // Load more messages when scrolling to top
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      const scrollElement = scrollRef.current;
      if (scrollElement) {
        lastScrollHeight.current = scrollElement.scrollHeight;
      }
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Maintain scroll position when loading older messages
  useEffect(() => {
    if (!isFetchingNextPage && lastScrollHeight.current > 0) {
      const scrollElement = scrollRef.current;
      if (scrollElement) {
        const heightDifference = scrollElement.scrollHeight - lastScrollHeight.current;
        if (heightDifference > 0) {
          scrollElement.scrollTop += heightDifference;
        }
        lastScrollHeight.current = 0;
      }
    }
  }, [isFetchingNextPage]);

  const handleScrollToBottomWithNewMessages = useCallback(() => {
    scrollToBottom();
    setNewMessageCount(0);
  }, [scrollToBottom]);

  const renderMessage = useCallback(
    (message: MessageWithStatus, index: number) => {
      return (
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
          className="px-3 sm:px-4 py-2"
        >
          <MessageBubble
            message={message}
            isLastMessage={index === allMessages.length - 1}
            onRegenerate={
              message.role === 'ASSISTANT' && onRegenerateResponse
                ? () => onRegenerateResponse(message.id)
                : undefined
            }
            onDelete={
              onDeleteMessage ? () => onDeleteMessage(message.id) : undefined
            }
            isRegenerating={isRegenerating && index === allMessages.length - 1}
          />
        </motion.div>
      );
    },
    [allMessages.length, onRegenerateResponse, onDeleteMessage, isRegenerating]
  );

  if (isLoading && allMessages.length === 0) {
    return (
      <div className={cn('flex-1 overflow-y-auto p-4 space-y-4', className)}>
        <MessageSkeleton />
        <MessageSkeleton isUser />
        <MessageSkeleton />
        <MessageSkeleton isUser />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-destructive mb-2">Failed to load messages</div>
          <div className="text-sm text-muted-foreground">
            {error?.message || 'An error occurred while loading messages'}
          </div>
        </div>
      </div>
    );
  }

  if (allMessages.length === 0) {
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
      {/* Load more indicator at top */}
      <AnimatePresence>
        {isFetchingNextPage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-sm border-b shadow-sm"
          >
            <div className="flex items-center justify-center py-3">
              <Spinner className="h-4 w-4 mr-2" />
              <span className="text-sm text-muted-foreground">
                Loading older messages...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages container with improved scrolling */}
      <div
        ref={scrollRef}
        className={cn(
          'h-full overflow-y-auto overscroll-contain scroll-smooth',
          'webkit-overflow-scrolling-touch scrollbar-thin scrollbar-thumb-muted',
          'scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/20',
          isFetchingNextPage && 'pt-16' // Add padding when loading indicator is shown
        )}
        style={{
          height: containerHeight || '100%',
          // Improve text rendering and scrolling performance
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
          overflowAnchor: 'auto', // Prevent scroll jumping
        }}
        onScroll={(e) => {
          handleScroll(e);
          
          // Load more when near top
          const element = e.currentTarget;
          if (element.scrollTop < 200 && hasNextPage && !isFetchingNextPage) {
            handleLoadMore();
          }
        }}
      >
        <div className="min-h-full flex flex-col">
          {/* Messages */}
          <div className="flex-1 space-y-3 sm:space-y-4 py-4">
            <AnimatePresence initial={false}>
              {allMessages.map((message, index) => renderMessage(message, index))}
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

// Hook for managing message list state
export function useOptimizedMessageList(sessionId: string) {
  const queryClient = api.useUtils();

  const invalidateMessages = useCallback(() => {
    queryClient.chat.getMessages.invalidate({ sessionId });
  }, [queryClient, sessionId]);

  const addOptimisticMessage = useCallback(
    (message: Partial<MessageWithStatus>) => {
      queryClient.chat.getMessages.setInfiniteData({ sessionId }, oldData => {
        if (!oldData) return oldData;

        const newMessage = {
          id: `temp-${Date.now()}`,
          content: message.content || '',
          role: message.role || 'USER',
          sessionId,
          createdAt: new Date(),
          status: 'sending' as const,
          ...message,
        } as MessageWithStatus;

        const newPages = [...oldData.pages];
        if (newPages.length > 0) {
          const lastPage = { ...newPages[newPages.length - 1] };
          lastPage.items = [...lastPage.items, newMessage];
          newPages[newPages.length - 1] = lastPage;
        }

        return {
          ...oldData,
          pages: newPages,
        };
      });
    },
    [queryClient, sessionId]
  );

  const removeOptimisticMessage = useCallback(
    (tempId: string) => {
      queryClient.chat.getMessages.setInfiniteData({ sessionId }, oldData => {
        if (!oldData) return oldData;

        const newPages = oldData.pages.map(page => ({
          ...page,
          items: page.items.filter(item => item.id !== tempId),
        }));

        return {
          ...oldData,
          pages: newPages,
        };
      });
    },
    [queryClient, sessionId]
  );

  return {
    invalidateMessages,
    addOptimisticMessage,
    removeOptimisticMessage,
  };
}
