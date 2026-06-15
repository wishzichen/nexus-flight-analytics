import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSearch,
  Filter,
  Loader2,
  Search,
  Trash2,
} from 'lucide-react';
import { getLocalizedFields } from '../lib/fieldMetadata.js';
import { useLanguage } from '../contexts/LanguageContext';
import { delayLevelKey, localizeDelayLevel } from '../lib/displayLocalization';
import { cachedJson } from '../lib/preloadData';

type Flight = Record<string, any>;

type SearchResponse = {
  data: Flight[];
  total: number;
  page: number;
  pageSize: number;
};

type SummaryStats = {
  totalRecords: number;
  avgDepDelay: number;
  avgArrDelay?: number;
  avgDistance: number;
  uniqueAirlines: number;
  uniqueRoutes: number;
};

type OptionRow = Record<string, any> & { count?: number };

const pageSizeOptions = [10, 20, 50, 100, 200];
const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_FILTERS = { q: '', airline: '', destination: '', delayLevel: '' };

function getDelayColor(delay: number) {
  if (delay <= 0) return 'text-green-400';
  if (delay <= 15) return 'text-cyan-400';
  if (delay <= 60) return 'text-yellow-400';
  return 'text-red-400';
}

function delayBadgeClass(level: string) {
  const key = delayLevelKey(level);
  if (key === 'onTime') return 'bg-green-500/20 text-green-400';
  if (key === 'light') return 'bg-cyan-500/20 text-cyan-400';
  if (key === 'moderate') return 'bg-yellow-500/20 text-yellow-400';
  if (key === 'missing') return 'bg-slate-500/20 text-slate-400';
  return 'bg-red-500/20 text-red-400';
}

export default function Module8DataExplorer() {
  const { language, t } = useLanguage();
  const unit = {
    minute: language === 'zh' ? '分钟' : 'min',
    mile: language === 'zh' ? '英里' : 'mi',
  };
  const fields = useMemo(() => getLocalizedFields(language), [language]);
  const visibleFields = useMemo(
    () => fields.filter((field: any) => !['year', 'month', 'day', 'hour', 'weekday', 'weekdayName'].includes(field.fid)),
    [fields],
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [tempFilters, setTempFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [flightList, setFlightList] = useState<Flight[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [jumpPageInput, setJumpPageInput] = useState('');
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportRange, setExportRange] = useState({ startPage: '', endPage: '' });
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [airlineOptions, setAirlineOptions] = useState<OptionRow[]>([]);
  const [destOptions, setDestOptions] = useState<OptionRow[]>([]);
  const [delayLevelOptions, setDelayLevelOptions] = useState<OptionRow[]>([]);
  const [optionsLoaded, setOptionsLoaded] = useState(false);

  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const hasActiveFilters = Object.values(appliedFilters).some(Boolean);
  const hasTempFilters = Object.values(tempFilters).some(Boolean);
  const visibleStart = totalRecords > 0 ? ((page - 1) * pageSize) + 1 : 0;
  const visibleEnd = Math.min(page * pageSize, totalRecords);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      cachedJson<SummaryStats>('/api/module8/summary').catch(() => null),
      cachedJson<OptionRow[]>('/api/module8/airline-options').catch(() => []),
      cachedJson<OptionRow[]>('/api/module8/dest-options').catch(() => []),
      cachedJson<OptionRow[]>('/api/module8/delay-level-options').catch(() => []),
    ]).then(([summaryData, airlines, destinations, delays]) => {
      if (!mounted) return;
      if (summaryData) setSummary(summaryData);
      setAirlineOptions(airlines || []);
      setDestOptions(destinations || []);
      setDelayLevelOptions(delays || []);
      setOptionsLoaded(true);
    }).catch(() => {
      if (mounted) setOptionsLoaded(true);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const searchFlights = useCallback(async (filters: typeof appliedFilters, pageNum: number, size: number) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        pageSize: String(size),
      });
      if (filters.q) params.append('q', filters.q);
      if (filters.airline) params.append('airline', filters.airline);
      if (filters.destination) params.append('destination', filters.destination);
      if (filters.delayLevel) params.append('delayLevel', filters.delayLevel);

      const data = await cachedJson<SearchResponse>(`/api/module8/search?${params.toString()}`);
      setFlightList((data.data || []).map((flight) => ({ ...flight, flightNumber: String(flight.flightNumber ?? '') })));
      setTotalRecords(data.total || 0);
    } catch (error) {
      console.error('Flight search failed:', error);
      setFlightList([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    searchFlights(DEFAULT_FILTERS, 1, DEFAULT_PAGE_SIZE);
  }, [searchFlights]);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    searchFlights(appliedFilters, 1, newSize);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    searchFlights(appliedFilters, newPage, pageSize);
  };

  const handleApplyFilters = () => {
    setPage(1);
    setAppliedFilters({ ...tempFilters });
    searchFlights({ ...tempFilters }, 1, pageSize);
  };

  const handleResetFilters = () => {
    setTempFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setPage(1);
    searchFlights(DEFAULT_FILTERS, 1, pageSize);
  };

  const handleJumpToPage = () => {
    const targetPage = Number.parseInt(jumpPageInput, 10);
    if (targetPage >= 1 && targetPage <= totalPages) {
      handlePageChange(targetPage);
      setJumpPageInput('');
    }
  };

  const handleExport = async (mode: 'all' | 'current' | 'range') => {
    setExporting(true);
    setShowExportMenu(false);
    try {
      const params = new URLSearchParams({ exportMode: mode, lang: language });
      if (appliedFilters.q) params.append('q', appliedFilters.q);
      if (appliedFilters.airline) params.append('airline', appliedFilters.airline);
      if (appliedFilters.destination) params.append('destination', appliedFilters.destination);
      if (appliedFilters.delayLevel) params.append('delayLevel', appliedFilters.delayLevel);

      if (mode === 'current') {
        params.append('page', String(page));
        params.append('pageSize', String(pageSize));
      } else if (mode === 'range') {
        const start = Number.parseInt(exportRange.startPage, 10);
        const end = Number.parseInt(exportRange.endPage, 10);
        if (!Number.isFinite(start) || !Number.isFinite(end) || start < 1 || end > totalPages || start > end) {
          alert(language === 'zh' ? `请输入 1-${totalPages} 内的有效页码范围` : `Enter a valid page range within 1-${totalPages}`);
          return;
        }
        params.append('startPage', String(start));
        params.append('endPage', String(end));
        params.append('pageSize', String(pageSize));
      }

      const response = await fetch(`/api/module8/export?${params.toString()}`);
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `flights_${mode}_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
      alert(language === 'zh' ? '导出失败，请重试' : 'Export failed. Please retry.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="glass-panel rounded-xl p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            { label: t('explorer.totalRecords'), value: summary?.totalRecords?.toLocaleString() || '--', color: 'text-cyan-300' },
            { label: t('explorer.avgDepDelay'), value: `${summary?.avgDepDelay ?? '--'} ${unit.minute}`, color: 'text-orange-300' },
            { label: t('explorer.avgDistance'), value: `${summary?.avgDistance?.toLocaleString() || '--'} ${unit.mile}`, color: 'text-violet-300' },
            { label: t('explorer.airlineCount'), value: summary?.uniqueAirlines || '--', color: 'text-emerald-300' },
            { label: t('explorer.routeCount'), value: summary?.uniqueRoutes || '--', color: 'text-sky-300' },
          ].map((item) => (
            <div key={item.label} className="min-w-0 border-l border-white/10 px-3 first:border-l-0">
              <div className="truncate text-xs text-slate-500">{item.label}</div>
              <div className={`mt-1 truncate text-lg font-semibold ${item.color}`}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-xl p-4">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(280px,1fr)_180px_180px_160px_auto]">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-400" />
            <input
              type="text"
              placeholder={t('explorer.searchPlaceholder')}
              value={tempFilters.q}
              onChange={(event) => setTempFilters({ ...tempFilters, q: event.target.value })}
              onKeyDown={(event) => event.key === 'Enter' && handleApplyFilters()}
              className="w-full rounded-lg border border-cyan-500/25 bg-slate-900/70 py-2.5 pl-11 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/15"
            />
          </div>

          <select
            value={tempFilters.airline}
            onChange={(event) => setTempFilters({ ...tempFilters, airline: event.target.value })}
            disabled={!optionsLoaded}
            className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none disabled:cursor-wait disabled:opacity-60"
          >
            <option value="">{t('filter.all')} {t('filter.airlines')}</option>
            {airlineOptions.slice(0, 40).map((airline) => (
              <option key={airline.airlineCode || airline.carrier} value={airline.airlineCode || airline.carrier}>
                {airline.airlineName || airline.carrier_name || airline.airlineCode} ({airline.count?.toLocaleString?.()})
              </option>
            ))}
          </select>

          <select
            value={tempFilters.destination}
            onChange={(event) => setTempFilters({ ...tempFilters, destination: event.target.value })}
            disabled={!optionsLoaded}
            className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none disabled:cursor-wait disabled:opacity-60"
          >
            <option value="">{t('filter.all')} {t('filter.destinations')}</option>
            {destOptions.slice(0, 40).map((dest) => (
              <option key={dest.arrivalAirport || dest.dest} value={dest.arrivalAirport || dest.dest}>
                {dest.arrivalAirportName || dest.dest_name || dest.arrivalAirport} ({dest.count?.toLocaleString?.()})
              </option>
            ))}
          </select>

          <select
            value={tempFilters.delayLevel}
            onChange={(event) => setTempFilters({ ...tempFilters, delayLevel: event.target.value })}
            disabled={!optionsLoaded}
            className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none disabled:cursor-wait disabled:opacity-60"
          >
            <option value="">{t('filter.all')} {t('filter.delayLevels')}</option>
            {delayLevelOptions.map((delay) => (
              <option key={delay.delayLevel || delay.category} value={delay.delayLevel || delay.category}>
                {localizeDelayLevel(delay.delayLevel || delay.category, language)} ({delay.count?.toLocaleString?.()})
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetFilters}
              disabled={!hasActiveFilters && !hasTempFilters}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-slate-900/70 text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              title={t('explorer.reset')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleApplyFilters}
              disabled={loading}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-cyan-500 px-4 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400 disabled:cursor-wait disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}
              {hasTempFilters ? t('explorer.search') : t('explorer.apply')}
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {hasActiveFilters && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-cyan-300">
              <Filter className="h-3.5 w-3.5" />
              {t('explorer.activeFilter')}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/50 px-2.5 py-1">
            {t('explorer.hit')} <strong className="font-semibold text-cyan-300">{totalRecords.toLocaleString()}</strong> {t('explorer.records')}
          </span>
          {hasSearched && totalRecords > 0 && !loading && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">
              <Check className="h-3.5 w-3.5" />
              {t('status.complete')}
            </span>
          )}
          {loading && flightList.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-cyan-300">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t('status.searching')}
            </span>
          )}
          {!optionsLoaded && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/50 px-2.5 py-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t('status.loadingData')}
            </span>
          )}
          </div>
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-900/30 p-4">
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-200">{t('explorer.title')}</div>
            <div className="mt-1 text-xs text-slate-500">
              {totalRecords > 0
                ? `${visibleStart.toLocaleString()} - ${visibleEnd.toLocaleString()} / ${totalRecords.toLocaleString()}`
                : t('status.noData')}
            </div>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu((current) => !current)}
              disabled={exporting || totalRecords === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/15 px-3 py-2 text-sm font-medium text-emerald-200 transition-colors hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {t('explorer.export')}
            </button>
            {showExportMenu && !exporting && (
              <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-white/10 bg-slate-800 shadow-2xl">
                <button type="button" onClick={() => handleExport('all')} className="w-full border-b border-white/5 px-4 py-3 text-left text-sm text-white hover:bg-white/5">
                  {t('explorer.exportAll')}
                </button>
                <button type="button" onClick={() => handleExport('current')} className="w-full border-b border-white/5 px-4 py-3 text-left text-sm text-white hover:bg-white/5">
                  {t('explorer.exportCurrent')}
                </button>
                <div className="space-y-3 px-4 py-3">
                  <div className="text-sm font-medium text-white">{t('explorer.exportRange')}</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={exportRange.startPage}
                      onChange={(event) => setExportRange({ ...exportRange, startPage: event.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-slate-700 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={exportRange.endPage}
                      onChange={(event) => setExportRange({ ...exportRange, endPage: event.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-slate-700 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExport('range')}
                    disabled={!exportRange.startPage || !exportRange.endPage}
                    className="w-full rounded-lg bg-purple-500 px-3 py-2 text-sm font-medium text-white hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t('explorer.exportRange')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-slate-800/50 text-slate-400">
                {visibleFields.map((field: any) => (
                  <th key={field.fid} className="whitespace-nowrap p-3 text-left">{field.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && flightList.length === 0 ? (
                <tr>
                  <td colSpan={visibleFields.length} className="p-8 text-center text-cyan-400">
                    <Loader2 className="mr-2 inline h-5 w-5 animate-spin" />
                    {t('status.searching')}
                  </td>
                </tr>
              ) : flightList.length > 0 ? (
                flightList.map((flight, index) => (
                  <tr key={`${flight.uniqueKey || flight.flightNumber}-${index}`} className="border-b border-white/5 text-slate-300 transition-colors hover:bg-white/5">
                    {visibleFields.map((field: any) => {
                      const value = flight[field.fid];
                      if (field.fid === 'departureDelay' || field.fid === 'arrivalDelay') {
                        return <td key={field.fid} className={`whitespace-nowrap p-3 font-medium ${getDelayColor(Number(value || 0))}`}>{value ?? '--'} {unit.minute}</td>;
                      }
                      if (field.fid === 'flightDistance') {
                        return <td key={field.fid} className="whitespace-nowrap p-3">{value?.toLocaleString?.() || value || '--'} {unit.mile}</td>;
                      }
                      if (field.fid === 'flightTime') {
                        return <td key={field.fid} className="whitespace-nowrap p-3">{value ? `${value} ${unit.minute}` : '--'}</td>;
                      }
                      if (field.fid === 'flightSpeed') {
                        return <td key={field.fid} className="whitespace-nowrap p-3">{value ? `${Number(value).toFixed(0)} mph` : '--'}</td>;
                      }
                      if (field.fid === 'delayLevel') {
                        return (
                          <td key={field.fid} className="whitespace-nowrap p-3">
                            <span className={`rounded px-2 py-0.5 text-xs ${delayBadgeClass(String(value || ''))}`}>
                              {value ? localizeDelayLevel(value, language) : '--'}
                            </span>
                          </td>
                        );
                      }
                      return <td key={field.fid} className="whitespace-nowrap p-3">{value || '--'}</td>;
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={visibleFields.length} className="p-12 text-center text-slate-400">
                    {t('status.noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 bg-slate-900/30 p-4">
          <div className="text-sm text-slate-400">
            {t('explorer.page')} <span className="font-semibold text-cyan-400">{page}</span> / {totalPages.toLocaleString()}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || loading}
              className="rounded-xl border border-white/5 bg-slate-800 p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || loading}
              className="rounded-xl border border-white/5 bg-slate-800 p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{t('explorer.jump')}</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpPageInput}
                onChange={(event) => setJumpPageInput(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleJumpToPage()}
                className="w-16 rounded-lg border border-white/15 bg-slate-800 px-2 py-1.5 text-center text-sm text-cyan-400 focus:border-cyan-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleJumpToPage}
                disabled={!jumpPageInput || loading}
                className="rounded-lg border border-cyan-500/30 bg-cyan-500/20 px-3 py-1.5 text-sm font-medium text-cyan-400 transition-colors hover:bg-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t('explorer.jump')}
              </button>
            </div>
            <div className="flex items-center gap-2 border-l border-white/10 pl-3">
              <span className="text-xs text-slate-400">{t('explorer.pageSize')}</span>
              <select
                value={pageSize}
                onChange={(event) => handlePageSizeChange(Number.parseInt(event.target.value, 10))}
                className="rounded-lg border border-white/15 bg-slate-800 px-2 py-1.5 text-sm text-cyan-400 focus:border-cyan-500 focus:outline-none"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
