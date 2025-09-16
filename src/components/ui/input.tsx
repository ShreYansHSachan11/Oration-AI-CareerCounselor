import * as React from 'react';
import { cn } from '@/utils/cn';
import { cva, type VariantProps } from 'class-variance-authority';

const inputVariants = cva(
  'flex w-full rounded-xl border bg-background px-4 py-3 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'border-input bg-background hover:border-primary/30 focus:border-primary/50',
        glass: 'glass border-white/20 backdrop-blur-sm hover:border-primary/40 focus:border-primary/60',
        outline: 'border-2 border-primary/20 bg-background/50 hover:border-primary/40 focus:border-primary/60',
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
