import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectOption { value: string; label: string }
interface SelectOptionGroup { label: string; options: SelectOption[] }

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  groups?: SelectOptionGroup[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, groups, placeholder, id, ...props }, ref) => {
    const selectId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full px-4 py-3 rounded-xl border-2 bg-white text-slate-900 appearance-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-shield-500/30 dark:bg-slate-800 dark:text-white dark:focus:ring-shield-400/30',
              error ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-shield-500 hover:border-slate-300 dark:border-slate-600 dark:focus:border-shield-400 dark:hover:border-slate-500',
              className
            )}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {groups ? groups.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </optgroup>
            )) : options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
        </div>
        {error && <p role="alert" className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
export { Select };
