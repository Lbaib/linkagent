---
name: harness-spec-check
description: 独立审计某个 change 的 spec 颗粒度（对照 Constitution 原则 XII），不阻断其他流程。
triggers:
  - harness spec-check
  - spec check
  - spec sizing
  - spec 颗粒度
  - 颗粒度审计
  - spec 审计

---

# Harness Spec 颗粒度审计

**关联 Constitution 原则 XII · Spec Sizing Discipline。**

**上下文管理**: 保持当前上下文（需要读 spec.md / tasks.md）

## OpenSpec 路径约定

遵循 `harness-openspec` skill：从 `openspec/changes/<change>/` 读取（**跳过** `archive/`），元数据由 change name 推导。

## 指令

独立审计某个 change 的 spec 颗粒度，不阻断其他流程。`/harness.plan` 已经内置同样的 pre-check，本命令是可在任意时刻手工跑的镜像。

读取以下文件：

1. `openspec/changes/<change>/specs/<openspec_feature>/spec.md` — requirement 来源
2. `openspec/changes/<change>/tasks.md`（如存在）— task 数来源
3. `.specify/memory/constitution.md` — 取原则 XII 当前阈值（默认 Requirements ≤ 3, Tasks ≤ 30）

### 输入参数

- Change name：`$ARGUMENTS`（必传 · 例如 `dpahcm-1001`）
- 找不到对应 `openspec/changes/<change>/specs/<openspec_feature>/spec.md` → 立即报错并退出

### 执行步骤

#### Step 1 · 数 requirement

```bash
grep -c "^### Requirement:" openspec/changes/<change>/specs/<openspec_feature>/spec.md
```

记下数量 N。

#### Step 2 · 数 task

```bash
grep -c "^- \[[ x]\] [0-9]\+\.[0-9]\+" openspec/changes/<change>/tasks.md  # 如存在
```

记下数量 M。tasks.md 缺失则记为 N/A。

#### Step 3 · 数 acceptance scenario（辅助维度）

```bash
grep -c "^#### Scenario:" openspec/changes/<change>/specs/<openspec_feature>/spec.md
```

记下数量 K。这个不是硬阈值，但 K 远大于 N 通常意味着 requirement 颗粒度太大，每个 requirement 塞了过多场景。

#### Step 4 · 输出审计报告

格式：

```markdown
# Spec 颗粒度审计 · <change> · <YYYY-MM-DD>

## 度量

| 维度 | 实际 | 阈值（原则 XII） | 状态 |
|---|---|---|---|
| Requirements | N | ≤ 3 | ✅ / ❌ 超 X |
| Tasks | M | ≤ 30 | ✅ / ❌ 超 Y / ⏳ N/A |
| Scenarios | K | 无硬阈值 | 参考值 · K/N = 平均 X 个/requirement |

## 判定

- ✅ **PASS** · 颗粒度合规 · 可进入 `/harness.plan`
- ❌ **FAIL** · 必须拆分（见下方建议）

## 拆分建议（FAIL 时输出）

### 当前 Requirements 列表
1. REQ1 - <title>
2. REQ2 - <title>
...

### 推荐拆分方案

按 requirement 边界拆成 N 个独立 change：

```
<change>-1-<slug>     (REQ1)
<change>-2-<slug>     (REQ2)
...
```

依次跑：
```
/opsx propose "<REQ1 描述>"
/opsx apply ...
/harness.plan
/harness.scope ...
```

### 拆分依赖图（如有跨 spec 依赖）

提议把共享基础设施作为前置 change，先 ship 完再走 requirement-level change。

## 替代方案

如果你认为不该拆，**3 选 1**：

1. **合并 requirement** · 仅当几个 requirement 真正紧密耦合，独立交付不构成完整价值
2. **升级 justification** · 在 spec 末尾添加 "## Sizing Override" 段，显式写明不可拆分的根本理由
3. **拆 change**（推荐 · 默认）

未做任一处理 · `/harness.plan` 会一直阻塞在 Step 0 pre-check。
```

### 注意

- **只读命令**：不修改任何 spec 文件，只输出审计报告
- 报告写到 stdout，不写盘（用户可以自己导出）
- Constitution 原则 XII 阈值可调（项目可在自己的 constitution.md 里覆盖默认值），本命令读项目实际 constitution
- 关联文档：
    - 原则 XII：`.specify/memory/constitution.md`
    - `/harness.plan` Step 0：`harness-plan` skill
