import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';

const statusIndicatorVariants = cva(
  'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
  {
    variants: {
      status: {
        online: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        offline: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
        away: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        busy: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        typing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      },
      variant: {
        default: '',
        glass: 'glass backdrop-blur-sm',
        solid: 'shadow-soft',
      },
    },
    defaultVariants: {
      status: 'offline',
      variant: 'default',
    },
  }
);

const dotVariants = cva(
  'w-2 h-2 rounded-full',
  {
    variants: {
      status: {
        online: 'bg-green-500 shadow-green-500/50',
        offline: 'bg-gray-400 shadow-gray-400/50',
        away: 'bg-yellow-500 shadow-yellow-500/50',
        busy: 'bg-red-500 shadow-red-500/50',
        typing: 'bg-blue-500 shadow-blue-500/50',
      },
    },
    defaultVariants: {
      status: 'offline',
    },
  }
);

export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusIndicatorVariants> {
  showText?: boolean;
  animated?: boolean;
}

const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ className, status, variant, showText = true, animated = true, ...props }, ref) => {
    const statusText = {
      online: 'Online',
      offline: 'Offline',
      away: 'Away',
      busy: 'Busy',
      typing: 'Typing...',
    };

    return (
      <div
        ref={ref}
        className={cn(statusIndicatorVariants({ status, variant, className }))}
        {...props}
      >
        <motion.div
          className={cn(dotVariants({ status }), 'shadow-lg')}
          animate={
            animated && (status === 'online' || status === 'typing')
              ? {
                  scale: [1, 1.2, 1],
                  boxShadow: [
                    '0 0 0 0 currentColor',
                    '0 0 0 4px rgba(34, 197, 94, 0.2)',
                    '0 0 0 0 currentColor',
                  ],
                }
              : {}
          }
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        {showText && (
          <span className="font-semibold">
            {status && statusText[status]}
          </span>
        )}
      </div>
    );
  }
);
StatusIndicator.displayName = 'StatusIndicator';

export { StatusIndicator, statusIndicatorVariants };