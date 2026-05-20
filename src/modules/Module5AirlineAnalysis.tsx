import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Building, Plane, CheckCircle, AlertTriangle } from 'lucide-react';
import KPICard from '../components/charts/KPICard';
import { useFetch } from '../hooks/useModuleData';

const chartBaseOptions = {
  backgroundColor: 'transparent',
  textStyle: { fontFamily: 'Helvetica Neue, Arial, sans-serif' },
  tooltip: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    textStyle: { color: '#f1f5f9' },
  },
  grid: { left: '5%', right: '5%', bottom: '10%', top: '15%', containLabel: true },
  xAxis: {
    axisLine: { lineStyle: { color: '#1e293b' } },
    splitLine: { show: false },
    axisLabel: { color: '#64748b' }
  },
  yAxis: {
    axisLine: { show: false },
    splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
    axisLabel: { color: '#64748b' }
  }
};

export default function Module5AirlineAnalysis({ interactiveData }: { interactiveData?: any }) {
  const { data: airlineStats } = useFetch('/api/module5/airline-stats');
  const { data: fleetScatter } = useFetch('/api/module5/fleet-scatter');
  const { data: ontimeBubble } = useFetch('/api/module5/ontime-bubble');
  const { data: delayRanking } = useFetch('/api/module5/delay-ranking');
  const { data: ontimeRanking } = useFetch('/api/module5/ontime-ranking');
  const { data: quadrantData } = useFetch('/api/module5/quadrant-data');

  const activeAirlineStats = interactiveData?.airlineStats || airlineStats;
  const activeFleetScatter = interactiveData?.fleetScatter || fleetScatter;
  const activeOntimeBubble = interactiveData?.ontimeBubble || ontimeBubble;
  const activeDelayRanking = interactiveData?.delayRanking || delayRanking;
  const activeOntimeRanking = interactiveData?.ontimeRanking || ontimeRanking;

  // 机队规模 vs 延误散点图
  const fleetOption = {
    ...chartBaseOptions,
    tooltip: {
      ...chartBaseOptions.tooltip,
      formatter: (params: any) =>
        `${params.data[3]}<br/>机队: ${params.data[0]}架<br/>平均延误: ${params.data[1]}分钟`
    },
    xAxis: { ...chartBaseOptions.xAxis, type: 'value', name: '机队规模(架)' },
    yAxis: { ...chartBaseOptions.yAxis, type: 'value', name: '平均延误(分钟)' },
    series: [{
      type: 'scatter',
      symbolSize: (data: number[]) => Math.sqrt(data[2]) / 5,
      data: activeFleetScatter?.map((d: any) => [d.planeCount, d.avgDepDelay, d.flightCount, d.carrier_name]) || [],
      itemStyle: { color: 'rgba(139, 92, 246, 0.6)' }
    }]
  };

  // 准点率气泡图
  const bubbleOption = {
    ...chartBaseOptions,
    tooltip: {
      ...chartBaseOptions.tooltip,
      formatter: (params: any) =>
        `${params.data[3]}<br/>航班量: ${params.data[0]}<br/>准点率: ${params.data[1]}%<br/>机队: ${params.data[2]}架`
    },
    xAxis: { ...chartBaseOptions.xAxis, type: 'value', name: '航班量' },
    yAxis: { ...chartBaseOptions.yAxis, type: 'value', name: '准点率(%)', min: 50, max: 100 },
    series: [{
      type: 'scatter',
      symbolSize: (data: number[]) => Math.sqrt(data[2]) / 3,
      data: activeOntimeBubble?.map((d: any) => [d.flightCount, d.onTimeRate, d.planeCount, d.carrier_name]) || [],
      itemStyle: {
        color: (params: any) => {
          const rate = params.data[1];
          if (rate >= 80) return 'rgba(16, 185, 129, 0.6)';
          if (rate >= 70) return 'rgba(251, 191, 36, 0.6)';
          return 'rgba(239, 68, 68, 0.6)';
        }
      }
    }]
  };

  // 延误排名柱状图
  const delayRankOption = {
    ...chartBaseOptions,
    tooltip: { ...chartBaseOptions.tooltip, trigger: 'axis' },
    xAxis: {
      ...chartBaseOptions.xAxis,
      type: 'category',
      data: activeDelayRanking?.slice(0, 10).map((d: any) => d.carrier) || []
    },
    yAxis: { ...chartBaseOptions.yAxis, type: 'value', name: '平均延误(分钟)' },
    series: [{
      type: 'bar',
      data: activeDelayRanking?.slice(0, 10).map((d: any) => ({
        value: d.avgDepDelay,
        itemStyle: { color: d.avgDepDelay > 15 ? '#ef4444' : '#fbbf24' }
      })) || []
    }]
  };

  // 准点率排名柱状图
  const ontimeRankOption = {
    ...chartBaseOptions,
    tooltip: { ...chartBaseOptions.tooltip, trigger: 'axis' },
    xAxis: {
      ...chartBaseOptions.xAxis,
      type: 'category',
      data: activeOntimeRanking?.slice(0, 10).map((d: any) => d.carrier) || []
    },
    yAxis: { ...chartBaseOptions.yAxis, type: 'value', name: '准点率(%)', max: 100 },
    series: [{
      type: 'bar',
      data: activeOntimeRanking?.slice(0, 10).map((d: any) => ({
        value: d.onTimeRate,
        itemStyle: { color: d.onTimeRate >= 80 ? '#10b981' : '#06b6d4' }
      })) || []
    }]
  };

  // 象限分析
  const bestAirline = activeOntimeRanking?.[0];
  const worstAirline = activeDelayRanking?.[0];

  return (
    <div className="space-y-6">
      {/* 关键指标 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="航司总数"
          value={activeAirlineStats?.length || '--'}
          icon={Building}
          color="cyan"
        />
        <KPICard
          title="最佳航司"
          value={bestAirline?.carrier || '--'}
          subtitle={`准点率${bestAirline?.onTimeRate || '--'}%`}
          icon={CheckCircle}
          color="green"
        />
        <KPICard
          title="最差航司"
          value={worstAirline?.carrier || '--'}
          subtitle={`平均延误${worstAirline?.avgDepDelay || '--'}分钟`}
          icon={AlertTriangle}
          color="red"
        />
        <KPICard
          title="平均机队"
          value={`${Math.round(activeAirlineStats?.reduce((a: number, b: any) => a + b.planeCount, 0) / (activeAirlineStats?.length || 1)) || '--'}架`}
          icon={Plane}
          color="purple"
        />
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 机队规模 vs 延误 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <Plane className="w-5 h-5 text-purple-400" />
            机队规模 vs 平均延误
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            气泡大小表示航班量，探索规模与延误的关系
          </p>
          <div className="h-[300px]">
            <ReactECharts option={fleetOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 准点率气泡图 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            航班量 vs 准点率
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            气泡大小表示机队规模，颜色表示准点率等级
          </p>
          <div className="h-[300px]">
            <ReactECharts option={bubbleOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 延误排名 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            航司延误排名
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            按平均起飞延误排序，红色表示严重延误
          </p>
          <div className="h-[300px]">
            <ReactECharts option={delayRankOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 准点率排名 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-cyan-400" />
            航司准点率排名
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            按准点率排序，绿色表示优秀
          </p>
          <div className="h-[300px]">
            <ReactECharts option={ontimeRankOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>

      {/* 象限分析 */}
      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-lg font-medium text-slate-100 mb-4">航司象限分析</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['大规模高准点', '大规模低准点', '小规模高准点', '小规模低准点'].map((quadrant, i) => {
            const airlines = quadrantData?.filter((d: any) => d.quadrant === quadrant) || [];
            const colors = ['green', 'orange', 'cyan', 'red'];
            return (
              <div key={i} className={`p-4 rounded-xl bg-${colors[i]}-500/10 border border-${colors[i]}-500/20`}>
                <div className={`text-sm font-medium text-${colors[i]}-400 mb-2`}>{quadrant}</div>
                <div className="text-xs text-slate-400">
                  {airlines.slice(0, 3).map((a: any) => (
                    <div key={a.carrier}>{a.carrier} - {a.carrier_name}</div>
                  ))}
                  {airlines.length > 3 && <div>...等{airlines.length}家</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 关键结论 */}
      <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-cyan-500">
        <h3 className="text-lg font-medium text-slate-100 mb-3">航司表现结论</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
          <div className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span>HA(夏威夷航空)准点率最高，常提前到达</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-400">✓</span>
            <span>EV(大西洋东南航空)延误最严重，需谨慎选择</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-cyan-400">✓</span>
            <span>规模与延误无显著相关性，小航司也可能表现优异</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-400">✓</span>
            <span>UA、DL等大航司准点率稳定，运营效率较高</span>
          </div>
        </div>
      </div>
    </div>
  );
}
