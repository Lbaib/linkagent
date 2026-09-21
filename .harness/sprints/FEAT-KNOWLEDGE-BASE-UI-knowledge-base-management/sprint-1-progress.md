# Sprint 1 进度跟踪: 知识库管理可视化页面与切片预览联动

- **Ticket ID**: `FEAT-KNOWLEDGE-BASE-UI`
- **Feature ID**: `FEAT-KNOWLEDGE-BASE-UI-knowledge-base-management`
- **状态**: Checkpoint 审查完成 (PASS, 98/100)

---

## 批次 1: 后端切片查询接口扩展 (服务/核心批次)

- [x] FEAT-KNOWLEDGE-BASE-UI-knowledge-base-management-1.1 1.1 在 DocumentChunkRepository 添加 findByDocumentNameOrderByIdAsc，定义 DocumentChunkDto，在 AiController 实现 GET /api/ai/doc/chunks 端点，运行 mvn test-compile 验证 | L1:✅ L2:✅ |
- [x] FEAT-KNOWLEDGE-BASE-UI-knowledge-base-management-1.2 1.2 编写 AiController 针对 /api/ai/doc/chunks 的单元测试，验证文档存在及不存在场景 | L1:✅(5/5) L2:✅ |
- [x] 🚧 **批次1.0门禁: L1 Step4 (后端 ai-rag-service 编译+单元测试+接口端点验证)** | 结果: ✅ mvn test 5/5 全部通过，AiController 端点与 DTO 契约一致 |

---

## 批次 2: 前端知识库管理模块实现 (用户界面批次)

- [x] FEAT-KNOWLEDGE-BASE-UI-knowledge-base-management-2.1 2.1 创建 src/services/knowledgeService.ts，封装列表、上传、切片详情与删除的 HTTP 请求与类型定义 | L1:✅ L2:✅ |
- [x] FEAT-KNOWLEDGE-BASE-UI-knowledge-base-management-2.2 2.2 创建 src/components/KnowledgeBaseManager.tsx，实现拖拽上传区、资产列表、删除确认对话框与切片预览 Modal | L1:✅(22/22) L2:✅ |
- [x] FEAT-KNOWLEDGE-BASE-UI-knowledge-base-management-2.3 2.3 更新 AdminConsole.tsx，将 RAG Tab 切换为真实的 KnowledgeBaseManager，运行 npm run build 验证构建 | L1:✅(build OK) L2:✅ |
- [x] 🚧 **批次2.0门禁: L1 Step4 (前端类型检查+组件构建+页面可访问)** | 结果: ✅ vitest 22/22 全部通过，tsc -b & vite build 成功输出 bundle |

---

## 批次 3: 全链路联调与契约验证 (集成批次)

- [x] FEAT-KNOWLEDGE-BASE-UI-knowledge-base-management-3.1 3.1 验证 Gateway /api/ai/** 路由转发与知识库全链路交互闭环 | L1:✅ L2:✅ |
- [x] 🚧 **批次3.0门禁: L1 Step4 (网关路由+前端页面+RAG上传切片删除全链路调用链验证)** | 结果: ✅ Gateway /api/ai/** 路由映射匹配，前端知识库与后端 RAG 接口完全闭环 |

---

## 收官质量审查 (Checkpoint)

- [x] 🎯 **Sprint 1 Checkpoint (轻量八维质量审查)** | 结论: ✅ **PASS** (98/100) · 产物: [sprint-1-checkpoint.md](./sprint-1-checkpoint.md) |

