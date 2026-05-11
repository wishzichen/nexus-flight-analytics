import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Plane, AlertTriangle, Clock, CheckCircle, TrendingUp, MapPin
} from 'lucide-react';
import KPICard from '../components/charts/KPICard';
import { useFetch } from '../hooks/useModuleData';
import DataError from '../components/common/DataError';

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

export default function Module1Dashboard() {
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

  // 小时延误趋势图配置
  const hourlyOption = {
    ...chartBaseOptions,
    tooltip: { ...chartBaseOptions.tooltip, trigger: 'axis' },
    xAxis: {
      ...chartBaseOptions.xAxis,
      type: 'category',
      boundaryGap: false,
      data: hourlyTrend?.map((d: any) => `${d.hour}:00`) || []
    },
    yAxis: { ...chartBaseOptions.yAxis, type: 'value', name: '平均延误(分钟)' },
    series: [{
      data: hourlyTrend?.map((d: any) => d.avgDepDelay) || [],
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
    xAxis: { ...chartBaseOptions.yAxis, type: 'value', name: '航班量' },
    yAxis: {
      ...chartBaseOptions.xAxis,
      type: 'category',
      data: [...(topDestinations || [])].reverse().map((d: any) => d.dest)
    },
    series: [{
      type: 'bar',
      data: [...(topDestinations || [])].reverse().map((d: any) => d.flightCount),
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
        const hour = params.data[0];
        const weekday = params.data[1];
        const delay = params.data[2];
        return `<div style="padding: 4px 8px;">
          <div style="font-weight: 600; margin-bottom: 4px; color: #38bdf8;">${weekday} ${hour}:00</div>
          <div>平均延误: <span style="color: #fbbf24; font-weight: 600;">${delay.toFixed(1)}</span> 分钟</div>
        </div>`;
      }
    },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 19 }, (_, i) => i + 5),
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
        formatter: (value: number) => value
      },
      axisTick: {
        show: false
      }
    },
    yAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
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
      text: ['严重延误', '准点'],
      textGap: 15,
      precision: 0
    },
    series: [{
      type: 'heatmap',
      data: heatmap?.map((d: any) => [d.hour, d.weekdayName, d.avgDelay || 0]) || [],
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
      data: ontimePie?.map((d: any) => ({ value: d.count, name: d.category })) || [],
      color: ['#10b981', '#06b6d4', '#fbbf24', '#f97316', '#ef4444']
    }]
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-cyan-400 animate-pulse">正在加载数据...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI 卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          title="总航班数"
          value={summary?.totalFlights?.toLocaleString() || '--'}
          icon={Plane}
          color="cyan"
        />
        <KPICard
          title="平均起飞延误"
          value={`${summary?.avgDepDelay || '--'}分钟`}
          icon={Clock}
          color="orange"
        />
        <KPICard
          title="平均到达延误"
          value={`${summary?.avgArrDelay || '--'}分钟`}
          icon={Clock}
          color="purple"
        />
        <KPICard
          title="起飞准点率"
          value={`${summary?.depOnTimeRate || '--'}%`}
          icon={CheckCircle}
          color="green"
        />
        <KPICard
          title="到达准点率"
          value={`${summary?.arrOnTimeRate || '--'}%`}
          icon={CheckCircle}
          color="green"
        />
        <KPICard
          title="重度延误占比"
          value={`${summary?.severeDelayRate || '--'}%`}
          subtitle="延误>60分钟"
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 全天延误趋势 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            全天延误趋势
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            观察延误随时间累积的规律，下午和晚间延误明显加剧
          </p>
          <div className="h-[300px]">
            <ReactECharts option={hourlyOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 最繁忙目的地 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-purple-400" />
            最繁忙目的地 Top 10
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            从纽约三大机场出发的热门目的地航班量排名
          </p>
          <div className="h-[300px]">
            <ReactECharts option={destOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 小时×星期热力图 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-400" />
            时间热力图
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            小时×星期的延误分布，识别高风险时段
          </p>
          <div className="h-[300px]">
            <ReactECharts option={heatmapOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 准点率分布 */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            延误等级分布
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            航班延误程度的整体分布情况
          </p>
          <div className="h-[300px]">
            <ReactECharts option={pieOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>

      {/* 关键结论 */}
      <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-cyan-500">
        <h3 className="text-lg font-medium text-slate-100 mb-3">关键结论</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-300">
          <div className="flex items-start gap-2">
            <span className="text-cyan-400">•</span>
            <span>整体延误水平中等，平均起飞延误约{summary?.avgDepDelay || 12}分钟</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-400">•</span>
            <span>下午18-21点为延误高峰时段，建议错峰出行</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-400">•</span>
            <span>ORD(芝加哥)、ATL(亚特兰大)为最繁忙目的地</span>
          </div>
        </div>
      </div>
    </div>
  );
}
