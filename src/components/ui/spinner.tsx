import { cn } from '@/utils/cn';

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'monochrome' | 'glass' | 'gradient';
}

const Spinner = ({ className, size = 'md', variant = 'default' }: SpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const variantClasses = {
    default: 'border-foreground/20 border-t-foreground',
    monochrome: 'border-foreground/30 border-t-foreground shadow-soft',
    glass: 'border-foreground/10 border-t-foreground/50 backdrop-blur-sm',
    gradient: 'border-transparent bg-gradient-to-r from-foreground via-muted-foreground to-foreground',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 transition-all duration-300',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Enhanced monochromatic spinner with multiple rings
interface EnhancedSpinnerProps extends SpinnerProps {
  rings?: number;
}

const EnhancedSpinner = ({ className, size = 'md', variant = 'default', rings = 1 }: EnhancedSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  if (rings === 1) {
    return <Spinner className={className} size={size} variant={variant} />;
  }

  return (
    <div className={cn('relative inline-flex items-center justify-center', sizeClasses[size], className)}>
      {Array.from({ length: rings }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'absolute animate-spin rounded-full border-2',
            'border-foreground/20 border-t-foreground transition-all duration-300',
            sizeClasses[size]
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: `${1 + i * 0.2}s`,
            transform: `scale(${1 - i * 0.2})`,
            opacity: 1 - i * 0.3,
          }}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export { Spinner, EnhancedSpinner };
