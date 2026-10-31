# X-SuperPlay Dev Workbench

**AI-Native 软件交付工作台。** 从一个真实项目出发，选择项目类型、项目状态与任务类型，组合工程 Profiles 与候选 Skills，得到可执行的十一阶段路线、工作区资产和 Agent 交接。

本仓库是这套工程运行时的**当前所有者**：生命周期、任务路由、Profiles、Skills、xeng CLI 与证据模型都在这里维护。历史 Engineering OS 只作为来源记录（现已 public，但不作为运行时依赖），不再是运行依赖。

> 生成 ≠ 已安装 ≠ 已测试 ≠ 已发布 ≠ 已验收。所有导出的证据状态默认 `NOT_RUN`。

## 三分钟运行

需要 Node.js 20+。零运行时依赖，无需 `npm install`，无需数据库或 API Key。

~~~bash
git clone https://github.com/Xander-Xai/X-SuperPlay-Dev-Workbench.git
cd X-SuperPlay-Dev-Workbench
npm run verify
npm run dev
~~~

打开 <http://127.0.0.1:4173>（仅监听本机）。

## 五个入口

| 入口 | 作用 |
|---|---|
| **项目启动器** | 项目类型 → 新/旧项目 → 任务类型 → Tier / 技术栈 / 扩展 → 生成路线、阶段 Gate、路线 SOP、导出 |
| **工作流浏览器** | 11 个唯一阶段、4 条路线 SOP、13 种任务路由、17 个 Profile、A/B/C/D 等级义务 |
| **Skills 能力库** | 8 个自包含候选 Skill、标准元数据、依赖闭包、按 Agent 生成 dry-run 安装命令 |
| **项目工作区** | 生成 10 份可审查草案：Manifest、ENGINEERING_PROFILE、Spec/Tickets、ADR、验证计划、发布清单、Agent 交接、路线 SOP、Review 记录、完整资产包 |
| **证据与改进** | 证据状态机、本地报告导入（不上传）、阶段摘要与改进闭环 |

## 四条路线 SOP

4 条交付路线复用同一套 11 阶段生命周期，各自增加前置条件、平台不可替代环节、必须覆盖的负例、Gate、失败处理与回退：

- **SaaS**：租户隔离、认证会话、迁移升降级、订阅/支付幂等、备份与监控；必须证明租户 A 无法读取或修改租户 B 的数据。
- **企业自研**：业务访谈、流程与权限矩阵、SSO/RBAC、集成契约、审计、数据迁移、UAT 与运行交接。
- **微信小程序**：AppID/资质、登录与服务端会话、合法域名、隐私授权、真机、提审与发布；平台审核和资质不能由本地测试替代。
- **移动 APP**：在 Flutter / React Native / Android / iOS 中择一，覆盖导航状态、设备权限、安全存储、离线恢复、签名与商店审核；不同时强制四套技术栈。

路线 SOP 会随方案进入工作区资产包；平台不可替代的环节必须标 `BLOCKED` / `NOT_RUN`，不得用本地测试冒充平台回执。

## 支持范围

- 交付对象：SaaS、企业自研系统、微信小程序、移动 APP。
- APP 技术栈：Flutter / React Native / Android / iOS，择一。
- 小程序技术栈：原生 / Taro / uni-app / 微信云开发。
- 可选叠加：AI Application、RAG、Agent、订阅与支付。
- 任务路由：idea、feature、bug、refactor、architecture、investigation、performance、security、documentation、migration、dependency-update、release、incident。
- 工程等级：A 生产级 / B 交付验证 / C 学习实验 / D 一次性试验。

## xeng CLI（Node，离线）

~~~bash
node tools/xeng.mjs init ../your-project --profile saas,web,backend --tier B --task feature --mode new --dry-run
node tools/xeng.mjs audit ../your-project --json
node tools/xeng.mjs doctor ../your-project
node tools/xeng.mjs validate-registry
node tools/xeng.mjs task bug --type=saas --tier=B
~~~

`init` 默认不覆盖任何已有文件；冲突时写入 `*.suggested.md` 供人工合并。`audit` 检查 README、Agent 规则、工程 Profile、测试、CI、密钥、env 配对、迁移、回滚与例外有效期。`doctor` 检查坏链接、失效脚本路径、过期当前事实和 env 漂移。

### 一次装配（组装路线 + 最小 Skills + 目标检查）

~~~bash
# 预览：不改目标项目
node tools/xeng.mjs assemble --target ../your-project --type saas --task feature --tier B --agent codex

# 受控安装：必须显式确认已审查
node tools/xeng.mjs assemble --target ../your-project --type saas --task feature --tier B --agent codex --apply --confirm-reviewed

# 校验已安装文件与回执（不代表 Agent 真的加载了 Skill）
node tools/xeng.mjs agent-check --target ../your-project --agent codex
~~~

`assemble` 只安装该路线阶段真正需要的 Skill（含依赖闭包），默认 dry-run；目标目录必须是已存在的非符号链接目录。`--apply` 需要 `--confirm-reviewed`，遇到已存在且非受管的文件直接拒绝且不写锁。输出区分：

- `ASSEMBLY_DRY_RUN`：仅预览，零写入。
- `ASSEMBLY_INSTALLED_NOT_TESTED`：文件已安装且哈希校验通过，**运行时加载未验证**。
- `ALREADY_MANAGED`：幂等重复安装，未重复改动。
- `agent-check` 的 `FILES_VERIFIED_RUNTIME_NOT_VERIFIED` 只证明磁盘文件与锁一致；Agent 发现/调用需按 [docs/AGENT_SKILL_LOAD.md](docs/AGENT_SKILL_LOAD.md) 的探针命令单独验证。没有真实 Agent 回执时一律 `NOT_VERIFIED`。

## Skills：自包含 bundle

8 个候选 Skill 均位于 `skills/<id>/`，包含 `SKILL.md` 与 `references/`，不再依赖旧仓目录结构。每个 Skill 都带标准化元数据：`id / version / owner / source / license / supported_agents / lifecycle_stage / prerequisites / dependencies / install_method / tests / status`。

状态阶梯为 `CANDIDATE → LOCALLY_VERIFIED → REAL_PROJECT_VERIFIED → REUSABLE`。没有真实使用证据，不会自动晋级；当前全部为 `CANDIDATE`。

~~~bash
node tools/skill-kit.mjs list
node tools/skill-kit.mjs plan    --target ../your-project --agent codex --skills verification
node tools/skill-kit.mjs install --target ../your-project --agent codex --skills verification --apply --confirm-reviewed
node tools/skill-kit.mjs verify  --target ../your-project
node tools/skill-kit.mjs update  --target ../your-project
node tools/skill-kit.mjs uninstall --target ../your-project --apply --confirm-reviewed
node tools/skill-kit.mjs rollback  --target ../your-project --receipt <receipt.json> --apply --confirm-reviewed
~~~

- 默认 dry-run；`--apply` 必须搭配 `--confirm-reviewed`。
- 整包复制，目标已存在文件则拒绝覆盖。
- 更新/卸载只处理受管且未修改的文件，修改过就拒绝。
- 锁文件 `.x-superplay/skill-kit.lock.json`（schemaVersion 2，兼容读取 v1）。
- 每次写入生成 SHA-256 回执，可按回执回滚。
- 安装文件不等于 Skill 已执行或已验证。

## 已有工程：只读基线

~~~bash
npm run probe -- --target ../your-project --type saas --output project-baseline.json
~~~

只读检查 Git HEAD / dirty 状态、常见工程标记，并给出 stack / profile / task 建议；**不读取业务代码、`.env`、凭证，不运行测试，不上传**。网页可本地导入该 JSON，导入后仍为 `NOT_RUN`。

## 证据模型

状态：`NOT_RUN → IN_PROGRESS / BLOCKED → UNKNOWN / VERIFIED`。`VERIFIED` 必须带 command、result、artifact 且使用已执行层；状态只能按允许的迁移前进，`VERIFIED` 不可回退，禁止静默升级。

必需 Gate 按项目类型、任务、Tier、Profile 与阶段推导（REQUIRED / RECOMMENDED / OPTIONAL / NOT_APPLICABLE），不再把目录中的全部证据种类当作所有项目的强制项。Tier C/D 只降低非安全义务；已有项目与安全 Gate 不因降级被弱化。

层：代码检查 / 真实环境 / 消费者验收，三层不可互相替代。

网页“证据与改进”可导入 `LOCAL_EVIDENCE_REPORT`（schemaVersion 1），导入结果为 `IMPORTED_NOT_TRUSTED`，按当前路线契约显示缺失 Gate；声明完整不等于真实验收。

## 仓库边界

- 本仓库拥有：生命周期、路由、Profiles、标准摘要、Skills bundle、CLI、证据模型、网站。
- 产品代码、真实测试回执、客户数据、发布凭证留在各项目仓或受控环境。
- 不包含私有 SKILL.md 正文、私有治理文档、客户证据、凭证或第三方受限代码。
- 不提供浏览器端 GitHub Token、远程脚本安装器或自动部署动作。

## 历史来源与迁移

- 历史来源（只读溯源，不是运行依赖）：`Xander-Xai/X-SuperPlay-AI-Engineering-OS@8553124f238ab463d4a50debad34e871ef8de060`。该仓现已 public；可见性变化不改变冻结快照。
- 来源当前 HEAD（仅观测）：`2b792242894937d303c4680208daf9df97ea0027`；冻结后 3 个提交的增量审计见 [migration/eng-os-delta-audit-20261031.json](migration/eng-os-delta-audit-20261031.json)。
- 通用治理参考（未复制正文）：`Xander-Xai/AI-Native-Work-Learning-OS@f1289d685c95c7fac6f1d50068527a60f080ee1b`；PR #57 仍为 OPEN。
- 迁移清单：[migration/eng-os-split-20261031.json](migration/eng-os-split-20261031.json)
- 迁移说明：[docs/MIGRATION.md](docs/MIGRATION.md)

迁移 PR #12 已合并为 `74402bf`；Windows CRLF 修复 PR #13 已合并为 `32e0342`。两者 CI 通过，Pages 已部署。旧仓未归档、未删除，退役需要仓库所有者单独确认并完成真实项目验证（当前 `DECOMMISSION_NOT_VERIFIED`）。

## 验证状态

| 项 | 状态 |
|---|---|
| `npm run check` / `npm test` / `npm run verify` / `npm run build` | Windows 11 本地通过；远端 CI 在 `74402bf`、`32e0342` 通过 |
| 浏览器交互与移动端布局 | 1440px / 390px 无头 Chrome 截图与脚本化交互通过；真机未验证 |
| Windows 11 Skill 安装 / 更新 / 卸载 / 回滚 | 本地 fixture 通过；三个 Agent 的真实加载未全部验证 |
| 真实项目 Dogfood / 真机 / 生产发布 | `BLOCKED`：没有获得授权的真实小程序 / SaaS 项目 |
| GitHub Pages | 已部署：<https://xander-xai.github.io/X-SuperPlay-Dev-Workbench/> |

**CI 通过只说明本仓库代码检查通过，不代表用户项目、真实设备或生产交付已验收。**

## 文档

- [架构与所有权](docs/ARCHITECTURE.md)
- [迁移与兼容表](docs/MIGRATION.md)
- [跨仓治理契约对齐](docs/CONTRACT_ALIGNMENT.md)
- [实际开发 SOP](docs/PLAYBOOK.md)
- [Skill Kit 契约](docs/SKILL_KIT.md)
- [演进路线](docs/ROADMAP.md)

## 许可

本仓库尚未声明开源再分发许可（Skills 标记为 `UNLICENSED-PROPRIETARY`）。商业分发或接受外部贡献前，需仓库所有者确定许可。
