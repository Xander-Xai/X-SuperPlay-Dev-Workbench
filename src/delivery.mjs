// AI-Native Full-Stack Delivery capability model.
//
// This module is a *compatibility view* over the canonical 11-stage lifecycle in
// catalog.mjs. It does not define a second state machine: every macro stage and
// every detailed activity maps back to one or more canonical STAGE_IDS. The
// evidence model in evidence.mjs stays authoritative.
//
// Browser-safe: pure data + pure functions, no Node imports.

import { STAGE_IDS, SKILL_IDS, ROUTE_SOPS, TYPES, EVIDENCE_STATES } from "./catalog.mjs";

// ---------------------------------------------------------------------------
// G0–G7 macro stages. Linear, non-authoritative grouping of the 11 stages.

export const MACRO_STAGES = Object.freeze([
  Object.freeze({ id: "G0", name: "机会与项目接入", canonicalStages: ["intake", "discovery"], goal: "判断是否值得做、授权边界与真实基线" }),
  Object.freeze({ id: "G1", name: "产品定义", canonicalStages: ["specification"], goal: "把需求变成可观察、可验证的 AC 与负例" }),
  Object.freeze({ id: "G2", name: "工程设计", canonicalStages: ["architecture"], goal: "边界、数据、接口、权限与可逆性决策" }),
  Object.freeze({ id: "G3", name: "Tickets 与执行环境", canonicalStages: ["planning"], goal: "纵向切片、依赖、预算与 Agent Harness" }),
  Object.freeze({ id: "G4", name: "纵向实现", canonicalStages: ["implementation"], goal: "以最小可运行增量实现并维护测试契约" }),
  Object.freeze({ id: "G5", name: "工程验证", canonicalStages: ["verification", "review"], goal: "真实测试、契约、E2E、安全负例与独立审查" }),
  Object.freeze({ id: "G6", name: "发布交付", canonicalStages: ["release"], goal: "授权、迁移、备份、发布回执与回滚" }),
  Object.freeze({ id: "G7", name: "运营复盘", canonicalStages: ["operation", "postmortem"], goal: "监控、恢复、用户反馈与规则改进" })
]);

// ---------------------------------------------------------------------------
// 18 detailed activities. Each maps to canonical stages and names one primary
// procedure owner plus an alternate. External procedures are candidates only.

const A = (o) => Object.freeze({
  id: o.id,
  name: o.name,
  stages: Object.freeze([...o.stages]),
  knowledge: Object.freeze([...o.knowledge]),
  inputs: Object.freeze([...o.inputs]),
  humanDecisions: Object.freeze([...o.humanDecisions]),
  agentOperations: Object.freeze([...o.agentOperations]),
  primarySkill: o.primarySkill,
  alternateSkills: Object.freeze([...o.alternateSkills]),
  skillNote: o.skillNote,
  tools: Object.freeze([...o.tools]),
  outputs: Object.freeze([...o.outputs]),
  happyPath: o.happyPath,
  negative: o.negative,
  stopConditions: Object.freeze([...o.stopConditions]),
  deterministicControls: Object.freeze([...o.deterministicControls]),
  greenfield: o.greenfield,
  brownfield: o.brownfield
});

const LOCAL_SKILL_NOTE = "本地候选 Skill：来源=冻结快照语义重写（src/catalog.mjs），许可=UNLICENSED-PROPRIETARY，状态=CANDIDATE；未在真实项目执行，安装≠调用≠验证。";
const EXTERNAL_SKILL_NOTE = "外部 Skill 仅作候选：需用户显式触发、核对许可证与 pin 后由目标项目自行安装，本仓库不 Vendor。";

export const ACTIVITIES = Object.freeze([
  A({
    id: "A01", name: "需求发现", stages: ["intake", "discovery"],
    knowledge: ["业务问题与用户工作流", "现状系统与数据边界", "授权、预算与停止条件"],
    inputs: ["原始需求", "项目类型与 Tier", "现有仓库/系统只读基线"],
    humanDecisions: ["是否启动", "真实用户与采购方", "授权范围与不可接受风险"],
    agentOperations: ["只读扫描仓库与文档", "运行最便宜的验证命令", "记录事实与 UNKNOWN"],
    primarySkill: "project-discovery", alternateSkills: ["specification"],
    skillNote: LOCAL_SKILL_NOTE,
    tools: ["git", "node tools/project-probe.mjs", "node tools/xeng.mjs audit"],
    outputs: ["project-brief.md", "baseline.json", "risk-summary.md"],
    happyPath: "需求来源、用户、约束与授权边界可核验，假设有验证动作。",
    negative: "需求来源不明、无授权、目标互相矛盾时必须停止，不得进入实现。",
    stopConditions: ["需求来源不可核验", "无授权范围", "无法访问真实系统"],
    deterministicControls: ["仓库/链接存在性检查", "baseline HEAD 与 dirty 记录", "敏感文件排除检查"],
    greenfield: "从空白目录确认技术栈候选与命名，禁止预置业务假设。",
    brownfield: "先读项目本地 AGENTS/CLAUDE 与真实 CI，文档与代码冲突须记录而非静默采纳。"
  }),
  A({
    id: "A02", name: "用户研究与价值判断", stages: ["discovery"],
    knowledge: ["用户访谈与观察", "价值假设与反证", "采购/合规约束"],
    inputs: ["访谈记录或真实反馈", "竞品与替代方案", "可观察的业务指标"],
    humanDecisions: ["是否值得继续投入", "目标用户优先级", "不可伪造的价值证据"],
    agentOperations: ["整理证据与矛盾", "提出可证伪假设", "设计最便宜的反证实验"],
    primarySkill: "project-discovery", alternateSkills: ["specification"],
    skillNote: LOCAL_SKILL_NOTE,
    tools: ["访谈模板", "需求证据台账", "xeng playbook ai-application"],
    outputs: ["value-hypothesis.md", "evidence-ledger.md"],
    happyPath: "价值假设有真实用户证据或明确的反证计划。",
    negative: "把面经/JD 当作已签客户、或把愿望当事实时必须标记 ENGINEERING_HYPOTHESIS。",
    stopConditions: ["只有二手摘要", "无真实用户", "价值假设不可证伪"],
    deterministicControls: ["证据来源字段完整性", "二手来源标记检查"],
    greenfield: "允许以合成用户做最小实验，但必须标注非真实客户。",
    brownfield: "优先读取真实工单、客服记录与运行指标，不用文档声称替代。"
  }),
  A({
    id: "A03", name: "AI-native 产品设计", stages: ["specification", "architecture"],
    knowledge: ["AI 能力边界与失败模式", "人机协作交互", "成本/延迟/隐私权衡"],
    inputs: ["价值假设", "AI Profile 选择", "数据与模型约束"],
    humanDecisions: ["AI 是否必要", "不可接受的自动化程度", "HITL 边界"],
    agentOperations: ["起草 AI-native UX 方案", "列出降级与兜底路径", "标注评测需求"],
    primarySkill: "specification", alternateSkills: ["architecture"],
    skillNote: EXTERNAL_SKILL_NOTE,
    tools: ["xeng playbook ai-application", "xeng playbook rag", "xeng playbook agent"],
    outputs: ["ai-product-design.md", "eval-plan.md"],
    happyPath: "AI 交互有明确输入、输出、失败与人工接管路径。",
    negative: "模型输出被当作可信输入、无降级路径、提示词含密钥时必须阻断。",
    stopConditions: ["无法定义评测", "无数据授权", "AI 绕过平台权限 Gate"],
    deterministicControls: ["eval 目录与阈值检查", "提示词密钥扫描", "降级路径存在性检查"],
    greenfield: "先做确定性骨架，再叠加 AI Overlay，评测先于扩展。",
    brownfield: "沿用现有模型/提示词版本管理，变更必须附前后评测数字。"
  }),
  A({
    id: "A04", name: "PRD、Spec 与验收标准", stages: ["specification"],
    knowledge: ["Given/When/Then", "负例与边界", "非功能约束"],
    inputs: ["需求发现结论", "业务方确认", "AI/支付等扩展义务"],
    humanDecisions: ["AC 是否可接受", "范围与非目标", "业务负例"],
    agentOperations: ["起草 Spec 与 AC", "写负例与验证方法", "标记待确认项"],
    primarySkill: "specification", alternateSkills: ["implementation-plan"],
    skillNote: LOCAL_SKILL_NOTE,
    tools: ["spec 模板", "xeng task feature"],
    outputs: ["spec.md", "acceptance-criteria.md"],
    happyPath: "每条 AC 可观察、可验证，且命名验证方法。",
    negative: "不可验证的 AC、缺失负例、业务方未确认的关键范围不得进入实现。",
    stopConditions: ["AC 无法验证", "业务方未确认", "范围持续扩大"],
    deterministicControls: ["AC 编号完整性", "每条 AC 的验证方法字段检查"],
    greenfield: "允许最小 Spec，但必须包含非目标与权限负例。",
    brownfield: "必须引用现有契约与兼容要求，禁止用新 Spec 覆盖项目本地规则。"
  }),
  A({
    id: "A05", name: "UI/UX 与交互设计", stages: ["specification", "architecture"],
    knowledge: ["信息架构", "可访问性", "状态与空态/错误态"],
    inputs: ["Spec 与 AC", "品牌/设计约束", "目标设备与浏览器"],
    humanDecisions: ["视觉方向", "关键交互取舍", "可访问性底线"],
    agentOperations: ["绘制页面/状态清单", "实现可运行原型", "截图与移动宽度检查"],
    primarySkill: "specification", alternateSkills: ["architecture"],
    skillNote: "本地无专用 UI Skill；外部设计 Skill 仅为候选。" + EXTERNAL_SKILL_NOTE,
    tools: ["浏览器截图", "Playwright", "移动宽度 390px 检查"],
    outputs: ["ui-states.md", "screenshots/"],
    happyPath: "主路径、空态、错误态、加载态与移动宽度均可检查。",
    negative: "仅靠读代码判断布局、未运行浏览器就声称通过，必须写 NOT_RUN。",
    stopConditions: ["无法渲染", "无目标设备/浏览器", "可访问性阻断"],
    deterministicControls: ["DOM id 存在性检查", "截图存在性检查", "移动宽度无横向滚动检查"],
    greenfield: "先建立最小可运行页面，再迭代视觉。",
    brownfield: "复用现有设计系统与组件，避免引入第二套视觉语言。"
  }),
  A({
    id: "A06", name: "技术架构及 ADR", stages: ["architecture"],
    knowledge: ["系统边界与依赖方向", "失败模式与可逆性", "技术选型取舍"],
    inputs: ["Spec 与 AC", "现有架构", "非功能约束"],
    humanDecisions: ["关键选型", "不可逆决策", "失效条件"],
    agentOperations: ["列选项与后果", "写 ADR", "标注回滚边界"],
    primarySkill: "architecture", alternateSkills: ["code-review"],
    skillNote: LOCAL_SKILL_NOTE,
    tools: ["ADR 模板", "OpenAPI", "依赖图"],
    outputs: ["adr/NNNN-*.md", "api-contract.yaml", "dependency-graph.md"],
    happyPath: "至少两个真实选项、后果与 falsifier 已记录。",
    negative: "单选项决策、无失效条件、安全边界不清时不得进入实现。",
    stopConditions: ["关键依赖不可获得", "安全边界无法确定", "不可逆决策无回滚"],
    deterministicControls: ["ADR 字段完整性", "API 契约 schema 校验", "依赖方向检查"],
    greenfield: "允许先定边界再做技术选型，但需记录被放弃的选项。",
    brownfield: "必须与现有 ADR 对齐，Supersede 旧 ADR 而非改写正文。"
  }),
  A({
    id: "A07", name: "数据库、API 与认证权限", stages: ["architecture", "implementation"],
    knowledge: ["数据模型与迁移", "认证/授权边界", "幂等与一致性"],
    inputs: ["架构决策", "权限矩阵", "数据保留/合规要求"],
    humanDecisions: ["数据归属", "角色与数据域", "迁移窗口"],
    agentOperations: ["起草 schema 与迁移", "实现 API 与授权检查", "写越权负例"],
    primarySkill: "architecture", alternateSkills: ["code-review"],
    skillNote: LOCAL_SKILL_NOTE,
    tools: ["PostgreSQL", "Prisma/Drizzle", "OpenAPI", "SSO/RBAC"],
    outputs: ["schema.sql", "migrations/", "api-contract.yaml", "authz-matrix.md"],
    happyPath: "服务端强制授权，迁移含升降级路径，重复请求幂等。",
    negative: "前端隐藏替代服务端校验、跨租户读写、重复回调造成重复写入必须阻断。",
    stopConditions: ["无迁移回滚", "权限模型不清", "生产数据未脱敏"],
    deterministicControls: ["迁移升降级脚本", "越权负例测试", "契约测试"],
    greenfield: "从第一天就建模租户/角色边界，不后补。",
    brownfield: "先读现有 schema 与迁移历史，禁止无备份覆盖。"
  }),
  A({
    id: "A08", name: "纵向 Tracer Tickets", stages: ["planning"],
    knowledge: ["纵向切片", "依赖排序", "可独立验证的增量"],
    inputs: ["Spec 与架构", "现有测试与 CI", "Agent 能力与预算"],
    humanDecisions: ["切片优先级", "风险接受", "预算上限"],
    agentOperations: ["拆 Ticket", "标注 blocked_by 与验证命令", "写负例测试计划"],
    primarySkill: "implementation-plan", alternateSkills: ["specification"],
    skillNote: LOCAL_SKILL_NOTE,
    tools: ["ticket 模板", "xeng task", "依赖图"],
    outputs: ["tickets.json", "plans/*.md"],
    happyPath: "首张 Ticket 可由新会话独立执行，每张有真实验证命令。",
    negative: "横向切片、依赖成环、无验证命令的 Ticket 不得进入实现。",
    stopConditions: ["切片无法独立验证", "依赖关系不清", "预算未定"],
    deterministicControls: ["依赖无环检查", "Ticket 字段完整性", "验证命令非空检查"],
    greenfield: "首张切片应纵向穿过 UI→API→DB→测试。",
    brownfield: "先补基线测试再切片，避免在无回归网下改动。"
  }),
  A({
    id: "A09", name: "Harness 与 Agent 执行环境", stages: ["planning", "implementation"],
    knowledge: ["上下文工程", "工具与权限边界", "反馈回路与预算"],
    inputs: ["Ticket 契约", "项目本地规则", "真实测试/ lint 命令"],
    humanDecisions: ["允许命令与文件范围", "外部成本预算", "升级条件"],
    agentOperations: ["准备只读上下文", "配置测试/lint/type 检查", "记录反馈与停止原因"],
    primarySkill: "implementation-plan", alternateSkills: ["systematic-debugging"],
    skillNote: LOCAL_SKILL_NOTE,
    tools: ["AGENTS.md/CLAUDE.md", "npm test", "lint", "typecheck", "sandbox"],
    outputs: ["harness-contract.md", "allowed-commands.txt"],
    happyPath: "Agent 有最小上下文、明确写范围、可运行反馈与停止规则。",
    negative: "注入生产密钥、授予提升权限、无限循环、无停止规则必须阻断。",
    stopConditions: ["权限边界不明", "无真实测试命令", "成本预算缺失"],
    deterministicControls: ["allowed_files 白名单", "forbidden_actions 检查", "迭代/时间/成本预算字段"],
    greenfield: "先建立最小可运行 Harness，再逐步放宽。",
    brownfield: "必须继承项目本地规则，不得用 Workbench 覆盖。"
  }),
  A({
    id: "A10", name: "前后端完整功能实现", stages: ["implementation"],
    knowledge: ["最小变更", "TDD/测试先行", "可运行增量"],
    inputs: ["Tracer Ticket", "项目本地规则", "已批准权限"],
    humanDecisions: ["实现取舍", "技术债接受", "范围变更"],
    agentOperations: ["写失败测试", "最小实现", "运行真实测试并记录"],
    primarySkill: "implementation-plan", alternateSkills: ["systematic-debugging"],
    skillNote: "本地无 implement/tdd Skill；上游 implement/tdd 仅为候选。" + EXTERNAL_SKILL_NOTE,
    tools: ["node --test", "vitest/jest", "playwright", "git"],
    outputs: ["commit", "test-output.txt"],
    happyPath: "增量可运行，相关测试通过，失败可复现。",
    negative: "删除断言换取通过、未授权操作、超出 allowed_files 必须阻断。",
    stopConditions: ["需要未授权凭据", "连续两次修复未改变假设", "超出预算", "范围漂移"],
    deterministicControls: ["测试套件", "diff 范围检查", "lint/typecheck"],
    greenfield: "先骨架后功能，保持每步可运行。",
    brownfield: "小步替换，先补回归测试，禁止大爆炸重写。"
  }),
  A({
    id: "A11", name: "TDD、集成测试与契约测试", stages: ["implementation", "verification"],
    knowledge: ["红绿重构", "契约测试", "测试质量"],
    inputs: ["AC 与负例", "API 契约", "真实依赖或可控替身"],
    humanDecisions: ["测试阈值", "可接受替身范围", "阻塞标准"],
    agentOperations: ["写契约/集成测试", "验证失败路径", "区分 mock 与真实依赖"],
    primarySkill: "verification", alternateSkills: ["systematic-debugging"],
    skillNote: LOCAL_SKILL_NOTE,
    tools: ["node --test", "supertest", "testcontainers", "OpenAPI diff"],
    outputs: ["test-report.md", "contract-diff.json"],
    happyPath: "AC 与负例均有测试，契约变更可检测。",
    negative: "mock 冒充真实依赖、跳过失败测试、只测实现细节必须阻断。",
    stopConditions: ["测试不稳定", "真实依赖不可用", "契约无兼容策略"],
    deterministicControls: ["AC→测试映射检查", "契约 diff", "测试覆盖率阈值（可选）"],
    greenfield: "从第一条 AC 就建立测试骨架。",
    brownfield: "先固定现有行为，再改契约，保留兼容窗口。"
  }),
  A({
    id: "A12", name: "浏览器 E2E 和 UX QA", stages: ["verification"],
    knowledge: ["E2E 稳定性", "跨浏览器/设备", "可访问性"],
    inputs: ["可运行应用", "黄金路径", "目标设备矩阵"],
    humanDecisions: ["验收设备范围", "可接受视觉差异", "阻断级 UX 缺陷"],
    agentOperations: ["运行浏览器脚本", "截图并分析布局", "记录控制台/网络错误"],
    primarySkill: "verification", alternateSkills: ["code-review"],
    skillNote: LOCAL_SKILL_NOTE,
    tools: ["Playwright", "browser-harness", "移动宽度 390px", "axe（可选）"],
    outputs: ["e2e-report.md", "screenshots/", "console-errors.txt"],
    happyPath: "黄金路径、移动宽度与关键负例在真实浏览器通过。",
    negative: "未运行浏览器就声称通过、只测桌面宽度、忽略控制台错误必须标 NOT_RUN。",
    stopConditions: ["浏览器不可用", "环境不稳定", "无法访问真实应用"],
    deterministicControls: ["E2E 脚本", "截图存在性", "无横向滚动检查", "console error 阈值"],
    greenfield: "先跑通黄金路径，再扩展负例。",
    brownfield: "覆盖现有主路径与回归点，避免只测新功能。"
  }),
  A({
    id: "A13", name: "故障诊断与根因分析", stages: ["discovery", "implementation", "operation"],
    knowledge: ["复现与二分", "日志/追踪", "根因 vs 症状"],
    inputs: ["失败现象", "日志/指标/追踪", "最近变更"],
    humanDecisions: ["止血 vs 根因修复", "生产操作授权", "回滚决策"],
    agentOperations: ["稳定复现", "提出并验证假设", "补回归测试"],
    primarySkill: "systematic-debugging", alternateSkills: ["verification"],
    skillNote: LOCAL_SKILL_NOTE,
    tools: ["日志", "OpenTelemetry", "git bisect", "调试器"],
    outputs: ["rca.md", "regression-test"],
    happyPath: "根因有证据，修复附回归测试。",
    negative: "盲改、把偶发当系统性、无复现就修复必须阻断。",
    stopConditions: ["无法复现", "需要生产权限", "连续假设失败"],
    deterministicControls: ["回归测试", "日志字段完整性", "bisect 记录"],
    greenfield: "先建立可观测性与复现脚本。",
    brownfield: "先止血再根因，保留事件时间线。"
  }),
  A({
    id: "A14", name: "独立双轴代码审查", stages: ["review"],
    knowledge: ["Spec 达成度", "工程与安全标准", "Finding 分类"],
    inputs: ["实现 diff", "Spec 与 AC", "验证证据"],
    humanDecisions: ["Mainline Blocker 判定", "Scope Change 批准", "合并决策"],
    agentOperations: ["对照 AC 审查", "检查安全与边界", "给出明确结论"],
    primarySkill: "code-review", alternateSkills: ["verification"],
    skillNote: LOCAL_SKILL_NOTE,
    tools: ["PR 模板", "review record", "git diff"],
    outputs: ["review.md", "pr-comment"],
    happyPath: "Spec 与 Standards 双轴均有结论，阻断项清零。",
    negative: "建议冒充阻断、Finding 自动变需求、无证据通过必须阻断。",
    stopConditions: ["存在未解决安全阻断", "证据缺失", "reviewed_candidate 不可变"],
    deterministicControls: ["PR 模板字段检查", "CI 必需检查", "reviewed_candidate digest（未接入）"],
    greenfield: "首次合并前建立双轴审查习惯。",
    brownfield: "重点审查契约兼容与迁移风险。"
  }),
  A({
    id: "A15", name: "安全、隐私和权限审计", stages: ["architecture", "verification", "review"],
    knowledge: ["威胁建模", "认证/授权负例", "隐私与数据最小化"],
    inputs: ["权限矩阵", "数据流", "依赖清单"],
    humanDecisions: ["风险接受", "合规边界", "安全阻断"],
    agentOperations: ["跑密钥/依赖扫描", "写越权与注入负例", "检查日志脱敏"],
    primarySkill: "code-review", alternateSkills: ["verification"],
    skillNote: LOCAL_SKILL_NOTE,
    tools: ["npm run security", "dependency-scan", "SAST（可选）", "威胁建模模板"],
    outputs: ["security-review.md", "scan-receipt.json"],
    happyPath: "密钥、依赖、越权与注入负例均有证据。",
    negative: "Tier 降级绕过安全 Gate、日志含敏感字段、提示词注入未处理必须阻断。",
    stopConditions: ["未解决安全阻断", "无法扫描依赖", "权限边界不清"],
    deterministicControls: ["secret scan", "dependency audit", "越权负例", "CSP/headers 检查"],
    greenfield: "从架构阶段就建模信任边界。",
    brownfield: "先扫描现有暴露面，再改业务逻辑。"
  }),
  A({
    id: "A16", name: "CI/CD 与发布", stages: ["verification", "release"],
    knowledge: ["可复现构建", "必需检查", "发布与回滚"],
    inputs: ["Review 结论", "发布检查单", "授权与回滚方案"],
    humanDecisions: ["发布授权", "窗口与灰度", "回滚触发条件"],
    agentOperations: ["配置 CI", "验证构建与迁移", "保存发布回执"],
    primarySkill: "verification", alternateSkills: ["documentation-sync"],
    skillNote: LOCAL_SKILL_NOTE,
    tools: ["GitHub Actions", "构建产物", "迁移脚本", "健康检查"],
    outputs: ["ci-run-receipt.json", "release-receipt.md", "changelog.md"],
    happyPath: "目标 SHA 的必需检查成功，发布有平台回执。",
    negative: "CI 通过冒充生产验收、无回滚、无备份发布必须阻断。",
    stopConditions: ["缺少授权", "备份未验证", "回滚不可用"],
    deterministicControls: ["CI 必需检查", "构建可复现检查", "迁移升降级", "smoke test"],
    greenfield: "第一天就接入 CI 与构建产物。",
    brownfield: "沿用现有流水线，先补必需检查再发布。"
  }),
  A({
    id: "A17", name: "监控、恢复和运营", stages: ["operation"],
    knowledge: ["指标/日志/追踪", "告警与值班", "恢复演练"],
    inputs: ["发布回执", "监控配置", "用户反馈"],
    humanDecisions: ["SLO/告警阈值", "事故等级", "恢复授权"],
    agentOperations: ["观察指标", "记录事件台账", "起草恢复步骤"],
    primarySkill: "systematic-debugging", alternateSkills: ["documentation-sync"],
    skillNote: LOCAL_SKILL_NOTE,
    tools: ["OpenTelemetry", "Sentry", "告警平台", "Runbook"],
    outputs: ["ops-log.md", "incident-ledger.md", "runbook.md"],
    happyPath: "服务在线、异常入台账、恢复路径可演练。",
    negative: "服务在线当业务验收、告警不可用、无恢复演练必须标 UNKNOWN。",
    stopConditions: ["监控不可用", "无法访问真实用户反馈", "恢复演练未做"],
    deterministicControls: ["健康检查", "告警规则存在性", "恢复演练记录"],
    greenfield: "发布前接入最小可观测性。",
    brownfield: "沿用现有监控，补齐缺失指标与 Runbook。"
  }),
  A({
    id: "A18", name: "文档、交接和复盘", stages: ["release", "operation", "postmortem"],
    knowledge: ["文档漂移", "交接完整性", "Blameless 复盘"],
    inputs: ["事件台账", "验证与发布证据", "失败模式"],
    humanDecisions: ["改进优先级", "规则/测试/Gate 取舍", "复用判定"],
    agentOperations: ["更新当前事实", "写复盘与改进候选", "检查链接与命令"],
    primarySkill: "documentation-sync", alternateSkills: ["code-review"],
    skillNote: LOCAL_SKILL_NOTE,
    tools: ["link check", "xeng doctor", "postmortem 模板"],
    outputs: ["postmortem.md", "handover.md", "improvement-candidates.md"],
    happyPath: "文档与真实系统一致，交接可执行，改进候选不自动晋级。",
    negative: "单次事件宣称 Skill 稳定、文档与代码漂移、交接缺命令必须阻断。",
    stopConditions: ["证据不足", "无法区分偶发与系统性", "交接责任人缺失"],
    deterministicControls: ["链接检查", "死路径检查", "当前事实 last_verified", "命令可运行检查"],
    greenfield: "从第一天维护当前事实文件。",
    brownfield: "先修复已漂移的当前事实，再写新文档。"
  })
]);

// ---------------------------------------------------------------------------
// Four product delivery branches + AI overlay. These reference the existing
// ROUTE_SOPS; they add coverage checklists, not a second lifecycle.

const BRANCH = (o) => Object.freeze({
  id: o.id, name: o.name, routeSop: o.routeSop,
  coverage: Object.freeze([...o.coverage]),
  negative: Object.freeze([...o.negative]),
  platformGates: Object.freeze([...o.platformGates])
});

export const PLATFORM_BRANCHES = Object.freeze([
  BRANCH({
    id: "saas", name: "SaaS / Micro-SaaS", routeSop: "saas",
    coverage: ["认证与会话", "租户隔离", "数据库迁移", "订阅权益", "支付 Webhook（仅确有需求）", "配额", "日志", "备份与恢复"],
    negative: ["跨租户读写", "会话失效", "重复回调", "配额绕过"],
    platformGates: ["支付渠道回执", "生产租户数据验收"]
  }),
  BRANCH({
    id: "enterprise", name: "企业 Web / 管理系统", routeSop: "enterprise",
    coverage: ["业务流程图", "RBAC", "角色与数据域", "字段级授权", "SSO", "审批状态机", "ERP/CRM 集成", "审计日志", "超时与幂等", "UAT", "交接"],
    negative: ["越权审批", "过期会话", "审计日志静默删除", "集成重复回调"],
    platformGates: ["企业 IdP 联调", "业务方 UAT 签收"]
  }),
  BRANCH({
    id: "mini-program", name: "微信小程序", routeSop: "mini-program",
    coverage: ["主体与类目", "AppID", "备案适用性", "合法域名", "登录态", "隐私授权", "真机", "体验版", "平台审核", "发布回执"],
    negative: ["无会话", "非法域名", "越权读取", "审核未过却称已发布"],
    platformGates: ["微信公众平台审核回执", "真机验证"]
  }),
  BRANCH({
    id: "app", name: "移动 APP", routeSop: "app",
    coverage: ["技术栈择一", "路由与状态", "离线状态", "安全存储", "设备权限", "签名", "构建", "TestFlight/测试轨道", "商店审核", "灰度", "回滚"],
    negative: ["断网丢状态", "权限拒绝崩溃", "未签名发布", "单平台证据冒充另一平台"],
    platformGates: ["商店审核回执", "真实设备安装"]
  })
]);

export const AI_OVERLAY = Object.freeze({
  id: "ai-overlay",
  name: "AI 横向扩展",
  capabilities: Object.freeze(["LLM", "RAG", "Agent", "多 Agent", "自动化工作流", "AI-native UX"]),
  rule: "AI Overlay 不能绕过底层 Web/SaaS/企业平台的权限 Gate。",
  requiredEvidence: Object.freeze(["eval", "integration-probe", "review"]),
  cannotSubstitute: "脚本假模型、静态扫描或 CI 通过不得替代真实模型评测或用户验收。"
});

// ---------------------------------------------------------------------------
// Commercial delivery states. Distinct layers cannot substitute for each other.

const DS = (id, name, meaning, requiredEvidence, cannotSubstitute) =>
  Object.freeze({ id, name, meaning, requiredEvidence: Object.freeze([...requiredEvidence]), cannotSubstitute });

export const DELIVERY_STATES = Object.freeze([
  DS("CODE_TESTED", "代码已测", "对最终代码真实执行相关测试并记录命令/结果", ["test"], "不等于 CI、部署或验收"),
  DS("CI_VERIFIED", "CI 已验证", "目标 SHA 的远端必需检查结束且成功", ["ci-run-receipt"], "不等于预发、发布或验收"),
  DS("STAGING_VERIFIED", "预发已验证", "预发环境主路径与迁移在真实依赖下通过", ["integration-probe", "manual-probe"], "不等于生产发布"),
  DS("RELEASED", "已发布", "真实部署或商店发布存在平台回执", ["receipt"], "不等于用户验收"),
  DS("CONSUMER_ACCEPTED", "消费者已验收", "真实消费者按约定 AC 完成验收", ["manual-probe", "receipt"], "不可由任何自动化替代")
]);

export const DELIVERY_STATE_IDS = Object.freeze(DELIVERY_STATES.map(s => s.id));

export function deliveryStateIndex(id) {
  return DELIVERY_STATE_IDS.indexOf(id);
}

// Forward-only. A later state requires every earlier state to be evidenced.
export function canAdvanceDelivery(from, to) {
  const a = deliveryStateIndex(from), b = deliveryStateIndex(to);
  return a >= 0 && b >= 0 && b === a + 1;
}

// ---------------------------------------------------------------------------
// Bounded execution loop and terminal states. Terminal reasons are mapped onto
// the existing evidence state machine; stop_reason carries the extra detail.

export const LOOP_PHASES = Object.freeze([
  "PREPARE", "RED", "IMPLEMENT", "GREEN", "REFACTOR", "VERIFY", "REVIEW", "RECORD", "STOP_OR_NEXT"
]);

const TS = (id, evidenceState, meaning) => Object.freeze({ id, evidenceState, stopReason: id, meaning });

export const LOOP_TERMINAL_STATES = Object.freeze([
  TS("VERIFIED", "VERIFIED", "所有 AC 与负例有可核验证据"),
  TS("BLOCKED", "BLOCKED", "外部依赖或权限阻断"),
  TS("HUMAN_REQUIRED", "BLOCKED", "需要人类决策或授权"),
  TS("NO_PROGRESS", "UNKNOWN", "连续尝试无新证据或新假设"),
  TS("BUDGET_EXCEEDED", "UNKNOWN", "迭代/时间/成本预算耗尽"),
  TS("SECURITY_STOP", "BLOCKED", "安全阻断不可协商"),
  TS("SCOPE_DRIFT", "BLOCKED", "范围漂移，需重新批准")
]);

export const LOOP_TERMINAL_IDS = Object.freeze(LOOP_TERMINAL_STATES.map(s => s.id));

export const LOOP_DEFAULTS = Object.freeze({
  maxAttemptsPerTicket: 3,
  maxReviewFixRounds: 2,
  stopWhenNoNewEvidence: true,
  requireHypothesisBeforeEdit: true,
  maxParallelTickets: 1,
  note: "保守初始参数，不是行业统一标准；项目可收紧不可放宽安全边界。"
});

// ---------------------------------------------------------------------------
// Per-Ticket harness contract. Every field is required before execution.

export const TICKET_CONTRACT_FIELDS = Object.freeze([
  "ticket_id", "spec_id", "base_sha", "accepted_AC", "blocked_by",
  "allowed_files", "allowed_commands", "forbidden_actions", "negative_tests",
  "iteration_budget", "time_budget", "external_cost_budget",
  "stop_conditions", "rollback", "evidence_paths", "reviewer"
]);

export const TICKET_CONTRACT_STATUS = Object.freeze({
  status: "CONTRACT_DEFINED_NOT_RUNTIME_ENFORCED",
  note: "字段与生成模板已定义；工具层强制（文件锁、命令白名单执行）尚未实现。"
});

// Development tests and independent acceptance cases are distinct. An agent may
// edit project tests under normal TDD, but must not edit protected acceptance
// cases to manufacture a pass.
export const ACCEPTANCE_TEST_POLICY = Object.freeze({
  devTests: "项目内测试，允许正常 TDD 编辑；每次修改须说明理由并保留回归。",
  protectedAcceptanceTests: "独立验收用例，记录在 accepted_AC / negative_tests；Agent 不得为通过而修改。",
  forbidden: "删除、弱化或改写独立验收用例以换取通过。",
  evidence: "开发测试通过不等于消费者验收；两层证据分开记录。"
});

// ---------------------------------------------------------------------------
// Skills selection and conflict matrix. Upstream metadata verified 2026-10-31.

const XS = (o) => Object.freeze({
  id: o.id, repo: o.repo, version: o.version, commit: o.commit, license: o.license,
  verifiedAt: "2026-10-31", verification: o.verification,
  reportedClaim: o.reportedClaim ?? null, reportedClaimStatus: o.reportedClaimStatus ?? "NOT_APPLICABLE",
  role: o.role, trigger: o.trigger,
  relations: Object.freeze({
    equivalent_to: Object.freeze([...(o.relations?.equivalent_to ?? [])]),
    conflicts_with: Object.freeze([...(o.relations?.conflicts_with ?? [])]),
    replaces: Object.freeze([...(o.relations?.replaces ?? [])])
  }),
  vendored: false,
  notes: o.notes
});

export const EXTERNAL_SKILLS = Object.freeze([
  XS({
    id: "mattpocock-skills", repo: "mattpocock/skills", version: "v1.3.1",
    commit: "24fe0ef7737efae15c87225755e9f6f5965e4888", license: "MIT",
    verification: "REPO_METADATA_VERIFIED",
    reportedClaim: "59db609", reportedClaimStatus: "MISMATCH",
    role: "spec → tickets → implement → tdd → review 学习链",
    trigger: "USER_EXPLICIT",
    relations: { equivalent_to: ["specification", "implementation-plan", "code-review"], conflicts_with: [], replaces: [] },
    notes: "报告称 v1.3.1=59db609，实际 v1.3.1=24fe0ef（2026-10-04）；59db609 是 2026-10-27 的另一个提交。旧 manifest 的 5beb35b 比 v1.3.1 领先 47 个提交。路径级等价未在 v1.3.1 逐一复核。"
  }),
  XS({
    id: "obra-superpowers", repo: "obra/superpowers", version: "v7.0.1",
    commit: "2ce8aa15d05bd57213e6f746f953aafb7ded7a8b", license: "MIT",
    verification: "REPO_METADATA_VERIFIED",
    role: "工作流/调试/协作方法集合",
    trigger: "USER_EXPLICIT",
    relations: { equivalent_to: ["systematic-debugging", "code-review"], conflicts_with: [], replaces: [] },
    notes: "多 host 插件目录；是否与本地 8 个 Skill 语义冲突需逐 Skill 对比，当前只记录候选关系。"
  }),
  XS({
    id: "anthropics-skills", repo: "anthropics/skills", version: "HEAD",
    commit: "ca45fc496a3436251f191354091d557da31c15b5", license: "LICENSE_UNVERIFIED",
    verification: "REPO_METADATA_VERIFIED_LICENSE_MISSING",
    role: "官方 Skill 示例与规范",
    trigger: "USER_EXPLICIT",
    relations: { equivalent_to: [], conflicts_with: [], replaces: [] },
    notes: "仓库无 LICENSE 文件，仅 THIRD_PARTY_NOTICES.md；许可证未确立，禁止 Vendor 或复制正文。"
  }),
  XS({
    id: "vercel-labs-agent-skills", repo: "vercel-labs/agent-skills", version: "HEAD",
    commit: "1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62", license: "LICENSE_UNVERIFIED",
    verification: "REPO_METADATA_VERIFIED_LICENSE_MISSING",
    role: "前端/React/设计相关 Skill",
    trigger: "USER_EXPLICIT",
    relations: { equivalent_to: [], conflicts_with: [], replaces: [] },
    notes: "仓库无 LICENSE 文件；许可证未确立，禁止 Vendor。"
  }),
  XS({
    id: "github-spec-kit", repo: "github/spec-kit", version: "v1.2.5",
    commit: "4572a67fe0e72a6837e2d7bb0fda875bc41482e5", license: "MIT",
    verification: "REPO_METADATA_VERIFIED",
    role: "Spec-driven 工作流与模板",
    trigger: "USER_EXPLICIT",
    relations: { equivalent_to: ["specification", "implementation-plan"], conflicts_with: ["mattpocock-skills"], replaces: [] },
    notes: "与 mattpocock to-spec/to-tickets 流程重叠；同一活动只允许一个主流程所有者。"
  }),
  XS({
    id: "fission-openspec", repo: "Fission-AI/OpenSpec", version: "v1.16.0",
    commit: "27c0515724decc633818c735ee596481eec78a8b", license: "MIT",
    verification: "REPO_METADATA_VERIFIED",
    role: "规格变更管理",
    trigger: "USER_EXPLICIT",
    relations: { equivalent_to: ["specification"], conflicts_with: ["github-spec-kit"], replaces: [] },
    notes: "与 spec-kit 定位重叠；二选一作为主流程，另一作为参考。"
  }),
  XS({
    id: "expo-skills", repo: "expo/skills", version: "HEAD",
    commit: "05754e71d02abe0d2d7a2fb5259ccac41f5ea59c", license: "MIT",
    verification: "REPO_METADATA_VERIFIED",
    role: "Expo / React Native 官方技能",
    trigger: "USER_EXPLICIT",
    relations: { equivalent_to: [], conflicts_with: [], replaces: [] },
    notes: "仅在 app 路线选择 Expo/RN 时作为候选；不得因此同时引入四套端。"
  })
]);

export const SKILL_VERIFICATION_LAYERS = Object.freeze([
  "STATIC_CHECK", "INSTALL", "AGENT_DISCOVERY", "AGENT_INVOCATION", "REAL_PROJECT_EFFECT"
]);

export const SKILL_RELATION_POLICY = Object.freeze({
  maxPrimaryOwnersPerActivity: 1,
  externalTrigger: "USER_EXPLICIT_ONLY",
  statusLadder: Object.freeze(["CANDIDATE", "LOCALLY_VERIFIED", "REAL_PROJECT_VERIFIED", "REUSABLE"]),
  noVendoringWithoutLicense: true,
  verificationLayersSeparate: true,
  note: "静态检查、安装、Agent 发现、Agent 调用与真实项目效果必须分开验证；上游有 agents/openai.yaml 不代表本地候选自动兼容 Codex。"
});

// ---------------------------------------------------------------------------
// Task-oriented learning path. Theory is subordinate to a shipped, verified MVP.

export const LEARNING_PATH = Object.freeze({
  phase30: Object.freeze({
    days: "0-30", goal: "一个真实可运行、可验证的完整 Web MVP",
    priorityActivities: Object.freeze(["A01", "A04", "A05", "A06", "A07", "A10", "A11", "A12", "A16", "A17", "A18"]),
    tickets: "1 个真实 MVP，至少 3 张纵向 Ticket + 部署/备份/用户验收",
    evidence: Object.freeze(["test", "integration-probe", "receipt", "manual-probe"])
  }),
  phase60: Object.freeze({
    days: "31-90", goal: "企业业务系统 + Agent 工作流 + 可选小程序分支",
    priorityActivities: Object.freeze(["A02", "A03", "A08", "A09", "A13", "A14", "A15", "A16", "A17"]),
    tickets: "1 个企业场景 + 1 个 Agent 工作流；小程序/APP 为可选分支",
    evidence: Object.freeze(["eval", "integration-probe", "review", "receipt", "manual-probe"])
  }),
  mapping: "市场需求 → 真实任务 → 能力缺口 → 最小知识学习 → Skill 辅助 → 代码实现 → 测试证据 → 复盘",
  carryOver: "已有 Python / FastAPI / RAG / LangGraph 基础不重复学习；直接进入真实 Ticket 与证据。"
});

// ---------------------------------------------------------------------------
// Query helpers.

export function activityById(id) {
  return ACTIVITIES.find(a => a.id === id) ?? null;
}

export function activitiesForStage(stageId) {
  if (!STAGE_IDS.includes(stageId)) throw new Error("Unknown lifecycle stage: " + stageId);
  return ACTIVITIES.filter(a => a.stages.includes(stageId));
}

export function macroStageFor(stageId) {
  return MACRO_STAGES.find(m => m.canonicalStages.includes(stageId)) ?? null;
}

export function deliveryMatrix() {
  const rows = {};
  for (const stageId of STAGE_IDS) {
    rows[stageId] = {
      macro: macroStageFor(stageId)?.id ?? null,
      activities: activitiesForStage(stageId).map(a => a.id)
    };
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Validation. Called by validateCatalog() so `npm run check` covers it.

const REQUIRED_ACTIVITY_FIELDS = Object.freeze([
  "id", "name", "knowledge", "inputs", "humanDecisions", "agentOperations",
  "primarySkill", "alternateSkills", "skillNote", "tools", "outputs",
  "happyPath", "negative", "stopConditions", "deterministicControls",
  "greenfield", "brownfield"
]);

const nonEmptyArray = (v) => Array.isArray(v) && v.length > 0 && v.every(x => typeof x === "string" && x.trim());

export function validateDelivery() {
  const errors = [];

  // Macro stages: 8, ordered, no orphan, no duplicate authority.
  if (MACRO_STAGES.length !== 8) errors.push("delivery: expected 8 macro stages");
  if (new Set(MACRO_STAGES.map(m => m.id)).size !== MACRO_STAGES.length) errors.push("delivery: duplicate macro stage ids");
  const macroCovered = new Set();
  MACRO_STAGES.forEach((m, i) => {
    if (m.id !== "G" + i) errors.push("delivery: macro stage " + m.id + " out of order");
    if (!nonEmptyArray(m.canonicalStages)) errors.push("delivery: macro stage " + m.id + " has no canonical stages");
    for (const s of m.canonicalStages) {
      if (!STAGE_IDS.includes(s)) errors.push("delivery: macro stage " + m.id + " references unknown stage " + s);
      else if (macroCovered.has(s)) errors.push("delivery: stage " + s + " mapped to more than one macro stage");
      else macroCovered.add(s);
    }
    if (typeof m.goal !== "string" || !m.goal.trim()) errors.push("delivery: macro stage " + m.id + " has no goal");
  });
  for (const s of STAGE_IDS) if (!macroCovered.has(s)) errors.push("delivery: canonical stage " + s + " has no macro stage (orphan)");

  // Activities: 18, sequential, all fields, all stages covered.
  if (ACTIVITIES.length !== 18) errors.push("delivery: expected 18 activities");
  if (new Set(ACTIVITIES.map(a => a.id)).size !== ACTIVITIES.length) errors.push("delivery: duplicate activity ids");
  const activityCovered = new Set();
  ACTIVITIES.forEach((a, i) => {
    if (a.id !== "A" + String(i + 1).padStart(2, "0")) errors.push("delivery: activity " + a.id + " out of order");
    for (const field of REQUIRED_ACTIVITY_FIELDS) {
      const v = a[field];
      const ok = Array.isArray(v) ? nonEmptyArray(v) : (typeof v === "string" && v.trim().length > 0);
      if (!ok) errors.push("delivery: activity " + a.id + " missing " + field);
    }
    if (!nonEmptyArray(a.stages)) errors.push("delivery: activity " + a.id + " has no stages");
    for (const s of a.stages) {
      if (!STAGE_IDS.includes(s)) errors.push("delivery: activity " + a.id + " references unknown stage " + s);
      else activityCovered.add(s);
    }
    if (!SKILL_IDS.includes(a.primarySkill)) errors.push("delivery: activity " + a.id + " primary skill is not a local candidate: " + a.primarySkill);
    for (const alt of a.alternateSkills) if (!SKILL_IDS.includes(alt)) errors.push("delivery: activity " + a.id + " alternate skill unknown: " + alt);
    if (a.alternateSkills.includes(a.primarySkill)) errors.push("delivery: activity " + a.id + " repeats its primary skill as alternate");
  });
  for (const s of STAGE_IDS) if (!activityCovered.has(s)) errors.push("delivery: canonical stage " + s + " has no activity (orphan)");

  // Platform branches: exactly the four product types, tied to existing route SOPs.
  if (PLATFORM_BRANCHES.length !== Object.keys(TYPES).length) errors.push("delivery: branch count must match product types");
  const branchIds = new Set();
  for (const b of PLATFORM_BRANCHES) {
    if (branchIds.has(b.id)) errors.push("delivery: duplicate branch " + b.id);
    branchIds.add(b.id);
    if (!Object.hasOwn(TYPES, b.id)) errors.push("delivery: branch " + b.id + " is not a product type");
    if (!ROUTE_SOPS[b.routeSop] || ROUTE_SOPS[b.routeSop].id !== b.id) errors.push("delivery: branch " + b.id + " has no matching route SOP");
    for (const key of ["coverage", "negative", "platformGates"]) if (!nonEmptyArray(b[key])) errors.push("delivery: branch " + b.id + " missing " + key);
  }
  if (!AI_OVERLAY.capabilities.includes("RAG") || !AI_OVERLAY.capabilities.includes("Agent")) errors.push("delivery: AI overlay missing RAG/Agent");
  if (!AI_OVERLAY.rule.includes("不能绕过")) errors.push("delivery: AI overlay must state it cannot bypass platform permission gates");

  // Delivery states: ordered chain, no skipping.
  if (DELIVERY_STATES.length !== 5) errors.push("delivery: expected 5 delivery states");
  if (new Set(DELIVERY_STATE_IDS).size !== DELIVERY_STATES.length) errors.push("delivery: duplicate delivery state ids");
  for (const s of DELIVERY_STATES) {
    if (!nonEmptyArray(s.requiredEvidence)) errors.push("delivery: delivery state " + s.id + " has no evidence");
    if (!s.cannotSubstitute?.trim()) errors.push("delivery: delivery state " + s.id + " has no substitution rule");
  }

  // Loop + terminal states map onto the canonical evidence states.
  if (LOOP_PHASES.length !== 9) errors.push("delivery: loop must have 9 phases");
  if (LOOP_PHASES[0] !== "PREPARE" || LOOP_PHASES[LOOP_PHASES.length - 1] !== "STOP_OR_NEXT") errors.push("delivery: loop must start PREPARE and end STOP_OR_NEXT");
  if (LOOP_TERMINAL_STATES.length !== 7) errors.push("delivery: expected 7 terminal states");
  for (const t of LOOP_TERMINAL_STATES) {
    if (!EVIDENCE_STATES.includes(t.evidenceState)) errors.push("delivery: terminal state " + t.id + " maps to unknown evidence state");
    if (t.stopReason !== t.id) errors.push("delivery: terminal state " + t.id + " stop_reason mismatch");
  }

  // Ticket contract: every required field present exactly once.
  if (new Set(TICKET_CONTRACT_FIELDS).size !== TICKET_CONTRACT_FIELDS.length) errors.push("delivery: duplicate ticket contract field");
  for (const f of ["ticket_id", "spec_id", "base_sha", "accepted_AC", "blocked_by", "allowed_files", "allowed_commands", "forbidden_actions", "negative_tests", "iteration_budget", "time_budget", "external_cost_budget", "stop_conditions", "rollback", "evidence_paths", "reviewer"])
    if (!TICKET_CONTRACT_FIELDS.includes(f)) errors.push("delivery: ticket contract missing " + f);

  // Dev tests and protected acceptance cases must stay distinct.
  for (const key of ["devTests", "protectedAcceptanceTests", "forbidden", "evidence"])
    if (typeof ACCEPTANCE_TEST_POLICY[key] !== "string" || !ACCEPTANCE_TEST_POLICY[key].trim())
      errors.push("delivery: acceptance test policy missing " + key);
  if (!ACCEPTANCE_TEST_POLICY.forbidden.includes("验收")) errors.push("delivery: acceptance policy must protect acceptance cases");

  // External skills: license honesty and no silent vendoring.
  if (EXTERNAL_SKILLS.length < 6) errors.push("delivery: external skills matrix is too small");
  if (new Set(EXTERNAL_SKILLS.map(x => x.id)).size !== EXTERNAL_SKILLS.length) errors.push("delivery: duplicate external skill ids");
  for (const x of EXTERNAL_SKILLS) {
    if (!x.repo?.includes("/")) errors.push("delivery: external skill " + x.id + " has no repo");
    if (!x.commit || !/^[0-9a-f]{40}$/.test(x.commit)) errors.push("delivery: external skill " + x.id + " has no full commit SHA");
    if (!x.license?.trim()) errors.push("delivery: external skill " + x.id + " has no license status");
    if (x.license === "LICENSE_UNVERIFIED" && x.vendored) errors.push("delivery: external skill " + x.id + " vendored without a verified license");
    if (x.vendored) errors.push("delivery: external skill " + x.id + " must not be vendored by this repository");
    if (!["USER_EXPLICIT", "AUTO"].includes(x.trigger)) errors.push("delivery: external skill " + x.id + " has invalid trigger");
    for (const rel of ["equivalent_to", "conflicts_with", "replaces"]) {
      if (!Array.isArray(x.relations[rel])) errors.push("delivery: external skill " + x.id + " has invalid relations." + rel);
      for (const target of x.relations[rel])
        if (!SKILL_IDS.includes(target) && !EXTERNAL_SKILLS.some(e => e.id === target))
          errors.push("delivery: external skill " + x.id + " relation target unknown: " + target);
    }
  }
  if (SKILL_RELATION_POLICY.maxPrimaryOwnersPerActivity !== 1) errors.push("delivery: one primary skill owner per activity is required");
  if (SKILL_RELATION_POLICY.externalTrigger !== "USER_EXPLICIT_ONLY") errors.push("delivery: external skills must be user-explicit");

  // Learning path references real activities.
  for (const key of ["phase30", "phase60"]) {
    const phase = LEARNING_PATH[key];
    if (!phase || !nonEmptyArray(phase.priorityActivities)) { errors.push("delivery: learning path " + key + " missing activities"); continue; }
    for (const id of phase.priorityActivities) if (!activityById(id)) errors.push("delivery: learning path " + key + " references unknown activity " + id);
  }
  if (!LEARNING_PATH.mapping.includes("复盘")) errors.push("delivery: learning path mapping must end in review");

  return errors;
}
