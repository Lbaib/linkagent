import { useState, useEffect } from 'react';
import FileUpload from '../../components/ui/FileUpload';
import { uploadDocument, fetchDocuments, deleteDocument, fetchDocumentChunks } from '../../api/adminApi';
import type { DocumentStat, DocumentChunkDto } from '../../api/adminApi';
import { Layers, CheckCircle, AlertCircle, Loader2, Trash2, FileText, Eye, X } from 'lucide-react';

export default function AdminConsole() {
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentStat[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  // Chunk preview states
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<string | null>(null);
  const [previewChunks, setPreviewChunks] = useState<DocumentChunkDto[]>([]);
  const [isLoadingChunks, setIsLoadingChunks] = useState(false);

  const loadDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
    } catch (error: any) {
      console.error('Failed to fetch documents', error);
      setErrorMessage(error.message || 'Failed to load documents');
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleDelete = async (documentName: string) => {
    if (window.confirm('确定要删除此文档及其所有向量切片吗？此操作不可逆。')) {
      try {
        await deleteDocument(documentName);
        if (selectedDocForPreview === documentName) {
          handleClosePreview();
        }
        loadDocuments();
      } catch (error: any) {
        console.error('Failed to delete document', error);
        setErrorMessage(error.message || 'Failed to delete document');
      }
    }
  };

  const handleFileSelected = async (file: File) => {
    setIsUploading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await uploadDocument(file);
      if (response.success) {
        setSuccessMessage(response.message || 'Upload successful');
        loadDocuments();
      } else {
        setErrorMessage(response.message || 'An error occurred during upload.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload document.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenPreview = async (documentName: string) => {
    setSelectedDocForPreview(documentName);
    setIsLoadingChunks(true);
    setErrorMessage(null);
    try {
      const chunks = await fetchDocumentChunks(documentName);
      setPreviewChunks(chunks);
    } catch (err: any) {
      console.error('Failed to load chunks', err);
      setErrorMessage(err.message || 'Failed to load document chunks');
    } finally {
      setIsLoadingChunks(false);
    }
  };

  const handleClosePreview = () => {
    setSelectedDocForPreview(null);
    setPreviewChunks([]);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10 font-sans selection:bg-blue-200">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-indigo-500/30 mb-4">
            <Layers className="text-white w-7 h-7" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
            知识库管理 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Knowledge Base</span>
          </h1>
          <p className="text-sm md:text-base text-slate-600 max-w-2xl">
            上传 Markdown、TXT 或 PDF 文档自动录入企业知识库。系统将完成自动切片、向量计算与持久化存储，赋能 AI 坐席高精度知识检索与应答。
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Upload Section */}
          <div className="col-span-1 lg:col-span-6">
            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col h-full">
              <h2 className="text-lg font-bold mb-4 text-slate-800">上传新文档知识</h2>
              
              <FileUpload onFileSelected={handleFileSelected} />

              {/* Status messages */}
              {isUploading && (
                <div className="mt-5 flex items-center p-4 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 animate-in fade-in slide-in-from-bottom-2">
                  <Loader2 className="w-5 h-5 mr-3 animate-spin shrink-0" />
                  <span className="font-medium text-sm">正在解析文档并计算向量切片，请稍候...</span>
                </div>
              )}

              {successMessage && !isUploading && (
                <div className="mt-5 flex items-start p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100 animate-in fade-in slide-in-from-bottom-2">
                  <CheckCircle className="w-5 h-5 mr-3 mt-0.5 shrink-0 text-emerald-600" />
                  <div>
                    <h4 className="font-semibold text-emerald-900 text-sm">上传成功</h4>
                    <p className="text-emerald-700 text-xs mt-0.5">{successMessage}</p>
                  </div>
                </div>
              )}

              {errorMessage && !isUploading && (
                <div className="mt-5 flex items-start p-4 bg-rose-50 text-rose-800 rounded-2xl border border-rose-100 animate-in fade-in slide-in-from-bottom-2">
                  <AlertCircle className="w-5 h-5 mr-3 mt-0.5 shrink-0 text-rose-600" />
                  <div>
                    <h4 className="font-semibold text-rose-900 text-sm">操作失败</h4>
                    <p className="text-rose-700 text-xs mt-0.5">{errorMessage}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Document List Section */}
          <div className="col-span-1 lg:col-span-6">
            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col h-full">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-800">已入库文档资产</h3>
                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  {documents.length} 篇文档
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[500px]">
                {isLoadingDocs ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <Loader2 className="w-7 h-7 animate-spin text-slate-400 mb-2" />
                    <p className="text-sm">正在拉取文档列表...</p>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                    暂未上传任何知识库文档
                  </div>
                ) : (
                  documents.map((doc) => (
                    <div 
                      key={doc.documentName} 
                      className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100/80 transition-colors group"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl shrink-0">
                          <FileText size={18} />
                        </div>
                        <div className="truncate">
                          <p className="font-semibold text-slate-800 text-sm truncate" title={doc.documentName}>
                            {doc.documentName}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {doc.chunkCount} 个切片 (Chunks)
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={() => handleOpenPreview(doc.documentName)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="查看切片详情"
                          aria-label={`Preview chunks for ${doc.documentName}`}
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(doc.documentName)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="删除文档"
                          aria-label={`Delete document ${doc.documentName}`}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chunk Preview Modal */}
        {selectedDocForPreview && (
          <div 
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl shrink-0">
                    <Layers size={20} />
                  </div>
                  <div className="truncate">
                    <h3 className="font-bold text-slate-900 text-base md:text-lg truncate">
                      {selectedDocForPreview}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isLoadingChunks ? '正在加载切片...' : `共 ${previewChunks.length} 个向量切片`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClosePreview}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {isLoadingChunks ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
                    <p className="text-sm font-medium">正在拉取分片明细...</p>
                  </div>
                ) : previewChunks.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                    该文档暂无切片内容
                  </div>
                ) : (
                  previewChunks.map((chunk, idx) => (
                    <div
                      key={chunk.id ?? idx}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-indigo-300 transition-colors space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 font-mono">
                          Chunk #{chunk.chunkIndex !== undefined ? chunk.chunkIndex + 1 : idx + 1}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {chunk.content ? chunk.content.length : 0} 字符
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-mono whitespace-pre-wrap bg-white p-3.5 rounded-xl border border-slate-100">
                        {chunk.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex justify-end">
                <button
                  onClick={handleClosePreview}
                  className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-sm cursor-pointer transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
