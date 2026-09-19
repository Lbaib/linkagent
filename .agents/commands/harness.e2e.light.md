---
name: harness-e2e-light
description: 轻量 E2E：简易执行验证，走 AGENTS.md 自定义门禁；不要求严格遵循 evaluator.md 分级门禁。
triggers:
  - harness e2e light
  - harness.e2e.light
  - e2e light
  - 轻量 E2E
  - 自定义门禁 E2E

---

# Harness E2E 验证（Light）

轻量版：做**简易**端到端/验收核对，验证清单以 `AGENTS.md` 配置的 **`custom_evaluator`** 为主；
**不要求**严格遵循 `.harness/prompts/evaluator.md` 的 L1–L4 分级门禁。

**上下文管理**: ✅ 保持当前上下文

## OpenSpec 路径约定

遵循 `harness-openspec` skill：从 `openspec/changes/<change>/` 读取（**跳过** `archive/`），元数据由 change name 推导。

## 指令

为当前用户故事或 Sprint 做简易验收验证：读取并执行项目自定义门禁文件中的检查项；
必要时对照 spec 验收场景做抽查，不展开完整 `/harness.e2e` 与 evaluator 分级流程。

### 门禁依据（Light）

**本 light 命令不严格遵循** `.harness/prompts/evaluator.md` 的分级门禁（L1 CI → L2 契约 → L3 E2E → L4 Constitution）。
以 `AGENTS.md` 中的 `custom_evaluator` 文件为唯一主清单，在当前对话中直接执行，输出结构化 `E2E_RESULT` 块即可。

### 输入参数

$ARGUMENTS — 用户故事编号（如 `"US1"`）或 `"sprint"` 表示当前 Sprint；亦可省略（默认当前 Sprint / 最近完成 US）

### 与完整版 `harness.e2e` 的差异

| 项 | `harness.e2e` | `harness.e2e.light` |
|----|---------------|---------------------|
| evaluator.md 分级门禁 | 按 L3 模板 + 完整 E2E 规则严格执行 | **不要求**严格遵循 L1–L4 分级 |
| 主验证依据 | evaluator L3 + generator E2E 模板 + `[E2E_TOOL]` | **`AGENTS.md` → `custom_evaluator`** |
| 稳定性 3 次重跑 | 要求 | **不要求** |
| 执行深度 | 完整 `[E2E_TOOL]` 用例 + Page Object + 截图 | **简易**：按自定义门禁 checklist 逐项勾选 + 少量证据 |
| 无 custom_evaluator | 仍可跑完整 E2E | **BLOCK** 或提示改用 `/harness.e2e` / 先配置 `custom_evaluator` |

### 执行步骤

在当前上下文直接执行：

```
你是 Harness 轻量 E2E / 自定义门禁检查员。

1. 从 OpenSpec change 推导 `ticket_id` / `openspec_feature` / `feature`
2. 读取项目根 `AGENTS.md`，解析 `custom_evaluator: <path>`
   - 文件不存在或未配置 → 停止并提示配置自定义门禁，或改用 `/harness.e2e`
3. 读取该自定义门禁文件全文；按其中与 E2E/验收/用户故事相关的 Step/检查项执行（**以自定义文件为准**，不要按 evaluator.md 的 L1–L4 分层强制展开）
4. （可选抽查）读取 `openspec/changes/<change>/specs/<openspec_feature>/spec.md` 中目标 US / Sprint 验收场景标题，仅核对自定义门禁是否覆盖关键场景；不强制为每个场景生成完整 `[E2E_TOOL]` 用例
5. **不要**强制按 `.harness/prompts/evaluator.md` 跑完整分级门禁；**不要**强制读取 generator E2E 模板；**不要**强制 3 次重跑

执行（简易）：
a. 按自定义门禁 checklist 逐项：能本地快速验证的则验证；不能则记 `PENDING` / `N/A` + 原因
b. 安全类项（凭据/secret/鉴权绕过等）FAIL → 整体 FAIL，可建议 `/harness.fix`
c. 非安全类 FAIL → 记入结果与 deferred（可写 `sprint-{N}-custom-eval-deferred.md`），verdict 可为 CONDITIONAL
d. 收集少量证据路径（命令输出、已有截图、日志片段、接口 response）；不要求新建完整 `[E2E_TOOL]` 套件与 Page Object

报告：
- 自定义门禁路径、检查项总数 / 通过 / 失败 / PENDING
- 失败项说明与证据路径
- 更新 `.harness/sprints/<feature>/sprint-*-progress.md` 中与 E2E / 自定义门禁相关的状态行（若有）
- E2E_RESULT:
  {
    "mode": "light-custom-gate",
    "story": "<US or sprint>",
    "ticket_id": "<ticket_id>",
    "openspec_feature": "<openspec_feature>",
    "custom_evaluator": "<path>",
    "evaluator_graded_gates": false,
    "verdict": "PASS|CONDITIONAL|FAIL|PENDING",
    "checks_total": <n>,
    "checks_passed": <n>,
    "checks_failed": <n>,
    "pending_count": <n>,
    "evidence_paths": ["<path>"],
    "risk_items": ["<risk>"],
    "deferred_path": "<optional sprint-N-custom-eval-deferred.md>"
  }
```

### 注意

- **禁止**为满足完整版流程而强制套用 `.harness/prompts/evaluator.md` 的 L1–L4 分级门禁
- 主 Harness 分级门禁不由本命令替代；本命令聚焦 **`custom_evaluator` 自定义补充门禁** 的简易验收
- 需要完整 `[E2E_TOOL]`、3 次稳定性与严格 evaluator L3 时，改用 `/harness.e2e`
- 若自定义门禁要求应用/UI 已启动而当前未启动，提示用户执行 `[APP_START_COMMAND]` / `[UI_START_COMMAND]`，或将该项记为 `PENDING`
