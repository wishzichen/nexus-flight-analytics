import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Plane, TrendingUp, Clock, CheckCircle } from 'lucide-react';
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

export default function Module4AirRecovery() {
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
        `速度: ${params.value[0].toFixed(0)} mph<br/>到达延误: ${params.value[1].toFixed(0)}分钟`
    },
    xAxis: { ...chartBaseOptions.xAxis, type: 'value', name: '飞行速度(mph)' },
    yAxis: { ...chartBaseOptions.yAxis, type: 'value', name: '到达延误(分钟)' },
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
        `起飞延误: ${params.value[0].toFixed(0)}分钟<br/>追回时间: ${params.value[1].toFixed(0)}分钟`
    },
    xAxis: { ...chartBaseOptions.xAxis, type: 'value', name: '起飞延误(分钟)' },
    yAxis: { ...chartBaseOptions.yAxis, type: 'value', name: '追回时间(分钟)' },
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
    yAxis: { ...chartBaseOptions.yAxis, type: 'value', name: '平均追回(分钟)' },
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
    yAxis: { ...chartBaseOptions.yAxis, type: 'value', name: '追回成功率(%)', max: 100 },
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
          title="高延误航班数"
          value={recoveryStats?.totalHighDelayFlights?.toLocaleString() || '--'}
          subtitle="起飞延误>60分钟"
          icon={Plane}
          color="orange"
        />
        <KPICard
          title="平均追回时间"
          value={`${recoveryStats?.avgRecovery || '--'}分钟`}
          icon={TrendingUp}
          color="green"
        />
        <KPICard
          title="追回成功率"
          value={`${recoveryStats?.recoveryRate || '--'}%`}
          subtitle="成功追回时间的航班比例"
          icon={CheckCircle}
          color="cyan"
        />
        <KPICard
          title="平均飞行速度"
          value={`${recoveryStats?.avgSpeed || '--'} mph`}
          icon={Plane}
          color="purple"
        />
      </div>

      {/* 分析说明 */}
      <div className="glass-panel p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
        <p className="text-sm text-orange-300">
          <strong>分析口径：</strong>仅分析起飞延误超过60分钟的高延误航班，排除飞行时间缺失或异常的数据。
          追回时间 = 起飞延误 - 到达延误，正值表示在空中追回了时间。
        </p>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 速度 vs 延误 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            飞行速度 vs 到达延误
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            速度越快，到达延误越小的趋势
          </p>
          <div className="h-[300px]">
            <ReactECharts option={speedOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 起飞延误 vs 追回时间 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-400" />
            起飞延误 vs 追回时间
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            虚线上方表示追回时间，下方表示延误加剧
          </p>
          <div className="h-[300px]">
            <ReactECharts option={recoveryOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 航司追回能力 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <Plane className="w-5 h-5 text-cyan-400" />
            航司追回能力对比
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            各航司在高延误情况下的平均追回时间
          </p>
          <div className="h-[300px]">
            <ReactECharts option={airlineOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 目的地追回成功率 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-purple-400" />
            目的地追回成功率
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            飞往不同目的地的追回成功率
          </p>
          <div className="h-[300px]">
            <ReactECharts option={destOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>

      {/* 关键结论 */}
      <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-green-500">
        <h3 className="text-lg font-medium text-slate-100 mb-3">空中追回结论</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
          <div className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span>约{recoveryStats?.recoveryRate || '--'}%的高延误航班成功追回时间</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-cyan-400">✓</span>
            <span>平均追回{recoveryStats?.avgRecovery || '--'}分钟，部分航班可完全追回</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-400">✓</span>
            <span>长途航线追回空间更大，短途航线追回困难</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-400">✓</span>
            <span>航司运营策略影响追回能力，部分航司表现优异</span>
          </div>
        </div>
      </div>
    </div>
  );
}
