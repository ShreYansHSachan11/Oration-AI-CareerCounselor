'use client';

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { MessageBubble } from './message-bubble';
import { Spinner } from '@/components/ui/spinner';
import { MessageSkeleton } from '@/components/ui/skeleton';
import { VirtualScroll } from '@/components/ui/virtual-scroll';
import { cn } from '@/utils/cn';
import { MessageWithStatus } from '@/types/message';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/trpc/react';

interface OptimizedMessageListProps {
  sessionId: string;
  onRegenerateResponse?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  isRegenerating?: boolean;
  className?: string;
  containerHeight?: number;
}

const MESSAGE_HEIGHT = 120; // Estimated height per message
const LOAD_MORE_THRESHOLD = 5; // Load more when 5 messages from top

export function OptimizedMessageList({
  sessionId,
  onRegenerateResponse,
  onDeleteMessage,
  isRegenerating,
  className,
  containerHeight = 600,
}: OptimizedMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);
  const lastMessageCount = useRef(0);

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
    if (
      allMessages.length > lastMessageCount.current &&
      shouldAutoScroll.current
    ) {
      const scrollElement = scrollRef.current;
      if (scrollElement && 'scrollToBottom' in scrollElement) {
        (scrollElement as any).scrollToBottom();
      }
    }
    lastMessageCount.current = allMessages.length;
  }, [allMessages.length]);

  // Load more messages when scrolling to top
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      shouldAutoScroll.current = false; // Prevent auto-scroll when loading older messages
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Reset auto-scroll when user scrolls to bottom
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight < 50;
    shouldAutoScroll.current = isAtBottom;
  }, []);

  const renderMessage = useCallback(
    (message: MessageWithStatus, index: number) => {
      return (
        <div className="px-3 sm:px-4 py-2">
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
        </div>
      );
    },
    [allMessages.length, onRegenerateResponse, onDeleteMessage, isRegenerating]
  );

  const getMessageKey = useCallback(
    (message: MessageWithStatus, index: number) => {
      return message.id;
    },
    []
  );

  const loadingComponent = useMemo(
    () => (
      <div className="flex items-center justify-center py-4">
        <Spinner className="h-6 w-6" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading messages...
        </span>
      </div>
    ),
    []
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
      {isFetchingNextPage && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm border-b">
          <div className="flex items-center justify-center py-2">
            <Spinner className="h-4 w-4 mr-2" />
            <span className="text-sm text-muted-foreground">
              Loading older messages...
            </span>
          </div>
        </div>
      )}

      <VirtualScroll
        ref={scrollRef}
        items={allMessages}
        itemHeight={MESSAGE_HEIGHT}
        containerHeight={containerHeight}
        renderItem={renderMessage}
        getItemKey={getMessageKey}
        onLoadMore={handleLoadMore}
        hasMore={hasNextPage}
        isLoading={isFetchingNextPage}
        loadingComponent={loadingComponent}
        overscan={3}
        className={cn(
          'overflow-y-auto overscroll-contain scroll-smooth webkit-overflow-scrolling-touch',
          isFetchingNextPage && 'pt-12' // Add padding when loading indicator is shown
        )}
        onScroll={handleScroll}
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
