'use client';

import React from 'react';
import { Bot, Brain } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

interface TypingIndicatorProps {
  isVisible: boolean;
  message?: string;
  variant?: 'default' | 'thinking' | 'processing';
  className?: string;
}

export function TypingIndicator({
  isVisible,
  message,
  variant = 'default',
  className,
}: TypingIndicatorProps) {
  const getDefaultMessage = () => {
    switch (variant) {
      case 'thinking':
        return 'AI is thinking...';
      case 'processing':
        return 'Processing your request...';
      default:
        return 'AI is typing...';
    }
  };

  const displayMessage = message || getDefaultMessage();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={cn('flex gap-3', className)}
        >
          {/* Avatar */}
          <div className="flex-shrink-0">
            <motion.div
              className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"
              animate={{
                boxShadow: [
                  '0 0 0 0 rgba(59, 130, 246, 0.4)',
                  '0 0 0 4px rgba(59, 130, 246, 0.1)',
                  '0 0 0 0 rgba(59, 130, 246, 0.4)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              {variant === 'thinking' ? (
                <Brain className="w-4 h-4 text-primary" />
              ) : (
                <Bot className="w-4 h-4 text-primary" />
              )}
            </motion.div>
          </div>

          {/* Typing bubble */}
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-4 bg-muted max-w-[250px] relative overflow-hidden">
              {/* Background pulse effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
                animate={{ x: [-100, 300] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />

              <div className="flex items-center gap-3 relative z-10">
                <span className="text-sm text-muted-foreground font-medium">
                  {displayMessage}
                </span>

                {/* Animated dots */}
                <div className="flex gap-1">
                  {[0, 1, 2].map(index => (
                    <motion.div
                      key={index}
                      className="w-2 h-2 bg-primary/60 rounded-full"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.6, 1, 0.6],
                      }}
                      transition={{
                        duration: 1.4,
                        repeat: Infinity,
                        delay: index * 0.2,
                        ease: 'easeInOut',
                      }}
                    />
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Enhanced typing indicator with different states
export function AdvancedTypingIndicator({
  isVisible,
  stage = 'typing',
  className,
}: {
  isVisible: boolean;
  stage?: 'typing' | 'thinking' | 'generating' | 'finalizing';
  className?: string;
}) {
  const stageConfig = {
    typing: { message: 'AI is typing...', variant: 'default' as const },
    thinking: {
      message: 'Analyzing your question...',
      variant: 'thinking' as const,
    },
    generating: {
      message: 'Generating response...',
      variant: 'processing' as const,
    },
    finalizing: {
      message: 'Finalizing answer...',
      variant: 'processing' as const,
    },
  };

  const config = stageConfig[stage];

  return (
    <TypingIndicator
      isVisible={isVisible}
      message={config.message}
      variant={config.variant}
      className={className}
    />
  );
}
