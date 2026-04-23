import React from 'react';
import ReactECharts from 'echarts-for-react';
import { GitBranch, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
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

export default function Module6DelayPropagation() {
  const { data: propagationStats } = useFetch('/api/module6/propagation-stats');
  const { data: sequenceDelay } = useFetch('/api/module6/sequence-delay');
  const { data: propagationScatter } = useFetch('/api/module6/propagation-scatter');
  const { data: sankeyNodes } = useFetch('/api/module6/sankey-nodes');
  const { data: sankeyLinks } = useFetch('/api/module6/sankey-links');
  const { data: caseExample } = useFetch('/api/module6/case-example');
  const { data: sequencePropagation } = useFetch('/api/module6/sequence-propagation');

  // 任务序号 vs 延误折线图
  const sequenceOption = {
    ...chartBaseOptions,
    tooltip: { ...chartBaseOptions.tooltip, trigger: 'axis' },
    xAxis: {
      ...chartBaseOptions.xAxis,
      type: 'category',
      data: sequenceDelay?.map((d: any) => `第${d.task_sequence}班`) || []
    },
    yAxis: { ...chartBaseOptions.yAxis, type: 'value', name: '平均延误(分钟)' },
    series: [{
      type: 'line',
      data: sequenceDelay?.map((d: any) => d.avgDepDelay) || [],
      smooth: true,
      lineStyle: { color: '#f97316', width: 2 },
      itemStyle: { color: '#f97316' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(249, 115, 22, 0.4)' },
            { offset: 1, color: 'rgba(249, 115, 22, 0.0)' }
          ]
        }
      }
    }]
  };

  // 前序延误 vs 后续延误散点图
  const scatterOption = {
    ...chartBaseOptions,
    tooltip: {
      ...chartBaseOptions.tooltip,
      formatter: (params: any) =>
        `前序延误: ${params.value[0].toFixed(0)}分钟<br/>当前延误: ${params.value[1].toFixed(0)}分钟`
    },
    xAxis: { ...chartBaseOptions.xAxis, type: 'value', name: '前序到达延误(分钟)' },
    yAxis: { ...chartBaseOptions.yAxis, type: 'value', name: '当前起飞延误(分钟)' },
    series: [{
      type: 'scatter',
      symbolSize: 8,
      data: propagationScatter?.map((d: any) => [d.prev_arr_delay, d.dep_delay]) || [],
      itemStyle: { color: 'rgba(139, 92, 246, 0.5)' }
    }, {
      type: 'line',
      data: [[0, 0], [200, 200]],
      lineStyle: { type: 'dashed', color: '#64748b' },
      symbol: 'none'
    }]
  };

  // Sankey 图配置
  const sankeyOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
    series: [{
      type: 'sankey',
      layout: 'none',
      emphasis: { focus: 'adjacency' },
      nodeGap: 20,
      nodeWidth: 30,
      data: sankeyNodes || [],
      links: sankeyLinks?.map((l: any) => ({
        source: sankeyNodes?.[l.source]?.name,
        target: sankeyNodes?.[l.target]?.name,
        value: l.value
      })) || [],
      lineStyle: {
        color: 'gradient',
        curveness: 0.5
      },
      label: {
        color: '#94a3b8',
        fontSize: 10
      },
      itemStyle: {
        borderWidth: 0
      }
    }]
  };

  return (
    <div className="space-y-6">
      {/* 关键指标 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="同机日均航班"
          value={`${propagationStats?.avgTasksPerDay || '--'}班`}
          icon={Clock}
          color="cyan"
        />
        <KPICard
          title="前序延误均值"
          value={`${propagationStats?.avgPrevArrDelay || '--'}分钟`}
          icon={TrendingUp}
          color="orange"
        />
        <KPICard
          title="延误传导率"
          value={`${propagationStats?.prevDelayedNextDelayed || '--'}%`}
          subtitle="前序延误导致后续延误"
          icon={AlertTriangle}
          color="red"
        />
        <KPICard
          title="传导相关性"
          value={propagationStats?.correlation?.toFixed(2) || '--'}
          icon={GitBranch}
          color="purple"
        />
      </div>

      {/* 分析说明 */}
      <div className="glass-panel p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
        <p className="text-sm text-purple-300">
          <strong>分析方法：</strong>追踪同一架飞机在同一天内的连续航班任务，分析前序航班的到达延误
          如何影响后续航班的起飞延误。虚线表示y=x参考线，点在虚线上方表示延误加剧。
        </p>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 任务序号延误趋势 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            任务序号 vs 平均延误
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            随着任务序号增加，延误累积效应明显
          </p>
          <div className="h-[300px]">
            <ReactECharts option={sequenceOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 前序延误 vs 后续延误 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            前序延误 vs 当前延误
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            前序到达延误与当前起飞延误的关系
          </p>
          <div className="h-[300px]">
            <ReactECharts option={scatterOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* Sankey 流程图 */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-purple-400" />
            延误状态流转图
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            从前序航班状态到后续航班状态的流转，观察延误传导路径
          </p>
          <div className="h-[350px]">
            <ReactECharts option={sankeyOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>

      {/* 真实案例 */}
      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-lg font-medium text-slate-100 mb-4">真实案例：延误传导任务链</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-white/10">
                <th className="text-left p-2">日期</th>
                <th className="text-left p-2">任务序号</th>
                <th className="text-left p-2">航班</th>
                <th className="text-left p-2">航线</th>
                <th className="text-right p-2">起飞延误</th>
                <th className="text-right p-2">到达延误</th>
                <th className="text-right p-2">前序延误</th>
              </tr>
            </thead>
            <tbody>
              {caseExample?.map((flight: any, i: number) => (
                <tr key={i} className="text-slate-300 border-b border-white/5">
                  <td className="p-2">{flight.year}-{flight.month}-{flight.day}</td>
                  <td className="p-2">第{flight.task_sequence}班</td>
                  <td className="p-2">{flight.flight}</td>
                  <td className="p-2">{flight.origin} → {flight.dest}</td>
                  <td className={`text-right p-2 ${flight.dep_delay > 30 ? 'text-red-400' : ''}`}>
                    {flight.dep_delay}分钟
                  </td>
                  <td className={`text-right p-2 ${flight.arr_delay > 30 ? 'text-red-400' : ''}`}>
                    {flight.arr_delay}分钟
                  </td>
                  <td className="text-right p-2 text-orange-400">
                    {flight.prev_arr_delay || '--'}分钟
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 关键结论 */}
      <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-purple-500">
        <h3 className="text-lg font-medium text-slate-100 mb-3">延误传导结论</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
          <div className="flex items-start gap-2">
            <span className="text-red-400">✓</span>
            <span>延误传导相关性约{propagationStats?.correlation?.toFixed(2) || '--'}，存在明显传导效应</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-400">✓</span>
            <span>约{propagationStats?.prevDelayedNextDelayed || '--'}%的前序延误会传导至后续航班</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span>仍有{propagationStats?.prevDelayedNextOnTime || '--'}%的前序延误航班后续准点</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-cyan-400">✓</span>
            <span>任务序号越靠后，延误累积越严重</span>
          </div>
        </div>
      </div>
    </div>
  );
}
