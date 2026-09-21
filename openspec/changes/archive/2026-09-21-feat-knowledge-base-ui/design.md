# Design: 知识库管理可视化页面与切片预览联动

## Context

参见 `proposal.md`。当前后端 `ai-rag-service` 基于 Spring Boot 3 与 PGVector 实现了 `POST /api/ai/doc/upload`、`GET /api/ai/doc/list`、`DELETE /api/ai/doc`。网关 `api-gateway` 已将 `/api/ai/**` 配置路由到 `ai-rag-service`。
前端 `AdminConsole.tsx` 目前依赖 `useSimulation()` 纯前端内存 Mock 状态，未接入真实网关，且缺失切片预览能力。

## Goals / Non-Goals

**Goals:**
- 后端扩展：在 `DocumentChunkRepository` 与 `AiController` 中提供获取指定文档切片详情接口 `GET /api/ai/doc/chunks`。
- 前端实现：在管理控制台中实现真实知识库资产列表、文件拖拽/点击上传（附带加载中及结果提示）、按文档删除（二次确认弹窗）、切片预览弹窗（查看 Chunk 序号与内容）。
- 契约打通：所有网络请求经由 `api-gateway` (`/api/ai/**`) 转发至 `ai-rag-service`。

**Non-Goals:**
- 不修改现有的向量计算模型与分片算法（保持 500 字符切片，100 字符重叠）。
- 不引入第三方对象存储（MinIO/OSS），仍沿用现有的数据库向量切片持久化方案。

## API Contract

### 本次涉及的已有接口

#### 本次无需修改
| # | Method | Path | 来源文件 | 说明 |
|---|---|---|---|---|
| 1 | POST | `/api/ai/doc/upload` | `linkedagent-backend/ai-rag-service/.../AiController.java` | 接收 `file` MultipartFile，自动切片、计算向量并保存至数据库。Agent 严禁重复生成或修改。 |
| 2 | GET | `/api/ai/doc/list` | `linkedagent-backend/ai-rag-service/.../AiController.java` | 查询所有已入库文档名称及切片数量统计（`List<DocumentStat>`）。Agent 严禁重复生成或修改。 |
| 3 | DELETE | `/api/ai/doc` | `linkedagent-backend/ai-rag-service/.../AiController.java` | 根据 Query 参数 `name` 删除对应文档及其关联的所有向量切片。Agent 严禁重复生成或修改。 |

#### 本次需要修改
（无已有接口需要修改行为契约）

### 需要新增的接口

#### 端点清单
| # | Method | Path | 描述 |
|---|---|---|---|
| 1 | GET | `/api/ai/doc/chunks` | 根据文档名称获取该文档的所有切片文本及元数据，用于切片预览。 |

#### 详细契约：GET /api/ai/doc/chunks

- **认证方式**: 无（走内部网关透传）
- **请求参数表**:
  | 参数名 | 位置 | 类型 | 必填 | 说明 |
  |---|---|---|---|---|
  | `name` | Query | String | 是 | 文档名称（例如 `sample.md`） |

- **成功响应示例 (HTTP 200)**:
  ```json
  [
    {
      "id": 101,
      "documentName": "sample.md",
      "content": "切片第一段文本内容...",
      "chunkIndex": 0
    },
    {
      "id": 102,
      "documentName": "sample.md",
      "content": "切片第二段文本内容...",
      "chunkIndex": 1
    }
  ]
  ```

- **错误响应表**:
  | HTTP 状态码 | 错误码 / 响应体 | 触发条件 |
  |---|---|---|
  | 400 | `{"message": "Required parameter 'name' is not present"}` | 缺少必填参数 `name` |
  | 500 | `{"message": "Internal server error"}` | 数据库查询异常 |

## Decisions

1. **切片预览返回格式与字段精简**:
   - 决策：接口返回 DTO 仅包含 `id`, `documentName`, `content`，不返回庞大的 `embedding` 向量数组，以节约网络带宽并提高前端加载速度。
   - 备选方案：直接序列化返回 `DocumentChunk` 实体。被否决，因包含 1536 维 float 向量数组，序列化开销大且前端展示不需要。

2. **前端架构组织**:
   - 决策：将知识库管理组件化抽离为 `KnowledgeBaseManager.tsx`，嵌入到 `AdminConsole.tsx` 的 RAG Tab，同时保留良好可复用性。
   - 备选方案：直接在 `AdminConsole.tsx` 单个大文件内堆砌代码。组件化更利于测试与维护。

3. **网络请求客户端封装**:
   - 决策：在前端创建 `knowledgeService.ts` 集中统一管理知识库相关的 HTTP 请求（`fetchDocuments`, `uploadDocument`, `deleteDocument`, `fetchDocumentChunks`），统一错误处理与 Toast 提示。

## Risks / Trade-offs

- [大文件上传耗时过长] → 增加前端上传中 Loading 态以及 Disable 提交按钮，防止用户重复提交；设置合理的超时时间。
- [重名文档重复上传切片翻倍] → 前端在上传前若发现同名文档给出确认提示，后端支持覆盖逻辑或自然追加。
