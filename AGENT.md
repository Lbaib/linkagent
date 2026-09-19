---
name: 智码大师
description: 智码大师是以 SDD+Harness 构建的一站式开发引擎，指导从需求设计至代码提交的全链路标准开发流程。业务场景落地过程中，各类自定义门禁策略、模式切换规则可结合产线实际场景灵活自定义适配；但需保障过程产物不可变更，符合平台审核规范。
---

# 智码大师

## 能力

以 **OpenSpec（需求/规格）+ Harness（规划/执行/验证）** 驱动从需求澄清到归档的标准交付链路，提供两条编排入口：

| 入口 | 定位 |
|------|------|
| `/sdd.full` | 完整交付：严格四级验证、Constitution checkpoint、五维度量 |
| `/sdd.light` | 轻量交付：简化 plan/scope、收官单次 eval、轻量 checkpoint/metrics |

核心能力概览：

- **规格驱动**：`/opsx:propose` 生成 change（proposal / design / tasks / specs），归档可同步主规格
- **Sprint 规划与边界**：`harness.plan` / `plan.light`、`harness.scope` / `scope.light`
- **任务执行与修正**：`harness.start` → `harness.exec`（按 batch）；失败可走 `/harness.fix`
- **四级门禁**：主门禁 `.harness/prompts/evaluator.md`；可选产线 `custom_evaluator` 同步骤对照（不替代主门禁）
- **收官与度量**：checkpoint（完整 / 轻量八维）、metrics（五维报告或 light 运行状态指标）
- **产线适配**：`AGENTS.md` 声明项目画像目录与补充门禁；`full_rule.md` 强制 light→full 升级
- **辅助命令**：`/harness.e2e` / `.light`、`/harness.review`、`/harness.spec-check`

> **过程产物不可变更**：`.harness/sprints|scope|metrics`、`openspec/changes` 等流水线产物须保留完整，符合平台审核规范。

## 配置

### 前置依赖

- Node.js **20.19.0+**
- 全局安装：`npm install -g @fission-ai/openspec@latest`

### 落盘到业务项目

将 `.harness`、`.qoder/`（以及按需的 `.cursor` / `.claude` / `.codex`）、`openspec` 复制到**业务项目根目录**，并维护根目录配置文件。

### AGENTS.md（配置入口，非画像本身）

流水线每环节从中解析：

1. **项目画像目录** `profile_dir` — 真正画像在该目录文件中；仅打开 `AGENTS.md` 不算 consulted
2. 可选 **`custom_evaluator`** — 补充门禁路径（相对项目根）

最小示例：

```markdown
# 项目 Agent 配置

## 项目画像
- profile_dir: docs/project-profile/

## 自定义门禁
- custom_evaluator: evaluator.md
```

| 配置项 | 含义 |
|--------|------|
| `profile_dir` | 画像文件目录；统计「是否读过该目录下文件」 |
| `custom_evaluator` | 补充门禁；与主门禁同步骤对照。缺省或不存在 → 只跑主门禁 |

补充门禁编写请以 `.harness/prompts/evaluator.md` 为**格式模板**（相同 Level / Step）；冲突时以主门禁为准。

补充门禁行为：

- **非安全类**：exec 批次可记入 `sprint-{N}-custom-eval-deferred.md`，不强制当场打断；全批次后、checkpoint 前须清账
- **安全类**（凭据/secret/鉴权绕过等）：与主门禁同等，可阻断并走 `/harness.fix`

### full_rule.md（是否必须 sdd.full）

| 项 | 说明 |
|----|------|
| 路径 | 业务项目根，与 `AGENTS.md` 同级 |
| 维护方 | 各产线自行维护；工具链不内置固定内容 |
| 作用 | `/sdd.light` 开跑前判定；命中则**中断 light**，强制 `/sdd.full` |
| 不存在 | 跳过检查，允许继续 light |

### 关键目录结构

```text
<PROJECT>/
├─ AGENTS.md                              # 配置入口
├─ full_rule.md                           # 可选：命中则禁止 sdd.light
├─ docs/project-profile/                  # 示例画像目录（以 AGENTS.md 为准）
├─ evaluator.md                           # 可选补充门禁（custom_evaluator 指向）
├─ openspec/
│  ├─ changes/
│  │  ├─ archive/YYYY-MM-DD-<change>/
│  │  └─ <change>/                        # 活跃 change；小写 IPD 单号
│  │     ├─ proposal.md / design.md / tasks.md
│  │     └─ specs/<openspec_feature>/spec.md
│  └─ specs/                              # 主规格
└─ .harness/
   ├─ prompts/                            # 主门禁与模板（含 evaluator.md）
   ├─ sprints/<FEATURE_ID>/               # sprint / progress / checkpoint / deferred
   ├─ scope/<FEATURE_ID>/sprint-1.yaml
   └─ metrics/<FEATURE_ID>/               # 五维 / light 指标 / 画像台账 jsonl
```

命令与 skill：`.qoder/commands/`、`.qoder/skills/`（其它 IDE 对应 `.cursor` / `.claude` 等）。

## 使用方式

**每个编排环节结束后须人工确认**再进入下一步；密码仅用于当次 IPD API，禁止回显或写入仓库。

### `/sdd.full` — 完整交付

**输入**：`<change_name> [需求描述…]`，可选 `--user` / `--pass`（无需求正文、需拉 IPD 附件时必填）

```text
/sdd.full dpahcm-1416 支持某某能力
/sdd.full dpahcm-1416 --user alice --pass secret123
```

| 序号 | 环节 | 命令 |
|------|------|------|
| 1 | propose | `/opsx:propose <change_name>` |
| 2 | plan | `/harness.plan` |
| 3 | scope | `/harness.scope` |
| 4 | start | `/harness.start` |
| 5 | exec | `/harness.exec`（按 batch，可多次） |
| 5b | custom-eval | 若配置了 `custom_evaluator`：`/harness.eval custom-deferred`（须在 checkpoint 前） |
| 6 | checkpoint | `/harness.checkpoint` |
| 7 | metrics | `/harness.metrics` → `sprint-{N}.json` + `sdd-full-profile-usage.jsonl` |
| 8 | archive | `/opsx:archive <change_name>` |

未配置 `custom_evaluator` 时跳过 5b。

### `/sdd.light` — 轻量交付

输入同 `sdd.full`。Harness 优先走 **light** 变体；无 light 的 `start` / `exec` 仍用完整版。

开跑前若存在 `full_rule.md`：命中则中断 light，强制改用 `/sdd.full`。

```text
/sdd.light dpahcm-1416 支持某某能力
/sdd.light dpahcm-1416 --user alice --pass secret123
```

| 序号 | 环节 | 命令 |
|------|------|------|
| 1 | propose | `/opsx:propose <change_name>` |
| 2 | plan | `/harness.plan.light` |
| 3 | scope | `/harness.scope.light` |
| 4 | start | `/harness.start` |
| 5 | exec | `/harness.exec`（batch；中途不默认每批 eval） |
| 5b | eval | `/harness.eval.light`（全批次单次；含 deferred 清账若已配置） |
| 6 | checkpoint | `/harness.checkpoint.light` |
| 7 | metrics | `/harness.metrics.light` → `sprint-{N}-light.json` |
| 8 | archive | `/opsx:archive <change_name>` |

画像台账：`.harness/metrics/<feature>/sdd-light-profile-usage.jsonl`。

### `/sdd.debug` — 工单拉取 → sdd.light

**输入**：`<KEY> --user <USERNAME> --pass <PASSWORD> [补充说明]`

```text
/sdd.debug IPDRR-43803 --user alice --pass secret123
/sdd.debug IPDRR-43803 --user alice --pass secret123 关注失败重试
```

1. Basic Auth 拉取 IPD：`summary` / `description` / `issuelinks`
2. 由 `issuelinks` 推导 OpenSpec `CHANGE`（小写 key），**不由参数传入 change**
3. 整理需求上下文（不含凭据）后执行 `/sdd.light <CHANGE>`，并携带 `summary` / `description`

### 手工逐步执行（对照）

```text
/opsx:propose <change_name>          # 建议显式带小写 IPD 单号
/opsx:explore <change_name> …        # 可选澄清
/harness.plan  或  /harness.plan.light
/harness.scope 或  /harness.scope.light
/harness.start
/harness.exec batch
/harness.eval  或  /harness.eval.light   # light：全批次收官；可选 custom-deferred
/harness.checkpoint 或 /harness.checkpoint.light
/harness.metrics 或 /harness.metrics.light
/opsx:archive <change_name>
```

其它常用：`/harness.e2e` / `/harness.e2e.light`（light 走 `AGENTS.md` → `custom_evaluator` 简易门禁）、`/harness.fix`、`/harness.review`、`/harness.spec-check`。

## 更新纪要

### 2026/08/07

- **画像台账**：`sdd.full` / `sdd.light` 各环节画像使用记录增加人为澄清修改次数（`clarifyCount`）；并列写入 Skill Token 消耗台账（`sdd-*-skill-tokens.jsonl`），metrics 汇总顶层 `inputTokens` / `outputTokens` / `tokens` 与按模型分组的 `tokenUsage`；feature 命名统一经 `harness-openspec` 推导，并汇总进五维 / light 指标。
- **IPD REST**：工单拉取与附件下载请求增加 UA 标识（`-A "zhima-toolkit"`），覆盖 `sdd.debug` / `sdd.full` / `sdd.light` 相关脚本与 skill。

### 2026/08/14

明确 `sdd.full` / `sdd.light` 在 metrics 汇总时写入 `projectProfileUsage` 的固定字段（不含 `clarifyCount`）：`profileDir`、`stepsConsulted`、`stepsNotConsulted`、`profileFilesUsed`、`keySections`

涉及文件：

- `skills/sdd-full/SKILL.md`、`skills/sdd-light/SKILL.md`

如已在使用上一个版本仅需要更新这两个文件

### 2026/08/19

`openspec/config.yaml` 增加 API Contract 章节记录
