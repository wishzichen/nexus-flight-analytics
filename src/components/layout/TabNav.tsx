import React from 'react';
import {
  LayoutDashboard, Clock, Map, Plane, Building,
  GitBranch, PieChart, Table
} from 'lucide-react';

interface TabNavProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const tabs = [
  { id: 'overview', name: '总览', icon: LayoutDashboard, color: 'cyan' },
  { id: 'time', name: '时间规律', icon: Clock, color: 'purple' },
  { id: 'routes', name: '航线分析', icon: Map, color: 'orange' },
  { id: 'recovery', name: '空中追回', icon: Plane, color: 'green' },
  { id: 'airlines', name: '航司表现', icon: Building, color: 'blue' },
  { id: 'propagation', name: '延误传导', icon: GitBranch, color: 'red' },
  { id: 'attribution', name: '延误归因', icon: PieChart, color: 'pink' },
  { id: 'explorer', name: '数据探索', icon: Table, color: 'indigo' },
];

export default function TabNav({ activeTab, onTabChange }: TabNavProps) {
  return (
    <div className="flex overflow-x-auto scrollbar-hide px-6 py-2 gap-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap
              transition-all duration-200 rounded-lg
              ${isActive
                ? `text-white bg-${tab.color}-500/20 border border-${tab.color}-500/30`
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }
            `}
          >
            <Icon className={`w-4 h-4 ${isActive ? `text-${tab.color}-400` : ''}`} />
            <span>{tab.name}</span>
          </button>
        );
      })}
    </div>
  );
}

export { tabs };