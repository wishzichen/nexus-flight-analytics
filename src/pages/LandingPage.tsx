import { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart2,
  Building,
  ChevronDown,
  Clock,
  Database,
  GitBranch,
  Map,
  PieChart,
  Plane,
  Radar,
  ShieldAlert,
  Sparkles,
  Table,
  Waypoints,
} from 'lucide-react';
import ThemeToggle from '../components/common/ThemeToggle';
import LanguageToggle from '../components/common/LanguageToggle';
import { useLanguage } from '../contexts/LanguageContext';
import { scheduleDashboardPreload } from '../lib/preloadData';

const ParticleBackground = () => (
  <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-60">
    <div className="radar-circle" style={{ width: 600, height: 600, top: 100, left: -140 }} />
    <div className="radar-circle animation-delay-200" style={{ width: 420, height: 420, top: 210, left: -10 }} />
    <div className="radar-circle animation-delay-500" style={{ width: 220, height: 220, top: 310, left: 90 }} />
    <div className="absolute left-0 top-0 h-px w-full bg-cyan-500/20 shadow-[0_0_22px_rgba(6,182,212,0.45)]" />
  </div>
);

const modules = [
  { labelKey: 'tab.overview', icon: BarChart2, color: 'text-cyan-400' },
  { labelKey: 'tab.time', icon: Clock, color: 'text-purple-400' },
  { labelKey: 'tab.routes', icon: Map, color: 'text-orange-400' },
  { labelKey: 'tab.recovery', icon: Plane, color: 'text-green-400' },
  { labelKey: 'tab.airlines', icon: Building, color: 'text-blue-400' },
  { labelKey: 'tab.propagation', icon: GitBranch, color: 'text-red-400' },
  { labelKey: 'tab.attribution', icon: PieChart, color: 'text-pink-400' },
  { labelKey: 'tab.explorer', icon: Table, color: 'text-indigo-400' },
  { labelKey: 'tab.eda', icon: Activity, color: 'text-teal-400' },
];

const copy = {
  zh: {
    eyebrow: 'Nexus Flight Analytics',
    h1Top: '航班延误',
    h1Mid: '不是偶然。',
    h1Bottom: '它是一套系统。',
    subhead: '从 2013 年 nycflights13 到多年份纽约航班明细，系统把延误的时间结构、航线网络、航司差异、空中追回、传导链路与归因模型放到同一条分析路径里。',
    dataReady: '数据正在预加载',
    dataReadySub: '进入系统后默认分析无需重新等待',
    statRecords: '航班记录',
    statRoutes: '航线网络',
    statAirlines: '航司画像',
    statModules: '分析模块',
    promiseTitle: '像打开一台精密设备一样进入数据',
    promiseCopy: '首页负责说明问题，控制台负责回答问题。你可以从宏观指标切到航线、航司、时段、归因，再进入可拖拽 EDA，自由组合字段验证直觉。',
    capability1: '默认数据预热',
    capability1Copy: '首页空闲时提前请求筛选项和 2013 默认分析，减少首次进入控制台的等待。',
    capability2: '网络化延误视角',
    capability2Copy: '延误被拆成小时、星期、航线、航司、机场与严重等级，便于追踪压力从哪里开始扩散。',
    capability3: 'AI + EDA 联动',
    capability3Copy: 'AI 助手读当前筛选上下文，EDA 则允许用拖拽槽位快速换图并继续自由探索。',
    storyTitle: '从一个航班，到一整张运行网络',
    storyCopy: '系统不是堆图表，而是把分析问题排成路径：先看总体水平，再定位时段和目的地，随后比较航司恢复能力，最后用归因与 EDA 验证机制。',
    flow: ['采集与清洗', '指标聚合', '交互筛选', '图形探索', 'AI 解释'],
    moduleTitle: '九个模块，一条连续分析线',
    moduleCopy: '每个模块都能回答一个明确问题，也能把结果传递给下一步探索。',
    ctaCopy: '进入控制台后，默认 2013 数据、筛选项和核心图表会尽量直接可用。',
  },
  en: {
    eyebrow: 'Nexus Flight Analytics',
    h1Top: 'Flight delay',
    h1Mid: 'is not random.',
    h1Bottom: 'It is a system.',
    subhead: 'From nycflights13 to multi-year NYC flight records, the experience connects time structure, route networks, airline differences, air recovery, propagation, and attribution.',
    dataReady: 'Data is preloading',
    dataReadySub: 'Default dashboard data is warmed before entry',
    statRecords: 'Flight records',
    statRoutes: 'Route network',
    statAirlines: 'Airline profiles',
    statModules: 'Analysis modules',
    promiseTitle: 'Enter the data like a precision instrument',
    promiseCopy: 'The landing page frames the question; the dashboard answers it. Move from metrics to routes, airlines, periods, attribution, and drag-and-drop EDA.',
    capability1: 'Default data warmup',
    capability1Copy: 'While the landing page is idle, filters and the 2013 default analysis are requested ahead of time.',
    capability2: 'Network delay lens',
    capability2Copy: 'Delay is broken into hour, weekday, route, airline, airport, and severity so pressure can be traced.',
    capability3: 'AI plus EDA',
    capability3Copy: 'The assistant reads current filters, while EDA slots let you switch charts quickly and explore freely.',
    storyTitle: 'From one flight to an operating network',
    storyCopy: 'This is not a pile of charts. It is a path: read the baseline, locate periods and destinations, compare recovery, then validate mechanisms with attribution and EDA.',
    flow: ['Collect', 'Aggregate', 'Filter', 'Explore', 'Explain'],
    moduleTitle: 'Nine modules, one continuous analysis line',
    moduleCopy: 'Each module answers a clear question and carries context into the next exploration step.',
    ctaCopy: 'When you enter the dashboard, default 2013 data, filters, and core charts are warmed whenever possible.',
  },
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const local = copy[language];
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 100]);

  useEffect(() => {
    scheduleDashboardPreload();
  }, []);

  const stats = [
    { title: local.statRecords, value: '590,092', icon: Database, color: 'text-cyan-400' },
    { title: local.statRoutes, value: '233', icon: Waypoints, color: 'text-orange-400' },
    { title: local.statAirlines, value: '16', icon: Plane, color: 'text-green-400' },
    { title: local.statModules, value: '9', icon: Activity, color: 'text-purple-400' },
  ];

  const capabilities = [
    { title: local.capability1, copy: local.capability1Copy, icon: Sparkles },
    { title: local.capability2, copy: local.capability2Copy, icon: Radar },
    { title: local.capability3, copy: local.capability3Copy, icon: ShieldAlert },
  ];

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-x-hidden bg-grid font-sans text-[var(--page-ink)]">
      <ParticleBackground />
      <nav className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-white/10 bg-slate-950/80 px-6 py-4 backdrop-blur-md md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500">
            <Plane className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 w-44 sm:w-64">
            <span className="block truncate font-bold tracking-tight text-white">{t('app.name')}</span>
            <span className="hidden text-sm text-slate-500 md:inline">{t('app.nameEn')}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <ThemeToggle />
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="hidden items-center gap-2 rounded-lg bg-cyan-500 px-5 py-2.5 font-semibold text-slate-950 transition-colors hover:bg-cyan-400 sm:flex"
          >
            {t('app.enter')} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </nav>

      <motion.section
        style={{ opacity: heroOpacity, y: heroY }}
        className="landing-hero relative z-10 flex min-h-[92vh] items-center overflow-hidden px-6 pt-24"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(2,6,23,0.96) 0%, rgba(2,6,23,0.80) 38%, rgba(2,6,23,0.30) 100%), url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2200&auto=format&fit=crop')",
          }}
        />
        <div className="pointer-events-none absolute right-[7%] top-[20%] hidden h-[380px] w-[380px] opacity-80 lg:block">
          <span className="radar-circle inset-0" />
          <span className="radar-circle inset-10 animation-delay-200" />
          <span className="radar-circle inset-20 animation-delay-500" />
          <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.9)]" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-7xl pb-20">
          <div className="max-w-5xl">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              {local.eyebrow}
            </div>
            <h1 className="mb-8 text-5xl font-light leading-[0.96] tracking-normal md:text-7xl lg:text-8xl">
              {local.h1Top}
              <br />
              <span className="text-slate-300">{local.h1Mid}</span>
              <br />
              <span className="font-bold text-cyan-300">{local.h1Bottom}</span>
            </h1>
            <p className="mb-10 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
              {local.subhead}
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-3 rounded-xl bg-cyan-500 px-8 py-3.5 font-bold text-slate-950 transition-colors hover:bg-cyan-400"
              >
                {t('app.launch')} <ArrowRight className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="rounded-xl border border-white/20 px-8 py-3.5 font-medium text-white transition-colors hover:bg-white/10"
              >
                {t('app.learnMore')}
              </button>
            </div>
            <div className="mt-10 flex max-w-xl items-center gap-3 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
              <LoaderDot />
              <div>
                <div className="font-semibold">{local.dataReady}</div>
                <div className="text-xs text-cyan-100/70">{local.dataReadySub}</div>
              </div>
            </div>
          </div>
        </div>
        <motion.button
          type="button"
          onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-cyan-200/90 transition-colors hover:text-cyan-100"
          aria-label={t('app.scroll')}
        >
          <span>{t('app.scroll')}</span>
          <span className="relative flex h-10 w-6 items-start justify-center rounded-full border border-cyan-300/50 p-1.5">
            <span className="h-2 w-1 rounded-full bg-cyan-300 animate-bounce" />
          </span>
          <ChevronDown className="h-4 w-4 animate-bounce" />
        </motion.button>
      </motion.section>

      <section id="features" className="bg-slate-950 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-end">
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-400">{t('landing.featuresTitle')}</p>
              <h2 className="max-w-4xl text-3xl font-bold leading-tight md:text-5xl">{local.promiseTitle}</h2>
            </div>
            <p className="text-lg leading-8 text-slate-400">{local.promiseCopy}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.title} className="glass-panel rounded-xl p-5">
                <stat.icon className={`mb-4 h-7 w-7 ${stat.color}`} />
                <div className="mb-1 text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.title}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3">
          {capabilities.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: index * 0.08 }}
              className="glass-panel rounded-xl p-6"
            >
              <item.icon className="mb-5 h-8 w-8 text-cyan-400" />
              <h3 className="mb-3 text-xl font-semibold text-white">{item.title}</h3>
              <p className="text-sm leading-7 text-slate-400">{item.copy}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-slate-950 px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <h2 className="mb-5 text-3xl font-bold md:text-5xl">{local.storyTitle}</h2>
            <p className="text-lg leading-8 text-slate-400">{local.storyCopy}</p>
          </div>
          <div className="glass-panel rounded-xl p-5">
            <div className="grid gap-3 sm:grid-cols-5">
              {local.flow.map((step, index) => (
                <div key={step} className="rounded-lg border border-white/10 bg-slate-900/50 p-4 text-center">
                  <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/15 text-sm font-bold text-cyan-300">
                    {index + 1}
                  </div>
                  <div className="text-sm font-medium text-slate-200">{step}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">{local.moduleTitle}</h2>
            <p className="text-slate-400">{local.moduleCopy}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-9">
            {modules.map((mod) => (
              <button
                key={mod.labelKey}
                type="button"
                onClick={() => navigate('/dashboard')}
                className="glass-panel group rounded-xl p-4 text-center transition-colors hover:border-cyan-500/30"
              >
                <mod.icon className={`mx-auto mb-3 h-7 w-7 ${mod.color} transition-transform group-hover:scale-105`} />
                <h3 className="text-sm font-semibold text-white">{t(mod.labelKey)}</h3>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-3xl font-bold md:text-5xl">{t('landing.ctaTitle')}</h2>
          <p className="mb-10 text-lg leading-8 text-slate-400">{local.ctaCopy}</p>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-3 rounded-xl bg-cyan-500 px-10 py-4 text-lg font-bold text-slate-950 transition-colors hover:bg-cyan-400"
          >
            {t('app.enter')} <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 text-center text-sm text-slate-600">
        {t('app.footer')}
      </footer>
    </div>
  );
}

function LoaderDot() {
  return (
    <span className="relative flex h-3 w-3 shrink-0">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-60" />
      <span className="relative inline-flex h-3 w-3 rounded-full bg-cyan-300" />
    </span>
  );
}
