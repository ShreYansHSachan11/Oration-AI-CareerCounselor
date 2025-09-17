import * as React from 'react';
import { cn } from '@/utils/cn';
import { cva, type VariantProps } from 'class-variance-authority';

const inputVariants = cva(
  'flex w-full rounded-xl border bg-input px-4 py-3 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 focus-ring',
  {
    variants: {
      variant: {
        default: 'border-border bg-input hover:border-foreground/30 focus:border-foreground/50 hover:bg-input/80',
        glass: 'glass border-border/30 backdrop-blur-sm hover:border-foreground/40 focus:border-foreground/60 hover:bg-foreground/5',
        outline: 'border-2 border-border bg-background/50 hover:border-foreground/40 focus:border-foreground/60 hover:bg-foreground/5',
        monochrome: 'border-foreground bg-background hover:bg-foreground/5 focus:bg-foreground/10',
        subtle: 'border-muted-foreground/20 bg-muted/30 hover:bg-muted/50 focus:bg-muted/70',
      },
      size: {
        default: 'h-11 px-4 py-3',
        sm: 'h-9 px-3 py-2 text-xs',
        lg: 'h-13 px-6 py-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, size, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input, inputVariants };
