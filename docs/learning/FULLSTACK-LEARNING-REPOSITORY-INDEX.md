# 全栈学习与 Dev-Workbench 的跨仓接口

> 文档索引，不是依赖安装、自动执行、训练通过或产品发布授权。

## 责任分工

- [FullStack-Learning-OS](https://github.com/Xander-Xai/X-SuperPlay-FullStack-Learning-OS)：学习 V3.0 W1–W24（24周/432h 参考预算，包含 Java/JVM/Spring 和前端深入）、项目 `ai-fullstack-workbench` 实验、个人进度、失败/恢复记录。权威：[Roadmap](https://github.com/Xander-Xai/X-SuperPlay-FullStack-Learning-OS/blob/main/ROADMAP.md)。
- [AI-Learning-OS](https://github.com/Xander-Xai/X-SuperPlay-AI-Learning-OS)：上游技术资料、按真实岗位需求的专项实验与人的独立评分。六周专题不是并行学习计划。
- **本 Dev-Workbench**：权威 [11 阶段](../../src/catalog.mjs) 工程生命周期、11→8→18 学习视图映射、Skills/Profiles、工程过程与验证证据标准。参见 [START-HERE](START-HERE.md) 和 [FULLSTACK-LIFECYCLE-GUIDE](FULLSTACK-LIFECYCLE-GUIDE.md)。
- [Utility-Sites](https://github.com/Xander-Xai/X-SuperPlay-Utility-Sites)：业务产品候选；其自身 README 明示目前待商业验证且暂停开发，不能凭学习仓链接认定已授权。

## 调用约定

1. 课程问题去 FullStack-Learning-OS；真实工程方法按本仓 11 阶段执行；产品授权由业务仓明确决定。
2. 将本仓方法用于学员项目时，引用明确版本和测试命令，不假定候选 Skills 已安装或通过真实项目验收。
3. 证据状态：文档存在≠运行完成；CI≠人的独立考核；学习项目≠Utility-Sites 生产交付。
4. 本次仅建立知识索引，没有变更 `src/`、`skills/`、`test/` 和运行时行为。


## 可运行的产品驱动学习切片（2026-11-14）

[FullStack-Learning-OS](https://github.com/Xander-Xai/X-SuperPlay-FullStack-Learning-OS) 不再只有 24 周理论表，现有 [ReconLab 合成核对代码](https://github.com/Xander-Xai/X-SuperPlay-FullStack-Learning-OS/tree/main/ai-fullstack-workbench)，通过 React/TS + FastAPI 的实际 CI 测试与构建。
[W1–W24 产品驱动实战映射](https://github.com/Xander-Xai/X-SuperPlay-FullStack-Learning-OS/blob/main/docs/learning/PRODUCT-DRIVEN-EXECUTION.md) 将每周课程落实为代码改动/故障注入/独立复测。
[下游上线 Gate](https://github.com/Xander-Xai/X-SuperPlay-FullStack-Learning-OS/blob/main/docs/project/DOWNSTREAM-RELEASE-GATES.md) 按本仓 SaaS/企业交付方法核对授权、UAT、备份恢复、隐私/安全。

**不混同**：Workbench 11 阶段仍是工程过程权威；ReconLab 为学习仓合成样本，不授权修改 Utility-Sites 的冻结产品或部署到公网；本人 24 周学习验收目前仍为 NOT_RUN。
