# Contributing

本文件是本仓的贡献约定。项目本地规则、`AGENTS.md` 与 `CLAUDE.md` 优先；两者冲突时以 `AGENTS.md` 为准。

## 1. 开发环境

- Node.js ≥ 20（CI 使用 22，本地 24 也通过）。
- 零运行时依赖；不要运行 `npm install` 添加依赖。
- Windows、macOS、Linux 均可；Windows 下允许 1 个 symlink 测试 skip。

## 2. 分支与提交

- 从 `main` 创建短分支：`feat/<slug>`、`fix/<slug>`、`chore/<slug>`、`docs/<slug>`。
- 一个分支一个意图；不建立长期 `develop`/`staging` 分支。
- Conventional Commits，祈使句，主题 ≤72 字符。
- 不 force-push 共享分支；不回退他人的未提交工作。
- PR 只通过 PR 合并到 `main`；合并前 `verify` 必须绿。

## 3. 验证

```bash
npm run verify    # check + dependency scan + security gate + tests
npm run build     # 构建并审计 Pages 白名单
```

`npm run verify` 不包含 `build` 与站点 smoke test；改动站点或发布相关文件时两者都要跑。

单文件或单测试：

```bash
node --test test/engine.test.mjs
node --test --test-name-pattern="catalog contains" test/engine.test.mjs
```

## 4. 代码风格

- prose 文档用中文；代码、注释、CLI 输出、测试名与提交信息用英文。
- 浏览器代码不得导入 `node:` 模块；`src/` 不得依赖 `tools/`。
- 新模块必须同步：`src/app.mjs` 导入、`tools/build-site.mjs` 的 `FILES`、`tools/check.mjs` 的 `required`；新 UI 区域还要加 `id`。
- 不新增运行时依赖；不复制第三方 Skill 正文；不提交密钥或生产数据。

## 5. 测试约定

- 用 `node:test` 与 `node:assert/strict`。
- 一个测试验证一个行为；测试名描述期望行为。
- Bug 修复先写复现测试，再改代码。
- 不删除或弱化失败断言来换取通过；先判断测试是否真的错了，再单独提交修改理由。
- 生成产物保持 `DRAFT_NOT_EXECUTED`；证据保持 `NOT_RUN`，除非有真实执行回执。

## 6. 文档与链接

- 新文档链接进 `README.md` 的文档索引。
- 命令示例必须可直接执行；路径必须可解析。
- 平台/合规规则标注观测日期，不写成永久承诺。
- 不把 `docs/` 或 `skills/` 当成已发布站点内容。

## 7. 发布

本仓的发布就是 `main` 合并后由 `.github/workflows/pages.yml` 部署静态站点。没有 npm 包发布，也没有服务端部署。详见 [DEPLOYMENT.md](docs/DEPLOYMENT.md)。

## 8. 提交前检查

- [ ] `npm run verify` 通过
- [ ] 涉及站点时 `npm run build` 通过
- [ ] 涉及 UI 时 1440px / 390px 截图与 Console 检查完成
- [ ] PR 描述包含 Why、Scope、Verification（命令+结果）、Risks、Rollback
- [ ] 未提交密钥、`.env`、生产数据或私有材料
