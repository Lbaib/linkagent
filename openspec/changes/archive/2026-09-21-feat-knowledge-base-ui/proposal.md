# Proposal: 知识库管理可视化页面与切片预览

## Why

目前后端 `ai-rag-service` 具备完整的文档解析、切片与 PGVector 向量计算能力，但前端管理控制台仅有纯前端内存的 Mock 数据，无法对真实知识库进行管理与联动；同时后端缺少切片详情查询端点，难以直观检查 RAG 分片质量。

本项目需要打通前后端链路，提供可视化的知识库管理、拖拽/点击上传、切片预览与文档删除功能，使运维/客服人员能够直观监控与管理企业知识资产。

## What Changes

1. **后端能力扩展 (`ai-rag-service`)**：
   - 补充 `GET /api/ai/doc/chunks` 端点，支持按文档名称查询切片列表及具体内容，供前端切片预览使用。
2. **前端知识库可视化 (`linkedagent-frontend`)**：
   - 彻底替换 `AdminConsole.tsx` 中的本地内存 Mock 状态，改为与网关真实 API 联动。
   - 实现文件上传功能（支持拖拽/点击上传常见文档，带状态反馈）。
   - 实现知识库资产表格（文档名称、切片总数、上传状态、操作列）。
   - 实现切片详情弹窗/抽屉（下钻查看每个 Chunk 的序号与具体内容）。
   - 实现文档删除与确认机制。

## Capabilities

### New Capabilities
- `knowledge-base-management`: 提供知识库资产列表展示、文档上传入库、分片详情预览及文档删除能力。

### Modified Capabilities
（无已有规格需求变更）

## Impact

- **API 接口**：新增 `GET /api/ai/doc/chunks`（ai-rag-service），复用已有的 `POST /api/ai/doc/upload`、`GET /api/ai/doc/list`、`DELETE /api/ai/doc`。
- **网关路由**：已有网关路由 `/api/ai/**` 原样透传，无需调整。
- **前端模块**：重构 `AdminConsole.tsx`（或抽取为独立的知识库管理组件），移除对 `useSimulation` 的内存 RAG 依赖。
