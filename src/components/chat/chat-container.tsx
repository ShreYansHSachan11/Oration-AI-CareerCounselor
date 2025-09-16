'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { TypingIndicator, AdvancedTypingIndicator } from './typing-indicator';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { ChatContainerSkeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';
import { MessageWithStatus } from '@/types/message';
import { Message } from '@prisma/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useErrorContext,
  useAPIErrorHandler,
} from '@/components/providers/error-provider';
import {
  SmartFallback,
  ChatErrorBoundary,
  NetworkAware,
} from '@/components/error';

interface ChatContainerProps {
  sessionId: string;
  className?: string;
}

export function ChatContainer({ sessionId, className }: ChatContainerProps) {
  const [messages, setMessages] = useState<MessageWithStatus[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [typingStage, setTypingStage] = useState<
    'typing' | 'thinking' | 'generating' | 'finalizing'
  >('typing');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { handleAPIError } = useAPIErrorHandler();

  // Fetch messages for the session
  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = api.chat.getMessages.useQuery(
    { sessionId, limit: 100 },
    { enabled: !!sessionId }
  );

  // Send message mutation
  const sendMessageMutation = api.chat.sendMessage.useMutation({
    onMutate: async ({ content }) => {
      // Optimistic update - add user message immediately
      const optimisticUserMessage: MessageWithStatus = {
        id: `temp-${Date.now()}`,
        content,
        role: 'USER',
        sessionId,
        createdAt: new Date(),
        status: 'sending',
        isOptimistic: true,
      };

      setMessages(prev => [...prev, optimisticUserMessage]);
      setIsAiTyping(true);
      setTypingStage('thinking');

      // Simulate typing stages
      setTimeout(() => setTypingStage('generating'), 1000);
      setTimeout(() => setTypingStage('finalizing'), 2000);

      // Scroll to bottom
      setTimeout(() => scrollToBottom(), 100);
    },
    onSuccess: data => {
      // Replace optimistic messages with real ones
      setMessages(prev => {
        const withoutOptimistic = prev.filter(msg => !msg.isOptimistic);
        return [
          ...withoutOptimistic,
          { ...data.userMessage, status: 'delivered' as const },
          { ...data.aiMessage, status: 'delivered' as const },
        ];
      });

      // Smooth transition out of typing state
      setTimeout(() => {
        setIsAiTyping(false);
        setTypingStage('typing');
      }, 300);

      // Scroll to bottom
      setTimeout(() => scrollToBottom(), 100);
    },
    onError: error => {
      // Update optimistic message to show error state
      setMessages(prev =>
        prev.map(msg =>
          msg.isOptimistic
            ? { ...msg, status: 'error' as const, isOptimistic: false }
            : msg
        )
      );
      setIsAiTyping(false);
      setTypingStage('typing');

      // Handle error with context
      handleAPIError(error, 'Send Message');
    },
  });

  // Regenerate response mutation
  const regenerateResponseMutation = api.chat.regenerateResponse.useMutation({
    onSuccess: updatedMessage => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === updatedMessage.id
            ? { ...updatedMessage, status: 'delivered' as const }
            : msg
        )
      );
      setTimeout(() => scrollToBottom(), 100);
    },
    onError: error => {
      handleAPIError(error, 'Regenerate Response');
    },
  });

  // Update messages when data changes
  useEffect(() => {
    if (messagesData?.items) {
      const messagesWithStatus: MessageWithStatus[] = messagesData.items.map(
        msg => ({
          ...msg,
          status: 'delivered' as const,
        })
      );
      setMessages(messagesWithStatus);
    }
  }, [messagesData]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (content: string) => {
    if (!content.trim() || sendMessageMutation.isPending) return;

    sendMessageMutation.mutate({
      sessionId,
      content: content.trim(),
    });
  };

  const handleRegenerateResponse = (messageId: string) => {
    regenerateResponseMutation.mutate({
      sessionId,
      messageId,
    });
  };

  const handleDeleteMessage = (messageId: string) => {
    // Note: This would need a delete message mutation
    console.log('Delete message:', messageId);
  };

  // Handle loading and error states
  if (isLoadingMessages || messagesData?.error) {
    return (
      <SmartFallback
        isLoading={isLoadingMessages}
        error={messagesData?.error}
        isEmpty={false}
        onRetry={() => refetchMessages()}
        className={cn('flex flex-col h-full', className)}
      />
    );
  }

  return (
    <ChatErrorBoundary>
      <NetworkAware
        onRetry={() => refetchMessages()}
        fallback={
          <SmartFallback
            error={new Error('No internet connection')}
            onRetry={() => refetchMessages()}
            className={cn('flex flex-col h-full', className)}
          />
        }
      >
        <motion.div
          className={cn('flex flex-col h-full relative overflow-hidden', className)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Animated background */}
          <div className="absolute inset-0 animated-gradient opacity-5 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-purple-50/20 dark:from-blue-950/20 dark:to-purple-950/20 pointer-events-none" />
          {/* Messages Area */}
          <div className="flex-1 overflow-hidden relative z-10">
            <MessageList
              messages={messages}
              isLoading={isLoadingMessages}
              onRegenerateResponse={handleRegenerateResponse}
              onDeleteMessage={handleDeleteMessage}
              isRegenerating={regenerateResponseMutation.isPending}
              className="pb-2"
            />

            {/* Typing Indicator */}
            <AnimatePresence>
              {isAiTyping && (
                <motion.div
                  className="px-3 pb-3 sm:px-4 sm:pb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <AdvancedTypingIndicator
                    isVisible={true}
                    stage={typingStage}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <motion.div
            className="border-t border-white/10 glass backdrop-blur-xl p-4 safe-area-inset-bottom relative z-10"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={sendMessageMutation.isPending || isAiTyping}
              disabled={!sessionId}
              placeholder="Ask me anything about your career..."
              maxLength={4000}
            />
          </motion.div>
        </motion.div>
      </NetworkAware>
    </ChatErrorBoundary>
  );
}
