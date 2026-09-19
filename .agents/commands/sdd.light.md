---
name: sdd.light
description: 编排轻量 SDD 交付流水线（propose → plan.light → scope.light → start → exec → eval.light → checkpoint.light → metrics.light → archive），环节间人工确认。
triggers:
  - sdd.light
  - sdd light
  - sdd-light
  - 轻量交付
  - 轻量 SDD
---

# sdd.light — 轻量 SDD 交付编排

**输入**: `$ARGUMENTS` — `<change_name> [需求描述…]`  
可选凭据（无需求描述、需拉 IPD 附件时必填）：可附加 `--user <USERNAME> --pass <PASSWORD>`

示例：
- `dpahcm-1416 支持某某域名鉴权`
- `dpahcm-1416 --user alice --pass secret123`（无正文时从 IPD 附件读需求）

读取并严格执行 **sdd.light** skill。

开跑前若项目根存在 `full_rule.md`：按其规则判断本 change 是否应走 `sdd.full`；命中则**立即中断**，强制用户改用 `/sdd.full`（见 skill · Preflight）。

相对 `sdd.full`：Harness 环节优先走 **light** 命令（`plan.light` / `scope.light` / `eval.light` / `checkpoint.light` / `metrics.light`）；无 light 变体的 `start` / `exec` 仍用完整版。

不要跳过人工确认门禁；密码仅用于本次 API 调用，禁止回显或写入仓库。
