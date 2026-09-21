# Specification: knowledge-base-management

## Purpose

提供知识库资产的全面管理能力，包括知识库文档列表展示、文档分片详情查看、常见格式文档上传解析入库以及陈旧文档与向量切片的级联删除。

## Requirements

### Requirement: Document List and Statistics Query
系统 SHALL 提供查询所有已入库知识库文档及其分片数量汇总的能力，供前端以表格或卡片形式展示。

#### Scenario: Query document statistics successfully
- **WHEN** 客户端向 `/api/ai/doc/list` 发起 GET 请求
- **THEN** 系统返回 HTTP 200 及所有文档列表，每项包含 `documentName` 和 `chunkCount`

### Requirement: Document File Upload and Embedding
系统 SHALL 支持用户上传文档文件（包括 `.txt`、`.md`、`.pdf`），自动进行文本切片提取并计算向量写入持久化库中。

#### Scenario: Successful document upload and chunking
- **WHEN** 客户端向 `/api/ai/doc/upload` 发起包含合法文件的 multipart/form-data POST 请求
- **THEN** 系统返回 HTTP 200 以及处理结果消息，包含分片总数统计

#### Scenario: Upload failed with empty file
- **WHEN** 客户端上传空文件或不支持的内容
- **THEN** 系统返回 HTTP 500 并附带清晰的错误描述信息

### Requirement: Document Chunks Detail Preview
系统 SHALL 提供查询指定文档所有切片详细文本及序号的能力，供用户下钻预览切片分段。

#### Scenario: Query chunks for existing document
- **WHEN** 客户端向 `/api/ai/doc/chunks?name={documentName}` 发起 GET 请求
- **THEN** 系统返回 HTTP 200 及该文档下按顺序排列的切片清单，包含切片 id、content、documentName

#### Scenario: Query chunks for non-existent document
- **WHEN** 客户端查询不存在的文档名称
- **THEN** 系统返回 HTTP 200 及空切片列表

### Requirement: Document Deletion Cascade
系统 SHALL 支持用户按文档名称彻底删除该文档及对应存储在 PGVector 中的全部切片向量数据。

#### Scenario: Delete document successfully
- **WHEN** 客户端向 `/api/ai/doc?name={documentName}` 发起 DELETE 请求
- **THEN** 系统删除关联的切片数据并返回 HTTP 200 及 `{"success": true}`
