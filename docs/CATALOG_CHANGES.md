# Catalog 变更指南

`src/catalog.mjs` 是生命周期、任务、Profiles、Skills 与路线 SOP 的唯一真值源。改 catalog 不是改一个数组：计数断言、测试、文档与站点文案会同时受影响。

## 1. 变更前

1. 读 `src/catalog.mjs`、`src/engine.mjs`、`src/routing.mjs`、`src/delivery.mjs` 与相关测试。
2. 确认变更属于哪一类：stage、task、profile、skill、route SOP、delivery activity。
3. 确认不会引入第二套生命周期或状态机。

## 2. 各类变更的落点

### Stage

- `STAGES` 增加/修改 `S(...)` 条目。
- `STAGE_IDS` 自动派生。
- `src/engine.mjs` 的 `stageSet.size !== 11` 断言。
- `test/engine.test.mjs` 的 `STAGES.length === 11`。
- `MACRO_STAGES` 必须覆盖新 stage 恰好一次。
- `SDLC_CROSSWALK` 必须覆盖新 stage。
- README/docs 的“11 阶段”文案。

### Task

- `TASKS` 增加 `T(...)`。
- `src/engine.mjs` 的 `TASKS.length !== 13`。
- `test/engine.test.mjs` 的任务路由断言。
- `docs/CLI_REFERENCE.md` 与 README 的任务列表。

### Profile

- `PROFILES` 增加 `P(...)`；`overlay` 显式。
- `src/engine.mjs` 的 `PROFILES.length === 17`（测试）与 profile 必需字段校验。
- `ENGINEERING_PROFILE.yaml` 生成逻辑如需变化，同步 `src/workspace.mjs`。
- README 的“17 个 Profile”。

### Skill

- `SKILLS` 增加 `K(...)`；`stages`、`dependencies` 必须引用已知 ID。
- 新建 `skills/<id>/SKILL.md`，frontmatter 顶层仅 `name`/`description`/`license`，扩展字段在 `metadata`。
- `src/engine.mjs` 的 `SKILLS.length !== 14`。
- `test/engine.test.mjs` 的 `SKILLS.length` 与元数据断言。
- `tools/check.mjs` 会检查 bundle 是否存在。
- 若 Skill 进入浏览器包，按四步规则更新 `src/app.mjs`、`tools/build-site.mjs`、`tools/check.mjs`。
- README/docs 的“14 个 Skill”。

### Route SOP

- `ROUTE_SOPS` 的字段必须保持非空：`prerequisites`、`platformConstraints`、`preInstallChecks`、`deliverables`、`gates`、`failureHandling`、`rollback`、`optionalBranches`、`negativeCase`、`keySkills`。
- 新增平台 Gate 时同步 `PLATFORM_BRANCHES`、`docs/ROUTE_COMPLIANCE.md` 与 token 测试。

### Delivery Activity

- `ACTIVITIES` 必须 18 项、ID 连续、字段完整。
- `primarySkill` 必须覆盖活动的至少一个 stage，或提供非空 `coverageException`。
- `alternateSkills` 不得包含 primary。
- 更新 `test/delivery.test.mjs` 的活动断言。

## 3. 变更后

```bash
npm run check
npm test
npm run build
npm run verify
```

`npm run check` 会打印 `11 stages, 13 tasks, 17 profiles, 14 candidates`。任何一项变化都必须同步测试、README、`docs/` 与 `index.html` 文案。

## 4. 禁止

- 不要只改 catalog 而留下旧计数。
- 不要让 `SKILL.md` frontmatter 成为第二真值源；catalog 仍是权威。
- 不要复制第三方 Skill 正文；只做语义重写并标注来源。
- 不要在未更新测试的情况下新增 stage/task/profile/skill。
