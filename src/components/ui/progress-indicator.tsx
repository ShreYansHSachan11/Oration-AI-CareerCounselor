'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, MessageCircle, Sparkles, Zap, CheckCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ProgressIndicatorProps {
  progress: number;
  stage?: 'analyzing' | 'thinking' | 'generating' | 'finalizing' | 'complete';
  message?: string;
  showPercentage?: boolean;
  variant?: 'linear' | 'circular' | 'dots' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const stageConfig = {
  analyzing: {
    icon: Brain,
    message: 'Analyzing your question...',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500',
  },
  thinking: {
    icon: MessageCircle,
    message: 'Processing information...',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500',
  },
  generating: {
    icon: Sparkles,
    message: 'Generating response...',
    color: 'text-green-500',
    bgColor: 'bg-green-500',
  },
  finalizing: {
    icon: Zap,
    message: 'Finalizing answer...',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500',
  },
  complete: {
    icon: CheckCircle,
    message: 'Complete!',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500',
  },
};

export function ProgressIndicator({
  progress,
  stage = 'thinking',
  message,
  showPercentage = true,
  variant = 'linear',
  size = 'md',
  className,
}: ProgressIndicatorProps) {
  const config = stageConfig[stage];
  const Icon = config.icon;
  const displayMessage = message || config.message;

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  if (variant === 'circular') {
    return (
      <div className={cn('flex items-center gap-4', sizeClasses[size], className)}>
        <div className="relative">
          <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-muted stroke-current"
              strokeWidth="3"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <motion.path
              className={cn('stroke-current', config.color)}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              initial={{ strokeDasharray: '0 100' }}
              animate={{ strokeDasharray: `${progress} 100` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Icon className={cn('w-5 h-5', config.color)} />
            </motion.div>
          </div>
        </div>
        <div className="flex-1">
          <p className="font-medium">{displayMessage}</p>
          {showPercentage && (
            <p className="text-sm text-muted-foreground">{Math.round(progress)}%</p>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex items-center gap-4', sizeClasses[size], className)}>
        <Icon className={cn('w-5 h-5', config.color)} />
        <span className="font-medium">{displayMessage}</span>
        <div className="flex gap-1">
          {[0, 1, 2].map(index => (
            <motion.div
              key={index}
              className={cn('w-2 h-2 rounded-full', config.bgColor)}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
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
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('flex items-center gap-4', sizeClasses[size], className)}>
        <motion.div
          className={cn('p-3 rounded-full', config.bgColor, 'bg-opacity-20')}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Icon className={cn('w-5 h-5', config.color)} />
        </motion.div>
        <div className="flex-1">
          <p className="font-medium">{displayMessage}</p>
          {showPercentage && (
            <p className="text-sm text-muted-foreground">{Math.round(progress)}%</p>
          )}
        </div>
      </div>
    );
  }

  // Default linear variant
  return (
    <div className={cn('space-y-3', sizeClasses[size], className)}>
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Icon className={cn('w-5 h-5', config.color)} />
        </motion.div>
        <span className="font-medium flex-1">{displayMessage}</span>
        {showPercentage && (
          <span className="text-sm text-muted-foreground font-mono">
            {Math.round(progress)}%
          </span>
        )}
      </div>
      
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <motion.div
          className={cn('h-2 rounded-full', config.bgColor)}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// AI Response Progress Indicator specifically for chat
interface AIResponseProgressProps {
  isVisible: boolean;
  stage?: 'analyzing' | 'thinking' | 'generating' | 'finalizing';
  progress?: number;
  className?: string;
}

export function AIResponseProgress({
  isVisible,
  stage = 'thinking',
  progress,
  className,
}: AIResponseProgressProps) {
  const [internalProgress, setInternalProgress] = React.useState(0);

  React.useEffect(() => {
    if (!isVisible) {
      setInternalProgress(0);
      return;
    }

    if (progress !== undefined) {
      setInternalProgress(progress);
      return;
    }

    // Simulate progress if not provided
    const interval = setInterval(() => {
      setInternalProgress(prev => {
        const increment = Math.random() * 10 + 5;
        const newProgress = prev + increment;
        
        // Slow down as we approach 100%
        if (newProgress > 90) {
          return Math.min(95, prev + 1);
        }
        
        return Math.min(90, newProgress);
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isVisible, progress]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={cn('p-4 bg-muted/50 rounded-lg border', className)}
        >
          <ProgressIndicator
            progress={internalProgress}
            stage={stage}
            variant="linear"
            size="sm"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Multi-stage progress indicator
interface MultiStageProgressProps {
  stages: Array<{
    id: string;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
  }>;
  currentStage: string;
  completedStages: string[];
  className?: string;
}

export function MultiStageProgress({
  stages,
  currentStage,
  completedStages,
  className,
}: MultiStageProgressProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {stages.map((stage, index) => {
        const isCompleted = completedStages.includes(stage.id);
        const isCurrent = currentStage === stage.id;
        const Icon = stage.icon || CheckCircle;

        return (
          <motion.div
            key={stage.id}
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors',
                {
                  'bg-green-500 border-green-500 text-white': isCompleted,
                  'bg-primary border-primary text-white animate-pulse': isCurrent,
                  'bg-muted border-muted-foreground/30 text-muted-foreground': !isCompleted && !isCurrent,
                }
              )}
            >
              {isCompleted ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
            </div>
            
            <span
              className={cn(
                'font-medium transition-colors',
                {
                  'text-green-600': isCompleted,
                  'text-foreground': isCurrent,
                  'text-muted-foreground': !isCompleted && !isCurrent,
                }
              )}
            >
              {stage.label}
            </span>
            
            {isCurrent && (
              <motion.div
                className="flex gap-1 ml-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {[0, 1, 2].map(dotIndex => (
                  <motion.div
                    key={dotIndex}
                    className="w-1.5 h-1.5 bg-primary rounded-full"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: dotIndex * 0.2,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}