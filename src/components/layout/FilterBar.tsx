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
  onFilterChange,
}: FilterBarProps) {
  const handleChange = (key: string, value: string) => {
    onFilterChange({ ...filters, [key]: value === 'all' ? undefined : value });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const hasFilters = Object.values(filters).some((value) => value !== undefined);

  return (
    <div className="glass-panel mb-6 rounded-xl p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-slate-400">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">筛选条件：</span>
        </div>

        {months && (
          <select
            value={filters.month || 'all'}
            onChange={(event) => handleChange('month', event.target.value)}
            className="rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">全部月份</option>
            {months.map((month: any) => (
              <option key={month.month} value={month.month}>
                {month.monthName || `${month.month}月`} ({month.count?.toLocaleString()})
              </option>
            ))}
          </select>
        )}

        {airlines && (
          <select
            value={filters.airline || 'all'}
            onChange={(event) => handleChange('airline', event.target.value)}
            className="rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">全部航司</option>
            {airlines.map((airline: any) => (
              <option key={airline.airlineCode || airline.carrier} value={airline.airlineCode || airline.carrier}>
                {airline.airlineName || airline.carrier_name} ({airline.count?.toLocaleString()})
              </option>
            ))}
          </select>
        )}

        {origins && (
          <select
            value={filters.origin || 'all'}
            onChange={(event) => handleChange('origin', event.target.value)}
            className="rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">全部出发机场</option>
            {origins.map((origin: any) => (
              <option key={origin.departureAirport || origin.origin} value={origin.departureAirport || origin.origin}>
                {origin.departureAirportName || origin.origin_name || origin.departureAirport || origin.origin}
              </option>
            ))}
          </select>
        )}

        {destinations && (
          <select
            value={filters.destination || 'all'}
            onChange={(event) => handleChange('destination', event.target.value)}
            className="rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">全部目的地</option>
            {destinations.map((destination: any) => (
              <option
                key={destination.arrivalAirport || destination.dest}
                value={destination.arrivalAirport || destination.dest}
              >
                {destination.arrivalAirportName || destination.dest_name || destination.arrivalAirport || destination.dest}
              </option>
            ))}
          </select>
        )}

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
          >
            <X className="h-3 w-3" />
            清除筛选
          </button>
        )}
      </div>
    </div>
  );
}
