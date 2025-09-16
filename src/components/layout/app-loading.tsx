'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, MessageCircle, Sparkles } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

interface AppLoadingProps {
  isLoading: boolean;
  progress?: number;
  stage?: 'initializing' | 'connecting' | 'loading-data' | 'ready';
}

export function AppLoading({
  isLoading,
  progress = 0,
  stage = 'initializing',
}: AppLoadingProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    if (progress > displayProgress) {
      const timer = setTimeout(() => {
        setDisplayProgress(Math.min(displayProgress + 1, progress));
      }, 20);
      return () => clearTimeout(timer);
    }
  }, [progress, displayProgress]);

  const stageConfig = {
    initializing: {
      message: 'Initializing Career Counselor...',
      icon: Bot,
      color: 'text-blue-500',
    },
    connecting: {
      message: 'Connecting to AI Services...',
      icon: MessageCircle,
      color: 'text-green-500',
    },
    'loading-data': {
      message: 'Loading Your Profile...',
      icon: Sparkles,
      color: 'text-purple-500',
    },
    ready: {
      message: 'Ready to Help!',
      icon: Bot,
      color: 'text-primary',
    },
  };

  const config = stageConfig[stage];
  const IconComponent = config.icon;

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gradient-to-br from-background via-background to-muted/20 z-50 flex items-center justify-center"
        >
          <div className="text-center max-w-md mx-auto p-8">
            {/* Logo Animation */}
            <motion.div
              className="mb-8"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary/30"
                />
                <IconComponent className={`w-10 h-10 ${config.color}`} />
              </div>
            </motion.div>

            {/* App Title */}
            <motion.h1
              className="text-2xl font-bold mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Career Counseling Chat
            </motion.h1>

            <motion.p
              className="text-muted-foreground mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              AI-powered career guidance at your fingertips
            </motion.p>

            {/* Loading Status */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <div className="flex items-center justify-center gap-3">
                <Spinner className="h-4 w-4" />
                <span className="text-sm font-medium">{config.message}</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-xs mx-auto">
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${displayProgress}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {displayProgress}%
                </p>
              </div>

              {/* Loading Dots */}
              <div className="flex justify-center gap-1">
                {[0, 1, 2].map(index => (
                  <motion.div
                    key={index}
                    className="w-2 h-2 bg-primary/60 rounded-full"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.6, 1, 0.6],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: index * 0.2,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Simulated loading hook for demonstration
export function useAppLoading() {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<
    'initializing' | 'connecting' | 'loading-data' | 'ready'
  >('initializing');

  useEffect(() => {
    const simulateLoading = async () => {
      // Stage 1: Initializing
      setStage('initializing');
      for (let i = 0; i <= 25; i++) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Stage 2: Connecting
      setStage('connecting');
      for (let i = 25; i <= 60; i++) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 30));
      }

      // Stage 3: Loading data
      setStage('loading-data');
      for (let i = 60; i <= 90; i++) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 40));
      }

      // Stage 4: Ready
      setStage('ready');
      for (let i = 90; i <= 100; i++) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 20));
      }

      // Wait a bit before hiding
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsLoading(false);
    };

    simulateLoading();
  }, []);

  return { isLoading, progress, stage };
}
