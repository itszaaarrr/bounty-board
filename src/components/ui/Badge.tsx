import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';
type BadgeSize = 'sm' | 'md';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-semibold rounded-full',
          {
            'px-2 py-0.5 text-xs': size === 'sm',
            'px-3 py-1 text-xs': size === 'md',
          },
          {
            'bg-neutral-100 text-neutral-700': variant === 'default',
            'bg-neutral-200 text-neutral-700': variant === 'secondary',
            'bg-green-50 text-green-700': variant === 'success',
            'bg-amber-50 text-amber-700': variant === 'warning',
            'bg-red-50 text-red-700': variant === 'destructive',
            'border border-neutral-300 bg-white text-neutral-600': variant === 'outline',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
export type { BadgeProps, BadgeVariant, BadgeSize };
