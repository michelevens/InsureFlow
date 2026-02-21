import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'shield' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const baseStyles = `inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]`;

    const variants = {
      primary: 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg focus:ring-slate-500',
      secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 hover:shadow-md focus:ring-slate-400',
      outline: 'border-2 border-slate-300 text-slate-700 bg-transparent hover:border-slate-400 hover:bg-slate-50 focus:ring-slate-400',
      ghost: 'text-slate-700 bg-transparent hover:bg-slate-100 focus:ring-slate-400',
      shield: 'bg-gradient-to-r from-shield-600 to-confidence-600 text-white hover:from-shield-700 hover:to-confidence-700 hover:shadow-shield-lg focus:ring-shield-500 shadow-shield',
      danger: 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg focus:ring-red-500',
    };

    const sizes = {
      sm: 'text-sm px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2.5 gap-2',
      lg: 'text-base px-6 py-3 gap-2',
      xl: 'text-lg px-8 py-4 gap-3',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
export { Button };
