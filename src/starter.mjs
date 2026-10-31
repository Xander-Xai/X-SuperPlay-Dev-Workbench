// Draft starter tickets are hypotheses, not approved project work.
import { projectIdentity, identityBlock } from "./identity.mjs";

const FLOW = {
  saas: [
    ["组织登录与读取", "用户登录到组织空间，仅可访问自己租户的记录", "匿名用户或租户 B 不能读取租户 A 的数据", "认证、租户隔离集成测试"],
    ["第一条业务纵切片", "UI 提交记录 → API 校验 → 数据库持久化 → 本租户列表可见", "重复提交、越权和非法输入被拒绝", "API 契约和 UI→API→DB 端到端测试"],
    ["迁移和发布演练", "备份、迁移、健康探测和回滚可在测试环境执行", "迁移失败可以回退，不得误标生产发布", "备份恢复、迁移升降级及部署回执"]
  ],
  enterprise: [
    ["角色受控进入", "经企业身份/权限机制登录并读取允许的最小数据", "无权限角色和过期会话必须失败", "RBAC/SSO 以及安全负例测试"],
    ["业务工作流纵切片", "一个获批准表单贯通 UI、API、存储和企业集成", "外部超时、重试和重复回调不能破坏数据", "集成、幂等与失败恢复测试"],
    ["业务 UAT 和交接", "由业务使用者执行真实业务验收并交接运行手册", "缺少签收或接口失败不能标记为完成", "UAT、部署、回滚及权限回执"]
  ],
  "mini-program": [
    ["登录和查询", "真机登录后可建立服务端会话并读取允许的数据", "无会话、空数据和非法域名有明确处理", "真机、鉴权、空态与域名配置测试"],
    ["提交业务记录", "小程序提交 → API → 数据库存储 → 管理后台可查询", "重复请求、并发冲突和越权访问被阻断", "小程序到 API、数据层和管理端联调"],
    ["真机与发布预检", "真实设备验证弱网/冷启动及体验版配置", "弱网和提审失败不应显示发布成功", "真机记录、体验版和官方审核回执"]
  ],
  app: [
    ["构建安装与首屏", "所选平台可安装、启动并完成身份入口", "网络不可用和权限拒绝时降级明确", "模拟器/真机安装及身份验证"],
    ["业务与离线纵切片", "移动端用户输入经 API 保存并正确反馈", "离线恢复不能重复写入或丢失状态", "前端→API→DB 及断网重连测试"],
    ["分发和稳定性", "生成签名构建并在批准的测试渠道验证", "未签名或未审核时不能声称正式发布", "签名、测试分发、崩溃监控和回滚回执"]
  ]
};

const FORBIDDEN_ACTIONS = Object.freeze([
  "修改目标项目之外的任何仓库或系统",
  "推送、部署、发布或提交审核",
  "读取、复制或写入凭证、密钥与生产数据",
  "删除或弱化测试与断言以换取通过",
  "自行扩大授权范围或绕过被拒绝的权限"
]);

const ITERATION_BUDGET = Object.freeze({
  maxAttemptsPerHypothesis: 2,
  stopWhenNoNewEvidence: true,
  requireHypothesisBeforeEdit: true,
  maxParallelTasks: 1
});

const REVIEW_AXES = Object.freeze({ specification: "REQUIRED", standards: "REQUIRED" });

function ticketStage(plan, row, index) {
  return plan.stages.find(s => s.id === row.stage) ?? plan.stages[index] ?? plan.stages[0];
}

function taskTickets(plan) {
  if (plan.config.task === "feature") {
    return FLOW[plan.config.type].map(([title, outcome, negative, testIdea], i) => ({
      title, outcome, negative, testIdea,
      blockedBy: i ? ["T" + String(i).padStart(2, "0")] : [],
      stage: plan.stages[i]?.id ?? "implementation"
    }));
  }
  return plan.stages.filter(s => s.role === "required").map(s => ({
    title: s.name + " · " + s.focus,
    outcome: s.deliverable,
    negative: "缺少本阶段 Gate 证据时不得进入下一阶段",
    testIdea: s.evidence.join(", "),
    blockedBy: [],
    stage: s.id
  }));
}

export function makeStarter(plan) {
  if (!plan || !plan.config || !Object.hasOwn(FLOW, plan.config.type)) throw new TypeError("Invalid plan");
  const rows = taskTickets(plan);
  const identity = projectIdentity(plan);
  return {
    status: "DRAFT_REQUIRES_OWNER_APPROVAL",
    sourceCommit: plan.ownership?.historical?.commit ?? "UNKNOWN",
    currentOwner: plan.ownership?.currentOwner?.repository ?? "UNKNOWN",
    projectId: identity.projectId,
    project: plan.config.name,
    task: plan.task?.id ?? plan.config.task,
    baseSha: identity.baseSha,
    originalRequest: plan.config.description,
    profiles: [...plan.profiles],
    unknowns: [
      "真实用户、采购方与权限边界",
      "目标技术栈、代码现状与环境",
      "业务数据合规、发布审批和回滚责任人",
      "Given-When-Then 验收和负例的业务方确认"
    ],
    tickets: rows.map((t, i) => {
      const stage = ticketStage(plan, t, i);
      const id = "T" + String(i + 1).padStart(2, "0");
      const baseSha = plan.config.baseline?.headSha ?? "UNKNOWN";
      const acceptedAC = "PENDING_OWNER_CONFIRMATION";
      const allowedFiles = [];
      const allowedCommands = [];
      const forbiddenActions = [...FORBIDDEN_ACTIONS];
      const negativeTests = [t.negative];
      const iterationBudget = { ...ITERATION_BUDGET };
      const timeBudget = "UNSET_MINUTES";
      const externalCostBudget = "UNSET";
      const stopConditions = [...(stage?.stopWhen ?? ["需求不明确", "权限不明", "测试无法完成"])];
      const evidencePaths = [];
      return {
        // camelCase surface kept for existing consumers.
        id, title: t.title, outcome: t.outcome,
        negative: t.negative, testIdea: t.testIdea,
        blockedBy: t.blockedBy, stage: t.stage,
        status: "PROPOSED_NOT_READY",
        acceptance: "业务方待确认可执行的 Given/When/Then",
        testCommand: "NOT_YET_IDENTIFIED", evidence: "NOT_RUN",
        evidencePlan: (stage?.evidencePlan?.required?.length ? stage.evidencePlan.required : [...(stage?.evidence ?? [])]),
        evidencePaths, negativeTests, stopConditions, iterationBudget,
        timeBudget, externalCostBudget, allowedFiles, allowedCommands,
        forbiddenActions, acceptedAC,
        reviewAxes: { ...REVIEW_AXES },
        baseSha, agent: plan.config.agent, permission: "READ_ONLY_DISCOVERY_FIRST",
        // snake_case aliases: every TICKET_CONTRACT_FIELDS key must be present.
        ticket_id: id,
        spec_id: identity.projectId + "-spec",
        base_sha: baseSha,
        accepted_AC: acceptedAC,
        blocked_by: t.blockedBy,
        allowed_files: allowedFiles,
        allowed_commands: allowedCommands,
        forbidden_actions: forbiddenActions,
        negative_tests: negativeTests,
        iteration_budget: iterationBudget,
        time_budget: timeBudget,
        external_cost_budget: externalCostBudget,
        stop_conditions: stopConditions,
        rollback: "UNSET_REQUIRES_OWNER",
        evidence_paths: evidencePaths,
        reviewer: "UNASSIGNED"
      };
    })
  };
}

const quote = s => String(s ?? "").replace(/\r\n/g, "\n").split("\n")
  .map(line => "> " + line.replace(/\x60/g, "'")).join("\n");

export function starterMarkdown(plan) {
  const pack = makeStarter(plan);
  const lines = [
    identityBlock(plan), "",
    "# " + pack.project + " · Spec & Tracer Tickets（草案）", "",
    "> DRAFT_REQUIRES_OWNER_APPROVAL / NOT_RUN。不代表用户需求已核实或项目已开始。",
    "> project_id：" + pack.projectId + " · base_sha：" + pack.baseSha,
    "> 任务类型：" + pack.task + " · 当前所有者：" + pack.currentOwner,
    "> 历史来源：" + pack.sourceCommit, "",
    "## 原始需求（未经核实）", "", quote(pack.originalRequest || "未填写"), "",
    "## Profiles", "", pack.profiles.join(", "), "",
    "## 待确认条件", "", ...pack.unknowns.map(x => "- [ ] " + x), "",
    "## Spec 草案", "",
    "- Goal：由业务方把需求细化为可观察的用户结果。",
    "- Scope：仅下面待审批的纵向切片。",
    "- Non-goals：无授权生产写入、支付或发布操作。",
    "- Gate：业务 Owner 确认 AC 和负例后才能进入 READY。", "",
    "## Tracer Tickets", ""
  ];
  for (const t of pack.tickets) lines.push(
    "### " + t.id + " · " + t.title, "",
    "- 状态：" + t.status,
    "- 阶段：" + t.stage,
    "- spec_id：" + t.spec_id,
    "- blocked_by：" + (t.blockedBy.join(", ") || "NONE"),
    "- 可观察结果：" + t.outcome,
    "- 负例：" + t.negative,
    "- 验证思路：" + t.testIdea,
    "- AC：" + t.acceptance + "（accepted_AC: " + t.acceptedAC + "）",
    "- 测试命令：" + t.testCommand,
    "- 负例测试：" + t.negativeTests.join("；"),
    "- Base SHA：" + t.baseSha,
    "- Agent：" + t.agent + " · Reviewer：" + t.reviewer,
    "- 权限：" + t.permission,
    "- allowed_files：" + (t.allowedFiles.join(", ") || "UNSET（执行前必须填写）"),
    "- allowed_commands：" + (t.allowedCommands.join(", ") || "UNSET（执行前必须填写）"),
    "- 证据：" + t.evidence,
    "- evidence_paths：" + (t.evidencePaths.join(", ") || "UNSET"),
    "- 证据计划：" + (t.evidencePlan.join(", ") || "未定义"),
    "- 停止条件：" + t.stopConditions.join("；"),
    "- 迭代预算：每个假设最多 " + t.iterationBudget.maxAttemptsPerHypothesis +
      " 次尝试；无新证据即停止；单执行窗口 1 个活动任务",
    "- 时间/成本预算：" + t.timeBudget + " / " + t.externalCostBudget,
    "- 回退：" + t.rollback,
    "- Review 双轴：Spec " + t.reviewAxes.specification + " / Standards " + t.reviewAxes.standards,
    "- 禁止动作：" + t.forbiddenActions.join("；"), ""
  );
  lines.push("## 下一步", "",
    "- [ ] 由项目 Owner 确认 Spec、业务负例和实际技术约束。",
    "- [ ] 读取项目本地 AGENTS/CLAUDE 规则，记录 base SHA 和有效测试命令。",
    "- [ ] 按依赖顺序交付并在产品仓保存真实执行证据。",
    "- [ ] 将跨项目复用的工程改进提案沉淀回 Workbench。", "");
  return lines.join("\n");
}
