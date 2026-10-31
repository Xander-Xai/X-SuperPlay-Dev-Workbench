// Engineering playbooks: advisory operating manuals attached to existing Profiles.
// They reuse the 11-stage lifecycle and never create a second lifecycle.
// Every phase is a checklist, not evidence. Nothing here is VERIFIED without a real receipt.

export const PLAYBOOK_STATUS = Object.freeze("ADVISORY_PLAYBOOK_NOT_VERIFIED");

export const PLAYBOOKS = Object.freeze([
  {
    id: "ai-application",
    name: "AI 应用日常研发手册",
    profile: "ai-application",
    appliesWhen: "维护 FastAPI / LLM / RAG / Agent 类应用；接手已有代码（Brownfield）或从零启动。",
    status: PLAYBOOK_STATUS,
    authority: "本手册是 Profile 附属操作建议。11 阶段生命周期、Profile 义务、证据模型与项目本地规则仍是权威；本手册不新增 Gate。",
    principles: [
      "业务系统负责事实来源、权限、副作用、幂等和最终授权；模型只提出下一步建议。",
      "先冻结基线（失败输入、trace_id、模型/提示词/索引版本），再改代码。",
      "scripted fake LLM 与 real-provider eval 是不同证据层，不能互相替代。",
      "没有真实消费者验收时，不得宣称已上线、高可用或准确率达标。"
    ],
    acceptanceExamples: [
      "AC1 有权用户提供订单号时，工具返回真实状态并解释结果。",
      "AC2 缺少订单号时只追问，不调用后端。",
      "AC3 用户查询他人订单时返回 FORBIDDEN，不泄露订单是否存在。",
      "AC4 上游超时时明确说明暂时无法确认，不编造状态。",
      "AC5 “未查到”不等于“未发货”，两者使用不同文案与后续动作。"
    ],
    negativeCases: [
      "跨租户/跨用户读取：身份必须由服务端从认证上下文取得，模型生成的 user_id 被忽略。",
      "工具超时、部分失败与重复提交：返回结构化错误并保持幂等。",
      "Prompt 注入：检索文档或工具结果中的指令不得改变权限、工具集合或审批路径。",
      "缺参或歧义：只追问一个必要槽位，不猜测订单号。",
      "模型不可用或超预算：降级为明确失败或人工路径，不静默换模型。"
    ],
    stopConditions: [
      "发现越权、密钥或 PII 泄露：立即停止调参，止血并通知 Owner。",
      "没有可运行测试或真实基线：停止宣称修复，列出缺失依赖。",
      "AC 未获业务 Owner 确认：停止实现，先澄清 Scope / Non-goals。",
      "需要生产权限、部署或删除数据：停止并请求明确授权。",
      "模型行为变更没有 real-provider eval：停止合并，补评测或标 NOT_RUN。"
    ],
    antiClaims: [
      "scripted fake LLM 通过 ≠ 真实模型行为已验证。",
      "CI 绿 ≠ Consumer/测试环境联调通过。",
      "Prompt 改得更长 ≠ 质量提升；必须同集合、同版本对比。",
      "PR 合并 ≠ 已发布 ≠ 已验收。"
    ],
    rhythm: [
      "晨间：审查工单、PR、CI 与告警，确认当天优先级。",
      "需求：澄清 AC、权限、负例与现有实现，冻结失败基线。",
      "开发：最小 Diff、测试先行、受控 AI 编码、逐步验证。",
      "交付：回归评测、PR/Review、状态同步；不把未运行项写成通过。"
    ],
    reporting: "已完成 [具体能力]，证据 [测试/PR/trace]，受阻于 [接口/环境/授权]，下一步 [行动和依赖]。禁止用“优化了 Prompt”“基本完成”替代证据。",
    exercises: [
      "隔离实验 1：复现一个 RAG 召回 Bug，先写故障树、AC 与测试，再改代码。",
      "隔离实验 2：实现一项只读 Tool Calling Feature，覆盖缺参、越权与超时。",
      "隔离实验 3：注入一次上游故障，验证降级、恢复与复盘证据。"
    ],
    triage: [
      { task: "新 Feature", firstMove: "先确认用户、权限、业务接口、AC 与当前实现；不要先让 AI 生成整套 Agent。", evidence: "AC→测试 / 联调 / Eval / PR" },
      { task: "Bug", firstMove: "先取得失败输入、trace_id、版本和复现步骤；不要先改 Prompt 猜原因。", evidence: "失败用例转绿、根因定位、回归" },
      { task: "RAG 质量", firstMove: "先确认 query、语料/index 版本和金标可用性；不要无基线更换 Embedding。", evidence: "同集合同条件 A/B 与失败案例" },
      { task: "Agent 调错工具", firstMove: "先看 tool-call trace、Router、Schema 和 state；不要新建更多 Agent。", evidence: "工具/参数/权限/终态评测" },
      { task: "性能 / 成本", firstMove: "先记录流量形态、分段耗时、P50/P95/P99 与 tokens；不要无测量先加缓存。", evidence: "同负载基线对比，且不牺牲成功率" },
      { task: "事故", firstMove: "先确认影响范围、告警、变更与可用回滚；不要直接上新代码。", evidence: "服务恢复证据、复盘、补防线" }
    ],
    phases: [
      {
        id: "A0",
        title: "接管陌生代码：一页 Call-chain Map",
        question: "系统如何从入口走到模型和业务事实？",
        minimal: "问清 Owner/权限/CI/测试环境；读 README、AGENTS、锁文件、.env.example、CI；记录 exact base SHA；发一条测试请求沿 API→auth→router→tool→RAG→response 追踪；运行一组现有测试。",
        exitEvidence: ["启动命令与数据源", "各模块真实路径", "配置/密钥来源", "测试命令与当前失败", "Owner 与可复核日志/CI 链接"]
      },
      {
        id: "A1",
        title: "收到需求的前 30 分钟：最小变更合同",
        question: "谁在什么条件下得到什么可观察结果？",
        minimal: "确认入口、接口 Owner、租户/权限、缺参追问、失败呈现和外部副作用；写 Scope / Non-goals、Given-When-Then AC、权限负例和 baseline；先查已有接口与测试。",
        exitEvidence: ["业务方可核对的 AC", "至少一条越权/失败负例", "现有代码或测试的复用结论", "带版本的失败基线"]
      },
      {
        id: "A2",
        title: "隔离实现：测试先行与受控 AI 编码",
        question: "最小 Diff 能否只满足已批准 AC？",
        minimal: "从固定 base 建短分支；先写工具参数/权限/超时测试；只改 Router/Tool/DTO/必要状态节点；AI 三轮：只读定位 → 指定文件内编码 → 独立对抗式审查 diff。",
        exitEvidence: ["相关测试真实输出", "联调或集成探针", "real-provider eval（模型行为变更时）", "PR 中的命令、结果、跳过项与 SHA"]
      },
      {
        id: "A3",
        title: "分层诊断：先定位层，再改实现",
        question: "失败发生在检索、工具、模型、编排还是外部依赖？",
        minimal: "RAG 按 retrieval→rerank→context→generation 逐层核对；Agent 核对原始意图→Router→Schema→tool_calls→state→API；性能按 router/retrieval/rerank/tool/model/graph/queue 拆段。",
        exitEvidence: ["带 trace_id 的根因结论", "可复现的失败样本", "修复前后的同条件对比", "回归测试"]
      },
      {
        id: "A4",
        title: "交付闭环：发布、观察与复盘",
        question: "谁有权发布，失败如何回退，哪些仍未验证？",
        minimal: "确认接口 Owner、测试/运维配合、权限与环境；记录开关、版本、回滚触发条件；发布后观察错误、延迟、成本；复盘区分已证实与推测。",
        exitEvidence: ["发布授权与平台回执", "监控观察记录", "回滚演练或触发条件", "明确列出的 UNKNOWN"]
      }
    ],
    toolContract: {
      note: "示例为契约表达，不是任何真实企业接口；身份必须由服务端从认证上下文取得，绝不信任模型生成的 user_id 或租户 ID。",
      example: [
        "id: TOOL-ORDER-001",
        "name: get_order_status",
        "input: {order_id: string}",
        "side_effect: false",
        "identity: authenticated_server_context",
        "authorization: check_order_owner_and_tenant",
        "timeout_seconds: 5",
        "error_codes: [NOT_FOUND, FORBIDDEN, TIMEOUT, UPSTREAM_UNAVAILABLE]",
        "idempotent: true"
      ]
    },
    failureDiagnosis: [
      { symptom: "RAG 答错", order: ["文档是否入库", "chunk/source/version", "租户过滤", "BM25/embedding TopK", "RRF/rerank", "context 拼装", "生成与引用"], stopRule: "发现权限泄露时先止损，不继续调参。" },
      { symptom: "Agent 调错工具", order: ["原始意图", "Router 决策", "工具注册与 Schema", "实际 tool_calls", "state/Graph 覆写", "API 权限与错误响应"], stopRule: "确定性 Router/Schema Bug 先修；不要因单次错误升级多 Agent。" },
      { symptom: "慢或贵", order: ["真实负载与并发", "P50/P95/P99", "router", "retrieval", "rerank", "tool API", "model TTFT", "generation", "queue/graph loops"], stopRule: "缓存必须按身份/租户隔离并有过期策略。" },
      { symptom: "线上故障", order: ["通知责任人", "确认影响范围", "按授权止血/降级/回滚", "保留脱敏证据", "根因修复加回归"], stopRule: "没有生产授权时不得自行执行危险变更。" }
    ],
    definitionOfDone: [
      "AC 与修改范围可追踪；相关测试、CI 与 Review 结果已记录。",
      "LLM 行为变更有数据集版本与真实评测，scripted 与 real-provider 边界已说明。",
      "工具鉴权、超时、越权、失败恢复、幂等和隐私已按风险验证。",
      "真实 Consumer/测试环境联调完成；发布、灰度、回滚、监控由有权限的 Owner 验收。",
      "未验证事项已列出；不得用“基本完成”“优化了 Prompt”替代证据。"
    ],
    handoff: [
      "给下一个会话：exact base SHA、Spec 切片、AC→测试矩阵、当前失败、权限边界、真实命令。",
      "不要粘贴整仓或聊天历史；让 Agent 先只读定位并报告事实与 UNKNOWN。",
      "写入范围、外部副作用、push/PR/部署必须由人单独批准。"
    ],
    rollback: [
      "应用版本回退到上一构建。",
      "模型/提示词/索引版本可热切换回退，并保留旧版本。",
      "数据库迁移按已验证降级脚本回退；无降级时从备份恢复。"
    ]
  },
  {
    id: "rag",
    name: "企业 RAG 从零构建手册",
    profile: "rag",
    appliesWhen: "从零构建或重构可验证的企业 RAG；已有仓库应按 Delta Spec 处理，不强行绿地重构。",
    status: PLAYBOOK_STATUS,
    authority: "本手册是 RAG Profile 的实战路线，不替换 11 阶段、RAG Profile 或项目本地规范。",
    principles: [
      "先业务证据、最小可运行系统、有效评测基线，后检索复杂度与多模态。",
      "检索到的文本一律视为不可信输入，不能执行文档内指令。",
      "权限过滤必须在检索侧生效，不能只靠 Prompt 禁止泄露。",
      "没有稳定金标时只能报告探索性指标，不能声称准确率达标。"
    ],
    acceptanceExamples: [
      "AC1 未找到授权证据时返回结构化拒答，不给推测答案。",
      "AC2 管理员文档不会出现在普通用户的检索结果或模型上下文中。",
      "AC3 有足够证据时引用文件、页码或条款，并标注 corpus/index 版本。",
      "AC4 过期法规被标记为过期并走拒答或提示路径。",
      "AC5 同一 query 在固定 snapshot 下可复现 TopK 与引用。"
    ],
    negativeCases: [
      "越权检索：ACL 在检索侧过滤，越权 chunk 不进入模型上下文。",
      "Prompt 注入：文档内指令不能改变系统规则或调用外部工具。",
      "重复入库与更新：同一文档多次导入不产生重复 chunk，旧版本可回退。",
      "空页、乱码、扫描件：解析失败可见且可重试，不静默丢弃。",
      "无答案或低置信：拒答而非编造；引用不存在时判失败。"
    ],
    stopConditions: [
      "发现权限泄露：立即停止调参，隔离索引并通知 Owner。",
      "没有稳定 gold 或 corpus/index 版本：停止声称准确率，改为探索性结果。",
      "正确 chunk 从未召回：停止加 Rerank，先修 ingestion、ACL、rewrite、embedding/BM25。",
      "高风险法规或权限子集退化：停止发布，回到上一 snapshot。",
      "需要真实客户数据或生产索引：停止并请求授权与脱敏方案。"
    ],
    antiClaims: [
      "模型能返回自然语言 ≠ 召回已好。",
      "集成测试绿 ≠ 业务准确率达标。",
      "Docker 部署成功 ≠ 生产就绪。",
      "单次 demo 命中 ≠ 稳定质量；必须同集合、同版本、可复算。"
    ],
    rerankDecision: "只有在候选已包含相关 chunk、但排名靠后或 TopK 噪声大时，重排才可能明显有效。正确 chunk 从未召回时，先修 ingestion、ACL、query rewrite、embedding/BM25，不能靠 Rerank 修补缺失证据。",
    exercises: [
      "基础 RAG：一批授权文档 → 索引 → 服务 → 引用与拒答。",
      "检索 A/B：在固定 gold 上比较 BM25、Dense、Hybrid/Rerank 的增益或无增益。",
      "修真实 Bug：从失败 query/trace 复现、定位、修复并回归。"
    ],
    triage: [
      { task: "需求与数据", firstMove: "确认使用者、业务问题、数据许可、权限、法规版本和拒答行为。", evidence: "可追踪的数据清单与 AC" },
      { task: "最小链路", firstMove: "先跑通一种解析、一种切分、一种索引和一条查询路径。", evidence: "真实文档端到端导入与查询" },
      { task: "质量评测", firstMove: "冻结 gold + corpus/index/query 版本后再比较方案。", evidence: "同集合、同权限范围的前后对比" },
      { task: "企业加固", firstMove: "先做 ACL、版本、幂等更新和注入防护。", evidence: "权限负例、索引回滚与故障注入" }
    ],
    phases: [
      {
        id: "A",
        title: "需求、数据与 SPEC",
        question: "谁可以问什么，系统在证据不足时必须怎样失败？",
        minimal: "写业务场景与边界、数据清单（来源/许可/生效日期/Owner）、Spec（未找到证据→结构化拒答；管理员文档不泄露；足够证据→引用文件与页码/条款）、质量用例。",
        exitEvidence: ["每条 AC 可映射到自动或人工检查", "至少一批真实可用且来源可追踪的数据", "高风险误答与拒答路径"]
      },
      {
        id: "B1",
        title: "工程骨架",
        question: "最小服务能否启动并测试？",
        minimal: "Python/FastAPI/Pydantic、.env.example、pytest、按需 Docker。",
        exitEvidence: ["GET /health 与最小测试通过"]
      },
      {
        id: "B2",
        title: "加载与解析",
        question: "原文能否稳定落到可追溯的文档标识？",
        minimal: "按真实格式处理 PDF/DOCX/XLSX；支持空页、失败、乱码；必要时 OCR。",
        exitEvidence: ["原文与 doc_id/page/version/source 可抽查"]
      },
      {
        id: "B3",
        title: "结构感知切块",
        question: "关键条款是否被切断？",
        minimal: "按条款/表格行/标题切分；稳定 chunk_id；重复入库可识别。",
        exitEvidence: ["关键条款完整", "重复入库可检测"]
      },
      {
        id: "B4",
        title: "Embedding 与索引",
        question: "同一输入能否定位到固定快照？",
        minimal: "记录模型版本与维度；索引更新幂等；corpus/index 快照可引用。",
        exitEvidence: ["同一输入定位到固定 corpus/index snapshot"]
      },
      {
        id: "B5",
        title: "检索器",
        question: "相关片段是否可观测，越权片段是否被拦住？",
        minimal: "Query→TopK 返回 chunk_id/source/score；ACL 在检索侧过滤。",
        exitEvidence: ["相关片段进入候选", "越权片段不进入模型上下文"]
      },
      {
        id: "B6",
        title: "生成器",
        question: "答案是否引用证据，无证据是否拒答？",
        minimal: "检索文本视为不可信；结构化答案/拒答；引用文件、页码或条款。",
        exitEvidence: ["可回答、不可回答、过期法规三条路径验证"]
      },
      {
        id: "B7",
        title: "端到端",
        question: "真实文档能否完成一次导入、查询与响应？",
        minimal: "用真实文档跑通一份完整链路。",
        exitEvidence: ["真实查询/响应与索引证据，不只 mock 单测"]
      },
      {
        id: "C",
        title: "评测与优化（Golden Set first）",
        question: "改动是否真的提升，且没有伤害高风险子集？",
        minimal: "冻结 gold 与索引；按 BM25/Dense/Hybrid/Rerank/Query Rewrite 做同条件 A/B；报告 Hit@K、Recall@K、MRR@K、nDCG@K、groundedness、引用准确性、拒答率、泄露失败率、P95、成本。",
        exitEvidence: ["可复算的检索与生成指标", "按 query 类型分桶", "高风险法规/权限子集未退化"]
      },
      {
        id: "D",
        title: "企业工程化与安全",
        question: "权限、版本、更新、注入与监控是否可验证？",
        minimal: "检索前 ACL；文档 hash 与索引版本关联 trace；staging→验证→切换；检索结果视为不可信；配置外置；错误分类与脱敏监控；冷启动/并发/缓存隔离压测。",
        exitEvidence: ["权限负例", "索引更新/回滚演练", "故障注入与负载测试"]
      },
      {
        id: "E",
        title: "发布与持续迭代",
        question: "谁批准发布，如何观察高风险切片并回退？",
        minimal: "本地小样 E2E → 隔离测试环境 → 正式 eval gate → staged index/canary → 观测高风险切片 → 允许回滚。",
        exitEvidence: ["provenance 与正式/探索性结果", "模型+索引版本", "失败记录与回滚路径"]
      }
    ],
    evaluation: {
      goldenSample: [
        "{",
        '  "sample_id": "RAG-001",',
        '  "question": "<合成问题：某成分的适用限制是什么？>",',
        '  "corpus_version": "snapshot-v1",',
        '  "relevant_chunk_ids": ["doc-01#c03"],',
        '  "answerable": true,',
        '  "reference_answer": "<经人工核验的参考答案>",',
        '  "review_status": "REVIEWED"',
        "}"
      ],
      metrics: [
        "检索：Hit@K、Recall@K、MRR@K、nDCG@K，按 query 类型分桶。",
        "生成：证据一致性 / groundedness、引用准确性、正确拒答率、权限泄露失败率、答案可用性。",
        "运行：P50/P95/P99、超时/错误率、吞吐、单问 Token 成本、缓存命中、模型与索引版本。"
      ],
      rules: [
        "relevant_chunk_ids 必须属于具体版本的真实索引，不能由 AI 猜测。",
        "DRAFT / PENDING_REVIEW 标注不得计入已验证正式成绩。",
        "正确 Chunk 从未召回时，先修 ingestion/ACL/rewrite/embedding，不能靠 Rerank 修补缺失证据。"
      ]
    },
    failureDiagnosis: [
      { symptom: "失败 Query", order: ["是否有对应文档（ingest/解析/版本）", "正确 chunk 是否进入 TopK（filter/rewrite/embedding/BM25）", "rerank 后是否保留（模型/K/阈值）", "证据是否进入 Prompt（拼装/截断/ACL）", "模型是否基于证据回答（引用/拒答/生成约束）"], stopRule: "发现权限泄露先止损，不继续调参。" }
    ],
    definitionOfDone: [
      "每条 AC 有绑定检查；gold 与 corpus/index 版本固定。",
      "检索与生成指标可复算，高风险子集未退化。",
      "权限负例、注入防护、索引回滚、故障注入已执行。",
      "真实消费者验收由有权限的人完成；文档/README/模型自评不能替代。",
      "未验证项保持 UNKNOWN / NOT_RUN。"
    ],
    handoff: [
      "给下一个会话：数据清单、Spec 切片、gold 版本、索引快照、当前失败 Query 与 trace。",
      "先只读定位 retrieval/rerank/context 层，再提出最小 Diff。",
      "不得把未审核候选题当作正式召回率证据。"
    ],
    rollback: [
      "索引回退到上一已验证 snapshot。",
      "模型/embedding/reranker 配置回退到上一版本。",
      "应用版本回退；保留失败 trace 与旧索引用于复现。"
    ]
  },
  {
    id: "agent",
    name: "企业 Agent 从零开发手册",
    profile: "agent",
    appliesWhen: "设计与验收多步工具调用 Agent；既有仓库应先做 Current-State Reconstruction 再增量修改。",
    status: PLAYBOOK_STATUS,
    authority: "本手册是 Agent Profile 的操作建议；11 阶段、Agent/AI Application Profile 与项目本地规则仍是权威。",
    principles: [
      "LLM 可以建议下一步动作；业务系统负责事实来源、权限、副作用、幂等和最终授权。",
      "FAQ/固定流程优先 Workflow；不能因为“Agent”一词强制 Multi-Agent。",
      "评测场景从 Spec 阶段开始定义，不是最后才补。",
      "每一阶段只在上一阶段必要能力有证据后升级。"
    ],
    acceptanceExamples: [
      "AC1 有权用户查询自己的订单：工具返回真实状态并解释。",
      "AC2 缺少订单号：只追问，不访问后端。",
      "AC3 查询他人订单：FORBIDDEN，且不泄露订单是否存在。",
      "AC4 工具超时：明确说明无法确认，不编造状态。",
      "AC5 高风险退款：进入人工审批，模型不能自行批准；重复提交不产生二次退款。"
    ],
    negativeCases: [
      "身份由模型填写：服务端忽略并拒绝。",
      "越权工具调用、参数注入、Schema 绕过：在工具执行前阻断。",
      "Prompt 注入：检索文档或工具输出不能改变权限、审批或工具集合。",
      "重复投递、重试与 worker 失锁：幂等台账保证无二次副作用。",
      "跨 thread/tenant 污染：会话隔离，旧状态不得进入新会话。",
      "escalated=true 但没有真实坐席接管：判为未完成人工闭环。"
    ],
    stopConditions: [
      "发现越权或重复副作用：立即禁用相关工具，止血后再修。",
      "没有后端幂等台账：停止宣称 exactly-once。",
      "高风险动作缺少服务端审批：停止上线。",
      "L1/L2 通过但 L3/L4 未执行：停止宣称生产就绪。",
      "练习或测试环境涉及真实资金或生产数据：停止执行。"
    ],
    antiClaims: [
      "PR 合并 ≠ 测试环境验收 ≠ 生产高可用。",
      "本地 PG/Redis/Celery 验证 ≠ 生产高可用或真实 ERP 集成。",
      "checkpointer 恢复图状态 ≠ 外部写操作 exactly-once。",
      "fake-LLM 图测试通过 ≠ 真实模型决策质量。"
    ],
    stateContract: [
      "建议字段：request_id、thread_id、messages、user_context、intent、slots、tool_results、risk_level、pending_approval、attempt_count。",
      "每个字段明确 Owner、reducer、是否可持久化、TTL 与跨会话可见性。",
      "短期会话、长期记忆、工作流状态与业务事实分开存储；业务事实以业务系统为准。",
      "checkpointer 只恢复图状态，不替代业务事务或外部副作用台账。"
    ],
    durabilityRules: [
      "区分 thread_id（对话）、run_id（一次图执行）、job_id（异步任务）、idempotency_key（一次业务意图）。",
      "队列通常是至少一次投递；重试、redelivery、worker 失锁都要经过后端幂等台账。",
      "模拟“外部 API 已成功、本地尚未记录”时崩溃，验证不会二次退款或下单。",
      "没有原子业务动作与台账时，不宣称 exactly-once。"
    ],
    hitlRules: [
      "低风险只读可直接执行；中风险验证意图与业务规则；高风险必须服务端审批。",
      "审批保存待审批意图、上下文、授权范围与时效；确认后再次检查归属、金额资格、时效与幂等。",
      "拒绝、过期、重复提交都不能绕过权限门禁。",
      "escalated=true 只是意图；真实接管需要队列、分配、可见上下文、接管确认、处理回执与未接入 fallback。"
    ],
    evalMetrics: [
      "Task Success、Tool Correctness、Argument Correctness、Handoff Correctness。",
      "unsafe action attempted / executed、recovery success、P95、Token/Cost。",
      "至少覆盖正常、缺参、越权、工具超时、重复提交、Prompt Injection、转人工与跨会话污染。",
      "高风险安全项建议零容忍；阈值由任务 Owner 在评测前确定，不能事后挑数。"
    ],
    exercises: [
      "第 1 周：单 Agent + 结构化回复；第 2 周：只读 Tool 与鉴权。",
      "第 3 周：StateGraph 与 RAG 知识工具；第 4 周：用同一 Eval Set 比较 Router/多 Agent。",
      "第 5–6 周：HITL、崩溃恢复、正式 Eval、CI 与灰度模拟；练习环境隔离，不执行真实资金操作。"
    ],
    triage: [
      { task: "业务与 API", firstMove: "写清任务、角色、数据源、权限、异常与人工路径。", evidence: "成功/失败/人工接管流程" },
      { task: "Tool 设计", firstMove: "先写 Tool/State/Authorization/Handoff Spec 与禁止动作。", evidence: "schema/参数/权限/超时/无泄露验证" },
      { task: "编排", firstMove: "先用单 Agent + 简单 Graph；只有明确工具冲突或业务分工才升级。", evidence: "对照同一 Eval Set 的成功率/成本/延迟" },
      { task: "HITL", firstMove: "服务端风控、审批、人工坐席交接状态机。", evidence: "越权/拒绝/超时/重复审批均安全" },
      { task: "恢复", firstMove: "区分 thread_id/run_id/job_id/idempotency_key。", evidence: "crash/retry/redelivery 无双重副作用" }
    ],
    phases: [
      { id: "P0", title: "业务与 API", question: "Agent 帮谁完成什么任务？", minimal: "任务、角色、数据源、权限、异常与人工路径表。", exitEvidence: ["三个场景的成功/失败/人工接管流程"] },
      { id: "P1", title: "SPEC", question: "每个动作如何验收？", minimal: "Tool/State/Authorization/Handoff Spec、AC、Eval cases；列明禁止动作。", exitEvidence: ["AC→测试与真实 Owner", "评测场景已定义"] },
      { id: "P2", title: "单模型", question: "模型服务和回答约束是否稳定？", minimal: "FastAPI + Pydantic + 单模型适配 + 限额与错误。", exitEvidence: ["结构化回复/拒答", "超时可识别"] },
      { id: "P3", title: "Tools", question: "是否能安全行动？", minimal: "只读知识/订单/产品查询；Function Calling；Schema 校验、权限、超时。", exitEvidence: ["参数/权限/超时/无泄露验证"] },
      { id: "P4", title: "Graph + State", question: "多轮、分支、恢复怎么办？", minimal: "StateGraph + 缺参追问 + 简单 checkpointer；区分短期会话、长期记忆、工作流状态、业务事实。", exitEvidence: ["会话隔离", "状态转换", "恢复测试"] },
      { id: "P5", title: "RAG 作为知识工具", question: "回答依据是否可追溯？", minimal: "search_knowledge Tool：授权检索 + 引用 + 拒答；retrieved chunks 视为不可信。", exitEvidence: ["检索 gold 与 Agent 任务结果分开测"] },
      { id: "P6", title: "Multi-Agent（仅必要时）", question: "分工是否真的带来收益？", minimal: "Router/Supervisor/Handoff/Agent-as-Tool；对照单 Agent 同 Eval Set。", exitEvidence: ["成功率、工具选择、时延、成本对比"] },
      { id: "P7", title: "HITL", question: "风险动作如何授权？", minimal: "低风险只读；中风险验证意图与业务规则；高风险业务审批 + 再核验资格 + 幂等 + 审计。", exitEvidence: ["越权/拒绝/超时/重复审批均安全", "真实坐席接管回执"] },
      { id: "P8", title: "持久化与故障恢复", question: "进程失败如何恢复且不重复副作用？", minimal: "checkpoint、队列、幂等键、worker fencing；模拟“外部已成功、本地未记录”崩溃。", exitEvidence: ["crash/retry/redelivery 无二次退款/下单"] },
      { id: "P9", title: "Eval", question: "任务正确并安全了吗？", minimal: "L1 确定性单测、L2 scripted fake LLM、L3 真实模型、L4 staging 真实业务；覆盖正常、缺参、越权、超时、重复提交、注入、转人工、跨会话污染。", exitEvidence: ["可复现集、版本、结果、失败分类"] },
      { id: "P10", title: "运行", question: "用户可用、出错可回退吗？", minimal: "Trace 串 request→run→route→agent→model→tool→approval→outcome；脱敏日志；预算、限流、降级、开关、灰度、回滚、值班与数据删除。", exitEvidence: ["Consumer 验收/发布票据", "监控与回滚观察"] }
    ],
    toolContract: {
      note: "示例为契约表达，不是生产中运行的 schema。高风险写操作另定前置规则、审批、幂等、重复请求语义和可追溯审计。",
      example: [
        "id: TOOL-ORDER-001",
        "name: get_order_status",
        "input: {order_id: string}",
        "output: {status: string, tracking_number: \"string|null\"}",
        "side_effect: false",
        "auth: authenticated_session_plus_server_side_owner_tenant_check",
        "timeout_seconds: 5",
        "errors: [MISSING_ORDER_ID, FORBIDDEN, NOT_FOUND, TIMEOUT]",
        "acceptance:",
        "  - own_order_success",
        "  - other_users_order_denied_before_fetch",
        "  - missing_parameter_asks_user",
        "  - timeout_must_not_invent_state"
      ]
    },
    riskMatrix: [
      { risk: "低", examples: "知识检索、已认证订单查询", control: "服务端授权 + 只读" },
      { risk: "中", examples: "创建售后工单", control: "验证用户意图、业务规则、幂等/异常" },
      { risk: "高", examples: "执行退款、修改地址", control: "业务审批 + 再核验资格 + 幂等 + 审计；模型不得自行批准" }
    ],
    evaluationLevels: [
      { level: "L1 确定性单测", proves: "Tool Schema、权限、节点、异常、重试", doesNotProve: "模型实际会选对工具" },
      { level: "L2 Scripted fake LLM + compiled graph", proves: "Route、HITL、状态流转、恢复", doesNotProve: "真实模型决策质量" },
      { level: "L3 真实模型 + 隔离业务工具", proves: "tool selection/arguments、规划、拒答、风险行为", doesNotProve: "真实 ERP/生产部署" },
      { level: "L4 Staging/授权真实业务流程", proves: "端到端成功率、人工接管、负载、回滚", doesNotProve: "未覆盖环境的可靠性" }
    ],
    failureDiagnosis: [
      { symptom: "Agent 调错工具", order: ["原始意图", "Router 决策", "工具注册", "Schema 描述", "实际 tool_calls", "state/Graph 覆写", "API 权限/错误响应"], stopRule: "先修确定性 Router/Schema Bug；不要因单次错误升级 Multi-Agent。" },
      { symptom: "越权或重复副作用", order: ["身份来源是否服务端", "审批是否在服务端", "幂等键与台账", "队列投递语义", "worker fencing"], stopRule: "发现越权先停止相关工具，不继续调 Prompt。" },
      { symptom: "恢复后重复执行", order: ["thread/run/job/idempotency 标识", "外部回执记录", "原子业务动作", "重投与失锁"], stopRule: "没有后端幂等台账时不得宣称 exactly-once。" }
    ],
    definitionOfDone: [
      "AC→测试与真实 Owner 明确；禁止动作已列明。",
      "工具鉴权、超时、越权、失败恢复、幂等与隐私已验证。",
      "L1–L4 证据分层记录，未执行的层保持 NOT_RUN / UNKNOWN。",
      "真实人工接管闭环有队列/分配/上下文/接管确认/处理回执；escalated=true 不等于已接管。",
      "发布、灰度、监控与回滚由有权限的 Owner 验收。"
    ],
    handoff: [
      "给下一个会话：任务契约、Tool/State Spec、Eval Set 版本、当前失败 trace、权限边界。",
      "先只读定位 Route/Tool/State，再提出最小 Diff；不要复制整仓。",
      "外部安装、push、PR、部署和破坏性操作必须单独授权。"
    ],
    rollback: [
      "禁用高风险工具或回退到上一版本。",
      "回退模型/提示词/工作流配置，保留旧 checkpoint 与 trace。",
      "业务侧幂等台账核对后处理重复请求，不以重放掩盖副作用。"
    ]
  }
]);

export const PLAYBOOK_IDS = Object.freeze(PLAYBOOKS.map(p => p.id));

export function playbookById(id) {
  return PLAYBOOKS.find(p => p.id === id) ?? null;
}

export function playbooksForProfiles(profiles = []) {
  return PLAYBOOKS.filter(p => profiles.includes(p.profile));
}

export function playbookMarkdown(playbook) {
  if (!playbook || !PLAYBOOK_IDS.includes(playbook.id)) throw new Error("Unknown playbook");
  const block = (title, values) => ["## " + title, "", ...values.map(x => "- " + x), ""];
  const lines = [
    "# " + playbook.name,
    "",
    "> 状态：" + playbook.status + "。11 阶段生命周期与 Profile 义务仍是权威；本手册不新增 Gate。",
    "> 适用：" + playbook.appliesWhen,
    "",
    "## 原则",
    "",
    ...playbook.principles.map(x => "- " + x),
    "",
    ...(playbook.acceptanceExamples ? block("验收示例（合成场景）", playbook.acceptanceExamples) : []),
    ...(playbook.negativeCases ? block("必须覆盖的负例", playbook.negativeCases) : []),
    ...(playbook.stopConditions ? block("停止条件", playbook.stopConditions) : []),
    ...(playbook.antiClaims ? block("不可宣称", playbook.antiClaims) : []),
    ...(playbook.rhythm ? block("每日节律", playbook.rhythm) : []),
    ...(playbook.reporting ? ["## 汇报句式", "", playbook.reporting, ""] : []),
    "## 任务分流",
    "",
    "| 任务 | 第一步 | 完成证据 |",
    "|---|---|---|",
    ...playbook.triage.map(t => "| " + t.task + " | " + t.firstMove + " | " + t.evidence + " |"),
    "",
    "## 阶段手册",
    ""
  ];
  for (const phase of playbook.phases) {
    lines.push(
      "### " + phase.id + " · " + phase.title,
      "",
      "- 问题：" + phase.question,
      "- 最小实现：" + phase.minimal,
      "- 退出证据：" + phase.exitEvidence.join("；"),
      ""
    );
  }
  if (playbook.toolContract) {
    lines.push("## 工具契约示例", "", "> " + playbook.toolContract.note, "", "~~~text",
      ...playbook.toolContract.example, "~~~", "");
  }
  if (playbook.evaluationLevels) {
    lines.push("## 评测分层", "", "| 层级 | 证明什么 | 不证明什么 |", "|---|---|---|",
      ...playbook.evaluationLevels.map(x => "| " + x.level + " | " + x.proves + " | " + x.doesNotProve + " |"), "");
  }
  if (playbook.evaluation) {
    lines.push("## 评测规则", "", ...playbook.evaluation.metrics.map(x => "- " + x), "",
      ...playbook.evaluation.rules.map(x => "- " + x), "");
  }
  if (playbook.riskMatrix) {
    lines.push("## 风险与权限", "", "| 风险 | 例子 | 权限流程 |", "|---|---|---|",
      ...playbook.riskMatrix.map(x => "| " + x.risk + " | " + x.examples + " | " + x.control + " |"), "");
  }
  if (playbook.stateContract) lines.push(...block("状态契约", playbook.stateContract));
  if (playbook.durabilityRules) lines.push(...block("持久化与恢复", playbook.durabilityRules));
  if (playbook.hitlRules) lines.push(...block("人工接管（HITL）", playbook.hitlRules));
  if (playbook.evalMetrics) lines.push(...block("评测指标与覆盖", playbook.evalMetrics));
  if (playbook.rerankDecision) lines.push("## Rerank 决策", "", playbook.rerankDecision, "");
  lines.push("## 失败诊断", "");
  for (const item of playbook.failureDiagnosis) {
    lines.push("- **" + item.symptom + "**：" + item.order.join(" → ") + "。停止规则：" + item.stopRule);
  }
  lines.push("", "## Definition of Done", "", ...playbook.definitionOfDone.map(x => "- " + x), "",
    "## Agent 交接", "", ...playbook.handoff.map(x => "- " + x), "",
    "## 回退", "", ...playbook.rollback.map(x => "- " + x), "");
  if (playbook.exercises) lines.push(...block("隔离练习", playbook.exercises));
  lines.push("> 本手册是操作建议，不含真实客户数据；示例均为合成/脱敏内容。所有未执行项保持 NOT_RUN。", "");
  return lines.join("\n");
}

export function validatePlaybooks() {
  const errors = [];
  if (PLAYBOOKS.length !== 3) errors.push("expected 3 engineering playbooks");
  if (new Set(PLAYBOOK_IDS).size !== PLAYBOOKS.length) errors.push("duplicate playbook ids");
  for (const p of PLAYBOOKS) {
    for (const key of ["id", "name", "profile", "appliesWhen", "authority", "status"])
      if (typeof p[key] !== "string" || !p[key].trim()) errors.push(p.id + " missing " + key);
    if (!p.principles?.length) errors.push(p.id + " has no principles");
    if (!p.triage?.length) errors.push(p.id + " has no triage");
    if (!p.phases?.length) errors.push(p.id + " has no phases");
    if (!p.definitionOfDone?.length) errors.push(p.id + " has no definition of done");
    for (const key of ["acceptanceExamples", "negativeCases", "stopConditions", "antiClaims", "exercises"])
      if (!Array.isArray(p[key]) || !p[key].length) errors.push(p.id + " missing " + key);
    if (p.id === "ai-application") {
      if (!Array.isArray(p.rhythm) || !p.rhythm.length) errors.push("ai-application missing rhythm");
      if (typeof p.reporting !== "string" || !p.reporting.trim()) errors.push("ai-application missing reporting");
    }
    if (p.id === "rag" && (typeof p.rerankDecision !== "string" || !p.rerankDecision.trim())) errors.push("rag missing rerank decision");
    if (p.id === "agent")
      for (const key of ["stateContract", "durabilityRules", "hitlRules", "evalMetrics"])
        if (!Array.isArray(p[key]) || !p[key].length) errors.push("agent missing " + key);
    for (const phase of p.phases ?? [])
      for (const key of ["id", "title", "question", "minimal"])
        if (typeof phase[key] !== "string" || !phase[key].trim()) errors.push(p.id + "." + phase.id + " missing " + key);
    for (const phase of p.phases ?? [])
      if (!Array.isArray(phase.exitEvidence) || !phase.exitEvidence.length) errors.push(p.id + "." + phase.id + " has no exit evidence");
  }
  return errors;
}
