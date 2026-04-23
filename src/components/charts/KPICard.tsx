import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  color?: 'cyan' | 'purple' | 'orange' | 'green' | 'red' | 'blue' | 'pink' | 'indigo';
  trend?: {
    value: number;
    label: string;
  };
}

const colorConfig = {
  cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', gradient: 'from-cyan-500/20 to-transparent' },
  purple: { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', gradient: 'from-purple-500/20 to-transparent' },
  orange: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', gradient: 'from-orange-500/20 to-transparent' },
  green: { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', gradient: 'from-green-500/20 to-transparent' },
  red: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', gradient: 'from-red-500/20 to-transparent' },
  blue: { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', gradient: 'from-blue-500/20 to-transparent' },
  pink: { text: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20', gradient: 'from-pink-500/20 to-transparent' },
  indigo: { text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', gradient: 'from-indigo-500/20 to-transparent' },
};

export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'cyan',
  trend
}: KPICardProps) {
  const config = colorConfig[color];

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${config.border} ${config.bg} p-5 hover:scale-[1.02] transition-transform duration-300`}>
      {/* 背景渐变 */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-50`} />

      {/* 内容 */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {title}
          </div>
          {Icon && (
            <div className={`p-2 rounded-lg ${config.bg}`}>
              <Icon className={`w-4 h-4 ${config.text}`} />
            </div>
          )}
        </div>

        <div className="text-3xl font-bold text-white mb-1">
          {value}
        </div>

        {subtitle && (
          <div className="text-sm text-slate-400">
            {subtitle}
          </div>
        )}

        {trend && (
          <div className={`text-xs mt-2 ${trend.value >= 0 ? 'text-red-400' : 'text-green-400'}`}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
          </div>
        )}
      </div>
    </div>
  );
}