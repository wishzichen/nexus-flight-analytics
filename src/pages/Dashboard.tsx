import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plane, ArrowLeft, Filter, Loader2, X, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TabNav from '../components/layout/TabNav';
import ThemeToggle from '../components/common/ThemeToggle';
import Module1Dashboard from '../modules/Module1Dashboard';
import Module2TimeAnalysis from '../modules/Module2TimeAnalysis';
import Module3RouteAnalysis from '../modules/Module3RouteAnalysis';
import Module4AirRecovery from '../modules/Module4AirRecovery';
import Module5AirlineAnalysis from '../modules/Module5AirlineAnalysis';
import Module6DelayPropagation from '../modules/Module6DelayPropagation';
import Module7Attribution from '../modules/Module7Attribution';
import Module8DataExplorer from '../modules/Module8DataExplorer';

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
    if (yearValues.includes('2013')) {
        nextFilters.years = ['2013'];
    }
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

function getFilterModels(options: FilterOptionsState): Record<FilterKey, FilterModel> {
    return {
        years: {
            label: '年份',
            options: options.years.length ? options.years : [{ year: 2013, label: '2013' }],
            valueKeys: ['year'],
            labelKeys: ['label'],
        },
        months: {
            label: '月份',
            options: options.months,
            valueKeys: ['month'],
            labelKeys: ['monthName'],
        },
        airlines: {
            label: '航司',
            options: options.airlines,
            valueKeys: ['airlineCode', 'carrier'],
            labelKeys: ['airlineName', 'carrier_name'],
        },
        origins: {
            label: '出发机场',
            options: options.origins,
            valueKeys: ['departureAirport', 'origin'],
            labelKeys: ['departureAirportName', 'origin_name'],
        },
        destinations: {
            label: '目的地',
            options: options.destinations,
            valueKeys: ['arrivalAirport', 'dest'],
            labelKeys: ['arrivalAirportName', 'dest_name'],
        },
        delayLevels: {
            label: '延误等级',
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

    if (years.length === 0) return '纽约 2013';
    if (years.length === 1) return `纽约 ${years[0]}`;
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
        ? '暂无选项'
        : allSelected
            ? '全部'
            : selected.length === 0
                ? '全不选'
                : selectedLabels.length <= 2
                    ? selectedLabels.join(', ')
                    : `已选 ${selectedLabels.length} 项`;

    useEffect(() => {
        if (allCheckboxRef.current) {
            allCheckboxRef.current.indeterminate = partiallySelected;
        }
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
                        <span className="min-w-0 flex-1">全选</span>
                        <span className="text-xs text-[var(--muted)]">{hasOptions ? allValues.length : 0} 项</span>
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
                                <div
                                    key={optionValue}
                                    className="filter-row group flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
                                >
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
                                        仅筛选此项
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

    const filterModels = useMemo(() => getFilterModels(options), [options]);
    const fullFilters = useMemo(() => buildFullFilters(filterModels), [filterModels]);
    const baselineFilters = useMemo(() => buildBaselineFilters(filterModels), [filterModels]);
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
        Promise.all([
            fetch('/api/module8/year-options').then((res) => res.json()).catch(() => []),
            fetch('/api/module8/airline-options').then((res) => res.json()).catch(() => []),
            fetch('/api/module8/dest-options').then((res) => res.json()).catch(() => []),
            fetch('/api/module8/origin-options').then((res) => res.json()).catch(() => []),
            fetch('/api/module8/month-options').then((res) => res.json()).catch(() => []),
            fetch('/api/module8/delay-level-options').then((res) => res.json()).catch(() => []),
        ]).then(([years, airlines, destinations, origins, months, delayLevels]) => {
            setOptions({ years, airlines, destinations, origins, months, delayLevels });
            setOptionsReady(true);
        });
    }, []);

    useEffect(() => {
        if (!optionsReady || initializedFiltersRef.current) return;
        setDraftFilters(baselineFilters);
        setAppliedFilters(baselineFilters);
        initializedFiltersRef.current = true;
        const { params } = buildFilterQuery(baselineFilters, filterModels);
        setInteractiveLoading(true);
        fetch(`/api/interactive/analysis?${params.toString()}`)
            .then((response) => {
                if (!response.ok) throw new Error(`默认分析加载失败: ${response.status}`);
                return response.json();
            })
            .then(setInteractiveData)
            .catch((error) => setInteractiveError(error instanceof Error ? error.message : '默认分析加载失败'))
            .finally(() => setInteractiveLoading(false));
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
        const { params, hasExplicitFilters } = buildFilterQuery(nextFilters, filterModels);
        setAppliedFilters(nextFilters);
        setInteractiveError(null);

        if (!hasExplicitFilters) {
            setInteractiveData(null);
            setFilterPanelOpen(false);
            return;
        }

        setInteractiveLoading(true);
        try {
            const response = await fetch(`/api/interactive/analysis?${params.toString()}`);
            if (!response.ok) throw new Error(`筛选分析失败: ${response.status}`);
            setInteractiveData(await response.json());
            setFilterPanelOpen(false);
        } catch (error) {
            setInteractiveError(error instanceof Error ? error.message : '筛选分析失败');
        } finally {
            setInteractiveLoading(false);
        }
    };

    const clearFilters = () => {
        setDraftFilters(baselineFilters);
        setAppliedFilters(baselineFilters);
        setInteractiveError(null);
        setFilterPanelOpen(false);
        const { params } = buildFilterQuery(baselineFilters, filterModels);
        setInteractiveLoading(true);
        fetch(`/api/interactive/analysis?${params.toString()}`)
            .then((response) => {
                if (!response.ok) throw new Error(`默认分析加载失败: ${response.status}`);
                return response.json();
            })
            .then(setInteractiveData)
            .catch((error) => setInteractiveError(error instanceof Error ? error.message : '默认分析加载失败'))
            .finally(() => setInteractiveLoading(false));
    };

    // 渲染当前模块
    const renderModule = () => {
        switch (activeTab) {
            case 'overview': return <Module1Dashboard interactiveData={interactiveData} />;
            case 'time': return <Module2TimeAnalysis interactiveData={interactiveData} />;
            case 'routes': return <Module3RouteAnalysis interactiveData={interactiveData} />;
            case 'recovery': return <Module4AirRecovery />;
            case 'airlines': return <Module5AirlineAnalysis interactiveData={interactiveData} />;
            case 'propagation': return <Module6DelayPropagation />;
            case 'attribution': return <Module7Attribution />;
            case 'explorer': return <Module8DataExplorer />;
            default: return <Module1Dashboard interactiveData={interactiveData} />;
        }
    };

    const yearRangeLabel = getYearRangeLabel(options.years);
    const hasMultipleYears = options.years.length > 1;

    return (
        <div className="min-h-screen bg-[#020617] bg-grid text-[#f1f5f9] font-sans">
            {/* 顶部导航栏 */}
            <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/90 backdrop-blur-md">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-400" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                                <Plane className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <span className="text-lg font-bold tracking-tight text-white">航班延误分析系统</span>
                                <span className="hidden md:inline text-slate-500 text-sm ml-2">| Nexus Flight Analytics</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <button
                            onClick={() => setFilterPanelOpen((current) => !current)}
                            className={`filter-control relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                                hasAppliedFilters ? 'text-cyan-300' : 'text-[var(--muted-strong)]'
                            }`}
                        >
                            <Filter className="h-4 w-4" />
                            筛选分析
                            {hasAppliedFilters && (
                                <span className="filter-badge rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                                    {appliedFilterCount}
                                </span>
                            )}
                        </button>
                        <div className="filter-badge hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-cyan-500/20">
                            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                            <span className="text-xs font-medium">
                                {hasMultipleYears ? '多年份航班数据' : 'nycflights13 数据集'}
                            </span>
                        </div>
                        <div className="filter-control hidden sm:block px-3 py-1.5 rounded-lg text-xs text-[var(--muted)]">
                            {yearRangeLabel}
                        </div>
                    </div>
                </div>

                {/* Tab 导航 */}
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
                                    <span className="text-sm font-medium">筛选后重新分析</span>
                                    {hasAppliedFilters && interactiveData?.recordCount !== undefined && (
                                        <span className="filter-badge rounded-full px-2 py-1 text-xs">
                                            当前样本 {interactiveData.recordCount.toLocaleString()} 条
                                        </span>
                                    )}
                                </div>
                                <p className="mt-1 text-xs text-[var(--muted)]">
                                    默认展示 2013 年分析结果。取消“全选”会变成全不选；悬停到单个选项右侧可直接仅筛选此项。
                                </p>
                            </div>
                            <button
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
                            <div className="text-xs text-[var(--muted)]">
                                筛选会影响总览、时间规律、航线和航司模块；恢复/传导/归因仍展示完整建模结果。
                            </div>
                            <div className="flex items-center gap-2">
                                {interactiveError && <span className="text-xs text-red-300">{interactiveError}</span>}
                                <button
                                    onClick={clearFilters}
                                    disabled={!hasAppliedFilters && !draftDiffersFromDefault}
                                    className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-[var(--muted)] transition-colors hover:bg-white/5 hover:text-[var(--page-ink)] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <X className="h-4 w-4" />
                                    恢复2013默认
                                </button>
                                <button
                                    onClick={applyFilters}
                                    disabled={interactiveLoading || !optionsReady}
                                    className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-cyan-400 disabled:cursor-wait disabled:opacity-70"
                                >
                                    {interactiveLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                    应用筛选
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {/* 模块内容 */}
            <main className="p-6 md:p-8">
                {renderModule()}
            </main>

            {/* 页脚 */}
            <footer className="py-8 text-center text-xs text-slate-600 border-t border-white/5">
                <p>基于 nycflights13 与 anyflights 多年份纽约航班数据 · R 语言分析 · React + ECharts 可视化</p>
            </footer>
        </div>
    );
}
