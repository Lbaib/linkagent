import {
  uploadDocument,
  fetchDocuments,
  fetchDocumentChunks,
  deleteDocument,
  type DocumentStat,
  type DocumentChunkDto,
} from '../api/adminApi';

export const knowledgeService = {
  uploadDocument,
  fetchDocuments,
  fetchDocumentChunks,
  deleteDocument,
};

export type { DocumentStat, DocumentChunkDto };
