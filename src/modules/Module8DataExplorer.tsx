import React, { useState, useCallback, useEffect } from 'react';
import { Search, Download, Filter, ChevronLeft, ChevronRight, RotateCcw, Check, Loader2, X, ChevronDown } from 'lucide-react';

interface Flight {
  date: string;
  airlineCode: string;
  flightNumber: string;
  aircraftId?: string;
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
  avgDistance: number;
  uniqueAirlines: number;
  uniqueRoutes: number;
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
  const [pageSize] = useState(100);
  
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
  
  // 导出菜单状态
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportRange, setExportRange] = useState<{
    type: 'all' | 'current' | 'range';
    startPage: number;
    endPage: number;
  }>({
    type: 'all',
    startPage: 1,
    endPage: 1
  });
  const [exporting, setExporting] = useState(false);
  
  // 获取静态选项数据
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [airlineOptions, setAirlineOptions] = useState<FilterOptions[]>([]);
  const [destOptions, setDestOptions] = useState<DestOptions[]>([]);
  const [delayLevelOptions, setDelayLevelOptions] = useState<DelayLevelOptions[]>([]);

  // 获取摘要数据
  useEffect(() => {
    fetch('/api/module8/summary')
      .then(res => res.json())
      .then(data => setSummary(data))
      .catch(console.error);
  }, []);

  // 获取筛选选项
  useEffect(() => {
    Promise.all([
      fetch('/api/module8/airline-options').then(res => res.json()),
      fetch('/api/module8/dest-options').then(res => res.json()),
      fetch('/api/module8/delay-level-options').then(res => res.json())
    ]).then(([airlines, dests, delays]) => {
      setAirlineOptions(airlines);
      setDestOptions(dests);
      setDelayLevelOptions(delays);
    }).catch(console.error);
  }, []);

  // 搜索数据
  const searchFlights = useCallback(async (filters: typeof appliedFilters, pageNum: number) => {
    setLoading(true);
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
      const data: SearchResponse = await response.json();
      
      setFlightList(data.data || []);
      setTotalRecords(data.total || 0);
    } catch (error) {
      console.error('搜索失败:', error);
      setFlightList([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  // 初始化加载数据
  useEffect(() => {
    searchFlights(appliedFilters, page);
  }, [searchFlights, page]);

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

  // 导出CSV
  const handleExport = async () => {
    setExporting(true);
    setShowExportMenu(false);
    try {
      let params = new URLSearchParams();
      
      // 根据导出类型设置参数
      if (exportRange.type === 'all') {
        params = new URLSearchParams({ exportMode: 'all' });
      } else if (exportRange.type === 'current') {
        params = new URLSearchParams({ 
          exportMode: 'range',
          startPage: page.toString(),
          endPage: page.toString()
        });
      } else {
        params = new URLSearchParams({ 
          exportMode: 'range',
          startPage: exportRange.startPage.toString(),
          endPage: exportRange.endPage.toString()
        });
      }
      
      // 添加筛选条件
      if (appliedFilters.q) params.append('q', appliedFilters.q);
      if (appliedFilters.airline) params.append('airline', appliedFilters.airline);
      if (appliedFilters.destination) params.append('destination', appliedFilters.destination);
      if (appliedFilters.delayLevel) params.append('delayLevel', appliedFilters.delayLevel);
      
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
      
      let rangeStr = '';
      if (exportRange.type === 'all') {
        rangeStr = '全部';
      } else if (exportRange.type === 'current') {
        rangeStr = `第${page}页`;
      } else {
        rangeStr = `${exportRange.startPage}-${exportRange.endPage}页`;
      }
      
      const fileName = filterNames.length > 0 
        ? `flights_${rangeStr}_${filterNames.join('_')}_${Date.now()}.csv`
        : `flights_${rangeStr}_${Date.now()}.csv`;
      
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

  // 计算导出记录数
  const getExportCount = () => {
    if (exportRange.type === 'all') {
      return totalRecords;
    } else if (exportRange.type === 'current') {
      return Math.min(pageSize, totalRecords - (page - 1) * pageSize);
    } else {
      const start = (exportRange.startPage - 1) * pageSize;
      const end = exportRange.endPage * pageSize;
      return Math.max(0, Math.min(totalRecords, end) - Math.max(0, start));
    }
  };

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
      <div className="glass-panel p-4 rounded-xl">
        <div className="space-y-4">
          {/* 第一行：搜索框和筛选条件 */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* 搜索框 */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索航班号、航司、航线..."
                value={tempFilters.q}
                onChange={(e) => setTempFilters({ ...tempFilters, q: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                className="w-full bg-slate-800 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* 航司筛选 */}
            <select
              value={tempFilters.airline}
              onChange={(e) => setTempFilters({ ...tempFilters, airline: e.target.value })}
              className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
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
              className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
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
              className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
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
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              {/* 重置按钮 */}
              <button
                onClick={handleResetFilters}
                disabled={!hasActiveFilters && !hasTempFilters}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                重置
              </button>

              {/* 应用筛选按钮 */}
              <button
                onClick={handleApplyFilters}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                应用筛选
              </button>
            </div>

            {/* 当前筛选状态和命中数量 */}
            <div className="flex items-center gap-4">
              {hasActiveFilters && (
                <div className="flex items-center gap-2 text-sm">
                  <Filter className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400">当前筛选：</span>
                  {appliedFilters.q && (
                    <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded">
                      搜索: {appliedFilters.q}
                    </span>
                  )}
                  {appliedFilters.airline && (
                    <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded">
                      {appliedFilters.airline}
                    </span>
                  )}
                  {appliedFilters.destination && (
                    <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded">
                      {appliedFilters.destination}
                    </span>
                  )}
                  {appliedFilters.delayLevel && (
                    <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded">
                      {appliedFilters.delayLevel}
                    </span>
                  )}
                </div>
              )}
              
              <div className="text-sm">
                <span className="text-slate-400">命中 </span>
                <span className="text-cyan-400 font-bold">{totalRecords.toLocaleString()}</span>
                <span className="text-slate-400"> 条记录</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 数据表格 */}
      <div className="glass-panel rounded-2xl overflow-hidden">
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
              {loading ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>加载中...</span>
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
                  <td colSpan={11} className="p-8 text-center text-slate-500">
                    暂无数据，请调整筛选条件
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <div className="flex items-center justify-between p-4 border-t border-white/10">
          <div className="text-sm text-slate-400">
            第 {page} / {totalPages || 1} 页，共 {totalRecords.toLocaleString()} 条
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {/* 简化页码显示 */}
              {page > 3 && (
                <>
                  <button
                    onClick={() => setPage(1)}
                    className="px-3 py-1 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700"
                  >
                    1
                  </button>
                  {page > 4 && <span className="text-slate-500">...</span>}
                </>
              )}
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = Math.max(1, Math.min(page - 2 + i, totalPages));
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1 rounded-lg ${
                      page === pageNum
                        ? 'bg-cyan-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {page < totalPages - 2 && (
                <>
                  {page < totalPages - 3 && <span className="text-slate-500">...</span>}
                  <button
                    onClick={() => setPage(totalPages)}
                    className="px-3 py-1 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 导出按钮区域 */}
      <div className="flex justify-end">
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={loading || totalRecords === 0 || exporting}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20"
          >
            {exporting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            <span className="font-medium">导出 CSV</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {/* 导出选项菜单 */}
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="p-3 border-b border-white/10">
                <div className="text-sm font-medium text-white mb-2">选择导出范围</div>
                
                {/* 选项1：所有结果 */}
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                  <input
                    type="radio"
                    name="exportRange"
                    checked={exportRange.type === 'all'}
                    onChange={() => setExportRange({ ...exportRange, type: 'all' })}
                    className="w-4 h-4 accent-cyan-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm text-white">所有结果</div>
                    <div className="text-xs text-slate-400">{totalRecords.toLocaleString()} 条记录</div>
                  </div>
                </label>
                
                {/* 选项2：当前页 */}
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                  <input
                    type="radio"
                    name="exportRange"
                    checked={exportRange.type === 'current'}
                    onChange={() => setExportRange({ ...exportRange, type: 'current' })}
                    className="w-4 h-4 accent-cyan-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm text-white">当前页结果</div>
                    <div className="text-xs text-slate-400">第 {page} 页（约 {Math.min(pageSize, totalRecords - (page - 1) * pageSize)} 条）</div>
                  </div>
                </label>
                
                {/* 选项3：自定义范围 */}
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                  <input
                    type="radio"
                    name="exportRange"
                    checked={exportRange.type === 'range'}
                    onChange={() => setExportRange({ ...exportRange, type: 'range' })}
                    className="w-4 h-4 accent-cyan-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm text-white">自定义范围</div>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={exportRange.startPage}
                        onChange={(e) => setExportRange({ ...exportRange, startPage: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="w-16 px-2 py-1 bg-slate-700 border border-white/10 rounded text-sm text-white text-center"
                        placeholder="起始"
                      />
                      <span className="text-slate-400">-</span>
                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={exportRange.endPage}
                        onChange={(e) => setExportRange({ ...exportRange, endPage: Math.min(totalPages, parseInt(e.target.value) || totalPages) })}
                        className="w-16 px-2 py-1 bg-slate-700 border border-white/10 rounded text-sm text-white text-center"
                        placeholder="结束"
                      />
                      <span className="text-xs text-slate-400">页</span>
                    </div>
                    {exportRange.type === 'range' && (
                      <div className="text-xs text-cyan-400 mt-1">约 {getExportCount().toLocaleString()} 条记录</div>
                    )}
                  </div>
                </label>
              </div>
              
              {/* 确认导出按钮 */}
              <div className="p-3 flex gap-2">
                <button
                  onClick={() => setShowExportMenu(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleExport}
                  className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                >
                  确认导出 ({getExportCount().toLocaleString()})
                </button>
              </div>
            </div>
          )}
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
