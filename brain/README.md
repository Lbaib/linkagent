# brain/ — LinkAgent 架构师伙伴的第二大脑

Git 内嵌 Obsidian Vault。AI 与人类共用；**落盘细则**见 [[memory-map]]，**日常用法**见 [[daily-usage]]。

## 设计要点

- 五层认知记忆 + `_inbox` 两段式捕获 + Dataview 仪表盘。
- 职责分层：根 `AGENTS.md` 是项目总合同；记忆细则在 `00-core/memory-map.md`；Cursor rule 仅做工具入口。
- 唯一项目总合同：根 `AGENTS.md`；代码目录护栏由带 `paths` 的项目私有 Skills 自动加载。
- 决策留痕：ADR；情景只追加；定期 [[memory-consolidation]]。

## 打开方式

1. Obsidian → 打开文件夹 → 选本 `brain/` 目录。
2. 启用社区插件 **Dataview**；核心插件 **模板（Templates）** 已指向 `_templates/`（`templates.json`）。不要求安装 Templater。
3. 从 [[HOME]] 或 `_dashboards/` 开始。

## AI

见仓库根 `AGENTS.md`。Cursor 可用 `/收尾` `/沉淀` `/巩固记忆` `/回顾进度`。

## 相关决策

[[ADR-0003-Git内嵌Obsidian记忆库]] · [[ADR-0004-入口去重与inbox两段式]]
