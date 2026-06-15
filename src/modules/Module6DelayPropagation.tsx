import React from 'react';
import ReactECharts from 'echarts-for-react';
import { GitBranch, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import KPICard from '../components/charts/KPICard';
import { useFetch } from '../hooks/useModuleData';
import { useLanguage } from '../contexts/LanguageContext';
import { localizeDisplayValue } from '../lib/displayLocalization';

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

function averageNumericValues(value: unknown): number | null {
  if (Array.isArray(value)) {
    const numbers = value.map(Number).filter(Number.isFinite);
    if (numbers.length === 0) return null;
    return numbers.reduce((sum, item) => sum + item, 0) / numbers.length;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function formatMetric(value: unknown, digits = 1): string {
  const numberValue = averageNumericValues(value);
  return numberValue === null ? '--' : numberValue.toFixed(digits);
}

export default function Module6DelayPropagation() {
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const label = {
    task: isZh ? '第' : 'Task ',
    taskSuffix: isZh ? '班' : '',
    avgDelayAxis: isZh ? '平均延误(分钟)' : 'Avg delay (min)',
    prevDelay: isZh ? '前序延误' : 'Previous delay',
    currentDelay: isZh ? '当前延误' : 'Current delay',
    prevArrAxis: isZh ? '前序到达延误(分钟)' : 'Previous arrival delay (min)',
    currentDepAxis: isZh ? '当前起飞延误(分钟)' : 'Current departure delay (min)',
    minute: isZh ? '分钟' : 'min',
    avgTasks: isZh ? '同机日均航班' : 'Avg Same-aircraft Flights',
    sameAircraft: isZh ? '同一飞机同一天' : 'Same aircraft on same day',
    avgPrevDelay: isZh ? '前序延误均值' : 'Avg Previous Delay',
    propagationRate: isZh ? '延误传导率' : 'Propagation Rate',
    propagationSub: isZh ? '前序延误导致后续延误' : 'Previous delay followed by next delay',
    correlation: isZh ? '传导相关性' : 'Propagation Correlation',
    method: isZh ? '分析方法：' : 'Method: ',
    methodText: isZh
      ? '追踪同一架飞机在同一天内的连续航班任务，分析前序航班的到达延误如何影响后续航班的起飞延误。虚线表示y=x参考线，点在虚线上方表示延误加剧。'
      : 'Track consecutive same-day tasks by aircraft and analyze how previous arrival delay affects the next departure delay. The dashed line is the y=x reference; points above it indicate delay amplification.',
    sequenceTitle: isZh ? '任务序号 vs 平均延误' : 'Task Sequence vs Avg Delay',
    sequenceDesc: isZh ? '随着任务序号增加，延误累积效应明显' : 'Delay accumulation becomes clearer as aircraft task sequence increases.',
    scatterTitle: isZh ? '前序延误 vs 当前延误' : 'Previous Delay vs Current Delay',
    scatterDesc: isZh ? '前序到达延误与当前起飞延误的关系' : 'Relationship between previous arrival delay and current departure delay.',
    sankeyTitle: isZh ? '延误状态流转图' : 'Delay State Flow',
    sankeyDesc: isZh ? '从前序航班状态到后续航班状态的流转，观察延误传导路径' : 'Observe propagation paths from previous flight state to next flight state.',
    caseTitle: isZh ? '真实案例：延误传导任务链' : 'Case Example: Delay Propagation Chain',
    date: isZh ? '日期' : 'Date',
    taskSeq: isZh ? '任务序号' : 'Task Sequence',
    flight: isZh ? '航班' : 'Flight',
    route: isZh ? '航线' : 'Route',
    depDelay: isZh ? '起飞延误' : 'Departure Delay',
    arrDelay: isZh ? '到达延误' : 'Arrival Delay',
    conclusionTitle: isZh ? '延误传导结论' : 'Delay Propagation Findings',
    c1: isZh ? '延误传导相关性显示存在明显传导效应' : 'Correlation indicates a clear delay propagation effect.',
    c2: isZh ? '部分前序延误会传导至后续航班' : 'A portion of previous delays propagates into subsequent flights.',
    c3: isZh ? '仍有部分前序延误航班后续能够准点' : 'Some aircraft still recover enough for the next flight to depart on time.',
    c4: isZh ? '任务序号越靠后，延误累积越严重' : 'Later task sequences show stronger accumulated delay.',
  };
  Object.assign(label, isZh ? {
    task: '第',
    taskSuffix: '班',
    avgDelayAxis: '平均延误(分钟)',
    prevDelay: '前序延误',
    currentDelay: '当前延误',
    prevArrAxis: '前序到达延误(分钟)',
    currentDepAxis: '当前起飞延误(分钟)',
    minute: '分钟',
    avgTasks: '同机日均航班',
    sameAircraft: '同一飞机同一天',
    avgPrevDelay: '前序延误均值',
    propagationRate: '延误传导率',
    propagationSub: '前序延误导致后续延误',
    correlation: '传导相关性',
    method: '分析方法：',
    methodText: '追踪同一架飞机在同一天内的连续航班任务，分析前序航班到达延误如何影响后续航班起飞延误。虚线为 y=x 参考线，点在线上方表示延误加剧。',
    sequenceTitle: '任务序号 vs 平均延误',
    sequenceDesc: '随着任务序号增加，延误累积效应更明显。',
    scatterTitle: '前序延误 vs 当前延误',
    scatterDesc: '前序到达延误与当前起飞延误的关系。',
    sankeyTitle: '延误状态流转图',
    sankeyDesc: '从前序航班状态到后续航班状态的流转，观察延误传导路径。',
    caseTitle: '真实案例：延误传导任务链',
    date: '日期',
    taskSeq: '任务序号',
    flight: '航班',
    route: '航线',
    depDelay: '起飞延误',
    arrDelay: '到达延误',
    conclusionTitle: '延误传导结论',
    c1: '传导相关性显示存在明显的延误传导效应。',
    c2: '部分前序延误会传导至后续航班。',
    c3: '仍有一部分前序延误航班后续能够恢复准点。',
    c4: '任务序号越靠后，延误累积越严重。',
  } : {
    task: 'Task ',
    taskSuffix: '',
    avgDelayAxis: 'Avg delay (min)',
    prevDelay: 'Previous delay',
    currentDelay: 'Current delay',
    prevArrAxis: 'Previous arrival delay (min)',
    currentDepAxis: 'Current departure delay (min)',
    minute: 'min',
    avgTasks: 'Avg Same-aircraft Flights',
    sameAircraft: 'Same aircraft on same day',
    avgPrevDelay: 'Avg Previous Delay',
    propagationRate: 'Propagation Rate',
    propagationSub: 'Previous delay followed by next delay',
    correlation: 'Propagation Correlation',
    method: 'Method: ',
    methodText: 'Track consecutive same-day tasks by aircraft and analyze how previous arrival delay affects the next departure delay. The dashed line is the y=x reference; points above it indicate delay amplification.',
    sequenceTitle: 'Task Sequence vs Avg Delay',
    sequenceDesc: 'Delay accumulation becomes clearer as aircraft task sequence increases.',
    scatterTitle: 'Previous Delay vs Current Delay',
    scatterDesc: 'Relationship between previous arrival delay and current departure delay.',
    sankeyTitle: 'Delay State Flow',
    sankeyDesc: 'Observe propagation paths from previous flight state to next flight state.',
    caseTitle: 'Case Example: Delay Propagation Chain',
    date: 'Date',
    taskSeq: 'Task Sequence',
    flight: 'Flight',
    route: 'Route',
    depDelay: 'Departure Delay',
    arrDelay: 'Arrival Delay',
    conclusionTitle: 'Delay Propagation Findings',
    c1: 'Correlation indicates a clear delay propagation effect.',
    c2: 'A portion of previous delays propagates into subsequent flights.',
    c3: 'Some aircraft still recover enough for the next flight to depart on time.',
    c4: 'Later task sequences show stronger accumulated delay.',
  });
  Object.assign(label, isZh ? {
    task: '第',
    taskSuffix: '班',
    avgDelayAxis: '平均延误(分钟)',
    prevDelay: '前序延误',
    currentDelay: '当前延误',
    prevArrAxis: '前序到达延误(分钟)',
    currentDepAxis: '当前起飞延误(分钟)',
    minute: '分钟',
    avgTasks: '同机日均航班',
    sameAircraft: '同一飞机同一天',
    avgPrevDelay: '前序延误均值',
    propagationRate: '延误传导率',
    propagationSub: '前序延误导致后续延误',
    correlation: '传导相关性',
    method: '分析方法：',
    methodText: '追踪同一架飞机在同一天内的连续航班任务，分析前序航班到达延误如何影响后续航班起飞延误。虚线为 y=x 参考线，点在线上方表示延误加剧。',
    sequenceTitle: '任务序号 vs 平均延误',
    sequenceDesc: '随着任务序号增加，延误累积效应更明显。',
    scatterTitle: '前序延误 vs 当前延误',
    scatterDesc: '前序到达延误与当前起飞延误的关系。',
    sankeyTitle: '延误状态流转图',
    sankeyDesc: '从前序航班状态到后续航班状态的流转，观察延误传导路径。',
    caseTitle: '真实案例：延误传导任务链',
    date: '日期',
    taskSeq: '任务序号',
    flight: '航班',
    route: '航线',
    depDelay: '起飞延误',
    arrDelay: '到达延误',
    conclusionTitle: '延误传导结论',
    c1: '传导相关性显示存在明显的延误传导效应。',
    c2: '部分前序延误会传导至后续航班。',
    c3: '仍有一部分前序延误航班后续能够恢复准点。',
    c4: '任务序号越靠后，延误累积越严重。',
  } : {});
  const { data: propagationStats } = useFetch('/api/module6/propagation-stats');
  const { data: sequenceDelay } = useFetch('/api/module6/sequence-delay');
  const { data: propagationScatter } = useFetch('/api/module6/propagation-scatter');
  const { data: sankeyNodes } = useFetch('/api/module6/sankey-nodes');
  const { data: sankeyLinks } = useFetch('/api/module6/sankey-links');
  const { data: caseExample } = useFetch('/api/module6/case-example');
  const { data: sequencePropagation } = useFetch('/api/module6/sequence-propagation');
  const localizedSankeyNodes = sankeyNodes?.map((node: any) => ({
    ...node,
    name: localizeDisplayValue(node.name, language),
  })) || [];

  // 任务序号 vs 延误折线图
  const sequenceOption = {
    ...chartBaseOptions,
    tooltip: { ...chartBaseOptions.tooltip, trigger: 'axis' },
    xAxis: {
      ...chartBaseOptions.xAxis,
      type: 'category',
      data: sequenceDelay?.map((d: any) => `${label.task}${d.task_sequence}${label.taskSuffix}`) || []
    },
    yAxis: { ...chartBaseOptions.yAxis, type: 'value', name: label.avgDelayAxis },
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
        `${label.prevDelay}: ${params.value[0].toFixed(0)}${label.minute}<br/>${label.currentDelay}: ${params.value[1].toFixed(0)}${label.minute}`
    },
    xAxis: { ...chartBaseOptions.xAxis, type: 'value', name: label.prevArrAxis },
    yAxis: { ...chartBaseOptions.yAxis, type: 'value', name: label.currentDepAxis },
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
      data: localizedSankeyNodes,
      links: sankeyLinks?.map((l: any) => ({
        source: localizedSankeyNodes?.[l.source]?.name,
        target: localizedSankeyNodes?.[l.target]?.name,
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
          title={label.avgTasks}
          value={`${formatMetric(propagationStats?.avgTasksPerDay, 1)}${label.taskSuffix || ''}`}
          subtitle={label.sameAircraft}
          icon={Clock}
          color="cyan"
        />
        <KPICard
          title={label.avgPrevDelay}
          value={`${formatMetric(propagationStats?.avgPrevArrDelay, 1)} ${label.minute}`}
          icon={TrendingUp}
          color="orange"
        />
        <KPICard
          title={label.propagationRate}
          value={`${formatMetric(propagationStats?.prevDelayedNextDelayed, 1)}%`}
          subtitle={label.propagationSub}
          icon={AlertTriangle}
          color="red"
        />
        <KPICard
          title={label.correlation}
          value={propagationStats?.correlation?.toFixed(2) || '--'}
          icon={GitBranch}
          color="purple"
        />
      </div>

      {/* 分析说明 */}
      <div className="glass-panel p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
        <p className="text-sm text-purple-300">
          <strong>{label.method}</strong>{label.methodText}
        </p>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 任务序号延误趋势 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            {label.sequenceTitle}
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            {label.sequenceDesc}
          </p>
          <div className="h-[300px]">
            <ReactECharts option={sequenceOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 前序延误 vs 后续延误 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            {label.scatterTitle}
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            {label.scatterDesc}
          </p>
          <div className="h-[300px]">
            <ReactECharts option={scatterOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* Sankey 流程图 */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-purple-400" />
            {label.sankeyTitle}
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            {label.sankeyDesc}
          </p>
          <div className="h-[350px]">
            <ReactECharts option={sankeyOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>

      {/* 真实案例 */}
      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-lg font-medium text-slate-100 mb-4">{label.caseTitle}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-white/10">
                <th className="text-left p-2">{label.date}</th>
                <th className="text-left p-2">{label.taskSeq}</th>
                <th className="text-left p-2">{label.flight}</th>
                <th className="text-left p-2">{label.route}</th>
                <th className="text-right p-2">{label.depDelay}</th>
                <th className="text-right p-2">{label.arrDelay}</th>
                <th className="text-right p-2">{label.prevDelay}</th>
              </tr>
            </thead>
            <tbody>
              {caseExample?.map((flight: any, i: number) => (
                <tr key={i} className="text-slate-300 border-b border-white/5">
                  <td className="p-2">{flight.year}-{flight.month}-{flight.day}</td>
                  <td className="p-2">{label.task}{flight.task_sequence}{label.taskSuffix}</td>
                  <td className="p-2">{flight.flight}</td>
                  <td className="p-2">{flight.origin} → {flight.dest}</td>
                  <td className={`text-right p-2 ${flight.dep_delay > 30 ? 'text-red-400' : ''}`}>
                    {flight.dep_delay} {label.minute}
                  </td>
                  <td className={`text-right p-2 ${flight.arr_delay > 30 ? 'text-red-400' : ''}`}>
                    {flight.arr_delay} {label.minute}
                  </td>
                  <td className="text-right p-2 text-orange-400">
                    {flight.prev_arr_delay || '--'} {label.minute}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 关键结论 */}
      <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-purple-500">
        <h3 className="text-lg font-medium text-slate-100 mb-3">{label.conclusionTitle}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
          <div className="flex items-start gap-2">
            <span className="text-red-400">✓</span>
            <span>{label.c1}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-400">✓</span>
            <span>{label.c2}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span>{label.c3}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-cyan-400">✓</span>
            <span>{label.c4}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
