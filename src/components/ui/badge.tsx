import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 shadow-soft',
  {
    variants: {
      variant: {
        default: 'gradient-primary text-white shadow-medium',
        secondary: 'bg-secondary/80 text-secondary-foreground backdrop-blur-sm',
        destructive: 'gradient-danger text-white shadow-medium',
        success: 'gradient-success text-white shadow-medium',
        warning: 'gradient-warning text-white shadow-medium',
        outline: 'border-2 border-primary/30 text-foreground bg-background/50 backdrop-blur-sm',
        glass: 'glass text-foreground',
        dot: 'w-3 h-3 p-0 rounded-full',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        default: 'px-3 py-1 text-xs',
        lg: 'px-4 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };