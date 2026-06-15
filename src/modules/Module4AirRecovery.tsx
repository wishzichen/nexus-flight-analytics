import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Plane, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import KPICard from '../components/charts/KPICard';
import { useFetch } from '../hooks/useModuleData';
import { useLanguage } from '../contexts/LanguageContext';

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

export default function Module4AirRecovery() {
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const label = {
    speed: isZh ? '速度' : 'Speed',
    flightSpeed: isZh ? '飞行速度(mph)' : 'Flight speed (mph)',
    arrDelay: isZh ? '到达延误' : 'Arrival delay',
    arrDelayAxis: isZh ? '到达延误(分钟)' : 'Arrival delay (min)',
    depDelay: isZh ? '起飞延误' : 'Departure delay',
    depDelayAxis: isZh ? '起飞延误(分钟)' : 'Departure delay (min)',
    recovery: isZh ? '追回时间' : 'Recovery time',
    recoveryAxis: isZh ? '追回时间(分钟)' : 'Recovery time (min)',
    avgRecoveryAxis: isZh ? '平均追回(分钟)' : 'Avg recovery (min)',
    recoveryRateAxis: isZh ? '追回成功率(%)' : 'Recovery success rate (%)',
    minute: isZh ? '分钟' : 'min',
    highDelayFlights: isZh ? '高延误航班数' : 'High-delay Flights',
    highDelaySub: isZh ? '起飞延误>60分钟' : 'Departure delay > 60 min',
    avgRecovery: isZh ? '平均追回时间' : 'Avg Recovery Time',
    recoveryRate: isZh ? '追回成功率' : 'Recovery Rate',
    recoveryRateSub: isZh ? '成功追回时间的航班比例' : 'Share of flights that recovered time',
    avgSpeed: isZh ? '平均飞行速度' : 'Avg Flight Speed',
    method: isZh ? '分析口径：' : 'Method: ',
    methodText: isZh
      ? '仅分析起飞延误超过60分钟的高延误航班，排除飞行时间缺失或异常的数据。追回时间 = 起飞延误 - 到达延误，正值表示在空中追回了时间。'
      : 'Only flights with departure delay above 60 minutes are analyzed, excluding missing or abnormal flight-time records. Recovery time equals departure delay minus arrival delay; positive values mean time was recovered in air.',
    speedTitle: isZh ? '飞行速度 vs 到达延误' : 'Flight Speed vs Arrival Delay',
    speedDesc: isZh ? '速度越快，到达延误越小的趋势' : 'Higher speed is associated with lower arrival delay.',
    recoveryTitle: isZh ? '起飞延误 vs 追回时间' : 'Departure Delay vs Recovery Time',
    recoveryDesc: isZh ? '虚线上方表示追回时间，下方表示延误加剧' : 'Above the baseline means time was recovered; below it means delay worsened.',
    airlineTitle: isZh ? '航司追回能力对比' : 'Airline Recovery Capability',
    airlineDesc: isZh ? '各航司在高延误情况下的平均追回时间' : 'Average recovery time by airline under high-delay conditions.',
    destTitle: isZh ? '目的地追回成功率' : 'Destination Recovery Rate',
    destDesc: isZh ? '飞往不同目的地的追回成功率' : 'Recovery success rate across destinations.',
    conclusionTitle: isZh ? '空中追回结论' : 'In-air Recovery Findings',
    c1: isZh ? '一部分高延误航班能够在空中成功追回时间' : 'A meaningful share of high-delay flights recover time in air.',
    c2: isZh ? '平均追回时间显示部分航班可完全追回延误' : 'Average recovery time shows that some flights can fully recover delay.',
    c3: isZh ? '长途航线追回空间更大，短途航线追回困难' : 'Long-haul routes have more recovery margin, while short routes have limited room.',
    c4: isZh ? '航司运营策略影响追回能力，部分航司表现优异' : 'Airline operating strategy affects recovery capability, with clear carrier differences.',
  };
  Object.assign(label, isZh ? {
    speed: '速度',
    flightSpeed: '飞行速度(mph)',
    arrDelay: '到达延误',
    arrDelayAxis: '到达延误(分钟)',
    depDelay: '起飞延误',
    depDelayAxis: '起飞延误(分钟)',
    recovery: '追回时间',
    recoveryAxis: '追回时间(分钟)',
    avgRecoveryAxis: '平均追回(分钟)',
    recoveryRateAxis: '追回成功率(%)',
    minute: '分钟',
    highDelayFlights: '高延误航班数',
    highDelaySub: '起飞延误 > 60 分钟',
    avgRecovery: '平均追回时间',
    recoveryRate: '追回成功率',
    recoveryRateSub: '成功追回时间的航班比例',
    avgSpeed: '平均飞行速度',
    method: '分析口径：',
    methodText: '仅分析起飞延误超过 60 分钟的高延误航班，排除飞行时间缺失或异常的数据。追回时间 = 起飞延误 - 到达延误，正值表示在空中追回了时间。',
    speedTitle: '飞行速度 vs 到达延误',
    speedDesc: '观察飞行速度与到达延误之间的关系。',
    recoveryTitle: '起飞延误 vs 追回时间',
    recoveryDesc: '基准线上方表示追回时间，下方表示延误加剧。',
    airlineTitle: '航司追回能力对比',
    airlineDesc: '各航司在高延误情况下的平均追回时间。',
    destTitle: '目的地追回成功率',
    destDesc: '飞往不同目的地的追回成功率。',
    conclusionTitle: '空中追回结论',
    c1: '一部分高延误航班能够在空中成功追回时间。',
    c2: '平均追回时间显示部分航班可以完全追回延误。',
    c3: '长途航线追回空间更大，短途航线追回更困难。',
    c4: '航司运营策略会影响追回能力，航司间差异明显。',
  } : {
    speed: 'Speed',
    flightSpeed: 'Flight speed (mph)',
    arrDelay: 'Arrival delay',
    arrDelayAxis: 'Arrival delay (min)',
    depDelay: 'Departure delay',
    depDelayAxis: 'Departure delay (min)',
    recovery: 'Recovery time',
    recoveryAxis: 'Recovery time (min)',
    avgRecoveryAxis: 'Avg recovery (min)',
    recoveryRateAxis: 'Recovery success rate (%)',
    minute: 'min',
    highDelayFlights: 'High-delay Flights',
    highDelaySub: 'Departure delay > 60 min',
    avgRecovery: 'Avg Recovery Time',
    recoveryRate: 'Recovery Rate',
    recoveryRateSub: 'Share of flights that recovered time',
    avgSpeed: 'Avg Flight Speed',
    method: 'Method: ',
    methodText: 'Only flights with departure delay above 60 minutes are analyzed, excluding missing or abnormal flight-time records. Recovery time equals departure delay minus arrival delay; positive values mean time was recovered in air.',
    speedTitle: 'Flight Speed vs Arrival Delay',
    speedDesc: 'Observe the relationship between flight speed and arrival delay.',
    recoveryTitle: 'Departure Delay vs Recovery Time',
    recoveryDesc: 'Above the baseline means time was recovered; below it means delay worsened.',
    airlineTitle: 'Airline Recovery Capability',
    airlineDesc: 'Average recovery time by airline under high-delay conditions.',
    destTitle: 'Destination Recovery Rate',
    destDesc: 'Recovery success rate across destinations.',
    conclusionTitle: 'In-air Recovery Findings',
    c1: 'A meaningful share of high-delay flights recover time in air.',
    c2: 'Average recovery time shows that some flights can fully recover delay.',
    c3: 'Long-haul routes have more recovery margin, while short routes have limited room.',
    c4: 'Airline operating strategy affects recovery capability, with clear carrier differences.',
  });
  const { data: recoveryStats } = useFetch('/api/module4/recovery-stats');
  const { data: speedScatter } = useFetch('/api/module4/speed-scatter');
  const { data: recoveryScatter } = useFetch('/api/module4/recovery-scatter');
  const { data: airlineRecovery } = useFetch('/api/module4/airline-recovery');
  const { data: destRecovery } = useFetch('/api/module4/dest-recovery');
  const { data: distanceRecovery } = useFetch('/api/module4/distance-recovery');

  // 速度 vs 延误散点图
  const speedOption = {
    ...chartBaseOptions,
    tooltip: {
      ...chartBaseOptions.tooltip,
      formatter: (params: any) =>
        `${label.speed}: ${params.value[0].toFixed(0)} mph<br/>${label.arrDelay}: ${params.value[1].toFixed(0)}${label.minute}`
    },
    xAxis: { ...chartBaseOptions.xAxis, type: 'value', name: label.flightSpeed },
    yAxis: { ...chartBaseOptions.yAxis, type: 'value', name: label.arrDelayAxis },
    series: [{
      type: 'scatter',
      symbolSize: 8,
      data: speedScatter?.map((d: any) => [d.speed_mph, d.arr_delay]) || [],
      itemStyle: { color: 'rgba(249, 115, 22, 0.5)' }
    }]
  };

  // 起飞延误 vs 追回时间散点图
  const recoveryOption = {
    ...chartBaseOptions,
    tooltip: {
      ...chartBaseOptions.tooltip,
      formatter: (params: any) =>
        `${label.depDelay}: ${params.value[0].toFixed(0)}${label.minute}<br/>${label.recovery}: ${params.value[1].toFixed(0)}${label.minute}`
    },
    xAxis: { ...chartBaseOptions.xAxis, type: 'value', name: label.depDelayAxis },
    yAxis: { ...chartBaseOptions.yAxis, type: 'value', name: label.recoveryAxis },
    series: [{
      type: 'scatter',
      symbolSize: 8,
      data: recoveryScatter?.map((d: any) => [d.dep_delay, d.recovery_minutes]) || [],
      itemStyle: { color: 'rgba(16, 185, 129, 0.5)' }
    }, {
      type: 'line',
      data: [[60, 0], [200, 0]],
      lineStyle: { type: 'dashed', color: '#64748b' },
      symbol: 'none'
    }]
  };

  // 航司追回能力柱状图
  const airlineOption = {
    ...chartBaseOptions,
    tooltip: { ...chartBaseOptions.tooltip, trigger: 'axis' },
    xAxis: {
      ...chartBaseOptions.xAxis,
      type: 'category',
      data: airlineRecovery?.slice(0, 10).map((d: any) => d.carrier) || []
    },
    yAxis: { ...chartBaseOptions.yAxis, type: 'value', name: label.avgRecoveryAxis },
    series: [{
      type: 'bar',
      data: airlineRecovery?.slice(0, 10).map((d: any) => ({
        value: d.avgRecovery,
        itemStyle: { color: d.avgRecovery > 0 ? '#10b981' : '#ef4444' }
      })) || []
    }]
  };

  // 目的地追回成功率
  const destOption = {
    ...chartBaseOptions,
    tooltip: { ...chartBaseOptions.tooltip, trigger: 'axis' },
    xAxis: {
      ...chartBaseOptions.xAxis,
      type: 'category',
      data: destRecovery?.slice(0, 10).map((d: any) => d.dest) || [],
      axisLabel: { rotate: 45 }
    },
    yAxis: { ...chartBaseOptions.yAxis, type: 'value', name: label.recoveryRateAxis, max: 100 },
    series: [{
      type: 'bar',
      data: destRecovery?.slice(0, 10).map((d: any) => d.recoveryRate) || [],
      itemStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(16, 185, 129, 0.8)' },
            { offset: 1, color: 'rgba(16, 185, 129, 0.3)' }
          ]
        }
      }
    }]
  };

  return (
    <div className="space-y-6">
      {/* 关键指标 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title={label.highDelayFlights}
          value={recoveryStats?.totalHighDelayFlights?.toLocaleString() || '--'}
          subtitle={label.highDelaySub}
          icon={Plane}
          color="orange"
        />
        <KPICard
          title={label.avgRecovery}
          value={`${recoveryStats?.avgRecovery || '--'} ${label.minute}`}
          icon={TrendingUp}
          color="green"
        />
        <KPICard
          title={label.recoveryRate}
          value={`${recoveryStats?.recoveryRate || '--'}%`}
          subtitle={label.recoveryRateSub}
          icon={CheckCircle}
          color="cyan"
        />
        <KPICard
          title={label.avgSpeed}
          value={`${recoveryStats?.avgSpeed || '--'} mph`}
          icon={Plane}
          color="purple"
        />
      </div>

      {/* 分析说明 */}
      <div className="glass-panel p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
        <p className="text-sm text-orange-300">
          <strong>{label.method}</strong>{label.methodText}
        </p>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 速度 vs 延误 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            {label.speedTitle}
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            {label.speedDesc}
          </p>
          <div className="h-[300px]">
            <ReactECharts option={speedOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 起飞延误 vs 追回时间 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-400" />
            {label.recoveryTitle}
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            {label.recoveryDesc}
          </p>
          <div className="h-[300px]">
            <ReactECharts option={recoveryOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 航司追回能力 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <Plane className="w-5 h-5 text-cyan-400" />
            {label.airlineTitle}
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            {label.airlineDesc}
          </p>
          <div className="h-[300px]">
            <ReactECharts option={airlineOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 目的地追回成功率 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-purple-400" />
            {label.destTitle}
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            {label.destDesc}
          </p>
          <div className="h-[300px]">
            <ReactECharts option={destOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>

      {/* 关键结论 */}
      <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-green-500">
        <h3 className="text-lg font-medium text-slate-100 mb-3">{label.conclusionTitle}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
          <div className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span>{label.c1}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-cyan-400">✓</span>
            <span>{label.c2}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-400">✓</span>
            <span>{label.c3}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-400">✓</span>
            <span>{label.c4}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
