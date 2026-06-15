import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, Filter, Loader2, Plane, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TabNav from '../components/layout/TabNav';
import ThemeToggle from '../components/common/ThemeToggle';
import LanguageToggle from '../components/common/LanguageToggle';
import AIAssistant from '../components/assistant/AIAssistant';
import Module1Dashboard from '../modules/Module1Dashboard';
import ModuleReportSummary from '../modules/ModuleReportSummary';
import Module2TimeAnalysis from '../modules/Module2TimeAnalysis';
import Module3RouteAnalysis from '../modules/Module3RouteAnalysis';
import Module4AirRecovery from '../modules/Module4AirRecovery';
import Module5AirlineAnalysis from '../modules/Module5AirlineAnalysis';
import Module6DelayPropagation from '../modules/Module6DelayPropagation';
import Module7Attribution from '../modules/Module7Attribution';
import Module8DataExplorer from '../modules/Module8DataExplorer';
import { useLanguage, useTemplate } from '../contexts/LanguageContext';
import { FILTER_OPTION_ENDPOINTS, cachedJson, preloadDashboardData, preloadExplorerAndEdaData } from '../lib/preloadData';

const ModuleVisualEDA = lazy(() => import('../modules/ModuleVisualEDA'));

type FilterKey = 'years' | 'months' | 'airlines' | 'origins' | 'destinations' | 'delayLevels';
type InteractiveFilters = Record<FilterKey, string[]>;
type FilterOptionsState = Record<FilterKey, any[]>;

type FilterModel = {
  label: string;
  options: any[];
  valueKeys: string[];
  labelKeys: string[];
  fallbackKeys?: string[];
};

const FILTER_KEYS: FilterKey[] = ['years', 'months', 'airlines', 'origins', 'destinations', 'delayLevels'];
const NONE_FILTER_TOKEN = '__none__';

function createEmptyFilters(): InteractiveFilters {
  return {
    years: [],
    months: [],
    airlines: [],
    origins: [],
    destinations: [],
    delayLevels: [],
  };
}

function getOptionValue(option: any, keys: string[]) {
  for (const key of keys) {
    if (option?.[key] !== undefined && option?.[key] !== null) return String(option[key]);
  }
  return '';
}

function getOptionLabel(option: any, labelKeys: string[], fallbackKeys: string[]) {
  for (const key of labelKeys) {
    if (option?.[key]) return String(option[key]);
  }
  return getOptionValue(option, fallbackKeys);
}

function getAllOptionValues(options: any[], valueKeys: string[]) {
  const values = options.map((option) => getOptionValue(option, valueKeys)).filter(Boolean);
  return Array.from(new Set(values));
}

function normalizeSelection(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function sortedSelection(values: string[]) {
  return normalizeSelection(values).sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

function sameSelection(left: string[], right: string[]) {
  const leftValues = sortedSelection(left);
  const rightValues = sortedSelection(right);
  return leftValues.length === rightValues.length && leftValues.every((value, index) => value === rightValues[index]);
}

function sameFilters(left: InteractiveFilters, right: InteractiveFilters) {
  return FILTER_KEYS.every((key) => sameSelection(left[key], right[key]));
}

function buildFullFilters(models: Record<FilterKey, FilterModel>) {
  const nextFilters = createEmptyFilters();
  FILTER_KEYS.forEach((key) => {
    nextFilters[key] = getAllOptionValues(models[key].options, models[key].valueKeys);
  });
  return nextFilters;
}

function buildBaselineFilters(models: Record<FilterKey, FilterModel>) {
  const nextFilters = buildFullFilters(models);
  const yearValues = getAllOptionValues(models.years.options, models.years.valueKeys);
  if (yearValues.includes('2013')) nextFilters.years = ['2013'];
  return nextFilters;
}

function buildFilterQuery(filters: InteractiveFilters, models: Record<FilterKey, FilterModel>) {
  const params = new URLSearchParams();
  let hasExplicitFilters = false;

  FILTER_KEYS.forEach((key) => {
    const allValues = getAllOptionValues(models[key].options, models[key].valueKeys);
    const selectedValues = normalizeSelection(filters[key]);
    if (allValues.length === 0 || sameSelection(selectedValues, allValues)) return;

    hasExplicitFilters = true;
    params.set(key, selectedValues.length > 0 ? selectedValues.join(',') : NONE_FILTER_TOKEN);
  });

  return { params, hasExplicitFilters };
}

function getFilterModels(options: FilterOptionsState, labels: Record<FilterKey, string>): Record<FilterKey, FilterModel> {
  return {
    years: {
      label: labels.years,
      options: options.years.length ? options.years : [{ year: 2013, label: '2013' }],
      valueKeys: ['year'],
      labelKeys: ['label'],
    },
    months: {
      label: labels.months,
      options: options.months,
      valueKeys: ['month'],
      labelKeys: ['monthName', 'label'],
    },
    airlines: {
      label: labels.airlines,
      options: options.airlines,
      valueKeys: ['airlineCode', 'carrier'],
      labelKeys: ['airlineName', 'carrier_name'],
    },
    origins: {
      label: labels.origins,
      options: options.origins,
      valueKeys: ['departureAirport', 'origin'],
      labelKeys: ['departureAirportName', 'origin_name'],
    },
    destinations: {
      label: labels.destinations,
      options: options.destinations,
      valueKeys: ['arrivalAirport', 'dest'],
      labelKeys: ['arrivalAirportName', 'dest_name'],
    },
    delayLevels: {
      label: labels.delayLevels,
      options: options.delayLevels,
      valueKeys: ['delayLevel', 'category'],
      labelKeys: ['delayLevel', 'category'],
    },
  };
}

function getYearRangeLabel(yearOptions: any[]) {
  const years = yearOptions
    .map((option) => Number(option.year ?? option.label))
    .filter((year) => Number.isFinite(year))
    .sort((a, b) => a - b);

  if (years.length === 0) return '2013';
  if (years.length === 1) return String(years[0]);
  return `${years[0]}-${years[years.length - 1]}`;
}

function CheckboxDropdown({
  model,
  value,
  onChange,
}: {
  model: FilterModel;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const { t } = useLanguage();
  const template = useTemplate();
  const [open, setOpen] = useState(false);
  const allCheckboxRef = useRef<HTMLInputElement | null>(null);
  const { label, options, valueKeys, labelKeys, fallbackKeys = valueKeys } = model;
  const allValues = useMemo(() => getAllOptionValues(options, valueKeys), [options, valueKeys]);
  const selected = useMemo(
    () => normalizeSelection(value).filter((optionValue) => allValues.includes(optionValue)),
    [allValues, value],
  );
  const labelByValue = useMemo(() => {
    const labels = new Map<string, string>();
    options.forEach((option) => {
      const optionValue = getOptionValue(option, valueKeys);
      if (optionValue) labels.set(optionValue, getOptionLabel(option, labelKeys, fallbackKeys));
    });
    return labels;
  }, [fallbackKeys, labelKeys, options, valueKeys]);

  const hasOptions = allValues.length > 0;
  const allSelected = hasOptions && selected.length === allValues.length;
  const partiallySelected = hasOptions && selected.length > 0 && selected.length < allValues.length;
  const selectedLabels = selected.map((optionValue) => labelByValue.get(optionValue) || optionValue);
  const selectedLabel = !hasOptions
    ? t('filter.noOptions')
    : allSelected
      ? t('filter.all')
      : selected.length === 0
        ? t('filter.none')
        : selectedLabels.length <= 2
          ? selectedLabels.join(', ')
          : template('filter.selected', { count: selectedLabels.length });

  useEffect(() => {
    if (allCheckboxRef.current) allCheckboxRef.current.indeterminate = partiallySelected;
  }, [partiallySelected]);

  const toggleOption = (optionValue: string) => {
    const checked = selected.includes(optionValue);
    const nextValue = checked
      ? selected.filter((item) => item !== optionValue)
      : [...selected, optionValue];
    onChange(normalizeSelection(nextValue));
  };

  const setOnlyOption = (optionValue: string) => {
    onChange([optionValue]);
    setOpen(false);
  };

  return (
    <div className="relative min-w-[180px]">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="filter-control flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors"
      >
        <span className="min-w-0">
          <span className="block text-xs text-[var(--muted)]">{label}</span>
          <span className="block truncate">{selectedLabel}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="filter-menu absolute left-0 top-[calc(100%+8px)] z-50 w-80 rounded-xl p-2">
          <label className="filter-row flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm">
            <input
              ref={allCheckboxRef}
              type="checkbox"
              checked={allSelected}
              disabled={!hasOptions}
              aria-checked={partiallySelected ? 'mixed' : allSelected}
              onChange={(event) => onChange(event.target.checked ? allValues : [])}
              className="h-4 w-4 rounded border-white/20 bg-slate-900 accent-cyan-400"
            />
            <span className="min-w-0 flex-1">{t('filter.all')}</span>
            <span className="text-xs text-[var(--muted)]">{hasOptions ? allValues.length : 0}</span>
          </label>
          <div className="filter-divider my-1 h-px" />
          <div className="max-h-64 overflow-y-auto pr-1">
            {options.map((option) => {
              const optionValue = getOptionValue(option, valueKeys);
              if (!optionValue) return null;
              const checked = selected.includes(optionValue);
              const optionLabel = getOptionLabel(option, labelKeys, fallbackKeys);
              const optionCount = Number(option.count ?? option.flightCount ?? 0);

              return (
                <div key={optionValue} className="filter-row group flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleOption(optionValue)}
                      className="h-4 w-4 rounded border-white/20 bg-slate-900 accent-cyan-400"
                    />
                    <span className="min-w-0 flex-1 truncate">{optionLabel}</span>
                  </label>
                  {optionCount > 0 && (
                    <span className="shrink-0 text-[11px] text-[var(--muted)] group-hover:hidden">
                      {optionCount.toLocaleString()}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setOnlyOption(optionValue);
                    }}
                    className="filter-row-action shrink-0 rounded-full px-2 py-1 text-[11px] font-medium hover:bg-cyan-500/10"
                  >
                    {t('filter.only')}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const template = useTemplate();
  const initializedFiltersRef = useRef(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [draftFilters, setDraftFilters] = useState<InteractiveFilters>(() => createEmptyFilters());
  const [appliedFilters, setAppliedFilters] = useState<InteractiveFilters>(() => createEmptyFilters());
  const [interactiveData, setInteractiveData] = useState<any>(null);
  const [interactiveLoading, setInteractiveLoading] = useState(false);
  const [interactiveError, setInteractiveError] = useState<string | null>(null);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [optionsReady, setOptionsReady] = useState(false);
  const [options, setOptions] = useState<FilterOptionsState>({
    years: [],
    airlines: [],
    destinations: [],
    origins: [],
    months: [],
    delayLevels: [],
  });

  const filterLabels = useMemo<Record<FilterKey, string>>(() => ({
    years: t('filter.years'),
    months: t('filter.months'),
    airlines: t('filter.airlines'),
    origins: t('filter.origins'),
    destinations: t('filter.destinations'),
    delayLevels: t('filter.delayLevels'),
  }), [t]);

  const filterModels = useMemo(() => getFilterModels(options, filterLabels), [filterLabels, options]);
  const baselineFilters = useMemo(() => buildBaselineFilters(filterModels), [filterModels]);
  const appliedQuery = useMemo(
    () => buildFilterQuery(appliedFilters, filterModels).params.toString(),
    [appliedFilters, filterModels],
  );
  const hasAppliedFilters = useMemo(
    () => optionsReady && !sameFilters(appliedFilters, baselineFilters),
    [appliedFilters, baselineFilters, optionsReady],
  );
  const draftDiffersFromDefault = useMemo(
    () => optionsReady && !sameFilters(draftFilters, baselineFilters),
    [draftFilters, baselineFilters, optionsReady],
  );
  const appliedFilterCount = useMemo(
    () => FILTER_KEYS.filter((key) => !sameSelection(appliedFilters[key], baselineFilters[key])).length,
    [appliedFilters, baselineFilters],
  );

  useEffect(() => {
    preloadDashboardData();
    Promise.all([
      cachedJson(FILTER_OPTION_ENDPOINTS.years).catch(() => []),
      cachedJson(FILTER_OPTION_ENDPOINTS.airlines).catch(() => []),
      cachedJson(FILTER_OPTION_ENDPOINTS.destinations).catch(() => []),
      cachedJson(FILTER_OPTION_ENDPOINTS.origins).catch(() => []),
      cachedJson(FILTER_OPTION_ENDPOINTS.months).catch(() => []),
      cachedJson(FILTER_OPTION_ENDPOINTS.delayLevels).catch(() => []),
    ]).then(([years, airlines, destinations, origins, months, delayLevels]) => {
      setOptions({ years, airlines, destinations, origins, months, delayLevels });
      setOptionsReady(true);
    });
  }, []);

  useEffect(() => {
    if (activeTab === 'explorer' || activeTab === 'eda') preloadExplorerAndEdaData();
  }, [activeTab]);

  const loadInteractiveData = async (filters: InteractiveFilters) => {
    const { params } = buildFilterQuery(filters, filterModels);
    setInteractiveLoading(true);
    setInteractiveError(null);
    try {
      const query = params.toString();
      setInteractiveData(await cachedJson(`/api/interactive/analysis?${query || 'years=2013'}`));
    } catch (error) {
      setInteractiveError(error instanceof Error ? error.message : 'Interactive analysis failed.');
    } finally {
      setInteractiveLoading(false);
    }
  };

  useEffect(() => {
    if (!optionsReady || initializedFiltersRef.current) return;
    setDraftFilters(baselineFilters);
    setAppliedFilters(baselineFilters);
    initializedFiltersRef.current = true;
    loadInteractiveData(baselineFilters);
  }, [baselineFilters, filterModels, optionsReady]);

  useEffect(() => {
    if (!filterPanelOpen) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFilterPanelOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filterPanelOpen]);

  const updateDraftFilter = (key: FilterKey, value: string[]) => {
    setDraftFilters((current) => ({ ...current, [key]: normalizeSelection(value) }));
  };

  const applyFilters = async () => {
    const nextFilters = { ...draftFilters };
    setAppliedFilters(nextFilters);
    await loadInteractiveData(nextFilters);
    setFilterPanelOpen(false);
  };

  const clearFilters = () => {
    setDraftFilters(baselineFilters);
    setAppliedFilters(baselineFilters);
    setFilterPanelOpen(false);
    loadInteractiveData(baselineFilters);
  };

  const renderModule = () => {
    switch (activeTab) {
      case 'overview': return <Module1Dashboard interactiveData={interactiveData} />;
      case 'report': return <ModuleReportSummary interactiveData={interactiveData} />;
      case 'time': return <Module2TimeAnalysis interactiveData={interactiveData} />;
      case 'routes': return <Module3RouteAnalysis interactiveData={interactiveData} />;
      case 'recovery': return <Module4AirRecovery />;
      case 'airlines': return <Module5AirlineAnalysis interactiveData={interactiveData} />;
      case 'propagation': return <Module6DelayPropagation />;
      case 'attribution': return <Module7Attribution />;
      case 'explorer': return <Module8DataExplorer />;
      case 'eda':
        return (
          <Suspense fallback={<div className="p-8 text-cyan-300">{t('eda.loading')}</div>}>
            <ModuleVisualEDA filterQuery={appliedQuery} />
          </Suspense>
        );
      default: return <Module1Dashboard interactiveData={interactiveData} />;
    }
  };

  const yearRangeLabel = getYearRangeLabel(options.years);
  const hasMultipleYears = options.years.length > 1;

  return (
    <div className="min-h-screen bg-[#020617] bg-grid font-sans text-[#f1f5f9]">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/90 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              title={t('nav.back')}
              className="rounded-lg p-2 transition-colors hover:bg-white/5"
            >
              <ArrowLeft className="h-5 w-5 text-slate-400" />
            </button>
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500">
                <Plane className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 w-44 sm:w-64">
                <span className="block truncate text-lg font-bold tracking-tight text-white">{t('app.name')}</span>
                <span className="hidden text-sm text-slate-500 md:inline">{t('app.nameEn')}</span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <LanguageToggle />
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setFilterPanelOpen((current) => !current)}
              className={`filter-control relative inline-flex w-11 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors sm:w-36 ${
                hasAppliedFilters ? 'text-cyan-300' : 'text-[var(--muted-strong)]'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.filter')}</span>
              {hasAppliedFilters && (
                <span className="filter-badge rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                  {appliedFilterCount}
                </span>
              )}
            </button>
            <div className="filter-badge hidden items-center gap-2 rounded-lg border border-cyan-500/20 px-3 py-1.5 md:flex">
              <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
              <span className="text-xs font-medium">
                {hasMultipleYears ? t('nav.dataset') : t('nav.datasetFallback')}
              </span>
            </div>
            <div className="filter-control hidden rounded-lg px-3 py-1.5 text-xs text-[var(--muted)] sm:block">
              {yearRangeLabel}
            </div>
          </div>
        </div>

        <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
      </header>

      {filterPanelOpen && (
        <div className="filter-scrim fixed inset-0 z-[55]" onClick={() => setFilterPanelOpen(false)}>
          <section
            className="filter-panel absolute right-4 top-24 w-[min(980px,calc(100vw-2rem))] rounded-2xl p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-[var(--page-ink)]">
                  <Filter className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-medium">{t('filter.title')}</span>
                  {hasAppliedFilters && interactiveData?.recordCount !== undefined && (
                    <span className="filter-badge rounded-full px-2 py-1 text-xs">
                      {template('filter.sample', { count: interactiveData.recordCount.toLocaleString() })}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">{t('filter.description')}</p>
              </div>
              <button
                type="button"
                onClick={() => setFilterPanelOpen(false)}
                className="rounded-lg p-2 text-[var(--muted)] transition-colors hover:bg-white/5 hover:text-[var(--page-ink)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {FILTER_KEYS.map((key) => (
                <div key={key}>
                  <CheckboxDropdown
                    model={filterModels[key]}
                    value={draftFilters[key]}
                    onChange={(value) => updateDraftFilter(key, value)}
                  />
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="max-w-2xl text-xs text-[var(--muted)]">{t('filter.scope')}</div>
              <div className="flex items-center gap-2">
                {interactiveError && <span className="text-xs text-red-300">{interactiveError}</span>}
                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={!hasAppliedFilters && !draftDiffersFromDefault}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-[var(--muted)] transition-colors hover:bg-white/5 hover:text-[var(--page-ink)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <X className="h-4 w-4" />
                  {t('filter.reset')}
                </button>
                <button
                  type="button"
                  onClick={applyFilters}
                  disabled={interactiveLoading || !optionsReady}
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-cyan-400 disabled:cursor-wait disabled:opacity-70"
                >
                  {interactiveLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('filter.apply')}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      <main className="p-6 md:p-8">
        {renderModule()}
      </main>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-600">
        <p>{t('app.footer')}</p>
      </footer>

      <AIAssistant activeTab={activeTab} filters={appliedFilters} interactiveData={interactiveData} />
    </div>
  );
}
