import { useState } from 'react';

export interface PendingFile {
  file: File;
  previewUrl: string | null;
}

export function useFileUpload() {
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);

  const addFiles = (files: File[]) => {
    const entries = files.map(file => ({
      file,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    }));
    setPendingFiles(prev => [...prev, ...entries]);
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => {
      const entry = prev[index];
      if (entry?.previewUrl) URL.revokeObjectURL(entry.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const clearPendingFiles = () => {
    setPendingFiles(prev => {
      prev.forEach(e => { if (e.previewUrl) URL.revokeObjectURL(e.previewUrl); });
      return [];
    });
  };

  return { pendingFiles, addFiles, removePendingFile, clearPendingFiles };
}
