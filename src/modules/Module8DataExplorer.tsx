import React, { useState, useCallback, useEffect } from 'react';
import { Search, Download, Filter, ChevronLeft, ChevronRight, Check, Loader2, X, Sparkles, FileSearch, Trash2 } from 'lucide-react';

interface Flight {
  date: string;
  airlineCode: string;
  airlineName?: string;
  flightNumber: string | number;
  aircraftId?: string;
  departureAirport?: string;
  departureAirportName?: string;
  arrivalAirport?: string;
  arrivalAirportName?: string;
  route: string;
  departureDelay: number;
  arrivalDelay: number;
  flightTime?: number;
  flightDistance?: number;
  flightSpeed?: number;
  delayLevel: string;
}

interface SearchResponse {
  data: Flight[];
  total: number;
  page: number;
  pageSize: number;
}

interface SummaryStats {
  totalRecords: number;
  avgDepDelay: number;
  avgArrDelay?: number;
  avgFlightTime?: number;
  avgDistance: number;
  avgSpeed?: number;
  avgAircraftAge?: number;
  uniqueAirlines: number;
  uniqueRoutes: number;
  uniqueAircraft?: number;
}

interface FilterOptions {
  airlineCode: string;
  airlineName: string;
  count: number;
}

interface DestOptions {
  arrivalAirport: string;
  arrivalAirportName: string;
  count: number;
}

interface DelayLevelOptions {
  delayLevel: string;
  count: number;
}

export default function Module8DataExplorer() {
  // 分页状态
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const pageSizeOptions = [10, 20, 50, 100, 200];

  // 筛选条件状态 - 临时状态和确认状态分离
  const [tempFilters, setTempFilters] = useState({
    q: '',
    airline: '',
    destination: '',
    delayLevel: ''
  });
  const [appliedFilters, setAppliedFilters] = useState({
    q: '',
    airline: '',
    destination: '',
    delayLevel: ''
  });

  // 数据状态
  const [flightList, setFlightList] = useState<Flight[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [jumpPageInput, setJumpPageInput] = useState('');
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportRange, setExportRange] = useState({ startPage: '', endPage: '' });

  // 获取静态选项数据
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [airlineOptions, setAirlineOptions] = useState<FilterOptions[]>([]);
  const [destOptions, setDestOptions] = useState<DestOptions[]>([]);
  const [delayLevelOptions, setDelayLevelOptions] = useState<DelayLevelOptions[]>([]);
  const [optionsLoaded, setOptionsLoaded] = useState(false);  // 标记初始数据是否加载完成
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);  // 标记是否完成首次加载

  // 获取摘要数据和筛选选项
  useEffect(() => {
    Promise.all([
      fetch('/api/module8/summary').then(res => res.json()).catch(() => null),
      fetch('/api/module8/airline-options').then(res => res.json()).catch(() => []),
      fetch('/api/module8/dest-options').then(res => res.json()).catch(() => []),
      fetch('/api/module8/delay-level-options').then(res => res.json()).catch(() => [])
    ]).then(([summaryData, airlines, dests, delays]) => {
      if (summaryData && !summaryData.error) {
        setSummary(summaryData);
      }
      setAirlineOptions(airlines || []);
      setDestOptions(dests || []);
      setDelayLevelOptions(delays || []);
      setOptionsLoaded(true);
    }).catch(err => {
      console.error('加载数据失败:', err);
      setOptionsLoaded(true); // 即使失败也继续，避免死循环
    });
  }, []);

  // 搜索数据
  const searchFlights = useCallback(async (filters: typeof appliedFilters, pageNum: number) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        pageSize: pageSize.toString()
      });

      if (filters.q) params.append('q', filters.q);
      if (filters.airline) params.append('airline', filters.airline);
      if (filters.destination) params.append('destination', filters.destination);
      if (filters.delayLevel) params.append('delayLevel', filters.delayLevel);

      const response = await fetch(`/api/module8/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const data: SearchResponse = await response.json();

      // 确保数据格式正确
      const processedData = (data.data || []).map((flight: Flight) => ({
        ...flight,
        flightNumber: String(flight.flightNumber) // 确保flightNumber是字符串
      }));

      setFlightList(processedData);
      setTotalRecords(data.total || 0);
      setInitialLoadComplete(true);
    } catch (error) {
      console.error('搜索失败:', error);
      setFlightList([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  // 初始化加载数据 - 只在选项加载完成且从未搜索过时执行
  useEffect(() => {
    if (optionsLoaded && !hasSearched) {
      searchFlights(appliedFilters, page);
    }
  }, [optionsLoaded, hasSearched]);

  // 页码大小变化时重置到第一页
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    searchFlights(appliedFilters, 1);
  };

  // 页码变化时重新加载数据
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    searchFlights(appliedFilters, newPage);
  };

  // 应用筛选
  const handleApplyFilters = () => {
    setPage(1);
    setAppliedFilters({ ...tempFilters });
    searchFlights({ ...tempFilters }, 1);
  };

  // 重置筛选
  const handleResetFilters = () => {
    const defaultFilters = { q: '', airline: '', destination: '', delayLevel: '' };
    setTempFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setPage(1);
    searchFlights(defaultFilters, 1);
  };

  // 检查是否有筛选条件
  const hasActiveFilters = Object.values(appliedFilters).some(v => v !== '');
  const hasTempFilters = Object.values(tempFilters).some(v => v !== '');

  // 页码跳转处理
  const handleJumpToPage = () => {
    const targetPage = parseInt(jumpPageInput);
    if (targetPage >= 1 && targetPage <= totalPages) {
      handlePageChange(targetPage);
      setJumpPageInput('');
    }
  };

  // 导出CSV - 支持三种方式
  const handleExport = async (mode: 'all' | 'current' | 'range') => {
    setExporting(true);
    setShowExportMenu(false);
    try {
      const params = new URLSearchParams();

      // 添加筛选条件
      if (appliedFilters.q) params.append('q', appliedFilters.q);
      if (appliedFilters.airline) params.append('airline', appliedFilters.airline);
      if (appliedFilters.destination) params.append('destination', appliedFilters.destination);
      if (appliedFilters.delayLevel) params.append('delayLevel', appliedFilters.delayLevel);

      // 根据导出模式设置参数
      let exportDesc = '';
      if (mode === 'current') {
        params.append('page', page.toString());
        params.append('pageSize', pageSize.toString());
        params.append('exportMode', 'current');
        exportDesc = `第${page}页`;
      } else if (mode === 'range') {
        const start = parseInt(exportRange.startPage);
        const end = parseInt(exportRange.endPage);
        if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end) {
          alert(`请输入有效的页码范围（1-${totalPages}）`);
          setExporting(false);
          return;
        }
        params.append('startPage', start.toString());
        params.append('endPage', end.toString());
        params.append('pageSize', pageSize.toString());
        params.append('exportMode', 'range');
        exportDesc = `第${start}-${end}页`;
      } else {
        params.append('exportMode', 'all');
        exportDesc = '全部';
      }

      const response = await fetch(`/api/module8/export?${params.toString()}`);

      if (!response.ok) {
        throw new Error('导出失败');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // 生成文件名
      const filterNames = [];
      if (appliedFilters.q) filterNames.push(`搜索${appliedFilters.q}`);
      if (appliedFilters.airline) filterNames.push(appliedFilters.airline);
      if (appliedFilters.destination) filterNames.push(appliedFilters.destination);
      if (appliedFilters.delayLevel) filterNames.push(appliedFilters.delayLevel);

      const filterStr = filterNames.length > 0 ? `_${filterNames.join('_')}` : '';
      const fileName = `flights_${exportDesc}${filterStr}_${Date.now()}.csv`;

      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  const getDelayColor = (delay: number) => {
    if (delay <= 0) return 'text-green-400';
    if (delay <= 15) return 'text-cyan-400';
    if (delay <= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const totalPages = Math.ceil(totalRecords / pageSize);

  return (
    <div className="space-y-6">
      {/* 统计摘要 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass-panel p-4 rounded-xl">
          <div className="text-xs text-slate-400">总记录数</div>
          <div className="text-xl font-bold text-cyan-400">
            {summary?.totalRecords?.toLocaleString() || '--'}
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <div className="text-xs text-slate-400">平均起飞延误</div>
          <div className="text-xl font-bold text-orange-400">
            {summary?.avgDepDelay || '--'}分钟
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <div className="text-xs text-slate-400">平均飞行距离</div>
          <div className="text-xl font-bold text-purple-400">
            {summary?.avgDistance?.toLocaleString() || '--'}英里
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <div className="text-xs text-slate-400">航司数量</div>
          <div className="text-xl font-bold text-green-400">
            {summary?.uniqueAirlines || '--'}
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <div className="text-xs text-slate-400">航线数量</div>
          <div className="text-xl font-bold text-blue-400">
            {summary?.uniqueRoutes || '--'}
          </div>
        </div>
      </div>

      {/* 筛选器 - 优化版 */}
      <div className="glass-panel p-5 rounded-xl">
        <div className="space-y-4">
          {/* 第一行：搜索框和筛选条件 */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* 搜索框 - 增强版 */}
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
              <input
                type="text"
                placeholder="搜索航班号、航司、航线..."
                value={tempFilters.q}
                onChange={(e) => setTempFilters({ ...tempFilters, q: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                className="w-full bg-slate-800/80 border border-cyan-500/30 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
              {tempFilters.q && (
                <button 
                  onClick={() => setTempFilters({ ...tempFilters, q: '' })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 航司筛选 */}
            <select
              value={tempFilters.airline}
              onChange={(e) => setTempFilters({ ...tempFilters, airline: e.target.value })}
              className="bg-slate-800/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all min-w-[140px]"
            >
              <option value="">全部航司</option>
              {airlineOptions?.slice(0, 20).map((a: any) => (
                <option key={a.airlineCode} value={a.airlineCode}>
                  {a.airlineName} ({a.count?.toLocaleString()})
                </option>
              ))}
            </select>

            {/* 目的地筛选 */}
            <select
              value={tempFilters.destination}
              onChange={(e) => setTempFilters({ ...tempFilters, destination: e.target.value })}
              className="bg-slate-800/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all min-w-[140px]"
            >
              <option value="">全部目的地</option>
              {destOptions?.slice(0, 20).map((d: any) => (
                <option key={d.arrivalAirport} value={d.arrivalAirport}>
                  {d.arrivalAirportName} ({d.count?.toLocaleString()})
                </option>
              ))}
            </select>

            {/* 延误等级筛选 */}
            <select
              value={tempFilters.delayLevel}
              onChange={(e) => setTempFilters({ ...tempFilters, delayLevel: e.target.value })}
              className="bg-slate-800/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all min-w-[140px]"
            >
              <option value="">全部延误等级</option>
              {delayLevelOptions?.map((d: any) => (
                <option key={d.delayLevel} value={d.delayLevel}>
                  {d.delayLevel} ({d.count?.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          {/* 第二行：操作按钮和状态 */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              {/* 重置按钮 */}
              <button
                onClick={handleResetFilters}
                disabled={!hasActiveFilters && !hasTempFilters}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-700/80 text-slate-300 rounded-xl hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-white/5"
              >
                <Trash2 className="w-4 h-4" />
                <span>重置</span>
              </button>

              {/* 开始检索按钮 - 优化版，更加突出 */}
              <button
                onClick={handleApplyFilters}
                disabled={loading}
                className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-lg ${
                  hasTempFilters && !loading
                    ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white hover:from-cyan-400 hover:via-blue-400 hover:to-purple-400 shadow-cyan-500/30 hover:shadow-cyan-400/40 transform hover:scale-105'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400'
                } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-medium">检索中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className={`w-5 h-5 ${hasTempFilters ? 'animate-bounce' : ''}`} />
                    <span className="font-semibold">{hasTempFilters ? '开始检索' : '应用筛选'}</span>
                  </>
                )}
              </button>
              
              {/* 快捷提示 */}
              {hasTempFilters && (
                <span className="text-xs text-cyan-400/70 hidden md:inline animate-pulse">
                  ✨ 按 Enter 键快速检索
                </span>
              )}
            </div>

            {/* 当前筛选状态和命中数量 */}
            <div className="flex items-center gap-5">
              {hasActiveFilters && (
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <Filter className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400">当前筛选：</span>
                  {appliedFilters.q && (
                    <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/30 flex items-center gap-1">
                      <FileSearch className="w-3 h-3" />
                      {appliedFilters.q}
                    </span>
                  )}
                  {appliedFilters.airline && (
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-lg border border-purple-500/30">
                      {appliedFilters.airline}
                    </span>
                  )}
                  {appliedFilters.destination && (
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
                      {appliedFilters.destination}
                    </span>
                  )}
                  {appliedFilters.delayLevel && (
                    <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-lg border border-orange-500/30">
                      {appliedFilters.delayLevel}
                    </span>
                  )}
                </div>
              )}
              
              {/* 搜索结果计数 - 优化版 */}
              <div className="flex items-center gap-2">
                {loading ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl border border-cyan-500/20">
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                    <span className="text-cyan-400 font-medium">正在检索...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl border border-white/10">
                      <span className="text-slate-400 text-sm">命中</span>
                      <span className={`text-lg font-bold ${totalRecords > 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                        {totalRecords.toLocaleString()}
                      </span>
                      <span className="text-slate-400 text-sm">条</span>
                    </div>
                    {hasSearched && totalRecords > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg text-xs border border-green-500/20">
                        <Check className="w-3.5 h-3.5" />
                        <span>完成</span>
                      </div>
                    )}
                    {hasSearched && totalRecords === 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs border border-red-500/20">
                        <X className="w-3.5 h-3.5" />
                        <span>无数据</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 数据表格 */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        {/* 表格工具栏 - 导出按钮 */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/30">
          <div className="text-sm text-slate-400">
            {totalRecords > 0 && (
              <span>显示第 {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, totalRecords)} 条，共 {totalRecords.toLocaleString()} 条记录</span>
            )}
          </div>

          {/* 导出按钮组 */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exporting || totalRecords === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-400 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>导出中...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>导出 CSV</span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-90' : ''}`} />
                </>
              )}
            </button>

            {/* 导出菜单 */}
            {showExportMenu && !exporting && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                {/* 导出全部 */}
                <button
                  onClick={() => handleExport('all')}
                  className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">导出全部结果</div>
                      <div className="text-xs text-slate-400 mt-1">
                        导出所有 {totalRecords.toLocaleString()} 条筛选结果
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-green-400" />
                  </div>
                </button>

                {/* 导出当前页 */}
                <button
                  onClick={() => handleExport('current')}
                  className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">导出当前页</div>
                      <div className="text-xs text-slate-400 mt-1">
                        导出第 {page} 页的 {Math.min(pageSize, totalRecords - (page - 1) * pageSize)} 条记录
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-cyan-400" />
                  </div>
                </button>

                {/* 导出指定范围 */}
                <div className="px-4 py-3">
                  <div className="text-sm font-medium text-white mb-2">导出指定页范围</div>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      placeholder="起始页"
                      value={exportRange.startPage}
                      onChange={(e) => setExportRange({ ...exportRange, startPage: e.target.value })}
                      className="flex-1 px-3 py-2 bg-slate-700 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      placeholder="结束页"
                      value={exportRange.endPage}
                      onChange={(e) => setExportRange({ ...exportRange, endPage: e.target.value })}
                      className="flex-1 px-3 py-2 bg-slate-700 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="text-xs text-slate-400 mb-3">
                    共 {totalPages} 页，每页 {pageSize} 条
                  </div>
                  <button
                    onClick={() => handleExport('range')}
                    disabled={!exportRange.startPage || !exportRange.endPage}
                    className="w-full px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-400 hover:to-pink-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" />
                      <span>导出范围</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 bg-slate-800/50 border-b border-white/10">
                <th className="text-left p-3 whitespace-nowrap">日期</th>
                <th className="text-left p-3 whitespace-nowrap">航司</th>
                <th className="text-left p-3 whitespace-nowrap">航班号</th>
                <th className="text-left p-3 whitespace-nowrap">飞机号</th>
                <th className="text-left p-3 whitespace-nowrap">航线</th>
                <th className="text-right p-3 whitespace-nowrap">起飞延误</th>
                <th className="text-right p-3 whitespace-nowrap">到达延误</th>
                <th className="text-right p-3 whitespace-nowrap">飞行时长</th>
                <th className="text-right p-3 whitespace-nowrap">距离</th>
                <th className="text-right p-3 whitespace-nowrap">速度</th>
                <th className="text-left p-3 whitespace-nowrap">延误等级</th>
              </tr>
            </thead>
            <tbody>
              {/* 初始加载状态 */}
              {!optionsLoaded || !initialLoadComplete ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{!optionsLoaded ? '正在加载筛选选项...' : '正在检索数据...'}</span>
                    </div>
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center">
                    <div className="flex items-center justify-center gap-2 text-cyan-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>正在检索数据...</span>
                    </div>
                  </td>
                </tr>
              ) : flightList?.length > 0 ? (
                flightList.map((flight, i) => (
                  <tr
                    key={i}
                    className="text-slate-300 border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-3 whitespace-nowrap">{flight.date}</td>
                    <td className="p-3 whitespace-nowrap">{flight.airlineCode}</td>
                    <td className="p-3 whitespace-nowrap font-mono text-cyan-400">{flight.flightNumber}</td>
                    <td className="p-3 whitespace-nowrap font-mono text-xs text-slate-400">{flight.aircraftId || '--'}</td>
                    <td className="p-3 whitespace-nowrap">{flight.route}</td>
                    <td className={`text-right p-3 whitespace-nowrap font-medium ${getDelayColor(flight.departureDelay)}`}>
                      {flight.departureDelay ?? '--'}分钟
                    </td>
                    <td className={`text-right p-3 whitespace-nowrap font-medium ${getDelayColor(flight.arrivalDelay)}`}>
                      {flight.arrivalDelay ?? '--'}分钟
                    </td>
                    <td className="text-right p-3 whitespace-nowrap">
                      {flight.flightTime ? `${flight.flightTime}分钟` : '--'}
                    </td>
                    <td className="text-right p-3 whitespace-nowrap">
                      {flight.flightDistance?.toLocaleString() || '--'}英里
                    </td>
                    <td className="text-right p-3 whitespace-nowrap">
                      {flight.flightSpeed ? `${flight.flightSpeed.toFixed(0)}mph` : '--'}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        flight.delayLevel === '准点' ? 'bg-green-500/20 text-green-400' :
                        flight.delayLevel === '轻微' ? 'bg-cyan-500/20 text-cyan-400' :
                        flight.delayLevel === '中度' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {flight.delayLevel}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="text-4xl opacity-30">🔍</div>
                      <div className="text-slate-400 font-medium">暂无匹配数据</div>
                      <div className="text-xs text-slate-500">请尝试调整筛选条件或搜索关键词</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 - 优化版 */}
        <div className="flex items-center justify-between p-4 border-t border-white/10 bg-slate-900/30 flex-wrap gap-4">
          {/* 左侧：记录统计 */}
          <div className="text-sm text-slate-400 flex items-center gap-2">
            <span className="text-slate-500">📄</span>
            <span>第 <span className="text-cyan-400 font-semibold">{page}</span> / {totalPages.toLocaleString()} 页</span>
            <span className="text-slate-600">|</span>
            <span>共 <span className="text-cyan-400 font-semibold">{totalRecords.toLocaleString()}</span> 条记录</span>
          </div>
          
          {/* 中间：页码导航 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || loading}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-white/5"
              title="上一页"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {/* 动态页码显示 */}
            <div className="flex items-center gap-1">
              {totalPages <= 7 ? (
                // 页面较少时显示所有页码
                [...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1.5 rounded-lg transition-all text-sm min-w-[40px] ${
                        page === pageNum
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })
              ) : (
                // 页面较多时显示当前页附近的页码
                (() => {
                  const pages = [];
                  const start = Math.max(1, page - 2);
                  const end = Math.min(totalPages, page + 2);
                  
                  if (start > 1) {
                    pages.push(<button key={1} onClick={() => handlePageChange(1)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all text-sm">1</button>);
                    if (start > 2) pages.push(<span key="ellipsis1" className="text-slate-500 px-1">...</span>);
                  }
                  
                  for (let i = start; i <= end; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => handlePageChange(i)}
                        className={`px-3 py-1.5 rounded-lg transition-all text-sm min-w-[40px] ${
                          page === i
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }
                  
                  if (end < totalPages) {
                    if (end < totalPages - 1) pages.push(<span key="ellipsis2" className="text-slate-500 px-1">...</span>);
                    pages.push(<button key={totalPages} onClick={() => handlePageChange(totalPages)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all text-sm">{totalPages}</button>);
                  }
                  
                  return pages;
                })()
              )}
            </div>
            
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || loading}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-white/5"
              title="下一页"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          {/* 右侧：页码跳转和每页条数 */}
          <div className="flex items-center gap-3">
            {/* 页码跳转 */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">跳转到</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpPageInput}
                onChange={(e) => setJumpPageInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJumpToPage()}
                placeholder="页码"
                className="w-16 px-2 py-1.5 bg-slate-800 border border-white/15 rounded-lg text-sm text-cyan-400 text-center focus:outline-none focus:border-cyan-500"
              />
              <span className="text-xs text-slate-400">页</span>
              <button
                onClick={handleJumpToPage}
                disabled={!jumpPageInput || loading}
                className="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-medium border border-cyan-500/30"
              >
                跳转
              </button>
            </div>
            
            {/* 每页条数选择器 */}
            <div className="flex items-center gap-2 border-l border-white/10 pl-3">
              <span className="text-xs text-slate-400">每页</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                className="bg-slate-800 border border-white/15 rounded-lg px-2 py-1.5 text-sm text-cyan-400 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {pageSizeOptions.map(size => (
                  <option key={size} value={size}>{size}条</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="glass-panel p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
        <h4 className="text-sm font-medium text-cyan-400 mb-2">💡 数据探索使用说明</h4>
        <ul className="text-xs text-slate-300 space-y-1">
          <li>• 在搜索框输入航班号、航司名称或航线关键词，按回车或点击「应用筛选」</li>
          <li>• 使用下拉筛选器选择航司、目的地或延误等级</li>
          <li>• 点击「应用筛选」确认筛选条件，系统将显示符合条件的记录数</li>
          <li>• 点击「重置」可一键清除所有筛选条件</li>
          <li>• 点击「导出 CSV」可选择导出范围：全部结果、当前页或自定义页数范围</li>
          <li>• 延误等级：准点(≤0分钟)、轻微(0-15分钟)、中度(15-60分钟)、严重(&gt;60分钟)</li>
        </ul>
      </div>
    </div>
  );
}
