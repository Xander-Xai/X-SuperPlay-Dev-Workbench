# 数据分析 / ETL / BI 场景（场景 / 能力，不是新平台路线）

> `SCENARIO_OVERLAY_ONLY / NOT_RUNTIME_ROUTE / NOT_RUN`；2026-11-02。

**开发与数据契约**：数据来源授权→采集/清洗→指标模型→可视化→调度/回填→质量对账。

**至少设计的负例**：口径漂移、未经授权采集、重复 ETL、历史回填污染。将每项转为 Spec AC、权限判断、负例测试与实际回执；测试环境不等于消费者验收。

**选择方式**：先在 [产品导航](../README.md) 选择真正交付给用户的平台/安装载体，再独立加上此业务场景；backend/web/infrastructure 依产品载体选择。

**候选 Skills**：specification、architecture、verification、incident-response。不要把它们当平台审核器或已经真实验证的 Skill。若场景依赖交易、受限信息或外部不可逆写入，必须人工审批。

不同平台的发布与真实验收互不替代；本文件不会使任何 `xeng --type` 或 `route-pack` 新增类型。
