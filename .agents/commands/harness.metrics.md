---
name: harness-metrics
description: 生成 Sprint 五维度量报告，统计约束、上下文、验证、修正和效率指标。
triggers:
  - harness metrics
  - sprint metrics
  - delivery metrics
  - Sprint 度量
  - 五维度量
  - 度量报告

---

# Harness Sprint 度量报告

**上下文管理**: 🔄 清空上下文 — 使用子代理执行，纯粹基于进度文件生成数据

## OpenSpec 路径约定

遵循 `harness-openspec` skill：从 `openspec/changes/<change>/` 读取（**跳过** `archive/`），元数据由 change name 推导。

## 指令

生成当前 Sprint 的五维度量报告。

### 输入参数

$ARGUMENTS — 可选：

- Sprint 编号（如 "1"）
- "trend" — 生成跨 Sprint 趋势分析

### 执行步骤

使用 Agent 工具启动子代理，传入以下任务：

```
你是 Harness 度量分析师。基于进度数据生成度量报告。本 skill 可独立执行，不依赖其他编排 skill 的描述。

1. 从 OpenSpec change name 推导 metadata，确认 `ticket_id` / `openspec_feature` / `feature`
2. 读取 `.harness/sprints/<feature>/sprint-{N}-progress.md`
3. 读取 `.harness/prompts/metrics.md` 了解度量指标定义和计算公式
4. 基于进度文件中的数据，计算五维度量：
   - 约束层: 硬/软约束违反次数、约束遵守率
   - 信息层: 契约覆盖率、模型覆盖率、模板使用率
   - 验证层: 首次通过率、验证分数、E2E通过率
   - 修正层: 修正收敛率、平均轮次、人工介入次数
   - 执行质量: Sprint完成率、平均任务耗时、有效代码率
5. 若存在流水线台账则一并汇总写入报告（缺失则记 dataGaps，禁止编造）；**不要**写 `skillTokenUsage`：
   - `.harness/metrics/<feature>/sdd-full-profile-usage.jsonl`（或 `sdd-light-profile-usage.jsonl`）→ `projectProfileUsage`
     - **不要**把 `clarifyCount` 写入 `projectProfileUsage`
   - 同上 profile-usage jsonl → 顶层 `clarifyCount`：对各行 `clarifyCount` **求和**（含同 step 多 attempt）；台账缺失则 `clarifyCount: null` 并记入 `dataGaps`
   - `.harness/metrics/<feature>/sdd-full-skill-tokens.jsonl`（或 `sdd-light-skill-tokens.jsonl`）→ 报告 顶层字段：
     - `inputTokens`：各行 `inputTokens` 之和
     - `outputTokens`：各行 `outputTokens` 之和
     - `tokens`：`inputTokens + outputTokens`
     - `tokenUsage`：按 `modelName` 分组求和 `inputTokens` / `outputTokens`，每模型一条，例如：
       ```json
       "inputTokens": 3500,
       "outputTokens": 35000,
       "tokens": 38500,
       "tokenUsage": [
         {"inputTokens": 2500, "outputTokens": 10000, "modelName": "deepseek-v4-flash"},
         {"inputTokens": 1000, "outputTokens": 25000, "modelName": "deepseek-v4-pro"}
       ]
       ```
     - 台账缺失 → `inputTokens` / `outputTokens` / `tokens` 为 `null`、`tokenUsage: []`，并记入 `dataGaps`；不得伪造
6. 生成健康度仪表盘（🟢/🟡/🔴）
7. 提出 Top 3 改进建议

输出：
a. 终端显示度量摘要（须含 `clarifyCount`、顶层 `inputTokens` / `outputTokens` / `tokens` 与 `tokenUsage`）
b. 写入完整报告到 `.harness/metrics/<feature>/sprint-{N}.json`（含 `projectProfileUsage`、`clarifyCount`、顶层 `inputTokens` / `outputTokens` / `tokens` / `tokenUsage`；**不含** `skillTokenUsage`）

如果参数为 "trend":
a. 读取 `.harness/metrics/<feature>/` 下所有 sprint-*.json
b. 生成跨 Sprint 趋势对比表
c. 识别改善和恶化的指标（可含 clarifyCount、inputTokens / outputTokens / tokens / tokenUsage 趋势，若有）
d. 输出预测和建议
```
