---
name: sdd.full
description: 编排完整 SDD 交付流水线（propose → plan → scope → start → exec → checkpoint → metrics → archive），环节间人工确认。
triggers:
  - sdd.full
  - sdd full
  - sdd-full
  - 全流程交付
  - 完整 SDD
---

# sdd.full — 完整 SDD 交付编排

**输入**: `$ARGUMENTS` — `<change_name> [需求描述…]`  
可选凭据（无需求描述、需拉 IPD 附件时必填）：可附加 `--user <USERNAME> --pass <PASSWORD>`

示例：
- `dpahcm-1416 支持某某域名鉴权`
- `dpahcm-1416 --user alice --pass secret123`（无正文时从 IPD 附件读需求）

读取并严格执行 **sdd.full** skill。

每个环节结束后：从项目根 `AGENTS.md` 解析画像存放目录，记录对该目录下**项目画像**的使用情况（`AGENTS.md` 本身不是画像）；在 `/harness.metrics` 环节汇总到度量文件。

不要跳过人工确认门禁；密码仅用于本次 API 调用，禁止回显或写入仓库。
