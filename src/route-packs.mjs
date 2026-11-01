// Route Packs: the route-specific view over the canonical 11-stage lifecycle.
// Pure data + pure rendering + validation. Readiness is PREFLIGHT, not a stage.
// This module never submits to a platform, deploys, or claims compliance.

import { ROUTE_SOPS, SKILLS, SKILL_IDS, STAGES, STAGE_IDS, TYPES } from "./catalog.mjs";

export const ROUTE_PACK_STATUS = Object.freeze("GENERATED_NOT_EXECUTED");

const S = (stage, actions, artifacts, exit) => Object.freeze({ stage, actions, artifacts, exit });

export const ROUTE_PACKS = Object.freeze({
  saas: Object.freeze({
    id: "saas",
    name: "SaaS / 多租户 Web",
    tagline: "租户隔离、商业计费、可回滚发布",
    readiness: [
      { id: "saas-r01", item: "主体、域名与部署地区确认；需要备案时取得备案号", owner: "产品负责人 / 法务", evidence: "主体证明、域名清单、备案回执", blocking: true },
      { id: "saas-r02", item: "隐私政策、DPA 模板、子处理者清单与数据驻留方案", owner: "法务 / 合规", evidence: "文档版本与审批记录", blocking: true },
      { id: "saas-r03", item: "支付商户号、计费模型与退款/对账责任人", owner: "财务 / 产品", evidence: "商户配置与对账流程", blocking: true },
      { id: "saas-r04", item: "开发、预发、生产环境与独立凭据；生产访问授权", owner: "工程负责人", evidence: "环境清单与访问审批", blocking: true },
      { id: "saas-r05", item: "备份存储、恢复演练窗口与 RPO/RTO 目标", owner: "工程负责人", evidence: "备份策略与演练计划", blocking: true },
      { id: "saas-r06", item: "监控、日志、告警与状态页账号", owner: "工程负责人", evidence: "账号与告警路由", blocking: false },
      { id: "saas-r07", item: "支持渠道、滥用举报与安全联系入口", owner: "运营", evidence: "可访问链接", blocking: false }
    ],
    stageFlow: [
      S("intake", ["确认商业目标、目标租户与使用地区", "记录授权、预算与不可接受风险"], ["intent.md", "授权与预算记录"], ["目标、非目标、数据类别和授权可审查"]),
      S("discovery", ["访谈租户管理员与终端用户", "梳理计费、配额、生命周期与退出路径"], ["用户旅程", "数据分类", "租户模型"], ["至少两条租户旅程和一份数据分类完成"]),
      S("specification", ["写租户隔离、认证、计费、配额、DSAR 的可验收条件", "为每条 AC 指定验证层与负例"], ["spec.md / AC", "负例清单"], ["每条 AC 有可执行验证方式"]),
      S("architecture", ["记录租户隔离、信任边界与数据驻留 ADR", "设计 OIDC/SAML、会话撤销、Webhook 签名与审计"], ["ADR", "API 契约", "威胁模型"], ["隔离方案与失败模式有决策记录"]),
      S("planning", ["按 expand-contract 拆分迁移与功能切片", "分配写者/审者、canary 与回滚责任人"], ["plan.md", "tickets.json"], ["每张 Ticket 可独立验证且依赖明确"]),
      S("implementation", ["实现租户键/RLS、幂等键、配额与审计事件", "保持最小 diff，不弱化测试"], ["代码", "单测/集成测试"], ["失败测试先于实现，关键路径可运行"]),
      S("verification", ["执行跨租户、IDOR、限流、支付幂等与会话撤销负例", "在副本上验证迁移升降级与恢复演练"], ["test-report.md", "负例回执"], ["关键负例与恢复演练有证据"]),
      S("review", ["双轴审查并单独做安全审查", "检查依赖、SBOM、日志脱敏与 Webhook 重放"], ["review.md", "安全 Finding 清单"], ["阻断项清零或明确暂停"]),
      S("release", ["构建一次并逐环境晋级；staging 验证后 canary", "准备回滚、状态页与 DPA/子处理者更新"], ["release-receipt.md", "回滚记录"], ["发布与回滚回执可查"]),
      S("operation", ["观察延迟、流量、错误与饱和", "核对计费与对账，维护 runbook 与告警"], ["ops-log.md", "SLO/对账记录"], ["告警、对账与值班交接有记录"]),
      S("postmortem", ["48 小时内完成 blameless 复盘", "记录客户沟通、行动项、负责人和日期"], ["postmortem.md"], ["根因、影响、行动项可验证"])
    ],
    gatePlan: [
      { gateIndex: 0, stage: "verification", evidence: "跨租户请求/响应、越权负例报告", cannotSubstitute: "前端隐藏、代码审阅、单租户测试" },
      { gateIndex: 1, stage: "verification", evidence: "认证绕过与限流测试回执", cannotSubstitute: "仅登录成功截图" },
      { gateIndex: 2, stage: "release", evidence: "副本迁移记录、发布与回滚回执", cannotSubstitute: "CI 绿、计划文档" },
      { gateIndex: 3, stage: "operation", evidence: "审计保留策略、WORM 证明、DSAR 演练", cannotSubstitute: "普通应用日志、未执行脚本" },
      { gateIndex: 4, stage: "review", evidence: "Webhook 重放负例、PCI 范围声明", cannotSubstitute: "仅 200 响应、口头声明" }
    ],
    negativeCases: [
      { id: "saas-n01", stage: "verification", scenario: "租户 A 读取租户 B 的列表与详情", expected: "拒绝并记录；响应不泄露存在性" },
      { id: "saas-n02", stage: "verification", scenario: "篡改资源 id 访问他人数据（IDOR）", expected: "403/404，审计事件可查" },
      { id: "saas-n03", stage: "verification", scenario: "重复提交支付或回调", expected: "幂等键生效，不重复扣款" },
      { id: "saas-n04", stage: "verification", scenario: "Webhook 重放或签名错误", expected: "拒绝并记录，不产生业务副作用" },
      { id: "saas-n05", stage: "operation", scenario: "会话撤销后继续使用旧令牌", expected: "请求被拒绝，撤销生效" },
      { id: "saas-n06", stage: "operation", scenario: "租户删除/导出请求覆盖他人数据", expected: "仅处理本租户数据，DSAR 回执完整" }
    ],
    skillEmphasis: {
      core: ["project-discovery", "specification", "architecture", "implementation-plan", "implementation", "verification", "security-review", "release-engineering", "incident-response"],
      strengthen: ["code-review", "systematic-debugging", "documentation-sync"],
      reference: ["eval-engineering", "agent-collaboration"]
    },
    notes: [
      "租户隔离是架构与验证义务，不是前端开关。",
      "计费与对账需要财务回执，不能由单元测试替代。",
      "DPA、数据驻留与 DSAR 属于外部证据；未取得时保持 NOT_RUN。"
    ]
  }),

  enterprise: Object.freeze({
    id: "enterprise",
    name: "企业自研系统",
    tagline: "权限矩阵、系统集成、UAT 与运行交接",
    readiness: [
      { id: "ent-r01", item: "采购/安全问卷、等保或行业要求与数据分级", owner: "企业安全 / 法务", evidence: "问卷回复、分级清单", blocking: true },
      { id: "ent-r02", item: "企业 IdP 元数据与 OIDC/SAML 联调窗口", owner: "企业 IT", evidence: "IdP 配置与联调记录", blocking: true },
      { id: "ent-r03", item: "集成系统清单、接口凭据与网络开通", owner: "企业 IT / 工程", evidence: "接口清单与访问审批", blocking: true },
      { id: "ent-r04", item: "角色/部门/字段级权限矩阵与审批人", owner: "业务负责人", evidence: "权限矩阵签字版", blocking: true },
      { id: "ent-r05", item: "UAT 用户、测试数据与签收流程", owner: "业务负责人", evidence: "UAT 名单与场景", blocking: true },
      { id: "ent-r06", item: "审计保留期限、WORM 要求与导出责任人", owner: "审计 / 合规", evidence: "保留策略", blocking: true },
      { id: "ent-r07", item: "供应商退出、数据导出与访问撤销条款", owner: "采购 / 法务", evidence: "合同条款", blocking: false }
    ],
    stageFlow: [
      S("intake", ["确认业务目标、组织边界与采购约束", "记录数据分级、授权与验收人"], ["intent.md", "干系人与授权记录"], ["业务目标、边界和验收人明确"]),
      S("discovery", ["访谈业务、IT、审计与最终用户", "梳理现有系统、集成点与手工流程"], ["流程现状", "系统清单", "数据分级"], ["关键流程与集成点有现状证据"]),
      S("specification", ["写权限、审批、审计、集成与 UAT 的可验收条件", "覆盖职责分离与字段级授权"], ["spec.md / AC", "权限矩阵草案"], ["每条 AC 有验证方式与业务签字人"]),
      S("architecture", ["设计 OIDC/SAML、SCIM、RBAC/ABAC 与集成契约", "确定审计 WORM、双跑与切换方案"], ["ADR", "集成契约", "权限模型"], ["身份、权限与审计边界有决策记录"]),
      S("planning", ["按业务纵切和集成依赖排序", "安排 UAT、双跑、切换与回退窗口"], ["plan.md", "tickets.json", "切换 Runbook"], ["每片可独立验证，依赖和窗口明确"]),
      S("implementation", ["实现权限校验、审批状态机、审计事件与集成适配", "保持向后兼容，记录迁移脚本"], ["代码", "迁移脚本", "测试"], ["失败测试先于实现，权限路径可运行"]),
      S("verification", ["执行越权、字段级、职责分离与集成超时/重试负例", "验证审计不可篡改与导出"], ["test-report.md", "权限负例回执"], ["权限与集成负例有证据"]),
      S("review", ["双轴审查并核对权限矩阵与审计设计", "检查依赖、日志脱敏与运行交接"], ["review.md", "交接清单"], ["阻断项清零，业务方确认范围"]),
      S("release", ["完成 UAT 签收与运行交接", "按双跑/切换 Runbook 执行并保留回退"], ["UAT 记录", "release-receipt.md", "切换记录"], ["业务方签收与切换回执可查"]),
      S("operation", ["监控集成成功率、延迟与审计写入", "维护值班、告警与供应商联系"], ["ops-log.md", "SLA 报表"], ["运行交接完成，告警与报表有记录"]),
      S("postmortem", ["复盘事故或重大变更", "更新权限矩阵、Runbook 与退出方案"], ["postmortem.md"], ["行动项有负责人和日期"])
    ],
    gatePlan: [
      { gateIndex: 0, stage: "verification", evidence: "RBAC 越权与字段级负例报告", cannotSubstitute: "角色表截图、单人演示" },
      { gateIndex: 1, stage: "verification", evidence: "集成契约测试、超时与重试幂等记录", cannotSubstitute: "接口文档、Mock 通过" },
      { gateIndex: 2, stage: "release", evidence: "UAT 签收、运行交接确认", cannotSubstitute: "开发自测" },
      { gateIndex: 3, stage: "review", evidence: "SoD 矩阵、审计 WORM 证明", cannotSubstitute: "流程图、普通日志" },
      { gateIndex: 4, stage: "architecture", evidence: "OIDC/SAML/SCIM 联调回执、电子签收记录", cannotSubstitute: "本地账号、口头承诺" }
    ],
    negativeCases: [
      { id: "ent-n01", stage: "verification", scenario: "普通用户调用管理员接口或提升角色", expected: "拒绝并记录，权限不提升" },
      { id: "ent-n02", stage: "verification", scenario: "同一人同时发起申请与审批（SoD 冲突）", expected: "状态机阻断并留痕" },
      { id: "ent-n03", stage: "operation", scenario: "离职员工账号在 SCIM 停用后仍可访问", expected: "访问被拒绝，停用同步可查" },
      { id: "ent-n04", stage: "verification", scenario: "跨部门或跨字段读取未授权数据", expected: "字段级/行级拒绝，审计可见" },
      { id: "ent-n05", stage: "operation", scenario: "篡改或删除审计记录", expected: "WORM 阻止并产生告警" },
      { id: "ent-n06", stage: "postmortem", scenario: "合同终止后仍保留访问或无法导出数据", expected: "访问撤销、导出回执可查" }
    ],
    skillEmphasis: {
      core: ["project-discovery", "specification", "architecture", "implementation-plan", "implementation", "verification", "security-review", "release-engineering", "documentation-sync"],
      strengthen: ["code-review", "systematic-debugging", "incident-response"],
      reference: ["eval-engineering", "agent-collaboration"]
    },
    notes: [
      "权限矩阵与 UAT 签收是业务证据，不能由工程自测替代。",
      "审计不可篡改和供应商退出属于外部义务；未取得回执时保持 NOT_RUN。",
      "集成依赖必须有超时、重试、幂等和降级策略。"
    ]
  }),

  "mini-program": Object.freeze({
    id: "mini-program",
    name: "微信小程序",
    tagline: "主体备案、隐私授权、内容安全与平台审核",
    readiness: [
      { id: "mp-r01", item: "小程序主体、AppID 与类目确认；主体与备案主体一致", owner: "产品负责人", evidence: "AppID、主体证明", blocking: true },
      { id: "mp-r02", item: "ICP 备案与公安备案；需要时完成平台付费认证", owner: "法务 / 运营", evidence: "备案号、认证状态", blocking: true },
      { id: "mp-r03", item: "类目专项资质（医疗、教育、金融等按实际功能）", owner: "业务 / 法务", evidence: "许可证与类目截图", blocking: true },
      { id: "mp-r04", item: "合法域名、TLS 1.2+ 受信 CA 链与域名数量核对", owner: "工程负责人", evidence: "域名清单、证书链", blocking: true },
      { id: "mp-r05", item: "《隐私保护指引》草稿与实际接口/数据清单", owner: "产品 / 法务", evidence: "指引与数据映射表", blocking: true },
      { id: "mp-r06", item: "内容安全 API 权限与审核责任人（含 UGC 场景）", owner: "工程 / 运营", evidence: "接口权限与审核流程", blocking: true },
      { id: "mp-r07", item: "体验版成员、真机设备与提审账号", owner: "工程负责人", evidence: "成员名单、设备清单", blocking: false }
    ],
    stageFlow: [
      S("intake", ["确认业务目标、目标用户与微信内使用场景", "记录主体、类目与备案约束"], ["intent.md", "主体与类目记录"], ["场景、主体和类目边界明确"]),
      S("discovery", ["梳理微信登录、手机号、支付与订阅消息使用点", "列出所有个人信息字段与用途"], ["用户旅程", "个人信息清单"], ["每个字段有用途、时机和最小化理由"]),
      S("specification", ["写登录、隐私授权、内容安全、包体与审核的可验收条件", "覆盖拒绝授权与审核驳回路径"], ["spec.md / AC", "隐私映射表"], ["每条 AC 有真机或平台验证方式"]),
      S("architecture", ["设计服务端会话、隐私接口调用时机与内容安全前后端双审", "规划主包/分包与合法域名"], ["ADR", "接口契约", "分包方案"], ["登录、隐私与内容安全边界有决策记录"]),
      S("planning", ["按页面纵切并安排真机与提审窗口", "标注平台不可替代步骤"], ["plan.md", "tickets.json", "提审清单"], ["每片可在体验版独立验证"]),
      S("implementation", ["接入 wx.login、wx.getPrivacySetting / wx.requirePrivacyAuthorize 与内容安全 API", "控制包体，处理弱网、冷启动和空态"], ["代码", "分包配置", "测试"], ["失败测试先于实现，隐私路径可运行"]),
      S("verification", ["真机验证登录、主路径、弱网与冷启动", "执行拒绝授权、隐私不一致与 UGC 未审负例"], ["真机报告", "隐私/内容安全回执"], ["真机与隐私负例有证据"]),
      S("review", ["审查隐私指引与代码接口 1:1", "检查包体、域名、内容安全与审核风险"], ["review.md", "隐私对照表"], ["阻断项清零，隐私映射一致"]),
      S("release", ["上传体验版并完成平台审核", "配置灰度、回退与线上监控"], ["提审记录", "审核回执", "灰度记录"], ["审核与发布回执可查；未获回执保持 NOT_RUN"]),
      S("operation", ["观察启动、登录、支付与内容安全失败率", "维护客服、投诉与紧急下线流程"], ["ops-log.md", "告警记录"], ["线上指标与投诉处理有记录"]),
      S("postmortem", ["复盘审核驳回、线上故障或隐私事件", "更新隐私映射与提审清单"], ["postmortem.md"], ["行动项有负责人和日期"])
    ],
    gatePlan: [
      { gateIndex: 0, stage: "verification", evidence: "真机登录与主路径记录（设备、微信版本）", cannotSubstitute: "开发者工具预览" },
      { gateIndex: 1, stage: "verification", evidence: "弱网、冷启动、空态降级复现记录", cannotSubstitute: "仅正常网络演示" },
      { gateIndex: 2, stage: "release", evidence: "体验版配置、平台审核回执", cannotSubstitute: "本地构建成功" },
      { gateIndex: 3, stage: "release", evidence: "ICP/公安备案号、付费认证状态、主体一致性", cannotSubstitute: "本地域名、未认证账号" },
      { gateIndex: 4, stage: "verification", evidence: "隐私弹窗/接口负例、内容安全 API 前后端回执", cannotSubstitute: "仅隐私政策文本、仅前端过滤" },
      { gateIndex: 5, stage: "release", evidence: "主包体积、TLS 证书链、iOS 虚拟支付限制核验", cannotSubstitute: "开发工具提示、Android 证据" }
    ],
    negativeCases: [
      { id: "mp-n01", stage: "verification", scenario: "默认勾选同意或拒绝授权后仍收集信息", expected: "不收集；拒绝路径可继续使用非必要功能" },
      { id: "mp-n02", stage: "verification", scenario: "隐私指引声明的字段/接口与实际不一致", expected: "对照表发现差异并阻断提审" },
      { id: "mp-n03", stage: "verification", scenario: "UGC 未经内容安全 API 直接展示", expected: "前后端均拦截并留回执" },
      { id: "mp-n04", stage: "verification", scenario: "请求未配置的合法域名或自签名证书", expected: "请求失败并记录，不绕过校验" },
      { id: "mp-n05", stage: "release", scenario: "主包超过平台限制或分包加载失败", expected: "构建阻断或降级路径可用" },
      { id: "mp-n06", stage: "release", scenario: "iOS 上尝试虚拟支付", expected: "按平台规则隐藏/阻断并提示" }
    ],
    skillEmphasis: {
      core: ["project-discovery", "specification", "implementation", "verification", "security-review", "release-engineering", "code-review"],
      strengthen: ["architecture", "implementation-plan", "systematic-debugging", "documentation-sync"],
      reference: ["incident-response", "eval-engineering", "agent-collaboration"]
    },
    notes: [
      "平台审核、备案和认证是外部回执，不能由本地测试替代。",
      "隐私指引必须与代码接口 1:1；拒绝授权路径也要可用。",
      "内容安全需要前后端双审，UGC 场景不能只做前端过滤。"
    ]
  }),

  app: Object.freeze({
    id: "app",
    name: "移动 APP",
    tagline: "设备矩阵、隐私声明、商店审核与分阶段发布",
    readiness: [
      { id: "app-r01", item: "Apple / Google 开发者账号与组织验证", owner: "产品负责人", evidence: "账号状态", blocking: true },
      { id: "app-r02", item: "Android upload/release key 与 iOS 签名证书/描述文件", owner: "工程负责人", evidence: "密钥保管与签名配置", blocking: true },
      { id: "app-r03", item: "商店资料、截图规格、年龄分级与审核 demo 账号", owner: "运营 / 产品", evidence: "商店素材与 demo", blocking: true },
      { id: "app-r04", item: "隐私清单/营养标签与 Google Data Safety 草稿（含三方 SDK）", owner: "法务 / 工程", evidence: "声明草稿与 SDK 清单", blocking: true },
      { id: "app-r05", item: "目标设备/系统版本矩阵与真机资源", owner: "工程负责人", evidence: "设备清单", blocking: true },
      { id: "app-r06", item: "崩溃、性能与灰度发布账号", owner: "工程负责人", evidence: "监控与发布权限", blocking: false },
      { id: "app-r07", item: "账号删除入口、UGC 审核与 COPPA 适用性判断", owner: "产品 / 法务", evidence: "入口链接与判断记录", blocking: true }
    ],
    stageFlow: [
      S("intake", ["确认目标平台、最低系统版本与商店范围", "记录账号、签名与审核约束"], ["intent.md", "平台与版本记录"], ["平台、版本和审核边界明确"]),
      S("discovery", ["梳理设备能力、权限、离线与升级场景", "列出三方 SDK 与数据收集点"], ["用户旅程", "权限清单", "SDK 清单"], ["权限与 SDK 数据用途可审查"]),
      S("specification", ["写权限、离线、升级、隐私与商店审核的可验收条件", "覆盖拒绝权限与旧版本升级"], ["spec.md / AC", "隐私声明映射"], ["每条 AC 有设备或商店验证方式"]),
      S("architecture", ["设计导航、状态、离线缓存、安全存储与深链", "确定隐私清单、Data Safety 与强制更新策略"], ["ADR", "模块边界", "隐私/商店声明草案"], ["权限、离线与升级路径有决策记录"]),
      S("planning", ["按设备能力和平台差异切片", "安排真机矩阵、商店审核与灰度窗口"], ["plan.md", "tickets.json", "发布清单"], ["每片可在目标设备独立验证"]),
      S("implementation", ["实现权限请求、离线恢复、升级迁移与安全存储", "接入崩溃/性能监控并控制包体"], ["代码", "平台配置", "测试"], ["失败测试先于实现，主路径可运行"]),
      S("verification", ["在设备矩阵执行安装、主路径、断网、权限拒绝与升级", "核对隐私声明与实际采集"], ["真机报告", "升级/离线回执"], ["关键设备与负例有证据"]),
      S("review", ["双轴审查并核对隐私清单、Data Safety 与三方 SDK", "检查深链、存储与发布配置"], ["review.md", "隐私对照表"], ["阻断项清零，声明与实现一致"]),
      S("release", ["生成 AAB/IPA 并完成签名与商店提审", "按比例灰度并准备暂停/回滚"], ["构建记录", "审核回执", "灰度记录"], ["商店审核与灰度回执可查"]),
      S("operation", ["监控崩溃、ANR、启动与关键漏斗", "处理商店评论、强制更新与版本淘汰"], ["ops-log.md", "崩溃/性能报表"], ["线上指标与版本策略有记录"]),
      S("postmortem", ["复盘崩溃、审核驳回或升级事故", "更新设备矩阵、隐私声明与发布清单"], ["postmortem.md"], ["行动项有负责人和日期"])
    ],
    gatePlan: [
      { gateIndex: 0, stage: "verification", evidence: "目标设备安装与黄金路径记录（构建号）", cannotSubstitute: "仅模拟器" },
      { gateIndex: 1, stage: "verification", evidence: "断网重连、权限拒绝负例", cannotSubstitute: "仅正常网络演示" },
      { gateIndex: 2, stage: "release", evidence: "签名构建、测试分发与商店审核回执", cannotSubstitute: "本地安装包" },
      { gateIndex: 3, stage: "release", evidence: "API 36 / 16 KB / AAB、Xcode 26 / iOS 26 SDK 构建记录", cannotSubstitute: "旧工具链“能跑”" },
      { gateIndex: 4, stage: "review", evidence: "Data Safety/营养标签覆盖三方 SDK、账号删除 URL", cannotSubstitute: "只看自身代码、隐藏入口" },
      { gateIndex: 5, stage: "review", evidence: "UGC/年龄分级/COPPA 判断、审核 demo 账号", cannotSubstitute: "默认成人、登录墙" }
    ],
    negativeCases: [
      { id: "app-n01", stage: "verification", scenario: "拒绝相机/定位/通知权限", expected: "降级可用，不崩溃，不反复骚扰" },
      { id: "app-n02", stage: "verification", scenario: "断网、弱网、后台被杀后恢复", expected: "缓存与重试正确，不丢关键操作" },
      { id: "app-n03", stage: "verification", scenario: "从旧版本升级并保留登录态/本地数据", expected: "迁移成功或给出可执行恢复路径" },
      { id: "app-n04", stage: "review", scenario: "三方 SDK 采集未在 Data Safety/隐私清单声明", expected: "声明补齐后才提审" },
      { id: "app-n05", stage: "release", scenario: "目标 API 级别或 16 KB page size 不兼容", expected: "构建阻断并修复" },
      { id: "app-n06", stage: "release", scenario: "深链被其他应用劫持或伪造", expected: "校验来源，敏感操作要求确认" }
    ],
    skillEmphasis: {
      core: ["specification", "architecture", "implementation", "verification", "security-review", "release-engineering", "code-review"],
      strengthen: ["project-discovery", "implementation-plan", "systematic-debugging", "incident-response"],
      reference: ["documentation-sync", "eval-engineering", "agent-collaboration"]
    },
    notes: [
      "商店审核、签名和真机证据不能由模拟器或本地构建替代。",
      "隐私声明必须覆盖三方 SDK 的实际采集。",
      "分阶段发布必须准备暂停、回滚和强制更新策略。"
    ]
  })
});

export const ROUTE_PACK_IDS = Object.freeze(Object.keys(ROUTE_PACKS));

export function routePackFor(type) {
  if (!Object.hasOwn(ROUTE_PACKS, type)) throw new Error("Unknown route pack: " + type);
  return ROUTE_PACKS[type];
}

export function stageSkillsFor(stageId) {
  const stage = STAGES.find(s => s.id === stageId);
  if (!stage) return [];
  return [...new Set([...(stage.requiredSkills ?? []), ...(stage.recommendedSkills ?? [])])];
}

const nonEmpty = value => typeof value === "string" && value.trim().length > 0;
const nonEmptyArray = value => Array.isArray(value) && value.length > 0;

export function routePackDocMarkdown(pack) {
  const sop = ROUTE_SOPS[pack.id];
  const stageName = id => STAGES.find(s => s.id === id)?.name ?? id;
  const skillLine = stage =>
    stageSkillsFor(stage)
      .map(id => pack.skillEmphasis.core.includes(id) ? id + "（core）" : id)
      .join(", ");
  return [
    "<!-- generated by tools/render-route-docs.mjs; source: src/route-packs.mjs -->",
    "",
    "# " + pack.name + " · 路线包",
    "",
    "> 状态：`GENERATED / NOT_RUN`。复用 11 阶段生命周期；开工前检查是 PREFLIGHT，不是第 12 阶段。",
    "> 本页不是合规声明，也不是平台回执。未取得外部证据时保持 `NOT_RUN`。",
    "> " + pack.tagline,
    "",
    "## 开工前检查（PREFLIGHT）",
    "",
    "| 检查项 | 负责人 | 证据 | 阻塞 |",
    "|---|---|---|---|",
    ...pack.readiness.map(r => "| " + r.item + " | " + r.owner + " | " + r.evidence + " | " + (r.blocking ? "是" : "否") + " |"),
    "",
    "## 11 阶段流程",
    "",
    "| 阶段 | 该路线动作 | 产物 | 退出标准 | 本阶段候选 Skill |",
    "|---|---|---|---|---|",
    ...pack.stageFlow.map(f => "| " + stageName(f.stage) + " | " + f.actions.join("<br>") + " | " + f.artifacts.join("<br>") + " | " + f.exit.join("<br>") + " | " + skillLine(f.stage) + " |"),
    "",
    "## 平台与合规 Gate",
    "",
    "| 阶段 | Gate | 证据 | 不能替代 |",
    "|---|---|---|---|",
    ...pack.gatePlan.map(g => "| " + stageName(g.stage) + " | " + sop.gates[g.gateIndex] + " | " + g.evidence + " | " + g.cannotSubstitute + " |"),
    "",
    "## 必须覆盖的负例",
    "",
    "| 阶段 | 场景 | 预期 |",
    "|---|---|---|",
    ...pack.negativeCases.map(n => "| " + stageName(n.stage) + " | " + n.scenario + " | " + n.expected + " |"),
    "",
    "## Skill 侧重",
    "",
    "| 层级 | Skill |",
    "|---|---|",
    "| core | " + pack.skillEmphasis.core.join(", ") + " |",
    "| strengthen | " + pack.skillEmphasis.strengthen.join(", ") + " |",
    "| reference | " + pack.skillEmphasis.reference.join(", ") + " |",
    "",
    "## 平台限制",
    "",
    ...sop.platformConstraints.map(x => "- " + x),
    "",
    "## 边界",
    "",
    ...pack.notes.map(x => "- " + x),
    ""
  ].join("\n");
}

export function validateRoutePacks() {
  const errors = [];
  const typeIds = Object.keys(TYPES);
  if (ROUTE_PACK_IDS.length !== typeIds.length)
    errors.push("route packs: expected " + typeIds.length + " packs, got " + ROUTE_PACK_IDS.length);
  for (const type of typeIds) {
    const pack = ROUTE_PACKS[type];
    if (!pack) { errors.push("route packs: missing " + type); continue; }
    if (pack.id !== type) errors.push("route packs: id mismatch " + type);
    if (!nonEmpty(pack.name)) errors.push("route packs: " + type + " missing name");
    if (!nonEmpty(pack.tagline)) errors.push("route packs: " + type + " missing tagline");
    if (!nonEmptyArray(pack.notes)) errors.push("route packs: " + type + " missing notes");

    if (!nonEmptyArray(pack.readiness)) errors.push("route packs: " + type + " missing readiness");
    const readinessIds = new Set();
    for (const r of pack.readiness) {
      if (!nonEmpty(r.id) || readinessIds.has(r.id)) errors.push("route packs: " + type + " duplicate readiness id");
      readinessIds.add(r.id);
      for (const key of ["item", "owner", "evidence"])
        if (!nonEmpty(r[key])) errors.push("route packs: " + type + " readiness " + r.id + " missing " + key);
      if (typeof r.blocking !== "boolean") errors.push("route packs: " + type + " readiness " + r.id + " blocking must be boolean");
    }

    if (!Array.isArray(pack.stageFlow) || pack.stageFlow.length !== STAGE_IDS.length)
      errors.push("route packs: " + type + " stageFlow must cover all " + STAGE_IDS.length + " stages");
    else pack.stageFlow.forEach((f, i) => {
      if (f.stage !== STAGE_IDS[i]) errors.push("route packs: " + type + " stageFlow order mismatch at " + i);
      for (const key of ["actions", "artifacts", "exit"])
        if (!nonEmptyArray(f[key]) || !f[key].every(nonEmpty))
          errors.push("route packs: " + type + " " + f.stage + " invalid " + key);
    });

    const sop = ROUTE_SOPS[type];
    const gateCount = sop.gates.length;
    if (!Array.isArray(pack.gatePlan) || pack.gatePlan.length !== gateCount)
      errors.push("route packs: " + type + " gatePlan must map all " + gateCount + " SOP gates");
    else {
      const seen = new Set();
      for (const g of pack.gatePlan) {
        if (!Number.isInteger(g.gateIndex) || g.gateIndex < 0 || g.gateIndex >= gateCount)
          errors.push("route packs: " + type + " invalid gateIndex " + g.gateIndex);
        else if (seen.has(g.gateIndex)) errors.push("route packs: " + type + " duplicate gateIndex " + g.gateIndex);
        else seen.add(g.gateIndex);
        if (!STAGE_IDS.includes(g.stage)) errors.push("route packs: " + type + " gate stage outside lifecycle");
        for (const key of ["evidence", "cannotSubstitute"])
          if (!nonEmpty(g[key])) errors.push("route packs: " + type + " gate " + g.gateIndex + " missing " + key);
      }
      if (seen.size !== gateCount) errors.push("route packs: " + type + " gatePlan does not cover every SOP gate");
    }

    if (!nonEmptyArray(pack.negativeCases)) errors.push("route packs: " + type + " missing negative cases");
    const negativeIds = new Set();
    for (const n of pack.negativeCases) {
      if (!nonEmpty(n.id) || negativeIds.has(n.id)) errors.push("route packs: " + type + " duplicate negative id");
      negativeIds.add(n.id);
      if (!STAGE_IDS.includes(n.stage)) errors.push("route packs: " + type + " negative stage outside lifecycle");
      for (const key of ["scenario", "expected"])
        if (!nonEmpty(n[key])) errors.push("route packs: " + type + " negative " + n.id + " missing " + key);
    }

    const e = pack.skillEmphasis ?? {};
    const sets = [e.core, e.strengthen, e.reference];
    if (!sets.every(nonEmptyArray)) errors.push("route packs: " + type + " incomplete skill emphasis");
    const allSkills = sets.flat();
    if (new Set(allSkills).size !== allSkills.length) errors.push("route packs: " + type + " skill emphasis overlaps");
    if (allSkills.length !== SKILLS.length || !SKILL_IDS.every(id => allSkills.includes(id)))
      errors.push("route packs: " + type + " must partition every known skill exactly once");
    for (const id of ["implementation", "verification", "release-engineering"])
      if (!e.core?.includes(id)) errors.push("route packs: " + type + " core must include " + id);
  }
  return errors;
}
