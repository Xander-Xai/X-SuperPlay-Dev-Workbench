# 工程成熟度 L0–L6（Workbench 诊断能力）

L0–L6 不再只是旧仓的治理文档，也不再作为通用组织模型；它被保留为 **Workbench 的本地工程诊断能力**，输出缺口而不是分数。

~~~bash
node tools/xeng.mjs maturity <path>
node tools/xeng.mjs maturity <path> --json
~~~

诊断复用 `xeng audit` 的实际检查结果（README、Profile、测试、CI、密钥扫描、回滚、CHANGELOG、AGENTS/CLAUDE、AI evals），因此不会出现“文档声称 L4、审计找不到控制”的静默漂移。

## 等级

| Level | 名称 | 可审计含义 |
|---|---|---|
| L0 | Experiment | 代码存在，无复现保证 |
| L1 | Reproducible | README、Profile、env 配置可复现 |
| L2 | Structured | 测试存在、CI 运行、当前事实有新鲜度锚点 |
| L3 | Verified | 测试 + CI + 密钥扫描 + `.gitignore` 共同构成验证门禁 |
| L4 | Production-ready | 回滚、CHANGELOG、env 配对可查 |
| L5 | AI-native | AGENTS/CLAUDE 准确；AI Profiles 有 evals 目录 |
| L6 | Self-improving | **不由静态审计宣称**：需要长期运行记录证明 |

## 规则

- 等级是**缺口指标**，`missing_controls` 才是可执行输出。
- 只按连续达成计算；更高层已满足的单个控制列入 `out_of_band_controls`（等价于旧模型的 `[+]` 记录），不会提升等级。
- Tier 目标：A → L4，B → L2，C → L1，D → L0。
- L6 固定 `NOT_VERIFIABLE`，除非有真实运行记录另行证明。
- 审计通过不等于真实项目、设备或生产验收通过。
