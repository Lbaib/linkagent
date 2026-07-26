---
type: working
updated: 2026-07-26
tags: [工作记忆, 待决]
---

# 待决问题（Open Questions)

## 待决

- [ ] `.agent/skills/`（**单数**）下的 5 个 openspec skill 不在扫描路径上。是否迁移到 `.agents/skills/`？用户曾决定暂时不动。(2026-07-25 / ADR-0005)
- [x] 根 `.gitignore` 已补齐，已跟踪的 `target/` 已从索引移除。(2026-07-26 演示闭环)
- [x] 知识库文档上传入口确认仍在 `ai-rag-service` 的 `AiController`（`POST /api/ai/doc/upload`），`project-map` 已更新。(2026-07-26 演示闭环)
- [ ] 设计类 skills（7 个）与治理 skills 并列在 `.agents/skills/`，存在稀释风险。是否隔离、降权或移出默认加载？巩固时样本不足 3 次操作套路，未铸造处理 skill。(2026-07-26 首次巩固)

## 相关

[[current-focus]] · [[2026-07-26-首次记忆巩固]] · [[memory-map]]
