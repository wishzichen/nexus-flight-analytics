import React from 'react';
import ReactECharts from 'echarts-for-react';
import { MapPin, Navigation, AlertTriangle, TrendingUp } from 'lucide-react';
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

export default function Module3RouteAnalysis({ interactiveData }: { interactiveData?: any }) {
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const label = {
    flightCount: isZh ? '航班量' : 'Flight count',
    avgDelayAxis: isZh ? '平均延误(分钟)' : 'Avg delay (min)',
    avgDelay: isZh ? '平均延误' : 'Avg delay',
    distance: isZh ? '距离' : 'Distance',
    minute: isZh ? '分钟' : 'min',
    mile: isZh ? '英里' : 'mi',
    destinationCount: isZh ? '目的地总数' : 'Destinations',
    busiestDestination: isZh ? '最繁忙目的地' : 'Busiest Destination',
    riskiestDestination: isZh ? '最易延误目的地' : 'Most Delay-prone Destination',
    routeCount: isZh ? '航线总数' : 'Routes',
    busiestTitle: isZh ? '最繁忙目的地 Top 10' : 'Busiest Destinations Top 10',
    busiestDesc: isZh ? '从纽约出发航班量最大的目的地' : 'Destinations with the highest outbound volume from NYC.',
    delayTitle: isZh ? '最易延误目的地 Top 10' : 'Most Delay-prone Destinations Top 10',
    delayDesc: isZh ? '平均到达延误最严重的目的地' : 'Destinations with the highest average arrival delay.',
    bubbleTitle: isZh ? '航班量 vs 延误程度' : 'Flight Volume vs Delay Severity',
    bubbleDesc: isZh
      ? '气泡大小表示飞行距离，颜色表示延误程度（绿色<10分钟，黄色10-20分钟，红色>20分钟）'
      : 'Bubble size shows route distance. Color indicates delay severity: green <10 min, yellow 10-20 min, red >20 min.',
    riskRoutes: isZh ? '高风险航线' : 'High-risk Routes',
    conclusionTitle: isZh ? '航线分析结论' : 'Route Analysis Findings',
    c1: isZh ? 'ORD(芝加哥)、ATL(亚特兰大)为最繁忙目的地' : 'ORD and ATL are among the busiest destination markets.',
    c2: isZh ? 'CAE(哥伦比亚)、TUL(塔尔萨)延误最严重' : 'CAE and TUL show some of the highest destination delay levels.',
    c3: isZh ? '长途航线延误风险更高，需特别关注' : 'Long-haul routes carry higher delay risk and need closer buffer planning.',
    c4: isZh ? 'EWR机场整体延误率高于JFK和LGA' : 'EWR has higher overall delay pressure than JFK and LGA.',
  };
  Object.assign(label, isZh ? {
    flightCount: '航班量',
    avgDelayAxis: '平均延误(分钟)',
    avgDelay: '平均延误',
    distance: '距离',
    minute: '分钟',
    mile: '英里',
    destinationCount: '目的地总数',
    busiestDestination: '最繁忙目的地',
    riskiestDestination: '最易延误目的地',
    routeCount: '航线总数',
    busiestTitle: '最繁忙目的地 Top 10',
    busiestDesc: '从纽约出发航班量最大的目的地。',
    delayTitle: '最易延误目的地 Top 10',
    delayDesc: '平均到达延误最严重的目的地。',
    bubbleTitle: '航班量 vs 延误程度',
    bubbleDesc: '气泡大小表示飞行距离，颜色表示延误程度：绿色 <10 分钟，黄色 10-20 分钟，红色 >20 分钟。',
    riskRoutes: '高风险航线',
    conclusionTitle: '航线分析结论',
    c1: 'ORD 和 ATL 是最繁忙的目的地市场之一。',
    c2: 'CAE 和 TUL 等目的地表现出较高延误水平。',
    c3: '长途航线延误风险更高，需要更充分的时间缓冲。',
    c4: 'EWR 机场整体延误压力通常高于 JFK 和 LGA。',
  } : {
    flightCount: 'Flight count',
    avgDelayAxis: 'Avg delay (min)',
    avgDelay: 'Avg delay',
    distance: 'Distance',
    minute: 'min',
    mile: 'mi',
    destinationCount: 'Destinations',
    busiestDestination: 'Busiest Destination',
    riskiestDestination: 'Most Delay-prone Destination',
    routeCount: 'Routes',
    busiestTitle: 'Busiest Destinations Top 10',
    busiestDesc: 'Destinations with the highest outbound volume from NYC.',
    delayTitle: 'Most Delay-prone Destinations Top 10',
    delayDesc: 'Destinations with the highest average arrival delay.',
    bubbleTitle: 'Flight Volume vs Delay Severity',
    bubbleDesc: 'Bubble size shows route distance. Color indicates delay severity: green <10 min, yellow 10-20 min, red >20 min.',
    riskRoutes: 'High-risk Routes',
    conclusionTitle: 'Route Analysis Findings',
    c1: 'ORD and ATL are among the busiest destination markets.',
    c2: 'CAE and TUL show some of the highest destination delay levels.',
    c3: 'Long-haul routes carry higher delay risk and need closer buffer planning.',
    c4: 'EWR has higher overall delay pressure than JFK and LGA.',
  });
  Object.assign(label, isZh ? {
    flightCount: '航班量',
    avgDelayAxis: '平均延误(分钟)',
    avgDelay: '平均延误',
    distance: '距离',
    minute: '分钟',
    mile: '英里',
    destinationCount: '目的地总数',
    busiestDestination: '最繁忙目的地',
    riskiestDestination: '最易延误目的地',
    routeCount: '航线总数',
    busiestTitle: '最繁忙目的地 Top 10',
    busiestDesc: '从纽约出发航班量最大的目的地。',
    delayTitle: '最易延误目的地 Top 10',
    delayDesc: '平均到达延误最严重的目的地。',
    bubbleTitle: '航班量 vs 延误程度',
    bubbleDesc: '气泡大小表示飞行距离，颜色表示延误程度：绿色 <10 分钟，黄色 10-20 分钟，红色 >20 分钟。',
    riskRoutes: '高风险航线',
    conclusionTitle: '航线分析结论',
    c1: 'ORD 和 ATL 是最繁忙的目的地市场之一。',
    c2: 'CAE 和 TUL 等目的地表现出较高延误水平。',
    c3: '长途航线延误风险更高，需要更充分的时间缓冲。',
    c4: 'EWR 机场整体延误压力通常高于 JFK 和 LGA。',
  } : {});
  const { data: topDestVolume } = useFetch('/api/module3/top-destinations-volume');
  const { data: topDestDelay } = useFetch('/api/module3/top-destinations-delay');
  const { data: bubbleData } = useFetch('/api/module3/bubble-data');
  const { data: routeAnalysis } = useFetch('/api/module3/route-analysis');
  const { data: jfkRisky } = useFetch('/api/module3/jfk-risky-routes');
  const { data: ewrRisky } = useFetch('/api/module3/ewr-risky-routes');
  const { data: lgaRisky } = useFetch('/api/module3/lga-risky-routes');

  const activeTopDestVolume = interactiveData?.topDestinationsVolume || topDestVolume;
  const activeTopDestDelay = interactiveData?.topDestinationsDelay || topDestDelay;
  const activeBubbleData = interactiveData?.bubbleData || bubbleData;
  const activeRouteAnalysis = interactiveData?.routeAnalysis || routeAnalysis;

  // 最繁忙目的地条形图
  const volumeOption = {
    ...chartBaseOptions,
    tooltip: { ...chartBaseOptions.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: { ...chartBaseOptions.yAxis, type: 'value', name: label.flightCount },
    yAxis: {
      ...chartBaseOptions.xAxis,
      type: 'category',
      data: [...(activeTopDestVolume || [])].reverse().map((d: any) => d.dest)
    },
    series: [{
      type: 'bar',
      data: [...(activeTopDestVolume || [])].reverse().map((d: any) => d.flightCount),
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
    xAxis: { ...chartBaseOptions.yAxis, type: 'value', name: label.avgDelayAxis },
    yAxis: {
      ...chartBaseOptions.xAxis,
      type: 'category',
      data: [...(activeTopDestDelay || [])].reverse().map((d: any) => d.dest)
    },
    series: [{
      type: 'bar',
      data: [...(activeTopDestDelay || [])].reverse().map((d: any) => d.avgArrDelay),
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
        return `${d[3]}<br/>${label.flightCount}: ${d[0]}<br/>${label.avgDelay}: ${d[1]}${label.minute}<br/>${label.distance}: ${d[2]}${label.mile}`;
      }
    },
    xAxis: { ...chartBaseOptions.xAxis, type: 'value', name: label.flightCount },
    yAxis: { ...chartBaseOptions.yAxis, type: 'value', name: label.avgDelayAxis },
    series: [{
      type: 'scatter',
      symbolSize: (data: number[]) => Math.sqrt(data[2]) / 2,
      data: activeBubbleData?.map((d: any) => [d.flightCount, d.avgArrDelay, d.avgDistance, d.dest_name]) || [],
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
          title={label.destinationCount}
          value={activeBubbleData?.length || '--'}
          icon={MapPin}
          color="cyan"
        />
        <KPICard
          title={label.busiestDestination}
          value={activeTopDestVolume?.[0]?.dest || '--'}
          subtitle={activeTopDestVolume?.[0]?.dest_name}
          icon={Navigation}
          color="purple"
        />
        <KPICard
          title={label.riskiestDestination}
          value={activeTopDestDelay?.[0]?.dest || '--'}
          subtitle={`${label.avgDelay} ${activeTopDestDelay?.[0]?.avgArrDelay || '--'} ${label.minute}`}
          icon={AlertTriangle}
          color="red"
        />
        <KPICard
          title={label.routeCount}
          value={activeRouteAnalysis?.length || '--'}
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
            {label.busiestTitle}
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            {label.busiestDesc}
          </p>
          <div className="h-[300px]">
            <ReactECharts option={volumeOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 最易延误目的地 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            {label.delayTitle}
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            {label.delayDesc}
          </p>
          <div className="h-[300px]">
            <ReactECharts option={delayOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 气泡图 */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            {label.bubbleTitle}
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            {label.bubbleDesc}
          </p>
          <div className="h-[350px]">
            <ReactECharts option={bubbleOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>

      {/* 各机场高风险航线 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-5 rounded-2xl">
          <h4 className="text-md font-medium text-slate-100 mb-3">JFK {label.riskRoutes}</h4>
          <div className="space-y-2">
            {jfkRisky?.slice(0, 5).map((r: any, i: number) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-slate-300">{r.dest} - {r.dest_name}</span>
                <span className="text-orange-400">{r.avgDepDelay} {label.minute}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-panel p-5 rounded-2xl">
          <h4 className="text-md font-medium text-slate-100 mb-3">EWR {label.riskRoutes}</h4>
          <div className="space-y-2">
            {ewrRisky?.slice(0, 5).map((r: any, i: number) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-slate-300">{r.dest} - {r.dest_name}</span>
                <span className="text-orange-400">{r.avgDepDelay} {label.minute}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-panel p-5 rounded-2xl">
          <h4 className="text-md font-medium text-slate-100 mb-3">LGA {label.riskRoutes}</h4>
          <div className="space-y-2">
            {lgaRisky?.slice(0, 5).map((r: any, i: number) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-slate-300">{r.dest} - {r.dest_name}</span>
                <span className="text-orange-400">{r.avgDepDelay} {label.minute}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 关键结论 */}
      <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-purple-500">
        <h3 className="text-lg font-medium text-slate-100 mb-3">{label.conclusionTitle}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
          <div className="flex items-start gap-2">
            <span className="text-cyan-400">•</span>
            <span>{label.c1}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-400">•</span>
            <span>{label.c2}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-400">•</span>
            <span>{label.c3}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-400">•</span>
            <span>{label.c4}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
