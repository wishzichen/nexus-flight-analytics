# GitHub Pages 部署说明

本项目已经整理为纯静态部署形态：生产构建会把前端资源和 `data/**/*.json` 一起输出到 `dist/`，浏览器端会在 GitHub Pages 上自动把 `/api/...` 请求适配到静态 JSON 数据。

## 自动部署

1. 将代码推送到 GitHub 仓库的 `main` 分支。
2. 在 GitHub 仓库中打开 `Settings -> Pages`。
3. 将 `Build and deployment` 的 `Source` 设为 `GitHub Actions`。
4. 等待 `Deploy GitHub Pages` 工作流完成。

部署完成后的地址通常是：

```text
https://<你的用户名>.github.io/nexus-flight-analytics/
```

## 本地检查

```bash
npm run deploy:check
npm run preview
```

打开终端输出的本地地址后，检查首页、进入仪表盘、切换各个模块，重点检查“数据探索”模块第一页能否加载。

## 关键部署配置

- `vite.config.ts` 使用 `base: './'`，避免 GitHub Pages 子路径下资源 404。
- `src/main.tsx` 使用 `HashRouter`，避免刷新 `/dashboard` 这类子路由时出现 404。
- `vite.config.ts` 的 `copy-static-data` 插件会把 JSON 数据复制到 `dist/data/`，同时排除不需要发布的 `.rds` 文件。
- `src/lib/staticApi.ts` 只在生产构建中启用，把原本依赖 Express 的 `/api/...` 调用转换成静态数据读取。
