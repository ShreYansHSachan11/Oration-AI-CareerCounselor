'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  Heart, 
  Star, 
  Sparkles, 
  ThumbsUp, 
  Send,
  MessageCircle,
  Bookmark,
  Copy,
  Download
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface SuccessAnimationProps {
  isVisible: boolean;
  type?: 'checkmark' | 'heart' | 'star' | 'sparkles' | 'thumbs-up';
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  duration?: number;
  onComplete?: () => void;
  className?: string;
}

const iconMap = {
  checkmark: CheckCircle,
  heart: Heart,
  star: Star,
  sparkles: Sparkles,
  'thumbs-up': ThumbsUp,
};

export function SuccessAnimation({
  isVisible,
  type = 'checkmark',
  size = 'md',
  color = 'text-green-500',
  duration = 2000,
  onComplete,
  className,
}: SuccessAnimationProps) {
  const Icon = iconMap[type];
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  React.useEffect(() => {
    if (isVisible && onComplete) {
      const timer = setTimeout(onComplete, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1.2, 1],
            opacity: [0, 1, 1],
          }}
          exit={{ 
            scale: 0,
            opacity: 0,
          }}
          transition={{
            duration: 0.6,
            ease: 'easeOut',
            times: [0, 0.6, 1],
          }}
          className={cn('flex items-center justify-center', className)}
        >
          <motion.div
            animate={{
              rotate: type === 'star' ? [0, 360] : 0,
            }}
            transition={{
              duration: 1,
              ease: 'easeInOut',
            }}
          >
            <Icon className={cn(sizeClasses[size], color)} />
          </motion.div>
          
          {/* Ripple effect */}
          <motion.div
            className={cn(
              'absolute rounded-full border-2 border-current opacity-30',
              sizeClasses[size],
              color
            )}
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ 
              scale: [1, 2, 3],
              opacity: [0.6, 0.3, 0],
            }}
            transition={{
              duration: 1.5,
              ease: 'easeOut',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Floating success message
interface FloatingSuccessProps {
  isVisible: boolean;
  message: string;
  icon?: React.ReactNode;
  position?: 'top' | 'center' | 'bottom';
  duration?: number;
  onComplete?: () => void;
  className?: string;
}

export function FloatingSuccess({
  isVisible,
  message,
  icon,
  position = 'center',
  duration = 3000,
  onComplete,
  className,
}: FloatingSuccessProps) {
  React.useEffect(() => {
    if (isVisible && onComplete) {
      const timer = setTimeout(onComplete, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onComplete]);

  const positionClasses = {
    top: 'top-4',
    center: 'top-1/2 -translate-y-1/2',
    bottom: 'bottom-4',
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: position === 'top' ? -20 : position === 'bottom' ? 20 : 0, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position === 'top' ? -20 : position === 'bottom' ? 20 : 0, scale: 0.8 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn(
            'fixed left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100 px-4 py-2 rounded-lg border border-green-200 dark:border-green-800 shadow-lg',
            positionClasses[position],
            className
          )}
        >
          {icon || <CheckCircle className="w-5 h-5" />}
          <span className="font-medium">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Action feedback animations
interface ActionFeedbackProps {
  action: 'send' | 'copy' | 'bookmark' | 'download' | 'like';
  isVisible: boolean;
  onComplete?: () => void;
  className?: string;
}

const actionConfig = {
  send: {
    icon: Send,
    message: 'Message sent!',
    color: 'text-blue-500',
  },
  copy: {
    icon: Copy,
    message: 'Copied to clipboard!',
    color: 'text-purple-500',
  },
  bookmark: {
    icon: Bookmark,
    message: 'Bookmarked!',
    color: 'text-yellow-500',
  },
  download: {
    icon: Download,
    message: 'Downloaded!',
    color: 'text-green-500',
  },
  like: {
    icon: ThumbsUp,
    message: 'Liked!',
    color: 'text-red-500',
  },
};

export function ActionFeedback({
  action,
  isVisible,
  onComplete,
  className,
}: ActionFeedbackProps) {
  const config = actionConfig[action];
  const Icon = config.icon;

  return (
    <FloatingSuccess
      isVisible={isVisible}
      message={config.message}
      icon={<Icon className={cn('w-5 h-5', config.color)} />}
      onComplete={onComplete}
      className={className}
    />
  );
}

// Confetti-like celebration animation
interface CelebrationProps {
  isVisible: boolean;
  intensity?: 'low' | 'medium' | 'high';
  duration?: number;
  onComplete?: () => void;
}

export function Celebration({
  isVisible,
  intensity = 'medium',
  duration = 3000,
  onComplete,
}: CelebrationProps) {
  const particleCount = {
    low: 15,
    medium: 25,
    high: 40,
  };

  React.useEffect(() => {
    if (isVisible && onComplete) {
      const timer = setTimeout(onComplete, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: particleCount[intensity] }).map((_, index) => (
            <motion.div
              key={index}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: [
                  '#ef4444', '#f97316', '#eab308', '#22c55e', 
                  '#3b82f6', '#8b5cf6', '#ec4899'
                ][index % 7],
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              initial={{
                scale: 0,
                opacity: 0,
                y: 0,
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
                y: [0, -100 - Math.random() * 100],
                x: [0, (Math.random() - 0.5) * 200],
                rotate: [0, Math.random() * 360],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                ease: 'easeOut',
                delay: Math.random() * 0.5,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

// Pulse feedback for button interactions
interface PulseFeedbackProps {
  children: React.ReactNode;
  isActive: boolean;
  color?: string;
  intensity?: 'low' | 'medium' | 'high';
  className?: string;
}

export function PulseFeedback({
  children,
  isActive,
  color = 'rgb(59, 130, 246)',
  intensity = 'medium',
  className,
}: PulseFeedbackProps) {
  const intensityScale = {
    low: 1.05,
    medium: 1.1,
    high: 1.2,
  };

  return (
    <motion.div
      className={cn('relative', className)}
      animate={isActive ? {
        scale: [1, intensityScale[intensity], 1],
      } : {}}
      transition={{
        duration: 0.3,
        ease: 'easeOut',
      }}
    >
      {children}
      
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              boxShadow: `0 0 0 0 ${color}`,
            }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.6, 0],
              boxShadow: [
                `0 0 0 0 ${color}`,
                `0 0 0 8px ${color}20`,
                `0 0 0 16px ${color}00`,
              ],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.6,
              ease: 'easeOut',
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Success checkmark with path animation
export function AnimatedCheckmark({
  isVisible,
  size = 'md',
  color = '#22c55e',
  className,
}: {
  isVisible: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}) {
  const sizeMap = {
    sm: 24,
    md: 32,
    lg: 48,
  };

  const svgSize = sizeMap[size];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn('flex items-center justify-center', className)}
        >
          <svg
            width={svgSize}
            height={svgSize}
            viewBox="0 0 24 24"
            fill="none"
            className="drop-shadow-sm"
          >
            <motion.circle
              cx="12"
              cy="12"
              r="11"
              stroke={color}
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
            <motion.path
              d="M8 12l2 2 4-4"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
            />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}