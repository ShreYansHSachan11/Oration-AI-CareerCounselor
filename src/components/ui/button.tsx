import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 btn-modern hover-lift focus-ring',
  {
    variants: {
      variant: {
        default: 'gradient-primary text-primary-foreground shadow-medium hover:shadow-large active:scale-95',
        destructive:
          'gradient-danger text-white shadow-medium hover:shadow-large active:scale-95',
        outline:
          'border-2 border-border bg-background/80 backdrop-blur-sm hover:bg-accent/50 hover:border-foreground/20 shadow-soft hover:shadow-medium',
        secondary:
          'bg-secondary text-secondary-foreground backdrop-blur-sm shadow-soft hover:bg-secondary/80 hover:shadow-medium active:scale-95',
        ghost: 'hover:bg-accent/30 hover:text-accent-foreground backdrop-blur-sm active:scale-95 hover-fade',
        link: 'text-foreground underline-offset-4 hover:underline hover-glow hover-fade',
        gradient: 'gradient-accent text-white shadow-medium hover:shadow-large active:scale-95',
        glass: 'glass text-foreground hover:bg-foreground/5 shadow-medium hover:shadow-large',
        monochrome: 'bg-foreground text-background hover:bg-foreground/90 shadow-medium hover:shadow-large active:scale-95',
        'monochrome-outline': 'border-2 border-foreground text-foreground hover:bg-foreground hover:text-background shadow-soft hover:shadow-medium',
      },
      size: {
        default: 'h-11 px-6 py-2.5',
        sm: 'h-9 rounded-lg px-4 text-xs',
        lg: 'h-13 rounded-xl px-8 text-base',
        icon: 'h-11 w-11 rounded-xl',
        'icon-sm': 'h-9 w-9 rounded-lg',
        'icon-lg': 'h-13 w-13 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
