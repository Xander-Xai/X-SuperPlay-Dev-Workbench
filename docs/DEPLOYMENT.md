# 部署与 GitHub Pages

> 状态：`CURRENT`（2026-11-01）。本文件描述本仓的静态站点发布，不描述用户项目的部署。

## 1. 触发条件

- `.github/workflows/pages.yml` 在 `main` 的 push 与手动 `workflow_dispatch` 时运行。
- build job 先执行 `npm run verify`，再执行 `npm run build`。
- deploy job 在 build 成功且仓库启用 Pages 时执行。

## 2. 构建产物

`npm run build` 只复制 `tools/build-site.mjs` 中 `FILES` 白名单与 `index.html`、`styles.css`：

```text
dist/
  index.html
  styles.css
  .nojekyll
  src/*.mjs
```

任何白名单外文件都会导致构建失败。`docs/`、`skills/`、`tools/`、`test/` 不发布。

构建会把 `index.html` 的 `workbench-commit` meta 与 `src/catalog.mjs` 的 `buildSha` 替换为当前 SHA。

## 3. 本地验证

```bash
npm run verify
npm run build
npm run dev          # http://127.0.0.1:4173
```

`npm run dev` 只监听 `127.0.0.1`，并拒绝 `tools/`、`test/` 与点文件。

## 4. 发布流程

1. 在 topic branch 完成改动，PR 的 `verify` 检查为绿。
2. 用户合并到 `main`。
3. `pages.yml` 自动 build/deploy。
4. 在 Actions 中确认 build 与 deploy 两步都成功。
5. 打开 <https://xander-xai.github.io/X-SuperPlay-Dev-Workbench/> 复核。

## 5. 回滚

- 优先 revert 合并提交，再让 `pages.yml` 重新部署。
- 不用 `git push --force` 重写 `main`。
- Pages 部署失败时先检查 build 日志；本地 `npm run build` 可复现大多数白名单/导入错误。

## 6. 常见故障

| 现象 | 原因 | 处理 |
|---|---|---|
| build 报 `Unexpected public artifact` | `dist` 出现白名单外文件 | 清理 `dist` 后重跑；不要手工把文件放进 dist |
| 页面白屏、Console 报导入失败 | 新模块未加入 `FILES`/`required`，或浏览器入口导入了 `node:` | 按 CLAUDE.md 的四步规则补齐 |
| 页面版本号不变 | build 未替换 meta/SHA | 检查 `workbench-commit` 与 `buildSha` 占位符是否还在 |
| deploy 被跳过 | 仓库未启用 Pages 或 `has_pages` 为 false | 在仓库 Settings → Pages 选择 GitHub Actions |
