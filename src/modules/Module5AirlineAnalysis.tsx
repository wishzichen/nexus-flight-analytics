import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Building, Plane, CheckCircle, AlertTriangle } from 'lucide-react';
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

export default function Module5AirlineAnalysis({ interactiveData }: { interactiveData?: any }) {
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const label = isZh ? {
    fleet: '\u673a\u961f',
    aircraft: '\u67b6',
    avgDelay: '\u5e73\u5747\u5ef6\u8bef',
    avgDelayAxis: '\u5e73\u5747\u5ef6\u8bef(\u5206\u949f)',
    minute: '\u5206\u949f',
    flightCount: '\u822a\u73ed\u91cf',
    onTimeRate: '\u51c6\u70b9\u7387',
    airlineCount: '\u822a\u53f8\u603b\u6570',
    bestAirline: '\u6700\u4f73\u822a\u53f8',
    worstAirline: '\u5ef6\u8bef\u6700\u9ad8\u822a\u53f8',
    avgFleet: '\u5e73\u5747\u673a\u961f',
    fleetTitle: '\u673a\u961f\u89c4\u6a21 vs \u5e73\u5747\u5ef6\u8bef',
    fleetDesc: '\u6c14\u6ce1\u5927\u5c0f\u8868\u793a\u822a\u73ed\u91cf\uff0c\u7528\u4e8e\u63a2\u7d22\u89c4\u6a21\u4e0e\u5ef6\u8bef\u7684\u5173\u7cfb\u3002',
    bubbleTitle: '\u822a\u73ed\u91cf vs \u51c6\u70b9\u7387',
    bubbleDesc: '\u6c14\u6ce1\u5927\u5c0f\u8868\u793a\u673a\u961f\u89c4\u6a21\uff0c\u989c\u8272\u8868\u793a\u51c6\u70b9\u7387\u7b49\u7ea7\u3002',
    delayRankTitle: '\u822a\u53f8\u5ef6\u8bef\u6392\u540d',
    delayRankDesc: '\u6309\u5e73\u5747\u8d77\u98de\u5ef6\u8bef\u6392\u5e8f\uff0c\u7ea2\u8272\u8868\u793a\u4e25\u91cd\u5ef6\u8bef\u3002',
    ontimeRankTitle: '\u822a\u53f8\u51c6\u70b9\u7387\u6392\u540d',
    ontimeRankDesc: '\u6309\u51c6\u70b9\u7387\u6392\u5e8f\uff0c\u7eff\u8272\u8868\u793a\u8868\u73b0\u4f18\u79c0\u3002',
    quadrantTitle: '\u822a\u53f8\u8c61\u9650\u5206\u6790',
    more: '\u7b49',
    companies: '\u5bb6',
    conclusionTitle: '\u822a\u53f8\u8868\u73b0\u7ed3\u8bba',
    c1: 'HA \u51c6\u70b9\u7387\u8f83\u9ad8\uff0c\u901a\u5e38\u5177\u5907\u8f83\u5f3a\u7684\u5230\u8fbe\u8868\u73b0\u3002',
    c2: 'EV \u5ef6\u8bef\u538b\u529b\u66f4\u91cd\uff0c\u9009\u62e9\u65f6\u9700\u8981\u9884\u7559\u66f4\u591a\u7f13\u51b2\u3002',
    c3: '\u89c4\u6a21\u4e0e\u5ef6\u8bef\u5e76\u4e0d\u603b\u662f\u5f3a\u76f8\u5173\uff0c\u5c0f\u822a\u53f8\u4e5f\u53ef\u80fd\u8868\u73b0\u4f18\u79c0\u3002',
    c4: 'UA\u3001DL \u7b49\u5927\u578b\u822a\u53f8\u51c6\u70b9\u7387\u8f83\u7a33\u5b9a\uff0c\u8fd0\u8425\u6548\u7387\u8f83\u9ad8\u3002',
  } : {
    fleet: 'Fleet',
    aircraft: 'aircraft',
    avgDelay: 'Avg delay',
    avgDelayAxis: 'Avg delay (min)',
    minute: 'min',
    flightCount: 'Flight count',
    onTimeRate: 'On-time rate',
    airlineCount: 'Airlines',
    bestAirline: 'Best Airline',
    worstAirline: 'Worst Airline',
    avgFleet: 'Avg Fleet',
    fleetTitle: 'Fleet Size vs Avg Delay',
    fleetDesc: 'Bubble size shows flight volume while comparing scale and delay.',
    bubbleTitle: 'Flight Volume vs On-time Rate',
    bubbleDesc: 'Bubble size shows fleet scale; color indicates on-time performance.',
    delayRankTitle: 'Airline Delay Ranking',
    delayRankDesc: 'Ranked by average departure delay. Red indicates severe delay.',
    ontimeRankTitle: 'Airline On-time Ranking',
    ontimeRankDesc: 'Ranked by on-time rate. Green indicates stronger performance.',
    quadrantTitle: 'Airline Quadrant Analysis',
    more: 'and',
    companies: 'more',
    conclusionTitle: 'Airline Performance Findings',
    c1: 'HA has the strongest on-time performance and often arrives early.',
    c2: 'EV shows the heaviest delay pressure and should be selected carefully.',
    c3: 'Fleet scale is not strongly correlated with delay; smaller carriers can still perform well.',
    c4: 'Large carriers such as UA and DL show stable on-time performance and efficient operations.',
  };
  const quadrantLabels: Record<string, string> = {
    largeHigh: isZh ? '\u5927\u89c4\u6a21\u9ad8\u51c6\u70b9' : 'Large scale, high punctuality',
    largeLow: isZh ? '\u5927\u89c4\u6a21\u4f4e\u51c6\u70b9' : 'Large scale, low punctuality',
    smallHigh: isZh ? '\u5c0f\u89c4\u6a21\u9ad8\u51c6\u70b9' : 'Small scale, high punctuality',
    smallLow: isZh ? '\u5c0f\u89c4\u6a21\u4f4e\u51c6\u70b9' : 'Small scale, low punctuality',
  };

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

  const fleetOption = {
    ...chartBaseOptions,
    tooltip: {
      ...chartBaseOptions.tooltip,
      formatter: (params: any) =>
        `${params.data[3]}<br/>${label.fleet}: ${params.data[0]}${label.aircraft}<br/>${label.avgDelay}: ${params.data[1]}${label.minute}`
    },
    xAxis: { ...chartBaseOptions.xAxis, type: 'value', name: isZh ? `${label.fleet}规模(${label.aircraft})` : 'Fleet size' },
    yAxis: { ...chartBaseOptions.yAxis, type: 'value', name: label.avgDelayAxis },
    series: [{
      type: 'scatter',
      symbolSize: (data: number[]) => Math.sqrt(data[2]) / 5,
      data: activeFleetScatter?.map((d: any) => [d.planeCount, d.avgDepDelay, d.flightCount, d.carrier_name]) || [],
      itemStyle: { color: 'rgba(139, 92, 246, 0.6)' }
    }]
  };

  // 鍑嗙偣鐜囨皵娉″浘
  const bubbleOption = {
    ...chartBaseOptions,
    tooltip: {
      ...chartBaseOptions.tooltip,
      formatter: (params: any) =>
        `${params.data[3]}<br/>${label.flightCount}: ${params.data[0]}<br/>${label.onTimeRate}: ${params.data[1]}%<br/>${label.fleet}: ${params.data[2]}${label.aircraft}`
    },
    xAxis: { ...chartBaseOptions.xAxis, type: 'value', name: label.flightCount },
    yAxis: { ...chartBaseOptions.yAxis, type: 'value', name: `${label.onTimeRate}(%)`, min: 50, max: 100 },
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

  const delayRankOption = {
    ...chartBaseOptions,
    tooltip: { ...chartBaseOptions.tooltip, trigger: 'axis' },
    xAxis: {
      ...chartBaseOptions.xAxis,
      type: 'category',
      data: activeDelayRanking?.slice(0, 10).map((d: any) => d.carrier) || []
    },
    yAxis: { ...chartBaseOptions.yAxis, type: 'value', name: label.avgDelayAxis },
    series: [{
      type: 'bar',
      data: activeDelayRanking?.slice(0, 10).map((d: any) => ({
        value: d.avgDepDelay,
        itemStyle: { color: d.avgDepDelay > 15 ? '#ef4444' : '#fbbf24' }
      })) || []
    }]
  };

  // 鍑嗙偣鐜囨帓鍚嶆煴鐘跺浘
  const ontimeRankOption = {
    ...chartBaseOptions,
    tooltip: { ...chartBaseOptions.tooltip, trigger: 'axis' },
    xAxis: {
      ...chartBaseOptions.xAxis,
      type: 'category',
      data: activeOntimeRanking?.slice(0, 10).map((d: any) => d.carrier) || []
    },
    yAxis: { ...chartBaseOptions.yAxis, type: 'value', name: `${label.onTimeRate}(%)`, max: 100 },
    series: [{
      type: 'bar',
      data: activeOntimeRanking?.slice(0, 10).map((d: any) => ({
        value: d.onTimeRate,
        itemStyle: { color: d.onTimeRate >= 80 ? '#10b981' : '#06b6d4' }
      })) || []
    }]
  };

  // 璞￠檺鍒嗘瀽
  const bestAirline = activeOntimeRanking?.[0];
  const worstAirline = activeDelayRanking?.[0];

  return (
    <div className="space-y-6">
      {/* 鍏抽敭鎸囨爣 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title={label.airlineCount}
          value={activeAirlineStats?.length || '--'}
          icon={Building}
          color="cyan"
        />
        <KPICard
          title={label.bestAirline}
          value={bestAirline?.carrier || '--'}
          subtitle={`${label.onTimeRate} ${bestAirline?.onTimeRate || '--'}%`}
          icon={CheckCircle}
          color="green"
        />
        <KPICard
          title={label.worstAirline}
          value={worstAirline?.carrier || '--'}
          subtitle={`${label.avgDelay} ${worstAirline?.avgDepDelay || '--'} ${label.minute}`}
          icon={AlertTriangle}
          color="red"
        />
        <KPICard
          title={label.avgFleet}
          value={`${Math.round(activeAirlineStats?.reduce((a: number, b: any) => a + b.planeCount, 0) / (activeAirlineStats?.length || 1)) || '--'} ${label.aircraft}`}
          icon={Plane}
          color="purple"
        />
      </div>

      {/* 鍥捐〃鍖哄煙 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 鏈洪槦瑙勬ā vs 寤惰 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <Plane className="w-5 h-5 text-purple-400" />
            {label.fleetTitle}
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            {label.fleetDesc}
          </p>
          <div className="h-[300px]">
            <ReactECharts option={fleetOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 鍑嗙偣鐜囨皵娉″浘 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            {label.bubbleTitle}
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            {label.bubbleDesc}
          </p>
          <div className="h-[300px]">
            <ReactECharts option={bubbleOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 寤惰鎺掑悕 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            {label.delayRankTitle}
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            {label.delayRankDesc}
          </p>
          <div className="h-[300px]">
            <ReactECharts option={delayRankOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 鍑嗙偣鐜囨帓鍚?*/}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-cyan-400" />
            {label.ontimeRankTitle}
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            {label.ontimeRankDesc}
          </p>
          <div className="h-[300px]">
            <ReactECharts option={ontimeRankOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-lg font-medium text-slate-100 mb-4">{label.quadrantTitle}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries((quadrantData || []).reduce((acc: Record<string, any[]>, item: any) => {
            const key = item.quadrant || 'other';
            acc[key] = acc[key] || [];
            acc[key].push(item);
            return acc;
          }, {})).slice(0, 4).map(([quadrant, airlines], i) => {
            const titles = Object.values(quadrantLabels);
            return (
              <div key={quadrant} className={`rounded-xl border p-4 ${i === 0 ? 'border-green-500/20 bg-green-500/10' : i === 1 ? 'border-orange-500/20 bg-orange-500/10' : i === 2 ? 'border-cyan-500/20 bg-cyan-500/10' : 'border-red-500/20 bg-red-500/10'}`}>
                <div className={`mb-2 text-sm font-medium ${i === 0 ? 'text-green-400' : i === 1 ? 'text-orange-400' : i === 2 ? 'text-cyan-400' : 'text-red-400'}`}>{titles[i] || String(quadrant)}</div>
                <div className="text-xs text-slate-400">
                  {(airlines as any[]).slice(0, 3).map((airline: any) => (
                    <div key={airline.carrier}>{airline.carrier} - {airline.carrier_name}</div>
                  ))}
                  {(airlines as any[]).length > 3 && (
                    <div>{isZh ? `...?${(airlines as any[]).length}?` : `...and ${(airlines as any[]).length} ${label.companies}`}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-cyan-500">
        <h3 className="text-lg font-medium text-slate-100 mb-3">{label.conclusionTitle}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
          {[label.c1, label.c2, label.c3, label.c4].map((item, index) => (
            <div key={item} className="flex items-start gap-2">
              <span className={index === 0 ? 'text-green-400' : index === 1 ? 'text-red-400' : index === 2 ? 'text-cyan-400' : 'text-purple-400'}>?</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
