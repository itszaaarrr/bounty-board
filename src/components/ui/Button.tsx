import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-all rounded-lg active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg active:bg-blue-800 shadow-sm': variant === 'primary',
            'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 hover:shadow-md active:bg-neutral-300 transition-all': variant === 'secondary',
            'border border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 hover:shadow-md active:bg-neutral-100': variant === 'outline',
            'text-neutral-700 hover:bg-neutral-100 hover:shadow-sm active:bg-neutral-200': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg active:bg-red-800 shadow-sm': variant === 'destructive',
          },
          {
            'text-xs px-3 py-1.5 h-8': size === 'sm',
            'text-sm px-4 py-2 h-10': size === 'md',
            'text-base px-6 py-3 h-12': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };
