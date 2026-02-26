import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'shield' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'sm' | 'md';
}

export function Badge({ className, variant = 'default', size = 'sm', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
    shield: 'bg-shield-100 text-shield-700 dark:bg-shield-900/50 dark:text-shield-300',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    info: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300',
    outline: 'border border-slate-300 text-slate-600 bg-transparent dark:border-slate-600 dark:text-slate-300',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  return (
    <span
      className={cn('inline-flex items-center font-medium rounded-full', variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
