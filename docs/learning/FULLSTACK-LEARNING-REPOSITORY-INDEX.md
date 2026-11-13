# 全栈学习与 Dev-Workbench 的跨仓接口

> 文档索引，不是依赖安装、自动执行、训练通过或产品发布授权。

## 责任分工

- [FullStack-Learning-OS](https://github.com/Xander-Xai/X-SuperPlay-FullStack-Learning-OS)：V4.0 需求驱动全栈能力地图（W1–W24只作知识覆盖坐标）、按需学习与官方资料、可选 `ai-fullstack-workbench` 实验及真实需求的个人证据。权威：[Roadmap](https://github.com/Xander-Xai/X-SuperPlay-FullStack-Learning-OS/blob/main/ROADMAP.md)。
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
[需求驱动入口](https://github.com/Xander-Xai/X-SuperPlay-FullStack-Learning-OS/blob/main/docs/learning/DEMAND-ROUTER.md) 依据当前任务反查最小先修、[知识图](https://github.com/Xander-Xai/X-SuperPlay-FullStack-Learning-OS/blob/main/docs/learning/KNOWLEDGE-GRAPH.md)与[官方资料库](https://github.com/Xander-Xai/X-SuperPlay-FullStack-Learning-OS/blob/main/docs/learning/OFFICIAL-RESOURCES.md)；[ReconLab案例](https://github.com/Xander-Xai/X-SuperPlay-FullStack-Learning-OS/blob/main/docs/learning/PRODUCT-DRIVEN-EXECUTION.md)仅是多场景中的可选实战。
[下游上线 Gate](https://github.com/Xander-Xai/X-SuperPlay-FullStack-Learning-OS/blob/main/docs/project/DOWNSTREAM-RELEASE-GATES.md) 按本仓 SaaS/企业交付方法核对授权、UAT、备份恢复、隐私/安全。

**不混同**：Workbench 11 阶段仍是工程过程权威；ReconLab 为学习仓合成样本，不授权修改 Utility-Sites 的冻结产品或部署到公网；本人独立能力验收仍为 NOT_RUN。
