import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'secondary' | 'accent';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-[3px]',
  xl: 'w-12 h-12 border-4',
};

const variantClasses = {
  default: 'border-primary border-t-transparent',
  secondary: 'border-secondary border-t-transparent',
  accent: 'border-accent border-t-transparent',
};

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'default', 
  className 
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'secondary' | 'accent';
  className?: string;
}

const dotSizeClasses = {
  sm: 'w-1 h-1',
  md: 'w-2 h-2',
  lg: 'w-3 h-3',
};

export function LoadingDots({ 
  size = 'md', 
  variant = 'default', 
  className 
}: LoadingDotsProps) {
  const dotClass = cn(
    'rounded-full animate-pulse',
    dotSizeClasses[size],
    variant === 'default' && 'bg-primary',
    variant === 'secondary' && 'bg-secondary',
    variant === 'accent' && 'bg-accent'
  );

  return (
    <div className={cn('flex items-center space-x-1', className)} role="status" aria-label="Loading">
      <div className={cn(dotClass, 'animation-delay-0')} />
      <div className={cn(dotClass, 'animation-delay-150')} />
      <div className={cn(dotClass, 'animation-delay-300')} />
      <span className="sr-only">Loading...</span>
    </div>
  );
}

interface LoadingPulseProps {
  className?: string;
  children?: React.ReactNode;
}

export function LoadingPulse({ className, children }: LoadingPulseProps) {
  return (
    <div className={cn('animate-pulse', className)} role="status" aria-label="Loading">
      {children}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

interface LoadingBarProps {
  progress?: number; // 0-100
  variant?: 'default' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animated?: boolean;
}

const barSizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export function LoadingBar({ 
  progress, 
  variant = 'default', 
  size = 'md', 
  className,
  animated = true 
}: LoadingBarProps) {
  const isIndeterminate = progress === undefined;
  const progressValue = progress || 0;
  const progressProps = isIndeterminate ? {} : {
    'aria-valuenow': progressValue,
    'aria-valuemin': 0,
    'aria-valuemax': 100,
  };
  
  return (
    <div
      className={cn(
        'w-full bg-gray-200 rounded-full overflow-hidden',
        barSizeClasses[size],
        className
      )}
      role="progressbar"
      aria-label={`Loading progress: ${isIndeterminate ? 'in progress' : `${progressValue}%`}`}
      {...progressProps}
    >
      <div
        className={cn(
          'h-full rounded-full transition-all duration-300 ease-in-out',
          variant === 'default' && 'bg-primary',
          variant === 'secondary' && 'bg-secondary', 
          variant === 'accent' && 'bg-accent',
          isIndeterminate && animated && 'animate-pulse',
          !isIndeterminate && `w-[${Math.min(100, Math.max(0, progressValue))}%]`,
          isIndeterminate && 'w-full'
        )}
      />
    </div>
  );
}