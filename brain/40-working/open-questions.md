---
type: working
updated: 2026-07-26
tags: [工作记忆, 待决]
---

# 待决问题（Open Questions)

## 待决

- [ ] `.agent/skills/`（**单数**）下的 5 个 openspec skill 不在扫描路径上。是否迁移到 `.agents/skills/`？用户曾决定暂时不动。(2026-07-25 / ADR-0005)
- [ ] 仓库根目录无 `.gitignore`，`target/` 等编译产物仍被跟踪、污染 diff。是否补根 `.gitignore` 并从索引移除已跟踪的 `target/`？(2026-07-25；2026-07-26 巩固确认)
- [ ] `DocumentController` 在 ai-rag-service 中被删除，知识库文档上传入口是否已迁到 system-management？触碰该模块时确认并更新 [[project-map]]。(2026-07-25)
- [ ] 设计类 skills（7 个）与治理 skills 并列在 `.agents/skills/`，存在稀释风险。是否隔离、降权或移出默认加载？巩固时样本不足 3 次操作套路，未铸造处理 skill。(2026-07-26 首次巩固)

## 相关

[[current-focus]] · [[2026-07-26-首次记忆巩固]] · [[memory-map]]
