# ✈️ Nexus Flight Analytics

<div align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript)
![R](https://img.shields.io/badge/R-4.x-276DC3?style=flat-square&logo=r)
![ECharts](https://img.shields.io/badge/ECharts-6.0-AA344D?style=flat-square)
![License](https://img.shields.io/badge/License-Apache--2.0-green?style=flat-square)

**延误是一个系统，而非意外。**
*解码时间、天气与运营压力的连锁反应*

</div>

---

## 📑 目录

- [✨ 功能特性](#-功能特性)
- [🚀 快速开始](#-快速开始)
- [🗂️ 项目结构](#🗂️-项目结构)
- [📊 数据说明](#📊-数据说明)
- [🏗️ 技术架构](#🏗️-技术架构)
- [🤝 贡献指南](#-贡献指南)
- [📄 许可证](#-许可证)

---

## ✨ 功能特性

### 8 大分析模块

| 模块 | 名称 | 功能描述 | 可视化图表 |
|:---:|:---|:---|:---|
| 📊 | 总览仪表板 | 全局延误概况、KPI 指标、时间热力图 | KPI 卡片、环形图、热力图 |
| 🕐 | 时间规律 | 24 小时/月份/星期延误趋势分析 | 折线图、面积图、柱状图 |
| 🗺️ | 航线分析 | 目的地延误排名、航线风险评估 | 条形图、气泡图 |
| ✈️ | 空中追回 | 高延误航班的追回能力分析 | 散点图、箱线图 |
| 🏢 | 航司表现 | 航司准点率、机队规模对比分析 | 气泡图、象限图 |
| 🔗 | 延误传导 | 同机延误传导效应分析 | Sankey 图、折线图 |
| 🎯 | 延误归因 | 机龄 vs 天气因素影响分析 | 雷达图、特征重要性图 |
| 🔍 | 数据探索 | 航班明细数据查询、筛选与灵活导出 | 数据表、筛选器、搜索框、导出菜单 |

### 核心能力

- 🎨 **现代化界面** - 暗黑主题、流畅动画、专业数据可视化
- 🔄 **实时筛选** - 支持多条件组合筛选，快速定位目标数据
- 🔍 **智能搜索** - 支持航班号、航司、航线关键词搜索
- 📥 **灵活导出** - 支持导出所有结果、当前页、自定义页数范围
- 📱 **响应式设计** - 适配桌面和移动设备

---

## 🚀 快速开始

### 环境要求

- Node.js ≥ 18.0.0
- npm ≥ 9.0.0
- R ≥ 4.0.0

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/your-repo/nexus-flight-analytics.git
cd nexus-flight-analytics

# 2. 安装前端依赖
npm install

# 3. 安装 R 包 (在 R 控制台中运行)
R
install.packages(c("nycflights13", "jsonlite", "dplyr", "lubridate", "tidyr"))
q()
```

### 数据准备

```bash
# 生成分析数据 (约需 2-3 分钟)
cd scripts
Rscript run_all_analyses.R
```

### 启动服务

```bash
# 返回项目根目录
cd ..

# 启动开发服务器
npm run dev
```

访问 **http://localhost:3000** 查看系统。

---

## 🗂️ 项目结构

```
nexus-flight-analytics/
├── 📁 data/                      # 分析数据 (JSON)
│   ├── module1/                  # 总览仪表板数据
│   ├── module2/                  # 时间规律分析数据
│   ├── module3/                  # 航线分析数据
│   ├── module4/                  # 空中追回分析数据
│   ├── module5/                  # 航司表现分析数据
│   ├── module6/                  # 延误传导分析数据
│   ├── module7/                  # 延误归因分析数据
│   └── module8/                  # 数据探索数据
│
├── 📁 scripts/                   # R 语言分析脚本
│   ├── 01_data_preparation.R     # 数据准备
│   ├── 02_module1_dashboard.R   # 模块1分析
│   ├── 03_module2_time.R        # 模块2分析
│   ├── 04_module3_routes.R      # 模块3分析
│   ├── 05_module4_recovery.R    # 模块4分析
│   ├── 06_module5_airlines.R    # 模块5分析
│   ├── 07_module6_propagation.R # 模块6分析
│   ├── 08_module7_attribution.R # 模块7分析
│   ├── 09_module8_explorer.R    # 模块8分析
│   └── run_all_analyses.R       # 一键运行全部
│
├── 📁 src/                       # 前端源代码
│   ├── 📁 components/           # 通用组件
│   │   ├── charts/              # 图表组件
│   │   ├── common/             # 通用组件
│   │   ├── layout/            # 布局组件
│   │   └── tables/            # 表格组件
│   │
│   ├── 📁 hooks/               # React Hooks
│   │   └── useModuleData.ts   # 数据获取
│   │
│   ├── 📁 modules/             # 分析模块组件
│   │   ├── Module1Dashboard.tsx
│   │   ├── Module2TimeAnalysis.tsx
│   │   ├── Module3RouteAnalysis.tsx
│   │   ├── Module4AirRecovery.tsx
│   │   ├── Module5AirlineAnalysis.tsx
│   │   ├── Module6DelayPropagation.tsx
│   │   ├── Module7Attribution.tsx
│   │   └── Module8DataExplorer.tsx  ← 数据探索 (已优化)
│   │
│   ├── 📁 pages/               # 页面组件
│   ├── 📁 types/               # TypeScript 类型
│   ├── App.tsx                # 根组件
│   ├── main.tsx               # 入口文件
│   └── index.css              # 全局样式
│
├── 📁 docs/                    # 文档
│   └── project-structure.md    # 项目结构说明
│
├── 📁 plans/                   # 设计文档
│   └── optimization-plan.md    # 优化方案
│
├── server.ts                   # Express 服务器 (TypeScript)
├── simple-server.mjs          # Express 服务器 (JavaScript)
├── package.json               # 项目依赖
├── tsconfig.json              # TypeScript 配置
└── vite.config.ts             # Vite 构建配置
```

---

## 📊 数据说明

### 数据源

使用 **nycflights13** 数据集，包含 2013 年从纽约三大机场（JFK、EWR、LGA）出发的航班数据。

### 数据规模

| 指标 | 数值 |
|:---|---:|
| 总航班记录 | **336,776** 条 |
| 航空公司 | **16** 家 |
| 目的地机场 | **105** 个 |
| 数据字段 | **19** 个 |
| 时间跨度 | 2013 年全年 |

### 数据字段

| 字段 | 说明 | 示例 |
|:---|:---|:---|
| date | 航班日期 | 2013-01-01 |
| carrier | 航司代码 | AA, UA, DL |
| flight | 航班号 | 1, 145 |
| tailnum | 飞机号 | N123AA |
| origin | 出发机场 | JFK, EWR, LGA |
| dest | 目的机场 | LAX, ORD, ATL |
| dep_delay | 起飞延误（分钟） | 12, -5 |
| arr_delay | 到达延误（分钟） | 8, -3 |
| air_time | 飞行时长（分钟） | 165 |
| distance | 飞行距离（英里） | 2475 |

---

## 🏗️ 技术架构

```
┌──────────────────────────────────────────────────────────────────┐
│                         用户界面层                                │
│                  React 18 + TypeScript + TailwindCSS              │
│                  ECharts 6.0 + Lucide Icons                       │
├──────────────────────────────────────────────────────────────────┤
│                         API 网关层                                │
│                     Express.js + Vite Dev Server                  │
├──────────────────────────────────────────────────────────────────┤
│                         数据处理层                                │
│                    R 语言 + nycflights13 包                       │
├──────────────────────────────────────────────────────────────────┤
│                         数据源层                                  │
│                  nycflights13 (2013 NYC 航班数据)                 │
└──────────────────────────────────────────────────────────────────┘
```

### 技术栈

| 层级 | 技术 | 版本 |
|:---|:---|:---|
| 前端框架 | React | 19.x |
| 类型系统 | TypeScript | 5.8 |
| 构建工具 | Vite | 5.x |
| 样式方案 | TailwindCSS | 3.x |
| 图表库 | ECharts | 6.x |
| 图标库 | Lucide React | latest |
| 后端框架 | Express | 4.x |
| 分析语言 | R | 4.x |
| 数据包 | nycflights13 | latest |

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

---

## 📄 许可证

本项目基于 [Apache-2.0](LICENSE) 许可证开源。

---

<div align="center">

**Made with ❤️ for flight delay analysis**

</div>