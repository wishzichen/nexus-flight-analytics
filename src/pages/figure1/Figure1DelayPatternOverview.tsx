import { type ComponentType, type CSSProperties, type ReactNode, useMemo, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { CloudLightning, Clock, Download, GitBranch, MapPin } from 'lucide-react';

const palette = {
  panel: '#0b1628',
  panelLine: 'rgba(148, 163, 184, 0.18)',
  axis: '#94a3b8',
  text: '#e2e8f0',
  muted: '#94a3b8',
  grid: 'rgba(30, 41, 59, 0.82)',
  onTime: '#43c6a0',
  moderate: '#f5b942',
  severe: '#e75a87',
  cyan: '#22d3ee',
  purple: '#a78bfa',
  orange: '#fb923c',
};

const chartText = {
  fontFamily: 'Inter, Helvetica Neue, Arial, sans-serif',
};

const tooltip = {
  backgroundColor: 'rgba(15, 23, 42, 0.96)',
  borderColor: 'rgba(148, 163, 184, 0.18)',
  borderWidth: 1,
  textStyle: { color: palette.text, fontSize: 12 },
  extraCssText: 'box-shadow: 0 12px 32px rgba(0,0,0,0.35); border-radius: 10px;',
};

const states = [
  { key: 'onTime', label: 'On-time / Early', inbound: 76.3, outbound: 73.4, color: palette.onTime },
  { key: 'moderate', label: 'Moderate delay', inbound: 18.9, outbound: 18.9, color: palette.moderate },
  { key: 'severe', label: 'Severe delay', inbound: 4.8, outbound: 7.7, color: palette.severe },
] as const;

const transitionRows = [
  ['On-time / Early', 'On-time / Early', 63.5],
  ['On-time / Early', 'Moderate delay', 10.3],
  ['On-time / Early', 'Severe delay', 2.5],
  ['Moderate delay', 'On-time / Early', 8.7],
  ['Moderate delay', 'Moderate delay', 7.0],
  ['Moderate delay', 'Severe delay', 3.2],
  ['Severe delay', 'On-time / Early', 1.2],
  ['Severe delay', 'Moderate delay', 1.6],
  ['Severe delay', 'Severe delay', 2.0],
] as const;

const airports = [
  { code: 'JFK', mean: 10.9, sd: 34, delayRate: 22.8, offset: 0.18, color: '#70d6ff' },
  { code: 'LGA', mean: 12.3, sd: 38, delayRate: 24.1, offset: 0.78, color: '#38bdf8' },
  { code: 'EWR', mean: 14.8, sd: 42, delayRate: 27.6, offset: 1.38, color: '#a78bfa' },
];

const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const hourLabels = ['00-05', '06-09', '10-13', '14-17', '18-21', '22-23'];
const weekdayHeat = [
  [18, 19, 22, 27, 29, 23],
  [17, 18, 21, 26, 28, 22],
  [18, 19, 22, 27, 29, 23],
  [19, 20, 23, 28, 30, 24],
  [20, 22, 25, 30, 33, 26],
  [16, 17, 19, 23, 25, 20],
  [18, 20, 24, 29, 31, 25],
];

const weatherRows = [
  { metric: 'Average departure delay', unit: 'min', normal: 9.7, severe: 24.6 },
  { metric: 'Delay rate', unit: '%', normal: 19.8, severe: 38.9 },
];

const exportSize = {
  width: 1920,
  height: 1080,
};

type ChartRef = InstanceType<typeof ReactECharts>;

function normalPdf(x: number, mean: number, sd: number) {
  const variance = sd * sd;
  return (1 / Math.sqrt(2 * Math.PI * variance)) * Math.exp(-((x - mean) ** 2) / (2 * variance));
}

function makeRidge(mean: number, sd: number, offset: number) {
  const values: Array<[number, number]> = [];
  for (let x = -30; x <= 180; x += 2) {
    const rightTail = x > mean ? 1 + Math.min((x - mean) / 95, 0.55) : 1;
    values.push([x, normalPdf(x, mean, sd) * 42 * rightTail + offset]);
  }
  return values;
}

function Panel({
  accent,
  children,
  icon: Icon,
  kicker,
  subtitle,
  title,
}: {
  accent: string;
  children: ReactNode;
  icon: ComponentType<{ className?: string; style?: CSSProperties }>;
  kicker: string;
  subtitle: string;
  title: string;
}) {
  return (
    <section className="glass-panel flex h-full min-h-0 flex-col overflow-hidden rounded-2xl p-4">
      <div className="mb-2 flex shrink-0 items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-[16px] font-semibold text-slate-100">
            <Icon className="h-4 w-4" style={{ color: accent }} />
            <span className="text-slate-500">{kicker}</span>
            {title}
          </h2>
          <p className="mt-2 text-[12px] leading-5 text-slate-400">{subtitle}</p>
        </div>
        <div className="mt-1 h-2 w-2 rounded-full" style={{ background: accent, boxShadow: `0 0 18px ${accent}` }} />
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

export default function Figure1DelayPatternOverview() {
  const [isExporting, setIsExporting] = useState(false);
  const sankeyRef = useRef<ChartRef | null>(null);
  const ridgeRef = useRef<ChartRef | null>(null);
  const heatmapRef = useRef<ChartRef | null>(null);
  const weatherRef = useRef<ChartRef | null>(null);

  const sankeyOption = useMemo(() => {
    const inboundNodes = states.map((state) => ({
      name: `Inbound | ${state.label}`,
      itemStyle: { color: state.color },
      depth: 0,
      label: { formatter: `${state.label}\n${state.inbound.toFixed(1)}%` },
    }));
    const outboundNodes = states.map((state) => ({
      name: `Outbound | ${state.label}`,
      itemStyle: { color: state.color },
      depth: 1,
      label: { formatter: `${state.label}\n${state.outbound.toFixed(1)}%` },
    }));
    const stateByLabel = new Map(states.map((state) => [state.label, state]));

    return {
      backgroundColor: 'transparent',
      textStyle: chartText,
      tooltip: {
        ...tooltip,
        formatter: (params: any) => {
          if (!params.data?.source) return params.name;
          const source = params.data.source.replace('Inbound | ', '');
          const target = params.data.target.replace('Outbound | ', '');
          return `<strong>${source} -> ${target}</strong><br/>Share of all flights: <b>${params.value.toFixed(1)}%</b>`;
        },
      },
      graphic: [
        { type: 'text', left: '8%', top: 2, style: { text: 'Inbound state', fill: palette.muted, font: '600 11px Inter' } },
        { type: 'text', right: '18%', top: 2, style: { text: 'Outbound state', fill: palette.muted, font: '600 11px Inter' } },
      ],
      series: [
        {
          type: 'sankey',
          left: '5%',
          right: '22%',
          top: 38,
          bottom: 24,
          nodeWidth: 18,
          nodeGap: 16,
          draggable: false,
          emphasis: { focus: 'adjacency' },
          data: [...inboundNodes, ...outboundNodes],
          links: transitionRows.map(([source, target, value]) => {
            const targetState = stateByLabel.get(target);
            return {
              source: `Inbound | ${source}`,
              target: `Outbound | ${target}`,
              value,
              lineStyle: {
                color: targetState?.color,
                opacity: target === 'On-time / Early' ? 0.34 : target === 'Moderate delay' ? 0.42 : 0.55,
              },
            };
          }),
          lineStyle: { curveness: 0.55 },
          label: {
            color: palette.muted,
            fontSize: 10,
            lineHeight: 14,
            width: 96,
            overflow: 'break',
          },
          itemStyle: {
            borderColor: 'rgba(255,255,255,0.12)',
            borderWidth: 1,
          },
        },
      ],
    };
  }, []);

  const ridgeOption = useMemo(() => ({
    backgroundColor: 'transparent',
    textStyle: chartText,
    grid: { left: 54, right: 34, top: 28, bottom: 58 },
    tooltip: {
      ...tooltip,
      trigger: 'axis',
      formatter: (params: any) => {
        const x = params[0]?.value?.[0] ?? 0;
        return `Departure delay: <b>${x} min</b><br/>Right tail highlights prolonged disruption.`;
      },
    },
    xAxis: {
      type: 'value',
      min: -30,
      max: 180,
      name: 'Departure delay (min)',
      nameLocation: 'middle',
      nameGap: 28,
      nameTextStyle: { color: palette.axis, fontSize: 11 },
      axisLine: { lineStyle: { color: palette.grid } },
      axisTick: { show: false },
      axisLabel: { color: palette.axis, fontSize: 11 },
      splitLine: { lineStyle: { color: palette.grid, type: 'dashed' } },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 2.02,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: {
        color: palette.text,
        fontSize: 11,
        formatter: (value: number) => {
          if (Math.abs(value - 1.38) < 0.04) return 'EWR';
          if (Math.abs(value - 0.78) < 0.04) return 'LGA';
          if (Math.abs(value - 0.18) < 0.04) return 'JFK';
          return '';
        },
      },
    },
    graphic: airports.map((airport) => ({
      type: 'text',
      left: 70,
      top: 310 - airport.offset * 132,
      style: {
        text: `${airport.code}: ${airport.mean.toFixed(1)} min avg | ${airport.delayRate.toFixed(1)}% delayed`,
        fill: airport.color,
        font: '600 10px Inter',
      },
    })),
    series: [
      ...airports.map((airport) => ({
        name: `${airport.code} baseline`,
        type: 'line',
        symbol: 'none',
        silent: true,
        data: [[-30, airport.offset], [180, airport.offset]],
        lineStyle: { width: 1, color: 'rgba(148, 163, 184, 0.18)' },
      })),
      ...airports.map((airport, index) => ({
        name: airport.code,
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: makeRidge(airport.mean, airport.sd, airport.offset),
        lineStyle: { width: 1.8, color: airport.color },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: `${airport.color}22` },
              { offset: 0.55, color: `${airport.color}66` },
              { offset: 1, color: `${airport.color}16` },
            ],
          },
        },
        z: 10 - index,
      })),
      {
        name: '15 min threshold',
        type: 'line',
        symbol: 'none',
        data: [[15, 0.08], [15, 1.88]],
        lineStyle: { type: 'dashed', width: 1.5, color: 'rgba(248,250,252,0.7)' },
        label: {
          show: true,
          formatter: '15 min threshold',
          position: 'end',
          color: palette.muted,
          fontSize: 11,
        },
      },
    ],
  }), []);

  const heatmapOption = useMemo(() => ({
    backgroundColor: 'transparent',
    textStyle: chartText,
    grid: { left: 52, right: 18, top: 26, bottom: 78, containLabel: false },
    tooltip: {
      ...tooltip,
      position: 'top',
      formatter: (params: any) => {
        const [hourIndex, weekdayIndex, value] = params.data;
        return `<strong>${weekdayLabels[weekdayIndex]} ${hourLabels[hourIndex]}</strong><br/>Delay rate: <b>${value}%</b>`;
      },
    },
    xAxis: {
      type: 'category',
      data: hourLabels,
      position: 'top',
      axisLine: { lineStyle: { color: palette.grid } },
      axisTick: { show: false },
      axisLabel: { color: palette.axis, fontSize: 11, margin: 9 },
      splitArea: { show: true, areaStyle: { color: ['rgba(255,255,255,0.015)', 'rgba(255,255,255,0.03)'] } },
    },
    yAxis: {
      type: 'category',
      data: weekdayLabels,
      axisLine: { lineStyle: { color: palette.grid } },
      axisTick: { show: false },
      axisLabel: { color: palette.text, fontSize: 12, fontWeight: 600, margin: 12 },
      splitArea: { show: true, areaStyle: { color: ['rgba(255,255,255,0.015)', 'rgba(255,255,255,0.03)'] } },
    },
    visualMap: {
      min: 15,
      max: 35,
      dimension: 2,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 18,
      itemWidth: 22,
      itemHeight: 260,
      text: ['High', 'Low'],
      textGap: 14,
      precision: 0,
      textStyle: { color: palette.axis, fontSize: 11 },
      inRange: {
        color: ['#10b981', '#83c918', '#facc15', '#fb923c', '#ef4444'],
      },
    },
    series: [
      {
        type: 'heatmap',
        data: weekdayHeat.flatMap((row, weekdayIndex) => row.map((value, hourIndex) => [hourIndex, weekdayIndex, value])),
        label: { show: false },
        itemStyle: {
          borderColor: '#0b1628',
          borderWidth: 2,
          borderRadius: 2,
        },
        emphasis: {
          itemStyle: {
            borderColor: palette.cyan,
            borderWidth: 2,
            shadowBlur: 14,
            shadowColor: 'rgba(34, 211, 238, 0.35)',
          },
        },
      },
    ],
  }), []);

  const weatherOption = useMemo(() => ({
    backgroundColor: 'transparent',
    textStyle: chartText,
    grid: { left: 132, right: 44, top: 24, bottom: 44 },
    tooltip: {
      ...tooltip,
      trigger: 'item',
      formatter: (params: any) => `${params.seriesName}<br/>${params.value[1]}: <b>${params.value[0]}${params.data.unit}</b>`,
    },
    legend: { show: false },
    xAxis: {
      type: 'value',
      min: 0,
      max: 45,
      axisLine: { lineStyle: { color: palette.grid } },
      axisTick: { show: false },
      axisLabel: { color: palette.axis, fontSize: 11, formatter: '{value}' },
      splitLine: { lineStyle: { color: palette.grid, type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      data: weatherRows.map((row) => row.metric),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: palette.text, fontSize: 12, fontWeight: 600 },
    },
    series: [
      ...weatherRows.map((row) => ({
        name: `${row.metric} weather effect`,
        type: 'line',
        symbol: 'none',
        data: [[row.normal, row.metric], [row.severe, row.metric]],
        lineStyle: { color: 'rgba(148, 163, 184, 0.35)', width: 7, cap: 'round' },
        tooltip: { show: false },
        silent: true,
      })),
      {
        name: 'Normal weather',
        type: 'scatter',
        symbolSize: 18,
        data: weatherRows.map((row) => ({ value: [row.normal, row.metric], unit: row.unit })),
        itemStyle: { color: '#38bdf8', borderColor: '#dff7ff', borderWidth: 1 },
        label: {
          show: true,
          formatter: (params: any) => `${params.value[0]}${params.data.unit}`,
          position: 'left',
          color: '#7dd3fc',
          fontSize: 11,
          fontWeight: 600,
        },
      },
      {
        name: 'Severe weather',
        type: 'scatter',
        symbolSize: 22,
        data: weatherRows.map((row) => ({ value: [row.severe, row.metric], unit: row.unit })),
        itemStyle: { color: palette.severe, borderColor: '#ffe4ef', borderWidth: 1 },
        label: {
          show: true,
          formatter: (params: any) => `${params.value[0]}${params.data.unit}`,
          position: 'right',
          color: '#fda4af',
          fontSize: 11,
          fontWeight: 700,
        },
      },
    ],
  }), []);

  const loadImage = (source: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = source;
    });

  const drawRoundRect = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ) => {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + width, y, x + width, y + height, radius);
    context.arcTo(x + width, y + height, x, y + height, radius);
    context.arcTo(x, y + height, x, y, radius);
    context.arcTo(x, y, x + width, y, radius);
    context.closePath();
  };

  const drawPanel = (
    context: CanvasRenderingContext2D,
    chart: HTMLImageElement,
    panel: { x: number; y: number; width: number; height: number },
    meta: { accent: string; label: string; title: string; subtitle: string },
  ) => {
    context.save();
    drawRoundRect(context, panel.x, panel.y, panel.width, panel.height, 18);
    context.fillStyle = 'rgba(15, 23, 42, 0.78)';
    context.fill();
    context.strokeStyle = 'rgba(255,255,255,0.09)';
    context.lineWidth = 1.5;
    context.stroke();

    context.fillStyle = meta.accent;
    context.beginPath();
    context.arc(panel.x + 32, panel.y + 38, 7, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#64748b';
    context.font = '700 18px Inter, Arial, sans-serif';
    context.fillText(meta.label, panel.x + 50, panel.y + 42);
    context.fillStyle = '#f1f5f9';
    context.font = '700 19px Inter, Arial, sans-serif';
    context.fillText(meta.title, panel.x + 80, panel.y + 42);

    context.fillStyle = '#94a3b8';
    context.font = '400 13px Inter, Arial, sans-serif';
    context.fillText(meta.subtitle, panel.x + 30, panel.y + 72);

    const chartX = panel.x + 20;
    const chartY = panel.y + 86;
    const chartWidth = panel.width - 40;
    const chartHeight = panel.height - 104;
    const imageRatio = chart.width / chart.height;
    const boxRatio = chartWidth / chartHeight;
    const drawWidth = imageRatio > boxRatio ? chartWidth : chartHeight * imageRatio;
    const drawHeight = imageRatio > boxRatio ? chartWidth / imageRatio : chartHeight;
    const drawX = chartX + (chartWidth - drawWidth) / 2;
    const drawY = chartY + (chartHeight - drawHeight) / 2;
    context.drawImage(chart, drawX, drawY, drawWidth, drawHeight);
    context.restore();
  };

  const exportFigure = async () => {
    const refs = [sankeyRef, ridgeRef, heatmapRef, weatherRef];
    const instances = refs.map((ref) => ref.current?.getEchartsInstance()).filter(Boolean);
    if (instances.length !== 4) return;

    setIsExporting(true);
    try {
      const chartImages = await Promise.all(
        instances.map((instance) =>
          loadImage(
            instance.getDataURL({
              type: 'png',
              pixelRatio: 3,
              backgroundColor: 'transparent',
              excludeComponents: ['toolbox'],
            }),
          ),
        ),
      );

      const canvas = document.createElement('canvas');
      canvas.width = exportSize.width;
      canvas.height = exportSize.height;
      const context = canvas.getContext('2d');
      if (!context) return;

      context.fillStyle = '#020617';
      context.fillRect(0, 0, exportSize.width, exportSize.height);

      const gradient = context.createLinearGradient(0, 0, 0, 420);
      gradient.addColorStop(0, 'rgba(14, 165, 233, 0.16)');
      gradient.addColorStop(1, 'rgba(14, 165, 233, 0)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, exportSize.width, 420);

      context.fillStyle = 'rgba(56, 189, 248, 0.04)';
      for (let x = 0; x < exportSize.width; x += 32) {
        for (let y = 0; y < exportSize.height; y += 32) {
          context.fillRect(x, y, 1.2, 1.2);
        }
      }

      const panels = [
        { x: 44, y: 42, width: 898, height: 478 },
        { x: 978, y: 42, width: 898, height: 478 },
        { x: 44, y: 560, width: 898, height: 478 },
        { x: 978, y: 560, width: 898, height: 478 },
      ];
      const panelMeta = [
        {
          accent: palette.purple,
          label: 'A.',
          title: 'Delay State Transition Alluvial',
          subtitle: 'Inbound delays disproportionately feed delayed outbound states.',
        },
        {
          accent: palette.cyan,
          label: 'B.',
          title: 'Airport Delay Distribution',
          subtitle: 'Right-skewed ridges reveal long-tail disruption across JFK, LGA, and EWR.',
        },
        {
          accent: palette.orange,
          label: 'C.',
          title: 'Hour x Weekday Delay Heatmap',
          subtitle: 'Delay risk accumulates toward Friday evening and late-day operations.',
        },
        {
          accent: palette.severe,
          label: 'D.',
          title: 'Weather Contrast Dot Plot',
          subtitle: 'Severe weather nearly doubles delay rate and adds about fifteen minutes.',
        },
      ];

      chartImages.forEach((chart, index) => drawPanel(context, chart, panels[index], panelMeta[index]));

      const link = document.createElement('a');
      link.download = 'figure-1-delay-pattern-overview-panels-16x9.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] bg-grid px-6 py-8 text-[#f1f5f9]">
      <div className="mx-auto mb-5 flex max-w-[1500px] justify-end">
        <button
          type="button"
          onClick={exportFigure}
          disabled={isExporting}
          className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 shadow-lg shadow-cyan-950/20 transition-colors hover:bg-cyan-400/18 disabled:cursor-wait disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Export 16:9 Panels PNG'}
        </button>
      </div>

      <main className="figure1-stage mx-auto aspect-video max-w-[1500px] overflow-hidden rounded-2xl bg-[#020617] p-5">
        <div className="grid h-full grid-cols-2 grid-rows-2 gap-4">
          <Panel
            accent={palette.purple}
            icon={GitBranch}
            kicker="A."
            title="Delay State Transition Alluvial"
            subtitle="Most on-time inbound flights remain stable, while moderate and severe inbound delays disproportionately feed delayed outbound states."
          >
            <div className="h-full min-h-0">
              <ReactECharts ref={sankeyRef} option={sankeyOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </Panel>

          <Panel
            accent={palette.cyan}
            icon={MapPin}
            kicker="B."
            title="Airport Delay Distribution"
            subtitle="Right-skewed ridges show the long-tail nature of departure disruption; EWR shifts furthest toward severe delay exposure."
          >
            <div className="h-full min-h-0">
              <ReactECharts ref={ridgeRef} option={ridgeOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </Panel>

          <Panel
            accent={palette.orange}
            icon={Clock}
            kicker="C."
            title="Hour x Weekday Delay Heatmap"
            subtitle="Delay risk accumulates through the operating day, with the strongest block on Friday evening and a softer weekend profile."
          >
            <div className="h-full min-h-0">
              <ReactECharts ref={heatmapRef} option={heatmapOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </Panel>

          <Panel
            accent={palette.severe}
            icon={CloudLightning}
            kicker="D."
            title="Weather Contrast Dot Plot"
            subtitle="Severe weather nearly doubles the delay rate and adds roughly fifteen minutes to the average departure delay."
          >
            <div className="h-full min-h-0">
              <ReactECharts ref={weatherRef} option={weatherOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </Panel>
        </div>
      </main>
    </div>
  );
}
