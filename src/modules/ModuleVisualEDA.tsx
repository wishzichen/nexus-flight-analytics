import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  BarChart3,
  Box,
  Boxes,
  CloudRain,
  Database,
  GitBranch,
  Layers3,
  LineChart,
  Loader2,
  MapPinned,
  Move,
  RefreshCcw,
  ScatterChart,
  Waves,
  X,
} from 'lucide-react';
import { GraphicWalker } from '@kanaries/graphic-walker';
import '@kanaries/graphic-walker/dist/style.css';
import { useLanguage, useTemplate } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { cachedJson } from '../lib/preloadData';

type EdaRow = Record<string, any>;

type EdaField = {
  fid: string;
  name: string;
  label?: string;
  description?: string;
  semanticType: 'quantitative' | 'nominal' | 'ordinal' | 'temporal';
  analyticType: 'dimension' | 'measure';
};

type EdaPayload = {
  rows: EdaRow[];
  fields: EdaField[];
  total: number;
  loaded: number;
  limit: number;
  sampled: boolean;
  requestedFullLoad?: boolean;
  source: string;
};

type GeoRow = {
  dest?: string;
  origin?: string;
  dest_name?: string;
  origin_name?: string;
  dest_lat?: number;
  dest_lon?: number;
  origin_lat?: number;
  origin_lon?: number;
};

type ChartId =
  | 'routeMap'
  | 'hourLine'
  | 'monthLine'
  | 'scatter'
  | 'box'
  | 'raincloud'
  | 'ridge'
  | 'waffle'
  | 'airlineBars'
  | 'delayHistogram'
  | 'weekdayHeatmap'
  | 'routeFlow'
  | 'airlineTreemap'
  | 'delayStack'
  | 'genericBar'
  | 'genericLine'
  | 'genericArea'
  | 'genericScatter'
  | 'genericBubble'
  | 'genericHeatmap'
  | 'genericTreemap'
  | 'genericStacked';

type SlotKey = 'dimension' | 'measure' | 'color' | 'size';

type EdaSlots = Record<SlotKey, string>;

type ResolvedSlots = Partial<Record<SlotKey, EdaField>>;

const chartText = {
  zh: {
    guided: '引导图表',
    drag: '自由拖拽',
    fields: '字段字典',
    builderHint: 'Graphic Walker 可继续做更自由的维度、指标、颜色与分面组合。',
    all2013: 'nycflights13 2013 数据',
    sampleLimit: '筛选视图抽样加载',
    rows: '行数',
    fieldsCount: '字段',
    source: '来源',
    chartTypes: '图形模板',
    chartHint: '选择模板后，可把字段拖入槽位来快速重组图形。',
    fieldShelf: '字段面板',
    slots: '拖拽槽位',
    dragHint: '点击字段也会自动填入合适槽位。',
    clearSlots: '清空槽位',
    dimension: '维度 / X',
    measure: '指标 / Y',
    color: '颜色 / 分组',
    size: '大小 / 第二指标',
    dropField: '拖入字段',
    noData: '暂无可绘制数据',
    map: '航线地图',
    mapDesc: '目的机场坐标散点，气泡大小代表航班量，颜色代表平均延误。',
    hourLine: '小时折线',
    hourLineDesc: '比较起飞与到达延误在一天内的变化，识别拥堵窗口。',
    monthLine: '月份趋势',
    monthLineDesc: '追踪月份变化与季节性运营压力。',
    scatter: '距离散点',
    scatterDesc: '展示航段距离与到达延误关系，颜色表达延误严重度。',
    box: '航司箱线图',
    boxDesc: '比较主要航司的中位数、四分位和异常延误。',
    raincloud: '雨云图',
    raincloudDesc: '结合箱线摘要与抖动散点展示航司延误分布。',
    ridge: '山脊图',
    ridgeDesc: '比较不同航司的延误峰值与长尾。',
    waffle: '华夫图',
    waffleDesc: '用 100 个单元展示准点、轻微、中度、严重延误占比。',
    airlineBars: '航司排行',
    airlineBarsDesc: '比较主要航司的航班量、平均起飞延误和准点率。',
    delayHistogram: '延误直方图',
    delayHistogramDesc: '按分钟区间统计起飞延误，观察长尾和极端拥堵。',
    weekdayHeatmap: '星期 x 小时热力图',
    weekdayHeatmapDesc: '定位高风险星期与小时组合。',
    routeFlow: '航线流图',
    routeFlowDesc: '绘制纽约三大机场到主要目的地的航线流动。',
    airlineTreemap: '航司矩形树图',
    airlineTreemapDesc: '用面积表示航司规模，用颜色表示平均起飞延误。',
    delayStack: '延误结构堆叠',
    delayStackDesc: '拆解各航司准点、轻微、中度、严重延误占比。',
    genericBar: '拖拽柱图',
    genericBarDesc: '按维度聚合指标，快速比较类别差异。',
    genericLine: '拖拽折线',
    genericLineDesc: '按时间或有序维度追踪指标变化。',
    genericArea: '拖拽面积图',
    genericAreaDesc: '突出指标随维度累积变化的形状。',
    genericScatter: '拖拽散点',
    genericScatterDesc: '用两个数值字段观察相关性，维度字段作为标签。',
    genericBubble: '拖拽气泡',
    genericBubbleDesc: '在散点基础上加入大小和颜色，比较多变量关系。',
    genericHeatmap: '拖拽热力图',
    genericHeatmapDesc: '用两个分类维度交叉平均指标。',
    genericTreemap: '拖拽树图',
    genericTreemapDesc: '按维度拆分结构，用颜色显示指标高低。',
    genericStacked: '拖拽堆叠图',
    genericStackedDesc: '按维度与分组字段拆解构成比例。',
    avgDep: '平均起飞延误',
    avgArr: '平均到达延误',
    flightCount: '航班量',
    onTimeRate: '准点率',
    distance: '距离',
    delay: '延误',
    minutes: '分钟',
    miles: '英里',
    severe: '严重',
    onTime: '准点',
    light: '轻微',
    moderate: '中度',
    total: '总计',
    loadScope: '加载范围',
    weekday: '星期',
    hour: '小时',
    share: '占比',
    routes: '航线',
    avgValue: '平均值',
    count: '计数',
  },
  en: {
    guided: 'Guided Charts',
    drag: 'Drag Builder',
    fields: 'Field Dictionary',
    builderHint: 'Drag fields into Graphic Walker channels to test dimensions, measures, color, and facets quickly.',
    all2013: 'nycflights13 2013 data',
    sampleLimit: 'Filtered sample view',
    rows: 'rows',
    fieldsCount: 'fields',
    source: 'source',
    chartTypes: 'Chart Templates',
    chartHint: 'Templates use current filtered data and the site theme. Switch to Drag Builder for free-form exploration.',
    fieldShelf: 'Field Shelf',
    slots: 'Drag Slots',
    dragHint: 'Clicking a field also fills a suitable slot.',
    clearSlots: 'Clear Slots',
    dimension: 'Dimension / X',
    measure: 'Measure / Y',
    color: 'Color / Group',
    size: 'Size / Second Measure',
    dropField: 'Drop field',
    noData: 'No drawable data',
    map: 'Route Map',
    mapDesc: 'Coordinate scatter for destination airports. Bubble size is flight volume and color is average delay.',
    hourLine: 'Hourly Line',
    hourLineDesc: 'Compare departure and arrival delay by departure hour to find daily congestion windows.',
    monthLine: 'Monthly Trend',
    monthLineDesc: 'Track delay changes across months and seasonal operating pressure.',
    scatter: 'Scatter Plot',
    scatterDesc: 'Relate route distance to arrival delay. Point color reflects delay severity.',
    box: 'Box Plot',
    boxDesc: 'Compare median, quartiles, and outliers across major airlines.',
    raincloud: 'Raincloud Plot',
    raincloudDesc: 'Combine box summaries and jittered points to show airline delay distributions.',
    ridge: 'Ridge Plot',
    ridgeDesc: 'Compare density curves for delay peaks and long tails by airline.',
    waffle: 'Waffle Chart',
    waffleDesc: 'Use 100 cells to show shares of on-time, light, moderate, and severe delay.',
    airlineBars: 'Airline Ranking',
    airlineBarsDesc: 'Compare major airlines by volume, average departure delay, and on-time rate.',
    delayHistogram: 'Delay Histogram',
    delayHistogramDesc: 'Count departure delay by minute bins to reveal long tails and congestion outliers.',
    weekdayHeatmap: 'Weekday x Hour Heatmap',
    weekdayHeatmapDesc: 'Locate high-risk weekday and hour combinations with a compact heatmap.',
    routeFlow: 'Route Flow',
    routeFlowDesc: 'Draw route flow from the three NYC airports to major destinations.',
    airlineTreemap: 'Airline Treemap',
    airlineTreemapDesc: 'Size blocks by airline volume and color them by average departure delay.',
    delayStack: 'Delay Mix Stack',
    delayStackDesc: 'Break down on-time, light, moderate, and severe delay shares by airline.',
    genericBar: 'Drag Bar',
    genericBarDesc: 'Aggregate a measure by dimension for fast category comparison.',
    genericLine: 'Drag Line',
    genericLineDesc: 'Track a measure across time or ordered dimensions.',
    genericArea: 'Drag Area',
    genericAreaDesc: 'Emphasize the shape of a measure across a dimension.',
    genericScatter: 'Drag Scatter',
    genericScatterDesc: 'Compare two numeric fields and use the dimension as labels.',
    genericBubble: 'Drag Bubble',
    genericBubbleDesc: 'Add size and color on top of scatter relationships.',
    genericHeatmap: 'Drag Heatmap',
    genericHeatmapDesc: 'Cross two categorical fields and average the selected measure.',
    genericTreemap: 'Drag Treemap',
    genericTreemapDesc: 'Split structure by dimension and color by measure level.',
    genericStacked: 'Drag Stacked Bar',
    genericStackedDesc: 'Break each dimension into grouped shares.',
    avgDep: 'Avg Departure Delay',
    avgArr: 'Avg Arrival Delay',
    flightCount: 'Flight Count',
    onTimeRate: 'On-time Rate',
    distance: 'Distance',
    delay: 'Delay',
    minutes: 'min',
    miles: 'mi',
    severe: 'Severe',
    onTime: 'On-time',
    light: 'Light',
    moderate: 'Moderate',
    total: 'Total',
    loadScope: 'Load Scope',
    weekday: 'Weekday',
    hour: 'Hour',
    share: 'Share',
    routes: 'Routes',
    avgValue: 'Average',
    count: 'Count',
  },
};

const delayColors = {
  onTime: '#10b981',
  light: '#22d3ee',
  moderate: '#f59e0b',
  severe: '#ef4444',
};

const DEFAULT_EDA_LIMIT = 12000;
const FILTERED_EDA_LIMIT = 30000;

function isDefault2013View(filterQuery: string) {
  const params = new URLSearchParams(filterQuery);
  const entries = Array.from(params.entries()).filter(([key]) => key !== 'limit' && key !== 'lang');
  if (entries.length === 0) return true;
  return entries.length === 1 && entries[0][0] === 'years' && entries[0][1] === '2013';
}

function toNumber(value: unknown): number | null {
  const next = Number(value);
  return Number.isFinite(next) ? next : null;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(values: number[], p: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function delayBucket(value: number) {
  if (value <= 0) return 'onTime';
  if (value <= 15) return 'light';
  if (value <= 60) return 'moderate';
  return 'severe';
}

function groupRows<T>(rows: EdaRow[], keyFn: (row: EdaRow) => string | number | undefined | null, mapper: (key: string, group: EdaRow[]) => T) {
  const groups = new Map<string, EdaRow[]>();
  rows.forEach((row) => {
    const rawKey = keyFn(row);
    if (rawKey === undefined || rawKey === null || rawKey === '') return;
    const key = String(rawKey);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  });
  return Array.from(groups.entries()).map(([key, group]) => mapper(key, group));
}

function topAirlineCodes(rows: EdaRow[], count = 8) {
  return groupRows(rows, (row) => row.airlineCode, (carrier, group) => ({
    carrier,
    name: group[0]?.airlineName || carrier,
    count: group.length,
  }))
    .sort((a, b) => b.count - a.count)
    .slice(0, count);
}

function sampleRows<T>(rows: T[], limit: number) {
  if (rows.length <= limit) return rows;
  const step = rows.length / limit;
  return Array.from({ length: limit }, (_, index) => rows[Math.floor(index * step)]);
}

function density(values: number[], min = -30, max = 120, binCount = 40) {
  const bins = Array.from({ length: binCount }, (_, index) => ({
    x: min + ((max - min) * index) / (binCount - 1),
    y: 0,
  }));

  values.forEach((value) => {
    const clipped = clamp(value, min, max);
    const index = Math.round(((clipped - min) / (max - min)) * (binCount - 1));
    bins[index].y += 1;
  });

  const maxCount = Math.max(...bins.map((bin) => bin.y), 1);
  return bins.map((bin) => ({ x: bin.x, y: bin.y / maxCount }));
}

function histogram(values: number[], min = -30, max = 180, binSize = 10) {
  const bins = Array.from({ length: Math.ceil((max - min) / binSize) }, (_, index) => ({
    start: min + index * binSize,
    end: min + (index + 1) * binSize,
    count: 0,
  }));

  values.forEach((value) => {
    const clipped = clamp(value, min, max - 0.001);
    const index = Math.floor((clipped - min) / binSize);
    if (bins[index]) bins[index].count += 1;
  });

  return bins;
}

function baseChart(theme: 'dark' | 'light') {
  const dark = theme === 'dark';
  const text = dark ? '#cbd5e1' : '#334155';
  const muted = dark ? '#64748b' : '#64748b';
  const gridLine = dark ? '#1e293b' : '#dbeafe';
  return {
    backgroundColor: 'transparent',
    textStyle: { color: text, fontFamily: 'Inter, Helvetica Neue, Arial, sans-serif' },
    tooltip: {
      trigger: 'item',
      backgroundColor: dark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.96)',
      borderColor: dark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(15, 23, 42, 0.12)',
      textStyle: { color: text },
    },
    legend: {
      textStyle: { color: muted },
      top: 0,
    },
    grid: { left: 52, right: 28, top: 58, bottom: 54, containLabel: true },
    xAxis: {
      axisLine: { lineStyle: { color: gridLine } },
      splitLine: { lineStyle: { color: gridLine, type: 'dashed' } },
      axisLabel: { color: muted },
    },
    yAxis: {
      axisLine: { lineStyle: { color: gridLine } },
      splitLine: { lineStyle: { color: gridLine, type: 'dashed' } },
      axisLabel: { color: muted },
    },
  };
}

function buildChartData(rows: EdaRow[], destGeo: GeoRow[], originGeo: GeoRow[]) {
  const dep = (row: EdaRow) => toNumber(row.departureDelay) ?? 0;
  const arr = (row: EdaRow) => toNumber(row.arrivalDelay) ?? 0;
  const distance = (row: EdaRow) => toNumber(row.flightDistance) ?? 0;
  const geoByDest = new Map(destGeo.map((item) => [item.dest, item]));
  const geoByOrigin = new Map(originGeo.map((item) => [item.origin, item]));
  const airlines = topAirlineCodes(rows, 8);
  const airlineSet = new Set(airlines.map((item) => item.carrier));

  const hourly = groupRows(rows, (row) => toNumber(row.hour), (hour, group) => ({
    hour: Number(hour),
    count: group.length,
    avgDep: round(average(group.map(dep))),
    avgArr: round(average(group.map(arr))),
  })).sort((a, b) => a.hour - b.hour);

  const monthly = groupRows(rows, (row) => toNumber(row.month), (month, group) => ({
    month: Number(month),
    count: group.length,
    avgDep: round(average(group.map(dep))),
    avgArr: round(average(group.map(arr))),
  })).sort((a, b) => a.month - b.month);

  const destinationMap = groupRows(rows, (row) => row.arrivalAirport, (dest, group) => {
    const geo = geoByDest.get(dest);
    return {
      dest,
      name: group[0]?.arrivalAirportName || geo?.dest_name || dest,
      count: group.length,
      avgDelay: round(average(group.map(arr))),
      lat: geo?.dest_lat,
      lon: geo?.dest_lon,
    };
  }).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lon));

  const originMap = groupRows(rows, (row) => row.departureAirport, (origin, group) => {
    const geo = geoByOrigin.get(origin);
    return {
      origin,
      name: group[0]?.departureAirportName || geo?.origin_name || origin,
      count: group.length,
      lat: geo?.origin_lat,
      lon: geo?.origin_lon,
    };
  }).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lon));

  const routeFlow = groupRows(rows, (row) => {
    if (!row.departureAirport || !row.arrivalAirport) return null;
    return `${row.departureAirport}|${row.arrivalAirport}`;
  }, (key, group) => {
    const [origin, dest] = key.split('|');
    const originPoint = geoByOrigin.get(origin);
    const destPoint = geoByDest.get(dest);
    return {
      route: `${origin} -> ${dest}`,
      origin,
      dest,
      originName: group[0]?.departureAirportName || originPoint?.origin_name || origin,
      destName: group[0]?.arrivalAirportName || destPoint?.dest_name || dest,
      count: group.length,
      avgDelay: round(average(group.map(arr))),
      coords: [
        [originPoint?.origin_lon, originPoint?.origin_lat],
        [destPoint?.dest_lon, destPoint?.dest_lat],
      ],
    };
  })
    .filter((item) => item.coords.every((coord) => Number.isFinite(coord[0]) && Number.isFinite(coord[1])))
    .sort((a, b) => b.count - a.count)
    .slice(0, 140);

  const scatter = sampleRows(rows, 3500)
    .map((row) => [distance(row), arr(row), row.airlineCode || '', row.arrivalAirport || '', row.route || ''])
    .filter((item) => item[0] !== 0);

  const box = airlines.map((airline) => {
    const values = rows
      .filter((row) => row.airlineCode === airline.carrier)
      .map(dep)
      .filter(Number.isFinite);
    const p05 = percentile(values, 0.05);
    const q1 = percentile(values, 0.25);
    const median = percentile(values, 0.5);
    const q3 = percentile(values, 0.75);
    const p95 = percentile(values, 0.95);
    return {
      carrier: airline.carrier,
      name: airline.name,
      values,
      summary: [round(p05), round(q1), round(median), round(q3), round(p95)],
    };
  });

  const rain = sampleRows(rows.filter((row) => airlineSet.has(row.airlineCode)), 3200)
    .map((row, index) => {
      const airlineIndex = airlines.findIndex((airline) => airline.carrier === row.airlineCode);
      const jitter = ((index % 17) - 8) / 32;
      return [airlineIndex + jitter, dep(row), row.airlineCode, row.flightNumber];
    })
    .filter((item) => item[0] >= 0);

  const ridge = airlines.slice(0, 6).map((airline, index) => {
    const values = rows.filter((row) => row.airlineCode === airline.carrier).map(dep);
    return {
      carrier: airline.carrier,
      name: airline.name,
      offset: index,
      points: density(values).map((item) => [round(item.x), round(item.y * 0.72 + index, 3)]),
    };
  });

  const bucketCounts = rows.reduce<Record<string, number>>((acc, row) => {
    const bucket = delayBucket(dep(row));
    acc[bucket] = (acc[bucket] || 0) + 1;
    return acc;
  }, {});

  const delayHistogram = histogram(rows.map(dep));

  const weekdayHeatmap = groupRows(rows, (row) => {
    const weekday = getWeekday(row);
    const hour = toNumber(row.hour);
    return weekday && hour !== null ? `${weekday}|${hour}` : null;
  }, (key, group) => {
    const [weekday, hour] = key.split('|').map(Number);
    return {
      weekday,
      hour,
      count: group.length,
      avgDelay: round(average(group.map(dep))),
    };
  }).filter((item) => item.hour >= 0 && item.hour <= 23);

  const airlineBars = airlines.map((airline) => {
    const group = rows.filter((row) => row.airlineCode === airline.carrier);
    const onTimeCount = group.filter((row) => dep(row) <= 15).length;
    return {
      carrier: airline.carrier,
      name: airline.name,
      count: group.length,
      avgDep: round(average(group.map(dep))),
      onTimeRate: group.length ? round((onTimeCount / group.length) * 100) : 0,
    };
  });

  const airlineTreemap = airlineBars.map((item) => ({
    name: `${item.carrier} ${item.name}`,
    value: item.count,
    avgDep: item.avgDep,
  }));

  const delayStack = airlines.map((airline) => {
    const group = rows.filter((row) => row.airlineCode === airline.carrier);
    const counts = group.reduce<Record<string, number>>((acc, row) => {
      const bucket = delayBucket(dep(row));
      acc[bucket] = (acc[bucket] || 0) + 1;
      return acc;
    }, {});
    return {
      carrier: airline.carrier,
      count: group.length,
      onTime: counts.onTime || 0,
      light: counts.light || 0,
      moderate: counts.moderate || 0,
      severe: counts.severe || 0,
    };
  });

  return {
    hourly,
    monthly,
    destinationMap,
    originMap,
    routeFlow,
    scatter,
    box,
    rain,
    ridge,
    bucketCounts,
    delayHistogram,
    weekdayHeatmap,
    airlineBars,
    airlineTreemap,
    delayStack,
    airlines,
  };
}

function buildWaffleData(bucketCounts: Record<string, number>) {
  const total = Object.values(bucketCounts).reduce((sum, value) => sum + value, 0);
  const order = ['onTime', 'light', 'moderate', 'severe'];
  let cells: Array<[number, number, string]> = [];

  order.forEach((bucket) => {
    const count = total ? Math.round(((bucketCounts[bucket] || 0) / total) * 100) : 0;
    cells = cells.concat(Array.from({ length: count }, () => [0, 0, bucket] as [number, number, string]));
  });

  while (cells.length < 100) cells.push([0, 0, 'onTime']);
  cells = cells.slice(0, 100).map((cell, index) => [index % 10, 9 - Math.floor(index / 10), cell[2]]);
  return { total, cells };
}

function getWeekday(row: EdaRow) {
  const numeric = toNumber(row.weekday);
  if (numeric && numeric >= 1 && numeric <= 7) return numeric;
  const name = String(row.weekdayName || '');
  if (name.includes('一') || name === 'Monday' || name === 'Mon') return 1;
  if (name.includes('二') || name === 'Tuesday' || name === 'Tue') return 2;
  if (name.includes('三') || name === 'Wednesday' || name === 'Wed') return 3;
  if (name.includes('四') || name === 'Thursday' || name === 'Thu') return 4;
  if (name.includes('五') || name === 'Friday' || name === 'Fri') return 5;
  if (name.includes('六') || name === 'Saturday' || name === 'Sat') return 6;
  if (name.includes('日') || name === 'Sunday' || name === 'Sun') return 7;
  return null;
}

function isGenericChart(chartId: ChartId) {
  return chartId.startsWith('generic');
}

function fieldLabel(field?: EdaField) {
  return field?.label || field?.name || field?.fid || '';
}

function sourceLabel(source: string | undefined, language: 'zh' | 'en') {
  if (!source) return '--';
  if (source.includes('sqlite')) return language === 'zh' ? '本地数据库' : 'Local database';
  if (source.includes('static')) return language === 'zh' ? 'nycflights13 数据' : 'nycflights13 data';
  if (source.includes('json')) return language === 'zh' ? 'JSON 数据' : 'JSON data';
  return source;
}

function numericValue(row: EdaRow, field?: EdaField) {
  if (!field) return null;
  return toNumber(row[field.fid]);
}

function displayValue(row: EdaRow, field?: EdaField) {
  if (!field) return '';
  const value = row[field.fid];
  if (value === undefined || value === null || value === '') return '';
  return String(value);
}

function aggregateByDimension(rows: EdaRow[], dimension: EdaField, measure?: EdaField, limit = 16) {
  return groupRows(rows, (row) => displayValue(row, dimension), (key, group) => {
    const values = measure
      ? group.map((row) => numericValue(row, measure)).filter((value): value is number => value !== null)
      : [];
    return {
      key,
      count: group.length,
      value: measure && values.length ? round(average(values), 2) : group.length,
    };
  })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function getDefaultField(fields: EdaField[], preferred: string[], fallback: (field: EdaField) => boolean) {
  return preferred
    .map((fid) => fields.find((field) => field.fid === fid))
    .find(Boolean)
    || fields.find(fallback)
    || fields[0];
}

function resolveSlots(fields: EdaField[], slots: EdaSlots): ResolvedSlots {
  const byId = new Map(fields.map((field) => [field.fid, field]));
  return {
    dimension: byId.get(slots.dimension)
      || getDefaultField(fields, ['airlineCode', 'arrivalAirport', 'month'], (field) => field.analyticType === 'dimension'),
    measure: byId.get(slots.measure)
      || getDefaultField(fields, ['departureDelay', 'arrivalDelay'], (field) => field.analyticType === 'measure'),
    color: byId.get(slots.color)
      || getDefaultField(fields, ['delayLevel', 'departureAirport'], (field) => field.analyticType === 'dimension'),
    size: byId.get(slots.size)
      || getDefaultField(fields, ['flightDistance', 'flightTime', 'arrivalDelay'], (field) => field.analyticType === 'measure'),
  };
}

function buildGenericChartOption(
  chartId: ChartId,
  rows: EdaRow[],
  slots: ResolvedSlots,
  copy: typeof chartText.zh,
  theme: 'dark' | 'light',
) {
  const base = baseChart(theme);
  const dimension = slots.dimension;
  const measure = slots.measure;
  const color = slots.color;
  const size = slots.size;
  if (!dimension || rows.length === 0) return base;

  const measureLabel = measure ? `${copy.avgValue} ${fieldLabel(measure)}` : copy.count;
  const dimensionLabel = fieldLabel(dimension);

  if (chartId === 'genericScatter' || chartId === 'genericBubble') {
    const xField = size || getDefaultField(Object.values(slots).filter(Boolean) as EdaField[], [], (field) => field.analyticType === 'measure');
    const yField = measure;
    const scatterRows = sampleRows(rows, 4200)
      .map((row) => {
        const x = numericValue(row, xField);
        const y = numericValue(row, yField);
        if (x === null || y === null) return null;
        return [x, y, displayValue(row, dimension), displayValue(row, color), numericValue(row, size) ?? x];
      })
      .filter(Boolean) as Array<[number, number, string, string, number]>;
    const maxSize = Math.max(...scatterRows.map((item) => item[4]), 1);

    return {
      ...base,
      tooltip: {
        ...base.tooltip,
        formatter: (params: any) =>
          `${dimensionLabel}: ${params.data[2] || '--'}<br/>${fieldLabel(xField)}: ${params.data[0]}<br/>${fieldLabel(yField)}: ${params.data[1]}${color ? `<br/>${fieldLabel(color)}: ${params.data[3] || '--'}` : ''}`,
      },
      xAxis: { ...base.xAxis, type: 'value', name: fieldLabel(xField) },
      yAxis: { ...base.yAxis, type: 'value', name: fieldLabel(yField) },
      series: [{
        type: 'scatter',
        data: scatterRows,
        symbolSize: (value: any[]) => chartId === 'genericBubble'
          ? clamp(Math.sqrt(Math.abs(value[4]) / maxSize) * 48, 6, 44)
          : 8,
        itemStyle: {
          opacity: 0.6,
          color: chartId === 'genericBubble' ? '#f59e0b' : '#22d3ee',
        },
      }],
    };
  }

  if (chartId === 'genericHeatmap' && color) {
    const xItems = aggregateByDimension(rows, dimension, undefined, 14);
    const yItems = aggregateByDimension(rows, color, undefined, 12);
    const xSet = new Set(xItems.map((item) => item.key));
    const ySet = new Set(yItems.map((item) => item.key));
    const cells = groupRows(rows, (row) => {
      const x = displayValue(row, dimension);
      const y = displayValue(row, color);
      return xSet.has(x) && ySet.has(y) ? `${x}|${y}` : null;
    }, (key, group) => {
      const [x, y] = key.split('|');
      const values = measure
        ? group.map((row) => numericValue(row, measure)).filter((value): value is number => value !== null)
        : [];
      return {
        x,
        y,
        value: measure && values.length ? round(average(values), 2) : group.length,
        count: group.length,
      };
    });
    const maxValue = Math.max(...cells.map((item) => item.value), 1);

    return {
      ...base,
      tooltip: {
        ...base.tooltip,
        formatter: (params: any) =>
          `${dimensionLabel}: ${params.data[0]}<br/>${fieldLabel(color)}: ${params.data[1]}<br/>${measureLabel}: ${params.data[2]}<br/>${copy.flightCount}: ${params.data[3].toLocaleString()}`,
      },
      grid: { left: 96, right: 32, top: 54, bottom: 96 },
      xAxis: { ...base.xAxis, type: 'category', data: xItems.map((item) => item.key), axisLabel: { ...base.xAxis.axisLabel, rotate: 35 } },
      yAxis: { ...base.yAxis, type: 'category', data: yItems.map((item) => item.key) },
      visualMap: {
        min: 0,
        max: maxValue,
        orient: 'horizontal',
        left: 'center',
        bottom: 8,
        inRange: { color: ['#dbeafe', '#38bdf8', '#f59e0b', '#ef4444'] },
        textStyle: { color: theme === 'dark' ? '#94a3b8' : '#475569' },
      },
      series: [{
        type: 'heatmap',
        data: cells.map((item) => [item.x, item.y, item.value, item.count]),
        itemStyle: { borderColor: theme === 'dark' ? '#020617' : '#ffffff', borderWidth: 2, borderRadius: 2 },
      }],
    };
  }

  if (chartId === 'genericTreemap') {
    const items = aggregateByDimension(rows, dimension, measure, 24);
    return {
      ...base,
      tooltip: {
        ...base.tooltip,
        formatter: (params: any) => `${params.name}<br/>${copy.flightCount}: ${params.value.toLocaleString()}<br/>${measureLabel}: ${params.data.metric}`,
      },
      xAxis: undefined,
      yAxis: undefined,
      series: [{
        type: 'treemap',
        roam: false,
        breadcrumb: { show: false },
        label: { color: '#ffffff', formatter: '{b}' },
        itemStyle: { borderColor: theme === 'dark' ? '#020617' : '#ffffff', borderWidth: 2, gapWidth: 2 },
        data: items.map((item) => ({
          name: item.key,
          value: item.count,
          metric: item.value,
          itemStyle: {
            color: item.value <= 5 ? '#10b981' : item.value <= 15 ? '#22d3ee' : item.value <= 30 ? '#f59e0b' : '#ef4444',
          },
        })),
      }],
    };
  }

  if (chartId === 'genericStacked' && color) {
    const dimensions = aggregateByDimension(rows, dimension, undefined, 12).map((item) => item.key);
    const groups = aggregateByDimension(rows, color, undefined, 8).map((item) => item.key);
    const table = new Map<string, number>();
    rows.forEach((row) => {
      const x = displayValue(row, dimension);
      const group = displayValue(row, color);
      if (!dimensions.includes(x) || !groups.includes(group)) return;
      const key = `${x}|${group}`;
      table.set(key, (table.get(key) || 0) + 1);
    });

    return {
      ...base,
      tooltip: { ...base.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { ...base.legend, data: groups },
      xAxis: { ...base.xAxis, type: 'category', data: dimensions, axisLabel: { ...base.xAxis.axisLabel, rotate: 25 } },
      yAxis: { ...base.yAxis, type: 'value', name: copy.flightCount },
      series: groups.map((group, index) => ({
        name: group,
        type: 'bar',
        stack: 'total',
        data: dimensions.map((item) => table.get(`${item}|${group}`) || 0),
        itemStyle: { color: ['#22d3ee', '#a78bfa', '#f59e0b', '#10b981', '#ef4444', '#60a5fa', '#f472b6', '#94a3b8'][index % 8] },
      })),
    };
  }

  const items = aggregateByDimension(rows, dimension, measure, 18).sort((a, b) => {
    if (dimension.semanticType === 'ordinal' || dimension.semanticType === 'temporal') return Number(a.key) - Number(b.key);
    return b.value - a.value;
  });
  const seriesType = chartId === 'genericLine' || chartId === 'genericArea' ? 'line' : 'bar';

  return {
    ...base,
    tooltip: { ...base.tooltip, trigger: 'axis' },
    xAxis: { ...base.xAxis, type: 'category', name: dimensionLabel, data: items.map((item) => item.key), axisLabel: { ...base.xAxis.axisLabel, rotate: items.length > 10 ? 25 : 0 } },
    yAxis: { ...base.yAxis, type: 'value', name: measureLabel },
    series: [{
      name: measureLabel,
      type: seriesType,
      smooth: seriesType === 'line',
      data: items.map((item) => item.value),
      lineStyle: { color: '#22d3ee', width: 3 },
      itemStyle: { color: '#22d3ee', borderRadius: [4, 4, 0, 0] },
      areaStyle: chartId === 'genericArea' ? { color: 'rgba(34, 211, 238, 0.16)' } : undefined,
    }],
  };
}

export default function ModuleVisualEDA({ filterQuery }: { filterQuery: string }) {
  const { language, t } = useLanguage();
  const template = useTemplate();
  const { theme } = useTheme();
  const copy = chartText[language];
  const [mode, setMode] = useState<'guided' | 'drag' | 'fields'>('guided');
  const [selectedChart, setSelectedChart] = useState<ChartId>('hourLine');
  const [slots, setSlots] = useState<EdaSlots>({
    dimension: 'airlineCode',
    measure: 'departureDelay',
    color: 'delayLevel',
    size: 'flightDistance',
  });
  const [payload, setPayload] = useState<EdaPayload | null>(null);
  const [destGeo, setDestGeo] = useState<GeoRow[]>([]);
  const [originGeo, setOriginGeo] = useState<GeoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const coldStartView = isDefault2013View(filterQuery);
  const query = useMemo(() => {
    const params = new URLSearchParams(filterQuery);
    if (!Array.from(params.keys()).some((key) => key !== 'limit' && key !== 'lang')) {
      params.set('years', '2013');
    }
    params.set('limit', String(coldStartView ? DEFAULT_EDA_LIMIT : FILTERED_EDA_LIMIT));
    params.set('lang', language);
    return params.toString();
  }, [filterQuery, coldStartView, language]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPayload(await cachedJson<EdaPayload>(`/api/eda/rows?${query}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('eda.error'));
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [query, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    Promise.all([
      cachedJson<GeoRow[]>('/api/module3/dest-geo').catch(() => []),
      cachedJson<GeoRow[]>('/api/module3/origin-geo').catch(() => []),
    ]).then(([destRows, originRows]) => {
      setDestGeo(Array.isArray(destRows) ? destRows : []);
      setOriginGeo(Array.isArray(originRows) ? originRows : []);
    }).catch(() => {
      setDestGeo([]);
      setOriginGeo([]);
    });
  }, []);

  const chartData = useMemo(
    () => buildChartData(payload?.rows || [], destGeo, originGeo),
    [destGeo, originGeo, payload?.rows],
  );
  const resolvedSlots = useMemo(
    () => resolveSlots(payload?.fields || [], slots),
    [payload?.fields, slots],
  );

  const statusText = payload
    ? payload.sampled
      ? template('eda.sampled', {
          total: payload.total.toLocaleString(),
          loaded: payload.loaded.toLocaleString(),
        })
      : template('eda.full', { loaded: payload.loaded.toLocaleString() })
    : template('eda.limit', { count: coldStartView ? DEFAULT_EDA_LIMIT.toLocaleString() : FILTERED_EDA_LIMIT.toLocaleString() });

  const chartTemplates = [
    { id: 'routeMap' as ChartId, label: copy.map, desc: copy.mapDesc, icon: MapPinned },
    { id: 'hourLine' as ChartId, label: copy.hourLine, desc: copy.hourLineDesc, icon: LineChart },
    { id: 'monthLine' as ChartId, label: copy.monthLine, desc: copy.monthLineDesc, icon: Waves },
    { id: 'scatter' as ChartId, label: copy.scatter, desc: copy.scatterDesc, icon: ScatterChart },
    { id: 'box' as ChartId, label: copy.box, desc: copy.boxDesc, icon: Box },
    { id: 'raincloud' as ChartId, label: copy.raincloud, desc: copy.raincloudDesc, icon: CloudRain },
    { id: 'ridge' as ChartId, label: copy.ridge, desc: copy.ridgeDesc, icon: Layers3 },
    { id: 'waffle' as ChartId, label: copy.waffle, desc: copy.waffleDesc, icon: Boxes },
    { id: 'airlineBars' as ChartId, label: copy.airlineBars, desc: copy.airlineBarsDesc, icon: BarChart3 },
    { id: 'delayHistogram' as ChartId, label: copy.delayHistogram, desc: copy.delayHistogramDesc, icon: BarChart3 },
    { id: 'weekdayHeatmap' as ChartId, label: copy.weekdayHeatmap, desc: copy.weekdayHeatmapDesc, icon: Waves },
    { id: 'routeFlow' as ChartId, label: copy.routeFlow, desc: copy.routeFlowDesc, icon: GitBranch },
    { id: 'airlineTreemap' as ChartId, label: copy.airlineTreemap, desc: copy.airlineTreemapDesc, icon: Layers3 },
    { id: 'delayStack' as ChartId, label: copy.delayStack, desc: copy.delayStackDesc, icon: Boxes },
    { id: 'genericBar' as ChartId, label: copy.genericBar, desc: copy.genericBarDesc, icon: BarChart3 },
    { id: 'genericLine' as ChartId, label: copy.genericLine, desc: copy.genericLineDesc, icon: LineChart },
    { id: 'genericArea' as ChartId, label: copy.genericArea, desc: copy.genericAreaDesc, icon: Waves },
    { id: 'genericScatter' as ChartId, label: copy.genericScatter, desc: copy.genericScatterDesc, icon: ScatterChart },
    { id: 'genericBubble' as ChartId, label: copy.genericBubble, desc: copy.genericBubbleDesc, icon: ScatterChart },
    { id: 'genericHeatmap' as ChartId, label: copy.genericHeatmap, desc: copy.genericHeatmapDesc, icon: Waves },
    { id: 'genericTreemap' as ChartId, label: copy.genericTreemap, desc: copy.genericTreemapDesc, icon: Layers3 },
    { id: 'genericStacked' as ChartId, label: copy.genericStacked, desc: copy.genericStackedDesc, icon: Boxes },
  ];

  const recommendedTemplateIds: ChartId[] = [
    'hourLine',
    'airlineBars',
    'delayStack',
    'weekdayHeatmap',
    'delayHistogram',
    'routeMap',
    'scatter',
    'box',
  ];
  const templateById = new Map(chartTemplates.map((item) => [item.id, item]));
  const recommendedTemplates = recommendedTemplateIds
    .map((id) => templateById.get(id))
    .filter((item): item is (typeof chartTemplates)[number] => Boolean(item));
  const exploratoryTemplates = chartTemplates.filter((item) => !recommendedTemplateIds.includes(item.id));
  const selectedTemplate = chartTemplates.find((item) => item.id === selectedChart) || chartTemplates[0];
  const SelectedIcon = selectedTemplate.icon;
  const showSlotBuilder = isGenericChart(selectedChart);
  const option = useMemo(
    () => isGenericChart(selectedChart)
      ? buildGenericChartOption(selectedChart, payload?.rows || [], resolvedSlots, copy, theme)
      : getChartOption(selectedChart, chartData, copy, theme),
    [chartData, copy, payload?.rows, resolvedSlots, selectedChart, theme],
  );

  const assignField = useCallback((field: EdaField, slot?: SlotKey) => {
    setSlots((current) => {
      const nextSlot = slot
        || (field.analyticType === 'measure'
          ? (current.measure ? 'size' : 'measure')
          : (current.dimension ? 'color' : 'dimension'));
      return { ...current, [nextSlot]: field.fid };
    });
  }, []);

  const handleDrop = (event: React.DragEvent, slot: SlotKey) => {
    event.preventDefault();
    const fieldId = event.dataTransfer.getData('text/plain');
    const field = payload?.fields.find((item) => item.fid === fieldId);
    if (field) assignField(field, slot);
  };

  const slotItems: Array<{ id: SlotKey; label: string }> = [
    { id: 'dimension', label: copy.dimension },
    { id: 'measure', label: copy.measure },
    { id: 'color', label: copy.color },
    { id: 'size', label: copy.size },
  ];

  const dimensions = (payload?.fields || []).filter((field) => field.analyticType === 'dimension');
  const measures = (payload?.fields || []).filter((field) => field.analyticType === 'measure');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-100">
            <BarChart3 className="h-5 w-5 text-cyan-400" />
            {t('eda.title')}
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            {language === 'zh'
              ? '从推荐图表开始，需要重组字段时再切换到自由拖拽或字段字典。'
              : 'Start with curated charts, then switch to Drag Builder or Field Dictionary when needed.'}
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="filter-control inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          {t('eda.reload')}
        </button>
      </div>

      <div className="glass-panel rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {[
              { label: copy.loadScope, value: coldStartView ? copy.all2013 : copy.sampleLimit, tone: 'text-cyan-300' },
              { label: copy.rows, value: payload?.loaded?.toLocaleString() || '--', tone: 'text-white' },
              { label: copy.fieldsCount, value: payload?.fields?.length || '--', tone: 'text-white' },
              { label: copy.source, value: sourceLabel(payload?.source, language), tone: 'text-slate-200' },
            ].map((item) => (
              <div key={item.label} className="min-w-[120px]">
                <div className="text-xs text-slate-500">{item.label}</div>
                <div className={`mt-1 truncate text-sm font-semibold ${item.tone}`}>{item.value}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'guided' as const, label: copy.guided, icon: BarChart3 },
              { id: 'drag' as const, label: copy.drag, icon: Move },
              { id: 'fields' as const, label: copy.fields, icon: Database },
            ].map((item) => {
              const Icon = item.icon;
              const active = mode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id)}
                  className={`inline-flex min-w-[8rem] items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-200'
                      : 'border-white/10 bg-slate-900/40 text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 text-xs text-slate-500">
          {statusText}
          {payload ? ` · ${payload.total.toLocaleString()} ${copy.total}` : ''}
        </div>
      </div>

      {loading && (
        <div className="glass-panel flex h-[520px] items-center justify-center rounded-xl">
          <div className="flex items-center gap-2 text-cyan-300">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t('eda.loading')}
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="glass-panel rounded-xl border-red-500/30 p-6 text-sm text-red-300">
          {error}
        </div>
      )}

      {!loading && payload && mode === 'guided' && (
        <div className="space-y-4">
          <section className="glass-panel rounded-xl p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-100">{copy.chartTypes}</div>
                <p className="mt-1 text-xs leading-5 text-slate-500">{copy.chartHint}</p>
              </div>
              {showSlotBuilder && (
                <button
                  type="button"
                  onClick={() => setSlots({ dimension: '', measure: '', color: '', size: '' })}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
                >
                  <X className="h-3.5 w-3.5" />
                  {copy.clearSlots}
                </button>
              )}
            </div>

            <div className="eda-template-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
              {[...recommendedTemplates, ...exploratoryTemplates].map((templateItem) => {
                const Icon = templateItem.icon;
                const active = selectedChart === templateItem.id;
                const recommended = recommendedTemplateIds.includes(templateItem.id);
                return (
                  <button
                    key={templateItem.id}
                    type="button"
                    onClick={() => setSelectedChart(templateItem.id)}
                    title={templateItem.desc}
                    className={`group flex min-h-[88px] w-[190px] shrink-0 flex-col justify-between rounded-lg border p-3 text-left transition-colors ${
                      active
                        ? 'border-cyan-500/45 bg-cyan-500/15'
                        : 'border-white/10 bg-slate-900/35 hover:border-cyan-500/25 hover:bg-white/5'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-100">
                      <Icon className="h-4 w-4 shrink-0 text-cyan-300" />
                      <span className="min-w-0 truncate">{templateItem.label}</span>
                    </span>
                    <span className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{templateItem.desc}</span>
                    {recommended && (
                      <span className="mt-2 w-fit rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300">
                        {copy.guided}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="glass-panel overflow-hidden rounded-xl">
            <div className="border-b border-white/10 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
                    <SelectedIcon className="h-5 w-5 shrink-0 text-cyan-300" />
                    <span className="min-w-0 truncate">{selectedTemplate.label}</span>
                  </h3>
                  <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-400">{selectedTemplate.desc}</p>
                </div>
              </div>

              {showSlotBuilder && (
                <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.85fr)]">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {slotItems.map((slot) => {
                      const field = resolvedSlots[slot.id];
                      return (
                        <div
                          key={slot.id}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => handleDrop(event, slot.id)}
                          className="min-h-[74px] rounded-lg border border-dashed border-cyan-500/25 bg-cyan-500/5 p-3"
                        >
                          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-cyan-300">{slot.label}</div>
                          <div className="truncate text-sm font-medium text-slate-100">{field ? fieldLabel(field) : copy.dropField}</div>
                          <div className="truncate text-[11px] text-slate-500">{field?.fid || '--'}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      { label: copy.fields, rows: dimensions },
                      { label: copy.measure, rows: measures },
                    ].map((group) => (
                      <div key={group.label} className="min-w-0">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{group.label}</div>
                        <div className="eda-field-scroll grid max-h-36 grid-cols-2 gap-2 overflow-y-auto pr-1">
                          {group.rows.map((field) => (
                            <button
                              key={field.fid}
                              type="button"
                              draggable
                              onDragStart={(event) => event.dataTransfer.setData('text/plain', field.fid)}
                              onClick={() => assignField(field)}
                              className="rounded-lg border border-white/10 bg-slate-900/40 px-3 py-2 text-left text-xs text-slate-300 transition-colors hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-100"
                            >
                              <span className="block truncate font-medium">{fieldLabel(field)}</span>
                              <span className="block truncate text-[10px] text-slate-500">{field.fid}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="eda-chart-frame h-[min(660px,calc(100vh-210px))] min-h-[460px] p-3">
              {payload.rows.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">{copy.noData}</div>
              ) : (
                <ReactECharts option={option} style={{ height: '100%', width: '100%' }} notMerge />
              )}
            </div>
          </section>
        </div>
      )}

      {!loading && payload && mode === 'drag' && (
        <div className="space-y-3">
          <div className="glass-panel rounded-xl border-cyan-500/20 bg-cyan-500/10 p-4 text-sm leading-6 text-cyan-100">
            <GitBranch className="mr-2 inline h-4 w-4" />
            {copy.builderHint}
          </div>
          <div className={`nexus-gwalker glass-panel h-[min(820px,calc(100vh-180px))] min-h-[560px] overflow-auto rounded-xl ${
            theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-950'
          }`}>
            <GraphicWalker
              data={payload.rows}
              fields={payload.fields}
              i18nLang={language === 'zh' ? 'zh-CN' : 'en-US'}
              appearance={theme === 'dark' ? 'dark' : 'light'}
              hideProfiling={false}
              style={{ minHeight: 760 }}
            />
          </div>
        </div>
      )}

      {!loading && payload && mode === 'fields' && (
        <div className="glass-panel overflow-hidden rounded-xl">
          <div className="grid grid-cols-1 border-b border-white/10 bg-slate-900/30 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 md:grid-cols-[1fr_1fr_1fr_2fr]">
            <div>FID</div>
            <div>{copy.fields}</div>
            <div>Type</div>
            <div>Description</div>
          </div>
          <div className="divide-y divide-white/5">
            {payload.fields.map((field) => (
              <div key={field.fid} className="grid grid-cols-1 gap-1 px-4 py-3 text-sm md:grid-cols-[1fr_1fr_1fr_2fr]">
                <div className="font-mono text-cyan-300">{field.fid}</div>
                <div className="text-slate-100">{field.name}</div>
                <div className="text-slate-400">{field.semanticType} / {field.analyticType}</div>
                <div className="text-slate-400">{field.description || '--'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getChartOption(chartId: ChartId, data: ReturnType<typeof buildChartData>, copy: typeof chartText.zh, theme: 'dark' | 'light') {
  const base = baseChart(theme);

  if (chartId === 'routeMap') {
    const maxCount = Math.max(...data.destinationMap.map((item) => item.count), 1);
    return {
      ...base,
      tooltip: {
        ...base.tooltip,
        formatter: (params: any) => {
          if (params.seriesType === 'lines') {
            const item = params.data;
            return `${item.name}<br/>${copy.flightCount}: ${item.value.toLocaleString()}<br/>${copy.avgArr}: ${item.avgDelay} ${copy.minutes}`;
          }
          const item = params.data;
          if (params.seriesName === copy.routes) {
            return `${item[4]}<br/>${copy.flightCount}: ${item[2].toLocaleString()}`;
          }
          return `${item[4]}<br/>${copy.flightCount}: ${item[2].toLocaleString()}<br/>${copy.avgArr}: ${item[3]} ${copy.minutes}`;
        },
      },
      grid: { left: 36, right: 24, top: 36, bottom: 36 },
      xAxis: { ...base.xAxis, type: 'value', min: -126, max: -66, name: 'lon' },
      yAxis: { ...base.yAxis, type: 'value', min: 24, max: 50, name: 'lat' },
      visualMap: {
        min: 0,
        max: 40,
        dimension: 3,
        seriesIndex: 1,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        inRange: { color: ['#10b981', '#f59e0b', '#ef4444'] },
        textStyle: { color: theme === 'dark' ? '#94a3b8' : '#475569' },
      },
      series: [
        {
          name: copy.routes,
          type: 'lines',
          coordinateSystem: 'cartesian2d',
          data: data.routeFlow.slice(0, 90).map((item) => ({
            name: item.route,
            coords: item.coords,
            value: item.count,
            avgDelay: item.avgDelay,
          })),
          lineStyle: { color: 'rgba(34, 211, 238, 0.28)', width: 1, curveness: 0.16 },
          effect: { show: true, symbol: 'arrow', symbolSize: 5, color: '#22d3ee', trailLength: 0.18 },
          zlevel: 1,
        },
        {
          name: copy.map,
          type: 'scatter',
          data: data.destinationMap.map((item) => [item.lon, item.lat, item.count, item.avgDelay, `${item.dest} ${item.name}`]),
          symbolSize: (value: any[]) => clamp(Math.sqrt(value[2] / maxCount) * 48, 8, 48),
          itemStyle: { opacity: 0.78, borderColor: '#ffffff', borderWidth: 1 },
          zlevel: 2,
        },
        {
          name: copy.routes,
          type: 'effectScatter',
          data: data.originMap.map((item) => [item.lon, item.lat, item.count, 0, `${item.origin} ${item.name}`]),
          symbolSize: 12,
          rippleEffect: { scale: 3 },
          itemStyle: { color: '#f59e0b' },
          zlevel: 3,
        },
      ],
    };
  }

  if (chartId === 'hourLine') {
    return {
      ...base,
      tooltip: { ...base.tooltip, trigger: 'axis' },
      legend: { ...base.legend, data: [copy.avgDep, copy.avgArr] },
      xAxis: { ...base.xAxis, type: 'category', boundaryGap: false, data: data.hourly.map((item) => `${item.hour}:00`) },
      yAxis: { ...base.yAxis, type: 'value', name: copy.minutes },
      series: [
        {
          name: copy.avgDep,
          type: 'line',
          smooth: true,
          symbol: 'circle',
          data: data.hourly.map((item) => item.avgDep),
          lineStyle: { color: '#22d3ee', width: 3 },
          itemStyle: { color: '#22d3ee' },
          areaStyle: { color: 'rgba(34, 211, 238, 0.12)' },
        },
        {
          name: copy.avgArr,
          type: 'line',
          smooth: true,
          symbol: 'circle',
          data: data.hourly.map((item) => item.avgArr),
          lineStyle: { color: '#a78bfa', width: 3 },
          itemStyle: { color: '#a78bfa' },
        },
      ],
    };
  }

  if (chartId === 'monthLine') {
    return {
      ...base,
      tooltip: { ...base.tooltip, trigger: 'axis' },
      legend: { ...base.legend, data: [copy.avgDep, copy.flightCount] },
      xAxis: { ...base.xAxis, type: 'category', data: data.monthly.map((item) => `${item.month}`) },
      yAxis: [
        { ...base.yAxis, type: 'value', name: copy.minutes },
        { ...base.yAxis, type: 'value', name: copy.flightCount, splitLine: { show: false } },
      ],
      series: [
        {
          name: copy.avgDep,
          type: 'line',
          smooth: true,
          yAxisIndex: 0,
          data: data.monthly.map((item) => item.avgDep),
          lineStyle: { color: '#f59e0b', width: 3 },
          itemStyle: { color: '#f59e0b' },
          areaStyle: { color: 'rgba(245, 158, 11, 0.14)' },
        },
        {
          name: copy.flightCount,
          type: 'bar',
          yAxisIndex: 1,
          data: data.monthly.map((item) => item.count),
          itemStyle: { color: 'rgba(34, 211, 238, 0.35)', borderRadius: [4, 4, 0, 0] },
        },
      ],
    };
  }

  if (chartId === 'scatter') {
    return {
      ...base,
      tooltip: {
        ...base.tooltip,
        formatter: (params: any) =>
          `${params.data[4]}<br/>${copy.distance}: ${params.data[0]} ${copy.miles}<br/>${copy.avgArr}: ${params.data[1]} ${copy.minutes}`,
      },
      xAxis: { ...base.xAxis, type: 'value', name: `${copy.distance} (${copy.miles})` },
      yAxis: { ...base.yAxis, type: 'value', name: `${copy.delay} (${copy.minutes})` },
      visualMap: {
        min: -20,
        max: 80,
        dimension: 1,
        right: 8,
        top: 54,
        inRange: { color: ['#10b981', '#22d3ee', '#f59e0b', '#ef4444'] },
        textStyle: { color: theme === 'dark' ? '#94a3b8' : '#475569' },
      },
      series: [{
        type: 'scatter',
        data: data.scatter,
        symbolSize: 7,
        itemStyle: { opacity: 0.54 },
      }],
    };
  }

  if (chartId === 'box') {
    return {
      ...base,
      tooltip: { ...base.tooltip, trigger: 'item' },
      xAxis: { ...base.xAxis, type: 'category', data: data.box.map((item) => item.carrier) },
      yAxis: { ...base.yAxis, type: 'value', name: `${copy.delay} (${copy.minutes})` },
      series: [{
        type: 'boxplot',
        data: data.box.map((item) => item.summary),
        itemStyle: { color: 'rgba(34, 211, 238, 0.25)', borderColor: '#22d3ee' },
      }],
    };
  }

  if (chartId === 'raincloud') {
    return {
      ...base,
      tooltip: { ...base.tooltip, trigger: 'item' },
      xAxis: { ...base.xAxis, type: 'category', data: data.box.map((item) => item.carrier) },
      yAxis: { ...base.yAxis, type: 'value', name: `${copy.delay} (${copy.minutes})` },
      series: [
        {
          type: 'boxplot',
          data: data.box.map((item) => item.summary),
          itemStyle: { color: 'rgba(167, 139, 250, 0.22)', borderColor: '#a78bfa' },
        },
        {
          type: 'scatter',
          data: data.rain,
          symbolSize: 4,
          itemStyle: { color: 'rgba(34, 211, 238, 0.36)' },
        },
      ],
    };
  }

  if (chartId === 'ridge') {
    return {
      ...base,
      tooltip: { ...base.tooltip, trigger: 'axis' },
      xAxis: { ...base.xAxis, type: 'value', name: `${copy.delay} (${copy.minutes})`, min: -30, max: 120 },
      yAxis: {
        ...base.yAxis,
        type: 'value',
        min: -0.2,
        max: Math.max(data.ridge.length - 0.1, 1),
        interval: 1,
        axisLabel: {
          color: theme === 'dark' ? '#94a3b8' : '#475569',
          formatter: (value: number) => data.ridge[value]?.carrier || '',
        },
      },
      series: data.ridge.map((item, index) => ({
        name: item.carrier,
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: item.points,
        lineStyle: { color: ['#22d3ee', '#a78bfa', '#f59e0b', '#10b981', '#ef4444', '#60a5fa'][index % 6], width: 2 },
        areaStyle: { opacity: 0.18 },
      })),
    };
  }

  if (chartId === 'waffle') {
    const waffle = buildWaffleData(data.bucketCounts);
    const names: Record<string, string> = {
      onTime: copy.onTime,
      light: copy.light,
      moderate: copy.moderate,
      severe: copy.severe,
    };
    return {
      ...base,
      tooltip: {
        ...base.tooltip,
        formatter: (params: any) => names[params.data[2]],
      },
      xAxis: { show: false, type: 'value', min: -0.5, max: 9.5 },
      yAxis: { show: false, type: 'value', min: -0.5, max: 9.5 },
      legend: {
        ...base.legend,
        data: Object.values(names),
        bottom: 0,
        top: undefined,
      },
      series: Object.entries(names).map(([bucket, name]) => ({
        name,
        type: 'scatter',
        symbol: 'rect',
        symbolSize: 28,
        data: waffle.cells.filter((cell) => cell[2] === bucket),
        itemStyle: { color: delayColors[bucket as keyof typeof delayColors], borderRadius: 3 },
      })),
    };
  }

  if (chartId === 'delayHistogram') {
    return {
      ...base,
      tooltip: { ...base.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: {
        ...base.xAxis,
        type: 'category',
        data: data.delayHistogram.map((item) => `${item.start}-${item.end}`),
        axisLabel: { color: theme === 'dark' ? '#94a3b8' : '#475569', rotate: 35 },
      },
      yAxis: { ...base.yAxis, type: 'value', name: copy.flightCount },
      series: [{
        name: copy.flightCount,
        type: 'bar',
        data: data.delayHistogram.map((item) => item.count),
        itemStyle: {
          color: (params: any) => {
            const bin = data.delayHistogram[params.dataIndex];
            if (bin.start <= 0) return 'rgba(16, 185, 129, 0.72)';
            if (bin.start <= 15) return 'rgba(34, 211, 238, 0.72)';
            if (bin.start <= 60) return 'rgba(245, 158, 11, 0.78)';
            return 'rgba(239, 68, 68, 0.78)';
          },
          borderRadius: [3, 3, 0, 0],
        },
      }],
    };
  }

  if (chartId === 'weekdayHeatmap') {
    const weekdays = copy.weekday === '星期'
      ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return {
      ...base,
      tooltip: {
        ...base.tooltip,
        formatter: (params: any) => {
          const item = params.data;
          return `${weekdays[item[1]]} ${item[0]}:00<br/>${copy.avgDep}: ${item[2]} ${copy.minutes}<br/>${copy.flightCount}: ${item[3].toLocaleString()}`;
        },
      },
      grid: { left: 64, right: 32, top: 54, bottom: 72 },
      xAxis: { ...base.xAxis, type: 'category', name: copy.hour, data: Array.from({ length: 24 }, (_, index) => `${index}`) },
      yAxis: { ...base.yAxis, type: 'category', name: copy.weekday, data: weekdays },
      visualMap: {
        min: 0,
        max: 50,
        dimension: 2,
        orient: 'horizontal',
        left: 'center',
        bottom: 8,
        inRange: { color: ['#10b981', '#fbbf24', '#ef4444'] },
        textStyle: { color: theme === 'dark' ? '#94a3b8' : '#475569' },
      },
      series: [{
        type: 'heatmap',
        data: data.weekdayHeatmap.map((item) => [item.hour, item.weekday - 1, item.avgDelay, item.count]),
        itemStyle: { borderColor: theme === 'dark' ? '#020617' : '#f8fafc', borderWidth: 2, borderRadius: 2 },
      }],
    };
  }

  if (chartId === 'routeFlow') {
    const nodeMap = new Map<string, { name: string; value: number; category: number }>();
    const links = data.routeFlow.slice(0, 120).map((item) => {
      const originValue = nodeMap.get(item.origin)?.value || 0;
      const destValue = nodeMap.get(item.dest)?.value || 0;
      nodeMap.set(item.origin, { name: item.origin, value: originValue + item.count, category: 0 });
      nodeMap.set(item.dest, { name: item.dest, value: destValue + item.count, category: 1 });
      return { source: item.origin, target: item.dest, value: item.count, lineStyle: { width: clamp(Math.sqrt(item.count) / 18, 1, 8) } };
    });
    return {
      ...base,
      tooltip: {
        ...base.tooltip,
        formatter: (params: any) => {
          if (params.dataType === 'edge') return `${params.data.source} -> ${params.data.target}<br/>${copy.flightCount}: ${params.data.value.toLocaleString()}`;
          return `${params.name}<br/>${copy.flightCount}: ${params.value?.toLocaleString?.() || '--'}`;
        },
      },
      legend: { ...base.legend, data: ['NYC', copy.routes] },
      xAxis: undefined,
      yAxis: undefined,
      series: [{
        type: 'graph',
        layout: 'force',
        roam: true,
        categories: [{ name: 'NYC' }, { name: copy.routes }],
        data: Array.from(nodeMap.values()).map((node) => ({
          ...node,
          symbolSize: clamp(Math.sqrt(node.value) / 10, 12, 56),
          itemStyle: { color: node.category === 0 ? '#f59e0b' : '#22d3ee' },
        })),
        links,
        force: { repulsion: 260, edgeLength: [60, 180] },
        edgeSymbol: ['none', 'arrow'],
        lineStyle: { color: 'rgba(148, 163, 184, 0.36)', curveness: 0.18 },
        label: { show: true, color: theme === 'dark' ? '#cbd5e1' : '#334155' },
      }],
    };
  }

  if (chartId === 'airlineTreemap') {
    return {
      ...base,
      tooltip: {
        ...base.tooltip,
        formatter: (params: any) => `${params.name}<br/>${copy.flightCount}: ${params.value.toLocaleString()}<br/>${copy.avgDep}: ${params.data.avgDep} ${copy.minutes}`,
      },
      xAxis: undefined,
      yAxis: undefined,
      series: [{
        type: 'treemap',
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        label: { color: '#ffffff', formatter: '{b}' },
        upperLabel: { show: false },
        itemStyle: { borderColor: theme === 'dark' ? '#020617' : '#f8fafc', borderWidth: 2, gapWidth: 2 },
        data: data.airlineTreemap.map((item) => ({
          name: item.name,
          value: item.value,
          avgDep: item.avgDep,
          itemStyle: {
            color: item.avgDep <= 5 ? '#10b981' : item.avgDep <= 15 ? '#22d3ee' : item.avgDep <= 30 ? '#f59e0b' : '#ef4444',
          },
        })),
      }],
    };
  }

  if (chartId === 'delayStack') {
    const buckets = [
      ['onTime', copy.onTime, delayColors.onTime],
      ['light', copy.light, delayColors.light],
      ['moderate', copy.moderate, delayColors.moderate],
      ['severe', copy.severe, delayColors.severe],
    ] as const;
    const carriers = data.delayStack.map((item) => item.carrier);
    return {
      ...base,
      tooltip: { ...base.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { ...base.legend, data: buckets.map((item) => item[1]) },
      xAxis: { ...base.xAxis, type: 'category', data: carriers },
      yAxis: { ...base.yAxis, type: 'value', name: `${copy.share} (%)`, max: 100 },
      series: buckets.map(([key, name, color]) => ({
        name,
        type: 'bar',
        stack: 'delay',
        data: data.delayStack.map((item) => item.count ? round((item[key] / item.count) * 100) : 0),
        itemStyle: { color },
      })),
    };
  }

  return {
    ...base,
    tooltip: { ...base.tooltip, trigger: 'axis' },
    legend: { ...base.legend, data: [copy.flightCount, copy.avgDep, copy.onTimeRate] },
    xAxis: { ...base.xAxis, type: 'category', data: data.airlineBars.map((item) => item.carrier) },
    yAxis: [
      { ...base.yAxis, type: 'value', name: copy.flightCount },
      { ...base.yAxis, type: 'value', name: `${copy.minutes} / %`, splitLine: { show: false } },
    ],
    series: [
      {
        name: copy.flightCount,
        type: 'bar',
        data: data.airlineBars.map((item) => item.count),
        itemStyle: { color: 'rgba(34, 211, 238, 0.45)', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: copy.avgDep,
        type: 'line',
        yAxisIndex: 1,
        data: data.airlineBars.map((item) => item.avgDep),
        lineStyle: { color: '#f59e0b', width: 3 },
        itemStyle: { color: '#f59e0b' },
      },
      {
        name: copy.onTimeRate,
        type: 'line',
        yAxisIndex: 1,
        data: data.airlineBars.map((item) => item.onTimeRate),
        lineStyle: { color: '#10b981', width: 3 },
        itemStyle: { color: '#10b981' },
      },
    ],
  };
}
