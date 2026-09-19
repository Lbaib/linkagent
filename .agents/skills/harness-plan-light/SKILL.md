---
name: harness-plan-light
description: 读取任务清单并生成单次 Sprint 的简化计划与进度文件（跳过 Requirement 数量检查与人工验证节点）。
triggers:
  - harness plan light
  - sprint planning light
  - plan sprint light
  - Sprint 简化规划
  - 单次 Sprint 规划
  - 生成简化进度文件

---

# Harness Sprint 规划（Light）

**上下文管理**: 保持当前上下文（需要看到 tasks.md 全貌）

**与完整版差异**:
- 仅生成 **单次** Sprint 的简化计划（不拆多 Sprint）
- **跳过** Spec 颗粒度 / Requirement 数量 pre-check（原则 XII）
- `sprint-{n}-progress.md` **不写入** 👁 人工验证节点（HV）

## OpenSpec 路径约定

遵循 `harness-openspec` skill：从 `openspec/changes/<change>/` 读取（**跳过** `archive/`），元数据由 change name 推导，不读 `feature.json`。

## 指令

读取以下文件：

1. `openspec/changes/<change>/tasks.md` — 完整任务清单
2. 按 OpenSpec 约定推导 `ticket_id` / `openspec_feature` / `feature` / `task_uid_prefix`（`feature` = `<ticket_id>-<openspec_feature>`，如 `DPAHCM-1001-do-someting`）
3. `.harness/prompts/planner.md` — Sprint 规划模板（Light 模式下忽略其中的「拆多 Sprint」与「人工验证节点 HV」强制规则）

将 tasks.md **全部纳入一个 Sprint**，生成简化计划。

### 输入参数（用户可选提供）

- Change name: `$ARGUMENTS` 中的 change 名（如 `dpahcm-1001`）；未指定时自动检测活跃 change
- Sprint 时长: 默认 1周
- 团队规模: 如用户未指定，默认 1人 + 自动化辅助
- 从哪个 Phase 开始: 如用户未指定，从 Phase 1 开始（Light 仍从该 Phase 起，将后续全部 Phase 打进同一 Sprint）

### 执行步骤

#### Step 0 · 跳过 Spec 颗粒度 pre-check

Light 模式**不执行** Requirement / Task 数量检查，不阻断规划。如需独立审计可另行运行 `/harness.spec-check <change>`。

#### Step 1 · 生成单次 Sprint 简化计划

1. 读取 `openspec/changes/<change>/tasks.md`，理解全部 Phase 和依赖关系
2. 从 OpenSpec change name 推导 metadata，确认 `ticket_id`、`openspec_feature`、`feature` 和 `task_uid_prefix` 存在。定义 `task_uid = <task_uid_prefix>-<openspec_feature>-<task_id>`，例如 `DPAHCM-1001-do-someting-1.1`
3. 读取 planner.md，理解批次门禁与工时估算基准；**忽略**多 Sprint 拆分规则与 HV 强制识别
4. 生成 **唯一一个** Sprint 计划，包含：
    - 目标和对应 Phase（可覆盖多个 Phase）
    - 按 Day/Batch 组织的任务清单（含 Task UID、并行标记和预估工时）
    - 验证检查点（仅自动化 / L1 门禁，**不含** HV）
    - 风险项
5. 将 Sprint 计划写入 `.harness/sprints/<feature>/sprint-{n}.md`（仅写一个 `sprint-{n}.md`）
6. 创建对应的进度文件 `.harness/sprints/<feature>/sprint-{n}-progress.md`，格式要求：
    - 每个任务一行: `- [ ] <task_uid_prefix>-<openspec_feature>-{task_id} {task_id} {描述} | L1:- L2:- |`
    - **每个批次末尾必须插入门禁行**: `- [ ] 🚧 **批次X.X门禁: L1 Step4 ({验证内容描述})** | 结果: - |`
    - 门禁行的验证内容根据批次类型确定：
        - 服务/核心批次: `启动+数据迁移验证` 或 `启动+接口端点验证`
        - 用户界面批次: `[TYPECHECK_COMMAND]` 或 `[UI_START_COMMAND]+页面可访问`
        - 集成批次: `[APP_START_COMMAND]+[UI_START_COMMAND]+真实接口调用链验证`
        - **涉真实外部服务或用户 UI 批次**: 必须含 4f 子步骤（`[REAL_SERVICE_CHECK]` 至少 1 次成功 + UI 肉眼截图 ≥ 2 张 + `[MOCK_INDICATOR]` 清洁）· 见 `.harness/prompts/evaluator.md` L1 Step 4f
    - 门禁行是 harness.exec 的强制检查点，不可被跳过
    - **禁止**在门禁行或 progress 其他位置写入 `👁 HV-M` / 人工验证节点相关标记与签收栏
7. **不识别、不规划、不输出** 人工验证节点 HV
8. 输出单次 Sprint 总览表 · 表中含 `ticket_id`、`openspec_feature`、`feature` 列（**不含** `HV 节点数` 列）

### 注意

- 不要修改 `openspec/changes/<change>/tasks.md`
- Sprint 编号从 `.harness/sprints/<feature>/sprint-*.md` 中已有文件后继续
- Light 模式始终只新增 **一个** sprint 计划文件与对应 progress 文件
