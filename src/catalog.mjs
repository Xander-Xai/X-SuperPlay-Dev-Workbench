// Public descriptors, not copies of private Engineering OS files.
export const SOURCE = {
  repository: "Xander-Xai/X-SuperPlay-AI-Engineering-OS",
  commit: "8553124f238ab463d4a50debad34e871ef8de060",
  registryVerified: "2026-09-30",
  captured: "2026-10-30",
  status: "CURATED_SNAPSHOT",
  url: "https://github.com/Xander-Xai/X-SuperPlay-AI-Engineering-OS"
};
export const TYPES = {
  saas: {name:"SaaS 产品",tagline:"多租户 / 认证 / 商业交付",icon:"◈",
    profiles:["saas","web","backend"],checks:["跨租户隔离和权限负例","登录、会话生命周期和限流","迁移、备份和回滚","付费场景下的订阅、支付幂等和审计"],
    acceptance:"租户 A 无法访问 B；端到端登录、业务写入与读取可核验。"},
  enterprise: {name:"企业自研系统",tagline:"权限 / 集成 / 企业验收",icon:"▦",
    profiles:["web","backend"],checks:["RBAC / SSO 及最小权限","ERP / CRM / API 集成契约","数据迁移、审计和恢复","最终用户 UAT 与运行交接"],
    acceptance:"业务方完成关键 UAT；越权访问拒绝；关键依赖失败可恢复。"},
  "mini-program": {name:"微信小程序",tagline:"微信登录 / 真机 / 发布审核",icon:"▣",
    profiles:["mini-program","backend"],checks:["微信官方登录和服务端会话","合法域名与包体限制","真机弱网、冷启动和平台兼容","体验版、提审和发布回执"],
    acceptance:"真机完成登录与业务主路径；审核与发布状态有平台回执。"},
  app: {name:"移动 APP",tagline:"多端适配 / 设备测试 / 上架",icon:"▤",
    profiles:["flutter","backend"],checks:["目标设备及系统版本矩阵","权限、离线和异常恢复","构建、签名和密钥边界","商店发布、崩溃跟踪与回滚"],
    acceptance:"目标设备安装、启动并完成主路径；分发回执可核验。"}
};
export const STACKS = [
  {id:"flutter",name:"Flutter",profiles:["flutter","backend"]},
  {id:"react-native",name:"React Native / Expo",profiles:["react-native","backend"]},
  {id:"android",name:"原生 Android",profiles:["android","backend"]},
  {id:"ios",name:"原生 iOS",profiles:["ios","backend"]}
];
export const AGENTS = [
  {id:"claude-code",name:"Claude Code"},
  {id:"codex",name:"Codex"},
  {id:"opencode",name:"OpenCode"}
];
export const ADDONS = [
  {id:"ai-application",name:"大模型应用",profiles:["ai-application"],note:"评测、成本和延迟"},
  {id:"rag",name:"RAG 知识库",profiles:["ai-application","rag"],note:"检索金标和证据评测"},
  {id:"agent",name:"Agent 智能体",profiles:["ai-application","agent"],note:"工具权限、轨迹与可恢复执行"}
];
export const SKILLS = [
  {id:"project-discovery",name:"项目发现",description:"读取真实工程状态并形成可核验的理解",stages:["intake","discovery"]},
  {id:"specification",name:"需求规格",description:"将目标转换为可测试的验收条件",stages:["specification"]},
  {id:"architecture",name:"架构决策",description:"接口、信任边界、ADR、非功能约束",stages:["architecture"]},
  {id:"implementation-plan",name:"实施计划",description:"可交付的垂直切片与依赖关系",stages:["planning"]},
  {id:"systematic-debugging",name:"系统排障",description:"复现、根因、修复和回归",stages:["implementation","verification","operation","postmortem"]},
  {id:"verification",name:"实证验证",description:"运行测试、记录结果并标出 UNKNOWN",stages:["verification","review","release"]},
  {id:"code-review",name:"代码审查",description:"对照 Spec 与工程标准双维审查",stages:["review"]},
  {id:"documentation-sync",name:"文档同步",description:"保持状态真实并提交改进候选",stages:["release","operation","postmortem"]}
].map(s=>({...s,status:"candidate",installed:false}));
export const STAGES = [
  {id:"intake",name:"项目接入",en:"Intake",goal:"明确需求来源、业务目标、规模和停止条件",deliverable:"项目简报 / Profile / 风险摘要",gate:"关键未知信息须标记 UNKNOWN"},
  {id:"discovery",name:"需求发现",en:"Discovery",goal:"调查用户工作流、代码现状和外部依赖",deliverable:"需求研究 / 系统现状报告",gate:"假设有证据或下一步验证动作"},
  {id:"specification",name:"可验收规格",en:"Specification",goal:"定义边界、用户故事、正反用例与测试策略",deliverable:"Spec / AC / 负例",gate:"关键 AC 可观察可验证"},
  {id:"architecture",name:"架构决策",en:"Architecture",goal:"设计系统边界、数据模型、安全和技术栈",deliverable:"架构图 / API 契约 / ADR",gate:"安全、失败及回滚边界已明确"},
  {id:"planning",name:"实施计划",en:"Planning",goal:"拆分可独立交付的纵切片，规定依赖与预算",deliverable:"Tracer Tickets / 依赖图",gate:"首张任务卡可以由新会话独立执行"},
  {id:"implementation",name:"实现与联调",en:"Implementation",goal:"以可运行增量实现功能并维护测试契约",deliverable:"代码提交 / 单测 / 联调凭证",gate:"未授权操作不执行，失败可复现"},
  {id:"verification",name:"验证评测",en:"Verification",goal:"执行主路径、负例、安全和性能验证",deliverable:"测试结果 / 真机或集成凭证",gate:"UNKNOWN 不等于 PASS"},
  {id:"review",name:"评审",en:"Review",goal:"独立审查规格达成度、工程标准和风险",deliverable:"PR / Review 结论",gate:"阻断项清零或明确暂停"},
  {id:"release",name:"发布",en:"Release",goal:"确认部署、迁移、备份、发布与回滚",deliverable:"版本记录 / 发布回执",gate:"必须得到相应授权和真实回执"},
  {id:"operation",name:"运行观察",en:"Operation",goal:"追踪稳定性、成本、失败案例和用户反馈",deliverable:"监控 / 事件台账 / 用户反馈",gate:"服务在线不等于业务验收"},
  {id:"postmortem",name:"复盘迭代",en:"Retrospective",goal:"根据真实工作证据提出规则、测试和 Skill 改进",deliverable:"复盘 / 改进候选 / 复用证据",gate:"单次事件不能宣称 Skill 稳定"}
];
