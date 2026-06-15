import { AlertTriangle, RefreshCw, Terminal } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface DataErrorProps {
  message?: string | null;
  onRetry?: () => void;
}

export default function DataError({ message, onRetry }: DataErrorProps) {
  const { language } = useLanguage();
  const isZh = language === 'zh';

  return (
    <div className="glass-panel flex h-64 flex-col items-center justify-center rounded-2xl p-8">
      <AlertTriangle className="mb-4 h-12 w-12 text-orange-400" />
      <h3 className="mb-2 text-lg font-medium text-slate-200">
        {isZh ? '数据加载失败' : 'Data Load Failed'}
      </h3>
      <p className="mb-6 max-w-md text-center text-sm text-slate-400">
        {message || (isZh ? '无法加载分析数据，请检查数据文件是否存在。' : 'Unable to load analysis data. Check whether data files exist.')}
      </p>
      <div className="mb-6 max-w-lg rounded-lg bg-slate-800/50 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm text-cyan-400">
          <Terminal className="h-4 w-4" />
          <span className="font-medium">{isZh ? '生成数据命令' : 'Data generation command'}</span>
        </div>
        <code className="block rounded bg-slate-900/50 px-3 py-2 text-xs text-slate-300">
          cd scripts && Rscript run_all_analyses.R
        </code>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-2 rounded-lg bg-cyan-500/20 px-4 py-2 text-cyan-400 transition-colors hover:bg-cyan-500/30"
        >
          <RefreshCw className="h-4 w-4" />
          {isZh ? '重试' : 'Retry'}
        </button>
      )}
    </div>
  );
}
