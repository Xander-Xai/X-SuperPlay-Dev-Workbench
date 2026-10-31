// Engineering maturity as a gap indicator, not a vanity score.
// The level is derived from concrete audit checks; missing controls are the output.
// L6 is never auto-claimed: it needs operation over time, which an audit cannot prove.

export const MATURITY_LEVELS = Object.freeze([
  { id: "L0", name: "Experiment", meaning: "代码存在，但没有可复现性保证。", targetHint: "Tier D 无目标" },
  { id: "L1", name: "Reproducible", meaning: "第二个人或 Agent 能按 README 跑起来：依赖、入口和配置可复现。", targetHint: "Tier C 目标" },
  { id: "L2", name: "Structured", meaning: "测试存在并进入 CI；文档描述真实行为；配置外置。", targetHint: "Tier B 目标" },
  { id: "L3", name: "Verified", meaning: "每次变更都有验证证据：测试门禁、密钥扫描、评审记录。", targetHint: "Tier A 过渡" },
  { id: "L4", name: "Production-ready", meaning: "可观测、回滚、备份、事故路径存在并演练过。", targetHint: "Tier A 目标" },
  { id: "L5", name: "AI-native", meaning: "Agent 可执行契约：AGENTS/CLAUDE 准确、任务路由被遵循、AI 行为有评测。", targetHint: "AI-native 目标" },
  { id: "L6", name: "Self-improving", meaning: "事故与摩擦自动转化为规则、测试或 Gate。", targetHint: "只能由长期运行证明" }
]);

export const MATURITY_TARGET = Object.freeze({ A: "L4", B: "L2", C: "L1", D: "L0" });

const PASSING = new Set(["PASS", "NOT_APPLICABLE"]);

function statusOf(checks, name) {
  return checks.find(c => c.name === name)?.status ?? "MISSING";
}

function ok(checks, name) {
  return PASSING.has(statusOf(checks, name));
}

function control(id, checks, requirements) {
  const missing = requirements.filter(([name, expected]) => {
    const status = statusOf(checks, name);
    if (expected) return status !== expected && !(expected === "PASS" && status === "NOT_APPLICABLE");
    return !PASSING.has(status);
  });
  return { id, met: missing.length === 0, missing: missing.map(([name]) => name + "=" + statusOf(checks, name)) };
}

// Pure: takes the same checks array that `xeng audit --json` prints.
export function maturityReport(checks, { tier = "B", profiles = [] } = {}) {
  const aiProfiles = ["ai-application", "rag", "agent"].filter(p => profiles.includes(p));
  const controls = [
    control("L1.reproducible", checks, [
      ["readme", "PASS"],
      ["engineering_profile", "PASS"],
      ["config.env_example", null]
    ]),
    control("L2.structured", checks, [
      ["tests.present", null],
      ["ci.present", "PASS"],
      ["docs.freshness", null]
    ]),
    control("L3.verified", checks, [
      ["tests.present", null],
      ["ci.present", "PASS"],
      ["security.secret_scan", "PASS"],
      ["git.gitignore", "PASS"]
    ]),
    control("L4.production", checks, [
      ["ops.rollback", null],
      ["release.changelog", null],
      ["config.env_pairing", null]
    ]),
    control("L5.ai-native", checks, [
      ["agents.md", "PASS"],
      ["claude.md", "PASS"],
      ["engineering_profile", "PASS"],
      ...(aiProfiles.length ? [["evals.present", "PASS"]] : [])
    ])
  ];

  // Highest contiguous level whose controls are met.
  let levelIndex = 0;
  for (const c of controls) {
    if (c.met) levelIndex++;
    else break;
  }
  const level = MATURITY_LEVELS[levelIndex].id;
  const target = MATURITY_TARGET[tier] ?? "L0";
  const targetIndex = MATURITY_LEVELS.findIndex(l => l.id === target);
  const missingControls = controls.filter(c => !c.met).flatMap(c => c.missing.map(m => c.id + ":" + m));
  const outOfBand = controls.filter((c, i) => i < levelIndex).map(c => c.id);
  return {
    status: "MATURITY_ASSESSED_FROM_AUDIT",
    tier,
    level,
    target,
    target_met: levelIndex >= targetIndex,
    controls,
    missing_controls: missingControls,
    out_of_band_controls: outOfBand,
    l6: {
      status: "NOT_VERIFIABLE",
      reason: "L6 需要长期运行记录证明事故/摩擦已转化为规则、测试或 Gate；静态审计不能证明。"
    },
    notes: [
      "等级只是缺口指标，不是质量分数；missing_controls 才是可执行输出。",
      "未达到的等级不会因为更高层的单个控制存在而被提升。",
      "审计通过不等于真实项目、设备或生产验收通过。"
    ]
  };
}
