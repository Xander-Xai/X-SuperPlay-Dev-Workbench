// Public, machine-readable engineering catalog owned by this Workbench.
// It is a semantic migration of the retiring Engineering OS, not a copy of its private bodies.
// The source repository is not archived, deleted or modified; retirement is not authorized.

export const PROVENANCE = Object.freeze({
  repository: "Xander-Xai/X-SuperPlay-AI-Engineering-OS",
  commit: "8553124f238ab463d4a50debad34e871ef8de060",
  registryVerified: "2026-09-30",
  captured: "2026-10-31",
  status: "HISTORICAL_PROVENANCE",
  url: "https://github.com/Xander-Xai/X-SuperPlay-AI-Engineering-OS",
  note: "Frozen snapshot used to derive this catalog. It is not a live dependency and not a permission grant."
});

export const OWNER = Object.freeze({
  repository: "Xander-Xai/X-SuperPlay-Dev-Workbench",
  role: "CURRENT_ENGINEERING_OWNER",
  url: "https://github.com/Xander-Xai/X-SuperPlay-Dev-Workbench",
  note: "Owns lifecycle, routing, profiles, standards, skills, CLI and evidence model."
});

export const GOVERNANCE = Object.freeze({
  repository: "Xander-Xai/AI-Native-Work-Learning-OS",
  commit: "f1289d685c95c7fac6f1d50068527a60f080ee1b",
  role: "GENERIC_GOVERNANCE_REFERENCE",
  status: "REFERENCE_ONLY_NOT_BUNDLED",
  note: "Generic human-AI governance semantics. Not copied here; only applied to software delivery."
});

export const RUNTIME = Object.freeze({
  name: "x-superplay-dev-workbench",
  version: "0.2.0",
  buildSha: "UNKNOWN_UNTIL_BUILT",
  cli: "node tools/xeng.mjs",
  skillCli: "node tools/skill-kit.mjs"
});

// Kept for callers that still read the historical source pin.
export const SOURCE = PROVENANCE;

export const EVIDENCE_KINDS = Object.freeze([
  "test", "eval", "integration-probe", "manual-probe", "receipt", "review", "doc-update", "adr"
]);

export const EVIDENCE_STATES = Object.freeze(["NOT_RUN", "BLOCKED", "IN_PROGRESS", "VERIFIED", "UNKNOWN"]);
export const EVIDENCE_LAYERS = Object.freeze([
  { id: "NOT_RUN", name: "未执行", meaning: "只有模板、计划或待执行命令。" },
  { id: "LOCAL_TESTED", name: "本地已测", meaning: "对最终代码真实执行测试，记录命令、环境与结果。" },
  { id: "CI_VERIFIED", name: "CI 已验证", meaning: "目标 SHA 的远端必需检查结束且成功。" },
  { id: "RELEASED", name: "已发布", meaning: "真实部署或商店发布存在平台回执。" },
  { id: "ACCEPTED", name: "已验收", meaning: "真实消费者按约定 AC 完成验收。" }
]);

// ---------------------------------------------------------------------------
// Profiles: what a project type owes. Levels are uniform across every profile.

const P = (id, name, appliesWhen, required, recommended, skills, extra = {}) => ({
  id, name, appliesWhen, required, recommended, skills,
  dirs: extra.dirs ?? [], overlay: extra.overlay ?? false,
  stackSensitive: extra.stackSensitive ?? false
});

export const PROFILES = Object.freeze([
  P("web", "Web 前端", "浏览器可见的 SPA / MPA / 管理后台",
    {
      artifacts: ["README 含可运行的 dev/build/deploy 命令", "提交锁文件"],
      practices: ["授权在服务端判定", "输出转义防 XSS", "状态变更请求防 CSRF", "配置 CSP"],
      tests: ["组件/逻辑单测", "Tier A 的黄金路径 e2e"],
      verification: ["UI 变更的浏览器渲染检查"],
      security: ["依赖审计", "前端包内无密钥"],
      release: ["同 commit 可复现构建"]
    },
    ["视觉回归或截图评审", "Tier A 可访问性检查", "包体预算"],
    ["verification", "code-review"], { dirs: ["tests"] }),

  P("saas", "SaaS 产品", "带账号、订阅或租户数据隔离的产品",
    {
      artifacts: ["认证模块或已文档化的认证集成", "含升降级路径的 migrations", ".env.example", "备份/恢复流程", "回滚方案并演练过一次"],
      practices: ["数据层强制租户边界", "认证与昂贵端点限流", "CSP/HSTS", "会话与令牌生命周期", "管理操作审计"],
      tests: ["业务逻辑单测", "API 契约集成测试", "认证绕过负例", "迁移升级+降级"],
      verification: ["API 契约测试", "跨租户隔离探针"],
      security: ["密钥扫描", "依赖审计", "路由变更的授权评审"],
      release: ["CHANGELOG", "部署前验证备份", "部署回执"]
    },
    ["指标与告警", "灰度/蓝绿部署", "公开时的条款与隐私页"],
    ["verification", "code-review", "systematic-debugging"], { dirs: ["migrations", "tests"] }),

  P("enterprise", "企业自研系统", "内部业务系统、权限体系与企业集成",
    {
      artifacts: ["业务流程与角色权限矩阵", "SSO / RBAC 集成说明", "审计日志与保留策略", "数据迁移方案", "备份与恢复 Runbook", "UAT 签收记录", "运行交接手册"],
      practices: ["最小权限与职责分离", "审计日志不可静默删除", "外部集成幂等与重试", "生产变更需审批"],
      tests: ["RBAC 越权负例", "企业集成契约测试", "UAT 脚本"],
      verification: ["业务方 UAT 回执", "权限拒绝证据"],
      security: ["SSO 配置评审", "密钥与凭据边界"],
      release: ["迁移与回滚方案", "运行交接回执"]
    },
    ["SSO（OIDC/SAML）", "审计日志导出", "关键岗位双人复核"],
    ["verification", "code-review"], { dirs: ["tests"] }),

  P("backend", "服务后端", "API 服务、worker、队列消费者、网关",
    {
      artifacts: ["README 运行说明", "提交 API 契约（OpenAPI 或等价）", "数据库迁移含降级", ".env.example", "健康检查"],
      practices: ["结构化日志含关联 ID", "统一错误结构", "可重试变更幂等", "启动时配置快速失败"],
      tests: ["业务逻辑单测", "API 契约测试", "每个外部依赖的成功与失败路径"],
      verification: ["契约测试", "对真实依赖的集成探针"],
      security: ["密钥扫描", "依赖审计"],
      release: ["CHANGELOG", "上一版本镜像/配置的回滚路径"]
    },
    ["错误率与 p95 指标", "OpenTelemetry 追踪", "性能敏感路径压测"],
    ["verification", "code-review", "systematic-debugging"], { dirs: ["tests"] }),

  P("ai-application", "大模型应用", "产品行为依赖模型输出的应用",
    {
      artifacts: ["版本化评测数据集与阈值", "模型/提示词配置外置", "降级与兜底路径", "token/成本可见性"],
      practices: ["提示词变更必须附评测数字", "每次生产调用记录模型与提示词版本", "模型输出视为不可信输入", "结构化日志含延迟与成本"],
      tests: ["模型周边确定性逻辑单测", "带阈值的评测集"],
      verification: ["变更前后评测对比", "黄金提示词人工探针"],
      security: ["入口处防提示词注入", "提示词中无密钥，PII 有处理说明"],
      release: ["发布说明记录评测阈值", "提示词/模型版本可热切换回滚"]
    },
    ["提示词变体 A/B 分桶", "按功能成本看板", "离线评测样本留存"],
    ["verification", "code-review", "systematic-debugging"], { dirs: ["evals"] }),

  P("rag", "RAG 知识库", "检索增强生成、向量库与检索管线",
    {
      artifacts: ["检索质量评测集（Hit@K / Recall@K / MRR）与金标文档 ID", "答案质量评测或评分规则", "embedding/reranker 配置外置", "索引重建流程"],
      practices: ["定义 chunk 契约与融合方式", "切分参数随索引版本化", "答案给出来源归属"],
      tests: ["检索原语单测", "带阈值的检索评测"],
      verification: ["PR 内检索评测数字", "黄金样本答案抽查"],
      security: ["摄入边界将文档视为不可信"],
      release: ["发布说明含评测数字与索引版本"]
    },
    ["向量/BM25/混合检索消融", "语料新鲜度与重建触发策略"],
    ["verification", "systematic-debugging"], { dirs: ["evals"] }),

  P("agent", "Agent 智能体", "多步工具调用与自主执行系统",
    {
      artifacts: ["工具契约文档（输入/输出/失败模式）", "步骤与来源台账", "停止条件与最大步数预算", "工具/供应商失败兜底"],
      practices: ["权限或凭据缺失时失败关闭", "不可逆动作需人工批准", "每次运行可归因（run id、任务、工具、证据）"],
      tests: ["规划/解析逻辑单测", "工具包装契约测试", "审批门禁对抗测试"],
      verification: ["全流程 dry-run", "来源台账检查"],
      security: ["工具凭据最小权限", "工具结果视为不可信输入"],
      release: ["启用新能力前评审门禁配置"]
    },
    ["端到端任务完成率评测", "每次运行成本预算与强制"],
    ["verification", "systematic-debugging"], { dirs: ["evals"] }),

  P("mini-program", "微信小程序", "微信或其他国内平台小程序",
    {
      artifacts: ["README 含开发/预览/发布命令", "appid 与平台配置外置", "合法请求域名清单", "体验版与正式版记录"],
      practices: ["使用官方 SDK 完成登录与会话", "不得把长期令牌放进 localStorage", "包体接近上限时使用分包", "弱网与冷启动有明确降级"],
      tests: ["可共享逻辑单测", "真机主路径检查"],
      verification: ["影响 UI 的变更需真机预览回执", "提审前平台工具审核"],
      security: ["客户端包内无密钥"],
      release: ["每次提交的版本与变更记录", "体验版/正式版版本固定记录", "平台审核与发布回执"]
    },
    ["miniprogram-automator 黄金路径 e2e", "离线/冷启动专项检查"],
    ["verification"], { dirs: ["tests"], stackSensitive: true }),

  P("mobile", "移动端通用", "所有移动 APP 共有的设备与分发义务",
    {
      artifacts: ["目标设备与系统版本矩阵", "签名与密钥管理说明", "分发渠道记录"],
      practices: ["认证与会话生命周期明确", "离线与异常恢复不丢状态", "本地存储不落明文敏感数据", "崩溃监控接入"],
      tests: ["设备矩阵冒烟", "断网重连测试"],
      verification: ["真实设备安装与主路径回执", "崩溃与分发监控证据"],
      security: ["本地存储安全", "包内无密钥"],
      release: ["签名构建回执", "分发渠道与版本回执"]
    },
    ["设备农场自动化", "灰度发布"],
    ["verification"], { dirs: ["tests"] }),

  P("android", "原生 Android", "Kotlin/Java Android 应用",
    {
      artifacts: ["gradle 构建/运行/测试命令已验证", "签名配置外置（keystore 不入库）"],
      practices: ["min/target SDK 策略", "网络安全配置明确，默认禁止明文"],
      tests: ["ViewModel/逻辑单测", "Tier A 的 instrumented 冒烟"],
      verification: ["构建成功回执", "设备/模拟器安装启动探针"],
      security: ["源码与 BuildConfig 无密钥", "依赖审计"],
      release: ["versionCode/versionName 策略", "签名发布构建回执"]
    },
    ["关键流程截图/UI 测试", "发布前 R8/ProGuard 验证"],
    ["verification"], { dirs: ["tests"] }),

  P("ios", "原生 iOS", "Swift/SwiftUI iOS 应用",
    {
      artifacts: ["xcodebuild / Xcode 构建测试命令已验证", "签名与 bundle id 外置"],
      practices: ["部署目标策略", "ATS 例外显式且有理由"],
      tests: ["XCTest 逻辑单测", "Tier A 的 UI 冒烟"],
      verification: ["构建成功回执", "模拟器/设备启动探针"],
      security: ["Info.plist 与源码无密钥"],
      release: ["build number 递增策略", "提审前 TestFlight 回执"]
    },
    ["关键视图快照测试"],
    ["verification"], { dirs: ["tests"] }),

  P("react-native", "React Native", "RN / Expo 跨端应用",
    {
      artifacts: ["两个目标平台的 dev/build/test 命令已验证", "提交锁文件"],
      practices: ["平台差异代码路径有文档", "原生模块边界列出"],
      tests: ["JS 逻辑单测", "Tier A 黄金路径 e2e"],
      verification: ["每次发布至少一个真实目标运行回执"],
      security: ["JS 包内无密钥"],
      release: ["OTA 与商店更新策略说明"]
    },
    ["逐平台截图评审", "崩溃上报接入"],
    ["verification"], { dirs: ["tests"] }),

  P("flutter", "Flutter", "Flutter 跨端应用",
    {
      artifacts: ["flutter run/test/build 命令已验证", "提交 pubspec.lock"],
      practices: ["目标平台显式列出，未测试平台标注不支持"],
      tests: ["单元/widget 测试", "Tier A 集成测试"],
      verification: ["每次发布至少一个真实目标运行回执"],
      security: ["打包资源与常量中无密钥"],
      release: ["pubspec 版本递增", "CHANGELOG"]
    },
    ["关键 widget 金图测试"],
    ["verification"], { dirs: ["tests"] }),

  P("desktop", "桌面应用", "Tauri / Electron / 原生桌面",
    {
      artifacts: ["dev/build/package 命令已验证", "签名与更新策略说明"],
      practices: ["能力/权限清单显式", "自动更新签名或校验和验证"],
      tests: ["主进程/核心逻辑单测", "Tier A 打包应用 e2e 冒烟"],
      verification: ["打包产物启动并跑通黄金路径"],
      security: ["包内无密钥，更新端点走 TLS"],
      release: ["版本递增与 CHANGELOG", "产物校验和记录"]
    },
    ["多系统安装冒烟", "崩溃上报/遥测"],
    ["verification"], { dirs: ["tests"] }),

  P("cli", "命令行工具", "CLI、脚本集合与开发工具",
    {
      artifacts: ["README 安装与用法示例真实可跑", "--help 作为维护中的契约", "版本号"],
      practices: ["退出码有意义", "非 tty 不交互", "破坏性操作提供 dry-run"],
      tests: ["核心逻辑单测", "以子进程方式调用 CLI 的 e2e 冒烟"],
      verification: ["CI 或记录的 CLI 冒烟回执"],
      security: ["密钥不通过参数传递"],
      release: ["CHANGELOG 与安装说明更新"]
    },
    ["shell 补全生成", "结构化输出 --json"],
    ["verification"], { dirs: ["tests"] }),

  P("infrastructure", "基础设施", "部署、代理、容器与运维仓库",
    {
      artifacts: ["拓扑与归属说明", "每个密钥对应的 .env.example", "幂等部署脚本", "回滚/恢复 Runbook"],
      practices: ["缺失配置时失败关闭", "节点丢失/重启后的状态恢复有文档", "线上节点变更走 Runbook"],
      tests: ["配置解析与 schema 校验", "部署状态冒烟脚本"],
      verification: ["可行时先 dry-run/预发节点", "部署后健康检查回执"],
      security: ["密钥扫描", "密钥轮换 Runbook", "最小权限服务账号"],
      release: ["变更回执（节点/配置/时间/执行人）", "回滚路径至少演练过一次"]
    },
    ["灰度变更路径", "节点监控告警", "备份恢复演练"],
    ["verification", "systematic-debugging"], { dirs: [] }),

  P("payments", "订阅与支付", "仅在实际需求触发时叠加",
    {
      artifacts: ["商户与支付渠道配置说明", "支付幂等与对账方案", "退款与异常处理流程"],
      practices: ["支付回调验签", "金额与币种服务端校验", "重复回调幂等", "敏感支付字段不落日志"],
      tests: ["支付回调幂等测试", "金额篡改负例", "对账差异检测"],
      verification: ["沙箱支付回执", "对账报告"],
      security: ["PCI/密钥边界说明", "支付日志脱敏"],
      release: ["支付开关与灰度", "回滚时支付状态处理"]
    },
    ["订阅生命周期事件", "退款自动化"],
    ["verification", "code-review"], { overlay: true })
]);

export const PROFILE_IDS = Object.freeze(PROFILES.map(p => p.id));
export const PROFILE_CONFLICTS = Object.freeze([
  ["android", "ios"], ["flutter", "react-native"], ["flutter", "android"],
  ["flutter", "ios"], ["react-native", "android"], ["react-native", "ios"]
]);

export const TYPES = Object.freeze({
  saas: {
    name: "SaaS 产品", tagline: "多租户 / 认证 / 商业交付", icon: "◈",
    profiles: ["saas", "web", "backend"],
    checks: ["跨租户隔离和权限负例", "登录、会话生命周期和限流", "迁移、备份和回滚", "付费场景下的订阅、支付幂等和审计"],
    acceptance: "租户 A 无法访问 B；端到端登录、业务写入与读取可核验。"
  },
  enterprise: {
    name: "企业自研系统", tagline: "权限 / 集成 / 企业验收", icon: "▦",
    profiles: ["enterprise", "web", "backend"],
    checks: ["RBAC / SSO 及最小权限", "ERP / CRM / API 集成契约", "数据迁移、审计和恢复", "最终用户 UAT 与运行交接"],
    acceptance: "业务方完成关键 UAT；越权访问拒绝；关键依赖失败可恢复。"
  },
  "mini-program": {
    name: "微信小程序", tagline: "微信登录 / 真机 / 发布审核", icon: "▣",
    profiles: ["mini-program", "backend"],
    checks: ["微信官方登录和服务端会话", "合法域名与包体限制", "真机弱网、冷启动和平台兼容", "体验版、提审和发布回执"],
    acceptance: "真机完成登录与业务主路径；审核与发布状态有平台回执。"
  },
  app: {
    name: "移动 APP", tagline: "多端适配 / 设备测试 / 上架", icon: "▤",
    profiles: ["mobile", "flutter", "backend"],
    checks: ["目标设备及系统版本矩阵", "权限、离线和异常恢复", "构建、签名和密钥边界", "商店发布、崩溃跟踪与回滚"],
    acceptance: "目标设备安装、启动并完成主路径；分发回执可核验。"
  }
});

export const STACKS = Object.freeze([
  { id: "flutter", name: "Flutter", appliesTo: ["app"], profiles: ["mobile", "flutter", "backend"] },
  { id: "react-native", name: "React Native / Expo", appliesTo: ["app"], profiles: ["mobile", "react-native", "backend"] },
  { id: "android", name: "原生 Android", appliesTo: ["app"], profiles: ["mobile", "android", "backend"] },
  { id: "ios", name: "原生 iOS", appliesTo: ["app"], profiles: ["mobile", "ios", "backend"] },
  { id: "mini-native", name: "原生微信小程序", appliesTo: ["mini-program"], profiles: ["mini-program", "backend"] },
  { id: "mini-taro", name: "Taro", appliesTo: ["mini-program"], profiles: ["mini-program", "web", "backend"] },
  { id: "mini-uniapp", name: "uni-app", appliesTo: ["mini-program"], profiles: ["mini-program", "web", "backend"] },
  { id: "mini-cloud", name: "微信云开发", appliesTo: ["mini-program"], profiles: ["mini-program"] }
]);

export const DEFAULT_STACK = Object.freeze({ app: "flutter", "mini-program": "mini-native" });

export const AGENTS = Object.freeze([
  { id: "claude-code", name: "Claude Code", skillsDir: ".claude/skills", loads: "项目级 .claude/skills" },
  { id: "codex", name: "Codex", skillsDir: ".agents/skills", loads: "项目级 .agents/skills" },
  { id: "opencode", name: "OpenCode", skillsDir: ".opencode/skills", loads: "项目级 .opencode/skills" }
]);

export const ADDONS = Object.freeze([
  { id: "ai-application", name: "大模型应用", profiles: ["ai-application"], note: "评测、成本和延迟" },
  { id: "rag", name: "RAG 知识库", profiles: ["ai-application", "rag"], note: "检索金标和证据评测" },
  { id: "agent", name: "Agent 智能体", profiles: ["ai-application", "agent"], note: "工具权限、轨迹与可恢复执行" },
  { id: "payments", name: "订阅与支付", profiles: ["payments"], note: "按实际需求触发；默认不启用", appliesTo: ["saas", "enterprise"] }
]);

// ---------------------------------------------------------------------------
// Lifecycle: 11 canonical stages. Task routes select and order them.

const S = (id, name, en, goal, inputs, deliverable, outputs, requiredSkills, recommendedSkills, agentOps, gate, evidence, stopWhen, next, skip) =>
  ({ id, name, en, goal, inputs, deliverable, outputs, requiredSkills, recommendedSkills, agentOps, gate, evidence, stopWhen, next, skip });

export const STAGES = Object.freeze([
  S("intake", "项目接入", "Intake",
    "明确需求来源、业务目标、规模、授权范围和停止条件",
    ["原始需求", "项目类型与 Tier", "现有系统/仓库状态", "授权与预算边界"],
    "项目简报 / Profile / 风险摘要",
    ["project-brief.md", "ENGINEERING_PROFILE.yaml"],
    ["project-discovery"], [],
    ["只读检查", "起草 Profile", "标记 UNKNOWN"],
    "关键未知信息须标记 UNKNOWN；无授权范围不得继续",
    ["doc-update"], ["需求来源不明", "无授权范围", "目标与约束互相矛盾"], ["discovery", "architecture", "END"],
    { allowed: false, reason: "接入是所有路线的起点" }),

  S("discovery", "需求发现", "Discovery",
    "调查用户工作流、代码现状、外部依赖与既有基线",
    ["项目简报", "仓库只读基线", "相关方访谈或文档"],
    "需求研究 / 系统现状报告",
    ["discovery-note.md", "baseline.json"],
    ["project-discovery"], [],
    ["只读扫描", "运行最便宜的验证命令", "记录事实与未知"],
    "假设有证据或明确的下一步验证动作；文档与代码冲突需记录",
    ["doc-update", "manual-probe"], ["无法访问真实系统", "关键事实不可核验"], ["specification", "architecture", "END"],
    { allowed: false, reason: "没有发现就无法定义可验收规格" }),

  S("specification", "可验收规格", "Specification",
    "定义边界、用户故事、正反用例与测试策略",
    ["需求发现结论", "业务方输入", "约束与非功能要求"],
    "Spec / AC / 负例",
    ["spec.md", "acceptance-criteria.md"],
    ["specification"], [],
    ["起草 Given/When/Then", "确认负例", "标记待确认项"],
    "关键 AC 可观察、可验证；不可验证的 AC 必须重写",
    ["doc-update"], ["AC 无法验证", "业务方未确认关键范围"], ["architecture", "planning", "implementation"],
    { allowed: true, when: "Tier C/D 或纯文档/调查任务", requires: "在任务记录中写明跳过理由" }),

  S("architecture", "架构决策", "Architecture",
    "设计系统边界、数据模型、安全与技术栈，并记录取舍",
    ["Spec 与 AC", "现有架构与依赖", "非功能约束"],
    "架构图 / API 契约 / ADR",
    ["adr/NNNN-*.md", "api-contract.yaml"],
    ["architecture"], [],
    ["列选项", "记录决策与失效条件", "标注回滚边界"],
    "安全、失败及回滚边界已明确；边界契约可验证",
    ["adr", "review"], ["关键依赖不可获得", "安全边界无法确定"], ["planning", "implementation"],
    { allowed: true, when: "变更可逆且不跨边界", requires: "在任务记录中写明理由；Tier A 不允许" }),

  S("planning", "实施计划", "Planning",
    "拆分可独立交付的纵切片，规定依赖、预算与执行者",
    ["Spec 与架构", "现有测试与 CI", "团队/Agent 能力"],
    "Tracer Tickets / 依赖图",
    ["plans/*.md", "tickets.json"],
    ["implementation-plan"], [],
    ["纵切", "按风险排序", "标注 blocked_by 与验证命令"],
    "首张任务卡可以由新会话独立执行；每张卡有真实验证命令",
    ["doc-update"], ["切片无法独立验证", "依赖关系不清"], ["implementation"],
    { allowed: true, when: "单文件可逆变更", requires: "记录理由" }),

  S("implementation", "实现与联调", "Implementation",
    "以可运行增量实现功能，并维护测试契约",
    ["Tracer Ticket", "项目本地规则", "已批准的权限范围"],
    "代码提交 / 单测 / 联调凭证",
    ["commit", "test-output.txt"],
    [], ["systematic-debugging"],
    ["最小变更", "先写失败测试", "真实运行", "记录证据"],
    "未授权操作不执行；失败可复现；不删除断言换取通过",
    ["test", "integration-probe"], ["需要未授权凭据", "连续两次修复未改变假设", "超出预算"], ["verification"],
    { allowed: false, reason: "实现是交付核心" }),

  S("verification", "验证评测", "Verification",
    "执行主路径、负例、安全、性能与端侧验证",
    ["实现结果", "Spec 与 AC", "任务类型的必需证据"],
    "测试结果 / 真机或集成凭证",
    ["evidence.json", "test-report.md"],
    ["verification"], ["systematic-debugging"],
    ["运行完整相关套件", "记录命令与环境", "区分代码检查/真实环境/消费者验收"],
    "UNKNOWN 不等于 PASS；无法运行的检查必须标 UNKNOWN",
    ["test", "eval", "integration-probe", "manual-probe", "receipt"], ["环境不可用", "测试不稳定", "缺少真实设备"], ["review", "release"],
    { allowed: true, when: "仅文档变更且链接检查已执行", requires: "记录替代证据" }),

  S("review", "评审", "Review",
    "独立审查规格达成度、工程标准、安全与风险",
    ["实现 diff", "Spec 与 AC", "验证证据"],
    "PR / Review 结论",
    ["review.md", "pr-comment"],
    ["code-review"], ["verification"],
    ["对照 AC 与标准", "安全面检查", "给出明确结论"],
    "阻断项清零或明确暂停；建议不等于阻断",
    ["review"], ["存在未解决的安全阻断", "证据缺失"], ["release", "implementation"],
    { allowed: true, when: "Tier C/D 且无生产影响", requires: "记录自审结论" }),

  S("release", "发布", "Release",
    "确认部署、迁移、备份、发布与回滚",
    ["Review 结论", "发布检查单", "授权与回滚方案"],
    "版本记录 / 发布回执",
    ["release-receipt.md", "changelog.md"],
    ["verification"], ["documentation-sync"],
    ["验证备份", "执行迁移", "发布并保存回执"],
    "必须得到相应授权和真实回执；无回执不得声称已发布",
    ["receipt", "review"], ["缺少授权", "备份未验证", "回滚不可用"], ["operation", "END"],
    { allowed: true, when: "内部工具或非生产环境", requires: "记录不发布理由" }),

  S("operation", "运行观察", "Operation",
    "追踪稳定性、成本、失败案例和用户反馈",
    ["发布回执", "监控与日志", "用户反馈"],
    "监控 / 事件台账 / 用户反馈",
    ["ops-log.md", "incident-ledger.md"],
    [], ["systematic-debugging", "documentation-sync"],
    ["观察指标", "记录事件", "区分服务在线与业务验收"],
    "服务在线不等于业务验收；异常必须进入台账",
    ["receipt", "manual-probe"], ["监控不可用", "无法访问真实用户反馈"], ["postmortem", "implementation"],
    { allowed: true, when: "一次性脚本或内部实验", requires: "记录理由" }),

  S("postmortem", "复盘迭代", "Postmortem",
    "根据真实工作证据提出规则、测试和 Skill 改进",
    ["事件台账", "验证与发布证据", "失败模式"],
    "复盘 / 改进候选 / 复用证据",
    ["postmortem.md", "improvement-candidates.md"],
    ["documentation-sync"], ["systematic-debugging"],
    ["分类失败模式", "提出最小修复", "标记复用证据"],
    "单次事件不能宣称 Skill 稳定；改进候选不得自动晋级",
    ["doc-update"], ["证据不足", "无法区分偶发与系统性"], ["END", "planning"],
    { allowed: true, when: "无事件且无复用候选", requires: "记录理由" })
]);

export const STAGE_IDS = Object.freeze(STAGES.map(s => s.id));

// ---------------------------------------------------------------------------
// Tasks: 13 verbs. Each maps to canonical stages plus a focus label per stage.

const T = (id, name, stages, skills, evidence, optionalEvidence, focus, notes) =>
  ({ id, name, stages, skills, evidence, optionalEvidence: optionalEvidence ?? [], focus, notes });

export const TASKS = Object.freeze([
  T("idea", "想法评估", ["intake", "discovery"], ["project-discovery"], ["doc-update"], [],
    { intake: "确认问题与停止条件", discovery: "判断是否值得启动" },
    "可以以「暂不启动」结束；不得把想法当已批准需求。"),
  T("feature", "功能开发", ["discovery", "specification", "architecture", "planning", "implementation", "verification", "review"],
    ["project-discovery", "specification", "architecture", "implementation-plan", "verification", "code-review"],
    ["test", "review"], ["eval", "integration-probe"],
    { discovery: "理解现状", specification: "定义 AC", architecture: "边界决策", planning: "纵切", implementation: "最小实现", verification: "真实测试", review: "双轴审查" },
    "Tier A/B 的默认完整路径；Tier C 可裁剪规格与架构。"),
  T("bug", "缺陷修复", ["discovery", "implementation", "verification", "review"],
    ["project-discovery", "systematic-debugging", "verification", "code-review"],
    ["test", "review"], [],
    { discovery: "稳定复现并定位根因", implementation: "先写回归测试再修复", verification: "完整相关套件", review: "确认无副作用" },
    "无法复现时转为 investigation，不得盲改。"),
  T("refactor", "重构", ["specification", "planning", "implementation", "verification", "review"],
    ["specification", "implementation-plan", "verification", "code-review"],
    ["test", "review"], [],
    { specification: "声明行为不变", planning: "切片", implementation: "小步替换", verification: "行为等价证据", review: "确认无行为漂移" },
    "「行为不变」本身就是验收证据。"),
  T("architecture", "架构决策", ["discovery", "architecture"], ["architecture", "project-discovery"],
    ["adr", "review"], [],
    { discovery: "现状与约束", architecture: "选项与 ADR" },
    "产出 ADR；不直接进入实现。"),
  T("investigation", "调查", ["discovery"], ["project-discovery"], ["doc-update"], [],
    { discovery: "只读调查并形成带日期的结论" },
    "只读；结束于研究文档，不包含修复。"),
  T("performance", "性能优化", ["discovery", "implementation", "verification"],
    ["systematic-debugging", "verification"], ["test", "receipt"], [],
    { discovery: "建立基线数字", implementation: "定位并修复", verification: "复测前后对比" },
    "没有前后数字就不算完成。"),
  T("security", "安全修复", ["discovery", "implementation", "verification", "review"],
    ["systematic-debugging", "verification", "code-review"], ["test", "review"], [],
    { discovery: "复现并评估影响", implementation: "修复根因", verification: "安全负例", review: "安全阻断必须清零" },
    "block-security 结论不可协商。"),
  T("documentation", "文档同步", ["verification", "implementation", "review"],
    ["documentation-sync"], ["doc-update"], [],
    { verification: "核对当前事实与链接", implementation: "同一变更内更新", review: "确认命令可运行" },
    "文档与代码分离 PR 会产生漂移窗口。"),
  T("migration", "迁移", ["planning", "implementation", "verification", "release"],
    ["implementation-plan", "verification"], ["test", "integration-probe", "receipt"], [],
    { planning: "扩展/迁移/收缩", implementation: "双向兼容", verification: "升降级验证", release: "迁移与回滚回执" },
    "回滚方案是计划的一部分。"),
  T("dependency-update", "依赖更新", ["discovery", "implementation", "verification", "review"],
    ["verification"], ["test"], [],
    { discovery: "评估变更与风险", implementation: "升级并修正", verification: "完整套件", review: "CHANGELOG" },
    "小步、频繁，避免长期积压。"),
  T("release", "发布", ["verification", "release"], ["verification"], ["receipt", "review"], [],
    { verification: "发布前验证", release: "授权、部署与回执" },
    "没有发布回执不得声称已发布。"),
  T("incident", "事故响应", ["operation", "discovery", "implementation", "verification", "postmortem"],
    ["systematic-debugging", "verification", "documentation-sync"], ["test", "receipt", "doc-update"], [],
    { operation: "先止血", discovery: "根因", implementation: "修复", verification: "验证", postmortem: "复盘必须" },
    "先稳定再定位；复盘不可省略。")
]);

export const TASK_IDS = Object.freeze(TASKS.map(t => t.id));

export const TIERS = Object.freeze({
  A: { name: "A · 生产级", spec: "required", plan: "required", adr: "required", review: "required", e2e: "recommended", rollback: "required", evidence: "strict" },
  B: { name: "B · 交付验证", spec: "required", plan: "required", adr: "conditional", review: "required", e2e: "optional", rollback: "recommended", evidence: "standard" },
  C: { name: "C · 学习实验", spec: "recommended", plan: "recommended", adr: "optional", review: "recommended", e2e: "optional", rollback: "optional", evidence: "light" },
  D: { name: "D · 一次性试验", spec: "optional", plan: "optional", adr: "optional", review: "optional", e2e: "optional", rollback: "optional", evidence: "minimal" }
});

// ---------------------------------------------------------------------------
// Skills: public, self-contained bundles shipped with this repository.

export const SKILLS = Object.freeze([
  {
    id: "project-discovery", name: "项目发现",
    description: "在陌生仓库中快速建立可核验的系统理解，并识别文档与现实的偏差",
    stages: ["intake", "discovery"], status: "candidate", installed: false,
    version: "0.2.0", bundle: "skills/project-discovery", selfContained: true,
    dependencies: [], license: "UNLICENSED-PROPRIETARY",
    provenance: { repository: PROVENANCE.repository, commit: PROVENANCE.commit, path: "05-skills/project-discovery/SKILL.md" }
  },
  {
    id: "specification", name: "需求规格",
    description: "把模糊需求转换为可观察、可验证的验收条件与负例",
    stages: ["specification"], status: "candidate", installed: false,
    version: "0.2.0", bundle: "skills/specification", selfContained: true,
    dependencies: [], license: "UNLICENSED-PROPRIETARY",
    provenance: { repository: PROVENANCE.repository, commit: PROVENANCE.commit, path: "05-skills/specification/SKILL.md" }
  },
  {
    id: "architecture", name: "架构决策",
    description: "以 ADR 记录边界、接口、信任边界与可逆性取舍",
    stages: ["architecture"], status: "candidate", installed: false,
    version: "0.2.0", bundle: "skills/architecture", selfContained: true,
    dependencies: [], license: "UNLICENSED-PROPRIETARY",
    provenance: { repository: PROVENANCE.repository, commit: PROVENANCE.commit, path: "05-skills/architecture/SKILL.md" }
  },
  {
    id: "implementation-plan", name: "实施计划",
    description: "把规格拆成可独立交付、可独立验证的垂直切片",
    stages: ["planning"], status: "candidate", installed: false,
    version: "0.2.0", bundle: "skills/implementation-plan", selfContained: true,
    dependencies: ["specification"], license: "UNLICENSED-PROPRIETARY",
    provenance: { repository: PROVENANCE.repository, commit: PROVENANCE.commit, path: "05-skills/implementation-plan/SKILL.md" }
  },
  {
    id: "systematic-debugging", name: "系统排障",
    description: "先复现与定位根因，再修复，并留下回归测试",
    stages: ["implementation", "verification", "operation", "postmortem"], status: "candidate", installed: false,
    version: "0.2.0", bundle: "skills/systematic-debugging", selfContained: true,
    dependencies: [], license: "UNLICENSED-PROPRIETARY",
    provenance: { repository: PROVENANCE.repository, commit: PROVENANCE.commit, path: "05-skills/systematic-debugging/SKILL.md" }
  },
  {
    id: "verification", name: "实证验证",
    description: "用可复现的证据证明工作完成，并诚实标记 UNKNOWN",
    stages: ["verification", "review", "release"], status: "candidate", installed: false,
    version: "0.2.0", bundle: "skills/verification", selfContained: true,
    dependencies: [], license: "UNLICENSED-PROPRIETARY",
    provenance: { repository: PROVENANCE.repository, commit: PROVENANCE.commit, path: "05-skills/verification/SKILL.md" }
  },
  {
    id: "code-review", name: "代码审查",
    description: "对照规格与工程标准进行对抗式审查，给出明确结论",
    stages: ["review"], status: "candidate", installed: false,
    version: "0.2.0", bundle: "skills/code-review", selfContained: true,
    dependencies: ["verification"], license: "UNLICENSED-PROPRIETARY",
    provenance: { repository: PROVENANCE.repository, commit: PROVENANCE.commit, path: "05-skills/code-review/SKILL.md" }
  },
  {
    id: "documentation-sync", name: "文档同步",
    description: "让文档与真实系统一致，并识别已经漂移的声明",
    stages: ["release", "operation", "postmortem"], status: "candidate", installed: false,
    version: "0.2.0", bundle: "skills/documentation-sync", selfContained: true,
    dependencies: [], license: "UNLICENSED-PROPRIETARY",
    provenance: { repository: PROVENANCE.repository, commit: PROVENANCE.commit, path: "05-skills/documentation-sync/SKILL.md" }
  }
]);

export const SKILL_IDS = Object.freeze(SKILLS.map(s => s.id));
