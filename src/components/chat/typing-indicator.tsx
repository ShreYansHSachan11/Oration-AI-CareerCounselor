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
              className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center shadow-large"
              animate={{
                boxShadow: [
                  '0 0 0 0 rgba(102, 126, 234, 0.6)',
                  '0 0 0 8px rgba(102, 126, 234, 0.1)',
                  '0 0 0 0 rgba(102, 126, 234, 0.6)',
                ],
                rotate: variant === 'thinking' ? [0, 360] : 0,
              }}
              transition={{ 
                boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                rotate: { duration: 3, repeat: Infinity, ease: 'linear' }
              }}
            >
              {variant === 'thinking' ? (
                <Brain className="w-5 h-5 text-white" />
              ) : (
                <Bot className="w-5 h-5 text-white" />
              )}
            </motion.div>
          </div>

          {/* Typing bubble */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, type: "spring" }}
          >
            <Card variant="glass" className="p-4 max-w-[280px] relative overflow-hidden shadow-large">
              {/* Background shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: [-100, 350] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
              />

              <div className="flex items-center gap-4 relative z-10">
                <span className="text-sm font-semibold text-foreground/90">
                  {displayMessage}
                </span>

                {/* Enhanced animated dots */}
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(index => (
                    <motion.div
                      key={index}
                      className="w-2.5 h-2.5 gradient-primary rounded-full shadow-soft"
                      animate={{
                        scale: [1, 1.4, 1],
                        opacity: [0.5, 1, 0.5],
                        y: [0, -4, 0],
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: index * 0.15,
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
