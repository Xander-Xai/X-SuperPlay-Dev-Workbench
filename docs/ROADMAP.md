# Roadmap · Evidence over Features

## v0.1 已实现（本开发 PR，合并和 CI 状态另行核验）

- 四路线/四种 APP 技术选择；基础 + AI 扩展 Profiles 组合。
- 11 阶段可点击视图、8 候选 Skills 搜索和映射。
- 项目需求/工具/Tier 配置、xeng dry-run 命令、Markdown/JSON 浏览器下载。
- 静态本机预览服务器、Node 逻辑测试、CI 计划。
- 工程验收状态阶梯、反馈回流说明、公共/私有 Source of Truth 边界。

## v0.2：真实项目 Dogfood

- [ ] 已有微信小程序真实仓库：固定 base SHA，导出 Spec + 3 张可执行 Ticket。
- [ ] xeng dry-run 对目标实际目录成功；人工批准写入，产生项目局部配置。
- [ ] 端到端真机测试产生用户可查验回执；问题反馈保留在项目仓。
- [ ] 第二个 SaaS 项目验证多租户负例、迁移、部署/回滚，审查 Profile 兼容性。
- [ ] 解决源仓待审 PR #5/#6；新网站只引用通过合并审查的权威机制。

## v0.3：可安装能力包（需设计与批准）

- [ ] Local installer / skill adapter：来源版本 SHA、license、allowlist 和权限检查。
- [ ] 不执行任意网上脚本；先 dry-run 差异，获授权后选择性安装，支持回退。
- [ ] Claude Code / Codex / OpenCode 的实际消费路径及负例测试。
- [ ] 可导出的项目 starter bundle，兼容原项目本地规则。

## v1.0：可信工程系统

- [ ] 正式可追溯的本地项目进度及证据导入，状态模型不允许 UNKNOWN→PASS。
- [ ] 真实跨项目试点证明流程重用收益；量化开发工时、返工与错误阻断。
- [ ] 改进反馈 → 候选规则/Skill → 真实复用 → 源仓 PR → 版本化发布。
- [ ] 安全、私有源边界、可访问性、移动端与用户体验的综合复核。

**不要以文档数量、Skills 数量或网站 UI 完成度代替生产交付。**
