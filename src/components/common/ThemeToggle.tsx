import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  variant?: 'default' | 'inline';
}

export default function ThemeToggle({ variant = 'default' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isInline = variant === 'inline';

  return (
    <button
      onClick={toggleTheme}
      className={`${isInline ? 'fixed top-24 right-6' : 'relative'} z-50 p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 dark:from-slate-700 dark:to-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group border border-white/10`}
      title={theme === 'dark' ? '切换到日间模式' : '切换到夜间模式'}
      aria-label={theme === 'dark' ? '切换到日间模式' : '切换到夜间模式'}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-white group-hover:rotate-180 transition-transform duration-500" />
      ) : (
        <Moon className="w-5 h-5 text-white group-hover:-rotate-12 transition-transform duration-500" />
      )}
    </button>
  );
}
