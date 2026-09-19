---
name: harness-scope-light
description: 为当前 Sprint 轻量声明本次修改的路径范围与禁止范围，不做全仓扫描与 discovery。
triggers:
  - harness scope light
  - harness.scope.light
  - scope light
  - 轻量 Scope
  - 路径范围声明
  - 禁止范围

---

# Harness Scope 声明生成（Light）

轻量版：只记录 **本次修改的路径范围（in_scope）** 与 **禁止范围（out_of_scope）**，
**不做** 全仓模块枚举、boundary-reviewer discovery、known_violations 登记。

**关联 Constitution 原则 XI · 模块边界纪律（声明侧；不跑全仓 enforce discovery）。**

**上下文管理**: 保持当前上下文

## OpenSpec 路径约定

遵循 `harness-openspec` skill：从 `openspec/changes/<change>/` 读取（**跳过** `archive/`），元数据由 change name 推导。

## 指令

为当前 Sprint 生成 `.harness/scope/<feature>/sprint-<N>.yaml`，仅填路径范围与禁止范围。

读取以下文件（按需，能推出路径即可，不必全读）：
1. `.harness/scope/<feature>/_template.yaml` — 复制 `dependency_rules` / `metadata` 默认值（若无 feature 级模板，可读 `.harness/scope/_template.yaml`）
2. `.harness/sprints/<feature>/sprint-<N>.md` — 本 Sprint 任务涉及的路径线索
3. `openspec/changes/<change>/design.md` — Project Structure / Source Code 段（如存在）
4. `openspec/changes/<change>/tasks.md` — 任务描述中的文件/目录线索（如存在）

**不要**读取全仓 `CLAUDE.md` 焦点表来扫顶级模块；**不要**枚举 `[SOURCE_ROOT]` 下全部模块；**不要**调用 boundary-reviewer。

### 输入参数（用户可选提供）

- Sprint 编号: `$ARGUMENTS` 或从 `.harness/sprints/<feature>/` 推断当前最新 Sprint
- 可选显式路径: 用户直接给出 `in_scope` / `out_of_scope` 路径列表时优先采用

### 与完整版 `harness.scope` 的差异

| 项 | `harness.scope` | `harness.scope.light` |
|----|-----------------|----------------------|
| 全仓顶级模块枚举 / 文件数统计 | 有（推断 + discovery） | **不做** |
| CLAUDE.md 焦点表 lift | 优先级 A | **跳过** |
| boundary-reviewer discovery | Step 5 全仓跨界扫描 | **跳过** |
| known_violations 逐条处置 | Step 6 | **跳过**，固定 `known_violations: []` |
| 产出内容 | 全量 scope + 违规基线 | **仅** 本次修改路径 + 禁止路径 |

如需全仓 discovery / 防扩大基线，改用 `/harness.scope`。

### 执行步骤

#### Step 1 · 推断 Sprint 编号 + Feature

- 读取 OpenSpec change metadata，确认 `ticket_id` / `openspec_feature` / `feature`
- Sprint N: 用户参数 → 否则从 `.harness/sprints/<feature>/sprint-*.md` 取最大值
- 若文件缺失或冲突 → 报错并要求用户传 Sprint 编号

#### Step 2 · 收集本次修改路径（in_scope）

只从本 change / 本 Sprint 上下文收集**将改动或允许改动**的路径，来源优先级：

1. 用户在参数中显式给出的路径
2. `sprint-<N>.md` 任务清单中出现的目录/文件
3. `design.md` Project Structure / Source Code 中本 change 明确涉及的路径
4. `tasks.md` 中可解析的路径线索

规则：
- 以**目录或文件相对路径**写入 `modules.in_scope`（`id` 可用路径末段简化，`path` 必填）
- **禁止**为了「补全」而扫描全仓库并把未提及模块塞进 in/out
- 推不出任何路径 → 问用户：「本次允许修改的路径有哪些？（逗号分隔）」· 不得自行全仓猜测

#### Step 3 · 收集禁止范围（out_of_scope）

只记录**明确禁止改动**的路径，来源优先级：

1. 用户显式给出的禁止路径
2. design / sprint / tasks 中写明「不改 / 禁止 / 出范围 / out-of-scope」的路径
3. 若文档未写禁止项 → `out_of_scope: []`，并在摘要中注明「未声明禁止路径」；**不要**把全仓其余模块默认填入 out_of_scope

每条 out_of_scope 需有 `reason`（可复用：「非本次修改范围」）。

#### Step 4 · 写盘（可先展示草案再确认；轻量可一次写完）

拼 yaml 并写入 `.harness/scope/<feature>/sprint-<N>.yaml`：

```yaml
sprint: <N>
feature: [FEATURE_ID]
ratified: <today>
package_prefix: "."   # light 不探测全仓前缀；保持 "." 或用户指定

modules:
  in_scope: [...]      # 本次修改路径
  out_of_scope: [...]  # 禁止范围（可为空）

dependency_rules: [从 _template.yaml 复制默认 4 条]
known_violations: []   # light 固定空，不 discovery

metadata:
  discovery_mode: false
  enforce_in_l2: true   # 或按模板默认；不跑 discovery
  report_path: .harness/sprints/<feature>/sprint-<N>-boundary-report.md
```

`cross_cutting_exempt` / `scan_hints`：直接从 `_template.yaml` 复制占位即可，**不**做全仓核实。

输出摘要：

```
✅ .harness/scope/<feature>/sprint-<N>.yaml 已生成（light）

  in_scope: <count> 条路径（本次修改范围）
  out_of_scope: <count> 条路径（禁止范围）
  known_violations: 0（light 跳过 discovery）

说明: 未做全仓模块扫描。需要违规基线时改用 /harness.scope。
```

### 注意

- **不要修改 source code**。本命令只产出 yaml。
- **禁止全仓检查**：不枚举 `[SOURCE_ROOT]` 全部顶级模块、不统计全仓文件数、不调用 boundary-reviewer isolation executor、不填 known_violations。
- **重跑本命令**（同一 Sprint）默认覆盖 light 产物；用户传 `--force` 时同样覆盖。若已存在完整版 scope（含非空 `known_violations`），覆盖前警告用户，避免误清基线。
- 关联文档:
  - schema: `.harness/scope/<feature>/_template.yaml`
  - 完整版: `/harness.scope`
