import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-slate-700 mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full px-4 py-3 rounded-xl border-2 bg-white text-slate-900 placeholder:text-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-shield-500/30 resize-y min-h-[100px]',
            error ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-shield-500 hover:border-slate-300',
            className
          )}
          {...props}
        />
        {error && <p role="alert" className="mt-1.5 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export { Textarea };
