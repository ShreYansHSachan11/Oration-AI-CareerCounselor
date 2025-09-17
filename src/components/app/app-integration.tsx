/**
 * Main application integration component
 * Brings together all features into a cohesive experience with final polish
 */

'use client';

import React, { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ErrorBoundary } from '@/components/error/error-boundary';
import { AppLoading } from '@/components/layout/app-loading';
import { performanceMonitor } from '@/lib/performance-monitor';
import { globalPerformanceMonitor, deviceOptimizations } from '@/lib/performance-optimization';
import { FinalIntegrationPolish } from '@/components/app/final-integration-polish';
import { UXEnhancementProvider, EnhancedLoading } from '@/components/app/ux-enhancements';
import {
  NotificationToast,
  ScrollToTopButton,
  PageTransition,
} from '@/components/ui/enhanced-animations';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/trpc/react';
import { cn } from '@/lib/utils';

// Lazy load components for better performance
const ChatContainer = React.lazy(() =>
  import('@/components/chat/chat-container').then(module => ({
    default: module.ChatContainer,
  }))
);

const ImprovedChatSidebar = React.lazy(() =>
  import('@/components/chat/improved-chat-sidebar').then(module => ({
    default: module.ImprovedChatSidebar,
  }))
);

const AppLayout = React.lazy(() =>
  import('@/components/layout/app-layout').then(module => ({
    default: module.AppLayout,
  }))
);

interface AppIntegrationProps {
  children?: React.ReactNode;
}

export function AppIntegration({ children }: AppIntegrationProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();
  const [selectedSessionId, setSelectedSessionId] = React.useState<
    string | undefined
  >();
  const [isLoading, setIsLoading] = React.useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [isOptimized, setIsOptimized] = React.useState(false);

  // Enhanced performance monitoring and optimization
  React.useEffect(() => {
    // Apply device-specific optimizations
    const deviceCapabilities = deviceOptimizations.applyOptimizations();
    
    // Monitor performance metrics
    const performanceCleanup = () => {
      performanceMonitor.cleanup();
      if (globalPerformanceMonitor) {
        globalPerformanceMonitor.cleanup();
      }
    };

    // Log device capabilities for debugging
    console.log('Device capabilities:', deviceCapabilities);
    
    // Mark as optimized
    setIsOptimized(true);

    // Cleanup on unmount
    return performanceCleanup;
  }, []);

  // Handle authentication state
  React.useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    setIsLoading(false);
  }, [status, router]);

  // Handle session selection
  const handleSessionSelect = React.useCallback((sessionId: string) => {
    setSelectedSessionId(sessionId);
  }, []);

  // Create new session mutation
  const createSessionMutation = api.chat.createSession.useMutation({
    onSuccess: (session) => {
      setSelectedSessionId(session.id);
      addToast('New chat session created!', 'success');
    },
    onError: (error) => {
      console.error('Failed to create new session:', error);
      addToast('Failed to create new chat session. Please try again.', 'error');
    },
  });

  // Handle new chat creation
  const handleNewChat = React.useCallback(() => {
    createSessionMutation.mutate({});
  }, [createSessionMutation]);

  // Handle sidebar toggle
  const handleToggleSidebar = React.useCallback(() => {
    setSidebarCollapsed(!sidebarCollapsed);
  }, [sidebarCollapsed]);

  // Show enhanced loading state
  if (status === 'loading' || isLoading || !isOptimized) {
    return (
      <UXEnhancementProvider>
        <FinalIntegrationPolish>
          <EnhancedLoading 
            isLoading={true} 
            message="Optimizing your experience..." 
          />
        </FinalIntegrationPolish>
      </UXEnhancementProvider>
    );
  }

  // Don't render if not authenticated
  if (status === 'unauthenticated') {
    return null;
  }

  // If children are provided, render them (for custom pages)
  if (children) {
    return (
      <UXEnhancementProvider>
        <FinalIntegrationPolish>
          <ErrorBoundary>
            <PageTransition>{children}</PageTransition>
            <ScrollToTopButton />
            <AnimatePresence>
              {toasts.map(toast => (
                <NotificationToast
                  key={toast.id}
                  message={toast.message}
                  type={toast.type}
                  onClose={() => removeToast(toast.id)}
                />
              ))}
            </AnimatePresence>
          </ErrorBoundary>
        </FinalIntegrationPolish>
      </UXEnhancementProvider>
    );
  }

  // Main chat application with full integration and polish
  return (
    <UXEnhancementProvider>
      <FinalIntegrationPolish>
        <ErrorBoundary>
          <Suspense fallback={<EnhancedLoading isLoading={true} message="Loading chat interface..." />}>
            <AppLayout
              sidebar={
                <Suspense
                  fallback={
                    <div className={cn(
                      "bg-background border-r animate-pulse transition-all duration-300",
                      sidebarCollapsed ? "w-16" : "w-80"
                    )} />
                  }
                >
                  <ImprovedChatSidebar
                    selectedSessionId={selectedSessionId}
                    onSessionSelect={handleSessionSelect}
                    onNewChat={handleNewChat}
                    isCollapsed={sidebarCollapsed}
                    onToggleCollapse={handleToggleSidebar}
                  />
                </Suspense>
              }
              sidebarCollapsed={sidebarCollapsed}
              onToggleSidebar={handleToggleSidebar}
            >
              <main id="main-content" className="flex flex-col h-full">
                {selectedSessionId ? (
                  <motion.div
                    key={selectedSessionId}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 flex flex-col"
                  >
                    <Suspense
                      fallback={
                        <EnhancedLoading 
                          isLoading={true} 
                          message="Loading conversation..." 
                        />
                      }
                    >
                      <ChatContainer sessionId={selectedSessionId} />
                    </Suspense>
                  </motion.div>
                ) : (
                  <WelcomeScreen 
                    onNewChat={handleNewChat} 
                    isCreatingSession={createSessionMutation.isLoading}
                  />
                )}
              </main>
            </AppLayout>
          </Suspense>

          {/* Global UI elements */}
          <ScrollToTopButton />

          {/* Toast notifications */}
          <AnimatePresence>
            {toasts.map(toast => (
              <NotificationToast
                key={toast.id}
                message={toast.message}
                type={toast.type}
                onClose={() => removeToast(toast.id)}
              />
            ))}
          </AnimatePresence>
        </ErrorBoundary>
      </FinalIntegrationPolish>
    </UXEnhancementProvider>
  );
}

// Welcome screen component
interface WelcomeScreenProps {
  onNewChat: () => void;
  isCreatingSession?: boolean;
}

function WelcomeScreen({ onNewChat, isCreatingSession = false }: WelcomeScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex-1 flex items-center justify-center p-4 sm:p-8"
    >
      <div className="text-center max-w-md mx-auto">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center"
        >
          <svg
            className="w-8 h-8 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xl sm:text-2xl font-semibold mb-3"
        >
          Welcome to Career Chat
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-muted-foreground mb-6 text-sm sm:text-base"
        >
          Start a new conversation or select an existing chat from the sidebar
          to continue your career counseling journey.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          onClick={onNewChat}
          disabled={isCreatingSession}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={!isCreatingSession ? { scale: 1.05 } : {}}
          whileTap={!isCreatingSession ? { scale: 0.95 } : {}}
        >
          {isCreatingSession ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Start New Chat
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
