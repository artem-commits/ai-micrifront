import { useState, useEffect, useCallback } from 'react';
import { Document, DocumentUploadResponse, TaskStatus } from '../types';
import { docsApi } from '../services/api';

interface UseDocumentsReturn {
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  uploadDocument: (file: File, ownerId: number) => Promise<DocumentUploadResponse>;
  getDocuments: (ownerId?: number) => Promise<void>;
  getTaskStatus: (taskId: string) => Promise<TaskStatus>;
  clearError: () => void;
}

export const useDocuments = (): UseDocumentsReturn => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Remove auto-loading since we'll load documents manually in components
  // useEffect(() => {
  //   console.log('useDocuments: Auto-loading documents...');
  //   getDocuments();
  // }, []);

  const uploadDocument = useCallback(async (file: File, ownerId: number): Promise<DocumentUploadResponse> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await docsApi.uploadDocument(file, ownerId);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Ошибка загрузки документа';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDocuments = useCallback(async (ownerId?: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Getting documents with ownerId:', ownerId);
      
      let response;
      if (ownerId) {
        console.log('Calling getDocumentsByOwner with ownerId:', ownerId);
        response = await docsApi.getDocumentsByOwner(ownerId);
      } else {
        console.log('Calling getDocuments without ownerId');
        response = await docsApi.getDocuments();
      }
      
      console.log('Documents response:', response);
      setDocuments(response.documents);
    } catch (err: any) {
      console.error('Get documents error:', err);
      console.error('Error response:', err.response);
      setError(err.response?.data?.detail || 'Ошибка получения документов');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTaskStatus = useCallback(async (taskId: string): Promise<TaskStatus> => {
    try {
      const response = await docsApi.getTaskStatus(taskId);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Ошибка получения статуса задачи';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    documents,
    isLoading,
    error,
    uploadDocument,
    getDocuments,
    getTaskStatus,
    clearError,
  };
}; 