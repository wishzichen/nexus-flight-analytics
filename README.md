# 航班延误分析系统 | Nexus Flight Analytics

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Data](https://img.shields.io/badge/data-nycflights13-2013-orange)
![R](https://img.shields.io/badge/R-4.0+-purple)
![React](https://img.shields.io/badge/React-18-cyan)
![ECharts](https://img.shields.io/badge/ECharts-5.0-orange)

**基于纽约航班数据的延误分析与可视化系统**

*航班延误分析系统 | Flight Delay Analytics System*

</div>

---

## 📋 项目概览

本项目基于 `nycflights13` 数据集（2013年纽约三大机场出发航班数据），使用 R 语言进行数据处理与分析，React + ECharts 构建可视化界面。

### ✨ 核心功能

| 模块 | 功能 | 特色 |
|------|------|------|
| **总览** | 关键指标仪表板 | KPI卡片、热力图、饼图 |
| **时间规律** | 延误时间模式分析 | 24小时趋势、月度趋势、星期热力图 |
| **航线分析** | 目的地/航线延误对比 | 气泡图、地理分布、风险航线识别 |
| **空中追回** | 飞行中延误恢复分析 | 追回散点图、航司追回能力对比 |
| **航司表现** | 航司综合表现排名 | 四象限分析、准点率排名 |
| **延误传导** | 航班延误链式传导分析 | 桑基图、序列传播分析 |
| **延误归因** | 延误原因归因分析 | 机龄分析、天气影响、特征重要性 |
| **数据探索** | 原始数据查询与导出 | 高级筛选、页码跳转、CSV导出 |

---

## 📊 数据统计

**基于真实的 nycflights13 数据集**

| 指标 | 数值 |
|------|------|
| 总航班记录 | 336,776 条 |
| 数据字段数 | 60 个（预处理后） |
| 原始字段数 | 19 个（nycflights13） |
| 时间范围 | 2013年1月-12月 |
| 平均起飞延误 | 12.6 分钟 |
| 平均到达延误 | 6.9 分钟 |
| 参与航司 | 16 家 |
| 出发机场 | 3 个（EWR, JFK, LGA） |
| 目的地机场 | 105 个 |
| 航线数量 | 224 条 |
| 飞机数量 | 4,044 架 |

### 数据真实性验证

✅ **真实机场名称**：
- EWR - Newark Liberty Intl
- JFK - John F Kennedy Intl  
- LGA - La Guardia

✅ **真实飞机型号**：
- BOEING 737-824, 757-223, 767-332
- AIRBUS A320-232, A321-231
- EMBRAER EMB-145XR
- BOMBARDIER CL-600-2B19

✅ **真实航空公司**：
- United Air Lines Inc.
- American Airlines Inc.
- Delta Air Lines Inc.
- JetBlue Airways
- 等 16 家航司

---

## 🗂️ 项目结构

```
nexus-flight-analytics/
├── 📁 data/                          # 分析结果数据
│   ├── module1/                      # 总览模块数据
│   │   └── dashboard.json
│   ├── module2/                      # 时间规律数据
│   │   └── time_analysis.json
│   ├── module3/                      # 航线分析数据
│   │   └── route_analysis.json
│   ├── module4/                      # 空中追回数据
│   │   └── recovery_analysis.json
│   ├── module5/                      # 航司表现数据
│   │   └── airline_analysis.json
│   ├── module6/                      # 延误传导数据
│   │   └── propagation_analysis.json
│   ├── module7/                      # 延误归因数据
│   │   └── attribution_analysis.json
│   └── module8/                      # 数据探索数据（完整数据集）
│       ├── full_data_chunk_1.json   # 数据块1（50,000条）
│       ├── full_data_chunk_2.json   # 数据块2（50,000条）
│       ├── full_data_chunk_3.json   # 数据块3（50,000条）
│       ├── full_data_chunk_4.json   # 数据块4（50,000条）
│       ├── full_data_chunk_5.json   # 数据块5（50,000条）
│       ├── full_data_chunk_6.json   # 数据块6（50,000条）
│       ├── full_data_chunk_7.json   # 数据块7（36,776条）
│       ├── explorer_data.json        # 筛选选项和元数据
│       ├── full_first_page.json     # 首页快速加载数据
│       └── full_summary.json         # 统计摘要
│
├── 📁 scripts/                       # R 语言分析脚本
│   ├── 01_data_preparation.R         # 数据预处理
│   ├── 02_module1_dashboard.R         # 总览分析
│   ├── 03_module2_time.R             # 时间规律分析
│   ├── 04_module3_routes.R          # 航线分析
│   ├── 05_module4_recovery.R       # 空中追回分析
│   ├── 06_module5_airlines.R        # 航司表现分析
│   ├── 07_module6_propagation.R     # 延误传导分析
│   ├── 08_module7_attribution.R    # 延误归因分析
│   ├── 09_module8_explorer_full.R  # 数据探索导出（完整数据）
│   └── run_all_analyses.R           # 一键运行所有分析
│
├── 📁 src/                           # React 前端源码
│   ├── 📁 components/               # 通用组件
│   │   ├── 📁 charts/              # 图表组件
│   │   │   └── KPICard.tsx
│   │   ├── 📁 common/              # 通用组件
│   │   │   └── DataError.tsx
│   │   └── 📁 layout/              # 布局组件
│   │       ├── FilterBar.tsx
│   │       └── TabNav.tsx
│   ├── 📁 hooks/                    # React Hooks
│   │   └── useModuleData.ts
│   ├── 📁 modules/                  # 分析模块组件
│   │   ├── Module1Dashboard.tsx     # 总览
│   │   ├── Module2TimeAnalysis.tsx  # 时间规律
│   │   ├── Module3RouteAnalysis.tsx # 航线分析
│   │   ├── Module4AirRecovery.tsx    # 空中追回
│   │   ├── Module5AirlineAnalysis.tsx # 航司表现
│   │   ├── Module6DelayPropagation.tsx # 延误传导
│   │   ├── Module7Attribution.tsx   # 延误归因
│   │   └── Module8DataExplorer.tsx  # 数据探索
│   ├── 📁 pages/                    # 页面组件
│   │   ├── Dashboard.tsx
│   │   └── LandingPage.tsx
│   ├── 📁 types/                    # TypeScript 类型定义
│   │   └── index.ts
│   ├── App.tsx                      # 路由配置
│   ├── index.css                    # 全局样式
│   └── main.tsx                     # 应用入口
│
├── 📁 simple-server.mjs             # Express 后端服务
├── 📁 package.json                  # Node.js 依赖
├── 📁 tsconfig.json                 # TypeScript 配置
├── 📁 vite.config.ts               # Vite 配置
├── 📁 .env.example                  # 环境变量示例
├── 📁 README.md                     # 项目说明文档
└── 📁 使用说明.md                    # 中文使用说明
```

---

## 🚀 快速开始

### 环境要求

- **Node.js** >= 16.0
- **R** >= 4.0（已安装在 `E:\R-4.5.2`）
- **RStudio**（可选，已安装在 `E:\RStudio`）
- **npm** 或 **yarn**

### R 环境配置

#### 方法1：添加 R 到系统 PATH（推荐）

运行项目根目录下的批处理脚本：

```bash
setup_r_path.bat
```

之后重新打开命令行窗口，即可直接使用 `Rscript` 命令。

#### 方法2：使用项目提供的脚本

项目已配置好 R 路径，可以直接使用 npm 脚本：

```bash
# 运行所有 R 分析脚本
npm run r:all

# 仅运行数据准备
npm run r:prepare

# 仅运行模块8数据探索
npm run r:module8
```

或使用批处理脚本：

```bash
# 运行所有分析
run_r_analysis.bat all

# 运行数据准备
run_r_analysis.bat prepare

# 运行模块8
run_r_analysis.bat module8
```

### 1. 安装依赖

```bash
npm install
```

### 2. 生成分析数据

**重要**：首次运行前必须生成数据！

```bash
# 方式1：使用 npm 脚本
npm run r:all

# 方式2：使用批处理脚本
run_r_analysis.bat all

# 方式3：如果已添加 R 到 PATH
cd scripts
Rscript run_all_analyses.R
```

数据生成过程约需 2-5 分钟，将生成：
- `data/flights_enriched.rds` - 预处理后的完整数据集（60个字段）
- `data/module1/` ~ `data/module7/` - 各分析模块的结果数据
- `data/module8/` - 完整的 336,776 条真实航班数据（分7个块）

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

---

## 🧪 数据探索模块功能说明

数据探索模块提供完整的 336,776 条航班数据查询与导出功能：

### 🔍 筛选功能
- **搜索框**：支持航班号、航司、航线关键词搜索（支持回车快速检索）
- **航司筛选**：按航司代码筛选（显示航班数量）
- **目的地筛选**：按到达机场筛选（显示航班数量）
- **延误等级筛选**：准点/轻微/中度/严重（显示各等级数量）
- **实时反馈**：显示命中记录数和检索状态

### 📄 分页功能
- **灵活页面大小**：支持每页显示 10/20/50/100/200 条记录
- **页码跳转**：输入目标页码快速跳转到指定页面
- **智能页码导航**：
  - 少于7页时显示所有页码
  - 超过7页时智能显示当前页附近的页码
  - 始终显示首页和末页
- **上一页/下一页**：逐页浏览数据
- **记录统计**：实时显示当前页范围和总记录数

### 📥 导出功能
- **一键导出**：导出符合当前筛选条件的所有记录
- **导出格式**：CSV（UTF-8 编码，支持中文）
- **智能文件名**：自动包含筛选条件和时间戳
- **导出状态**：实时显示导出进度

### 💡 使用技巧
1. 在搜索框输入关键词后按回车键快速检索
2. 使用多个筛选条件组合可以精确定位目标数据
3. 点击"重置"按钮可一键清除所有筛选条件
4. 导出的 CSV 文件可直接在 Excel 中打开分析

---

## 📈 技术栈

| 类别 | 技术 |
|------|------|
| 数据处理 | R, dplyr, tidyr, jsonlite |
| 后端服务 | Node.js, Express |
| 前端框架 | React 18, TypeScript |
| 路由 | React Router v6 |
| 样式 | Tailwind CSS |
| 图表 | Apache ECharts, echarts-for-react |
| 图标 | Lucide React |

---

## 📝 航班延误等级说明

| 等级 | 标准 | 颜色标识 |
|------|------|----------|
| 准点 | 延误 ≤ 0 分钟 | 绿色 |
| 轻微 | 0 < 延误 ≤ 15 分钟 | 青色 |
| 中度 | 15 < 延误 ≤ 60 分钟 | 黄色 |
| 严重 | 延误 > 60 分钟 | 红色 |

---

## 📜 许可证

MIT License - 详见 LICENSE 文件

---

## 🙏 致谢

- 数据来源：[nycflights13](https://github.com/hadley/nycflights13) - R 语言的经典航班数据集
- 图表库：[Apache ECharts](https://echarts.apache.org/)
- 图标：[Lucide](https://lucide.dev/)

---

<div align="center">

**Made with ❤️ for data analytics**

</div>