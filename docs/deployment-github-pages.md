# GitHub Pages 部署说明

本项目是 Vite + React 单页应用。生产构建会把前端资源和 `data/**/*.json` 输出到 `dist/`，浏览器端会在 GitHub Pages 上把 `/api/...` 请求适配到静态 JSON 数据。

本地开发服务可以额外使用 `data/flights.sqlite` 做数据库查询和筛选后重聚合；GitHub Pages 是纯静态环境，不会发布或运行 SQLite 数据库。线上静态站点仍使用构建产物中的 JSON 数据。

## 当前问题定位

2026-05-11 检查到的线上状态：

- `https://wishzichen.github.io/nexus-flight-analytics/` 会被 Pages 重定向到 `http://cian.fun/nexus-flight-analytics/`。
- `https://cian.fun/nexus-flight-analytics/` 返回的是仓库根目录的开发态 `index.html`，其中仍引用 `/src/main.tsx`，不是 `dist/` 里的 Vite 构建产物。
- `https://flight.cian.fun/` 已经能到达 GitHub Pages/CDN，但返回 404，说明该域名还没有被这个 Pages 站点绑定。

这通常代表仓库 Pages 仍处在 `Deploy from a branch` 模式，GitHub 自动生成的 Jekyll Pages 构建会和本仓库的 Vite workflow 同时运行，并且可能最后发布，从而覆盖正确的 `dist/` artifact。

## 推荐设置

1. 打开仓库 `Settings -> Pages`。
2. 将 `Build and deployment -> Source` 改成 `GitHub Actions`。
3. 在同一个 Pages 页面把 `Custom domain` 设置为：

```text
flight.cian.fun
```

4. 保存后等待 DNS check 通过，再开启 `Enforce HTTPS`。
5. 推送到 `main` 分支，等待 `Deploy GitHub Pages` workflow 完成。

GitHub 官方说明：

- 自定义 Pages workflow：https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- 配置 Pages 发布源：https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- 配置自定义域名：https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site

## Cloudflare DNS

在 Cloudflare 中建议配置：

```text
Type: CNAME
Name: flight
Target: wishzichen.github.io
```

如果 GitHub Pages 的 HTTPS 证书一直签发失败，可以先把这条记录的代理状态从橙云切到 DNS only，等 GitHub 完成证书签发后再按需要打开代理。

不要只依赖仓库里的 `CNAME` 文件。当前站点使用 GitHub Actions artifact 发布，域名绑定应以 `Settings -> Pages -> Custom domain` 为准。

## 本地发布前检查

```bash
npm run deploy:check
```

这个命令会执行：

- TypeScript 检查
- Vite 生产构建
- `dist/` Pages artifact 自检

自检会确认 `dist/index.html` 已经引用 `./assets/...`、`.nojekyll` 存在、关键 JSON 数据已复制，并且没有把 `.rds` 文件发布到 Pages。
SQLite 数据库、BTS zip 缓存和 `.part` 临时文件不应进入 `dist/`。

## 线上诊断

推送并等待 workflow 完成后，可以运行：

```bash
npm run deploy:diagnose
```

诊断结果里最重要的是：

- `Vite artifact published`：线上已经在服务 `dist/`。
- `raw Vite source published`：Pages 还在发布仓库根目录，需要把 Source 改成 `GitHub Actions`，或等待本 workflow 的兼容延迟发布完成。
- `404 from Pages`：域名没有绑定到当前 Pages 站点，检查 `Custom domain` 是否为 `flight.cian.fun`。

## 关键项目配置

- `vite.config.ts` 使用 `base: './'`，避免 GitHub Pages 子路径和自定义域名下资源 404。
- `src/main.tsx` 使用 `HashRouter`，避免刷新 `/dashboard` 这类前端路由时出现 404。
- `vite.config.ts` 的 `copy-static-data` 插件会把 JSON 数据复制到 `dist/data/`，同时写入 `.nojekyll`。
- `src/lib/staticApi.ts` 只在生产构建中启用，把原本依赖 Express 的 `/api/...` 调用转换成静态数据读取。
- `simple-server.mjs` 在本地开发时会优先读取 `data/flights.sqlite`，用于筛选后的实时聚合；生产构建不会依赖该数据库。
- `.github/workflows/deploy-pages.yml` 会在部署前检测 Pages 发布源；如果仓库仍是分支/Jekyll 发布模式，会等待一段时间，让 Vite artifact 尽量成为同一次 push 的最后一个 Pages 部署。

如果暂时无法把 Source 改成 `GitHub Actions`，可以在仓库 `Settings -> Secrets and variables -> Actions -> Variables` 中设置 `LEGACY_PAGES_WAIT_SECONDS`，例如 `240`，让自定义 Vite 部署更稳定地排在 Jekyll 分支部署之后。Source 修正为 `GitHub Actions` 后，这个等待会自动跳过。
