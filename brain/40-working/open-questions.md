---
type: working
updated: 2026-07-25
tags: [工作记忆, 待决]
---

# 待决问题（Open Questions)

## 待决

- [ ] `.agent/skills/`（**单数**）下的 5 个 openspec skill 不在任何工具的扫描路径上，实际从未被加载（证据：会话中挂载的 skill 仅有 `.agents/skills/` 下的条目）。是否迁移到 `.agents/skills/`？涉及既有 opsx 工具链约定，需用户确认后再动。(2026-07-25 / ADR-0005)
- [ ] git 工作区中 `target/` 编译产物被跟踪且频繁出现在 diff 中，是否应补充 `.gitignore` 并从索引移除？(2026-07-25)
- [ ] `DocumentController` 在 ai-rag-service 中被删除，知识库文档上传入口是否已迁移到 system-management？需触碰该模块时确认并更新 [[project-map]]。(2026-07-25)

## 已解决（待巩固时清理）

- [x] 记忆库是否需要 Antigravity 专属入口？→ 本期用公共薄 `AGENTS.md` 覆盖 Codex+Antigravity，与 companion 策略一致；需要时再加。(2026-07-25 / ADR-0004)
- [x] 入口双份漂移 / 日常难用 / 代码无反向指针 → v2 加固已处理。(2026-07-25)

## 相关

[[current-focus]] · [[memory-map]]
