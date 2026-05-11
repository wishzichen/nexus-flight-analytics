# Nexus Flight Analytics - 项目结构文档

<div align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript)
![R](https://img.shields.io/badge/R-4.x-276DC3?style=flat-square&logo=r)
![ECharts](https://img.shields.io/badge/ECharts-6.0-AA344D?style=flat-square)
![License](https://img.shields.io/badge/License-Apache--2.0-green?style=flat-square)

**航班延误分析系统** | 航班数据可视化平台

</div>

---

## 📁 项目目录结构

```
nexus-flight-analytics/
│
├── 📂 .claude/                      # Claude AI 配置目录
│
├── 📂 data/                         # 分析结果数据 (JSON)
│   │
│   ├── airlines_info.json           # 航司信息数据
│   ├── airports_info.json           # 机场信息数据
│   ├── flights_enriched.rds         # 原始航班数据 (RDS格式)
│   │
│   ├── 📂 module1/                  # 总览仪表板数据
│   │   └── dashboard.json           # 仪表板统计数据
│   │
│   ├── 📂 module2/                  # 时间规律分析数据
│   │   └── time_analysis.json       # 时间维度分析结果
│   │
│   ├── 📂 module3/                  # 航线分析数据
│   │   └── route_analysis.json      # 航线延误排名数据
│   │
│   ├── 📂 module4/                  # 空中追回分析数据
│   │   └── recovery_analysis.json   # 延误追回能力分析
│   │
│   ├── 📂 module5/                  # 航司表现分析数据
│   │   └── airline_analysis.json    # 航司准点率分析
│   │
│   ├── 📂 module6/                  # 延误传导分析数据
│   │   └── propagation_analysis.json # 延误传导效应分析
│   │
│   ├── 📂 module7/                  # 延误归因分析数据
│   │   └── attribution_analysis.json # 延误因素归因分析
│   │
│   └── 📂 module8/                  # 数据探索数据
│       ├── explorer_data.json       # 筛选选项和摘要数据
│       └── page_*.json             # 分页航班数据 (10个文件)
│
├── 📂 scripts/                      # R 语言数据分析脚本
│   │
│   ├── 01_data_preparation.R       # 数据准备脚本 (清洗、转换)
│   ├── 02_module1_dashboard.R      # 总览仪表板分析
│   ├── 03_module2_time.R           # 时间规律分析
│   ├── 04_module3_routes.R         # 航线分析
│   ├── 05_module4_recovery.R       # 空中追回分析
│   ├── 06_module5_airlines.R        # 航司表现分析
│   ├── 07_module6_propagation.R    # 延误传导分析
│   ├── 08_module7_attribution.R    # 延误归因分析
│   ├── 09_module8_explorer.R       # 数据探索预处理
│   ├── run_all_analyses.R          # 一键运行全部脚本
│   │
│   └── 📂 data/                    # 脚本运行时使用的数据副本
│       ├── airlines_info.json
│       ├── airports_info.json
│       ├── flights_enriched.rds
│       └── 📂 module*              # 各模块数据副本
│
├── 📂 src/                         # React 前端源代码
│   │
│   ├── components/                  # 通用组件
│   │   │
│   │   ├── charts/                 # 图表组件
│   │   │   └── KPICard.tsx         # KPI 指标卡片
│   │   │
│   │   ├── common/                 # 通用组件
│   │   │   └── DataError.tsx       # 数据错误提示
│   │   │
│   │   └── layout/                 # 布局组件
│   │       ├── FilterBar.tsx       # 筛选栏组件
│   │       └── TabNav.tsx          # 导航标签组件
│   │
│   ├── hooks/                       # React Hooks
│   │   └── useModuleData.ts        # 数据获取自定义 Hook
│   │
│   ├── modules/                     # 分析模块组件 (8个模块)
│   │   │
│   │   ├── Module1Dashboard.tsx    # 📊 总览仪表板
│   │   ├── Module2TimeAnalysis.tsx # 🕐 时间规律分析
│   │   ├── Module3RouteAnalysis.tsx # 🗺️ 航线分析
│   │   ├── Module4AirRecovery.tsx  # ✈️ 空中追回分析
│   │   ├── Module5AirlineAnalysis.tsx # 🏢 航司表现分析
│   │   ├── Module6DelayPropagation.tsx # 🔗 延误传导分析
│   │   ├── Module7Attribution.tsx  # 🎯 延误归因分析
│   │   └── Module8DataExplorer.tsx  # 🔍 数据探索 (已优化 ✨)
│   │
│   ├── pages/                       # 页面组件
│   │   ├── Dashboard.tsx            # 仪表板页面
│   │   └── LandingPage.tsx         # 落地页
│   │
│   ├── types/                       # TypeScript 类型定义
│   │   └── index.ts                # 全局类型声明
│   │
│   ├── App.tsx                      # React 根组件
│   ├── main.tsx                     # 入口文件
│   └── index.css                    # 全局样式 (TailwindCSS)
│
├── 📂 docs/                        # 项目文档
│   └── project-structure.md        # 项目结构说明
│
├── 📂 plans/                       # 设计文档
│   └── optimization-plan.md        # 优化方案文档
│
├── .env.example                    # 环境变量示例
├── .gitignore                      # Git 忽略规则
├── index.html                      # HTML 入口
├── metadata.json                   # 项目元数据
├── package.json                    # 项目依赖配置
├── package-lock.json               # 依赖锁定文件
├── README.md                       # 项目说明文档
├── server.ts                       # Express 服务器 (TypeScript)
├── simple-server.mjs               # Express 服务器 (JavaScript)
├── start.mjs                       # 启动脚本 (JavaScript)
├── start.ts                        # 启动脚本 (TypeScript)
├── tsconfig.json                   # TypeScript 配置
└── vite.config.ts                  # Vite 构建配置
```

---

## 📊 模块功能说明

### 数据模块 (data/)

| 模块 | 文件 | 功能描述 |
|:---|:---|:---|
| 模块1 | `dashboard.json` | 总览统计：总记录数、平均延误、航司数量、航线数量等 |
| 模块2 | `time_analysis.json` | 时间规律：按小时/月份/星期分析延误趋势 |
| 模块3 | `route_analysis.json` | 航线分析：目的地延误排名、热门航线统计 |
| 模块4 | `recovery_analysis.json` | 空中追回：高延误航班到达延误恢复分析 |
| 模块5 | `airline_analysis.json` | 航司表现：准点率、机队规模、延误分布 |
| 模块6 | `propagation_analysis.json` | 延误传导：同飞机延误传导链式反应分析 |
| 模块7 | `attribution_analysis.json` | 延误归因：机龄、天气、机场等影响因素权重 |
| 模块8 | `explorer_data.json` + `page_*.json` | 数据探索：筛选选项、摘要统计、分页数据 |

### 源码模块 (src/modules/)

| 组件 | 功能 |
|:---|:---|
| `Module1Dashboard` | 展示总览KPI指标、时间热力图、延误分布概览 |
| `Module2TimeAnalysis` | 24小时延误趋势、月份延误热力、星期模式分析 |
| `Module3RouteAnalysis` | 目的地延误排名、航线风险气泡图 |
| `Module4AirRecovery` | 起飞延误 vs 到达延误散点图、追回能力箱线图 |
| `Module5AirlineAnalysis` | 航司准点率对比、机队年龄分析 |
| `Module6DelayPropagation` | Sankey图展示延误传导链路 |
| `Module7Attribution` | 延误因素雷达图、特征重要性分析 |
| `Module8DataExplorer` | 航班明细表、多条件筛选、智能搜索、数据导出 |

---

## 🔧 技术栈

```
┌─────────────────────────────────────────────────────────────┐
│                        前端层                                │
│  ┌─────────┐  ┌───────────┐  ┌──────────┐  ┌─────────────┐  │
│  │ React   │  │ TypeScript │  │ TailwindCSS │  │ ECharts     │  │
│  │ 19.x    │  │ 5.8        │  │ 3.x        │  │ 6.x         │  │
│  └─────────┘  └───────────┘  └──────────┘  └─────────────┘  │
│                                                             │
│                        API 层                               │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │ Express.js      │    │ Vite Dev Server  │                 │
│  │ (simple-server)  │    │ (开发服务器)      │                 │
│  └─────────────────┘    └─────────────────┘                 │
│                                                             │
│                        数据层                               │
│  ┌─────────┐    ┌───────────┐  ┌─────────────────────────┐ │
│  │ R 4.x   │    │ nycflights13 │ │ JSON 数据文件            │ │
│  │ (分析)   │    │ (数据源)     │ │ (data/ 模块)            │ │
│  └─────────┘    └───────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 API 接口

### Module8 数据探索接口

| 接口 | 方法 | 参数 | 说明 |
|:---|:---:|:---|:---|
| `/api/module8/summary` | GET | - | 获取统计摘要 |
| `/api/module8/search` | GET | q, airline, destination, delayLevel, page, pageSize | 搜索筛选航班 |
| `/api/module8/export` | GET | q, airline, destination, delayLevel, exportMode | 导出 CSV |
| `/api/module8/airline-options` | GET | - | 获取航司筛选选项 |
| `/api/module8/dest-options` | GET | - | 获取目的地筛选选项 |
| `/api/module8/delay-level-options` | GET | - | 获取延误等级选项 |

### 其他模块接口

| 接口 | 方法 | 说明 |
|:---|:---:|:---|
| `/api/module1/*` | GET | 总览仪表板数据 |
| `/api/module2/*` | GET | 时间规律分析数据 |
| `/api/module3/*` | GET | 航线分析数据 |
| `/api/module4/*` | GET | 空中追回分析数据 |
| `/api/module5/*` | GET | 航司表现分析数据 |
| `/api/module6/*` | GET | 延误传导分析数据 |
| `/api/module7/*` | GET | 延误归因分析数据 |

---

## 🚀 快速启动

```bash
# 1. 安装依赖
npm install

# 2. 生成分析数据 (需要 R 环境)
cd scripts && Rscript run_all_analyses.R

# 3. 启动开发服务器
cd .. && npm run dev

# 4. 访问 http://localhost:3000
```

---

## 📝 版本历史

| 版本 | 日期 | 更新内容 |
|:---|:---|:---|
| v4.0 | 2026-04-23 | 数据探索全面优化：检索按钮、搜索增强、导出菜单优化 |
| v3.0 | 2026-04-22 | UI体验优化：动态按钮、状态提示、加载动画 |
| v2.0 | 2026-04-21 | 核心功能完善：搜索框、确认筛选、重置、灵活导出 |
| v1.0 | 2026-04-20 | 初始版本：8个分析模块基础功能 |

---

<div align="center">

**Made with ❤️ for flight delay analysis**

</div>
