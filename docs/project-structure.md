# 项目结构

`nexus-flight-analytics` 是航班延误分析系统的应用仓库。上层比赛资料、论文、PPT 和压缩包不属于本次整理范围。

```text
nexus-flight-analytics/
├─ .github/workflows/              # GitHub Pages 自动部署
├─ archive/generated/              # 历史截图、旧导出、诊断产物归档
├─ data/                           # 分析数据和本地 SQLite 数据库
│  ├─ flights.sqlite               # 本地交互分析数据库，不纳入 Git
│  ├─ module1/ ... module8/         # 各分析模块 JSON 数据
│  └─ raw_multi_year/               # 多年份原始数据缓存
├─ docs/                           # 项目文档
├─ exports/figure1/                # Figure 1 导出说明
├─ plans/                          # 方案与优化记录
├─ reports/                        # Quarto 报告和渲染结果
├─ scripts/                        # R 数据处理脚本与 SQLite 构建脚本
├─ src/
│  ├─ components/
│  │  ├─ assistant/                 # AI Assistant 前端浮层
│  │  ├─ charts/                    # 通用图表卡片
│  │  ├─ common/                    # 主题、语言、错误提示
│  │  └─ layout/                    # Dashboard 导航
│  ├─ contexts/                     # ThemeContext、LanguageContext
│  ├─ hooks/                        # 数据获取 Hook
│  ├─ lib/
│  │  ├─ fieldMetadata.js           # 字段字典、双语标签、Graphic Walker 元数据
│  │  ├─ interactiveAnalysis.js     # 筛选后聚合分析
│  │  └─ staticApi.ts               # GitHub Pages 静态 API 适配
│  ├─ modules/                      # 8 个原分析模块 + Visual EDA
│  ├─ pages/                        # Landing、Dashboard、Figure 1
│  └─ types/                        # 全局类型
├─ simple-server.mjs                # 本地/服务端 Express + Vite + AI 代理
├─ vite.config.ts                   # Vite 构建和静态数据复制
└─ package.json
```

## 运行与部署

- 本地开发：`npm run dev` 启动 Express + Vite，支持 SQLite 查询、AI Assistant 和 EDA。
- 静态构建：`npm run build` 输出 `dist/`，并复制 `data/**/*.json` 到 `dist/data/`。
- GitHub Pages：生产包由 `src/lib/staticApi.ts` 接管 `/api/...` 的 GET 请求，支持仪表盘、筛选、导出和 Visual EDA。
- AI Assistant：需要 Node/Express 后端代理和服务端 `SUB2API_API_KEY`。纯静态部署不会保存或暴露密钥，只返回“需要后端代理”的禁用提示。

## 环境变量

真实密钥只放在本地或服务器 `.env` 中，不提交到 Git：

```env
SUB2API_BASE_URL="https://sub2api.cian.fun/v1"
SUB2API_API_KEY="YOUR_SUB2API_API_KEY"
SUB2API_MODEL="gpt-5.5"
```

## 数据说明

- `data/flights.sqlite` 当前用于本地筛选、交互聚合、EDA 抽样和 AI 上下文构建。
- `data/module8/full_data_chunk_*.json` 用于静态部署场景下的分页、导出、筛选和 EDA。
- 数据库字段名保持英文稳定；中文/英文显示名由 `src/lib/fieldMetadata.js` 提供。
