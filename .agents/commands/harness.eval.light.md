---
name: harness-eval-light
description: 轻量 Harness 验证：默认在全部批次完成后做一次全批次检查，不按每批次触发。
triggers:
  - harness eval light
  - harness.eval.light
  - eval light
  - 轻量验证
  - 全批次验证
  - 批次收官验证

---

# Harness 任务验证（Evaluator · Light）

轻量版：默认在 **当前 Sprint 全部批次完成后**，对 **全批次做一次** L1+L2（高风险加 L4）检查；
**不**在每个批次结束时自动跑 eval。

**上下文管理**: ✅ 保持当前上下文（建议在 Sprint 全部批次任务与门禁行均完成后执行）

## OpenSpec 路径约定

遵循 `harness-openspec` skill：从 `openspec/changes/<change>/` 读取（**跳过** `archive/`），元数据由 change name 推导。

## 指令

对已完成的任务执行质量验证。验证必须参照 `.harness/prompts/evaluator.md`（**主门禁**）严格执行；若 `AGENTS.md` 配置了 `custom_evaluator`，在相同 Level/Step **对照读取**该补充文件（详见 evaluator.md § 自定义补充门禁）。

**补充门禁时机**（与完整版一致）：
- light 默认在**全批次完成后**做一次检查：此时应一并跑主门禁 + 补充门禁（含 deferred 清账）
- 若中途显式抽查：非安全补充项仍可只记 deferred，不强制当场打断
- 安全类补充 FAIL → 与主门禁同等处理

### 输入参数

$ARGUMENTS — 验证级别和范围，格式: `{level} {任务ID、Task UID或范围}`

- `/harness.eval.light L2 DPAHCM-1001-do-someting-1.1` — 对任务执行 Level 2 契约验证
- `/harness.eval.light L2 1.1` — 对当前 change 的任务 1.1 执行 Level 2
- `/harness.eval.light L4` — 执行 Constitution 全面合规审查
- `/harness.eval.light all` — 执行全部四级验证（Sprint Checkpoint 时使用）
- `/harness.eval.light custom-deferred` — 仅跑 AGENTS.md `custom_evaluator` 补充门禁（含 deferred 清账）；用于全批次后、checkpoint 前（`sdd.light` 环节 5b）
- 不带参数 — **默认：全批次单次检查**（见下方「默认行为」）；若配置了 `custom_evaluator`，同次一并清账补充门禁

### 与完整版 `harness.eval` 的差异

| 项 | `harness.eval` | `harness.eval.light` |
|----|----------------|----------------------|
| 默认触发范围 | 最近完成的 **单个批次** | 当前 Sprint **全部已完成批次**，**一次**检查 |
| 与批次节奏 | 常紧跟每批次 `/harness.exec` 后跑 | **等所有批次完成后**再跑；中途批次不默认 eval |
| 显式指定 level/任务 | 支持 | 同样支持（可提前抽查，非默认） |

中途若需按批次验证，改用 `/harness.eval`，或对本命令显式传任务/范围。

### 验证级别

验证是分层递进的。每一层解决不同的问题：

#### Level 1 — CI 门禁（技术正确性）

回答问题：**代码能不能跑？**

```
Step 1: 单元测试 — [TEST_COMMAND]（门禁，不通过则阻断）
Step 2: 构建/编译 — [BUILD_COMMAND]
Step 3: Lint — [LINT_COMMAND] 无 ERROR
Step 4: 应用启动+集成验证 — [APP_START_COMMAND] + [UI_START_COMMAND] + 真实接口调用链验证
```

⛔ L1 不通过 → 后续层级不执行，进入 Corrector。
⚠️ Step 4 在 light 默认模式下对 **全批次合并** 执行一次（不再每个批次结束后各跑一次）；Sprint Checkpoint 时仍可再跑。

#### Level 2 — 契约与规格对照（功能正确性）

回答问题：**代码做的对不对？**

读取 `.harness/prompts/evaluator.md` Level 2 模板，对范围内每个接口入口/数据模型任务执行：

1. 读取 `[API_CONTRACT_ROOT]` → 逐项对照实际代码（路径、方法、字段、状态码）
2. 读取 `[DATA_MODEL_DOC]` → 逐字段对照数据模型
3. 读取 `openspec/changes/<change>/specs/<openspec_feature>/spec.md` 验收场景 → 检查业务逻辑覆盖度
4. 输出四维评分表（契约一致/模型一致/场景覆盖/代码质量，各10分，门槛32/40）

#### Level 3 — `[E2E_TOOL]` E2E（用户体验正确性）

回答问题：**用户能不能用？**

在用户故事完成后执行（`all` 或显式 L3 时）：

1. 根据 `openspec/changes/<change>/specs/<openspec_feature>/spec.md` 验收场景编写/运行 `[E2E_TOOL]` 测试
2. 测试文件: `[TEST_ROOT]/e2e/{story-name}[TEST_FILE_SUFFIX]`
3. 执行: `[E2E_COMMAND]`
4. 重跑3次验证稳定性

#### Level 4 — Constitution 合规（架构正确性）

回答问题：**有没有违反项目宪法？**

读取 `.harness/prompts/evaluator.md` Level 4 模板，逐条检查：

| 原则               | 检查重点                                                     |
| ------------------ | ------------------------------------------------------------ |
| I. 架构边界        | 服务端、用户界面和其他运行时边界符合 Constitution            |
| II. 契约驱动       | 实现与项目接口契约一致，无未定义接口                         |
| III. 测试纪律      | 高风险业务逻辑具备要求的分支覆盖                             |
| IV. 外部服务抽象层 | `[EXTERNAL_SERVICE_NAME]` 调用通过项目定义接口，Prompt/配置外置，有超时降级 |
| V. 可观测性        | 结构化日志，外部服务调用有指标                               |
| VI. 简单优先       | 无不必要的抽象                                               |
| VII. 安全合规      | 接口认证+权限控制，敏感操作审计日志                          |
| IX. Scope          | `.harness/scope/<feature>/sprint-<N>.yaml` 与实际改动一致    |

硬约束违反数必须为 0。

### 默认行为（不带参数）

不指定参数时，执行 **全批次单次检查**，级别仍为 **L1 + L2**，对范围内高风险任务自动追加 **L4**：

#### 前置条件

1. 定位当前 Sprint 的 `sprint-{n}-progress.md`
2. 确认本 Sprint **全部普通任务与全部 🚧 批次门禁行** 均已完成（`[x]`），或用户明确要求对「当前已完成的全部批次」收官检查
3. 若仍有未完成批次/门禁 → **不默认开跑**；提示先完成剩余批次，或改用 `/harness.eval` 做单批次验证 / 对本命令显式传任务范围

#### 范围与执行

1. 范围 = 该 `sprint-{n}-progress.md` 中 **所有已完成批次** 的任务与门禁（合并为一次 eval，不是按批循环多次）
2. L1 CI 门禁 → 对全范围一次性核验（测试/编译/Lint + 一次 Step 4 集成验证）；各批次门禁结果在 progress 中统一回写
3. L2 契约对照 → 对范围内含接口入口/数据模型的任务逐项检查
4. L4 Constitution → **仅对高风险任务**自动触发（认证、权限、高风险业务规则、外部服务、安全相关）
5. 若配置了 `custom_evaluator`：同次一并执行补充门禁与 `sprint-{n}-custom-eval-deferred.md` 清账（等价 `custom-deferred`）

高风险判定规则：任务描述包含 `认证、auth、安全、RBAC、权限、评分、scoring、等级变更、外部服务、[EXTERNAL_SERVICE_NAME]、接口入口` 之一。
非高风险任务的 L4 审查延迟到 Sprint Checkpoint（`/harness.checkpoint` / `/harness.checkpoint.light`）批量执行。

### 验证结果处理

- **PASS**: 更新 `sprint-{n}-progress.md`（全批次相关门禁/状态），报告通过
- **FAIL**: 输出失败项清单 + 具体位置（标明所属批次若可辨），提示用户运行 `/harness.fix`
