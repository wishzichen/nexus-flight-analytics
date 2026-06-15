import {
  BarChart3,
  Building,
  Clock,
  FileText,
  GitBranch,
  LayoutDashboard,
  Map,
  PieChart,
  Plane,
  Table,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface TabNavProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const tabs = [
  { id: 'overview', labelKey: 'tab.overview', icon: LayoutDashboard, color: 'cyan' },
  { id: 'report', labelKey: 'tab.report', icon: FileText, color: 'green' },
  { id: 'time', labelKey: 'tab.time', icon: Clock, color: 'purple' },
  { id: 'routes', labelKey: 'tab.routes', icon: Map, color: 'orange' },
  { id: 'recovery', labelKey: 'tab.recovery', icon: Plane, color: 'green' },
  { id: 'airlines', labelKey: 'tab.airlines', icon: Building, color: 'blue' },
  { id: 'propagation', labelKey: 'tab.propagation', icon: GitBranch, color: 'red' },
  { id: 'attribution', labelKey: 'tab.attribution', icon: PieChart, color: 'pink' },
  { id: 'explorer', labelKey: 'tab.explorer', icon: Table, color: 'indigo' },
  { id: 'eda', labelKey: 'tab.eda', icon: BarChart3, color: 'cyan' },
];

const activeClasses: Record<string, string> = {
  cyan: 'text-white bg-cyan-500/20 border-cyan-500/30',
  purple: 'text-white bg-purple-500/20 border-purple-500/30',
  orange: 'text-white bg-orange-500/20 border-orange-500/30',
  green: 'text-white bg-green-500/20 border-green-500/30',
  blue: 'text-white bg-blue-500/20 border-blue-500/30',
  red: 'text-white bg-red-500/20 border-red-500/30',
  pink: 'text-white bg-pink-500/20 border-pink-500/30',
  indigo: 'text-white bg-indigo-500/20 border-indigo-500/30',
};

const iconClasses: Record<string, string> = {
  cyan: 'text-cyan-400',
  purple: 'text-purple-400',
  orange: 'text-orange-400',
  green: 'text-green-400',
  blue: 'text-blue-400',
  red: 'text-red-400',
  pink: 'text-pink-400',
  indigo: 'text-indigo-400',
};

export default function TabNav({ activeTab, onTabChange }: TabNavProps) {
  const { t } = useLanguage();

  return (
    <div className="scrollbar-hide flex snap-x gap-1 overflow-x-auto px-4 py-2 sm:px-6">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            title={t(tab.labelKey)}
            className={`flex min-w-fit shrink-0 snap-start items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
              isActive
                ? activeClasses[tab.color]
                : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            <Icon className={`h-4 w-4 ${isActive ? iconClasses[tab.color] : ''}`} />
            <span>{t(tab.labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
}
