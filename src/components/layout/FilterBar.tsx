import React from 'react';
import { Filter, X } from 'lucide-react';

interface FilterOption {
  [key: string]: string | number;
  count: number;
}

interface FilterBarProps {
  months?: FilterOption[];
  airlines?: FilterOption[];
  origins?: FilterOption[];
  destinations?: FilterOption[];
  filters: {
    month?: string;
    airline?: string;
    origin?: string;
    destination?: string;
  };
  onFilterChange: (filters: any) => void;
}

export default function FilterBar({
  months,
  airlines,
  origins,
  destinations,
  filters,
  onFilterChange
}: FilterBarProps) {
  const handleChange = (key: string, value: string) => {
    onFilterChange({ ...filters, [key]: value === 'all' ? undefined : value });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const hasFilters = Object.values(filters).some(v => v !== undefined);

  return (
    <div className="glass-panel p-4 rounded-xl mb-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-slate-400">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">筛选条件：</span>
        </div>

        {/* 月份筛选 */}
        {months && (
          <select
            value={filters.month || 'all'}
            onChange={(e) => handleChange('month', e.target.value)}
            className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">全部月份</option>
            {months.map((m: any) => (
              <option key={m.month} value={m.month}>
                {m.monthName || `${m.month}月`} ({m.count?.toLocaleString()})
              </option>
            ))}
          </select>
        )}

        {/* 航司筛选 */}
        {airlines && (
          <select
            value={filters.airline || 'all'}
            onChange={(e) => handleChange('airline', e.target.value)}
            className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">全部航司</option>
            {airlines.map((a: any) => (
              <option key={a.airlineCode || a.carrier} value={a.airlineCode || a.carrier}>
                {a.airlineName || a.carrier_name} ({a.count?.toLocaleString()})
              </option>
            ))}
          </select>
        )}

        {/* 出发机场筛选 */}
        {origins && (
          <select
            value={filters.origin || 'all'}
            onChange={(e) => handleChange('origin', e.target.value)}
            className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">全部出发机场</option>
            {origins.map((o: any) => (
              <option key={o.departureAirport || o.origin} value={o.departureAirport || o.origin}>
                {o.departureAirportName || o.origin_name || o.departureAirport || o.origin}
              </option>
            ))}
          </select>
        )}

        {/* 目的地筛选 */}
        {destinations && (
          <select
            value={filters.destination || 'all'}
            onChange={(e) => handleChange('destination', e.target.value)}
            className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">全部目的地</option>
            {destinations.map((d: any) => (
              <option key={d.arrivalAirport || d.dest} value={d.arrivalAirport || d.dest}>
                {d.arrivalAirportName || d.dest_name || d.arrivalAirport || d.dest}
              </option>
            ))}
          </select>
        )}

        {/* 清除筛选 */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <X className="w-3 h-3" />
            清除筛选
          </button>
        )}
      </div>
    </div>
  );
}
