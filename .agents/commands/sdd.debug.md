---
name: sdd.debug
description: 拉取 IPD 工单信息并调用 /sdd.light，携带 summary / description 进入轻量交付。
triggers:
  - sdd.debug
  - sdd debug
  - sdd-debug
  - 拉取工单
  - 工单探索
---

# sdd.debug — IPD 工单 → sdd.light

**输入**: `$ARGUMENTS` — `<KEY> --user <USERNAME> --pass <PASSWORD> [补充说明]`

示例：
- `IPDRR-43803 --user alice --pass secret123`
- `IPDRR-43803 --user alice --pass secret123 关注计费失败重试`

读取并严格执行 **sdd.debug** skill：

1. 用 `--user` / `--pass` 的 Basic Auth 调用 IPD REST，拉取
   `summary` / `description` / `issuelinks`
2. 由 `issuelinks` 关联单号推导 `CHANGE`（小写 key）；不通过参数传递 change
3. 整理需求上下文（不含用户名/密码）
4. 调用 `/sdd.light <CHANGE>`（sdd-light skill），并携带入 `summary`、`description`
   （及可选补充说明）作为需求描述

密码仅用于本次 API 调用，禁止回显或写入仓库。
