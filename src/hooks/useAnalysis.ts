import { useState, useCallback } from 'react';
import { 
  AnalysisStatusResponse, 
  TaskStatusResponse, 
  DocumentAnalysisStatusResponse,
  AnalysisResult 
} from '../types';
import { analysisApi } from '../services/api';

interface UseAnalysisReturn {
  isLoading: boolean;
  error: string | null;
  startAnalysis: (docId: number, language: 'ru' | 'en', retry?: boolean) => Promise<AnalysisStatusResponse>;
  getTaskStatus: (taskId: string) => Promise<TaskStatusResponse>;
  getDocumentAnalysisStatus: (docId: number) => Promise<DocumentAnalysisStatusResponse>;
  getAnalysisResult: (docId: number) => Promise<AnalysisResult>;
  clearError: () => void;
}

export const useAnalysis = (): UseAnalysisReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startAnalysis = useCallback(async (
    docId: number, 
    language: 'ru' | 'en', 
    retry = false
  ): Promise<AnalysisStatusResponse> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await analysisApi.startAnalysis(docId, language, retry);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Ошибка запуска анализа';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTaskStatus = useCallback(async (taskId: string): Promise<TaskStatusResponse> => {
    try {
      const response = await analysisApi.getTaskStatus(taskId);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Ошибка получения статуса задачи';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const getDocumentAnalysisStatus = useCallback(async (docId: number): Promise<DocumentAnalysisStatusResponse> => {
    try {
      const response = await analysisApi.getDocumentAnalysisStatus(docId);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Ошибка получения статуса анализа документа';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const getAnalysisResult = useCallback(async (docId: number): Promise<AnalysisResult> => {
    try {
      const response = await analysisApi.getAnalysisResult(docId);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Ошибка получения результата анализа';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    startAnalysis,
    getTaskStatus,
    getDocumentAnalysisStatus,
    getAnalysisResult,
    clearError,
  };
}; 