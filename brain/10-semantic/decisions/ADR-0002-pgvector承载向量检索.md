---
type: adr
id: ADR-0002
created: 2026-07-25
status: accepted
tags: [语义记忆, 决策, rag, 存储]
---

# ADR-0002：用 PostgreSQL + pgvector 承载知识库向量检索

## 状态

accepted（追溯补录）

## 背景

RAG 流程需要对知识库文档切片做向量存储与 KNN 相似度检索。备选：独立向量数据库（Milvus / Qdrant / Pinecone）vs 在既有 PostgreSQL 上启用 pgvector 扩展。

## 决策

使用 **PostgreSQL + pgvector**：业务结构化数据与知识向量同库存储，文档切片统一映射为标准化维度向量（1536 维，对齐 OpenAI embedding），在同一库内做 KNN 召回。

## 理由

- 当前规模下 pgvector 性能足够，且省掉一整套独立向量库的部署、备份、监控运维。
- 向量与原文/元数据同库，联表过滤（如按知识库分类召回）简单。

## 后果

- ✅ 运维复杂度大幅降低，事务一致性天然保证。
- ⚠️ 若未来知识库规模达到千万级向量，需重新评估（索引构建与召回延迟），届时以新 ADR 取代本决策。

## 相关

[[system-overview]] · `linkedagent-backend/ai-rag-service/`
