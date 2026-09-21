# Sprint 1: 知识库管理可视化页面与切片预览联动

**目标**: 打通前后端知识库管理链路，后端扩展切片查询接口，前端提供文档上传、资产列表展示、切片详情预览弹窗与删除功能。  
**对应Phase**: Phase 1, Phase 2, Phase 3 (全量单次 Sprint)  
**Ticket ID**: `FEAT-KNOWLEDGE-BASE-UI`  
**Feature ID**: `FEAT-KNOWLEDGE-BASE-UI-knowledge-base-management`  

---

## 批次与任务清单

### 批次 1: 后端切片查询接口扩展 (服务/核心批次)
- 批次目标: 在 `ai-rag-service` 中实现切片详情查询端点及轻量 DTO，并编写单元测试验证。
- 门禁类型: 服务/核心批次（编译+单元测试+接口端点验证）

| 任务 ID | Task UID | 描述 | 预估工时 | 并行标记 |
|---|---|---|---|---|
| 1.1 | FEAT-KNOWLEDGE-BASE-UI-knowledge-base-management-1.1 | 在 DocumentChunkRepository 添加 findByDocumentNameOrderByIdAsc，定义 DocumentChunkDto，在 AiController 实现 GET /api/ai/doc/chunks 端点，运行 mvn test-compile 验证 | 1.0h | - |
| 1.2 | FEAT-KNOWLEDGE-BASE-UI-knowledge-base-management-1.2 | 编写 AiController 针对 /api/ai/doc/chunks 的单元测试，验证文档存在及不存在场景 | 0.5h | - |

**批次 1.0 门禁**: L1 Step 4 (`mvn test-compile && mvn test -Dtest=AiControllerTest`) 编译及测试通过。

---

### 批次 2: 前端知识库管理模块实现 (用户界面批次)
- 批次目标: 封装前端 API 客户端，实现文档管理组件（上传区、列表、删除确认、切片预览弹窗）并接入管理控制台。
- 门禁类型: 用户界面批次（类型检查+组件构建+界面可访问）

| 任务 ID | Task UID | 描述 | 预估工时 | 并行标记 |
|---|---|---|---|---|
| 2.1 | FEAT-KNOWLEDGE-BASE-UI-knowledge-base-management-2.1 | 创建 src/services/knowledgeService.ts，封装列表、上传、切片详情与删除的 HTTP 请求与类型定义 | 0.5h | - |
| 2.2 | FEAT-KNOWLEDGE-BASE-UI-knowledge-base-management-2.2 | 创建 src/components/KnowledgeBaseManager.tsx，实现拖拽上传区、资产列表、删除确认对话框与切片预览 Modal | 1.5h | - |
| 2.3 | FEAT-KNOWLEDGE-BASE-UI-knowledge-base-management-2.3 | 更新 AdminConsole.tsx，将 RAG Tab 切换为真实的 KnowledgeBaseManager，运行 npm run build 验证构建 | 0.5h | - |

**批次 2.0 门禁**: L1 Step 4 (`npm run build`) 类型检查与前端生产打包通过。

---

### 批次 3: 全链路联调与契约验证 (集成批次)
- 批次目标: 验证网关透传、文件上传、切片列表、切片内容预览与删除操作的全链路闭环。
- 门禁类型: 集成批次（真实接口调用链验证）

| 任务 ID | Task UID | 描述 | 预估工时 | 并行标记 |
|---|---|---|---|---|
| 3.1 | FEAT-KNOWLEDGE-BASE-UI-knowledge-base-management-3.1 | 验证 Gateway /api/ai/** 路由转发与知识库全链路交互闭环 | 0.5h | - |

**批次 3.0 门禁**: L1 Step 4 全链路接口调用链成功，API Contract 验收无遗漏。

---

## 风险项与应对

- [文件上传网络超时] → 前端设置合理超时与 Loading 禁用提交状态。
- [接口跨域与网关未透传] → 确认 api-gateway globalcors 及路由 predicates 覆盖 `/api/ai/**`。
