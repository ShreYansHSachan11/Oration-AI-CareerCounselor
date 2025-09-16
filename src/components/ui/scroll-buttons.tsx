'use client';

import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ScrollButtonsProps {
  showScrollToTop?: boolean;
  showScrollToBottom?: boolean;
  onScrollToTop?: () => void;
  onScrollToBottom?: () => void;
  className?: string;
}

export function ScrollButtons({
  showScrollToTop = false,
  showScrollToBottom = false,
  onScrollToTop,
  onScrollToBottom,
  className,
}: ScrollButtonsProps) {
  return (
    <div className={cn('fixed right-4 bottom-20 z-50 flex flex-col gap-2', className)}>
      <AnimatePresence>
        {showScrollToTop && onScrollToTop && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              variant="secondary"
              size="icon"
              className={cn(
                'h-12 w-12 rounded-full shadow-lg backdrop-blur-sm',
                'bg-background/80 hover:bg-background/90 border',
                'touch-manipulation active:scale-95 transition-transform'
              )}
              onClick={onScrollToTop}
              title="Scroll to top"
            >
              <ChevronUp className="h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showScrollToBottom && onScrollToBottom && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <Button
              variant="secondary"
              size="icon"
              className={cn(
                'h-12 w-12 rounded-full shadow-lg backdrop-blur-sm',
                'bg-background/80 hover:bg-background/90 border',
                'touch-manipulation active:scale-95 transition-transform'
              )}
              onClick={onScrollToBottom}
              title="Scroll to bottom"
            >
              <ChevronDown className="h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface NewMessageIndicatorProps {
  show?: boolean;
  onScrollToBottom?: () => void;
  messageCount?: number;
  className?: string;
}

export function NewMessageIndicator({
  show = false,
  onScrollToBottom,
  messageCount = 1,
  className,
}: NewMessageIndicatorProps) {
  return (
    <AnimatePresence>
      {show && onScrollToBottom && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn(
            'fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50',
            className
          )}
        >
          <Button
            variant="default"
            className={cn(
              'rounded-full shadow-lg backdrop-blur-sm px-4 py-2',
              'bg-primary hover:bg-primary/90 text-primary-foreground',
              'touch-manipulation active:scale-95 transition-transform',
              'flex items-center gap-2'
            )}
            onClick={onScrollToBottom}
          >
            <ChevronDown className="h-4 w-4" />
            <span className="text-sm font-medium">
              {messageCount === 1 ? 'New message' : `${messageCount} new messages`}
            </span>
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}