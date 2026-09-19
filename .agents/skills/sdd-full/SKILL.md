---
name: sdd.full
description: >-
  编排完整 SDD 交付流水线：解析需求（正文或 IPD 附件）后依次执行
  opsx propose → harness.plan → harness.scope → harness.start → harness.exec(batch)
  → harness.checkpoint → harness.metrics → opsx archive。
  每个环节结束后必须等人确认再进入下一步；不确认则按用户修改意见回退重做。
  Use when the user runs sdd.full / sdd-full / 全流程交付, or asks to run the full
  OpenSpec+Harness pipeline for an IPD change.
triggers:
  - sdd.full
  - sdd full
  - sdd-full
  - 全流程交付
  - 完整 SDD
---

# sdd.full — 完整 SDD 交付编排

按固定顺序编排 OpenSpec + Harness 全链路交付。**每个环节结束后必须等待人为确认**，
确认后才进入下一环节；若不确认，根据用户给出的修改描述回退并重做，再重新进入确认。

`change_name` 必须是**小写** IPD 单号（如 `dpahcm-1416`）；大写查询 IPD 时用同一单号转大写。

## 输入

从 `$ARGUMENTS` 解析：

| 参数 | 必填 | 说明 |
|------|------|------|
| `change_name` | 是 | 小写 IPD 单号，如 `dpahcm-1416` |
| `需求描述` | 否 | `change_name` 之后的自由文本；有则直接作为 propose 需求输入 |
| `--user` / `--pass` | 条件必填 | 无需求描述、需拉 IPD 附件时必填 Basic Auth |

示例：

```
/sdd.full dpahcm-1416 支持 PCDN 域名鉴权并回写属性
/sdd.full dpahcm-1416 --user alice --pass secret123
```

规则：
- `change_name` 统一存小写；调用 IPD REST 时用 `KEY = change_name.upper()`
- 密码仅用于本次 API，**禁止**写入仓库、skill、产物或回显
- 缺 `change_name` 时向用户索取，不要猜测

## Step 0 · 解析需求

### 0.1 有 `<需求描述>`

直接使用该文本作为后续 `/opsx:propose` 的需求输入，进入编排。

### 0.2 无 `<需求描述>` → 从 IPD 附件读取

缺凭据时先向用户索取 `USERNAME` / `PASSWORD`，再拉附件。

1. 列出附件：

```bash
curl -sS -u "<USERNAME>:<PASSWORD>" \
  -A "zhima-toolkit" \
  -H "Accept: application/json" \
  "https://ipd.asiainfo-sec.com:8443/rest/api/2/issue/${KEY}?fields=attachment"
```

或执行本 skill 目录下脚本：

```bash
bash scripts/fetch-attachments.sh "<KEY>" "<USERNAME>" "<PASSWORD>"
```

2. 对每个附件（优先可读文档：`.md` / `.txt` / `.doc` / `.docx` / `.pdf` / `.xlsx` 等），再 GET content URL：

```text
GET https://ipd.asiainfo-sec.com:8443/secure/attachment/{id}/{filename}
```

（亦可用附件 JSON 中的 `content` 字段 URL；同样带 Basic Auth。）

3. 将附件文本整理为「需求描述」摘要，向用户展示；用户认可后再进入编排。
4. 无附件或全部无法解析 → 停止，请用户补充 `<需求描述>` 或检查权限。

HTTP 401/403/404/网络错误 → 报告并停止，不进入 propose。

## 编排流水线（严格顺序）

| 序号 | 环节 | 执行内容 |
|------|------|----------|
| 1 | propose | 执行 `/opsx:propose <change_name>`（openspec-propose skill），以 Step 0 需求为输入 |
| 2 | plan | 执行 `/harness.plan`（harness-plan skill），绑定本 change |
| 3 | scope | 执行 `/harness.scope`（harness-scope skill） |
| 4 | start | 执行 `/harness.start`（harness-start skill） |
| 5 | exec | 执行 `/harness.exec`（harness-exec skill），按 **batch** 推进；可多次，直到本 Sprint 全部 batch / 门禁完成 |
| 5b | custom-eval | （可选）若 `AGENTS.md` 配置了 `custom_evaluator`：执行 `/harness.eval custom-deferred`（harness-eval skill），清账延期补充门禁；**须在 checkpoint 之前完成** |
| 6 | checkpoint | 执行 `/harness.checkpoint`（harness-checkpoint skill） |
| 7 | metrics | 执行 `/harness.metrics`（harness-metrics skill） |
| 8 | archive | 执行 `/opsx:archive <change_name>`（openspec-archive-change skill） |

每个环节按对应 **命令名 / skill name** 解析并执行（当前工具为 Qoder，不必再写 `.qoder/skills/...` 绝对路径）。本编排只负责顺序、确认门禁、**项目画像使用统计**与 **Skill Token 消耗台账**。

未配置 `custom_evaluator` 时跳过 5b，确认门禁序号按实际执行环节计数。

## 项目画像使用统计（强制）

**`AGENTS.md` 不是项目画像本身。** 项目根 `AGENTS.md` 配置：
1. **项目画像存放目录**（及入口说明）；真正的画像内容在该目录下的文件中
2. 可选 **`custom_evaluator`**：自定义补充门禁文件路径（相对项目根，如 `evaluator.md`）；与 `.harness/prompts/evaluator.md` 同步骤读取，但仅作补充。非安全项不打断 exec，在环节 5b / checkpoint 前统一检查（见 `.harness/prompts/evaluator.md` § 自定义补充门禁）

解析顺序（画像）：
1. 读取项目根 `AGENTS.md`，解析其中声明的画像目录（如 `docs/project-profile/`、`.cursor/…` 等，以文件内实际配置为准）
2. 本环节实际咨询的是该目录下的画像文件（章节、路径索引、规则提示等）
3. 台账记录「是否读了画像目录中的内容」，而不是「是否打开过 AGENTS.md」——仅打开 `AGENTS.md` 解析目录、未读画像文件 → `consulted: false`

### 台账路径与 `feature` 命名

`<feature>` **必须**通过 `harness-openspec` skill 推导（`feature = <ticket_id>-<openspec_feature>`；多 `openspec_feature` 时用其复合名规则），**禁止**手写猜测或只用 `change_name` 代替。

时机：
1. **propose 完成后**（change / `specs/` 已落盘）立即按 `harness-openspec` 解析并固定本流水线 `feature`
2. 若回退重做 propose 导致 specs 子目录变化 → **重新推导**；后续台账与 metrics 写入新 `feature` 路径（旧路径文件可保留不删）
3. propose 之前若尚无 change：可暂缓创建 metrics 目录；propose 环节的台账行在该环节结束、已能推导 `feature` 后再写入

从 `AGENTS.md` 解析出 `profileDir` 后，写入：

```text
.harness/metrics/<feature>/sdd-full-profile-usage.jsonl
```

（目录不存在则创建。每环节 **一行 JSON**，追加写入；同一环节因回退重做时追加新行，并设 `"attempt": <n>`。）

### 每环节结束后必须记录

在进入人工确认门禁**之前**，为刚完成的环节追加一条记录：

```json
{
  "change": "<change_name>",
  "feature": "<feature>",
  "pipeline": "sdd.full",
  "step": "propose|plan|scope|start|exec|custom-eval|checkpoint|metrics|archive",
  "stepIndex": 1,
  "attempt": 1,
  "timestamp": "<ISO8601>",
  "clarifyCount": 0,
  "agentsMdPath": "AGENTS.md",
  "agentsMdExists": true,
  "profileDir": "<从 AGENTS.md 解析出的画像目录>",
  "profileDirResolved": true,
  "consulted": true,
  "profileFilesUsed": ["<profileDir>/xxx.md", "..."],
  "sectionsUsed": ["焦点模块", "出范围", "..."],
  "pathsReferenced": ["src/aaa/...", "conf/..."],
  "rulesOrHintsApplied": ["不得硬编码密钥", "..."],
  "howUsed": "读了画像目录中哪些文件/段落、据此做了什么决策（一句）",
  "missedOrGaps": ["画像目录缺失某模块说明", "..."]
}
```

统计规则：
1. **开跑前**读 `AGENTS.md`：不存在 → `agentsMdExists: false`、`profileDirResolved: false`、`consulted: false`，`missedOrGaps` 写「项目根无 AGENTS.md，无法解析画像目录」
2. `AGENTS.md` 存在但解析不出画像目录 → `profileDirResolved: false`、`consulted: false`，记缺口
3. 本环节实际读过 / 引用过 **`profileDir` 下画像文件** → `consulted: true`，填写 `profileFilesUsed` / `sectionsUsed` / `pathsReferenced` / `rulesOrHintsApplied`
4. 仅解析了目录、未使用画像内容 → `consulted: false`，`howUsed` 说明原因；**不得编造**
5. `exec` 多 batch 时：整个 exec 结束写 **一条汇总**（合并本环节用过的画像文件），不必每 batch 一行
6. `metrics` 环节自身也记一条；再在 `sprint-{N}.json` 中**汇总**台账（见下）
7. 确认摘要增加：`画像使用: consulted=yes/no · files=N · sections=M · clarifications=K · profileDir=<path>`
8. **`clarifyCount`（强制）**：记录**当前环节 / 当前 skill 本次执行**中，人为澄清并提出修改的次数（非负整数，不得编造）

### `clarifyCount` 计数规则

在本环节 skill **开始执行时**将计数置 `0`，直至写入本条台账前按下列事件累加：

| 计入 +1 的事件 | 说明 |
|----------------|------|
| 执行中途澄清修改 | Agent 就本环节产物/决策向用户澄清后，用户给出修改意见并据此改动 |
| 确认门禁不通过 | 用户未确认，并描述需修改内容 → 回退重做（每次提出修改计 1；同一段修改说明不拆多计） |

不计：
- 用户直接「确认 / 继续 / ok」且无修改说明
- 纯信息问答、未导致对本环节产物的修改
- 编排器自身的失败重试（非用户提出的修改）

同一环节因回退产生新 `attempt` 时：该 attempt 的 `clarifyCount` **从本轮重做起重新累计**，不叠加历史 attempt。`attempt` 反映重做轮次；`clarifyCount` 反映该轮内澄清修改次数。

### metrics 环节的汇总义务

执行 `/harness.metrics` 时，除五维指标外，必须：
1. 读取 `.harness/metrics/<feature>/sdd-full-profile-usage.jsonl`
2. 将画像汇总写入 `.harness/metrics/<feature>/sprint-{N}.json` 的 `projectProfileUsage`（**不含** `clarifyCount`）。对象**只允许**下列字段，格式固定：

```json
"projectProfileUsage": {
  "profileDir": "/path/to/",
  "stepsConsulted": ["propose", "exec"],
  "stepsNotConsulted": ["plan", "scope", "start", "eval", "checkpoint", "metrics", "archive"],
  "profileFilesUsed": [
    "context/overview.md",
    "specs/structure/project-structure.md",
    "specs/data/data-model.md"
  ],
  "keySections": [
    "aaa",
    "bbb"
  ]
}
```

字段与汇总规则：

| 字段 | 类型 | 规则 |
|------|------|------|
| `profileDir` | string | 从 `AGENTS.md` / 台账解析出的画像目录；建议写解析后的目录路径（绝对路径或相对项目根）。解析失败写 `""` |
| `stepsConsulted` | string[] | jsonl 中 `consulted: true` 的环节名去重。同一 `step` 多 `attempt` 时，**任一轮** `consulted: true` 即计入 |
| `stepsNotConsulted` | string[] | 本流水线全量环节清单 **减去** `stepsConsulted`（含尚未执行的后续环节）。顺序与全量清单一致 |
| `profileFilesUsed` | string[] | 各行 `profileFilesUsed` 去重合并；写成**相对 `profileDir`** 的路径（去掉目录前缀），不要再拼绝对路径 |
| `keySections` | string[] | 各行 `sectionsUsed` 去重合并（实际用过的关键章节/标题）；无则 `[]` |

full 全量环节清单（写入 `stepsConsulted` / `stepsNotConsulted` 时用这些名字，**不要**写 jsonl 里的 `custom-eval`）：

`propose`, `plan`, `scope`, `start`, `exec`, `eval`, `checkpoint`, `metrics`, `archive`

- jsonl `step: "custom-eval"` → 汇总时写成 `eval`
- 未配置 `custom_evaluator`、未跑 5b 时，`eval` 仍留在 `stepsNotConsulted`
- **禁止**把 `clarifyCount` 放进 `projectProfileUsage`（澄清次数只写报告顶层）

3. 将各行 `clarifyCount` **求和**写入同一报告顶层字段 `clarifyCount`
4. 读取 `.harness/metrics/<feature>/sdd-full-skill-tokens.jsonl`，汇总写入报告 顶层 `inputTokens` / `outputTokens` / `tokens` 与 `tokenUsage`（**不要**写 `skillTokenUsage`；见「Skill Token 消耗台账」）
5. 终端摘要展示：画像目录、咨询率、各环节 consulted / 用过的画像文件、顶层 `clarifyCount`、缺口、顶层 `inputTokens` / `outputTokens` / `tokens` 与 `tokenUsage`

若 profile jsonl 缺失 → `projectProfileUsage` 写明缺口（可加 `"missingLedger": true`），`stepsConsulted` / `profileFilesUsed` / `keySections` 用 `[]`，`stepsNotConsulted` 填 full 全量清单；顶层 `clarifyCount: null`，并加入 `dataGaps`，不得伪造分步数据。
若 token jsonl 缺失 → `inputTokens` / `outputTokens` / `tokens` 为 `null`、`tokenUsage: []`，并加入 `dataGaps`，不得伪造 token。

## Skill Token 消耗台账（强制）

与画像台账并列：对流水线**每个环节**执行的 skill 计算 token 消耗，写入 metrics 目录中间文件；**metrics 环节**再汇总进 `sprint-{N}.json`。

在 `sdd.full` 编排内，token 台账以 metrics 目录中间文件与 metrics 产出为准。

### 中间文件路径

与画像共用同一 `feature`（harness-openspec 推导）：

```text
.harness/metrics/<feature>/sdd-full-skill-tokens.jsonl
```

（目录不存在则创建。每环节 **一行 JSON** 追加；同一环节回退重做追加新行并设 `"attempt": <n>`。）

### 每环节结束后必须记录

在写入画像台账的**同一时机**（进入人工确认前），追加一条 token 记录：

```json
{
  "change": "<change_name>",
  "feature": "<feature>",
  "pipeline": "sdd.full",
  "step": "propose|plan|scope|start|exec|custom-eval|checkpoint|metrics|archive",
  "stepIndex": 1,
  "attempt": 1,
  "timestamp": "<ISO8601>",
  "skill": "<本环节实际执行的 skill / 命令名>",
  "modelName": "<本环节实际使用的模型名>",
  "inputTokens": 0,
  "outputTokens": 0,
  "totalTokens": 0,
  "estimation": "approx|reported",
  "notes": "估算依据或官方用量来源（一句，可选）"
}
```

计数规则：
1. **必填** `modelName`（本环节实际使用的模型；不得留空；若同一步切换了多个模型，按模型各写一行，或拆分对应 token）
2. **必填** `inputTokens` / `outputTokens` / `totalTokens`（非负整数；`totalTokens = inputTokens + outputTokens`，若平台只给总量则拆分未知侧填 `0` 并在 `notes` 说明）
3. 有平台/会话**真实用量** → `estimation: "reported"`；否则诚实粗估 → `estimation: "approx"`，**不得编造精确到个位却无依据的数**
4. `exec` 多 batch：整段 exec **一行**（同模型），token 为各 batch（及本环节内 fix）合计；多模型则按模型分行
5. `metrics` 环节自身也记一行（含读台账与写 `sprint-{N}.json` 的消耗）
6. 确认摘要增加：`Token: model=<modelName> · in=<n> · out=<m> · total=<t> · est=<approx|reported> · 已写入 sdd-full-skill-tokens.jsonl`

### metrics 汇总字段（顶层 `inputTokens` / `outputTokens` / `tokens` / `tokenUsage`）

写入 `.harness/metrics/<feature>/sprint-{N}.json` 顶层（**不要**包在 `skillTokenUsage` 内）：

```json
"inputTokens": 3500,
"outputTokens": 35000,
"tokens": 38500,
"tokenUsage": [
  {
    "inputTokens": 2500,
    "outputTokens": 10000,
    "modelName": "deepseek-v4-flash"
  },
  {
    "inputTokens": 1000,
    "outputTokens": 25000,
    "modelName": "deepseek-v4-pro"
  }
]
```

汇总规则：
- **不要**写 `skillTokenUsage`；明细仍保留在 jsonl 台账
- `inputTokens` / `outputTokens`：对各行对应字段 **求和**
- `tokens`：`inputTokens + outputTokens`
- `tokenUsage`：按 jsonl **全部行**的 `modelName` **分组求和** `inputTokens` / `outputTokens`（含同 step 多 attempt）；每个模型一条
- 终端摘要须含：`in=<inputTokens> · out=<outputTokens> · tokens=<tokens> · models=<tokenUsage 条数>`

### exec 环节说明

- 使用完整版 `/harness.exec`（非 light），按批次执行
- 一批结束后若仍有未完成 batch → 继续下一 batch，**不必**在每批之间走全链路确认门禁
- 全部 batch 跑完（或无法继续）→ 将该「exec」环节视为完成，进入人工确认
- 中途 FAIL 且用户要求修正 → 可在本环节内走 `/harness.fix` 后继续 batch；仍算同一 exec 环节
- **自定义补充门禁**：exec 中仅主门禁可打断；非安全补充记 deferred。确认进入下一环节前若已配置 `custom_evaluator`，先跑环节 5b（`/harness.eval custom-deferred`），再进 checkpoint

## 人工确认门禁（强制）

**每个环节成功结束后，必须停住**，向用户展示该环节产物摘要，并请求确认。**禁止**自动进入下一环节。

展示模板：

```text
✅ 环节 <N>/<总> 已完成: <环节名>

产物摘要:
- ...

画像使用: consulted=<yes|no> · files=<n> · sections=<m> · clarifications=<k> · profileDir=<path> · feature=<feature> · 已写入 sdd-full-profile-usage.jsonl
Token: model=<modelName> · in=<n> · out=<m> · total=<t> · est=<approx|reported> · 已写入 sdd-full-skill-tokens.jsonl

请确认：
- 回复「确认」/「继续」/「ok」→ 进入下一环节 <下一环节名>
- 若不满意：直接描述需要修改的内容 → 回退重做本环节（或按你的说明回到上一环节），改完后再请你确认（本环节 `clarifyCount` +1）
```

### 确认规则

| 用户意图 | 行为 |
|----------|------|
| 明确确认（确认 / 继续 / ok / 同意 等） | 进入下一环节 |
| 不确认 + 修改说明 | **不进入下一环节**；`clarifyCount` +1；按说明回到**当前刚完成环节**（或用户点名的上一环节）重新执行/修改；改完后再次展示摘要并请求确认 |
| 模糊 | 追问是确认还是要改什么，不要擅自前进 |

回退时：
- 只重做被回退的环节及其直接依赖产物，不要无故重跑更早已确认环节
- 若用户明确要求从更早环节重来，从其指定环节起重新编排，其后环节的确认状态作废
- 重做结束后写入台账新行时带上本轮累计的 `clarifyCount` 与递增的 `attempt`；token 台账同步追加该 attempt 行

全部环节均确认完成后，输出全流程完成摘要（change、sprint、checkpoint 结论、metrics 路径、archive 状态、各环节澄清修改次数合计、**token 总消耗**）。

## 失败与中断

- 某环节执行失败（非用户主观不满意）→ 报告失败原因与建议（如 `/harness.fix`）；**仍须**等用户确认：重试本环节 / 回退 / 中止流水线
- 用户说「中止」「停止」→ 结束编排，保留已完成产物，报告停在哪一环节
- 不要在未确认时偷偷跑后续 harness/opsx 命令

## 输出（整条流水线结束时）

1. `change_name`、`feature`（来自 harness-openspec）与需求来源（正文 / IPD 附件列表）
2. 各环节确认记录（通过 / 回退次数 / 各步 `clarifyCount`）
3. 项目画像使用汇总（咨询率、缺口；指向 `sdd-full-profile-usage.jsonl` 与 metrics 中的 `projectProfileUsage`）
4. 澄清修改次数合计（报告顶层 `clarifyCount`）
5. Skill Token 汇总（指向 `sdd-full-skill-tokens.jsonl` 与 `sprint-{N}.json` 顶层 `inputTokens` / `outputTokens` / `tokens` / `tokenUsage`）
6. 关键产物路径：OpenSpec change、sprint plan/progress、scope、checkpoint、`.harness/metrics/<feature>/…`、archive
7. 若中途中止：停在哪一环节、待办建议

## 示例

```
/sdd.full dpahcm-1416 支持 PCDN 域名鉴权
/sdd.full dpahcm-1416 --user alice --pass '***'
```
