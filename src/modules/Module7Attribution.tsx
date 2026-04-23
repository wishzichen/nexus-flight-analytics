import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Wind, Thermometer, Plane, AlertTriangle, BarChart2 } from 'lucide-react';
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

export default function Module7Attribution() {
  const { data: ageAnalysis } = useFetch('/api/module7/age-analysis');
  const { data: weatherAnalysis } = useFetch('/api/module7/weather-analysis');
  const { data: correlationMatrix } = useFetch('/api/module7/correlation-matrix');
  const { data: featureImportance } = useFetch('/api/module7/feature-importance');
  const { data: weatherBoxplot } = useFetch('/api/module7/weather-boxplot');
  const { data: radarData } = useFetch('/api/module7/radar-data');
  const { data: conclusions } = useFetch('/api/module7/conclusions');

  // 机龄分组柱状图
  const ageOption = {
    ...chartBaseOptions,
    tooltip: { ...chartBaseOptions.tooltip, trigger: 'axis' },
    xAxis: {
      ...chartBaseOptions.xAxis,
      type: 'category',
      data: ageAnalysis?.map((d: any) => d.plane_age_group) || []
    },
    yAxis: { ...chartBaseOptions.yAxis, type: 'value', name: '平均延误(分钟)' },
    series: [{
      type: 'bar',
      data: ageAnalysis?.map((d: any) => ({
        value: d.avgDepDelay,
        itemStyle: { color: d.avgDepDelay > 15 ? '#f97316' : '#10b981' }
      })) || []
    }]
  };

  // 天气条件柱状图
  const weatherOption = {
    ...chartBaseOptions,
    tooltip: { ...chartBaseOptions.tooltip, trigger: 'axis' },
    xAxis: {
      ...chartBaseOptions.xAxis,
      type: 'category',
      data: weatherAnalysis?.map((d: any) => d.weather_condition) || []
    },
    yAxis: { ...chartBaseOptions.yAxis, type: 'value', name: '平均延误(分钟)' },
    series: [{
      type: 'bar',
      data: weatherAnalysis?.map((d: any) => ({
        value: d.avgDepDelay,
        itemStyle: { color: d.avgDepDelay > 15 ? '#ef4444' : '#06b6d4' }
      })) || []
    }]
  };

  // 特征重要性条形图
  const importanceOption = {
    ...chartBaseOptions,
    tooltip: { ...chartBaseOptions.tooltip, trigger: 'axis' },
    xAxis: { ...chartBaseOptions.yAxis, type: 'value', name: '重要性(%)' },
    yAxis: {
      ...chartBaseOptions.xAxis,
      type: 'category',
      data: [...(featureImportance || [])].reverse().map((d: any) => d.feature)
    },
    series: [{
      type: 'bar',
      data: [...(featureImportance || [])].reverse().map((d: any) => d.importance),
      itemStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: 'rgba(139, 92, 246, 0.3)' },
            { offset: 1, color: 'rgba(139, 92, 246, 0.8)' }
          ]
        }
      }
    }]
  };

  // 雷达图
  const radarOption = {
    backgroundColor: 'transparent',
    tooltip: {},
    radar: {
      indicator: radarData?.map((d: any) => ({ name: d.factor, max: 50 })) || [],
      axisName: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#1e293b' } },
      splitArea: { areaStyle: { color: ['rgba(15, 23, 42, 0.2)', 'rgba(15, 23, 42, 0.4)'] } }
    },
    series: [{
      type: 'radar',
      data: [{
        value: radarData?.map((d: any) => d.value) || [],
        name: '影响强度',
        areaStyle: { color: 'rgba(6, 182, 212, 0.3)' },
        lineStyle: { color: '#06b6d4' },
        itemStyle: { color: '#06b6d4' }
      }]
    }]
  };

  // 天气变量相关性热力图
  const corrHeatmapOption = {
    ...chartBaseOptions,
    tooltip: {
      ...chartBaseOptions.tooltip,
      formatter: (params: any) => `${params.name}: ${params.value}`
    },
    xAxis: {
      ...chartBaseOptions.xAxis,
      type: 'category',
      data: correlationMatrix?.map((d: any) => d.variable) || []
    },
    yAxis: {
      ...chartBaseOptions.yAxis,
      type: 'category',
      data: ['相关性']
    },
    visualMap: {
      min: -1,
      max: 1,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      inRange: { color: ['#ef4444', '#fbbf24', '#10b981'] },
      textStyle: { color: '#64748b' }
    },
    series: [{
      type: 'heatmap',
      data: correlationMatrix?.map((d: any, i: number) => [i, 0, d.correlation]) || []
    }]
  };

  return (
    <div className="space-y-6">
      {/* 关键指标 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="机龄相关性"
          value={conclusions?.ageCorrelation?.toFixed(3) || '--'}
          icon={Plane}
          color="cyan"
        />
        <KPICard
          title="最强天气因素"
          value={conclusions?.topWeatherFactor || '--'}
          icon={Wind}
          color="purple"
        />
        <KPICard
          title="老飞机延误增加"
          value={`${conclusions?.oldPlaneDelayIncrease || '--'}分钟`}
          icon={AlertTriangle}
          color="orange"
        />
        <KPICard
          title="恶劣天气延误增加"
          value={`${conclusions?.badWeatherDelayIncrease || '--'}分钟`}
          icon={Thermometer}
          color="red"
        />
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 机龄分析 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <Plane className="w-5 h-5 text-cyan-400" />
            机龄分组延误分析
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            不同机龄组的平均延误对比
          </p>
          <div className="h-[300px]">
            <ReactECharts option={ageOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 天气分析 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <Wind className="w-5 h-5 text-purple-400" />
            天气条件延误分析
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            不同天气条件下的平均延误对比
          </p>
          <div className="h-[300px]">
            <ReactECharts option={weatherOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 特征重要性 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-orange-400" />
            特征重要性排序
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            各因素对延误的影响强度排序
          </p>
          <div className="h-[300px]">
            <ReactECharts option={importanceOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 雷达图 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            多因素影响强度雷达图
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            各类因素对延误的综合影响
          </p>
          <div className="h-[300px]">
            <ReactECharts option={radarOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>

      {/* 天气变量相关性 */}
      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-lg font-medium text-slate-100 mb-4">天气变量与延误相关性</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {correlationMatrix?.map((item: any, i: number) => (
            <div key={i} className="p-3 rounded-lg bg-slate-800/50">
              <div className="text-sm text-slate-400">{item.variable}</div>
              <div className={`text-lg font-bold ${item.correlation > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {item.correlation.toFixed(3)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 关键结论 */}
      <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-orange-500">
        <h3 className="text-lg font-medium text-slate-100 mb-3">延误归因结论</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
          <div className="flex items-start gap-2">
            <span className="text-cyan-400">✓</span>
            <span>机龄与延误相关性较弱，老飞机并非主要延误原因</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-400">✓</span>
            <span>天气因素中，{conclusions?.topWeatherFactor || '风速'}对延误影响最大</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-400">✓</span>
            <span>低能见度天气下延误增加约{conclusions?.badWeatherDelayIncrease || '--'}分钟</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-400">✓</span>
            <span>时段因素(下午/晚间)比天气和机龄影响更显著</span>
          </div>
        </div>
      </div>
    </div>
  );
}
