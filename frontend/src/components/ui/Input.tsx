import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">{leftIcon}</div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : undefined}
            className={cn(
              'w-full px-4 py-3 rounded-xl border-2 bg-white text-slate-900 placeholder:text-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-shield-500/30 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-shield-400/30',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error
                ? 'border-red-400 focus:border-red-500'
                : 'border-slate-200 focus:border-shield-500 hover:border-slate-300 dark:border-slate-600 dark:focus:border-shield-400 dark:hover:border-slate-500',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">{rightIcon}</div>
          )}
        </div>
        {error && <p role="alert" className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export { Input };
