import React, { useState } from 'react';
import FileUploadZone from '../design/FileUploadZone';

interface MediaUploaderProps {
  onUploadComplete: (attachments: { type: string; url: string }[]) => void;
  onCancel: () => void;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({ onUploadComplete, onCancel }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async () => {
    setIsUploading(true);
    const uploadedAttachments: { type: string; url: string }[] = [];

    try {
      for (const file of files) {
        const formData = new FormData();
        let endpoint = 'file';
        if (file.type.startsWith('image/')) endpoint = 'image';
        else if (file.type.startsWith('video/')) endpoint = 'video';
        else if (file.type.startsWith('audio/')) endpoint = 'audio';

        formData.append(endpoint, file);

        const response = await fetch(`http://localhost:3333/api/upload/${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: formData,
        });

        const result = await response.json();
        if (result.success) {
          uploadedAttachments.push(result.data);
        }
        setProgress((prev) => prev + (100 / files.length));
      }

      onUploadComplete(uploadedAttachments);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-zinc-900 dark:text-white">Upload Media</h3>
        <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {files.length === 0 ? (
        <FileUploadZone onFilesSelected={setFiles} />
      ) : (
        <div className="space-y-4">
          <div className="max-h-60 overflow-y-auto space-y-2">
            {files.map((file, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                <div className="flex items-center space-x-3 truncate">
                  <div className="bg-zinc-200 dark:bg-zinc-700 p-2 rounded-lg">
                    <svg className="h-5 w-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{file.name}</p>
                    <p className="text-[10px] text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button 
                  onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                  className="text-red-400 hover:text-red-600"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {isUploading && (
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 mt-4 overflow-hidden">
              <div 
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={() => setFiles([])}
              className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl"
            >
              Clear
            </button>
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-[2] px-4 py-2 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Upload & Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaUploader;
