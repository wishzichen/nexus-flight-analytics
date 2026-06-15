import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Clock, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import KPICard from '../components/charts/KPICard';
import { useFetch } from '../hooks/useModuleData';
import { useLanguage } from '../contexts/LanguageContext';
import { localizeDisplayValue, localizeWeekdayByIndex } from '../lib/displayLocalization';

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

export default function Module2TimeAnalysis({ interactiveData }: { interactiveData?: any }) {
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const sourceWeekdayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const weekdayLabels = sourceWeekdayLabels.map((_, index) => localizeWeekdayByIndex(index + 1, language));
  const label = {
    depDelay: isZh ? '起飞延误' : 'Departure Delay',
    arrDelay: isZh ? '到达延误' : 'Arrival Delay',
    avgDelayAxis: isZh ? '平均延误(分钟)' : 'Avg delay (min)',
    avgDelay: isZh ? '平均延误' : 'Avg delay',
    minute: isZh ? '分钟' : 'min',
    severeDelay: isZh ? '严重延误' : 'Severe delay',
    onTime: isZh ? '准点' : 'On time',
    morningAvg: isZh ? '早间平均延误' : 'Morning Avg Delay',
    afternoonAvg: isZh ? '下午平均延误' : 'Afternoon Avg Delay',
    eveningAvg: isZh ? '晚间平均延误' : 'Evening Avg Delay',
    worstMonth: isZh ? '最差月份' : 'Most Variable Month',
    worstMonthSub: isZh ? '延误波动最大' : 'Highest delay variance',
    comparisonTitle: isZh ? '05:00-23:00 延误对比' : '05:00-23:00 Delay Comparison',
    comparisonDesc: isZh ? '聚焦主运营窗口，对比起飞延误与到达延误，观察空中追回效果' : 'Focus on the main operating window and compare departure vs arrival delay to observe in-air recovery.',
    monthlyTitle: isZh ? '月份延误趋势' : 'Monthly Delay Trend',
    monthlyDesc: isZh ? '各月份平均延误变化，识别季节性规律' : 'Monthly average delay changes reveal seasonal patterns.',
    weekdayTitle: isZh ? '星期延误分析' : 'Weekday Delay Analysis',
    periodTitle: isZh ? '时段延误分析' : 'Time Period Delay Analysis',
    periodDesc: isZh ? '不同时段的延误程度对比' : 'Compare delay levels across operating periods.',
    heatmapTitle: isZh ? '星期×小时延误热力图' : 'Weekday by Hour Delay Heatmap',
    heatmapDesc: isZh ? '精准定位高风险时段（5:00-23:00）' : 'Pinpoint high-risk windows from 05:00 to 23:00.',
    conclusionTitle: isZh ? '时间规律结论' : 'Time Pattern Findings',
    c1: isZh ? '早间(5-9点)航班最准点，建议优先选择' : 'Morning flights from 05:00 to 09:00 are the most punctual.',
    c2: isZh ? '下午延误通常比早间更高，运营压力开始累积' : 'Afternoon delay is usually higher than morning delay as operating pressure accumulates.',
    c3: isZh ? '晚间18-21点延误最严重，需预留充足时间' : 'The 18:00-21:00 window has the heaviest delay risk.',
    c4: isZh ? '延误随主运营窗口累积，越晚越容易延误' : 'Delay accumulates across the main operating window and becomes more likely later.',
  };
  Object.assign(label, isZh ? {
    depDelay: '起飞延误',
    arrDelay: '到达延误',
    avgDelayAxis: '平均延误(分钟)',
    avgDelay: '平均延误',
    minute: '分钟',
    severeDelay: '严重延误',
    onTime: '准点',
    morningAvg: '早间平均延误',
    afternoonAvg: '下午平均延误',
    eveningAvg: '晚间平均延误',
    worstMonth: '波动最大月份',
    worstMonthSub: '延误波动最大',
    comparisonTitle: '05:00-23:00 延误对比',
    comparisonDesc: '聚焦主运营窗口，对比起飞延误与到达延误，观察空中追回效果。',
    monthlyTitle: '月份延误趋势',
    monthlyDesc: '各月份平均延误变化，用于识别季节性规律。',
    weekdayTitle: '星期延误分析',
    periodTitle: '时段延误分析',
    periodDesc: '对比不同运营时段的延误程度。',
    heatmapTitle: '星期 x 小时延误热力图',
    heatmapDesc: '精准定位 05:00-23:00 的高风险窗口。',
    conclusionTitle: '时间规律结论',
    c1: '05:00-09:00 的早间航班通常最准点。',
    c2: '下午延误通常高于早间，运营压力开始累积。',
    c3: '18:00-21:00 是最严重的延误风险窗口。',
    c4: '延误会随 05:00-23:00 主运营窗口逐步累积，越晚越容易延误。',
  } : {
    depDelay: 'Departure Delay',
    arrDelay: 'Arrival Delay',
    avgDelayAxis: 'Avg delay (min)',
    avgDelay: 'Avg delay',
    minute: 'min',
    severeDelay: 'Severe delay',
    onTime: 'On time',
    morningAvg: 'Morning Avg Delay',
    afternoonAvg: 'Afternoon Avg Delay',
    eveningAvg: 'Evening Avg Delay',
    worstMonth: 'Most Variable Month',
    worstMonthSub: 'Highest delay variance',
    comparisonTitle: '05:00-23:00 Delay Comparison',
    comparisonDesc: 'Focus on the main operating window and compare departure vs arrival delay to observe in-air recovery.',
    monthlyTitle: 'Monthly Delay Trend',
    monthlyDesc: 'Monthly average delay changes reveal seasonal patterns.',
    weekdayTitle: 'Weekday Delay Analysis',
    periodTitle: 'Time Period Delay Analysis',
    periodDesc: 'Compare delay levels across operating periods.',
    heatmapTitle: 'Weekday by Hour Delay Heatmap',
    heatmapDesc: 'Pinpoint high-risk windows from 05:00 to 23:00.',
    conclusionTitle: 'Time Pattern Findings',
    c1: 'Morning flights from 05:00 to 09:00 are the most punctual.',
    c2: 'Afternoon delay is usually higher than morning delay as operating pressure accumulates.',
    c3: 'The 18:00-21:00 window has the heaviest delay risk.',
    c4: 'Delay accumulates across the operating day and becomes more likely later.',
  });
  Object.assign(label, isZh ? {
    depDelay: '起飞延误',
    arrDelay: '到达延误',
    avgDelayAxis: '平均延误(分钟)',
    avgDelay: '平均延误',
    minute: '分钟',
    severeDelay: '严重延误',
    onTime: '准点',
    morningAvg: '早间平均延误',
    afternoonAvg: '下午平均延误',
    eveningAvg: '晚间平均延误',
    worstMonth: '波动最大月份',
    worstMonthSub: '延误波动最大',
    comparisonTitle: '05:00-23:00 延误对比',
    comparisonDesc: '聚焦主运营窗口，对比起飞延误与到达延误，观察空中追回效果。',
    monthlyTitle: '月份延误趋势',
    monthlyDesc: '各月份平均延误变化，用于识别季节性规律。',
    weekdayTitle: '星期延误分析',
    periodTitle: '时段延误分析',
    periodDesc: '对比不同运营时段的延误程度。',
    heatmapTitle: '星期 x 小时延误热力图',
    heatmapDesc: '精准定位 05:00-23:00 的高风险窗口。',
    conclusionTitle: '时间规律结论',
    c1: '05:00-09:00 的早间航班通常最准点。',
    c2: '下午延误通常高于早间，运营压力开始累积。',
    c3: '18:00-21:00 是最严重的延误风险窗口。',
    c4: '延误会随 05:00-23:00 主运营窗口逐步累积，越晚越容易延误。',
  } : {});
  const { data: hourlyDepDelay } = useFetch('/api/module2/hourly-dep-delay');
  const { data: hourlyComparison } = useFetch('/api/module2/hourly-comparison');
  const { data: monthlyTrend } = useFetch('/api/module2/monthly-trend');
  const { data: weekdayAnalysis } = useFetch('/api/module2/weekday-analysis');
  const { data: weekdayHourHeatmap } = useFetch('/api/module2/weekday-hour-heatmap');
  const { data: periodAnalysis } = useFetch('/api/module2/period-analysis');
  const { data: conclusions } = useFetch('/api/module2/conclusions');

  const activeHourlyComparison = interactiveData?.hourlyComparison || hourlyComparison;
  const activeWeekdayHourHeatmap = interactiveData?.weekdayHourHeatmap || weekdayHourHeatmap;
  const operatingHourlyComparison = (activeHourlyComparison || []).filter((d: any) => {
    const hour = Number(d.hour);
    return Number.isFinite(hour) && hour >= OPERATING_START_HOUR && hour <= OPERATING_END_HOUR;
  });
  const translatePeriod = (value: string) => {
    return localizeDisplayValue(value, language);
  };

  // 双折线图：起飞延误 vs 到达延误
  const comparisonOption = {
    ...chartBaseOptions,
    tooltip: { ...chartBaseOptions.tooltip, trigger: 'axis' },
    legend: {
      data: [label.depDelay, label.arrDelay],
      textStyle: { color: '#94a3b8' },
      top: 0
    },
    xAxis: {
      ...chartBaseOptions.xAxis,
      type: 'category',
      boundaryGap: false,
      data: operatingHourlyComparison.map((d: any) => `${d.hour}:00`)
    },
    yAxis: { ...chartBaseOptions.yAxis, type: 'value', name: label.avgDelayAxis },
    series: [
      {
        name: label.depDelay,
        type: 'line',
        smooth: true,
        data: operatingHourlyComparison.map((d: any) => d.avgDepDelay),
        lineStyle: { color: '#00f2ff' },
        itemStyle: { color: '#00f2ff' }
      },
      {
        name: label.arrDelay,
        type: 'line',
        smooth: true,
        data: operatingHourlyComparison.map((d: any) => d.avgArrDelay),
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
      data: monthlyTrend?.map((d: any) => isZh ? d.monthName : `M${d.month}`) || []
    },
    yAxis: { ...chartBaseOptions.yAxis, type: 'value', name: label.avgDelayAxis },
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
      data: weekdayAnalysis?.map((d: any) => weekdayLabels[(Number(d.weekday) || 1) - 1] || d.weekdayName) || []
    },
    yAxis: { ...chartBaseOptions.yAxis, type: 'value', name: label.avgDelayAxis },
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
      data: periodAnalysis?.map((d: any) => translatePeriod(d.time_period)) || [],
      axisLabel: { rotate: 30, color: '#64748b' }
    },
    yAxis: { ...chartBaseOptions.yAxis, type: 'value', name: label.avgDelayAxis },
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

  const heatmapHours = OPERATING_HOURS;
  const heatmapHourLabels = heatmapHours.map((hour) => `${hour}:00`);
  const heatmapWeekdayLabels = weekdayLabels;
  const heatmapWeekdayIndex = new Map([
    ...sourceWeekdayLabels.map((name, index) => [name, index] as const),
    ...heatmapWeekdayLabels.map((name, index) => [name, index] as const),
  ]);
  const heatmapSeriesData = (activeWeekdayHourHeatmap || [])
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

  // 热力图
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
        return `<div style="padding: 4px 8px;">
          <div style="font-weight: 600; margin-bottom: 4px; color: #38bdf8;">${weekday} ${hour}:00</div>
          <div>${label.avgDelay}: <span style="color: #fbbf24; font-weight: 600;">${delay.toFixed(1)}</span> ${label.minute}</div>
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
      data: weekdayLabels,
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

  return (
    <div className="space-y-6">
      {/* 关键指标 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title={label.morningAvg}
          value={`${conclusions?.morningAvgDelay || '--'} ${label.minute}`}
          subtitle={isZh ? '5-12点' : '05:00-12:00'}
          icon={Clock}
          color="green"
        />
        <KPICard
          title={label.afternoonAvg}
          value={`${conclusions?.afternoonAvgDelay || '--'} ${label.minute}`}
          subtitle={isZh ? '12-18点' : '12:00-18:00'}
          icon={Clock}
          color="orange"
        />
        <KPICard
          title={label.eveningAvg}
          value={`${conclusions?.eveningAvgDelay || '--'} ${label.minute}`}
          subtitle={isZh ? '18-23点' : '18:00-23:00'}
          icon={Clock}
          color="red"
        />
        <KPICard
          title={label.worstMonth}
          value={conclusions?.maxVarMonth ? localizeDisplayValue(conclusions.maxVarMonth, language) : '--'}
          subtitle={label.worstMonthSub}
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
            {label.comparisonTitle}
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            {label.comparisonDesc}
          </p>
          <div className="h-[300px]">
            <ReactECharts option={comparisonOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 月份趋势 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            {label.monthlyTitle}
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            {label.monthlyDesc}
          </p>
          <div className="h-[300px]">
            <ReactECharts option={monthlyOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 星期分析 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-400" />
            {label.weekdayTitle}
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            {isZh
              ? `周一至周日的延误差异，${conclusions?.worstWeekday || '--'}延误最严重`
              : `Compare delay differences from Monday through Sunday. ${
                  conclusions?.worstWeekday ? localizeDisplayValue(conclusions.worstWeekday, language) : '--'
                } has the highest delay.`}
          </p>
          <div className="h-[300px]">
            <ReactECharts option={weekdayOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 时段分析 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-400" />
            {label.periodTitle}
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            {label.periodDesc}
          </p>
          <div className="h-[300px]">
            <ReactECharts option={periodOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 热力图 */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-slate-100 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                {label.heatmapTitle}
              </h3>
              <p className="text-sm text-slate-400 mt-2">
                {label.heatmapDesc}
              </p>
            </div>
          </div>
          <div className="h-[400px]">
            <ReactECharts option={heatmapOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>

      {/* 关键结论 */}
      <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-orange-500">
        <h3 className="text-lg font-medium text-slate-100 mb-3">{label.conclusionTitle}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
          <div className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span>{label.c1}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-400">✓</span>
            <span>{label.c2}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-400">✓</span>
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
