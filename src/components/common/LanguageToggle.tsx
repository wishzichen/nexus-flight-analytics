import { Languages } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function LanguageToggle() {
  const { language, toggleLanguage, t } = useLanguage();
  const handleToggle = () => {
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    toggleLanguage();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.scrollTo(scrollX, scrollY));
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={t('nav.language')}
      className="filter-control grid h-10 w-[132px] shrink-0 grid-cols-[24px_1fr] items-center rounded-lg px-2 text-sm transition-colors"
    >
      <Languages className="h-4 w-4 justify-self-center text-cyan-400" />
      <span className="relative grid h-7 grid-cols-2 rounded-md bg-slate-950/50 p-0.5 text-[11px] font-semibold">
        <span
          className={`absolute top-0.5 h-6 w-[calc(50%-2px)] rounded bg-cyan-400 transition-transform ${
            language === 'en' ? 'translate-x-full' : 'translate-x-0'
          }`}
        />
        <span className={`relative z-10 flex items-center justify-center ${language === 'zh' ? 'text-slate-950' : 'text-slate-400'}`}>
          中
        </span>
        <span className={`relative z-10 flex items-center justify-center ${language === 'en' ? 'text-slate-950' : 'text-slate-400'}`}>
          EN
        </span>
      </span>
    </button>
  );
}
