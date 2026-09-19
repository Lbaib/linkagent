## openspec 准备

因 openspec 需要使用自身提供的 js 指令来做部分操作，需要自行安装 Node.js 20.19.0 或更高版本，并在命令行执行 `npm install -g @fission-ai/openspec@latest` 安装。

## 更新步骤

将 `.harness`、`.qoder/`（或按需的 `.cursor` / `.claude` / `.codex`）、`openspec` 文件夹复制到**业务项目根目录**。

在项目根创建并维护 `AGENTS.md`（见下方「AGENTS.md 配置」）。按需由各产线自行维护生成 `full_rule.md`（见下方「full_rule.md」）。

## 更新说明（目录结构）

复制到业务项目后，关键目录与产物如下（`<PROJECT>/` 为业务项目根）：

```text
<PROJECT>/
├─ AGENTS.md                              # 配置入口：项目画像目录、可选 custom_evaluator（本身不是画像内容）
├─ full_rule.md                           # 可选：命中则禁止 sdd.light，强制改用 sdd.full
├─ docs/project-profile/                  # 示例：项目画像目录（路径以 AGENTS.md 声明为准）
│  └─ …                                   # 模块焦点、出范围、路径索引、规则提示等
├─ evaluator.md                           # 可选：自定义补充门禁文件（路径由 AGENTS.md 的 custom_evaluator 指定）
├─ openspec/
│  ├─ changes/
│  │  ├─ archive/
│  │  │  └─ YYYY-MM-DD-<change>/          # 已归档 change（proposal / specs / design / tasks）
│  │  │     └─ specs/<openspec_feature>/
│  │  └─ <change>/                        # 活跃 change；<change> = 小写 IPD 单号，如 dpshct-3002
│  │     ├─ proposal.md
│  │     ├─ design.md
│  │     ├─ tasks.md
│  │     └─ specs/<openspec_feature>/
│  │        └─ spec.md
│  └─ specs/                              # 主规格（归档时可同步）
└─ .harness/
   ├─ prompts/                            # 主门禁与规划/验证模板（含 evaluator.md）
   ├─ sprints/
   │  └─ <FEATURE_ID>/                    # 如 DPSHCT-3002-xxx（IPD 单号前缀）
   │     ├─ sprint-1.md
   │     ├─ sprint-1-progress.md
   │     ├─ sprint-1-checkpoint.md        # checkpoint 产物（有则）
   │     └─ sprint-1-custom-eval-deferred.md  # 补充门禁延期清单（有则）
   ├─ scope/
   │  └─ <FEATURE_ID>/
   │     └─ sprint-1.yaml
   └─ metrics/
      └─ <FEATURE_ID>/
         ├─ sprint-1.json                 # sdd.full / harness.metrics 五维报告
         ├─ sprint-1-light.json           # sdd.light / harness.metrics.light 运行状态指标
         ├─ sdd-full-profile-usage.jsonl  # sdd.full 各环节画像使用台账
         └─ sdd-light-profile-usage.jsonl # sdd.light 各环节画像使用台账
```

工具链命令与 skill 位于 `.qoder/commands/`、`.qoder/skills/`（Qoder）。其它 IDE 若已同步，则对应在 `.cursor` / `.claude` 等目录。

---

## AGENTS.md 配置

项目根 `AGENTS.md` 是**配置入口**，不是项目画像本身。流水线每环节会从中解析：

1. **项目画像存放目录**（`profileDir`）— 真正的画像内容在该目录下的文件中  
2. 可选 **`custom_evaluator`** — 自定义补充门禁文件路径（相对项目根）

### 最小示例

```markdown
# 项目 Agent 配置

## 项目画像
- profile_dir: docs/project-profile/

## 自定义门禁
- custom_evaluator: evaluator.md
```

说明：

| 配置项 | 含义 |
|--------|------|
| `profile_dir`（或文中等价「画像目录」声明） | 画像文件所在目录；`sdd.full` / `sdd.light` 统计「是否读过该目录下文件」，仅打开 `AGENTS.md` 不算 consulted |
| `custom_evaluator` | 补充门禁路径；与 `.harness/prompts/evaluator.md`（**主门禁**）同步骤对照读取，**不替代**主门禁。缺省或文件不存在 → 只跑主门禁 |

> **提示**：编写 `custom_evaluator` 指向的文件时，请以 `.harness/prompts/evaluator.md` 为**格式模板**（按相同 Level / Step 结构组织检查项），便于与主门禁同步骤对照执行；自定义文件只做项目补充，冲突时以主门禁为准。

补充门禁行为（与 harness eval / checkpoint 一致）：

- **非安全类**：exec 批次中可记入 `sprint-{N}-custom-eval-deferred.md`，不强制当场打断；全批次后、checkpoint 前须清账（`/harness.eval custom-deferred` 或 light 等价）
- **安全类**（凭据/secret/鉴权绕过等）：与主门禁同等，可阻断并走 `/harness.fix`

---

## full_rule.md（是否应使用 sdd-full）

项目根 `full_rule.md` 用于描述：**哪些 change / 需求场景必须走完整流水线 `/sdd.full`，而不得使用 `/sdd.light`**。

| 项 | 说明 |
|----|------|
| 路径 | 业务项目根目录 `full_rule.md`（与 `AGENTS.md` 同级） |
| 维护方 | **各产线自行维护生成**；本仓库工具链不内置固定规则内容 |
| 作用 | `/sdd.light` 开跑前读取；按文件内规则判定本 change 是否应升级为 full |
| 不存在 | 跳过检查，允许继续 `sdd.light` |
| 命中 | **中断** `sdd.light`，强制用户改用 `/sdd.full <change_name> …` |

规则文案、匹配条件（如需求类型、模块范围、风险级别、关键字等）均以产线写入的 `full_rule.md` 为准；判定有歧义时倾向中断 light 并建议 full。

---

## 编排命令：sdd.full / sdd.light / sdd.debug

三个入口均在 `.qoder/commands/`，详细规则见对应 skill（`skills/sdd-full`、`sdd-light`、`sdd-debug`）。**每个编排环节结束后须人工确认**后再进入下一环节；密码仅用于当次 IPD API，禁止回显或写入仓库。

### `/sdd.full` — 完整交付

**输入**：`<change_name> [需求描述…]`，可选 `--user` / `--pass`（无需求正文、需拉 IPD 附件时必填）

```text
/sdd.full dpahcm-1416 支持某某能力
/sdd.full dpahcm-1416 --user alice --pass secret123
```

流水线（严格顺序）：

| 序号 | 环节 | 命令 |
|------|------|------|
| 1 | propose | `/opsx:propose <change_name>` |
| 2 | plan | `/harness.plan` |
| 3 | scope | `/harness.scope` |
| 4 | start | `/harness.start` |
| 5 | exec | `/harness.exec`（按 batch，可多次） |
| 5b | custom-eval | 若配置了 `custom_evaluator`：`/harness.eval custom-deferred`（须在 checkpoint 前） |
| 6 | checkpoint | `/harness.checkpoint` |
| 7 | metrics | `/harness.metrics` → `sprint-{N}.json` + 汇总 `sdd-full-profile-usage.jsonl` |
| 8 | archive | `/opsx:archive <change_name>` |

未配置 `custom_evaluator` 时跳过 5b。

### `/sdd.light` — 轻量交付

**输入**同 `sdd.full`。Harness 优先走 **light** 变体；无 light 的 `start` / `exec` 仍用完整版。

开跑前若项目根存在 `full_rule.md`：按其内规则判断本 change 是否应使用完整流水线；**命中则中断 `sdd.light`，强制改用 `/sdd.full`**（文件不存在则跳过）。

```text
/sdd.light dpahcm-1416 支持某某能力
/sdd.light dpahcm-1416 --user alice --pass secret123
```

| 序号 | 环节 | 命令 |
|------|------|------|
| 1 | propose | `/opsx:propose <change_name>` |
| 2 | plan | `/harness.plan.light`（单次 Sprint 简化计划；不做 Requirement 数量阻断；progress 不含 HV） |
| 3 | scope | `/harness.scope.light`（仅本次修改路径 + 禁止范围；不做全仓 discovery） |
| 4 | start | `/harness.start` |
| 5 | exec | `/harness.exec`（batch；中途不默认每批 eval） |
| 5b | eval | `/harness.eval.light`（默认全批次单次检查；有 `custom_evaluator` 时含 deferred 清账） |
| 6 | checkpoint | `/harness.checkpoint.light`（自动汇总已执行 Sprint 证据；八维满分 100；无主审前置备证） |
| 7 | metrics | `/harness.metrics.light` → `sprint-{N}-light.json`（仅运行状态，无五维/趋势） |
| 8 | archive | `/opsx:archive <change_name>` |

画像台账：`.harness/metrics/<feature>/sdd-light-profile-usage.jsonl`。

### `/sdd.debug` — 工单拉取 → sdd.light

**输入**：`<KEY> --user <USERNAME> --pass <PASSWORD> [补充说明]`

```text
/sdd.debug IPDRR-43803 --user alice --pass secret123
/sdd.debug IPDRR-43803 --user alice --pass secret123 关注失败重试
```

行为概要：

1. Basic Auth 拉取 IPD：`summary` / `description` / `issuelinks`
2. 由 `issuelinks` 推导 OpenSpec `CHANGE`（小写 key），**不由参数传入 change**
3. 整理需求上下文（不含凭据）后执行 `/sdd.light <CHANGE>`，并携带 `summary` / `description`

---

## 手工逐步执行（对照）

不使用编排命令时，可按完整链路逐步调用：

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

其它常用命令：`/harness.e2e` / `/harness.e2e.light`（light 走 `AGENTS.md` → `custom_evaluator` 简易门禁，不强制 evaluator 分级）、`/harness.fix`、`/harness.review`、`/harness.spec-check`。
