import React, { useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import usTopologyUrl from 'vega-webgl-renderer/docs/data/us-10m.json?url';
import { feature } from 'topojson-client';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle,
  CloudRain,
  Clock,
  FileText,
  GitBranch,
  MapPin,
  Navigation,
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

type WeekdaySelection = 'all' | 1 | 2 | 3 | 4 | 5 | 6 | 7;

const WEEKDAY_OPTIONS: Array<{ value: WeekdaySelection; zh: string; en: string }> = [
  { value: 'all', zh: '全部', en: 'All' },
  { value: 1, zh: '周一', en: 'Mon' },
  { value: 2, zh: '周二', en: 'Tue' },
  { value: 3, zh: '周三', en: 'Wed' },
  { value: 4, zh: '周四', en: 'Thu' },
  { value: 5, zh: '周五', en: 'Fri' },
  { value: 6, zh: '周六', en: 'Sat' },
  { value: 7, zh: '周日', en: 'Sun' },
];

const OPERATING_START_HOUR = 5;
const OPERATING_END_HOUR = 23;
const OPERATING_HOURS = Array.from(
  { length: OPERATING_END_HOUR - OPERATING_START_HOUR + 1 },
  (_, index) => OPERATING_START_HOUR + index,
);
const US_MAP_NAME = 'nexus-usa-contiguous';
const NON_CONTIGUOUS_STATE_IDS = new Set(['02', '15', '60', '66', '69', '72', '78']);
let usMapLoadPromise: Promise<void> | null = null;
let usMapRegistered = false;

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function numeric(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumber(value: unknown) {
  const parsed = numeric(value);
  if (parsed === null) return '--';
  return parsed.toLocaleString();
}

function formatDecimal(value: unknown, digits = 1) {
  const parsed = numeric(value);
  if (parsed === null) return '--';
  return parsed.toFixed(digits).replace(/\.0$/, '');
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeStateId(id: unknown) {
  return String(id ?? '').padStart(2, '0');
}

async function ensureUsMapRegistered() {
  if (usMapRegistered) return;
  if (!usMapLoadPromise) {
    usMapLoadPromise = fetch(usTopologyUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`US map data failed to load: ${response.status}`);
        return response.json();
      })
      .then((topology) => {
        const states = feature(topology, topology.objects.states) as any;
        const contiguousStates = {
          ...states,
          features: states.features
            .filter((item: any) => !NON_CONTIGUOUS_STATE_IDS.has(normalizeStateId(item.id ?? item.properties?.id)))
            .map((item: any) => ({
              ...item,
              properties: {
                ...item.properties,
                name: item.properties?.name || `state-${normalizeStateId(item.id)}`,
              },
            })),
        };
        echarts.registerMap(US_MAP_NAME, contiguousStates);
        usMapRegistered = true;
      })
      .catch((error) => {
        usMapLoadPromise = null;
        throw error;
      });
  }
  await usMapLoadPromise;
}

function airportCode(row: any) {
  return row.faa || row.dest || row.origin || row.iata || row.code;
}

function routeDelayColor(avgDelay: number) {
  if (avgDelay >= 30) return '#ef4444';
  if (avgDelay >= 18) return '#f59e0b';
  return '#22d3ee';
}

function pointPayload(data: any) {
  return Array.isArray(data) ? data : data?.value || [];
}

function originLabelPosition(code: string) {
  if (code === 'JFK') return 'bottom';
  if (code === 'LGA') return 'top';
  return 'right';
}

function originLabelOffset(code: string): [number, number] {
  if (code === 'JFK') return [0, 10];
  if (code === 'LGA') return [0, -10];
  return [8, 0];
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

function percentile(values: number[], ratio: number) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))];
}

function median(values: number[]) {
  return percentile(values, 0.5);
}

function weekdayLabel(index: unknown, language: 'zh' | 'en') {
  const labels = language === 'zh'
    ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const parsed = Number(index);
  return labels[parsed - 1] || '--';
}

function fillHourlyRows(rows: any[]) {
  const byHour = new Map(rows.map((row) => [Number(row.hour), row]));
  return OPERATING_HOURS.map((hour) => ({
    hour,
    ...(byHour.get(hour) || {}),
  }));
}

function rowsForWeekday(
  selectedWeekday: WeekdaySelection,
  hourlyRows: any[],
  weekdayHourlyRows: any[],
  weekdayHeatmapRows: any[],
) {
  if (selectedWeekday === 'all') return fillHourlyRows(hourlyRows);

  const exactRows = weekdayHourlyRows.filter((row) => Number(row.weekday) === selectedWeekday);
  if (exactRows.length) return fillHourlyRows(exactRows);

  const fallbackRows = weekdayHeatmapRows
    .filter((row) => Number(row.weekday) === selectedWeekday)
    .map((row) => ({
      ...row,
      avgDepDelay: row.avgDelay,
      avgArrDelay: null,
    }));
  return fillHourlyRows(fallbackRows);
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
      backgroundColor: dark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.96)',
      borderColor: dark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(15, 23, 42, 0.12)',
      textStyle: { color: text },
    },
    legend: { top: 0, textStyle: { color: muted } },
    grid: { left: 54, right: 34, top: 56, bottom: 42, containLabel: true },
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

function buildHourlyRecoveryOption(rows: any[], copy: any, theme: 'dark' | 'light') {
  const base = chartBase(theme);
  const hours = rows.map((row) => `${Number(row.hour)}:00`);
  const depValues = rows.map((row) => numeric(row.avgDepDelay));
  const arrValues = rows.map((row) => numeric(row.avgArrDelay));
  const recoveryValues = rows.map((row, index) => {
    const explicit = numeric(row.recoveryMinutes);
    if (explicit !== null) return explicit;
    const dep = depValues[index];
    const arr = arrValues[index];
    return dep !== null && arr !== null ? Number((dep - arr).toFixed(1)) : null;
  });
  const severeValues = rows.map((row) => numeric(row.severeDelayRate));

  return {
    ...base,
    tooltip: {
      ...base.tooltip,
      trigger: 'axis',
      formatter: (params: any[]) => {
        const row = rows[params?.[0]?.dataIndex || 0] || {};
        const lines = params.map((item) => {
          const value = item.value === null || item.value === undefined ? '--' : formatDecimal(item.value);
          const suffix = item.seriesName === copy.severeRate ? '%' : ` ${copy.minute}`;
          return `${item.marker}${item.seriesName}: ${value}${suffix}`;
        });
        return [
          `<strong>${Number(row.hour)}:00</strong>`,
          `${copy.flightCount}: ${formatNumber(row.flightCount)}`,
          ...lines,
        ].join('<br/>');
      },
    },
    legend: { ...base.legend, data: [copy.depDelay, copy.arrDelay, copy.recovery, copy.severeRate] },
    xAxis: { ...base.xAxis, type: 'category', boundaryGap: false, data: hours },
    yAxis: [
      { ...base.yAxis, type: 'value', name: copy.minute },
      { ...base.yAxis, type: 'value', name: '%', splitLine: { show: false } },
    ],
    series: [
      {
        name: copy.depDelay,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        data: depValues,
        lineStyle: { color: '#22d3ee', width: 3 },
        itemStyle: { color: '#22d3ee' },
        areaStyle: { color: 'rgba(34, 211, 238, 0.12)' },
      },
      {
        name: copy.arrDelay,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        data: arrValues,
        lineStyle: { color: '#a78bfa', width: 3 },
        itemStyle: { color: '#a78bfa' },
      },
      {
        name: copy.recovery,
        type: 'bar',
        data: recoveryValues,
        barWidth: 10,
        itemStyle: {
          color: (params: any) => Number(params.value) >= 0 ? 'rgba(16, 185, 129, 0.48)' : 'rgba(239, 68, 68, 0.48)',
          borderRadius: [4, 4, 0, 0],
        },
      },
      {
        name: copy.severeRate,
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'none',
        data: severeValues,
        lineStyle: { color: '#f59e0b', width: 2, type: 'dashed' },
        itemStyle: { color: '#f59e0b' },
      },
    ],
  };
}

function buildWeekdayHeatmapOption(rows: any[], copy: any, language: 'zh' | 'en', theme: 'dark' | 'light') {
  const base = chartBase(theme);
  const hours = OPERATING_HOURS;
  const labels = Array.from({ length: 7 }, (_, index) => weekdayLabel(index + 1, language));
  const operatingRows = rows.filter((row) => {
    const hour = Number(row.hour);
    return hour >= OPERATING_START_HOUR && hour <= OPERATING_END_HOUR;
  });
  const values = operatingRows.map((row) => Number(row.avgDelay ?? row.avgDepDelay ?? 0)).filter(Number.isFinite);
  const maxValue = clamp(percentile(values, 0.92) * 1.15 || 30, 20, 80);

  const data = operatingRows.map((row) => [
    OPERATING_HOURS.indexOf(Number(row.hour)),
    Number(row.weekday) - 1,
    Number(row.avgDelay ?? row.avgDepDelay ?? 0),
    row,
  ]).filter((item) => item[0] >= 0 && item[1] >= 0 && item[1] <= 6);

  return {
    ...base,
    grid: { left: 62, right: 28, top: 34, bottom: 78, containLabel: false },
    tooltip: {
      ...base.tooltip,
      position: 'top',
      formatter: (params: any) => {
        const row = params.data?.[3] || {};
        const weekday = weekdayLabel(row.weekday, language);
        return [
          `<strong>${weekday} ${row.hour}:00</strong>`,
          `${copy.avgDelay}: ${formatDecimal(params.data?.[2])} ${copy.minute}`,
          `${copy.flightCount}: ${formatNumber(row.flightCount)}`,
          `${copy.severeRate}: ${formatDecimal(row.severeDelayRate)}%`,
        ].join('<br/>');
      },
    },
    xAxis: {
      ...base.xAxis,
      type: 'category',
      data: hours.map((hour) => `${hour}:00`),
      axisLabel: { ...base.xAxis.axisLabel, interval: 1, formatter: (value: string) => value.replace(':00', '') },
      splitArea: { show: true },
    },
    yAxis: {
      ...base.yAxis,
      type: 'category',
      data: labels,
      splitArea: { show: true },
    },
    visualMap: {
      min: 0,
      max: maxValue,
      dimension: 2,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 12,
      inRange: { color: ['#10b981', '#facc15', '#fb923c', '#ef4444'] },
      text: [copy.highRisk, copy.lowRisk],
      textStyle: { color: theme === 'dark' ? '#94a3b8' : '#475569' },
    },
    series: [{
      name: copy.avgDelay,
      type: 'heatmap',
      data,
      emphasis: {
        itemStyle: {
          borderColor: '#38bdf8',
          borderWidth: 2,
          shadowBlur: 12,
          shadowColor: 'rgba(0, 0, 0, 0.35)',
        },
      },
      itemStyle: {
        borderColor: theme === 'dark' ? '#0f172a' : '#f8fafc',
        borderWidth: 2,
        borderRadius: 2,
      },
    }],
  };
}

function buildDestinationScatterOption(rows: any[], copy: any, theme: 'dark' | 'light') {
  const base = chartBase(theme);
  const data = rows
    .filter((row) => Number(row.flightCount) > 0)
    .map((row) => [
      Number(row.flightCount || 0),
      Number(row.avgArrDelay ?? row.avgDepDelay ?? 0),
      row.dest || row.arrivalAirport || '--',
      Number(row.severeDelayRate || 0),
      Number(row.avgDistance || 0),
      row.dest_name || row.arrivalAirportName || '',
    ]);
  const xValues = data.map((item) => Number(item[0]));
  const yValues = data.map((item) => Number(item[1]));
  const distanceValues = data.map((item) => Number(item[4]));
  const maxDistance = Math.max(...distanceValues, 1);
  const medianFlightCount = median(xValues);
  const medianArrDelay = median(yValues);
  const xMax = Math.ceil(Math.max(...xValues, 1) * 1.1);
  const yMin = Math.floor(Math.min(0, ...yValues) - 3);
  const yMax = Math.ceil(Math.max(...yValues, 1) + 6);

  return {
    ...base,
    tooltip: {
      ...base.tooltip,
      trigger: 'item',
      formatter: (params: any) => [
        `<strong>${params.data[2]} ${params.data[5] || ''}</strong>`,
        `${copy.flightCount}: ${formatNumber(params.data[0])}`,
        `${copy.avgArrDelay}: ${formatDecimal(params.data[1])} ${copy.minute}`,
        `${copy.severeRate}: ${formatDecimal(params.data[3])}%`,
        `${copy.distance}: ${formatNumber(params.data[4])} ${copy.mile}`,
      ].join('<br/>'),
    },
    grid: { left: 70, right: 48, top: 40, bottom: 112, containLabel: true },
    xAxis: { ...base.xAxis, type: 'value', name: copy.flightCount, min: 0, max: xMax },
    yAxis: { ...base.yAxis, type: 'value', name: copy.avgArrDelay, min: yMin, max: yMax },
    visualMap: {
      min: 0,
      max: Math.max(...data.map((item) => Number(item[3])), 1),
      dimension: 3,
      orient: 'horizontal',
      left: 'center',
      bottom: 42,
      inRange: { color: ['#10b981', '#f59e0b', '#ef4444'] },
      textStyle: { color: theme === 'dark' ? '#94a3b8' : '#475569' },
    },
    dataZoom: [
      { type: 'inside', xAxisIndex: 0, filterMode: 'none' },
      {
        type: 'slider',
        xAxisIndex: 0,
        bottom: 10,
        height: 18,
        borderColor: theme === 'dark' ? '#334155' : '#cbd5e1',
        fillerColor: 'rgba(34, 211, 238, 0.18)',
        handleStyle: { color: '#22d3ee' },
        textStyle: { color: theme === 'dark' ? '#94a3b8' : '#475569' },
      },
    ],
    series: [{
      type: 'scatter',
      data,
      clip: false,
      symbolSize: (value: any[]) => clamp(Math.sqrt(Number(value[4] || 0) / maxDistance) * 42, 8, 42),
      itemStyle: { opacity: 0.8, borderColor: '#ffffff', borderWidth: 1 },
      emphasis: {
        label: {
          show: true,
          formatter: (params: any) => params.data[2],
          color: theme === 'dark' ? '#f8fafc' : '#0f172a',
          fontWeight: 700,
        },
      },
      markLine: {
        symbol: 'none',
        silent: true,
        lineStyle: { color: theme === 'dark' ? '#64748b' : '#94a3b8', type: 'dashed', width: 1 },
        label: {
          color: theme === 'dark' ? '#cbd5e1' : '#334155',
          formatter: (params: any) => params.name,
        },
        data: [
          { name: copy.medianVolume, xAxis: medianFlightCount },
          { name: copy.medianDelay, yAxis: medianArrDelay },
        ],
      },
    }],
  };
}

function buildRouteMapOption(
  routeRows: any[],
  originGeo: any[],
  destGeo: any[],
  airportGeo: any[],
  copy: any,
  theme: 'dark' | 'light',
  isMapReady: boolean,
) {
  const base = chartBase(theme);
  const originByCode = new Map<string, any>();
  const destByCode = new Map<string, any>();

  airportGeo.forEach((row) => {
    const code = airportCode(row);
    if (!code) return;
    const lon = Number(row.lon);
    const lat = Number(row.lat);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return;
    const normalized = String(code);
    originByCode.set(normalized, {
      origin: normalized,
      origin_name: row.name || normalized,
      origin_lon: lon,
      origin_lat: lat,
      flightCount: row.flight_count,
    });
    destByCode.set(normalized, {
      dest: normalized,
      dest_name: row.name || normalized,
      dest_lon: lon,
      dest_lat: lat,
      flightCount: row.flight_count,
      avgArrDelay: row.avg_delay,
    });
  });

  originGeo.forEach((row) => {
    if (!row.origin) return;
    originByCode.set(row.origin, row);
  });
  destGeo.forEach((row) => {
    if (!row.dest) return;
    destByCode.set(row.dest, row);
  });

  const sortedRoutes = [...routeRows]
    .filter((row) => row.origin && row.dest)
    .sort((a, b) => Number(b.avgArrDelay ?? b.avgDepDelay ?? 0) - Number(a.avgArrDelay ?? a.avgDepDelay ?? 0))
    .slice(0, 80);

  const routeLines = sortedRoutes.map((row) => {
    const origin = originByCode.get(row.origin);
    const dest = destByCode.get(row.dest);
    if (!origin || !dest) return null;
    return {
      name: `${row.origin} -> ${row.dest}`,
      coords: [
        [Number(origin.origin_lon), Number(origin.origin_lat)],
        [Number(dest.dest_lon), Number(dest.dest_lat)],
      ],
      value: Number(row.flightCount || 0),
      avgDelay: Number(row.avgArrDelay ?? row.avgDepDelay ?? 0),
      severeRate: Number(row.severeDelayRate || 0),
      origin: row.origin,
      dest: row.dest,
    };
  }).filter(Boolean) as any[];

  const destinationMap = new Map<string, any>();
  routeLines.forEach((line) => {
    const geo = destByCode.get(line.dest);
    if (!geo) return;
    const current = destinationMap.get(line.dest) || {
      dest: line.dest,
      name: geo.dest_name,
      lon: Number(geo.dest_lon),
      lat: Number(geo.dest_lat),
      count: 0,
      weightedDelay: 0,
      weightedSevereRate: 0,
    };
    current.count += line.value;
    current.weightedDelay += line.avgDelay * line.value;
    current.weightedSevereRate += line.severeRate * line.value;
    destinationMap.set(line.dest, current);
  });

  const destinationPoints = Array.from(destinationMap.values()).map((item) => ({
    ...item,
    avgDelay: item.count ? Number((item.weightedDelay / item.count).toFixed(1)) : 0,
    avgSevereRate: item.count ? Number((item.weightedSevereRate / item.count).toFixed(1)) : 0,
  }));
  const highRiskPoints = [...destinationPoints]
    .filter((item) => item.avgDelay >= 18 || item.avgSevereRate >= 18)
    .sort((a, b) => (
      Number(b.avgDelay || 0) - Number(a.avgDelay || 0)
      || Number(b.avgSevereRate || 0) - Number(a.avgSevereRate || 0)
      || Number(b.count || 0) - Number(a.count || 0)
    ))
    .slice(0, 6);
  const maxRouteCount = Math.max(...routeLines.map((item) => Number(item.value || 0)), 1);
  const maxDestCount = Math.max(...destinationPoints.map((item) => Number(item.count || 0)), 1);
  const dark = theme === 'dark';
  const mapFill = dark ? 'rgba(15, 23, 42, 0.66)' : 'rgba(226, 242, 254, 0.9)';
  const mapBorder = dark ? 'rgba(148, 163, 184, 0.36)' : 'rgba(15, 23, 42, 0.18)';
  const mapEmphasis = dark ? 'rgba(30, 64, 175, 0.46)' : 'rgba(125, 211, 252, 0.46)';
  const pointBorder = dark ? '#0f172a' : '#ffffff';
  const labelBackground = dark ? 'rgba(15, 23, 42, 0.82)' : 'rgba(255, 255, 255, 0.84)';

  return {
    ...base,
    tooltip: {
      ...base.tooltip,
      formatter: (params: any) => {
        if (params.seriesType === 'lines') {
          const row = params.data;
          return [
            `<strong>${row.name}</strong>`,
            `${copy.flightCount}: ${formatNumber(row.value)}`,
            `${copy.avgArrDelay}: ${formatDecimal(row.avgDelay)} ${copy.minute}`,
            `${copy.severeRate}: ${formatDecimal(row.severeRate)}%`,
          ].join('<br/>');
        }
        const row = pointPayload(params.data);
        return [
          `<strong>${row[4]}</strong>`,
          `${copy.flightCount}: ${formatNumber(row[2])}`,
          `${copy.avgArrDelay}: ${formatDecimal(row[3])} ${copy.minute}`,
          `${copy.severeRate}: ${formatDecimal(row[5])}%`,
        ].join('<br/>');
      },
    },
    legend: {
      ...base.legend,
      top: 2,
      right: 12,
      data: [copy.routes, copy.destinations, copy.origins],
    },
    geo: isMapReady ? {
      map: US_MAP_NAME,
      roam: true,
      zoom: 1.16,
      center: [-95.6, 37.9],
      boundingCoords: [[-125, 49.8], [-66.5, 24.1]],
      scaleLimit: { min: 0.95, max: 5 },
      silent: true,
      itemStyle: {
        areaColor: mapFill,
        borderColor: mapBorder,
        borderWidth: 1,
      },
      emphasis: {
        disabled: true,
        itemStyle: { areaColor: mapEmphasis },
      },
      label: { show: false },
    } : undefined,
    xAxis: isMapReady ? undefined : { ...base.xAxis, type: 'value', min: -126, max: -66, name: 'lon' },
    yAxis: isMapReady ? undefined : { ...base.yAxis, type: 'value', min: 24, max: 50, name: 'lat' },
    visualMap: {
      min: 0,
      max: Math.max(...destinationPoints.map((item) => item.avgDelay), 20),
      dimension: 3,
      seriesIndex: 1,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      itemWidth: 14,
      itemHeight: 112,
      inRange: { color: ['#10b981', '#f59e0b', '#ef4444'] },
      text: [copy.highRisk, copy.lowRisk],
      textStyle: { color: dark ? '#94a3b8' : '#475569' },
    },
    series: [
      {
        name: copy.routes,
        type: 'lines',
        coordinateSystem: isMapReady ? 'geo' : 'cartesian2d',
        data: routeLines.map((line) => ({
          ...line,
          lineStyle: {
            color: routeDelayColor(line.avgDelay),
            width: clamp(Math.sqrt(line.value / maxRouteCount) * 4.2, 0.9, 4.2),
            opacity: clamp(0.18 + (line.avgDelay / 86), 0.22, 0.56),
          },
        })),
        lineStyle: { curveness: 0.22 },
        effect: { show: true, symbol: 'arrow', symbolSize: 4.5, color: dark ? '#dbeafe' : '#1d4ed8', trailLength: 0.08, period: 6 },
        zlevel: 1,
      },
      {
        name: copy.destinations,
        type: 'scatter',
        coordinateSystem: isMapReady ? 'geo' : 'cartesian2d',
        data: destinationPoints.map((item) => [item.lon, item.lat, item.count, item.avgDelay, `${item.dest} ${item.name || ''}`, item.avgSevereRate]),
        symbolSize: (value: any[]) => clamp(Math.sqrt(Number(value[2] || 0) / maxDestCount) * 36, 7, 36),
        itemStyle: { opacity: 0.86, borderColor: pointBorder, borderWidth: 1.2, shadowBlur: 8, shadowColor: 'rgba(0, 0, 0, 0.24)' },
        emphasis: {
          label: {
            show: true,
            formatter: (params: any) => String(params.data?.[4] || '').split(' ')[0],
            color: dark ? '#f8fafc' : '#0f172a',
            fontWeight: 700,
          },
        },
        zlevel: 2,
      },
      {
        name: copy.highRisk,
        type: 'effectScatter',
        coordinateSystem: isMapReady ? 'geo' : 'cartesian2d',
        data: highRiskPoints.map((item, index) => ({
          name: `${item.dest} ${item.name || ''}`,
          value: [item.lon, item.lat, item.count, item.avgDelay, `${item.dest} ${item.name || ''}`, item.avgSevereRate],
          label: {
            position: index % 2 === 0 ? 'top' : 'bottom',
            offset: [0, index % 2 === 0 ? -3 : 3],
          },
        })),
        symbolSize: (value: any[]) => clamp(12 + Number(value[3] || 0) * 0.28, 15, 28),
        rippleEffect: { scale: 2.1, brushType: 'stroke' },
        itemStyle: {
          color: '#ef4444',
          borderColor: pointBorder,
          borderWidth: 1.6,
          shadowBlur: 16,
          shadowColor: 'rgba(239, 68, 68, 0.45)',
        },
        label: {
          show: true,
          formatter: (params: any) => String(pointPayload(params.data)?.[4] || '').split(' ')[0],
          color: dark ? '#fecaca' : '#991b1b',
          fontSize: 11,
          fontWeight: 800,
          backgroundColor: labelBackground,
          borderRadius: 4,
          padding: [2, 5],
        },
        zlevel: 4,
      },
      {
        name: copy.origins,
        type: 'effectScatter',
        coordinateSystem: isMapReady ? 'geo' : 'cartesian2d',
        data: originGeo.map((item) => {
          const code = String(item.origin || '');
          return {
            name: code,
            value: [Number(item.origin_lon), Number(item.origin_lat), Number(item.flightCount || 0), 0, `${code} ${item.origin_name || ''}`, 0],
            label: {
              position: originLabelPosition(code),
              offset: originLabelOffset(code),
            },
          };
        }),
        symbolSize: 15,
        rippleEffect: { scale: 3.2, brushType: 'stroke' },
        itemStyle: { color: '#f59e0b', borderColor: pointBorder, borderWidth: 1.4, shadowBlur: 12, shadowColor: 'rgba(245, 158, 11, 0.42)' },
        label: {
          show: true,
          position: 'right',
          formatter: (params: any) => String(pointPayload(params.data)?.[4] || '').split(' ')[0],
          color: dark ? '#fde68a' : '#92400e',
          fontSize: 11,
          fontWeight: 700,
          backgroundColor: labelBackground,
          borderRadius: 4,
          padding: [2, 5],
        },
        zlevel: 3,
      },
    ],
  };
}

function translateFlowNode(name: string, language: 'zh' | 'en') {
  if (language === 'zh') return name;
  const mapping: Record<string, string> = {
    前序准点: 'Previous on-time',
    前序延误: 'Previous delayed',
    当前准点: 'Current on-time',
    当前延误: 'Current delayed',
    后续准点: 'Next on-time',
    后续延误: 'Next delayed',
  };
  return mapping[name] || name;
}

function buildSankeyOption(nodes: any[], links: any[], copy: any, language: 'zh' | 'en', theme: 'dark' | 'light') {
  const base = chartBase(theme);
  const localizedNodes = nodes.map((node) => ({
    ...node,
    name: translateFlowNode(String(node.name || ''), language),
  }));

  return {
    ...base,
    tooltip: {
      trigger: 'item',
      backgroundColor: base.tooltip.backgroundColor,
      borderColor: base.tooltip.borderColor,
      textStyle: base.tooltip.textStyle,
      formatter: (params: any) => {
        if (params.dataType === 'edge') {
          return `${params.data.source} -> ${params.data.target}<br/>${copy.flightCount}: ${formatNumber(params.data.value)}`;
        }
        return params.name;
      },
    },
    series: [{
      type: 'sankey',
      emphasis: { focus: 'adjacency' },
      nodeGap: 18,
      nodeWidth: 22,
      layoutIterations: 64,
      data: localizedNodes,
      links: links.map((link) => ({
        source: localizedNodes?.[Number(link.source)]?.name,
        target: localizedNodes?.[Number(link.target)]?.name,
        value: Number(link.value || 0),
      })).filter((link) => link.source && link.target),
      lineStyle: {
        color: 'gradient',
        curveness: 0.52,
        opacity: 0.42,
      },
      label: {
        color: theme === 'dark' ? '#cbd5e1' : '#334155',
        fontSize: 12,
      },
      itemStyle: {
        borderColor: 'rgba(255, 255, 255, 0.16)',
        borderWidth: 1,
      },
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
      label: {
        show: true,
        position: 'right',
        formatter: ({ value }: any) => `${formatDecimal(value)} ${copy.minute}`,
        color: theme === 'dark' ? '#cbd5e1' : '#475569',
      },
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
      label: {
        show: true,
        position: 'right',
        formatter: ({ value }: any) => `${formatDecimal(value)}%`,
        color: theme === 'dark' ? '#cbd5e1' : '#475569',
      },
    }],
  };
}

function chartHasData(option: any) {
  return Array.isArray(option?.series) && option.series.some((series: any) => {
    if (Array.isArray(series.links)) return series.links.length > 0;
    return Array.isArray(series.data) && series.data.length > 0;
  });
}

function StoryChart({
  title,
  subtitle,
  caption,
  icon: Icon,
  option,
  emptyText,
  height = 360,
  controls,
  guide,
}: {
  title: string;
  subtitle: string;
  caption: string;
  icon: React.ElementType;
  option: any;
  emptyText: string;
  height?: number;
  controls?: React.ReactNode;
  guide?: Array<{ label: string; text: string }>;
}) {
  return (
    <section className="glass-panel overflow-hidden rounded-2xl">
      <div className="border-b border-white/10 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Icon className="h-5 w-5 shrink-0 text-cyan-300" />
              <span>{title}</span>
            </h3>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">{subtitle}</p>
          </div>
          {controls}
        </div>
        {guide && guide.length > 0 && (
          <div className="mt-4 grid gap-2 md:grid-cols-3">
            {guide.map((item) => (
              <div key={item.label} className="rounded-lg border border-white/10 bg-slate-900/35 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-cyan-300">{item.label}</div>
                <div className="mt-1 text-xs leading-5 text-slate-300">{item.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="min-w-0" style={{ height }}>
          {chartHasData(option) ? (
            <ReactECharts option={option} style={{ height: '100%', width: '100%' }} notMerge />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">{emptyText}</div>
          )}
        </div>
        <div className="mt-4 border-t border-white/10 pt-4 text-sm leading-7 text-slate-300">
          {caption}
        </div>
      </div>
    </section>
  );
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
    <section className="glass-panel rounded-2xl p-5">
      <div className="mb-4 flex items-start gap-3">
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

export default function ModuleReportSummary({ interactiveData }: ReportProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isZh = language === 'zh';
  const [selectedWeekday, setSelectedWeekday] = useState<WeekdaySelection>('all');
  const [isUsMapReady, setIsUsMapReady] = useState(usMapRegistered);

  const { data: fallbackSummary } = useFetch('/api/module1/summary');
  const { data: fallbackHourlyComparison } = useFetch('/api/module2/hourly-comparison');
  const { data: fallbackWeekdayHourHeatmap } = useFetch('/api/module2/weekday-hour-heatmap');
  const { data: fallbackTopDestinations } = useFetch('/api/module1/top-destinations');
  const { data: fallbackRiskyDestinations } = useFetch('/api/module3/top-destinations-delay');
  const { data: fallbackBubbleData } = useFetch('/api/module3/bubble-data');
  const { data: fallbackRouteAnalysis } = useFetch('/api/module3/route-analysis');
  const { data: originGeo } = useFetch('/api/module3/origin-geo');
  const { data: destGeo } = useFetch('/api/module3/dest-geo');
  const { data: airportGeo } = useFetch('/api/airports-info');
  const { data: fallbackDelayRanking } = useFetch('/api/module5/delay-ranking');
  const { data: fallbackOntimeRanking } = useFetch('/api/module5/ontime-ranking');
  const { data: recoveryStats } = useFetch('/api/module4/recovery-stats');
  const { data: propagationStats } = useFetch('/api/module6/propagation-stats');
  const { data: sankeyNodes } = useFetch('/api/module6/sankey-nodes');
  const { data: sankeyLinks } = useFetch('/api/module6/sankey-links');
  const { data: attributionConclusions } = useFetch('/api/module7/conclusions');
  const { data: featureImportance } = useFetch('/api/module7/feature-importance');
  const { data: weatherAnalysis } = useFetch('/api/module7/weather-analysis');

  const summary = interactiveData?.summary || fallbackSummary || {};
  const hourlyComparison = asArray(interactiveData?.hourlyComparison || interactiveData?.hourlyTrend || fallbackHourlyComparison);
  const weekdayHourlyComparison = asArray(interactiveData?.weekdayHourlyComparison);
  const weekdayHourHeatmap = asArray(interactiveData?.weekdayHourHeatmap || interactiveData?.heatmap || fallbackWeekdayHourHeatmap);
  const topDestinations = asArray(interactiveData?.topDestinationsVolume || fallbackTopDestinations);
  const riskyDestinations = asArray(interactiveData?.topDestinationsDelay || fallbackRiskyDestinations);
  const bubbleData = asArray(interactiveData?.bubbleData || fallbackBubbleData || riskyDestinations);
  const routeAnalysis = asArray(interactiveData?.routeAnalysis || fallbackRouteAnalysis);
  const delayRanking = asArray(interactiveData?.delayRanking || fallbackDelayRanking);
  const ontimeRanking = asArray(interactiveData?.ontimeRanking || fallbackOntimeRanking);
  const featureRows = asArray(featureImportance);
  const weatherRows = asArray(weatherAnalysis);

  useEffect(() => {
    let mounted = true;
    ensureUsMapRegistered()
      .then(() => {
        if (mounted) setIsUsMapReady(true);
      })
      .catch((error) => {
        console.warn('[route-map] US map fallback to coordinate view:', error);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const selectedHourlyRows = useMemo(
    () => rowsForWeekday(selectedWeekday, hourlyComparison, weekdayHourlyComparison, weekdayHourHeatmap),
    [hourlyComparison, selectedWeekday, weekdayHourHeatmap, weekdayHourlyComparison],
  );
  const operatingRows = selectedHourlyRows.filter((row) => (
    Number(row.hour) >= OPERATING_START_HOUR
    && Number(row.hour) <= OPERATING_END_HOUR
    && Number(row.flightCount || 0) >= 50
  ));
  const peakHour = getMaxBy(operatingRows.length ? operatingRows : selectedHourlyRows, 'avgDepDelay');
  const bestHour = getMinBy(operatingRows.length ? operatingRows : selectedHourlyRows, 'avgDepDelay');
  const hottestHeatmapCell = getMaxBy(
    weekdayHourHeatmap.filter((row) => (
      Number(row.hour) >= OPERATING_START_HOUR
      && Number(row.hour) <= OPERATING_END_HOUR
      && Number(row.flightCount || 0) >= 50
    )),
    'avgDelay',
  );
  const busiestDestination = topDestinations[0];
  const riskiestDestination = riskyDestinations[0];
  const weakestAirline = delayRanking[0];
  const strongestAirline = ontimeRanking[0];
  const topWeather = weatherRows
    .filter((row) => row?.weather_condition !== '数据缺失')
    .sort((a, b) => Number(b.avgDepDelay || 0) - Number(a.avgDepDelay || 0))[0];

  const copy = isZh ? {
    eyebrow: 'Interactive Story Report',
    title: '分析报告：一场延误如何长成系统风险',
    subtitle: '把航班延误讲成一条线：先看一天之内风险如何升温，再看星期与小时的交叉窗口，随后追到目的地、航线网络、同机任务和天气触发。',
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
    avgDelay: '平均延误',
    avgArrDelayLabel: '平均到达延误',
    depDelay: '起飞延误',
    arrDelay: '到达延误',
    recovery: '空中追回',
    minute: '分钟',
    mile: '英里',
    distance: '距离',
    highRisk: '高风险',
    lowRisk: '低风险',
    routes: '航线',
    origins: '出发机场',
    destinations: '目的地',
    importance: '重要度',
    ask: '带着问题',
    read: '读图思路',
    conclude: '读完结论',
    medianVolume: '航班量中位线',
    medianDelay: '延误中位线',
    coreConclusion: '核心结论',
    conclusionLead: `延误不是孤立事件，而是时间压力、航线结构、航司运行差异和天气触发共同叠加的结果。当前样本平均起飞延误 ${formatDecimal(summary.avgDepDelay)} 分钟，严重延误占比 ${formatDecimal(summary.severeDelayRate)}%。`,
    storyTitle: '报告故事线',
    storySubtitle: '读这份报告时只抓四个问题：什么时候开始变坏、哪类目的地最脆弱、延误如何传导、最后该提前做什么。',
    act1: '第一幕：时间升温',
    act1Text: '05:00-23:00 曲线显示压力如何在运营小时之间累计，星期筛选帮助定位某一天的节奏差异。',
    act2: '第二幕：空间暴露',
    act2Text: '航班量和延误强度并不总是同向，热门目的地与高风险目的地需要分开治理。',
    act3: '第三幕：系统传导',
    act3Text: '同一架飞机的连续任务会把前序延误带到下一段，空中追回只能消化一部分冲击。',
    timeChart: '05:00-23:00 延误趋势与空中追回对比',
    timeChartSub: '图中只保留主运营窗口 05:00-23:00。选择星期后，折线重算该星期内每小时的起飞/到达延误；柱形表示起飞延误减去到达延误，也就是空中追回效果。',
    weekdayFilter: '星期筛选',
    timeGuideQuestion: '延误是突然爆发，还是在运营时段里逐步累积？',
    timeGuideRead: '先切换星期，再比较起飞线和到达线；绿色柱代表追回，红色柱代表空中没有追回反而扩大。',
    timeGuideConclusion: '如果晚间曲线持续抬升，就要把缓冲动作前置，而不是等航班已经延误后再补救。',
    timeCaption: peakHour
      ? `主运营窗口中，${peakHour.hour}:00 的起飞延误压力最高，约 ${formatDecimal(peakHour.avgDepDelay)} 分钟；${bestHour?.hour ?? '--'}:00 压力最低。这个节奏说明延误是在一天里被逐步推高的。`
      : '主运营窗口趋势用于观察延误如何从早间低压状态逐步累积到晚间高压状态。',
    heatmapChart: '小时 x 星期延误热力图',
    heatmapSub: '用星期和小时交叉定位 05:00-23:00 的高风险时段。颜色越暖，平均起飞延误越高。',
    heatmapGuideQuestion: '高风险时段是每天都晚，还是集中在某几个星期-小时格子？',
    heatmapGuideRead: '横向看一天内升温，纵向看星期差异；最暖的格子就是需要提前预警的窗口。',
    heatmapGuideConclusion: '热力图把“晚间容易延误”变成更具体的排班窗口，例如周几几点需要更高缓冲。',
    heatmapCaption: hottestHeatmapCell
      ? `${weekdayLabel(hottestHeatmapCell.weekday, language)} ${hottestHeatmapCell.hour}:00 是主运营窗口里最值得预警的格子之一，平均延误约 ${formatDecimal(hottestHeatmapCell.avgDelay)} 分钟。`
      : '热力图适合快速找出星期与小时叠加后的高风险窗口。',
    scatterChart: '航班量 vs 延误程度',
    scatterSub: '横轴是航班量，纵轴是平均到达延误，气泡大小表示距离，颜色表示严重延误率。虚线是中位线，底部滑块可缩放查看高流量目的地。',
    scatterGuideQuestion: '一个目的地值得治理，是因为航班多，还是因为少量航班却经常拖后腿？',
    scatterGuideRead: '先看右上角的高量高延误，再看左上角的低量高延误；前者是规模压力，后者是脆弱节点。',
    scatterGuideConclusion: '治理优先级不能只看航班量，要同时看延误强度和严重延误率。',
    scatterCaption: riskiestDestination
      ? `${riskiestDestination.dest} 的到达延误强度靠前，说明治理对象不能只按热门目的地排序，也要关注低频但高延误的脆弱市场。`
      : '散点图把规模和风险拆开，帮助识别“高流量”和“高延误”这两类不同问题。',
    mapChart: '航班地图：风险沿航线展开',
    mapSub: '从纽约三机场向目的地发散，线表示航班流，点表示目的地延误强度。',
    mapGuideQuestion: '风险是局部目的地问题，还是沿某些方向成片展开？',
    mapGuideRead: '先看线的密度判断流量方向，再看目的地点颜色判断到达延误压力。',
    mapGuideConclusion: '地图把表格里的目的地风险还原为空间网络，便于识别重点方向和机场组合。',
    mapCaption: busiestDestination && riskiestDestination
      ? `${busiestDestination.dest} 代表主要流量暴露，${riskiestDestination.dest} 代表高延误强度；地图让两类节点在空间上同时可见。`
      : '地图用于把航班网络从表格拉回空间结构，便于识别风险集中方向。',
    sankeyChart: '延误状态流转图',
    sankeySub: '同一架飞机的连续任务中，前序状态如何转成当前与后续状态。',
    sankeyGuideQuestion: '前一段晚到后，下一段是否真的更容易继续延误？',
    sankeyGuideRead: '顺着流向看准点和延误状态的去向，流越粗代表发生次数越多。',
    sankeyGuideConclusion: '延误治理不能只盯单个航班，还要保护同机后续任务的周转链条。',
    sankeyCaption: `同机任务延误相关系数约 ${formatDecimal(propagationStats?.correlation, 3)}；前序延误后继续延误的比例约 ${formatDecimal(propagationStats?.prevDelayedNextDelayed)}%。`,
    airlineChart: '航司延误画像',
    airlineSub: '对比平均起飞延误靠前的航司，寻找运行差异。',
    airlineCaption: weakestAirline
      ? `${weakestAirline.carrier} 当前平均起飞延误约 ${formatDecimal(weakestAirline.avgDepDelay)} 分钟，适合继续按时段、航线和连续任务拆分。`
      : '航司图用于把系统性延误落到可管理的运营主体。',
    attributionChart: '归因变量画像',
    attributionSub: '展示模型中重要度靠前的变量，帮助把外部条件转成预警阈值。',
    attributionCaption: attributionConclusions?.badWeatherDelayIncrease
      ? `恶劣天气窗口平均延误增加约 ${formatDecimal(attributionConclusions.badWeatherDelayIncrease)} 分钟，适合做提前预警，而不只是事后解释。`
      : '归因图用于把天气、时间和运行条件转化成预警信号。',
    evidenceTitle: '证据链摘要',
    timeTitle: '时间规律',
    timeSubtitle: '05:00-23:00 主运营窗口内，越接近晚间越容易在前序压力上继续叠加。',
    routeTitle: '航线与目的地',
    routeSubtitle: '热门市场贡献规模，风险市场暴露脆弱环节。',
    systemTitle: '追回与传导',
    systemSubtitle: '空中追回能缓冲部分延误，但同机连续任务仍会传导风险。',
    attributionTitle: '天气与归因',
    attributionSubtitle: '短时天气变化更适合被转化成预警，而不是只写进复盘。',
    recommendations: '运营建议',
    r1: '把晚间高压小时、星期热力图高风险格子设为重点预警窗口。',
    r2: '目的地同时按航班量和平均到达延误排序，区分规模问题和脆弱问题。',
    r3: '同机连续任务在前序晚到后自动增加周转缓冲，优先保护下一段起飞。',
    r4: '降水、低能见度和高风速窗口提前调配机组、登机口和放行节奏。',
    finalTitle: '完整结论',
    finalLead: '纽约航班延误更像一个会被时间推高、被航线放大、被同机任务继续传递的运营系统，而不是若干个孤立异常值。',
    finalTimeTitle: '时间判断',
    finalTime: '时间上，05:00-23:00 的运营窗口呈现明显累积效应，晚间高压小时和星期热力图高风险格子应成为预警触发器。',
    finalRouteTitle: '空间判断',
    finalRoute: '空间上，航班量和延误强度需要分开看：热门目的地解释影响面，高延误目的地暴露脆弱点。',
    finalActionTitle: '运营动作',
    finalAction: '行动上，应把资源提前放在高风险时段、高风险目的地和前序晚到后的同机任务上，让调度从事后响应转为事前缓冲。',
    evidenceTable: '结果摘要',
    metric: '指标',
    current: '当前值',
    implication: '含义',
    emptyChart: '暂无足够数据绘制图表',
  } : {
    eyebrow: 'Interactive Story Report',
    title: 'Analysis Report: How Delay Becomes System Risk',
    subtitle: 'A narrative chain: how risk warms up through the day, where weekday-hour windows turn dangerous, how it spreads through routes, aircraft sequences, and weather triggers.',
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
    avgDelay: 'Avg Delay',
    avgArrDelayLabel: 'Avg Arrival Delay',
    depDelay: 'Departure Delay',
    arrDelay: 'Arrival Delay',
    recovery: 'In-air Recovery',
    minute: 'min',
    mile: 'mi',
    distance: 'Distance',
    highRisk: 'High risk',
    lowRisk: 'Low risk',
    routes: 'Routes',
    origins: 'Origins',
    destinations: 'Destinations',
    importance: 'Importance',
    ask: 'Question',
    read: 'How to Read',
    conclude: 'Conclusion',
    medianVolume: 'Volume median',
    medianDelay: 'Delay median',
    coreConclusion: 'Core Conclusion',
    conclusionLead: `Delay is not an isolated event. It emerges from time pressure, route structure, carrier differences, and weather triggers. The current sample averages ${formatDecimal(summary.avgDepDelay)} minutes of departure delay with ${formatDecimal(summary.severeDelayRate)}% severe-delay share.`,
    storyTitle: 'Storyline',
    storySubtitle: 'Read the report through four questions: when does risk rise, which destinations are fragile, how does delay propagate, and what should be done earlier?',
    act1: 'Act 1: Time Warms Up',
    act1Text: 'The 05:00-23:00 operating-window curve shows how pressure accumulates; weekday selection reveals day-specific rhythms.',
    act2: 'Act 2: Spatial Exposure',
    act2Text: 'Volume and delay intensity are not always the same problem, so busy and risky markets need separate treatment.',
    act3: 'Act 3: System Propagation',
    act3Text: 'Same-aircraft sequences carry shocks forward; in-air recovery only absorbs part of the disruption.',
    timeChart: '05:00-23:00 Delay Trend and In-air Recovery',
    timeChartSub: 'The chart focuses on the main 05:00-23:00 operating window. After choosing a weekday, the lines recalculate hourly departure and arrival delay for that day. Bars show departure minus arrival delay.',
    weekdayFilter: 'Weekday',
    timeGuideQuestion: 'Does delay break out suddenly, or accumulate across the operating day?',
    timeGuideRead: 'Choose a weekday, compare departure and arrival lines, then use green/red bars to see whether flight time recovered or amplified the delay.',
    timeGuideConclusion: 'When evening pressure keeps rising, buffers should be triggered before the delay is already visible.',
    timeCaption: peakHour
      ? `Within the main operating window, ${peakHour.hour}:00 has the highest departure-delay pressure at about ${formatDecimal(peakHour.avgDepDelay)} minutes; ${bestHour?.hour ?? '--'}:00 is the lowest-pressure hour.`
      : 'Use this curve to see how delay accumulates from lower-pressure morning windows into later high-pressure periods.',
    heatmapChart: 'Hour x Weekday Delay Heatmap',
    heatmapSub: 'Locate high-risk windows within 05:00-23:00 by crossing weekday and hour. Warmer cells mean higher average departure delay.',
    heatmapGuideQuestion: 'Is the risk broad across every evening, or concentrated in a few weekday-hour cells?',
    heatmapGuideRead: 'Read horizontally for within-day buildup and vertically for weekday differences; the warmest cells are alert windows.',
    heatmapGuideConclusion: 'The heatmap turns a vague evening-risk statement into specific scheduling windows.',
    heatmapCaption: hottestHeatmapCell
      ? `${weekdayLabel(hottestHeatmapCell.weekday, language)} ${hottestHeatmapCell.hour}:00 is one of the highest-risk operating cells, averaging about ${formatDecimal(hottestHeatmapCell.avgDelay)} minutes.`
      : 'The heatmap is designed to find weekday-hour risk windows quickly.',
    scatterChart: 'Flight Volume vs Delay Severity',
    scatterSub: 'Flight count on the x-axis, average arrival delay on the y-axis, distance as bubble size, severe-delay share as color. Dashed lines show medians; the bottom slider zooms high-volume markets.',
    scatterGuideQuestion: 'Is a destination important because it is busy, or because a smaller market is unusually fragile?',
    scatterGuideRead: 'Start with the upper-right quadrant, then inspect the upper-left quadrant. The first is scale pressure; the second is vulnerability.',
    scatterGuideConclusion: 'Operational priority should combine exposure, delay intensity, and severe-delay share.',
    scatterCaption: riskiestDestination
      ? `${riskiestDestination.dest} is high on delay intensity, showing why targets should not be ranked by popularity alone.`
      : 'This scatter separates exposure from delay intensity.',
    mapChart: 'Flight Map: Risk Along the Network',
    mapSub: 'Routes radiate from the three NYC airports. Lines show flow; destination points show delay intensity.',
    mapGuideQuestion: 'Is risk a single destination problem, or does it spread along specific network directions?',
    mapGuideRead: 'Use line density for flow direction, then read destination color for arrival-delay pressure.',
    mapGuideConclusion: 'The map turns route tables back into a spatial network, making priority corridors easier to see.',
    mapCaption: busiestDestination && riskiestDestination
      ? `${busiestDestination.dest} represents major volume exposure, while ${riskiestDestination.dest} represents higher delay intensity.`
      : 'The map restores the network structure behind the route table.',
    sankeyChart: 'Delay State Flow',
    sankeySub: 'Shows how previous flight state transfers into current and subsequent states for same-aircraft sequences.',
    sankeyGuideQuestion: 'After a previous late arrival, is the next task truly more likely to stay delayed?',
    sankeyGuideRead: 'Follow the flow from previous state to current and next state; thicker links happen more often.',
    sankeyGuideConclusion: 'Delay management must protect the same-aircraft task chain, not only the individual flight.',
    sankeyCaption: `Same-aircraft propagation correlation is about ${formatDecimal(propagationStats?.correlation, 3)}; previous-delay followed by next-delay share is about ${formatDecimal(propagationStats?.prevDelayedNextDelayed)}%.`,
    airlineChart: 'Carrier Delay Profile',
    airlineSub: 'Compare carriers with higher average departure delay.',
    airlineCaption: weakestAirline
      ? `${weakestAirline.carrier} averages about ${formatDecimal(weakestAirline.avgDepDelay)} minutes of departure delay and should be decomposed by time, route, and sequence.`
      : 'Carrier profiles turn system delay into manageable operating ownership.',
    attributionChart: 'Attribution Drivers',
    attributionSub: 'Top feature importance from the attribution module.',
    attributionCaption: attributionConclusions?.badWeatherDelayIncrease
      ? `Bad-weather windows add about ${formatDecimal(attributionConclusions.badWeatherDelayIncrease)} minutes on average, making them useful for early warning.`
      : 'Attribution turns weather, time, and operating conditions into warning signals.',
    evidenceTitle: 'Evidence Chain',
    timeTitle: 'Time Pattern',
    timeSubtitle: 'Within the 05:00-23:00 operating window, later periods are more likely to inherit earlier pressure.',
    routeTitle: 'Routes and Destinations',
    routeSubtitle: 'Busy markets explain exposure; risky markets reveal vulnerable links.',
    systemTitle: 'Recovery and Propagation',
    systemSubtitle: 'In-air recovery absorbs part of the shock, but aircraft sequences still transfer delay.',
    attributionTitle: 'Weather and Attribution',
    attributionSubtitle: 'Short-term weather shifts are useful early-warning signals.',
    recommendations: 'Operational Actions',
    r1: 'Use evening peaks and high-risk weekday-hour cells as priority alert windows.',
    r2: 'Rank destinations by both traffic volume and average arrival delay.',
    r3: 'Add turnaround buffer after late arrivals for same-aircraft sequences.',
    r4: 'Pre-position crew, gates, and release pacing during adverse weather windows.',
    finalTitle: 'Complete Conclusion',
    finalLead: 'NYC flight delay behaves like an operating system that is pushed by time, amplified by route structure, and carried forward by aircraft sequences.',
    finalTimeTitle: 'Time Judgment',
    finalTime: 'Temporally, the 05:00-23:00 operating window shows accumulation; evening peaks and high-risk weekday-hour cells should trigger alerts.',
    finalRouteTitle: 'Spatial Judgment',
    finalRoute: 'Spatially, volume and delay intensity must be read separately: busy markets explain impact, while high-delay markets reveal fragility.',
    finalActionTitle: 'Operating Action',
    finalAction: 'Operationally, resources should move earlier toward risky windows, risky destinations, and same-aircraft tasks after late arrivals.',
    evidenceTable: 'Result Summary',
    metric: 'Metric',
    current: 'Current Value',
    implication: 'Implication',
    emptyChart: 'Not enough data to render this chart',
  };

  const storySteps = [
    { title: copy.act1, text: copy.act1Text, icon: Clock },
    { title: copy.act2, text: copy.act2Text, icon: Route },
    { title: copy.act3, text: copy.act3Text, icon: GitBranch },
  ];

  const recommendations = [
    { text: copy.r1, icon: CalendarDays },
    { text: copy.r2, icon: MapPin },
    { text: copy.r3, icon: GitBranch },
    { text: copy.r4, icon: CloudRain },
  ];

  const finalConclusions = [
    { title: copy.finalTimeTitle, text: copy.finalTime, icon: Clock },
    { title: copy.finalRouteTitle, text: copy.finalRoute, icon: Route },
    { title: copy.finalActionTitle, text: copy.finalAction, icon: TrendingUp },
  ];

  const tableRows = [
    {
      metric: copy.timeTitle,
      finding: peakHour ? `${peakHour.hour}:00 / ${formatDecimal(peakHour.avgDepDelay)} ${copy.minute}` : '--',
      implication: copy.r1,
    },
    {
      metric: copy.heatmapChart,
      finding: hottestHeatmapCell ? `${weekdayLabel(hottestHeatmapCell.weekday, language)} ${hottestHeatmapCell.hour}:00` : '--',
      implication: copy.r1,
    },
    {
      metric: copy.routeTitle,
      finding: riskiestDestination ? `${riskiestDestination.dest} / ${formatDecimal(riskiestDestination.avgArrDelay)} ${copy.minute}` : '--',
      implication: copy.r2,
    },
    {
      metric: copy.systemTitle,
      finding: `${formatDecimal(propagationStats?.correlation, 3)} / ${formatDecimal(recoveryStats?.avgRecovery)} ${copy.minute}`,
      implication: copy.r3,
    },
    {
      metric: copy.attributionTitle,
      finding: topWeather ? `${localizeDisplayValue(topWeather.weather_condition, language)} / ${formatDecimal(topWeather.avgDepDelay)} ${copy.minute}` : '--',
      implication: copy.r4,
    },
  ];

  const weekdayControls = (
    <div className="w-full shrink-0 lg:w-auto">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{copy.weekdayFilter}</div>
      <div className="grid grid-cols-4 gap-1 sm:flex">
        {WEEKDAY_OPTIONS.map((item) => {
          const active = selectedWeekday === item.value;
          return (
            <button
              key={String(item.value)}
              type="button"
              onClick={() => setSelectedWeekday(item.value)}
              className={`h-9 min-w-14 rounded-lg border px-2 text-xs font-medium transition-colors ${
                active
                  ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-100'
                  : 'border-white/10 bg-slate-900/35 text-slate-400 hover:border-cyan-500/30 hover:text-slate-200'
              }`}
            >
              {isZh ? item.zh : item.en}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <section className="glass-panel overflow-hidden rounded-2xl p-6 md:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
              <FileText className="h-3.5 w-3.5" />
              {copy.eyebrow}
            </div>
            <h2 className="max-w-5xl text-3xl font-bold tracking-normal text-white md:text-5xl">{copy.title}</h2>
            <p className="mt-4 max-w-4xl text-base leading-8 text-slate-300">{copy.subtitle}</p>
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
          <h3 className="text-xl font-semibold text-white">{copy.storyTitle}</h3>
          <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-400">{copy.storySubtitle}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {storySteps.map((step, index) => (
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

      <div className="grid gap-5">
        <StoryChart
          title={copy.timeChart}
          subtitle={copy.timeChartSub}
          caption={copy.timeCaption}
          icon={Activity}
          option={buildHourlyRecoveryOption(selectedHourlyRows, copy, theme)}
          emptyText={copy.emptyChart}
          height={380}
          controls={weekdayControls}
          guide={[
            { label: copy.ask, text: copy.timeGuideQuestion },
            { label: copy.read, text: copy.timeGuideRead },
            { label: copy.conclude, text: copy.timeGuideConclusion },
          ]}
        />

        <StoryChart
          title={copy.heatmapChart}
          subtitle={copy.heatmapSub}
          caption={copy.heatmapCaption}
          icon={CalendarDays}
          option={buildWeekdayHeatmapOption(weekdayHourHeatmap, copy, language, theme)}
          emptyText={copy.emptyChart}
          height={420}
          guide={[
            { label: copy.ask, text: copy.heatmapGuideQuestion },
            { label: copy.read, text: copy.heatmapGuideRead },
            { label: copy.conclude, text: copy.heatmapGuideConclusion },
          ]}
        />

        <StoryChart
          title={copy.scatterChart}
          subtitle={copy.scatterSub}
          caption={copy.scatterCaption}
          icon={BarChart3}
          option={buildDestinationScatterOption(bubbleData, copy, theme)}
          emptyText={copy.emptyChart}
          height={430}
          guide={[
            { label: copy.ask, text: copy.scatterGuideQuestion },
            { label: copy.read, text: copy.scatterGuideRead },
            { label: copy.conclude, text: copy.scatterGuideConclusion },
          ]}
        />

        <StoryChart
          title={copy.mapChart}
          subtitle={copy.mapSub}
          caption={copy.mapCaption}
          icon={Navigation}
          option={buildRouteMapOption(
            routeAnalysis,
            asArray(originGeo),
            asArray(destGeo),
            asArray(airportGeo),
            copy,
            theme,
            isUsMapReady,
          )}
          emptyText={copy.emptyChart}
          height={460}
          guide={[
            { label: copy.ask, text: copy.mapGuideQuestion },
            { label: copy.read, text: copy.mapGuideRead },
            { label: copy.conclude, text: copy.mapGuideConclusion },
          ]}
        />

        <div className="grid gap-5 xl:grid-cols-2">
          <StoryChart
            title={copy.sankeyChart}
            subtitle={copy.sankeySub}
            caption={copy.sankeyCaption}
            icon={GitBranch}
            option={buildSankeyOption(asArray(sankeyNodes), asArray(sankeyLinks), copy, language, theme)}
            emptyText={copy.emptyChart}
            height={360}
            guide={[
              { label: copy.ask, text: copy.sankeyGuideQuestion },
              { label: copy.read, text: copy.sankeyGuideRead },
              { label: copy.conclude, text: copy.sankeyGuideConclusion },
            ]}
          />
          <StoryChart
            title={copy.airlineChart}
            subtitle={copy.airlineSub}
            caption={copy.airlineCaption}
            icon={Building2}
            option={buildAirlineOption(delayRanking, copy, theme)}
            emptyText={copy.emptyChart}
            height={360}
          />
        </div>

        <StoryChart
          title={copy.attributionChart}
          subtitle={copy.attributionSub}
          caption={copy.attributionCaption}
          icon={CloudRain}
          option={buildAttributionOption(featureRows, copy, language, theme)}
          emptyText={copy.emptyChart}
          height={360}
        />
      </div>

      <section className="glass-panel overflow-hidden rounded-2xl p-6 md:p-7">
        <div className="mb-5 max-w-5xl">
          <h3 className="flex items-center gap-2 text-xl font-semibold text-white">
            <Sparkles className="h-5 w-5 text-cyan-300" />
            {copy.finalTitle}
          </h3>
          <p className="mt-3 text-sm leading-7 text-slate-300">{copy.finalLead}</p>
        </div>
        <div className="grid gap-0 overflow-hidden rounded-xl border border-white/10 md:grid-cols-3 md:divide-x md:divide-white/10">
          {finalConclusions.map((item, index) => (
            <div key={item.title} className="border-b border-white/10 bg-slate-950/20 p-4 last:border-b-0 md:border-b-0">
              <div className="mb-3 flex items-center justify-between gap-3">
                <item.icon className="h-5 w-5 text-cyan-300" />
                <span className="text-xs font-semibold text-slate-500">0{index + 1}</span>
              </div>
              <h4 className="text-sm font-semibold text-white">{item.title}</h4>
              <p className="mt-2 text-sm leading-6 text-slate-400">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <div>
        <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
          <BarChart3 className="h-5 w-5 text-cyan-300" />
          {copy.evidenceTitle}
        </h3>
        <div className="grid gap-6 lg:grid-cols-2">
          <EvidenceCard title={copy.timeTitle} subtitle={copy.timeSubtitle} icon={Clock}>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-slate-500">{isZh ? '高压小时' : 'Peak hour'}</div>
                <div className="mt-1 text-2xl font-bold text-orange-300">{peakHour ? `${peakHour.hour}:00` : '--'}</div>
                <div className="text-slate-400">{formatDecimal(peakHour?.avgDepDelay)} {copy.minute}</div>
              </div>
              <div>
                <div className="text-slate-500">{isZh ? '低压小时' : 'Low-pressure hour'}</div>
                <div className="mt-1 text-2xl font-bold text-green-300">{bestHour ? `${bestHour.hour}:00` : '--'}</div>
                <div className="text-slate-400">{formatDecimal(bestHour?.avgDepDelay)} {copy.minute}</div>
              </div>
            </div>
          </EvidenceCard>

          <EvidenceCard title={copy.routeTitle} subtitle={copy.routeSubtitle} icon={MapPin}>
            <MiniBarList rows={topDestinations} valueKey="flightCount" labelKey="dest" />
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

          <EvidenceCard title={copy.recommendations} subtitle={isZh ? '从图表结论转化为可执行动作。' : 'Turn findings into executable actions.'} icon={TrendingUp}>
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
