import React, { useRef, useState } from 'react';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';

interface FileUploadProps {
  onFileSelected: (file: File) => void;
}

export default function FileUpload({ onFileSelected }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      onFileSelected(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      onFileSelected(file);
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center w-full max-w-xl p-8 transition-all duration-300 ease-in-out border-2 border-dashed rounded-3xl cursor-pointer overflow-hidden backdrop-blur-md bg-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] group ${
        dragActive ? 'border-blue-500 scale-[1.02] bg-blue-50/50' : 'border-gray-300 hover:border-blue-400 hover:bg-white/60'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        id="file-upload"
        aria-label="Upload document"
        className="hidden"
        onChange={handleChange}
        accept=".pdf,.doc,.docx,.txt"
      />
      
      {selectedFile ? (
        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
          <div className="relative">
            <div className="p-4 rounded-full bg-blue-100 text-blue-600 mb-4 shadow-sm">
              <FileIcon size={48} className="animate-pulse" />
            </div>
            <button
              onClick={removeFile}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md hover:scale-110"
              aria-label="Remove file"
            >
              <X size={16} />
            </button>
          </div>
          <p className="font-semibold text-gray-800 text-lg truncate max-w-[250px]">{selectedFile.name}</p>
          <p className="text-sm text-gray-500 mt-1">Ready to process</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="p-4 rounded-full bg-gray-50 text-gray-400 group-hover:text-blue-500 group-hover:bg-blue-50 transition-colors duration-300 mb-4">
            <UploadCloud size={48} />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Upload Document
          </h3>
          <p className="text-gray-500 text-center max-w-sm mb-6">
            Drag and drop your PDF or Word document here, or click to browse files.
          </p>
          <span className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium shadow-md shadow-blue-500/30 group-hover:shadow-lg group-hover:shadow-blue-500/40 transition-all duration-300">
            Select File
          </span>
        </div>
      )}
    </div>
  );
}
