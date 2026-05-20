# 项目结构

`nexus-flight-analytics` 现在按“前端应用、分析数据、分析脚本、部署文档、归档产物”归类。

```text
nexus-flight-analytics/
├─ .github/workflows/
│  └─ deploy-pages.yml              # GitHub Pages 自动部署
├─ archive/generated/               # 临时生成结果、诊断产物归档
├─ data/                            # 分析数据与本地 SQLite 数据库
│  ├─ flights.sqlite                # 本地生成的交互筛选/重聚合数据库（不入 Git）
│  ├─ module1/                      # 总览仪表盘
│  ├─ module2/                      # 时间规律分析
│  ├─ module3/                      # 航线与目的地分析
│  ├─ module4/                      # 空中追回分析
│  ├─ module5/                      # 航司表现分析
│  ├─ module6/                      # 延误传播分析
│  ├─ module7/                      # 延误归因分析
│  ├─ module8/                      # 数据探索、分页与静态发布数据
│  └─ raw_multi_year/               # 多年份原始数据缓存
├─ docs/
│  ├─ deployment-github-pages.md     # GitHub Pages 部署说明
│  └─ project-structure.md          # 当前文件
├─ plans/
│  └─ optimization-plan.md          # 功能优化记录
├─ reports/                         # Quarto HTML 分析报告
│  ├─ flight-delay-report.qmd        # 报告源码
│  ├─ flight-delay-report.html       # 渲染后的 HTML 报告
│  └─ report-style.css              # 报告专用样式
├─ scripts/                         # R 数据处理与分析脚本
│  ├─ 00_collect_multi_year_data.R   # 多年份数据采集
│  ├─ 01_data_preparation.R
│  ├─ 02_module1_dashboard.R
│  ├─ ...
│  ├─ build_flights_database.mjs     # SQLite 数据库构建/补数
│  └─ run_all_analyses.R
├─ src/
│  ├─ components/                   # 通用 UI 与图表组件
│  ├─ contexts/                     # 主题等全局上下文
│  ├─ hooks/                        # 数据获取 Hooks
│  ├─ lib/
│  │  └─ staticApi.ts               # Pages 生产环境静态 API 适配层
│  ├─ modules/                      # 8 个分析模块
│  ├─ pages/                        # Landing 与 Dashboard 页面
│  ├─ types/                        # 全局类型
│  ├─ App.tsx
│  └─ main.tsx
├─ index.html                       # Vite HTML 入口
├─ package.json                     # npm 脚本与依赖
├─ simple-server.mjs                # 本地开发 Express + Vite 服务
├─ tsconfig.json
└─ vite.config.ts                   # 构建、分包、数据复制配置
```

## 数据与发布规则

- GitHub Pages 只发布 `dist/`。
- `npm run build` 会将 `data/**/*.json` 复制到 `dist/data/`。
- `data/flights_enriched.rds` 仅用于本地 R 分析，不会复制到 `dist/`。
- `data/flights.sqlite` 用于本地开发服务的数据库查询和筛选后重聚合，不纳入版本管理，也不会复制到 `dist/`。
- `data/raw_multi_year/bts_cache/*.zip` 是临时下载缓存，不纳入版本管理。
- `reports/flight-delay-report.qmd` 可用 `npm run report:render` 重新生成 HTML 报告。
- 生产环境由 `src/lib/staticApi.ts` 接管 `/api/...`，无需部署 Node/Express 服务。

## 本地与线上职责

- 本地开发：`npm run dev` 使用 `simple-server.mjs`，可以继续走 Express API。
- 数据库补数：`npm run db:build` 使用当前静态数据生成 SQLite；`npm run db:build:latest` 会尝试从 BTS TranStats 补齐最新月份，失败月份默认跳过并可续跑。
- 静态发布：`npm run build` 输出纯静态站点，适配 GitHub Pages。
- 发布检查：`npm run deploy:check` 会先跑 TypeScript 检查，再构建静态站点。
