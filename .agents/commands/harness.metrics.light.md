---
name: harness-metrics-light
description: 轻量度量：仅根据本轮指令/流水线运行状态生成格式化指标文件，不做完整五维与趋势分析。
triggers:
  - harness metrics light
  - harness.metrics.light
  - metrics light
  - 轻量度量
  - 运行状态指标

---

# Harness Sprint 度量报告（Light）

轻量版：只根据**本轮已执行指令/环节的运行状态**生成一份格式化指标文件；
**不做**完整五维度量计算，**不做**跨 Sprint 趋势分析。

**上下文管理**: 🔄 清空上下文 — 使用子代理执行，纯粹基于已落盘运行状态写文件

## OpenSpec 路径约定

遵循 `harness-openspec` skill：从 `openspec/changes/<change>/` 读取（**跳过** `archive/`），元数据由 change name 推导。

## 指令

生成当前 Sprint 的**轻量运行状态指标文件**。

### 输入参数

$ARGUMENTS — 可选：
- Sprint 编号（如 `"1"`）；不指定则取当前 feature 下最新 Sprint
- **忽略** `trend`：light **不支持**趋势分析；若传入则提示改用 `/harness.metrics trend`

### 与完整版 `harness.metrics` 的差异

| 项 | `harness.metrics` | `harness.metrics.light` |
|----|-------------------|-------------------------|
| 五维公式指标 | 完整计算 | **不做** |
| 健康度仪表盘 / Top3 建议 | 有 | **不做**（可一行状态摘要） |
| 趋势 `trend` | 支持 | **不支持** |
| 数据源 | progress + metrics.md 五维公式 + … | **仅本轮运行状态**（progress / checkpoint / deferred） |
| 产出 | `sprint-{N}.json`（五维 schema） | `sprint-{N}-light.json`（运行状态 schema） |

### 执行步骤

使用 Agent 工具启动子代理，传入以下任务：

```
你是 Harness 轻量度量记录员。只根据本轮已跑过的指令状态写格式化指标文件，不要推算五维公式，不要做趋势。本 skill 可独立执行。

1. 从 OpenSpec change name 推导 metadata，确认 `ticket_id` / `openspec_feature` / `feature`
2. 确定 Sprint N（用户参数或最新 sprint）
3. 只读取本轮运行状态证据（有则用，无则记 missing，禁止编造）；**不要**写 `skillTokenUsage`：
   - `.harness/sprints/<feature>/sprint-{N}-progress.md` — 任务完成数、门禁勾选、L1/L2 粗计
   - `.harness/sprints/<feature>/sprint-{N}-checkpoint.md` — verdict / score（若有）
   - `.harness/sprints/<feature>/sprint-{N}-custom-eval-deferred.md` — 延期补充门禁是否已清账（若有）
   - `.harness/metrics/<feature>/sdd-light-profile-usage.jsonl` 或 `sdd-full-profile-usage.jsonl` — 有则汇总 `projectProfileUsage`（**不含** clarifyCount）；无则 missingLedger
   - 同上 profile-usage jsonl → 顶层 `clarifyCount`：对各行 `clarifyCount` **求和**；缺失则 `clarifyCount: null` 并记入 `dataGaps`
   - `.harness/metrics/<feature>/sdd-light-skill-tokens.jsonl` 或 `sdd-full-skill-tokens.jsonl` — 有则写入报告 顶层：
     - `inputTokens`：各行 `inputTokens` 之和
     - `outputTokens`：各行 `outputTokens` 之和
     - `tokens`：`inputTokens + outputTokens`
     - `tokenUsage`：按 `modelName` 分组求和 input/output，例如：
       ```json
       "inputTokens": 3500,
       "outputTokens": 35000,
       "tokens": 38500,
       "tokenUsage": [
         {"inputTokens": 2500, "outputTokens": 10000, "modelName": "deepseek-v4-flash"},
         {"inputTokens": 1000, "outputTokens": 25000, "modelName": "deepseek-v4-pro"}
       ]
       ```
     - 缺失 → `inputTokens` / `outputTokens` / `tokens` 为 `null`、`tokenUsage: []`，并记入 `dataGaps`
4. **禁止**：读取 `.harness/prompts/metrics.md` 做五维公式展开；禁止编造 contractCoverage、avgScore、耗时效率等无法从上述文件直接读出的值
5. 写入 `.harness/metrics/<feature>/sprint-{N}-light.json`，schema 如下：

{
  "schemaVersion": "light-run-status",
  "sprint": "<N>",
  "ticket_id": "<ticket_id>",
  "openspec_feature": "<openspec_feature>",
  "feature": "<feature>",
  "generatedAt": "<ISO8601>",
  "pipelineHint": "sdd.light|sdd.full|manual|unknown",
  "runStatus": {
    "tasksPlanned": <n_or_null>,
    "tasksCompleted": <n_or_null>,
    "batchGatesTotal": <n_or_null>,
    "batchGatesPassed": <n_or_null>,
    "l1Pass": <n_or_null>,
    "l2Pass": <n_or_null>,
    "checkpointVerdict": "PASS|CONDITIONAL PASS|FAIL|null",
    "checkpointScore": "<n>/100|null",
    "customEvalDeferredOpen": <bool_or_null>,
    "customEvalCleared": <bool_or_null>
  },
  "stepsExecuted": [
    {"step": "plan.light|scope.light|exec|eval.light|checkpoint.light|...", "status": "done|failed|skipped", "note": "<可选>"}
  ],
  "projectProfileUsage": { /* 有台账则精简汇总（不含 clarifyCount），或 {"missingLedger": true} */ },
  "clarifyCount": <sum_or_null>,
  "inputTokens": <sum_or_null>,
  "outputTokens": <sum_or_null>,
  "tokens": <sum_or_null>,
  "tokenUsage": [
    {"inputTokens": <n>, "outputTokens": <n>, "modelName": "<model>"}
  ],
  "dataGaps": ["<missing source>"]
}

6. 终端只打印短摘要（任务完成、门禁、checkpoint、clarifyCount、inputTokens/outputTokens/tokens）；不输出五维表、不做趋势预测

输出 `METRICS_RESULT`:
{
  "sprint": "<N>",
  "ticket_id": "<ticket_id>",
  "openspec_feature": "<openspec_feature>",
  "feature": "<feature>",
  "report_path": ".harness/metrics/<feature>/sprint-<N>-light.json",
  "schemaVersion": "light-run-status",
  "clarifyCount": <n_or_null>,
  "inputTokens": <n_or_null>,
  "outputTokens": <n_or_null>,
  "tokens": <n_or_null>,
  "tokenUsage": [{"inputTokens": <n>, "outputTokens": <n>, "modelName": "<model>"}],
  "dataGaps": ["<metric missing source>"]
}
```

### 注意

- **不要修改 source code**；只写 metrics 产物。
- 需要完整五维或趋势时改用 `/harness.metrics`。
- 与 light 流水线配合时：优先读 `sdd-light-profile-usage.jsonl` / `sdd-light-skill-tokens.jsonl`（若存在）。
- 顶层 `clarifyCount`：profile-usage jsonl 各行求和；**不要**写入 `projectProfileUsage`。
- 顶层 `inputTokens` / `outputTokens` / `tokens` / `tokenUsage`：从 skill-tokens jsonl 汇总（`tokens = inputTokens + outputTokens`）；**不要**写 `skillTokenUsage`。
