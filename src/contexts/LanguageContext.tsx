import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Language = 'zh' | 'en';

type TranslationValue = string | Record<string, string>;

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
};

const STORAGE_KEY = 'nexus-language';

const translations: Record<Language, Record<string, TranslationValue>> = {
  zh: {
    'app.name': '航班延误分析系统',
    'app.nameEn': 'Nexus Flight Analytics',
    'app.enter': '进入系统',
    'app.launch': '启动分析',
    'app.learnMore': '了解更多',
    'app.scroll': '向下探索',
    'app.footer': '基于 nycflights13 与多年份纽约航班数据 · R 分析 · React + ECharts 可视化',
    'status.loadingData': '正在加载数据...',
    'status.noData': '暂无匹配数据',
    'status.complete': '完成',
    'status.searching': '正在检索...',
    'status.analyzing': '正在分析...',
    'status.backendRequired': 'AI 助手需要 Node/Express 后端代理和服务端密钥。',

    'nav.back': '返回',
    'nav.theme': '主题',
    'nav.language': '语言',
    'nav.filter': '筛选分析',
    'nav.dataset': '多年份航班数据',
    'nav.datasetFallback': 'nycflights13 数据集',

    'tab.overview': '总览',
    'tab.report': '分析报告',
    'tab.time': '时间规律',
    'tab.routes': '航线分析',
    'tab.recovery': '空中追回',
    'tab.airlines': '航司表现',
    'tab.propagation': '延误传导',
    'tab.attribution': '延误归因',
    'tab.explorer': '数据探索',
    'tab.eda': '可视化 EDA',

    'filter.years': '年份',
    'filter.months': '月份',
    'filter.airlines': '航司',
    'filter.origins': '出发机场',
    'filter.destinations': '目的机场',
    'filter.delayLevels': '延误等级',
    'filter.all': '全部',
    'filter.none': '全不选',
    'filter.noOptions': '暂无选项',
    'filter.selected': '已选 {count} 项',
    'filter.only': '仅此项',
    'filter.title': '筛选后重新分析',
    'filter.description': '默认展示 2013 年数据。筛选会同步刷新总览、时间、航线、航司与 EDA 结果。',
    'filter.sample': '当前样本 {count} 条',
    'filter.scope': '筛选影响总览、时间、航线、航司和可视化 EDA；空中追回、传导、归因保留完整建模结果。',
    'filter.reset': '恢复 2013 默认',
    'filter.apply': '应用筛选',

    'explorer.title': '航班明细探索',
    'explorer.searchPlaceholder': '搜索航班号、航司或航线...',
    'explorer.totalRecords': '总记录数',
    'explorer.avgDepDelay': '平均起飞延误',
    'explorer.avgDistance': '平均飞行距离',
    'explorer.airlineCount': '航司数量',
    'explorer.routeCount': '航线数量',
    'explorer.reset': '重置',
    'explorer.search': '搜索',
    'explorer.apply': '应用筛选',
    'explorer.activeFilter': '当前筛选',
    'explorer.hit': '命中',
    'explorer.records': '条',
    'explorer.export': '导出 CSV',
    'explorer.exportAll': '导出全部结果',
    'explorer.exportCurrent': '导出当前页',
    'explorer.exportRange': '导出指定页范围',
    'explorer.page': '页',
    'explorer.pageSize': '每页',
    'explorer.jump': '跳转',
    'explorer.instructions': '数据探索说明',

    'eda.title': '拖拽式 EDA 分析套件',
    'eda.subtitle': '使用字段拖拽槽位快速换图，也可以切换到 Graphic Walker 做自由探索。',
    'eda.limit': '最多加载 {count} 行',
    'eda.sampled': '当前筛选共 {total} 行，已抽样加载 {loaded} 行。',
    'eda.full': '已加载当前筛选下全部 {loaded} 行。',
    'eda.reload': '重新加载',
    'eda.loading': '正在加载 EDA 数据...',
    'eda.error': 'EDA 数据加载失败',

    'assistant.title': 'AI 分析助手',
    'assistant.open': '打开 AI 助手',
    'assistant.close': '关闭 AI 助手',
    'assistant.settings': 'AI 助手设置',
    'assistant.model': '模型',
    'assistant.modelHint': '默认使用服务端配置的 gpt-5.5；也可以输入 Sub2API 支持的兼容模型名。API Key 只保存在 Node/Express 后端。',
    'assistant.modelReset': '恢复服务端默认模型',
    'assistant.placeholder': '询问当前筛选下的延误规律...',
    'assistant.send': '发送',
    'assistant.initial': '我会基于当前页面、筛选条件、聚合指标、nycflights13 样本行和报告上下文回答。Markdown 会按标题、列表、表格渲染，密钥只保存在后端。',
    'assistant.suggestion1': '当前筛选下延误最严重的航司是谁？',
    'assistant.suggestion2': '哪些小时段最容易延误？',
    'assistant.suggestion3': '给我三条运营优化建议。',
    'assistant.missing': 'AI 助手暂时不可用，请确认已通过 Node/Express 后端启动并配置服务端密钥。',
    'assistant.staticBackendRequired': '当前页面是纯静态预览，无法保存服务端密钥或调用 AI。请使用 npm run dev 启动 Node/Express 后端代理。',
    'assistant.serverKeyMissing': '后端代理已启动，但还没有读取到服务端密钥，请检查本地 .env 配置。',
    'assistant.ready': '后端代理已连接',
    'assistant.notReady': '后端代理未就绪',

    'landing.badge': 'nycflights13 数据集 · 2013 年 336,776 条航班记录',
    'landing.copy': '把时间、天气、航司与机场网络放在同一块仪表盘里，追踪延误如何累积、放大并传导。',
    'landing.featuresTitle': '一台解析时间损失的引擎',
    'landing.featuresCopy': '航班不是孤立事件，而是高敏感网络中的节点。系统把运营压力、航线结构、追回能力和风险归因组织成连续的分析体验。',
    'landing.modulesTitle': '九大分析模块',
    'landing.modulesCopy': '从宏观总览到明细记录，从 AI 分析到拖拽式 EDA，全方位探索航班延误规律。',
    'landing.tech': '技术架构',
    'landing.ctaTitle': '准备好深入探索了吗？',
    'landing.ctaCopy': '进入控制台，按小时、目的地、航司和延误等级切分数据。',

    'metric.totalFlights': '总航班数',
    'metric.avgDepDelay': '平均起飞延误',
    'metric.avgArrDelay': '平均到达延误',
    'metric.depOnTimeRate': '起飞准点率',
    'metric.arrOnTimeRate': '到达准点率',
    'metric.severeDelayShare': '严重延误占比',
    'metric.flightCount': '航班量',
    'metric.avgDelay': '平均延误',
    'metric.severeRate': '严重延误率',
    'metric.onTime': '准点',
    'metric.severeDelay': '严重延误',
    'unit.minute': '分钟',
    'unit.mile': '英里',
  },
  en: {
    'app.name': 'Flight Delay Analytics',
    'app.nameEn': 'Nexus Flight Analytics',
    'app.enter': 'Enter Dashboard',
    'app.launch': 'Launch Analysis',
    'app.learnMore': 'Learn More',
    'app.scroll': 'Scroll to Explore',
    'app.footer': 'Built on nycflights13 and multi-year NYC flight data · R analytics · React + ECharts visualization',
    'status.loadingData': 'Loading data...',
    'status.noData': 'No matching data',
    'status.complete': 'Complete',
    'status.searching': 'Searching...',
    'status.analyzing': 'Analyzing...',
    'status.backendRequired': 'The AI assistant requires a Node/Express backend proxy and a server-side key.',

    'nav.back': 'Back',
    'nav.theme': 'Theme',
    'nav.language': 'Language',
    'nav.filter': 'Filter Analysis',
    'nav.dataset': 'Multi-year flight data',
    'nav.datasetFallback': 'nycflights13 dataset',

    'tab.overview': 'Overview',
    'tab.report': 'Report',
    'tab.time': 'Time Patterns',
    'tab.routes': 'Route Analysis',
    'tab.recovery': 'Air Recovery',
    'tab.airlines': 'Airline Performance',
    'tab.propagation': 'Delay Propagation',
    'tab.attribution': 'Delay Attribution',
    'tab.explorer': 'Data Explorer',
    'tab.eda': 'Visual EDA',

    'filter.years': 'Years',
    'filter.months': 'Months',
    'filter.airlines': 'Airlines',
    'filter.origins': 'Origins',
    'filter.destinations': 'Destinations',
    'filter.delayLevels': 'Delay Levels',
    'filter.all': 'All',
    'filter.none': 'None',
    'filter.noOptions': 'No options',
    'filter.selected': '{count} selected',
    'filter.only': 'Only this',
    'filter.title': 'Re-run Analysis With Filters',
    'filter.description': 'The default view uses 2013. Filters refresh Overview, Time, Routes, Airlines, and EDA results.',
    'filter.sample': 'Current sample {count} rows',
    'filter.scope': 'Filters affect Overview, Time, Routes, Airlines, and Visual EDA; Recovery, Propagation, and Attribution keep full-model results.',
    'filter.reset': 'Restore 2013 Default',
    'filter.apply': 'Apply Filters',

    'explorer.title': 'Flight Detail Explorer',
    'explorer.searchPlaceholder': 'Search flight number, airline, route...',
    'explorer.totalRecords': 'Total Records',
    'explorer.avgDepDelay': 'Avg Departure Delay',
    'explorer.avgDistance': 'Avg Distance',
    'explorer.airlineCount': 'Airlines',
    'explorer.routeCount': 'Routes',
    'explorer.reset': 'Reset',
    'explorer.search': 'Search',
    'explorer.apply': 'Apply Filters',
    'explorer.activeFilter': 'Active Filter',
    'explorer.hit': 'Matched',
    'explorer.records': 'rows',
    'explorer.export': 'Export CSV',
    'explorer.exportAll': 'Export All Results',
    'explorer.exportCurrent': 'Export Current Page',
    'explorer.exportRange': 'Export Page Range',
    'explorer.page': 'Page',
    'explorer.pageSize': 'Per page',
    'explorer.jump': 'Go',
    'explorer.instructions': 'Explorer Notes',

    'eda.title': 'Drag-and-Drop EDA Suite',
    'eda.subtitle': 'Drop fields into chart slots for quick switching, or open Graphic Walker for free-form exploration.',
    'eda.limit': 'Load up to {count} rows',
    'eda.sampled': 'Current filter has {total} rows; loaded sampled {loaded} rows.',
    'eda.full': 'Loaded all {loaded} rows under the current filter.',
    'eda.reload': 'Reload',
    'eda.loading': 'Loading EDA data...',
    'eda.error': 'Failed to load EDA data',

    'assistant.title': 'AI Analysis Assistant',
    'assistant.open': 'Open AI assistant',
    'assistant.close': 'Close AI assistant',
    'assistant.settings': 'AI assistant settings',
    'assistant.model': 'Model',
    'assistant.modelHint': 'Defaults to the server-configured gpt-5.5. You can enter any Sub2API-compatible model name. The API key stays on the Node/Express backend.',
    'assistant.modelReset': 'Restore server default model',
    'assistant.placeholder': 'Ask about the current filtered delay pattern...',
    'assistant.send': 'Send',
    'assistant.initial': 'I answer from the current page, filters, aggregate metrics, nycflights13 sample rows, and report context. Markdown is rendered as headings, lists, and tables; the key stays on the backend.',
    'assistant.suggestion1': 'Which airline has the worst delay under current filters?',
    'assistant.suggestion2': 'Which hours are most delay-prone?',
    'assistant.suggestion3': 'Give me three operational recommendations.',
    'assistant.missing': 'The AI assistant is unavailable. Confirm the Node/Express backend is running with a server-side key.',
    'assistant.staticBackendRequired': 'This is a static preview, so it cannot store a server-side key or call AI. Start the Node/Express backend with npm run dev.',
    'assistant.serverKeyMissing': 'The backend proxy is running, but no server-side key was loaded. Check the local .env file.',
    'assistant.ready': 'Backend proxy connected',
    'assistant.notReady': 'Backend proxy not ready',

    'landing.badge': 'nycflights13 dataset · 336,776 flights in 2013',
    'landing.copy': 'Put time, weather, airlines, and airport networks into one analytical cockpit to trace how delay accumulates, amplifies, and propagates.',
    'landing.featuresTitle': 'An Engine for Lost Time',
    'landing.featuresCopy': 'Flights are not isolated events. They are nodes in a sensitive network, and this system connects pressure, route structure, recovery, and attribution into one continuous analysis experience.',
    'landing.modulesTitle': 'Nine Analysis Modules',
    'landing.modulesCopy': 'Move from macro dashboards to row-level records, AI analysis, and drag-and-drop EDA.',
    'landing.tech': 'Technology Stack',
    'landing.ctaTitle': 'Ready to Explore Deeper?',
    'landing.ctaCopy': 'Enter the control room and slice data by hour, destination, airline, and delay level.',

    'metric.totalFlights': 'Total Flights',
    'metric.avgDepDelay': 'Avg Departure Delay',
    'metric.avgArrDelay': 'Avg Arrival Delay',
    'metric.depOnTimeRate': 'Departure On-time Rate',
    'metric.arrOnTimeRate': 'Arrival On-time Rate',
    'metric.severeDelayShare': 'Severe Delay Share',
    'metric.flightCount': 'Flight Count',
    'metric.avgDelay': 'Avg Delay',
    'metric.severeRate': 'Severe Delay Rate',
    'metric.onTime': 'On-time',
    'metric.severeDelay': 'Severe Delay',
    'unit.minute': 'min',
    'unit.mile': 'mi',
  },
};

function formatTemplate(value: string, params?: Record<string, string | number>) {
  if (!params) return value;
  return Object.entries(params).reduce(
    (text, [key, replacement]) => text.replaceAll(`{${key}}`, String(replacement)),
    value,
  );
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'en' ? 'en' : 'zh';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  }, [language]);

  const value = useMemo<LanguageContextType>(() => ({
    language,
    setLanguage,
    toggleLanguage: () => setLanguage((current) => (current === 'zh' ? 'en' : 'zh')),
    t: (key, fallback) => {
      const raw = translations[language][key] ?? translations.zh[key] ?? fallback ?? key;
      return typeof raw === 'string' ? raw : fallback ?? key;
    },
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}

export function useTemplate() {
  const { t } = useLanguage();
  return (key: string, params?: Record<string, string | number>, fallback?: string) =>
    formatTemplate(t(key, fallback), params);
}
