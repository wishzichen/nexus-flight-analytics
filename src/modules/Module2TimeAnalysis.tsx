import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Clock, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
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

export default function Module2TimeAnalysis() {
  const { data: hourlyDepDelay } = useFetch('/api/module2/hourly-dep-delay');
  const { data: hourlyComparison } = useFetch('/api/module2/hourly-comparison');
  const { data: monthlyTrend } = useFetch('/api/module2/monthly-trend');
  const { data: weekdayAnalysis } = useFetch('/api/module2/weekday-analysis');
  const { data: weekdayHourHeatmap } = useFetch('/api/module2/weekday-hour-heatmap');
  const { data: periodAnalysis } = useFetch('/api/module2/period-analysis');
  const { data: conclusions } = useFetch('/api/module2/conclusions');

  // 双折线图：起飞延误 vs 到达延误
  const comparisonOption = {
    ...chartBaseOptions,
    tooltip: { ...chartBaseOptions.tooltip, trigger: 'axis' },
    legend: {
      data: ['起飞延误', '到达延误'],
      textStyle: { color: '#94a3b8' },
      top: 0
    },
    xAxis: {
      ...chartBaseOptions.xAxis,
      type: 'category',
      boundaryGap: false,
      data: hourlyComparison?.map((d: any) => `${d.hour}:00`) || []
    },
    yAxis: { ...chartBaseOptions.yAxis, type: 'value', name: '平均延误(分钟)' },
    series: [
      {
        name: '起飞延误',
        type: 'line',
        smooth: true,
        data: hourlyComparison?.map((d: any) => d.avgDepDelay) || [],
        lineStyle: { color: '#00f2ff' },
        itemStyle: { color: '#00f2ff' }
      },
      {
        name: '到达延误',
        type: 'line',
        smooth: true,
        data: hourlyComparison?.map((d: any) => d.avgArrDelay) || [],
        lineStyle: { color: '#8b5cf6' },
        itemStyle: { color: '#8b5cf6' }
      }
    ]
  };

  // 月份趋势面积图
  const monthlyOption = {
    ...chartBaseOptions,
    tooltip: { ...chartBaseOptions.tooltip, trigger: 'axis' },
    xAxis: {
      ...chartBaseOptions.xAxis,
      type: 'category',
      data: monthlyTrend?.map((d: any) => d.monthName) || []
    },
    yAxis: { ...chartBaseOptions.yAxis, type: 'value', name: '平均延误(分钟)' },
    series: [{
      type: 'line',
      data: monthlyTrend?.map((d: any) => d.avgDepDelay) || [],
      smooth: true,
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(139, 92, 246, 0.6)' },
            { offset: 1, color: 'rgba(139, 92, 246, 0.0)' }
          ]
        }
      },
      lineStyle: { color: '#8b5cf6' },
      itemStyle: { color: '#8b5cf6' }
    }]
  };

  // 星期分析柱状图
  const weekdayOption = {
    ...chartBaseOptions,
    tooltip: { ...chartBaseOptions.tooltip, trigger: 'axis' },
    xAxis: {
      ...chartBaseOptions.xAxis,
      type: 'category',
      data: weekdayAnalysis?.map((d: any) => d.weekdayName) || []
    },
    yAxis: { ...chartBaseOptions.yAxis, type: 'value', name: '平均延误(分钟)' },
    series: [{
      type: 'bar',
      data: weekdayAnalysis?.map((d: any) => ({
        value: d.avgDepDelay,
        itemStyle: {
          color: d.avgDepDelay > 15 ? '#f97316' : '#10b981'
        }
      })) || [],
      barWidth: '50%'
    }]
  };

  // 时段分析分组柱状图
  const periodOption = {
    ...chartBaseOptions,
    tooltip: { ...chartBaseOptions.tooltip, trigger: 'axis' },
    xAxis: {
      ...chartBaseOptions.xAxis,
      type: 'category',
      data: periodAnalysis?.map((d: any) => d.time_period) || [],
      axisLabel: { rotate: 30, color: '#64748b' }
    },
    yAxis: { ...chartBaseOptions.yAxis, type: 'value', name: '平均延误(分钟)' },
    series: [{
      type: 'bar',
      data: periodAnalysis?.map((d: any) => d.avgDepDelay) || [],
      itemStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(249, 115, 22, 0.8)' },
            { offset: 1, color: 'rgba(249, 115, 22, 0.3)' }
          ]
        }
      }
    }]
  };

  // 热力图
  const heatmapOption = {
    ...chartBaseOptions,
    tooltip: {
      ...chartBaseOptions.tooltip,
      formatter: (params: any) => `${params.data[1]} ${params.data[0]}:00<br/>平均延误: ${params.data[2]}分钟`
    },
    xAxis: {
      ...chartBaseOptions.xAxis,
      type: 'category',
      data: Array.from({ length: 19 }, (_, i) => i + 5)
    },
    yAxis: {
      ...chartBaseOptions.yAxis,
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    visualMap: {
      min: 0,
      max: 40,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      inRange: { color: ['#10b981', '#fbbf24', '#f97316', '#ef4444'] },
      textStyle: { color: '#64748b' }
    },
    series: [{
      type: 'heatmap',
      data: weekdayHourHeatmap?.map((d: any) => [d.hour, d.weekdayName, d.avgDelay]) || []
    }]
  };

  return (
    <div className="space-y-6">
      {/* 关键指标 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="早间平均延误"
          value={`${conclusions?.morningAvgDelay || '--'}分钟`}
          subtitle="5-12点"
          icon={Clock}
          color="green"
        />
        <KPICard
          title="下午平均延误"
          value={`${conclusions?.afternoonAvgDelay || '--'}分钟`}
          subtitle="12-18点"
          icon={Clock}
          color="orange"
        />
        <KPICard
          title="晚间平均延误"
          value={`${conclusions?.eveningAvgDelay || '--'}分钟`}
          subtitle="18-23点"
          icon={Clock}
          color="red"
        />
        <KPICard
          title="最差月份"
          value={conclusions?.maxVarMonth || '--'}
          subtitle="延误波动最大"
          icon={Calendar}
          color="purple"
        />
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 双折线图 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            24小时延误对比
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            起飞延误与到达延误的对比，观察空中追回效果
          </p>
          <div className="h-[300px]">
            <ReactECharts option={comparisonOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 月份趋势 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            月份延误趋势
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            各月份平均延误变化，识别季节性规律
          </p>
          <div className="h-[300px]">
            <ReactECharts option={monthlyOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 星期分析 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-400" />
            星期延误分析
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            周一至周日的延误差异，{conclusions?.worstWeekday || '--'}延误最严重
          </p>
          <div className="h-[300px]">
            <ReactECharts option={weekdayOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 时段分析 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-400" />
            时段延误分析
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            不同时段的延误程度对比
          </p>
          <div className="h-[300px]">
            <ReactECharts option={periodOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 热力图 */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            星期×小时延误热力图
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            精准定位高风险时段，{conclusions?.worstHour || '--'}:00为最差时刻
          </p>
          <div className="h-[350px]">
            <ReactECharts option={heatmapOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>

      {/* 关键结论 */}
      <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-orange-500">
        <h3 className="text-lg font-medium text-slate-100 mb-3">时间规律结论</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
          <div className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span>早间(5-9点)航班最准点，建议优先选择</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-400">✓</span>
            <span>下午延误比早间增加约{conclusions?.afternoonIncrease || '--'}分钟</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-400">✓</span>
            <span>晚间18-21点延误最严重，需预留充足时间</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-400">✓</span>
            <span>延误随全天运营累积，越晚越容易延误</span>
          </div>
        </div>
      </div>
    </div>
  );
}
