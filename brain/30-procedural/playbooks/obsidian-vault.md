---
type: playbook
created: 2026-07-26
status: stable
tags: [程序记忆, 手册, Obsidian]
---

# 手册：Obsidian Vault（brain/）约定

## 打开方式

Vault 根 = `brain/`（不是仓库根），避免代码与设计 skills 污染图谱。

## 插件

| 插件 | 类型 | 作用 |
|---|---|---|
| Dataview | 社区 | `_dashboards/` 自动列表 |
| 模板（Templates） | **核心插件** | 模板目录 `_templates/`（`templates.json`） |

不要求安装 Templater；文档若再写 Templater 视为漂移，应改回本手册。

## Git

`brain/.gitignore` 使用**相对 Vault 根**的路径，例如 `.obsidian/workspace.json`，并忽略 `.obsidian/plugins/`（插件二进制不入库）。只提交 `app.json` / `appearance.json` / `core-plugins.json` / `community-plugins.json` / `templates.json` 等配置。

## 相关

[[daily-usage]] · [[memory-map]] · [[HOME]]
