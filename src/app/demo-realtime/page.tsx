'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  TypingIndicator,
  AdvancedTypingIndicator,
  MessageBubble,
  ChatInput,
} from '@/components/chat';
import {
  Skeleton,
  MessageSkeleton,
  ChatSidebarSkeleton,
  ChatInputSkeleton,
} from '@/components/ui/skeleton';
import { AppLoading, useAppLoading } from '@/components/layout/app-loading';
import {
  PageTransition,
  FadeTransition,
  SlideTransition,
  ScaleTransition,
  StaggeredTransition,
} from '@/components/layout/page-transition';
import { useLoading } from '@/components/providers/loading-provider';
import { MessageWithStatus } from '@/types/message';

export default function RealtimeDemoPage() {
  const [showTyping, setShowTyping] = useState(false);
  const [typingStage, setTypingStage] = useState<
    'typing' | 'thinking' | 'generating' | 'finalizing'
  >('typing');
  const [showSkeletons, setShowSkeletons] = useState(false);
  const [showAppLoading, setShowAppLoading] = useState(false);
  const [transitionType, setTransitionType] = useState<
    'page' | 'fade' | 'slide' | 'scale' | 'stagger'
  >('page');

  const { setLoading } = useLoading();
  const { isLoading: appIsLoading, progress, stage } = useAppLoading();

  // Sample messages for demonstration
  const sampleMessages: MessageWithStatus[] = [
    {
      id: '1',
      content: 'Hello! I need some career advice.',
      role: 'USER',
      sessionId: 'demo',
      createdAt: new Date(Date.now() - 60000),
      status: 'delivered',
    },
    {
      id: '2',
      content:
        "I'd be happy to help you with your career questions! What specific area would you like to discuss?",
      role: 'ASSISTANT',
      sessionId: 'demo',
      createdAt: new Date(Date.now() - 30000),
      status: 'delivered',
    },
    {
      id: '3',
      content:
        "I'm thinking about switching from marketing to UX design. What should I consider?",
      role: 'USER',
      sessionId: 'demo',
      createdAt: new Date(),
      status: 'sending',
      isOptimistic: true,
    },
  ];

  const handleTypingDemo = () => {
    setShowTyping(true);
    const stages: Array<'typing' | 'thinking' | 'generating' | 'finalizing'> = [
      'typing',
      'thinking',
      'generating',
      'finalizing',
    ];

    let currentStage = 0;
    const interval = setInterval(() => {
      if (currentStage < stages.length - 1) {
        currentStage++;
        setTypingStage(stages[currentStage]);
      } else {
        clearInterval(interval);
        setTimeout(() => setShowTyping(false), 1000);
      }
    }, 1500);
  };

  const handleLoadingDemo = async () => {
    await setLoading(true, 'Processing your request...', 0);

    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setLoading(true, 'Processing your request...', i);
    }

    setLoading(false);
  };

  const handleAppLoadingDemo = () => {
    setShowAppLoading(true);
    setTimeout(() => setShowAppLoading(false), 8000);
  };

  const TransitionWrapper = ({ children }: { children: React.ReactNode }) => {
    const props = { className: 'w-full' };

    switch (transitionType) {
      case 'fade':
        return <FadeTransition {...props}>{children}</FadeTransition>;
      case 'slide':
        return (
          <SlideTransition {...props} direction="right">
            {children}
          </SlideTransition>
        );
      case 'scale':
        return <ScaleTransition {...props}>{children}</ScaleTransition>;
      case 'stagger':
        return <StaggeredTransition {...props}>{children}</StaggeredTransition>;
      default:
        return <PageTransition {...props}>{children}</PageTransition>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-6xl">
        <motion.h1
          className="text-3xl font-bold mb-8 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Real-time Features Demo
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Typing Indicators */}
          <TransitionWrapper>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Typing Indicators</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Button onClick={handleTypingDemo} className="w-full">
                    Demo Advanced Typing States
                  </Button>
                  <AdvancedTypingIndicator
                    isVisible={showTyping}
                    stage={typingStage}
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Basic Typing Indicator:</h3>
                  <TypingIndicator isVisible={true} />
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Thinking Variant:</h3>
                  <TypingIndicator isVisible={true} variant="thinking" />
                </div>
              </div>
            </Card>
          </TransitionWrapper>

          {/* Loading States */}
          <TransitionWrapper>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Loading States</h2>
              <div className="space-y-4">
                <Button onClick={handleLoadingDemo} className="w-full">
                  Demo Global Loading
                </Button>

                <Button onClick={handleAppLoadingDemo} className="w-full">
                  Demo App Loading
                </Button>

                <Button
                  onClick={() => setShowSkeletons(!showSkeletons)}
                  className="w-full"
                >
                  Toggle Skeleton Loading
                </Button>
              </div>
            </Card>
          </TransitionWrapper>

          {/* Message Animations */}
          <TransitionWrapper>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Message Animations</h2>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {sampleMessages.map(message => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isLastMessage={false}
                  />
                ))}
              </div>
            </Card>
          </TransitionWrapper>

          {/* Skeleton States */}
          <TransitionWrapper>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Skeleton Loading</h2>
              {showSkeletons ? (
                <div className="space-y-4">
                  <MessageSkeleton />
                  <MessageSkeleton isUser />
                  <ChatInputSkeleton />
                </div>
              ) : (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-full" />
                </div>
              )}
            </Card>
          </TransitionWrapper>

          {/* Page Transitions */}
          <TransitionWrapper>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Page Transitions</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {(['page', 'fade', 'slide', 'scale', 'stagger'] as const).map(
                    type => (
                      <Button
                        key={type}
                        variant={
                          transitionType === type ? 'default' : 'outline'
                        }
                        onClick={() => setTransitionType(type)}
                        className="text-sm"
                      >
                        {type}
                      </Button>
                    )
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Switch between transition types to see different animations
                </p>
              </div>
            </Card>
          </TransitionWrapper>

          {/* Chat Input Demo */}
          <TransitionWrapper>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Interactive Chat Input
              </h2>
              <ChatInput
                onSendMessage={message => console.log('Sent:', message)}
                placeholder="Try typing a message..."
                maxLength={100}
              />
            </Card>
          </TransitionWrapper>
        </div>

        {/* App Loading Overlay */}
        <AppLoading
          isLoading={showAppLoading || appIsLoading}
          progress={progress}
          stage={stage}
        />
      </div>
    </div>
  );
}
