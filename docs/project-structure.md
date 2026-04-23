# 项目目录结构说明

## 完整目录树

```
nexus-flight-analytics/
│
├── .env.example                    # 环境变量示例
├── .gitignore                      # Git 忽略配置
├── package.json                    # 项目依赖配置
├── tsconfig.json                   # TypeScript 配置
├── vite.config.ts                  # Vite 构建配置
│
├── index.html                      # 入口 HTML
├── metadata.json                   # 项目元数据
│
├── README.md                       # 项目说明文档
├── 使用说明.md                      # 中文使用说明
│
├── server.ts                       # Express 服务器 (TypeScript)
├── simple-server.mjs               # Express 服务器 (JavaScript)
├── start.ts                        # TypeScript 启动脚本
├── start.mjs                       # JavaScript 启动脚本
│
├── data/                           # 📊 分析数据目录
│   ├── airlines_info.json          # 航司信息
│   ├── airports_info.json          # 机场信息
│   ├── flights_enriched.rds        # 原始航班数据 (R格式)
│   │
│   ├── module1/                    # 模块1：总览仪表板数据
│   │   └── dashboard.json
│   │
│   ├── module2/                    # 模块2：时间规律分析数据
│   │   └── time_analysis.json
│   │
│   ├── module3/                    # 模块3：航线分析数据
│   │   └── route_analysis.json
│   │
│   ├── module4/                    # 模块4：空中追回分析数据
│   │   └── recovery_analysis.json
│   │
│   ├── module5/                    # 模块5：航司表现分析数据
│   │   └── airline_analysis.json
│   │
│   ├── module6/                    # 模块6：延误传导分析数据
│   │   └── propagation_analysis.json
│   │
│   ├── module7/                    # 模块7：延误归因分析数据
│   │   └── attribution_analysis.json
│   │
│   └── module8/                    # 模块8：数据探索数据
│       ├── explorer_data.json     # 主数据文件 (搜索索引)
│       ├── page_1.json           # 分页数据 1-10
│       ├── page_2.json
│       ├── page_3.json
│       ├── page_4.json
│       ├── page_5.json
│       ├── page_6.json
│       ├── page_7.json
│       ├── page_8.json
│       ├── page_9.json
│       └── page_10.json
│
├── scripts/                        # 📝 R 语言分析脚本
│   ├── 01_data_preparation.R       # 数据准备脚本
│   ├── 02_module1_dashboard.R      # 模块1分析
│   ├── 03_module2_time.R           # 模块2分析
│   ├── 04_module3_routes.R         # 模块3分析
│   ├── 05_module4_recovery.R       # 模块4分析
│   ├── 06_module5_airlines.R       # 模块5分析
│   ├── 07_module6_propagation.R    # 模块6分析
│   ├── 08_module7_attribution.R     # 模块7分析
│   ├── 08_module8_explorer.R       # 模块8分析
│   ├── run_all_analyses.R          # 运行全部分析
│   │
│   └── data/                       # 脚本使用的数据副本
│       ├── airlines_info.json
│       ├── airports_info.json
│       └── flights_enriched.rds
│
├── docs/                           # 📚 项目文档
│   └── project-structure.md         # 目录结构说明
│
├── plans/                          # 📋 设计文档
│   └── optimization-plan.md        # 优化方案设计
│
├── src/                            # 💻 前端源代码
│   │
│   ├── main.tsx                   # React 入口文件
│   ├── App.tsx                    # 根组件
│   ├── index.css                  # 全局样式
│   │
│   ├── components/                # 🎨 通用组件
│   │   │
│   │   ├── charts/               # 图表组件
│   │   │   └── KPICard.tsx       # KPI 指标卡片
│   │   │
│   │   ├── common/               # 通用组件
│   │   │   └── DataError.tsx     # 数据错误提示
│   │   │
│   │   ├── layout/               # 布局组件
│   │   │   ├── FilterBar.tsx     # 筛选栏
│   │   │   └── TabNav.tsx        # 标签导航
│   │   │
│   │   └── tables/               # 表格组件 (待扩展)
│   │
│   ├── hooks/                     # 🪝 React Hooks
│   │   └── useModuleData.ts      # 数据获取 Hook
│   │
│   ├── modules/                   # 📊 分析模块组件
│   │   ├── Module1Dashboard.tsx      # 总览仪表板
│   │   ├── Module2TimeAnalysis.tsx   # 时间规律分析
│   │   ├── Module3RouteAnalysis.tsx  # 航线分析
│   │   ├── Module4AirRecovery.tsx    # 空中追回
│   │   ├── Module5AirlineAnalysis.tsx # 航司表现
│   │   ├── Module6DelayPropagation.tsx # 延误传导
│   │   ├── Module7Attribution.tsx    # 延误归因
│   │   └── Module8DataExplorer.tsx    # 数据探索 ✨ 已优化
│   │
│   ├── pages/                     # 📄 页面组件
│   │   ├── Dashboard.tsx         # 主仪表板页面
│   │   └── LandingPage.tsx       # 落地页
│   │
│   └── types/                     # 📋 TypeScript 类型
│       └── index.ts              # 类型定义
│
└── dist/                          # 📦 构建输出目录
    └── (构建生成的文件)
```

---

## 模块说明

| 模块 | 名称 | 主要功能 | 数据文件 |
|------|------|----------|----------|
| Module1 | 总览仪表板 | 全局统计、KPI卡片、热力图 | dashboard.json |
| Module2 | 时间规律 | 24小时趋势、月份分析、星期规律 | time_analysis.json |
| Module3 | 航线分析 | 目的地排名、航线风险评估 | route_analysis.json |
| Module4 | 空中追回 | 追回能力分析、速度与延误关系 | recovery_analysis.json |
| Module5 | 航司表现 | 航司对比、机队规模 | airline_analysis.json |
| Module6 | 延误传导 | 航班链延误传播分析 | propagation_analysis.json |
| Module7 | 延误归因 | 延误原因归因分析 | attribution_analysis.json |
| Module8 | 数据探索 | 原始数据查询、筛选与导出 | explorer_data.json + page_*.json |

---

## 数据流向

```
R 脚本 (scripts/)
    ↓
生成 JSON 数据 (data/)
    ↓
Express 服务器 (server.ts)
    ↓
React 前端 (src/)
    ↓
用户浏览器
```

---

## 依赖关系

```
package.json
    ├── react / react-dom       # React 框架
    ├── react-router-dom         # 路由
    ├── echarts / echarts-for-react  # 图表库
    ├── lucide-react            # 图标库
    ├── typescript              # 类型系统
    ├── vite                    # 构建工具
    └── tailwindcss             # 样式框架

server.ts
    └── express                 # 后端框架
```

---

## 启动流程

1. **数据准备** (仅首次)
   ```bash
   cd scripts
   Rscript run_all_analyses.R
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   # 访问 http://localhost:3000
   ```

4. **生产环境构建**
   ```bash
   npm run build
   npm start
   ```

---

## API 接口说明

### 模块8数据探索 API

| 接口 | 方法 | 参数 | 说明 |
|------|------|------|------|
| `/api/module8/summary` | GET | - | 获取统计摘要 |
| `/api/module8/search` | GET | q, airline, destination, delayLevel, page, pageSize | 搜索筛选 |
| `/api/module8/export` | GET | q, airline, destination, delayLevel, exportMode, startPage, endPage | 导出 CSV |
| `/api/module8/airline-options` | GET | - | 获取航司筛选选项 |
| `/api/module8/dest-options` | GET | - | 获取目的地筛选选项 |
| `/api/module8/delay-level-options` | GET | - | 获取延误等级选项 |

---

## 重点文件说明

| 文件路径 | 说明 | 状态 |
|----------|------|------|
| src/modules/Module8DataExplorer.tsx | 数据探索组件 - 已支持搜索、筛选确认按钮、导出选择菜单 | ✅ 已完成 |
| server.ts | 后端 API - 支持筛选查询和多种导出模式 | ✅ 已完成 |
| docs/project-structure.md | 项目目录结构文档 | ✅ 已完成 |
| plans/optimization-plan.md | 优化方案设计文档 | ✅ 已完成 |
| README.md | 项目主文档 | ✅ 已完成 |

---

## 优化日志

### v2.0 (最新)

**Module8DataExplorer.tsx 优化：**
- ✅ 添加搜索输入框，支持航班号、航司、航线关键词搜索
- ✅ 添加"应用筛选"确认按钮，将临时筛选和已确认筛选分离
- ✅ 添加"重置"按钮一键清除所有筛选条件
- ✅ 显示当前筛选条件标签
- ✅ 显示符合条件的记录总数
- ✅ 添加导出选择菜单：
  - 所有结果（导出所有筛选后的数据）
  - 当前页结果（只导出当前页数据）
  - 自定义范围（选择第X页到第Y页）
- ✅ 优化UI交互反馈

**server.ts 优化：**
- ✅ 新增 `/api/module8/search` 接口，支持筛选和分页
- ✅ 新增 `/api/module8/export` 接口，支持多种导出模式
- ✅ 新增 `/api/module8/summary` 接口，获取统计摘要
- ✅ 新增 `/api/module8/airline-options`、`/api/module8/dest-options`、`/api/module8/delay-level-options` 接口
