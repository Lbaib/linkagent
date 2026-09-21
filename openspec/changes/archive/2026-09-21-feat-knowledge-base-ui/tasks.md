# Tasks: 知识库管理可视化页面与切片预览联动

## 1. 后端切片查询接口扩展 (ai-rag-service)

- [x] 1.1 在 `DocumentChunkRepository` 中添加 `findByDocumentNameOrderByIdAsc` 查询方法，定义切片轻量 DTO `DocumentChunkDto`，并在 `AiController` 中实现 `GET /api/ai/doc/chunks?name={name}` 接口，运行 `mvn test-compile` 验证编译通过。
- [x] 1.2 为 `GET /api/ai/doc/chunks` 编写单元测试 `AiControllerTest`，验证当文档存在及不存在时的切片返回行为并运行测试通过。

## 2. 前端知识库管理模块实现 (linkedagent-frontend)

- [x] 2.1 创建 `src/services/knowledgeService.ts`，封装 `listDocuments`、`uploadDocument`、`deleteDocument` 与 `getDocumentChunks` 的 API 请求方法与 TypeScript 类型定义，验证无类型报错。
- [x] 2.2 创建 `src/components/KnowledgeBaseManager.tsx`，实现文件拖拽与点击上传区域、知识库资产列表（显示名称与切片总数）、删除二次确认对话框，以及切片详情预览 Modal（分页/滚动查看 Chunk 内容），验证交互与渲染逻辑。
- [x] 2.3 更新 `AdminConsole.tsx`，将 RAG 知识库管理 Tab 切换为真实的 `KnowledgeBaseManager` 组件，移除对 `useSimulation` 的模拟数据依赖，运行 `npm run build` 验证前端无构建错误。

## 3. 全链路联调与契约验证

- [x] 3.1 验证 Gateway `/api/ai/**` 路由转发与知识库全链路，包含文件上传、列表刷新、切片预览弹窗与删除文档的完整交互闭环。
