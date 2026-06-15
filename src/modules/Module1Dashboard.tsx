import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Plane, AlertTriangle, Clock, CheckCircle, TrendingUp, MapPin
} from 'lucide-react';
import KPICard from '../components/charts/KPICard';
import { useFetch } from '../hooks/useModuleData';
import DataError from '../components/common/DataError';
import { useLanguage } from '../contexts/LanguageContext';
import { localizeDisplayValue, localizeWeekdayByIndex } from '../lib/displayLocalization';

// 图表基础配置
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

const OPERATING_START_HOUR = 5;
const OPERATING_END_HOUR = 23;
const OPERATING_HOURS = Array.from(
  { length: OPERATING_END_HOUR - OPERATING_START_HOUR + 1 },
  (_, index) => OPERATING_START_HOUR + index,
);

export default function Module1Dashboard({ interactiveData }: { interactiveData?: any }) {
  const { language, t } = useLanguage();
  const isZh = language === 'zh';
  const label = {
    avgDelayAxis: isZh ? '平均延误(分钟)' : 'Avg delay (min)',
    flightCount: isZh ? '航班量' : 'Flight count',
    avgDelay: isZh ? '平均延误' : 'Avg delay',
    severeRate: isZh ? '重度延误率' : 'Severe delay rate',
    severeDelay: isZh ? '严重延误' : 'Severe delay',
    onTime: isZh ? '准点' : 'On time',
    minute: isZh ? '分钟' : 'min',
    totalFlights: isZh ? '总航班数' : 'Total Flights',
    avgDepDelay: isZh ? '平均起飞延误' : 'Avg Departure Delay',
    avgArrDelay: isZh ? '平均到达延误' : 'Avg Arrival Delay',
    depOnTimeRate: isZh ? '起飞准点率' : 'Departure On-time Rate',
    arrOnTimeRate: isZh ? '到达准点率' : 'Arrival On-time Rate',
    severeShare: isZh ? '重度延误占比' : 'Severe Delay Share',
    severeSubtitle: isZh ? '延误>60分钟' : 'Delay > 60 min',
    hourlyTitle: isZh ? '运营时段延误趋势' : 'Operating-window Delay Trend',
    hourlyDesc: isZh ? '聚焦 05:00-23:00，观察延误随主运营窗口累积的规律。' : 'Focus on 05:00-23:00 and track how delay accumulates through the main operating window.',
    destinationsTitle: isZh ? '最繁忙目的地 Top 10' : 'Busiest Destinations Top 10',
    destinationsDesc: isZh ? '从纽约三大机场出发的热门目的地航班量排名' : 'Destination volume ranking for flights departing from the three NYC airports.',
    heatmapTitle: isZh ? '时间热力图' : 'Time Heatmap',
    heatmapDesc: isZh ? '小时×星期的延误分布，识别高风险时段' : 'Hour by weekday delay distribution for identifying high-risk windows.',
    levelTitle: isZh ? '延误等级分布' : 'Delay Level Distribution',
    levelDesc: isZh ? '航班延误程度的整体分布情况' : 'Overall distribution of flight delay severity.',
    conclusionTitle: isZh ? '关键结论' : 'Key Findings',
    conclusion2: isZh ? '下午18-21点为延误高峰时段，建议错峰出行' : 'The 18:00-21:00 evening window is the main delay peak; avoid tight connections there.',
    conclusion3: isZh ? 'ORD(芝加哥)、ATL(亚特兰大)为最繁忙目的地' : 'ORD and ATL are among the busiest destination markets.',
  };
  Object.assign(label, isZh ? {
    avgDelayAxis: '平均延误(分钟)',
    flightCount: '航班量',
    avgDelay: '平均延误',
    severeRate: '严重延误率',
    severeDelay: '严重延误',
    onTime: '准点',
    minute: '分钟',
    totalFlights: '总航班数',
    avgDepDelay: '平均起飞延误',
    avgArrDelay: '平均到达延误',
    depOnTimeRate: '起飞准点率',
    arrOnTimeRate: '到达准点率',
    severeShare: '严重延误占比',
    severeSubtitle: '延误 > 60 分钟',
    hourlyTitle: '运营时段延误趋势',
    hourlyDesc: '聚焦 05:00-23:00，观察延误随主运营窗口累积的规律。',
    destinationsTitle: '最繁忙目的地 Top 10',
    destinationsDesc: '从纽约三大机场出发的热门目的地航班量排名。',
    heatmapTitle: '时间热力图',
    heatmapDesc: '小时 x 星期的延误分布，用于识别高风险时段。',
    levelTitle: '延误等级分布',
    levelDesc: '航班延误程度的整体分布。',
    conclusionTitle: '关键结论',
    conclusion2: '18:00-21:00 是主要延误高峰，建议避开紧张中转。',
    conclusion3: 'ORD 和 ATL 是最繁忙的目的地市场之一。',
  } : {});
  Object.assign(label, isZh ? {
    avgDelayAxis: '平均延误(分钟)',
    flightCount: '航班量',
    avgDelay: '平均延误',
    severeRate: '严重延误率',
    severeDelay: '严重延误',
    onTime: '准点',
    minute: '分钟',
    totalFlights: '总航班数',
    avgDepDelay: '平均起飞延误',
    avgArrDelay: '平均到达延误',
    depOnTimeRate: '起飞准点率',
    arrOnTimeRate: '到达准点率',
    severeShare: '严重延误占比',
    severeSubtitle: '延误 > 60 分钟',
    hourlyTitle: '运营时段延误趋势',
    hourlyDesc: '聚焦 05:00-23:00，观察延误随主运营窗口累积的规律。',
    destinationsTitle: '最繁忙目的地 Top 10',
    destinationsDesc: '从纽约三大机场出发的热门目的地航班量排名。',
    heatmapTitle: '时间热力图',
    heatmapDesc: '小时 x 星期的延误分布，用于识别高风险时段。',
    levelTitle: '延误等级分布',
    levelDesc: '航班延误程度的整体分布。',
    conclusionTitle: '关键结论',
    conclusion2: '18:00-21:00 是主要延误高峰，建议避开紧凑中转。',
    conclusion3: 'ORD 和 ATL 是最繁忙的目的地市场之一。',
  } : {
    avgDelayAxis: 'Avg delay (min)',
    flightCount: 'Flight count',
    avgDelay: 'Avg delay',
    severeRate: 'Severe delay rate',
    severeDelay: 'Severe delay',
    onTime: 'On time',
    minute: 'min',
    totalFlights: 'Total Flights',
    avgDepDelay: 'Avg Departure Delay',
    avgArrDelay: 'Avg Arrival Delay',
    depOnTimeRate: 'Departure On-time Rate',
    arrOnTimeRate: 'Arrival On-time Rate',
    severeShare: 'Severe Delay Share',
    severeSubtitle: 'Delay > 60 min',
    hourlyTitle: 'Operating-window Delay Trend',
    hourlyDesc: 'Focus on 05:00-23:00 and track how delay accumulates through the main operating window.',
    destinationsTitle: 'Busiest Destinations Top 10',
    destinationsDesc: 'Destination volume ranking for flights departing from the three NYC airports.',
    heatmapTitle: 'Time Heatmap',
    heatmapDesc: 'Hour by weekday delay distribution for identifying high-risk windows.',
    levelTitle: 'Delay Level Distribution',
    levelDesc: 'Overall distribution of flight delay severity.',
    conclusionTitle: 'Key Findings',
    conclusion2: 'The 18:00-21:00 evening window is the main delay peak; avoid tight connections there.',
    conclusion3: 'ORD and ATL are among the busiest destination markets.',
  });
  Object.assign(label, isZh ? {
    avgDelayAxis: '平均延误(分钟)',
    flightCount: '航班量',
    avgDelay: '平均延误',
    severeRate: '严重延误率',
    severeDelay: '严重延误',
    onTime: '准点',
    minute: '分钟',
    totalFlights: '总航班数',
    avgDepDelay: '平均起飞延误',
    avgArrDelay: '平均到达延误',
    depOnTimeRate: '起飞准点率',
    arrOnTimeRate: '到达准点率',
    severeShare: '严重延误占比',
    severeSubtitle: '延误 > 60 分钟',
    hourlyTitle: '运营时段延误趋势',
    hourlyDesc: '聚焦 05:00-23:00，观察延误随主运营窗口累积的规律。',
    destinationsTitle: '最繁忙目的地 Top 10',
    destinationsDesc: '从纽约三大机场出发的热门目的地航班量排名。',
    heatmapTitle: '时间热力图',
    heatmapDesc: '小时 x 星期的延误分布，用于识别高风险时段。',
    levelTitle: '延误等级分布',
    levelDesc: '航班延误程度的整体分布。',
    conclusionTitle: '关键结论',
    conclusion2: '18:00-21:00 是主要延误高峰，建议避开紧张中转。',
    conclusion3: 'ORD 和 ATL 是最繁忙的目的地市场之一。',
  } : {});
  const { data: summary, loading: loading1, error: error1 } = useFetch('/api/module1/summary');
  const { data: hourlyTrend, loading: loading2, error: error2 } = useFetch('/api/module1/hourly-trend');
  const { data: topDestinations, loading: loading3, error: error3 } = useFetch('/api/module1/top-destinations');
  const { data: heatmap, loading: loading4, error: error4 } = useFetch('/api/module1/heatmap');
  const { data: ontimePie, loading: loading5, error: error5 } = useFetch('/api/module1/ontime-pie');
  const { data: delayedAirlines, loading: loading6, error: error6 } = useFetch('/api/module1/delayed-airlines');

  const loading = loading1 || loading2 || loading3 || loading4 || loading5 || loading6;
  const hasError = error1 || error2 || error3 || error4 || error5 || error6;

  // 如果有错误，显示错误提示
  if (hasError) {
    return <DataError message={error1 || error2 || error3 || error4 || error5 || error6} />;
  }

  const activeSummary = interactiveData?.summary || summary;
  const activeHourlyTrend = interactiveData?.hourlyTrend || hourlyTrend;
  const activeTopDestinations = interactiveData?.topDestinationsVolume || topDestinations;
  const activeHeatmap = interactiveData?.heatmap || heatmap;
  const activeOntimePie = interactiveData?.ontimePie || ontimePie;
  const operatingHourlyTrend = (activeHourlyTrend || []).filter((d: any) => {
    const hour = Number(d.hour);
    return Number.isFinite(hour) && hour >= OPERATING_START_HOUR && hour <= OPERATING_END_HOUR;
  });
  const conclusion1 = isZh
    ? `整体延误水平中等，平均起飞延误约${activeSummary?.avgDepDelay || 12}分钟`
    : `Overall delay is moderate, with average departure delay around ${activeSummary?.avgDepDelay || 12} minutes.`;

  // 小时延误趋势图配置
  const hourlyOption = {
    ...chartBaseOptions,
    tooltip: { ...chartBaseOptions.tooltip, trigger: 'axis' },
    xAxis: {
      ...chartBaseOptions.xAxis,
      type: 'category',
      boundaryGap: false,
      data: operatingHourlyTrend.map((d: any) => `${d.hour}:00`)
    },
    yAxis: { ...chartBaseOptions.yAxis, type: 'value', name: label.avgDelayAxis },
    series: [{
      data: operatingHourlyTrend.map((d: any) => d.avgDepDelay),
      type: 'line',
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 2, color: '#00f2ff', shadowColor: 'rgba(0, 242, 255, 0.5)', shadowBlur: 10 },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(0, 242, 255, 0.4)' },
            { offset: 1, color: 'rgba(0, 242, 255, 0.0)' }
          ]
        }
      }
    }]
  };

  // 目的地条形图配置
  const destOption = {
    ...chartBaseOptions,
    tooltip: { ...chartBaseOptions.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: { ...chartBaseOptions.yAxis, type: 'value', name: label.flightCount },
    yAxis: {
      ...chartBaseOptions.xAxis,
      type: 'category',
      data: [...(activeTopDestinations || [])].reverse().map((d: any) => d.dest)
    },
    series: [{
      type: 'bar',
      data: [...(activeTopDestinations || [])].reverse().map((d: any) => d.flightCount),
      itemStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: 'rgba(139, 92, 246, 0.3)' },
            { offset: 1, color: 'rgba(139, 92, 246, 0.8)' }
          ]
        },
        borderRadius: [0, 4, 4, 0]
      }
    }]
  };

  const heatmapHours = OPERATING_HOURS;
  const heatmapHourLabels = heatmapHours.map((hour) => `${hour}:00`);
  const sourceWeekdayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const heatmapWeekdayLabels = sourceWeekdayLabels.map((_, index) => localizeWeekdayByIndex(index + 1, language));
  const heatmapWeekdayIndex = new Map([
    ...sourceWeekdayLabels.map((name, index) => [name, index] as const),
    ...heatmapWeekdayLabels.map((name, index) => [name, index] as const),
  ]);
  const heatmapSeriesData = (activeHeatmap || [])
    .map((d: any) => {
      const hour = Number(d.hour);
      const weekdayIndex = Number.isFinite(Number(d.weekday))
        ? Number(d.weekday) - 1
        : heatmapWeekdayIndex.get(d.weekdayName);
      const hourIndex = heatmapHours.indexOf(hour);

      if (
        hourIndex < 0 ||
        weekdayIndex === undefined ||
        weekdayIndex < 0 ||
        weekdayIndex >= heatmapWeekdayLabels.length
      ) {
        return null;
      }

      return [
        hourIndex,
        weekdayIndex,
        Number(d.avgDelay) || 0,
        {
          hour,
          weekdayName: heatmapWeekdayLabels[weekdayIndex],
          flightCount: d.flightCount,
          severeDelayRate: d.severeDelayRate
        }
      ];
    })
    .filter(Boolean);

  // 热力图配置
  const heatmapOption = {
    backgroundColor: 'transparent',
    grid: {
      left: '70px',
      right: '30px',
      top: '30px',
      bottom: '100px',
      containLabel: false
    },
    tooltip: {
      position: 'top',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: '#334155',
      borderWidth: 1,
      textStyle: {
        color: '#e2e8f0',
        fontSize: 13
      },
      formatter: (params: any) => {
        const meta = params.data[3] || {};
        const hour = meta.hour ?? heatmapHours[params.data[0]];
        const weekday = meta.weekdayName ?? heatmapWeekdayLabels[params.data[1]];
        const delay = params.data[2];
        const flightCount = meta.flightCount?.toLocaleString?.() ?? '--';
        const severeDelayRate =
          meta.severeDelayRate === undefined ? '--' : `${Number(meta.severeDelayRate).toFixed(1)}%`;
        return `<div style="padding: 4px 8px;">
          <div style="font-weight: 600; margin-bottom: 4px; color: #38bdf8;">${weekday} ${hour}:00</div>
          <div>${label.avgDelay}: <span style="color: #fbbf24; font-weight: 600;">${delay.toFixed(1)}</span> ${label.minute}</div>
          <div>${label.flightCount}: <span style="color: #cbd5e1; font-weight: 600;">${flightCount}</span></div>
          <div>${label.severeRate}: <span style="color: #fb923c; font-weight: 600;">${severeDelayRate}</span></div>
        </div>`;
      }
    },
    xAxis: {
      type: 'category',
      data: heatmapHourLabels,
      position: 'top',
      splitArea: {
        show: true,
        areaStyle: {
          color: ['rgba(255,255,255,0.01)', 'rgba(255,255,255,0.03)']
        }
      },
      axisLine: {
        show: true,
        lineStyle: { color: '#334155', width: 1 }
      },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 11,
        interval: 0,
        margin: 8,
        formatter: (value: string) => value.replace(':00', '')
      },
      axisTick: {
        show: false
      }
    },
    yAxis: {
      type: 'category',
      data: heatmapWeekdayLabels,
      splitArea: {
        show: true,
        areaStyle: {
          color: ['rgba(255,255,255,0.01)', 'rgba(255,255,255,0.03)']
        }
      },
      axisLine: {
        show: true,
        lineStyle: { color: '#334155', width: 1 }
      },
      axisLabel: {
        color: '#cbd5e1',
        fontSize: 13,
        fontWeight: 500,
        margin: 12
      },
      axisTick: {
        show: false
      }
    },
    visualMap: {
      min: 0,
      max: 50,
      dimension: 2,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '15px',
      itemWidth: 25,
      itemHeight: 200,
      inRange: {
        color: [
          '#10b981',  // 绿色 - 准点
          '#84cc16',  // 黄绿 - 轻微
          '#fbbf24',  // 黄色 - 中度
          '#fb923c',  // 橙色 - 较重
          '#f97316',  // 深橙 - 严重
          '#ef4444'   // 红色 - 极端
        ]
      },
      textStyle: {
        color: '#94a3b8',
        fontSize: 12
      },
      text: [label.severeDelay, label.onTime],
      textGap: 15,
      precision: 0
    },
    series: [{
      type: 'heatmap',
      data: heatmapSeriesData,
      label: {
        show: false
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 15,
          shadowColor: 'rgba(0, 0, 0, 0.6)',
          borderColor: '#38bdf8',
          borderWidth: 2
        }
      },
      itemStyle: {
        borderColor: '#0f172a',
        borderWidth: 2,
        borderRadius: 2
      }
    }]
  };

  // 准点率环形图配置
  const pieOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: '#94a3b8' }
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 5,
        borderColor: '#020617',
        borderWidth: 2
      },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#fff' } },
      data: activeOntimePie?.map((d: any) => ({ value: d.count, name: localizeDisplayValue(d.category, language) })) || [],
      color: ['#10b981', '#06b6d4', '#fbbf24', '#f97316', '#ef4444']
    }]
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-cyan-400 animate-pulse">{t('status.loadingData')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI 卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          title={label.totalFlights}
          value={activeSummary?.totalFlights?.toLocaleString() || '--'}
          icon={Plane}
          color="cyan"
        />
        <KPICard
          title={label.avgDepDelay}
          value={`${activeSummary?.avgDepDelay || '--'} ${label.minute}`}
          icon={Clock}
          color="orange"
        />
        <KPICard
          title={label.avgArrDelay}
          value={`${activeSummary?.avgArrDelay || '--'} ${label.minute}`}
          icon={Clock}
          color="purple"
        />
        <KPICard
          title={label.depOnTimeRate}
          value={`${activeSummary?.depOnTimeRate || '--'}%`}
          icon={CheckCircle}
          color="green"
        />
        <KPICard
          title={label.arrOnTimeRate}
          value={`${activeSummary?.arrOnTimeRate ?? activeSummary?.depOnTimeRate ?? '--'}%`}
          icon={CheckCircle}
          color="green"
        />
        <KPICard
          title={label.severeShare}
          value={`${activeSummary?.severeDelayRate || '--'}%`}
          subtitle={label.severeSubtitle}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 运营时段延误趋势 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            {label.hourlyTitle}
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            {label.hourlyDesc}
          </p>
          <div className="h-[300px]">
            <ReactECharts option={hourlyOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 最繁忙目的地 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-purple-400" />
            {label.destinationsTitle}
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            {label.destinationsDesc}
          </p>
          <div className="h-[300px]">
            <ReactECharts option={destOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 小时×星期热力图 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-400" />
            {label.heatmapTitle}
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            {label.heatmapDesc}
          </p>
          <div className="h-[300px]">
            <ReactECharts option={heatmapOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 准点率分布 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            {label.levelTitle}
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            {label.levelDesc}
          </p>
          <div className="h-[300px]">
            <ReactECharts option={pieOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>

      {/* 关键结论 */}
      <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-cyan-500">
        <h3 className="text-lg font-medium text-slate-100 mb-3">{label.conclusionTitle}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-300">
          <div className="flex items-start gap-2">
            <span className="text-cyan-400">•</span>
            <span>{isZh ? `整体延误水平中等，平均起飞延误约 ${activeSummary?.avgDepDelay || 12} 分钟。` : conclusion1}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-400">•</span>
            <span>{label.conclusion2}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-400">•</span>
            <span>{label.conclusion3}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
