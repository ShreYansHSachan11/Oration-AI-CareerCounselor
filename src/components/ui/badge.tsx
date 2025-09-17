import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-all duration-300 shadow-soft hover-fade',
  {
    variants: {
      variant: {
        default: 'gradient-primary text-primary-foreground shadow-medium hover:shadow-large',
        secondary: 'bg-secondary text-secondary-foreground backdrop-blur-sm hover:bg-secondary/80',
        destructive: 'gradient-danger text-white shadow-medium hover:shadow-large',
        success: 'gradient-success text-foreground shadow-medium hover:shadow-large',
        warning: 'gradient-warning text-foreground shadow-medium hover:shadow-large',
        outline: 'border-2 border-border text-foreground bg-background/50 backdrop-blur-sm hover:bg-foreground/5',
        glass: 'glass text-foreground hover:bg-foreground/5',
        monochrome: 'bg-foreground text-background hover:bg-foreground/90 shadow-medium',
        'monochrome-outline': 'border border-foreground text-foreground hover:bg-foreground hover:text-background',
        dot: 'w-3 h-3 p-0 rounded-full bg-foreground',
        subtle: 'bg-muted/50 text-muted-foreground hover:bg-muted/70',
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