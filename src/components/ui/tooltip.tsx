'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      'z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// Enhanced tooltip with rich content support
interface EnhancedTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  title?: string;
  description?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
  variant?: 'default' | 'info' | 'warning' | 'error' | 'success';
  showArrow?: boolean;
  maxWidth?: string;
  className?: string;
}

const variantStyles = {
  default: 'bg-popover text-popover-foreground border-border',
  info: 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-900/20 dark:text-blue-100 dark:border-blue-800',
  warning: 'bg-yellow-50 text-yellow-900 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-100 dark:border-yellow-800',
  error: 'bg-red-50 text-red-900 border-red-200 dark:bg-red-900/20 dark:text-red-100 dark:border-red-800',
  success: 'bg-green-50 text-green-900 border-green-200 dark:bg-green-900/20 dark:text-green-100 dark:border-green-800',
};

export function EnhancedTooltip({
  children,
  content,
  title,
  description,
  side = 'top',
  align = 'center',
  delayDuration = 300,
  variant = 'default',
  showArrow = true,
  maxWidth = '320px',
  className,
}: EnhancedTooltipProps) {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          className={cn(
            'relative max-w-xs p-0 border shadow-lg',
            variantStyles[variant],
            className
          )}
          style={{ maxWidth }}
        >
          <div className="p-3">
            {title && (
              <div className="font-semibold mb-1 text-sm">
                {title}
              </div>
            )}
            
            <div className="text-sm">
              {content}
            </div>
            
            {description && (
              <div className="text-xs opacity-80 mt-2">
                {description}
              </div>
            )}
          </div>
          
          {showArrow && (
            <TooltipPrimitive.Arrow
              className={cn(
                'fill-current',
                variant === 'default' && 'text-popover',
                variant === 'info' && 'text-blue-50 dark:text-blue-900/20',
                variant === 'warning' && 'text-yellow-50 dark:text-yellow-900/20',
                variant === 'error' && 'text-red-50 dark:text-red-900/20',
                variant === 'success' && 'text-green-50 dark:text-green-900/20'
              )}
            />
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Quick tooltip for simple text content
interface QuickTooltipProps {
  children: React.ReactNode;
  text: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export function QuickTooltip({ children, text, side = 'top', className }: QuickTooltipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side={side} className={className}>
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Interactive tooltip with actions
interface InteractiveTooltipProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'primary' | 'destructive';
  }>;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export function InteractiveTooltip({
  children,
  title,
  description,
  actions = [],
  side = 'top',
  className,
}: InteractiveTooltipProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className={cn('p-0 max-w-sm', className)}
          onPointerDownOutside={() => setOpen(false)}
        >
          <div className="p-4">
            <div className="font-semibold text-sm mb-2">
              {title}
            </div>
            
            {description && (
              <div className="text-sm text-muted-foreground mb-3">
                {description}
              </div>
            )}
            
            {actions.length > 0 && (
              <div className="flex gap-2">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      action.onClick();
                      setOpen(false);
                    }}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                      {
                        'bg-muted hover:bg-muted/80 text-foreground': action.variant === 'default' || !action.variant,
                        'bg-primary hover:bg-primary/90 text-primary-foreground': action.variant === 'primary',
                        'bg-destructive hover:bg-destructive/90 text-destructive-foreground': action.variant === 'destructive',
                      }
                    )}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Help tooltip with question mark icon
interface HelpTooltipProps {
  content: React.ReactNode;
  title?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export function HelpTooltip({ content, title, side = 'top', className }: HelpTooltipProps) {
  return (
    <EnhancedTooltip
      content={content}
      title={title}
      side={side}
      variant="info"
      className={className}
    >
      <button className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors">
        <span className="text-xs font-medium">?</span>
      </button>
    </EnhancedTooltip>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };