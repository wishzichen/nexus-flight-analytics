import React from 'react';
import ReactECharts from 'echarts-for-react';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle,
  CloudRain,
  Clock,
  FileText,
  GitBranch,
  MapPin,
  Plane,
  Route,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import KPICard from '../components/charts/KPICard';
import { useFetch } from '../hooks/useModuleData';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { localizeDisplayValue } from '../lib/displayLocalization';

type ReportProps = {
  interactiveData?: any;
};

function formatNumber(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '--';
  return numeric.toLocaleString();
}

function formatDecimal(value: unknown, digits = 1) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '--';
  return numeric.toFixed(digits).replace(/\.0$/, '');
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function getMaxBy(rows: any[], key: string) {
  return rows.reduce((best, row) => {
    if (!best) return row;
    return Number(row?.[key] ?? -Infinity) > Number(best?.[key] ?? -Infinity) ? row : best;
  }, null as any);
}

function getMinBy(rows: any[], key: string) {
  return rows.reduce((best, row) => {
    if (!best) return row;
    return Number(row?.[key] ?? Infinity) < Number(best?.[key] ?? Infinity) ? row : best;
  }, null as any);
}

function chartBase(theme: 'dark' | 'light') {
  const dark = theme === 'dark';
  const text = dark ? '#cbd5e1' : '#334155';
  const muted = dark ? '#94a3b8' : '#64748b';
  const gridLine = dark ? '#1e293b' : '#dbeafe';

  return {
    backgroundColor: 'transparent',
    textStyle: { color: text, fontFamily: 'Inter, Helvetica Neue, Arial, sans-serif' },
    tooltip: {
      trigger: 'axis',
      backgroundColor: dark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.96)',
      borderColor: dark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(15, 23, 42, 0.12)',
      textStyle: { color: text },
    },
    legend: { top: 0, textStyle: { color: muted } },
    grid: { left: 54, right: 24, top: 54, bottom: 42, containLabel: true },
    xAxis: {
      axisLabel: { color: muted },
      axisLine: { lineStyle: { color: gridLine } },
      splitLine: { lineStyle: { color: gridLine, type: 'dashed' } },
    },
    yAxis: {
      axisLabel: { color: muted },
      axisLine: { lineStyle: { color: gridLine } },
      splitLine: { lineStyle: { color: gridLine, type: 'dashed' } },
    },
  };
}

function buildHourlyOption(rows: any[], copy: any, theme: 'dark' | 'light') {
  const base = chartBase(theme);
  return {
    ...base,
    tooltip: { ...base.tooltip, trigger: 'axis' },
    legend: { ...base.legend, data: [copy.avgDepDelay, copy.avgArrDelay, copy.severeRate] },
    xAxis: { ...base.xAxis, type: 'category', boundaryGap: false, data: rows.map((row) => `${row.hour}:00`) },
    yAxis: [
      { ...base.yAxis, type: 'value', name: copy.minute },
      { ...base.yAxis, type: 'value', name: '%', splitLine: { show: false } },
    ],
    series: [
      {
        name: copy.avgDepDelay,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        data: rows.map((row) => Number(row.avgDepDelay || 0)),
        lineStyle: { color: '#22d3ee', width: 3 },
        itemStyle: { color: '#22d3ee' },
        areaStyle: { color: 'rgba(34, 211, 238, 0.14)' },
      },
      {
        name: copy.avgArrDelay,
        type: 'line',
        smooth: true,
        data: rows.map((row) => Number(row.avgArrDelay || 0)),
        lineStyle: { color: '#a78bfa', width: 3 },
        itemStyle: { color: '#a78bfa' },
      },
      {
        name: copy.severeRate,
        type: 'bar',
        yAxisIndex: 1,
        data: rows.map((row) => Number(row.severeDelayRate || 0)),
        itemStyle: { color: 'rgba(245, 158, 11, 0.36)', borderRadius: [4, 4, 0, 0] },
      },
    ],
  };
}

function buildDestinationOption(rows: any[], copy: any, theme: 'dark' | 'light') {
  const base = chartBase(theme);
  const data = rows.slice(0, 10).map((row) => [
    Number(row.flightCount || 0),
    Number(row.avgArrDelay ?? row.avgDepDelay ?? 0),
    row.dest || row.arrivalAirport || '--',
    Number(row.severeDelayRate || 0),
  ]);

  return {
    ...base,
    tooltip: {
      ...base.tooltip,
      trigger: 'item',
      formatter: (params: any) =>
        `${params.data[2]}<br/>${copy.flightCount}: ${formatNumber(params.data[0])}<br/>${copy.avgArrDelay}: ${formatDecimal(params.data[1])} ${copy.minute}<br/>${copy.severeRate}: ${formatDecimal(params.data[3])}%`,
    },
    grid: { left: 64, right: 28, top: 28, bottom: 54, containLabel: true },
    xAxis: { ...base.xAxis, type: 'value', name: copy.flightCount },
    yAxis: { ...base.yAxis, type: 'value', name: copy.avgArrDelay },
    visualMap: {
      min: 0,
      max: Math.max(...data.map((item) => Number(item[3])), 1),
      dimension: 3,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: { color: ['#10b981', '#f59e0b', '#ef4444'] },
      textStyle: { color: theme === 'dark' ? '#94a3b8' : '#475569' },
    },
    series: [{
      type: 'scatter',
      data,
      symbolSize: (value: any[]) => Math.max(10, Math.min(42, Math.sqrt(Number(value[0] || 0)) / 2.5)),
      label: { show: true, formatter: '{@[2]}', color: theme === 'dark' ? '#e2e8f0' : '#334155' },
      itemStyle: { opacity: 0.78, borderColor: '#ffffff', borderWidth: 1 },
    }],
  };
}

function buildAirlineOption(rows: any[], copy: any, theme: 'dark' | 'light') {
  const base = chartBase(theme);
  const data = rows.slice(0, 8).reverse();

  return {
    ...base,
    tooltip: { ...base.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 72, right: 24, top: 28, bottom: 34, containLabel: true },
    xAxis: { ...base.xAxis, type: 'value', name: copy.minute },
    yAxis: { ...base.yAxis, type: 'category', data: data.map((row) => row.carrier || '--') },
    series: [{
      name: copy.avgDepDelay,
      type: 'bar',
      data: data.map((row) => Number(row.avgDepDelay || 0)),
      itemStyle: { color: '#f59e0b', borderRadius: [0, 5, 5, 0] },
      label: { show: true, position: 'right', formatter: ({ value }: any) => `${formatDecimal(value)} ${copy.minute}`, color: theme === 'dark' ? '#cbd5e1' : '#475569' },
    }],
  };
}

function buildAttributionOption(rows: any[], copy: any, language: 'zh' | 'en', theme: 'dark' | 'light') {
  const base = chartBase(theme);
  const data = rows
    .map((row) => ({ ...row, feature: localizeDisplayValue(row.feature, language) }))
    .slice(0, 7)
    .reverse();

  return {
    ...base,
    tooltip: { ...base.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 86, right: 24, top: 28, bottom: 34, containLabel: true },
    xAxis: { ...base.xAxis, type: 'value', name: copy.importance },
    yAxis: { ...base.yAxis, type: 'category', data: data.map((row) => row.feature || '--') },
    series: [{
      name: copy.importance,
      type: 'bar',
      data: data.map((row) => Number(row.importance || 0)),
      itemStyle: {
        color: (params: any) => ['#22d3ee', '#60a5fa', '#a78bfa', '#10b981', '#f59e0b', '#f472b6', '#ef4444'][params.dataIndex % 7],
        borderRadius: [0, 5, 5, 0],
      },
      label: { show: true, position: 'right', formatter: ({ value }: any) => `${formatDecimal(value)}%`, color: theme === 'dark' ? '#cbd5e1' : '#475569' },
    }],
  };
}

function EvidenceCard({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-panel rounded-2xl p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10">
          <Icon className="h-5 w-5 text-cyan-300" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-400">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function MiniBarList({
  rows,
  valueKey,
  labelKey,
  suffix = '',
}: {
  rows: any[];
  valueKey: string;
  labelKey: string;
  suffix?: string;
}) {
  const maxValue = Math.max(...rows.map((row) => Number(row?.[valueKey]) || 0), 1);

  return (
    <div className="space-y-3">
      {rows.slice(0, 5).map((row, index) => {
        const value = Number(row?.[valueKey]) || 0;
        const label = row?.[labelKey] || row?.carrier || row?.dest || row?.feature || '--';
        return (
          <div key={`${label}-${index}`} className="grid gap-1.5">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="min-w-0 truncate text-slate-300">{label}</span>
              <span className="shrink-0 font-semibold text-cyan-200">
                {formatDecimal(value)}
                {suffix}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800/80">
              <div
                className="h-full rounded-full bg-cyan-400"
                style={{ width: `${Math.max(6, (value / maxValue) * 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BookmarkVisual({
  index,
  title,
  subtitle,
  caption,
  icon: Icon,
  option,
  emptyText,
}: {
  index: string;
  title: string;
  subtitle: string;
  caption: string;
  icon: React.ElementType;
  option: any;
  emptyText: string;
}) {
  const hasSeries = Array.isArray(option?.series) && option.series.some((series: any) => Array.isArray(series.data) && series.data.length);

  return (
    <section className="glass-panel overflow-hidden rounded-2xl">
      <div className="grid gap-0 lg:grid-cols-[112px_minmax(0,1fr)]">
        <div className="flex flex-row items-center gap-3 border-b border-white/10 bg-cyan-500/10 px-5 py-4 lg:flex-col lg:items-start lg:justify-between lg:border-b-0 lg:border-r">
          <div className="text-3xl font-bold text-cyan-200">{index}</div>
          <Icon className="h-6 w-6 text-cyan-300" />
        </div>
        <div className="min-w-0 p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-400">{subtitle}</p>
            </div>
          </div>
          <div className="h-[320px] min-w-0">
            {hasSeries ? (
              <ReactECharts option={option} style={{ height: '100%', width: '100%' }} notMerge />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">{emptyText}</div>
            )}
          </div>
          <div className="mt-4 border-t border-white/10 pt-4 text-sm leading-7 text-slate-300">
            {caption}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ModuleReportSummary({ interactiveData }: ReportProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isZh = language === 'zh';

  const { data: fallbackSummary } = useFetch('/api/module1/summary');
  const { data: fallbackHourly } = useFetch('/api/module1/hourly-trend');
  const { data: fallbackTopDestinations } = useFetch('/api/module1/top-destinations');
  const { data: fallbackRiskyDestinations } = useFetch('/api/module3/top-destinations-delay');
  const { data: fallbackDelayRanking } = useFetch('/api/module5/delay-ranking');
  const { data: fallbackOntimeRanking } = useFetch('/api/module5/ontime-ranking');
  const { data: recoveryStats } = useFetch('/api/module4/recovery-stats');
  const { data: propagationStats } = useFetch('/api/module6/propagation-stats');
  const { data: attributionConclusions } = useFetch('/api/module7/conclusions');
  const { data: featureImportance } = useFetch('/api/module7/feature-importance');
  const { data: weatherAnalysis } = useFetch('/api/module7/weather-analysis');

  const summary = interactiveData?.summary || fallbackSummary || {};
  const hourlyTrend = asArray(interactiveData?.hourlyTrend || fallbackHourly);
  const topDestinations = asArray(interactiveData?.topDestinationsVolume || fallbackTopDestinations);
  const riskyDestinations = asArray(interactiveData?.topDestinationsDelay || fallbackRiskyDestinations);
  const delayRanking = asArray(interactiveData?.delayRanking || fallbackDelayRanking);
  const ontimeRanking = asArray(interactiveData?.ontimeRanking || fallbackOntimeRanking);
  const featureRows = asArray(featureImportance);
  const weatherRows = asArray(weatherAnalysis);

  const peakHour = getMaxBy(hourlyTrend, 'avgDepDelay');
  const bestHour = getMinBy(hourlyTrend, 'avgDepDelay');
  const busiestDestination = topDestinations[0];
  const riskiestDestination = riskyDestinations[0];
  const weakestAirline = delayRanking[0];
  const strongestAirline = ontimeRanking[0];
  const topWeather = weatherRows
    .filter((row) => row?.weather_condition !== '数据缺失')
    .sort((a, b) => Number(b.avgDepDelay || 0) - Number(a.avgDepDelay || 0))[0];

  const copy = isZh ? {
    title: '分析报告',
    eyebrow: 'Conclusion Report',
    subtitle: '围绕 nycflights13 / 纽约航班延误数据，把“延误如何形成、在哪里放大、该怎么干预”组织成一页可汇报的证据链。',
    scope: interactiveData?.recordCount
      ? `当前筛选样本：${formatNumber(interactiveData.recordCount)} 条记录`
      : '默认展示 nycflights13 2013 分析口径',
    totalFlights: '分析航班数',
    avgDepDelay: '平均起飞延误',
    avgArrDelay: '平均到达延误',
    arrOnTime: '到达准点率',
    severeDelay: '严重延误占比',
    severeRate: '严重延误率',
    flightCount: '航班量',
    importance: '重要度',
    minute: '分钟',
    coreConclusion: '核心结论',
    conclusionLead: `延误不是单一偶发事件，而是在时间压力、机场航线结构、航司运行差异和天气触发共同作用下形成的系统性结果。当前样本平均起飞延误 ${formatDecimal(summary.avgDepDelay)} 分钟，严重延误占比 ${formatDecimal(summary.severeDelayRate)}%。`,
    methodTitle: '分析思路',
    methodSubtitle: '先看时间累积，再看空间暴露，随后拆解航司差异与外部触发，最后落到可执行的调度动作。',
    step1: '时间压力',
    step1Text: '用小时曲线识别延误从低压窗口向晚高峰累积的过程。',
    step2: '网络风险',
    step2Text: '用目的地风险图区分“航班多”和“延误强”两类问题。',
    step3: '运营归因',
    step3Text: '用航司表现、追回传导和天气变量把风险转化成运营建议。',
    c1Title: '时间压力会累积',
    c1Text: peakHour
      ? `${peakHour.hour}:00 的平均起飞延误最高，约 ${formatDecimal(peakHour.avgDepDelay)} 分钟；${bestHour?.hour ?? '--'}:00 的压力最低。`
      : '小时级趋势显示延误会在一天内逐步累积。',
    c2Title: '高频目的地不等于最高风险',
    c2Text: busiestDestination && riskiestDestination
      ? `${busiestDestination.dest} 航班量最高，但延误风险最高的是 ${riskiestDestination.dest}，平均到达延误约 ${formatDecimal(riskiestDestination.avgArrDelay)} 分钟。`
      : '目的地需要同时看航班量和延误强度。',
    c3Title: '恢复能力有限，传导真实存在',
    c3Text: `高延误航班平均追回 ${formatDecimal(recoveryStats?.avgRecovery)} 分钟；同机连续任务延误相关系数约 ${formatDecimal(propagationStats?.correlation, 3)}。`,
    bookmarkTitle: '书签式关键图谱',
    timeChart: '时间累积图',
    timeChartSub: '平均起飞/到达延误与严重延误率按小时展开。',
    timeCaption: peakHour
      ? `图中晚间峰值最值得关注：${peakHour.hour}:00 的起飞延误最高，说明后续航班需要更早触发登机口、机组和放行节奏缓冲。`
      : '小时图用于识别延误累积窗口。',
    routeChart: '目的地风险图',
    routeChartSub: '横轴是航班量，纵轴是平均到达延误，颜色表示严重延误率。',
    routeCaption: riskiestDestination
      ? `${riskiestDestination.dest} 的到达延误强度最高，说明治理对象不能只按热门目的地排序，还要看高延误但规模较小的脆弱市场。`
      : '目的地图用于识别规模和风险错位。',
    airlineChart: '航司延误排行',
    airlineChartSub: '比较平均起飞延误靠前的航司，定位运营差异。',
    airlineCaption: weakestAirline
      ? `${weakestAirline.carrier} 当前平均起飞延误约 ${formatDecimal(weakestAirline.avgDepDelay)} 分钟，应进一步按时段、航线和连续执飞任务拆分。`
      : '航司图用于拆分运营策略和网络结构差异。',
    attributionChart: '归因变量图',
    attributionChartSub: '展示模型中特征重要度靠前的变量。',
    attributionCaption: attributionConclusions?.badWeatherDelayIncrease
      ? `恶劣天气窗口平均延误增加约 ${formatDecimal(attributionConclusions.badWeatherDelayIncrease)} 分钟，适合做提前预警而不是事后解释。`
      : '归因图用于把外部条件转化为预警阈值。',
    evidenceTitle: '证据链',
    timeTitle: '时间规律',
    timeSubtitle: '延误从低压时段向晚间高压时段累积，越晚越需要留出缓冲。',
    routeTitle: '航线与目的地',
    routeSubtitle: '热门市场贡献规模，风险市场暴露脆弱环节，两者要分开治理。',
    airlineTitle: '航司表现',
    airlineSubtitle: '航司之间的准点率和平均延误差异明显，反映运行策略与网络结构差别。',
    systemTitle: '追回与传导',
    systemSubtitle: '空中追回能够缓冲一部分延误，但同一架飞机的连续任务仍会放大后续风险。',
    attributionTitle: '归因结果',
    attributionSubtitle: '天气、时段和运行条件共同塑造风险，其中短期天气触发更适合预警。',
    recommendations: '运营建议',
    r1: '把 19:00 后航班、晚间中转和高延误目的地设为重点预警对象。',
    r2: '对高风险目的地按航班量和平均延误双维排序，而不是只看热门程度。',
    r3: '对连续执飞飞机设置更高的周转缓冲，尤其关注前序晚到后的下一段起飞。',
    r4: '在降水、低能见度和高湿度窗口提前调配机组、登机口和放行节奏。',
    evidenceTable: '结果摘要',
    metric: '指标',
    implication: '含义',
    current: '当前值',
    emptyChart: '暂无足够数据绘制图表',
  } : {
    title: 'Analysis Report',
    eyebrow: 'Conclusion Report',
    subtitle: 'A report-ready evidence chain built from nycflights13 / NYC flight delay data: how delay forms, where it amplifies, and how to intervene.',
    scope: interactiveData?.recordCount
      ? `Current filtered sample: ${formatNumber(interactiveData.recordCount)} rows`
      : 'Default nycflights13 2013 analysis scope',
    totalFlights: 'Flights Analyzed',
    avgDepDelay: 'Avg Departure Delay',
    avgArrDelay: 'Avg Arrival Delay',
    arrOnTime: 'Arrival On-time Rate',
    severeDelay: 'Severe Delay Share',
    severeRate: 'Severe Delay Rate',
    flightCount: 'Flight Count',
    importance: 'Importance',
    minute: 'min',
    coreConclusion: 'Core Conclusion',
    conclusionLead: `Delay is not a single random event. It emerges from time pressure, route structure, airline operating differences, and weather triggers. The current sample has ${formatDecimal(summary.avgDepDelay)} minutes of average departure delay and ${formatDecimal(summary.severeDelayRate)}% severe delay share.`,
    methodTitle: 'Analytical Logic',
    methodSubtitle: 'Start with time accumulation, then spatial exposure, carrier differences, external triggers, and executable operations.',
    step1: 'Time Pressure',
    step1Text: 'Use hourly curves to locate delay accumulation windows.',
    step2: 'Network Risk',
    step2Text: 'Separate volume exposure from delay intensity by destination.',
    step3: 'Operational Attribution',
    step3Text: 'Turn carrier, propagation, and weather signals into actions.',
    c1Title: 'Time Pressure Accumulates',
    c1Text: peakHour
      ? `${peakHour.hour}:00 has the highest average departure delay at about ${formatDecimal(peakHour.avgDepDelay)} minutes; ${bestHour?.hour ?? '--'}:00 is the lowest-pressure hour.`
      : 'Hourly patterns show delay accumulating through the day.',
    c2Title: 'Volume Is Not Risk',
    c2Text: busiestDestination && riskiestDestination
      ? `${busiestDestination.dest} has the highest volume, while ${riskiestDestination.dest} has the highest arrival-delay risk at about ${formatDecimal(riskiestDestination.avgArrDelay)} minutes.`
      : 'Destinations should be evaluated by both volume and delay intensity.',
    c3Title: 'Recovery Is Limited; Propagation Is Real',
    c3Text: `High-delay flights recover ${formatDecimal(recoveryStats?.avgRecovery)} minutes on average; same-aircraft task delay correlation is about ${formatDecimal(propagationStats?.correlation, 3)}.`,
    bookmarkTitle: 'Bookmark Visuals',
    timeChart: 'Time Accumulation',
    timeChartSub: 'Average departure/arrival delay and severe-delay rate by hour.',
    timeCaption: peakHour
      ? `The evening peak is the key window: ${peakHour.hour}:00 has the highest departure delay, so downstream flights need earlier buffer triggers.`
      : 'Use this view to locate daily delay buildup.',
    routeChart: 'Destination Risk',
    routeChartSub: 'Volume on the x-axis, average arrival delay on the y-axis, severe share as color.',
    routeCaption: riskiestDestination
      ? `${riskiestDestination.dest} has the strongest arrival-delay intensity, so operational targeting should not be based on popularity alone.`
      : 'Use this view to compare exposure and risk.',
    airlineChart: 'Carrier Delay Ranking',
    airlineChartSub: 'Average departure delay among high-delay carriers.',
    airlineCaption: weakestAirline
      ? `${weakestAirline.carrier} averages about ${formatDecimal(weakestAirline.avgDepDelay)} minutes of departure delay and should be decomposed by time window and route.`
      : 'Use this view to profile carrier differences.',
    attributionChart: 'Attribution Drivers',
    attributionChartSub: 'Top feature importance from the attribution module.',
    attributionCaption: attributionConclusions?.badWeatherDelayIncrease
      ? `Bad-weather windows add about ${formatDecimal(attributionConclusions.badWeatherDelayIncrease)} minutes on average, making them useful for early warning.`
      : 'Use this view to convert external conditions into warning thresholds.',
    evidenceTitle: 'Evidence Chain',
    timeTitle: 'Time Pattern',
    timeSubtitle: 'Delay builds from low-pressure windows into evening peaks, so later flights need more buffer.',
    routeTitle: 'Routes and Destinations',
    routeSubtitle: 'Busy markets explain exposure, while risky markets reveal vulnerable links.',
    airlineTitle: 'Airline Performance',
    airlineSubtitle: 'On-time rate and average delay differ sharply by carrier, reflecting network and operating strategy.',
    systemTitle: 'Recovery and Propagation',
    systemSubtitle: 'In-air recovery absorbs part of the shock, but same-aircraft sequences still transfer delay.',
    attributionTitle: 'Attribution',
    attributionSubtitle: 'Weather, time, and operating conditions jointly shape risk; short-term weather triggers support warning.',
    recommendations: 'Operational Actions',
    r1: 'Set post-19:00 flights, evening connections, and high-delay destinations as priority alerts.',
    r2: 'Rank destinations by both traffic volume and average delay, not popularity alone.',
    r3: 'Add turnaround buffer for aircraft with consecutive legs, especially after late arrivals.',
    r4: 'Pre-position crews, gates, and release pacing during precipitation, low visibility, and high-humidity windows.',
    evidenceTable: 'Result Summary',
    metric: 'Metric',
    implication: 'Implication',
    current: 'Current Value',
    emptyChart: 'Not enough data to render this chart',
  };

  const methodSteps = [
    { title: copy.step1, text: copy.step1Text, icon: Clock },
    { title: copy.step2, text: copy.step2Text, icon: Route },
    { title: copy.step3, text: copy.step3Text, icon: TrendingUp },
  ];

  const conclusionCards = [
    { title: copy.c1Title, text: copy.c1Text, icon: Clock, color: 'text-orange-300' },
    { title: copy.c2Title, text: copy.c2Text, icon: Route, color: 'text-purple-300' },
    { title: copy.c3Title, text: copy.c3Text, icon: GitBranch, color: 'text-green-300' },
  ];

  const recommendations = [
    { text: copy.r1, icon: Clock },
    { text: copy.r2, icon: MapPin },
    { text: copy.r3, icon: GitBranch },
    { text: copy.r4, icon: CloudRain },
  ];

  const tableRows = [
    {
      metric: copy.timeTitle,
      finding: peakHour ? `${peakHour.hour}:00 / ${formatDecimal(peakHour.avgDepDelay)} ${copy.minute}` : '--',
      implication: copy.r1,
    },
    {
      metric: copy.routeTitle,
      finding: riskiestDestination ? `${riskiestDestination.dest} / ${formatDecimal(riskiestDestination.avgArrDelay)} ${copy.minute}` : '--',
      implication: copy.r2,
    },
    {
      metric: copy.airlineTitle,
      finding: weakestAirline ? `${weakestAirline.carrier} / ${formatDecimal(weakestAirline.avgDepDelay)} ${copy.minute}` : '--',
      implication: isZh ? '对高延误航司做运行画像和时段拆解。' : 'Profile high-delay carriers by operating window.',
    },
    {
      metric: copy.attributionTitle,
      finding: topWeather ? `${localizeDisplayValue(topWeather.weather_condition, language)} / ${formatDecimal(topWeather.avgDepDelay)} ${copy.minute}` : '--',
      implication: copy.r4,
    },
  ];

  const bookmarkCharts = [
    {
      index: '01',
      title: copy.timeChart,
      subtitle: copy.timeChartSub,
      caption: copy.timeCaption,
      icon: Clock,
      option: buildHourlyOption(hourlyTrend, copy, theme),
    },
    {
      index: '02',
      title: copy.routeChart,
      subtitle: copy.routeChartSub,
      caption: copy.routeCaption,
      icon: MapPin,
      option: buildDestinationOption(riskyDestinations, copy, theme),
    },
    {
      index: '03',
      title: copy.airlineChart,
      subtitle: copy.airlineChartSub,
      caption: copy.airlineCaption,
      icon: Building2,
      option: buildAirlineOption(delayRanking, copy, theme),
    },
    {
      index: '04',
      title: copy.attributionChart,
      subtitle: copy.attributionChartSub,
      caption: copy.attributionCaption,
      icon: CloudRain,
      option: buildAttributionOption(featureRows, copy, language, theme),
    },
  ];

  return (
    <div className="space-y-6">
      <section className="glass-panel overflow-hidden rounded-2xl p-6 md:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
              <FileText className="h-3.5 w-3.5" />
              {copy.eyebrow}
            </div>
            <h2 className="text-3xl font-bold tracking-normal text-white md:text-5xl">{copy.title}</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">{copy.subtitle}</p>
          </div>
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-sm leading-7 text-cyan-100">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <Sparkles className="h-4 w-4" />
              {copy.coreConclusion}
            </div>
            <p>{copy.conclusionLead}</p>
            <p className="mt-3 text-xs text-cyan-100/70">{copy.scope}</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title={copy.totalFlights} value={formatNumber(summary.totalFlights || interactiveData?.recordCount)} icon={Plane} color="cyan" />
        <KPICard title={copy.avgDepDelay} value={`${formatDecimal(summary.avgDepDelay)} ${copy.minute}`} icon={Clock} color="orange" />
        <KPICard title={copy.arrOnTime} value={`${formatDecimal(summary.arrOnTimeRate ?? summary.depOnTimeRate)}%`} icon={CheckCircle} color="green" />
        <KPICard title={copy.severeDelay} value={`${formatDecimal(summary.severeDelayRate)}%`} icon={AlertTriangle} color="red" />
      </div>

      <section className="glass-panel rounded-2xl p-6">
        <div className="mb-5">
          <h3 className="text-xl font-semibold text-white">{copy.methodTitle}</h3>
          <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-400">{copy.methodSubtitle}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {methodSteps.map((step, index) => (
            <div key={step.title} className="rounded-xl border border-white/10 bg-slate-900/30 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <step.icon className="h-5 w-5 text-cyan-300" />
                <span className="text-xs font-semibold text-slate-500">0{index + 1}</span>
              </div>
              <h4 className="text-sm font-semibold text-white">{step.title}</h4>
              <p className="mt-2 text-sm leading-6 text-slate-400">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {conclusionCards.map((item) => (
          <section key={item.title} className="glass-panel rounded-2xl p-5">
            <item.icon className={`mb-4 h-7 w-7 ${item.color}`} />
            <h3 className="mb-2 text-lg font-semibold text-white">{item.title}</h3>
            <p className="text-sm leading-7 text-slate-300">{item.text}</p>
          </section>
        ))}
      </div>

      <div>
        <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
          <BarChart3 className="h-5 w-5 text-cyan-300" />
          {copy.bookmarkTitle}
        </h3>
        <div className="grid gap-5">
          {bookmarkCharts.map((chart) => (
            <BookmarkVisual key={chart.index} {...chart} emptyText={copy.emptyChart} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
          <BarChart3 className="h-5 w-5 text-cyan-300" />
          {copy.evidenceTitle}
        </h3>
        <div className="grid gap-6 lg:grid-cols-2">
          <EvidenceCard title={copy.timeTitle} subtitle={copy.timeSubtitle} icon={Clock}>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-slate-500">{isZh ? '高压时段' : 'Peak hour'}</div>
                <div className="mt-1 text-2xl font-bold text-orange-300">{peakHour ? `${peakHour.hour}:00` : '--'}</div>
                <div className="text-slate-400">{formatDecimal(peakHour?.avgDepDelay)} {copy.minute}</div>
              </div>
              <div>
                <div className="text-slate-500">{isZh ? '低压时段' : 'Low-pressure hour'}</div>
                <div className="mt-1 text-2xl font-bold text-green-300">{bestHour ? `${bestHour.hour}:00` : '--'}</div>
                <div className="text-slate-400">{formatDecimal(bestHour?.avgDepDelay)} {copy.minute}</div>
              </div>
            </div>
          </EvidenceCard>

          <EvidenceCard title={copy.routeTitle} subtitle={copy.routeSubtitle} icon={MapPin}>
            <MiniBarList rows={topDestinations} valueKey="flightCount" labelKey="dest" />
          </EvidenceCard>

          <EvidenceCard title={copy.airlineTitle} subtitle={copy.airlineSubtitle} icon={Building2}>
            <MiniBarList rows={delayRanking} valueKey="avgDepDelay" labelKey="carrier" suffix={` ${copy.minute}`} />
          </EvidenceCard>

          <EvidenceCard title={copy.systemTitle} subtitle={copy.systemSubtitle} icon={GitBranch}>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-slate-500">{isZh ? '平均追回' : 'Avg recovery'}</div>
                <div className="mt-1 text-2xl font-bold text-green-300">{formatDecimal(recoveryStats?.avgRecovery)}</div>
                <div className="text-slate-400">{copy.minute}</div>
              </div>
              <div>
                <div className="text-slate-500">{isZh ? '传导相关' : 'Propagation corr.'}</div>
                <div className="mt-1 text-2xl font-bold text-cyan-300">{formatDecimal(propagationStats?.correlation, 3)}</div>
                <div className="text-slate-400">{formatNumber(propagationStats?.totalChains)} {isZh ? '条链路' : 'chains'}</div>
              </div>
            </div>
          </EvidenceCard>

          <EvidenceCard title={copy.attributionTitle} subtitle={copy.attributionSubtitle} icon={CloudRain}>
            <MiniBarList
              rows={featureRows.map((row) => ({ ...row, feature: localizeDisplayValue(row.feature, language) }))}
              valueKey="importance"
              labelKey="feature"
              suffix="%"
            />
          </EvidenceCard>

          <EvidenceCard title={copy.recommendations} subtitle={isZh ? '从分析结果转化为可执行动作。' : 'Turn findings into executable actions.'} icon={TrendingUp}>
            <div className="grid gap-3">
              {recommendations.map((item, index) => (
                <div key={item.text} className="flex gap-3 text-sm leading-6 text-slate-300">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800/70 text-cyan-300">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="mr-2 font-semibold text-cyan-200">{index + 1}.</span>
                    {item.text}
                  </div>
                </div>
              ))}
            </div>
          </EvidenceCard>
        </div>
      </div>

      <section className="glass-panel overflow-hidden rounded-2xl p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">{copy.evidenceTable}</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-3 pr-4">{copy.metric}</th>
                <th className="py-3 pr-4">{copy.current}</th>
                <th className="py-3 pr-4">{copy.implication}</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr key={row.metric} className="border-b border-white/5 last:border-0">
                  <td className="py-4 pr-4 font-semibold text-white">{row.metric}</td>
                  <td className="py-4 pr-4 text-cyan-200">{row.finding}</td>
                  <td className="py-4 pr-4 leading-6 text-slate-300">{row.implication}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {strongestAirline && (
          <p className="mt-4 text-xs leading-6 text-slate-500">
            {isZh
              ? `补充：当前准点表现最好的航司为 ${strongestAirline.carrier}，准点率约 ${formatDecimal(strongestAirline.onTimeRate)}%。`
              : `Note: the strongest on-time carrier is ${strongestAirline.carrier}, with an on-time rate of about ${formatDecimal(strongestAirline.onTimeRate)}%.`}
          </p>
        )}
      </section>
    </div>
  );
}
