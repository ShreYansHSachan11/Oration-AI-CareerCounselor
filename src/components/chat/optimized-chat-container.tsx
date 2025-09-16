'use client';

import React, { Suspense, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/utils/cn';
import { api } from '@/trpc/react';
import {
  LazyOptimizedMessageList,
  MessageListFallback,
  SidebarFallback,
} from '@/components/lazy';
import { OptimizedChatSidebar } from './optimized-chat-sidebar';
import { ChatInput } from './chat-input';
import { TypingIndicator } from './typing-indicator';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useResponsive } from '@/hooks/use-responsive';
import {
  useAPIErrorHandler,
  InlineErrorDisplay,
} from '@/components/providers/error-provider';
import { useOptimizedMessageList } from './optimized-message-list';

interface OptimizedChatContainerProps {
  initialSessionId?: string;
  className?: string;
}

export function OptimizedChatContainer({
  initialSessionId,
  className,
}: OptimizedChatContainerProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<
    string | undefined
  >(initialSessionId);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const router = useRouter();
  const { isMobile } = useResponsive();
  const { handleAPIError } = useAPIErrorHandler();

  // Message list utilities
  const { addOptimisticMessage, removeOptimisticMessage } =
    useOptimizedMessageList(selectedSessionId || '');

  // Mutations
  const createSessionMutation = api.chat.createSession.useMutation({
    onSuccess: session => {
      setSelectedSessionId(session.id);
      router.push(`/chat/${session.id}`);
      if (isMobile) {
        setSidebarOpen(false);
      }
    },
    onError: error => {
      handleAPIError(error, 'Create Session');
    },
  });

  const sendMessageMutation = api.chat.sendMessage.useMutation({
    onMutate: async ({ content }) => {
      // Add optimistic message
      const tempId = `temp-${Date.now()}`;
      addOptimisticMessage({
        id: tempId,
        content,
        role: 'USER',
        status: 'sending',
      });
      return { tempId };
    },
    onSuccess: (data, variables, context) => {
      // Remove optimistic message and let the query refetch
      if (context?.tempId) {
        removeOptimisticMessage(context.tempId);
      }
      setIsTyping(false);
    },
    onError: (error, variables, context) => {
      // Remove optimistic message on error
      if (context?.tempId) {
        removeOptimisticMessage(context.tempId);
      }
      setIsTyping(false);
      handleAPIError(error, 'Send Message');
    },
  });

  const regenerateResponseMutation = api.chat.regenerateResponse.useMutation({
    onMutate: () => {
      setIsTyping(true);
    },
    onSuccess: () => {
      setIsTyping(false);
    },
    onError: error => {
      setIsTyping(false);
      handleAPIError(error, 'Regenerate Response');
    },
  });

  const deleteMessageMutation = api.chat.deleteMessage.useMutation({
    onError: error => {
      handleAPIError(error, 'Delete Message');
    },
  });

  const handleNewChat = useCallback(() => {
    createSessionMutation.mutate({});
  }, [createSessionMutation]);

  const handleSessionSelect = useCallback(
    (sessionId: string) => {
      setSelectedSessionId(sessionId);
      router.push(`/chat/${sessionId}`);
      if (isMobile) {
        setSidebarOpen(false);
      }
    },
    [router, isMobile]
  );

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!selectedSessionId) {
        // Create new session first
        const session = await createSessionMutation.mutateAsync({});
        setSelectedSessionId(session.id);

        // Send message to new session
        sendMessageMutation.mutate({
          sessionId: session.id,
          content,
        });
      } else {
        sendMessageMutation.mutate({
          sessionId: selectedSessionId,
          content,
        });
      }
      setIsTyping(true);
    },
    [selectedSessionId, createSessionMutation, sendMessageMutation]
  );

  const handleRegenerateResponse = useCallback(
    (messageId: string) => {
      if (selectedSessionId) {
        regenerateResponseMutation.mutate({
          sessionId: selectedSessionId,
          messageId,
        });
      }
    },
    [selectedSessionId, regenerateResponseMutation]
  );

  const handleDeleteMessage = useCallback(
    (messageId: string) => {
      if (selectedSessionId) {
        deleteMessageMutation.mutate({
          messageId,
          sessionId: selectedSessionId,
        });
      }
    },
    [selectedSessionId, deleteMessageMutation]
  );

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  return (
    <div className={cn('flex h-full bg-background', className)}>
      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'flex-shrink-0 border-r bg-background',
          isMobile
            ? cn(
                'fixed left-0 top-0 bottom-0 w-80 z-50 transform transition-transform duration-300',
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              )
            : 'w-80'
        )}
      >
        <Suspense fallback={<SidebarFallback />}>
          <OptimizedChatSidebar
            selectedSessionId={selectedSessionId}
            onSessionSelect={handleSessionSelect}
            onNewChat={handleNewChat}
            containerHeight={isMobile ? window.innerHeight : 600}
          />
        </Suspense>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        {isMobile && (
          <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="touch-manipulation"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            <h1 className="text-lg font-semibold">Career Chat</h1>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 relative min-h-0 overflow-hidden">
          {selectedSessionId ? (
            <Suspense fallback={<MessageListFallback />}>
              <LazyOptimizedMessageList
                sessionId={selectedSessionId}
                onRegenerateResponse={handleRegenerateResponse}
                onDeleteMessage={handleDeleteMessage}
                isRegenerating={regenerateResponseMutation.isPending}
                containerHeight={isMobile ? window.innerHeight - 200 : undefined}
                className="h-full"
              />
            </Suspense>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md mx-auto p-8">
                <h2 className="text-xl font-semibold mb-4">
                  Welcome to Career Chat
                </h2>
                <p className="text-muted-foreground mb-6">
                  Start a new conversation to get personalized career guidance
                  and advice.
                </p>
                <Button onClick={handleNewChat} size="lg">
                  Start New Chat
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Typing indicator */}
        {isTyping && (
          <div className="px-4 py-2 border-t">
            <TypingIndicator />
          </div>
        )}

        {/* Chat input */}
        <div className="border-t bg-background/95 backdrop-blur">
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={
              sendMessageMutation.isPending || createSessionMutation.isPending
            }
            placeholder={
              selectedSessionId
                ? 'Ask about your career...'
                : 'Start a conversation about your career...'
            }
          />
        </div>
      </div>

      {/* Error display */}
      <InlineErrorDisplay />
    </div>
  );
}

// Export a memoized version for better performance
export const MemoizedOptimizedChatContainer = React.memo(
  OptimizedChatContainer
);
