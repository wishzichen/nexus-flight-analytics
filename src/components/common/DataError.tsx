import React from 'react';
import { AlertTriangle, RefreshCw, Terminal } from 'lucide-react';

interface DataErrorProps {
  message?: string;
  onRetry?: () => void;
}

export default function DataError({ message, onRetry }: DataErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 glass-panel rounded-2xl p-8">
      <AlertTriangle className="w-12 h-12 text-orange-400 mb-4" />
      <h3 className="text-lg font-medium text-slate-200 mb-2">数据加载失败</h3>
      <p className="text-sm text-slate-400 text-center max-w-md mb-6">
        {message || '无法加载分析数据，请检查数据文件是否存在。'}
      </p>
      <div className="bg-slate-800/50 rounded-lg p-4 mb-6 max-w-lg">
        <div className="flex items-center gap-2 text-cyan-400 text-sm mb-2">
          <Terminal className="w-4 h-4" />
          <span className="font-medium">请运行以下命令生成数据：</span>
        </div>
        <code className="text-xs text-slate-300 bg-slate-900/50 px-3 py-2 rounded block">
          cd scripts && Rscript run_all_analyses.R
        </code>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          重试
        </button>
      )}
    </div>
  );
}
