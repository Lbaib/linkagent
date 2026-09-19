---
name: harness-checkpoint-light
description: 轻量 Sprint 收官八维质量审查：自动汇总已执行 Sprint 与现有证据，无需主审前置备证。
triggers:
  - harness checkpoint light
  - harness.checkpoint.light
  - checkpoint light
  - 轻量 Checkpoint
  - 自动汇总审查
  - Sprint 收官轻量版

---

# Harness Sprint Checkpoint（八维质量审查 · Light）

轻量版：自动汇总**当前已执行的全部 Sprint**及其现有证据，按八维标准（满分 100）做一次收官审查；
**不再要求**主审在委派前手工准备实物证据前置条件。

**上下文管理**: 🔄 隔离执行 — 使用子代理 / 独立上下文，确保无偏见审查

## OpenSpec 路径约定

遵循 `harness-openspec` skill：从 `openspec/changes/<change>/` 读取（**跳过** `archive/`），元数据由 change name 推导。

## 指令

对**当前 feature 下已执行的 Sprint 集合**进行八维质量审查（满分 100）。通常在一轮执行收口后使用。

### 自动证据汇总（替代主审前置准备）

**取消**完整版「实物验收前置条件」。light 版改为：执行器先自动汇总证据，再审查。

**仍须先做自定义补充门禁清账（若已配置）**：读 `AGENTS.md` → `custom_evaluator`；存在则先跑补充门禁 / 清账 `sprint-*-custom-eval-deferred.md`（等价 `/harness.eval.light custom-deferred`），再进入八维评分。非安全项可在本步统一处理，避免打断此前的 exec。

按以下优先级自动收集：

1. `.harness/sprints/<feature>/sprint-*-progress.md` — 各 Sprint 任务、批次门禁、L1/L2 验证状态
2. `.harness/scope/<feature>/sprint-*.yaml` — scope（light / full 均可）
3. 已存在的 `sprint-*-checkpoint.md`、`boundary-report.md`、`.harness/metrics/<feature>/*.json`（如有）
4. `openspec/changes/<change>/specs/<openspec_feature>/spec.md`、`tasks.md`、`design.md`
5. 仓库内已落盘的测试输出、`[E2E_SCREENSHOT_DIR]` / `/tmp/sprint-*-checkpoint/` 截图、接口 response 片段、`[REAL_SERVICE_CHECK]` 记录等（如有）
6. `/harness.eval` 或 `/harness.eval.light` 回写到 progress / checkpoint 的验证结果

规则：
- **不要求**主审先跑 `[REAL_SERVICE_CHECK]` / 浏览器截图 / 启动应用再开跑
- 已有证据必须自动纳入；缺证记为 `evidence_missing` / `data_gap`，**不得**默认 PASS
- 默认聚合当前 feature 下全部已执行 Sprint；用户传 Sprint 编号时，只聚合 `<= N`

### 输入参数

$ARGUMENTS — 可选：
- Sprint 编号（如 `1`）— 只汇总到该 Sprint（含更早已执行 Sprint）
- 不指定 — 自动发现并汇总**所有已执行 Sprint**

### 与完整版 `harness.checkpoint` 的差异

| 项 | `harness.checkpoint` | `harness.checkpoint.light` |
|----|----------------------|----------------------------|
| 审查范围 | 当前单个 Sprint | 默认汇总**所有已执行 Sprint** |
| 主审前置备证 | 必须（runId / 截图 / HV） | **取消**，执行器自动收集 |
| 评分体系 | Constitution 原则逐条合规 | **八维质量分（满分 100）** |
| 证据来源 | 主审传入为主 | progress / scope / spec / 已落盘证据 |
| 缺证处理 | 未提供则声明并重扣 | 自动标记缺口，仍出审查结论 |

严格单 Sprint + 主审制 Constitution 审查请用 `/harness.checkpoint`。

### 执行步骤

使用 Agent 工具启动子代理，传入以下任务：

```
你是 Harness Checkpoint 审查员。你的职责是对代码进行独立的八维质量审查，不受之前开发上下文影响。

1. 可选读取 `.specify/memory/constitution.md` 作为背景约束（不作为本命令计分表）
2. 从 OpenSpec change name 推导 metadata，确认 `ticket_id` / `openspec_feature` / `feature`
3. 自动发现 `.harness/sprints/<feature>/` 下已执行 Sprint：
   - 存在 `sprint-{N}.md` 或 `sprint-{N}-progress.md` 即视为已执行
   - 用户传编号时只聚合 `<= N`
4. 逐个读取 `sprint-{N}-progress.md`，汇总任务、批次门禁、L1/L2 状态
5. 读取已有 `.harness/scope/<feature>/sprint-{N}.yaml`（如有）
6. 自动读取已落盘验证/审查产物（checkpoint、boundary report、metrics、测试输出、截图、接口 response、REAL_SERVICE_CHECK 记录等）
7. 缺证必须显式记为 `evidence_missing` 或 `data_gap`，不得默认 PASS
8. 对照 `openspec/changes/<change>/specs/<openspec_feature>/spec.md` 与聚合范围内的 diff，按下列八维逐项打分：

### 评分标准（满分 100）

| 维度 | 评分内容 | 满分 |
|------|----------|------|
| 编译通过率 | 编译/构建是否通过，编译警告数量 | 10 |
| 命名规范 | 类名、方法名、变量名是否符合项目规范 | 10 |
| 代码结构 | 单方法行数、单类行数、圈复杂度 | 10 |
| 异常处理 | 空 catch、catch 无堆栈日志、异常吞没、未关闭资源 | 10 |
| 硬编码检测 | 魔数、硬编码 IP/URL/密码/密钥，未使用常量 | 10 |
| 日志规范 | 关键方法入口有日志，日志级别是否合理、日志是否含上下文信息 | 10 |
| 代码重复 | 本次变更中是否存在复制粘贴的重复代码 | 10 |
| 实现一致性 | 代码实现是否与 spec 定义一致（开发需重点关注此项） | 30 |
| 合计 | - | 100 |

### 各维审查要点

#### 编译通过率（10）
- 构建是否通过；失败则该维 0 分或按阻断严重度重扣。
- 编译警告数量与级别；无构建证据时记缺口并扣分，不得默认满分。

#### 命名规范（10）
- 类名、方法名、变量名是否符合项目既有命名惯例。

#### 代码结构（10）
- 单方法行数、单类行数、圈复杂度是否在项目可接受范围。

#### 异常处理（10）
- 空 catch、catch 无堆栈/日志、异常吞没、未关闭资源等一律扣分。

#### 硬编码检测（10）
- 魔数、硬编码 IP/URL/密码/密钥、应抽常量而未抽的字面量。

#### 日志规范（10）
- 关键方法入口是否有日志；级别是否合理；是否含足够上下文。

#### 代码重复（10）
- 聚合范围内本次变更是否存在明显复制粘贴重复代码。

#### 实现一致性（30 · 重点）
- 对照 spec 验收场景与契约：行为、字段、接口路径/方法、数据模型、配置约定是否一致。
- 此项权重最高；与 spec 明显偏离应显著扣分，不得用其他维度高分掩盖。

输出八维评分报告：
| 维度 | 满分 | 得分 | 问题详情 / 扣分依据 |
|------|------|------|---------------------|

### 得分规则（诚实扣分 · 避免 100/100 凑分）
- 八维合计满分 100；逐维按问题扣分，不得无依据给满分
- 实现一致性（30）为重点项：spec 覆盖不全或行为偏离必须如实扣分
- 总分 ≥ 90 PASS · ≥ 80 CONDITIONAL PASS · < 80 FAIL
- 证据缺失、编译未跑通、与 spec 不一致都应诚实扣分

### Checkpoint 演进轨迹（必须）
若本轮 Checkpoint 经历过撤回 / 重跑 · 必须在 checkpoint.md 显式记录：
- 初判（日期 + 总分 + 各维得分 + 审查方法）
- 撤回原因（具体 SEV + 主要失分维度）
- 重跑（基于自动汇总证据 + 对比初判差异）
- 纪律沉淀（教训去向 · memory / template）

总体结论：PASS / CONDITIONAL PASS / FAIL（基于总分阈值）

如有违反，输出具体的文件路径和行号，以及修复建议。
更新纳入范围的 `sprint-*-progress.md` 中的 Checkpoint 审查结果。

CHECKPOINT_RESULT:
{
  "sprint": "<max_N_or_user_input>",
  "aggregated_sprints": ["<N1>", "<N2>"],
  "verdict": "PASS|CONDITIONAL PASS|FAIL",
  "score": "<n>/100",
  "dimension_scores": {
    "compile": <n>,
    "naming": <n>,
    "structure": <n>,
    "exception": <n>,
    "hardcode": <n>,
    "logging": <n>,
    "duplication": <n>,
    "spec_consistency": <n>
  },
  "ticket_id": "<ticket_id>",
  "openspec_feature": "<openspec_feature>",
  "checkpoint_path": ".harness/sprints/<feature>/sprint-<max_N_or_user_input>-checkpoint.md",
  "evidence_received": true,
  "evidence_sources": ["progress", "scope", "checkpoint", "metrics", "tests", "screenshots", "contracts"],
  "evidence_gaps": ["<missing_item>"]
}
```

### 注意

- **不要修改 source code**。本命令只产出审查结果与相关记录。
- **不再要求主审前置准备**；缺证必须转为风险或扣分，不得当成通过。
- 默认汇总当前 feature 下所有已执行 Sprint；只审到某一 Sprint 时传编号。
- light scope / light eval 导致证据粒度不足时，在报告中记 `data_gap`，不臆造结论。
- 关联: `/harness.eval.light`、`/harness.scope.light`、严格版 `/harness.checkpoint`
