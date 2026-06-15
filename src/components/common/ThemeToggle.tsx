import { Moon, Sun } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  variant?: 'default' | 'inline';
}

export default function ThemeToggle({ variant = 'default' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const { language } = useLanguage();
  const isInline = variant === 'inline';
  const label = theme === 'dark'
    ? (language === 'zh' ? '切换到日间模式' : 'Switch to light mode')
    : (language === 'zh' ? '切换到夜间模式' : 'Switch to dark mode');

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`${isInline ? 'fixed right-6 top-24' : 'relative'} z-50 rounded-xl border border-white/10 bg-gradient-to-br from-cyan-500 to-blue-600 p-3 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl dark:from-slate-700 dark:to-slate-800`}
      title={label}
      aria-label={label}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-white transition-transform duration-500" />
      ) : (
        <Moon className="h-5 w-5 text-white transition-transform duration-500" />
      )}
    </button>
  );
}
