# X-SuperPlay Dev Workbench

**让开发者针对一个真实项目，直接获得开发路线、工程 Profile 与候选 Skill 的组合方案。**

一个真正可运行的、零运行时依赖的静态 Web MVP。面向 SaaS、企业自研系统、微信小程序和移动 APP。核心是把方法论变成可以使用的项目引导，而不是复制第二份方法论仓库。

## 目前已经可以做什么

- 在四种项目类型之间切换；APP 支持 Flutter、React Native、Android、iOS 技术路线。
- 输入项目名称、需求、既有工程状态、Tier、Claude Code / Codex / OpenCode。
- 叠加 AI Application、RAG、Agent Profiles（去重组合）。
- 浏览 11 个完整工程阶段、每阶段 Gate、交付物、候选 Skills。
- 查看 8 个候选 Skills 的适用场景和已固定的私有权威源链接。
- 生成本地 Markdown 工程执行计划和 JSON Manifest，附安全的 xeng --dry-run 初始化命令。
- 查看真实证据五层门禁及工程复盘/Skill 晋级机制。
- 使用 Node 内置测试和 CI 检查项目类型映射、输入安全、状态声明及网站资源。

**当前不会做的事：** 自动克隆私有源仓、安装 Skills、操作本地项目、调用模型、替用户部署、读取 GitHub 私有数据、宣称项目已验收。所有生成的交付证据初始值是 NOT_RUN。

## 三分钟运行

需要 Node.js 20 或更新版本，无需 npm install、无需数据库，也无需 API Key。

~~~bash
git clone https://github.com/Xander-Xai/X-SuperPlay-Dev-Workbench.git
cd X-SuperPlay-Dev-Workbench
npm run verify
npm run dev
~~~

在浏览器打开 http://127.0.0.1:4173 。这个地址只监听本机 127.0.0.1。页面采用原生 JavaScript ES Modules，可部署到任意静态站点。

## 用于一个实际小程序

1. 网站选择「微信小程序」，填写原始需求；可叠加 AI Application / RAG / Agent。
2. 点击「生成开发方案」，逐阶段查看目标、验收与候选 Skills。
3. 下载 Markdown 和 JSON，将文件纳入**目标项目**，确认项目本地 AGENTS.md/CLAUDE.md 及真实运行环境。
4. 在你已有权限的 Engineering OS 本地克隆中运行生成的 xeng dry-run 命令。审查变更后才决定是否实际初始化。
5. 以 Spec → 可交付 Tracer Ticket → 实际编码 → 测试 → Review → 发布 → 真实验收推进。
6. 真实代码和证据保留在产品仓；只在达到复用与实证要求后向 Engineering OS 提出方法改进。

## 仓库职责和资料来源

- Canonical Owner: [X-SuperPlay-AI-Engineering-OS](https://github.com/Xander-Xai/X-SuperPlay-AI-Engineering-OS)（私有；需要访问权限）。
- 当前公开元数据固定基准：commit 8553124f238ab463d4a50debad34e871ef8de060；Profile/Skill Registry 的 last_verified 为 2026-09-30。
- 本仓库：静态展示、项目组合和安全导出逻辑。只含重写的公开摘要，不复制私有 SKILL.md、治理文件、客户项目证据或第三方受许可约束的代码。
- Skills 状态全部为 candidate / installed=false；不因网站生成链接而升级。
- Engineering OS PR #5 为待合并的方法适配；不得描述为已被 main 采纳或已完成真实试点。

见 [架构与权限边界](docs/ARCHITECTURE.md)、[实际开发 SOP](docs/PLAYBOOK.md)、[演进路线](docs/ROADMAP.md)。

## 测试

~~~bash
npm run check
npm test
npm run verify
~~~

CI 在 PR 和 main push 时运行目录检查、逻辑测试、站点 HTTP 冒烟检查。**CI 通过仅说明 Workbench 代码检查通过，不证明源 Skills、安全审查、用户项目或外部部署已经完成。**

## 发布

静态文件入口位于仓库根目录的 index.html。合并 PR 并完成 CI 后，可在 GitHub Settings → Pages 选择从 main / root 进行静态发布；发布需要仓库所有者操作与 GitHub Pages 实际成功回执。当前仓库没有默认发布或远程执行动作。

## 隐私与安全

- 运行时不调用 GitHub API 或外部模型，不持久保存用户填写的需求，也不会发送到服务端。
- 只有用户主动下载时，浏览器才在本机生成 Markdown/JSON 文件。业务数据请勿提交到公开仓库。
- 凡涉及私有 Repo、企业数据、支付、真机发布、外部写入的动作，必须在获授权环境按最小权限执行。
- 来源固定版本更新需审查差异并同步元数据，不以公网网页直接 fetch 私有仓库。

本仓库尚无明确第三方再分发许可证；在做商业分发或开放贡献前应由仓库所有者确定许可。
