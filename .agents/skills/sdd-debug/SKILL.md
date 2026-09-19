---
name: sdd.debug
description: >-
  从 IPD REST 按单号拉取工单（summary / description / issuelinks），
  由 issuelinks 推导 OpenSpec change，再调用 /sdd-light，并携带 summary、description
  作为轻量交付的需求输入。
  Use when the user provides an IPD issue key (IPDRR-*, DPSHCT-*, DPAHCM-*, etc.),
  asks to fetch 工单, or run sdd.debug / sdd-debug.
triggers:
  - sdd.debug
  - sdd debug
  - sdd-debug
  - 拉取工单
  - 工单探索
  - IPDRR
---

# sdd.debug — IPD 工单拉取 → sdd.light

从 IPD 标准 REST 拉取工单信息，由 `issuelinks` 推导 `CHANGE` 后，调用 `/sdd.light`
（sdd-light skill），并将 `summary`、`description` 作为需求描述传入，进入轻量 SDD
交付流水线。本 skill **自身不直接改业务代码**；实现由后续 `/sdd.light` 编排完成。

## 输入

从 `$ARGUMENTS` 解析（与 `sdd.full` 一致，凭据用 flag）：

| 参数 | 必填 | 说明 |
|------|------|------|
| `KEY` | 是 | 工单号，如 `IPDRR-43803`（大小写不敏感，统一转大写查询） |
| `--user` / `--pass` | 是 | IPD Basic Auth 用户名 / 密码 |
| 补充说明 | 否 | 去掉 `KEY` 与 `--user`/`--pass` 及其值后的剩余文本，一并带入 light 需求 |

示例：

```
/sdd.debug IPDRR-43803 --user alice --pass secret123
/sdd.debug IPDRR-43803 --user alice --pass secret123 关注计费失败重试
```

`CHANGE` **不由参数传入**：从 REST 字段 `issuelinks` 解析关联单号，转小写后作为
OpenSpec change 名（如 `DPSHCT-2983` → `dpshct-2983`）。

缺 `KEY` 或 `--user`/`--pass` 时向用户索取，不要猜测。密码仅用于本次 API 调用，**禁止**写入仓库、skill 文件、下游上下文或回显到聊天。

## 认证与 API

| 项 | 值 |
|----|-----|
| Base URL | `https://ipd.asiainfo-sec.com:8443` |
| Auth | Basic Auth（`--user` / `--pass`） |
| 查询 | `GET /rest/api/2/issue/{key}?fields=summary,description,issuelinks` |

### 字段映射

| REST 字段 | 含义 |
|-----------|------|
| `summary` | 标题（传入 `/sdd.light`） |
| `description` | 描述（传入 `/sdd.light`） |
| `issuelinks` | 关联工单；取其关联 key 推导 `CHANGE` |

Jira `description` 可能是 ADF（Atlassian Document Format）或纯文本：
提取可读纯文本即可，保留关键段落与列表，不必原样 dump JSON。

### 从 issuelinks 推导 CHANGE

对每个 link，读取 `outwardIssue.key` 或 `inwardIssue.key`：

1. 收集全部关联 key（去重，保持顺序）
2. 若为空 → 报错停止，提示工单无 issuelinks，无法确定 change
3. 若仅一个 → `CHANGE = key.lower()`
4. 若多个 → 默认取第一个为 `CHANGE`，并向用户列出全部关联 key；用户指定时改用指定项

不要臆造 change 名；必须以 issuelinks 结果为准。

## 执行步骤

### 1. 解析参数

1. 取出工单 key（正则大致为 `[A-Za-z][A-Za-z0-9]+-\d+`），转为大写 → `KEY`
2. 解析 `--user <USERNAME>`、`--pass <PASSWORD>`（顺序可任意；也接受 `--user=<v>` / `--pass=<v>`）
3. 去掉 `KEY`、`--user`/`--pass` 及其值后的剩余文本 → `extra_context`
4. 缺 `KEY` 或任一凭据 → 向用户索取后继续，不要猜测

### 2. 拉取工单

优先执行本 skill 目录下脚本（凭据作位置参数传入，勿 export）：

```bash
bash scripts/fetch-issue.sh "<KEY>" "<USERNAME>" "<PASSWORD>"
```

脚本成功时 stdout 为 JSON：`key`、`summary`、`description`、
`linked_keys`、`change`（由 issuelinks 推导）。

若脚本不可用，等价 curl 后自行按上文规则从 `fields.issuelinks` 推导 `CHANGE`：

```bash
curl -sS -u "<USERNAME>:<PASSWORD>" \
  -A "zhima-toolkit" \
  -H "Accept: application/json" \
  "https://ipd.asiainfo-sec.com:8443/rest/api/2/issue/${KEY}?fields=summary,description,issuelinks"
```

失败处理：

- HTTP 401/403 → 凭据或权限问题
- HTTP 404 → 单号不存在或无权限
- 网络/证书错误 → 报告错误，停止，不进入 sdd.light
- `issuelinks` 为空 / 无法得到 `change` → 停止，不进入 sdd.light

### 3. 整理需求上下文

向用户简要展示工单摘要（标题 + 描述要点 + 推导出的 `CHANGE`），然后构造
传给 `/sdd.light` 的需求描述（**不含** `USERNAME` / `PASSWORD`）：

```text
标题: <summary>

## 描述
<description 纯文本>

## 用户补充
<extra_context 或「无」>
```

### 4. 调用 /sdd.light

1. 执行 `/sdd.light`（sdd-light skill）；当前工具为 Qoder，不必再写 `.qoder/skills/...` 路径
2. **固定绑定**由 issuelinks 得到的 `CHANGE`，并将上一步的 `summary`、`description`
   （及可选 `extra_context`）作为需求描述传入，等价于：

   ```text
   /sdd.light <CHANGE>
   标题: <summary>

   ## 描述
   <description 纯文本>

   ## 用户补充
   <extra_context 或「无」>
   ```

3. 因已携带需求正文，`/sdd.light` 走「有需求描述」路径，**不必**再向 light 传递
   `--user` / `--pass`（本 skill 凭据仅用于步骤 2 拉工单）
4. 遵守 sdd-light 护栏：环节间人工确认；若项目根 `full_rule.md` 命中则中断并改用
   `/sdd.full`

## 输出

1. 工单关键字段摘要 + 由 issuelinks 推导的 `CHANGE`
2. 已调用 `/sdd.light <CHANGE>`，并携带 `summary` / `description` 作为需求输入
3. 后续输出与确认门禁由 sdd-light 编排产生

## 示例

```
/sdd.debug IPDRR-43803 --user <USERNAME> --pass <PASSWORD>
/sdd.debug IPDRR-43803 --user <USERNAME> --pass <PASSWORD> 关注计费失败重试路径
```
