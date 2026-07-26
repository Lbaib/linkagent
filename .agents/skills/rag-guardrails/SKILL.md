---
name: rag-guardrails
description: LinkedAgent 的 AI-RAG 服务护栏检查——大模型防腐层、pgvector 向量检索、Prompt 组装与知识库切片。改动 ai-rag-service 或任何涉及调用大模型、向量检索的代码时使用。
paths:
  - linkedagent-backend/ai-rag-service/**
  - linkedagent-backend/system-management/**
---

# rag-guardrails — RAG 与大模型护栏

## 何时使用

改动大模型调用、Prompt 组装、向量检索、知识库文档解析与切片时。

## 不可违反的架构约束

1. **只有 `ai-rag-service` 能直连外部大模型 API**。其他微服务一律通过它调用，不得自行引入模型 SDK 或写死 API 地址。
2. **必须经过防腐适配器**。新增模型能力时扩展适配器接口，不要让业务逻辑感知具体厂商。换厂商应当只换实现类。
3. **向量维度统一**（当前对齐 1536 维）。改维度会导致既有向量全部失效，属于需要写 ADR 的破坏性变更，见 `brain/10-semantic/decisions/ADR-0002-pgvector承载向量检索.md`。
4. **向量存 PostgreSQL + pgvector**，不引入独立向量数据库——除非以新 ADR 取代 ADR-0002。

## 检查清单

- [ ] 新增的模型调用是否走了防腐层，而不是直接 new 一个 client。
- [ ] API Key 来自配置中心（Nacos）或环境变量，**没有硬编码进代码或提交进仓库**。
- [ ] 对外部模型的调用有超时、熔断降级与限流保护（避免额度超刷与雪崩）。
- [ ] 召回结果为空时有兜底：不要把空上下文硬塞给模型生成幻觉答案，应触发转人工。
- [ ] 流式输出仍以 WebSocket 数据帧下发（不混用 HTTP SSE）。
- [ ] 切片写入维度与检索维度一致。

## 与 system-management 的边界

知识库文档的上传与解析入口可能位于 `system-management`，而向量写入模型由本服务定义。**改文档上传链路前先确认两端的切片与维度约定**——`ai-rag-service` 中原 `DocumentController` 已被移除，入口归属需核对（见 `brain/40-working/open-questions.md`）。

## 相关

`AGENTS.md` · `openspec/specs/ai-chat/spec.md`
