import React from 'react';
import ReactECharts from 'echarts-for-react';
import { MapPin, Navigation, AlertTriangle, TrendingUp } from 'lucide-react';
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

export default function Module3RouteAnalysis() {
  const { data: topDestVolume } = useFetch('/api/module3/top-destinations-volume');
  const { data: topDestDelay } = useFetch('/api/module3/top-destinations-delay');
  const { data: bubbleData } = useFetch('/api/module3/bubble-data');
  const { data: routeAnalysis } = useFetch('/api/module3/route-analysis');
  const { data: jfkRisky } = useFetch('/api/module3/jfk-risky-routes');
  const { data: ewrRisky } = useFetch('/api/module3/ewr-risky-routes');
  const { data: lgaRisky } = useFetch('/api/module3/lga-risky-routes');

  // 最繁忙目的地条形图
  const volumeOption = {
    ...chartBaseOptions,
    tooltip: { ...chartBaseOptions.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: { ...chartBaseOptions.yAxis, type: 'value', name: '航班量' },
    yAxis: {
      ...chartBaseOptions.xAxis,
      type: 'category',
      data: [...(topDestVolume || [])].reverse().map((d: any) => d.dest)
    },
    series: [{
      type: 'bar',
      data: [...(topDestVolume || [])].reverse().map((d: any) => d.flightCount),
      itemStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: 'rgba(6, 182, 212, 0.3)' },
            { offset: 1, color: 'rgba(6, 182, 212, 0.8)' }
          ]
        },
        borderRadius: [0, 4, 4, 0]
      }
    }]
  };

  // 最易延误目的地条形图
  const delayOption = {
    ...chartBaseOptions,
    tooltip: { ...chartBaseOptions.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: { ...chartBaseOptions.yAxis, type: 'value', name: '平均延误(分钟)' },
    yAxis: {
      ...chartBaseOptions.xAxis,
      type: 'category',
      data: [...(topDestDelay || [])].reverse().map((d: any) => d.dest)
    },
    series: [{
      type: 'bar',
      data: [...(topDestDelay || [])].reverse().map((d: any) => d.avgArrDelay),
      itemStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
            { offset: 1, color: 'rgba(239, 68, 68, 0.8)' }
          ]
        },
        borderRadius: [0, 4, 4, 0]
      }
    }]
  };

  // 气泡图：航班量 vs 延误
  const bubbleOption = {
    ...chartBaseOptions,
    tooltip: {
      ...chartBaseOptions.tooltip,
      formatter: (params: any) => {
        const d = params.data;
        return `${d[3]}<br/>航班量: ${d[0]}<br/>平均延误: ${d[1]}分钟<br/>距离: ${d[2]}英里`;
      }
    },
    xAxis: { ...chartBaseOptions.xAxis, type: 'value', name: '航班量' },
    yAxis: { ...chartBaseOptions.yAxis, type: 'value', name: '平均延误(分钟)' },
    series: [{
      type: 'scatter',
      symbolSize: (data: number[]) => Math.sqrt(data[2]) / 2,
      data: bubbleData?.map((d: any) => [d.flightCount, d.avgArrDelay, d.avgDistance, d.dest_name]) || [],
      itemStyle: {
        color: (params: any) => {
          const delay = params.data[1];
          if (delay < 10) return 'rgba(16, 185, 129, 0.7)';
          if (delay < 20) return 'rgba(251, 191, 36, 0.7)';
          return 'rgba(239, 68, 68, 0.7)';
        }
      }
    }]
  };

  return (
    <div className="space-y-6">
      {/* 关键指标 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="目的地总数"
          value={bubbleData?.length || '--'}
          icon={MapPin}
          color="cyan"
        />
        <KPICard
          title="最繁忙目的地"
          value={topDestVolume?.[0]?.dest || '--'}
          subtitle={topDestVolume?.[0]?.dest_name}
          icon={Navigation}
          color="purple"
        />
        <KPICard
          title="最易延误目的地"
          value={topDestDelay?.[0]?.dest || '--'}
          subtitle={`平均延误${topDestDelay?.[0]?.avgArrDelay || '--'}分钟`}
          icon={AlertTriangle}
          color="red"
        />
        <KPICard
          title="航线总数"
          value={routeAnalysis?.length || '--'}
          icon={TrendingUp}
          color="green"
        />
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最繁忙目的地 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-cyan-400" />
            最繁忙目的地 Top 10
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            从纽约出发航班量最大的目的地
          </p>
          <div className="h-[300px]">
            <ReactECharts option={volumeOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 最易延误目的地 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            最易延误目的地 Top 10
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            平均到达延误最严重的目的地
          </p>
          <div className="h-[300px]">
            <ReactECharts option={delayOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 气泡图 */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            航班量 vs 延误程度
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            气泡大小表示飞行距离，颜色表示延误程度（绿色&lt;10分钟，黄色10-20分钟，红色&gt;20分钟）
          </p>
          <div className="h-[350px]">
            <ReactECharts option={bubbleOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>

      {/* 各机场高风险航线 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-5 rounded-2xl">
          <h4 className="text-md font-medium text-slate-100 mb-3">JFK 高风险航线</h4>
          <div className="space-y-2">
            {jfkRisky?.slice(0, 5).map((r: any, i: number) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-slate-300">{r.dest} - {r.dest_name}</span>
                <span className="text-orange-400">{r.avgDepDelay}分钟</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-panel p-5 rounded-2xl">
          <h4 className="text-md font-medium text-slate-100 mb-3">EWR 高风险航线</h4>
          <div className="space-y-2">
            {ewrRisky?.slice(0, 5).map((r: any, i: number) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-slate-300">{r.dest} - {r.dest_name}</span>
                <span className="text-orange-400">{r.avgDepDelay}分钟</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-panel p-5 rounded-2xl">
          <h4 className="text-md font-medium text-slate-100 mb-3">LGA 高风险航线</h4>
          <div className="space-y-2">
            {lgaRisky?.slice(0, 5).map((r: any, i: number) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-slate-300">{r.dest} - {r.dest_name}</span>
                <span className="text-orange-400">{r.avgDepDelay}分钟</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 关键结论 */}
      <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-purple-500">
        <h3 className="text-lg font-medium text-slate-100 mb-3">航线分析结论</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
          <div className="flex items-start gap-2">
            <span className="text-cyan-400">•</span>
            <span>ORD(芝加哥)、ATL(亚特兰大)为最繁忙目的地</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-400">•</span>
            <span>CAE(哥伦比亚)、TUL(塔尔萨)延误最严重</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-400">•</span>
            <span>长途航线延误风险更高，需特别关注</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-400">•</span>
            <span>EWR机场整体延误率高于JFK和LGA</span>
          </div>
        </div>
      </div>
    </div>
  );
}
