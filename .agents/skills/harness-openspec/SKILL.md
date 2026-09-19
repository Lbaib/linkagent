---
name: harness-openspec
description: Harness 工具链读取 OpenSpec change 的路径与元数据约定（替代原 speckit specs/ 与 feature.json）。
triggers:
  - harness openspec
  - openspec paths
  - change metadata
---

# Harness OpenSpec 路径约定

Harness 工具链已改用 OpenSpec，不再读取 `.specify/`、`specs/<feature>/` 下的 speckit 产物或 `feature.json`。

## 活跃 Change 定位

1. 扫描 `openspec/changes/` 下的子目录
2. **排除** `openspec/changes/archive/` 及 archive 下的所有路径
3. `change_name` = 目录名（如 `dpahcm-1001`）
4. 优先使用命令参数指定的 change；未指定时若仅有一个活跃 change 则自动选用，多个则 BLOCK 并要求用户指定

## 文件路径映射

| 原 speckit 路径 | OpenSpec 路径 |
|---|---|
| `specs/<feature>/plan.md` | `openspec/changes/<change>/design.md` |
| `specs/<feature>/spec.md` | `openspec/changes/<change>/specs/<openspec_feature>/spec.md` |
| `specs/<feature>/tasks.md` | `openspec/changes/<change>/tasks.md` |
| `specs/<feature>/feature.json` | 运行时推导（见下） |

`<openspec_feature>` 的**目录侧**含义：`openspec/changes/<change>/specs/` 下的子目录名（如 `do-someting`）。
**Harness 拼接用**的 `openspec_feature` 见下方「多 feature 复合名」——二者同名仅当 change 只有一个 spec 子目录时成立。

## 元数据推导（替代 feature.json）

从 `change_name` 与 specs 目录推导，不读 JSON 文件：

- `change_name`: change 目录名，如 `dpahcm-1001`
- `ticket_id`: `change_name` 全大写，如 `DPAHCM-1001`
- `openspec_features`: `openspec/changes/<change>/specs/` 下**全部**子目录名列表（字典序）；无子目录则 BLOCK
- `openspec_feature`: **Harness `feature` 路径拼接用**的名称（见下「多 feature 复合名」）
- `feature`: `.harness/` 各阶段子目录名，`<ticket_id>-<openspec_feature>`，如 `DPAHCM-1001-do-someting` 或 `DPAHCM-1001-auth+billing`
- `task_uid_prefix`: 等于 `ticket_id`
- `task_uid`: `<ticket_id>-<openspec_feature>-<task_id>`，其中此处的 `openspec_feature` 与上同（复合名或单名），如 `DPAHCM-1001-do-someting-1.1`、`DPAHCM-1001-auth+billing-1.1`

### 多 feature 复合名（Harness 拼接用 `openspec_feature`）

当 OpenSpec propose 生成的 change 在 `specs/` 下含有**多个**子目录时：

1. 列出全部子目录名 → `openspec_features`
2. **按字典序排序**后，用 `+` 拼接为一个稳定名称，作为 Harness 用的 `openspec_feature`
3. 再拼 `feature = <ticket_id>-<openspec_feature>`

规则：
- **仅 1 个**子目录：`openspec_feature` = 该目录名（与历史行为一致）
- **多个**子目录：**不得**再因「多 feature」BLOCK 或要求参数二选一来决定 metrics/sprints 等目录名；必须用上述复合名
- 例：`specs/auth/`、`specs/billing/` → `openspec_features=["auth","billing"]`，`openspec_feature="auth+billing"`，`feature="DPAHCM-1001-auth+billing"`
- 读写单个 spec 文件时仍用真实子目录：`openspec/changes/<change>/specs/<某一个 openspec_features 成员>/spec.md`；复合名**只**用于 `.harness/<stage>/<feature>/` 与 `task_uid` 中的拼接段
- 子目录增删导致复合名变化时，以**当前** specs 目录重新推导；旧 `feature` 目录不自动迁移（由调用方决定是否沿用或新建）

## `.harness/` 目录命名

各阶段子目录（`sprints/`、`reviews/`、`scope/`、`metrics/` 等）统一使用按上节推导的 `feature`，**不是**某一个裸的 specs 子目录名（多 feature 时尤其如此）：

| 阶段 | 路径模式 | 示例 |
|---|---|---|
| Sprint 计划/进度 | `.harness/sprints/<feature>/` | `.harness/sprints/DPAHCM-1001-do-someting/sprint-1.md` |
| Peer Review | `.harness/reviews/<feature>/` | `.harness/reviews/DPAHCM-1001-do-someting/1.1.md` |
| Scope | `.harness/scope/<feature>/` | `.harness/scope/DPAHCM-1001-do-someting/sprint-1.yaml` |
| Metrics | `.harness/metrics/<feature>/` | `.harness/metrics/DPAHCM-1001-auth+billing/sprint-1.json` |

## OpenSpec 文档格式提示

- spec 使用 `### Requirement:` 和 `#### Scenario:`，不是 `### User Story`
- tasks 使用 `- [ ] X.Y` 编号，不是 `- [ ] T001`

## 任务完成状态同步

Harness 执行任务（`harness-exec` / `harness-fix` 修正通过后）须**同时**更新两处勾选状态：

| 文件 | 角色 | 格式 |
|---|---|---|
| `.harness/sprints/<feature>/sprint-*-progress.md` | Sprint 执行账本（含 Owner/Claim/门禁） | `- [x] <task_uid> {task_id} ... \| Owner:... \|` |
| `openspec/changes/<change>/tasks.md` | Change 级任务总账（OpenSpec / archive 检查） | `- [x] {task_id} {描述}` |

同步规则：
- 按 `task_id`（如 `1.1`）在 tasks.md 中匹配 `^- \[[ x]\] {task_id}\s`
- 仅改 `[ ]` → `[x]`，不改描述
- 🚧 批次门禁行只存在于 progress，不同步到 tasks.md
- `harness-plan` 规划阶段只读 tasks.md，不写；执行阶段由 `harness-exec` 回写
