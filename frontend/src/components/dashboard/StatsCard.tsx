import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface StatsCardProps {
  title?: string;
  label?: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: ReactNode;
  iconColor?: string;
  variant?: 'default' | 'savings';
}

export function StatsCard({ title, label, value, change, changeType = 'neutral', icon, iconColor, variant = 'default' }: StatsCardProps) {
  const displayTitle = title || label || '';
  const defaultIconColor = variant === 'savings' ? 'bg-green-100 text-green-600' : 'bg-shield-100 text-shield-600';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 hover-lift">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{displayTitle}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {change && (
            <p className={cn(
              'text-sm font-medium mt-1',
              changeType === 'positive' && 'text-green-600',
              changeType === 'negative' && 'text-red-600',
              changeType === 'neutral' && 'text-slate-500',
            )}>
              {change}
            </p>
          )}
        </div>
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', iconColor || defaultIconColor)}>
          {icon}
        </div>
      </div>
    </div>
  );
}
