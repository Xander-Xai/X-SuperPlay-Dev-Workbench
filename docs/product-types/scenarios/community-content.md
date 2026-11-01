# 内容 / UGC / 社区场景（场景 / 能力，不是新平台路线）

> `SCENARIO_OVERLAY_ONLY / NOT_RUNTIME_ROUTE / NOT_RUN`；2026-11-02。

**开发与数据契约**：内容创建/审核/分发→举报申诉→删除与权限恢复；隐私、版权与内容安全。

**至少设计的负例**：越权删除、未审核发布、私密内容外泄、申诉流程缺失。将每项转为 Spec AC、权限判断、负例测试与实际回执；测试环境不等于消费者验收。

**选择方式**：先在 [产品导航](../README.md) 选择真正交付给用户的平台/安装载体，再独立加上此业务场景；按 Web/APP/小程序实际交付选 Profile。

**候选 Skills**：specification、security-review、verification、incident-response。不要把它们当平台审核器或已经真实验证的 Skill。若场景依赖交易、受限信息或外部不可逆写入，必须人工审批。

不同平台的发布与真实验收互不替代；本文件不会使任何 `xeng --type` 或 `route-pack` 新增类型。
