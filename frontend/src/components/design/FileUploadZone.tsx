import React, { useRef, useState } from 'react';

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({ 
  onFilesSelected, 
  accept = "image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip", 
  multiple = true 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative w-full border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer flex flex-col items-center justify-center p-8 ${
        isDragging 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' 
          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
      }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        multiple={multiple}
        className="hidden"
      />
      
      <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-full mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>
      
      <p className="text-zinc-900 dark:text-zinc-100 font-semibold mb-1">Click or drag to upload</p>
      <p className="text-zinc-500 text-sm">Images, Videos, Audio, or Files (Max 50MB)</p>
    </div>
  );
};

export default FileUploadZone;
