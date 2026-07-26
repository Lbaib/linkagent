import { useState, useEffect } from 'react';
import FileUpload from '../../components/ui/FileUpload';
import { uploadDocument, fetchDocuments, deleteDocument } from '../../api/adminApi';
import type { DocumentStat } from '../../api/adminApi';
import { Layers, CheckCircle, AlertCircle, Loader2, Trash2, FileText } from 'lucide-react';

export default function AdminConsole() {
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentStat[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

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
    if (window.confirm('Are you sure you want to delete this document and all its vectorized knowledge?')) {
      try {
        await deleteDocument(documentName);
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8 md:p-12 font-sans selection:bg-blue-200">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-indigo-500/30 mb-6">
            <Layers className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
            Knowledge Base <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Management</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl">
            Upload your PDF or Word documents to automatically train your AI agent. The RAG engine will chunk and vectorize your content for intelligent retrieval.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="col-span-1 lg:col-span-7">
            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
              <h2 className="text-xl font-bold mb-6 text-slate-800">Upload new content</h2>
              
              <FileUpload onFileSelected={handleFileSelected} />

              {/* Status messages */}
              {isUploading && (
                <div className="mt-6 flex items-center p-4 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 animate-in fade-in slide-in-from-bottom-2">
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  <span className="font-medium">Uploading and processing document... This may take a moment.</span>
                </div>
              )}

              {successMessage && !isUploading && (
                <div className="mt-6 flex items-start p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100 animate-in fade-in slide-in-from-bottom-2">
                  <CheckCircle className="w-5 h-5 mr-3 mt-0.5 shrink-0 text-emerald-600" />
                  <div>
                    <h4 className="font-semibold text-emerald-900">Success</h4>
                    <p className="text-emerald-700 mt-1">{successMessage}</p>
                  </div>
                </div>
              )}

              {errorMessage && !isUploading && (
                <div className="mt-6 flex items-start p-4 bg-rose-50 text-rose-800 rounded-2xl border border-rose-100 animate-in fade-in slide-in-from-bottom-2">
                  <AlertCircle className="w-5 h-5 mr-3 mt-0.5 shrink-0 text-rose-600" />
                  <div>
                    <h4 className="font-semibold text-rose-900">Upload Failed</h4>
                    <p className="text-rose-700 mt-1">{errorMessage}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-1 lg:col-span-5">
            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-800">Uploaded Documents</h3>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">{documents.length}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {isLoadingDocs ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">No documents uploaded yet.</div>
                ) : (
                  documents.map((doc) => (
                    <div key={doc.documentName} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shrink-0">
                          <FileText size={20} />
                        </div>
                        <div className="truncate">
                          <p className="font-semibold text-slate-700 text-sm truncate">{doc.documentName}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{doc.chunkCount} chunks vectorized</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDelete(doc.documentName)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                        aria-label="Delete document"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
