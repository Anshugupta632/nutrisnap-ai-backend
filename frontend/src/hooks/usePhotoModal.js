import { useState, useEffect, useCallback } from 'react';

export function usePhotoModal() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  }, []);

  const clearPreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
  }, [previewUrl]);

  const handleClose = useCallback((onClose) => {
    clearPreview();
    setError(null);
    onClose();
  }, [clearPreview]);

  return {
    selectedFile,
    previewUrl,
    isLoading,
    error,
    setIsLoading,
    setError,
    handleFileChange,
    clearPreview,
    handleClose,
  };
}