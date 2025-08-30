import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAnalysis } from '../hooks/useAnalysis';
import { useDocuments } from '../hooks/useDocuments';
import { useAuth } from '../hooks/useAuth';
import { 
  AnalysisStatusResponse, 
  TaskStatusResponse, 
  DocumentAnalysisStatusResponse,
  AnalysisResult,
  Document 
} from '../types';
import { 
  Play, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  FileText,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';

// Временное расширение типа Document для upload_time
interface DocumentWithUploadTime extends Document {
  upload_time: string;
}

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AnalysisPage Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Произошла ошибка</h3>
            <p className="mt-1 text-sm text-gray-500">
              {this.state.error?.message || 'Неизвестная ошибка'}
            </p>
            <div className="mt-6">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Перезагрузить страницу
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const AnalysisPage: React.FC = () => {
  const { docId } = useParams<{ docId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { documents, getDocuments } = useDocuments();
  const { 
    startAnalysis, 
    getTaskStatus, 
    getDocumentAnalysisStatus, 
    getAnalysisResult,
    isLoading,
    error 
  } = useAnalysis();

  const [document, setDocument] = useState<DocumentWithUploadTime | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<DocumentAnalysisStatusResponse | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [currentTask, setCurrentTask] = useState<{
    taskId: string;
    status: TaskStatusResponse | null;
    polling: boolean;
  } | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'ru' | 'en'>('ru');
  const [showRetryModal, setShowRetryModal] = useState(false);
  const [retryLanguage, setRetryLanguage] = useState<'ru' | 'en'>('ru');

  // Debug information
  console.log('=== AnalysisPage Debug ===');
  console.log('AnalysisPage - docId:', docId);
  console.log('AnalysisPage - documents:', documents);
  console.log('AnalysisPage - user:', user);
  console.log('AnalysisPage - document state:', document);
  console.log('AnalysisPage - analysisStatus:', analysisStatus);
  console.log('AnalysisPage - analysisResult:', analysisResult);
  console.log('AnalysisPage - currentTask:', currentTask);
  console.log('AnalysisPage - isLoading:', isLoading);
  console.log('AnalysisPage - error:', error);
  console.log('=== End AnalysisPage Debug ===');

  // Load user's documents when user is available
  useEffect(() => {
    if (user?.id) {
      console.log('AnalysisPage: Loading documents for user:', user.id);
      getDocuments(user.id);
    }
  }, [user?.id, getDocuments]);

  useEffect(() => {
    console.log('AnalysisPage useEffect - docId:', docId, 'documents length:', documents.length);
    
    if (docId) {
      const docIdNum = parseInt(docId);
      console.log('Looking for document with id:', docIdNum);
      
      if (documents.length > 0) {
        const doc = documents.find(d => d.id === docIdNum);
        console.log('Found document:', doc);
        
        if (doc) {
          console.log('Setting document and loading analysis status...');
          setDocument({ ...doc, upload_time: (doc as any).upload_time });
          loadAnalysisStatus(doc.id);
        } else {
          console.log('Document not found in documents list, redirecting to /documents');
          console.log('Available document IDs:', documents.map(d => d.id));
          navigate('/documents');
        }
      } else {
        console.log('Documents list is empty, waiting for documents to load...');
        // Don't redirect immediately, wait for documents to load
      }
    } else {
      console.log('No docId provided');
    }
  }, [docId, documents, navigate]);

  const loadAnalysisStatus = async (docId: number) => {
    console.log('Loading analysis status for document:', docId);
    try {
      const status = await getDocumentAnalysisStatus(docId);
      console.log('Analysis status loaded:', status);
      setAnalysisStatus(status);
      
      if (status.analyzed && status.status === 'completed') {
        console.log('Document is analyzed, loading results...');
        loadAnalysisResult(docId);
      }
    } catch (err) {
      console.error('Failed to load analysis status:', err);
    }
  };

  const loadAnalysisResult = async (docId: number) => {
    console.log('Loading analysis result for document:', docId);
    try {
      const result = await getAnalysisResult(docId);
      console.log('Analysis result loaded:', result);
      console.log('Analysis result type:', typeof result);
      console.log('Analysis result structure:', JSON.stringify(result, null, 2));
      
      // Validate result structure
      if (!result) {
        console.error('Analysis result is null or undefined');
        return;
      }
      
      if (!Array.isArray(result.issues)) {
        console.error('Analysis result issues is not an array:', result.issues);
        // Try to handle different response structures
        if (Array.isArray(result)) {
          console.log('Result is an array, treating as issues array');
          setAnalysisResult({
            document_id: docId,
            issues: result,
            summary: undefined,
            language: undefined
          });
          return;
        }
      }
      
      setAnalysisResult(result);
      console.log('Analysis result set successfully');
    } catch (err) {
      console.error('Failed to load analysis result:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
    }
  };

  const handleStartAnalysis = async () => {
    console.log('handleStartAnalysis called with docId:', docId, 'user:', user);
    
    if (!docId || !user) {
      console.error('Cannot start analysis: docId or user is missing');
      return;
    }

    if (!user.id) {
      console.error('Cannot start analysis: user.id is missing');
      return;
    }

    try {
      console.log('Starting analysis for document:', docId, 'language:', selectedLanguage);
      const response: AnalysisStatusResponse = await startAnalysis(
        parseInt(docId), 
        selectedLanguage
      );
      
      console.log('Analysis started successfully:', response);
      
      setCurrentTask({
        taskId: response.task_id,
        status: null,
        polling: true
      });

      // Start polling for task status
      pollTaskStatus(response.task_id);
    } catch (err) {
      console.error('Failed to start analysis:', err);
    }
  };

  const handleRetryAnalysis = async () => {
    console.log('handleRetryAnalysis called with docId:', docId, 'user:', user, 'language:', retryLanguage);
    
    if (!docId || !user) {
      console.error('Cannot retry analysis: docId or user is missing');
      return;
    }

    if (!user.id) {
      console.error('Cannot retry analysis: user.id is missing');
      return;
    }

    try {
      console.log('Starting retry analysis for document:', docId, 'language:', retryLanguage);
      const response: AnalysisStatusResponse = await startAnalysis(
        parseInt(docId), 
        retryLanguage,
        true // retry = true
      );
      
      console.log('Retry analysis started successfully:', response);
      
      setCurrentTask({
        taskId: response.task_id,
        status: null,
        polling: true
      });

      // Clear previous results
      setAnalysisResult(null);
      setAnalysisStatus(null);

      // Start polling for task status
      pollTaskStatus(response.task_id);
      
      // Close modal
      setShowRetryModal(false);
    } catch (err) {
      console.error('Failed to retry analysis:', err);
    }
  };

  const pollTaskStatus = async (taskId: string) => {
    const poll = async () => {
      try {
        const status: TaskStatusResponse = await getTaskStatus(taskId);
        
        setCurrentTask(prev => prev ? {
          ...prev,
          status
        } : null);

        if (status.task_status === 'SUCCESS' || status.task_status === 'FAILURE') {
          setCurrentTask(prev => prev ? {
            ...prev,
            polling: false
          } : null);
          
          // Reload analysis status
          if (docId) {
            await loadAnalysisStatus(parseInt(docId));
          }
          return;
        }
        
        // Continue polling
        setTimeout(poll, 3000);
      } catch (err) {
        console.error('Failed to poll task status:', err);
        setCurrentTask(prev => prev ? {
          ...prev,
          polling: false
        } : null);
      }
    };

    poll();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'not_analyzed':
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Завершен';
      case 'in_progress':
        return 'В процессе';
      case 'not_analyzed':
        return 'Не анализирован';
      default:
        return 'Неизвестно';
    }
  };

  const getTaskStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Ожидает';
      case 'STARTED':
        return 'Выполняется';
      case 'PROGRESS':
        return 'В процессе';
      case 'SUCCESS':
        return 'Завершен';
      case 'FAILURE':
        return 'Ошибка';
      default:
        return 'Неизвестно';
    }
  };

  const calculateEstimatedTime = (numChunks: number): string => {
    // Примерное время: 30 секунд на чанк + 10 секунд на инициализацию
    const totalSeconds = numChunks * 30 + 10;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes > 0) {
      return `${minutes} мин ${seconds} сек`;
    } else {
      return `${seconds} сек`;
    }
  };

  if (!document) {
    console.log('AnalysisPage: Document not loaded yet, showing loading...');
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-sm text-gray-600">Загрузка документа...</p>
        </div>
      </div>
    );
  }

  console.log('AnalysisPage: Rendering with document:', document);

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/documents')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Анализ документа</h1>
            <p className="text-sm text-gray-600">{document.filename}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p className="font-medium">Ошибка анализа:</p>
            <p>{error}</p>
          </div>
        )}

        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-6">
              {/* Document Info */}
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-gray-400" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{document.filename}</h3>
                  <p className="text-sm text-gray-500">
                    Загружен {new Date(document.upload_time).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </p>
                </div>
              </div>

              {/* Analysis Status */}
              {analysisStatus && (
                <div className="flex items-center space-x-3">
                  {getStatusIcon(analysisStatus.status)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Статус анализа: {getStatusText(analysisStatus.status)}
                    </p>
                    {analysisStatus.issues_count > 0 && (
                      <p className="text-sm text-gray-500">
                        Найдено проблем: {analysisStatus.issues_count}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Current Task Status */}
              {currentTask && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex items-center space-x-3">
                    {currentTask.polling ? (
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    ) : (
                      <RefreshCw className="h-5 w-5 text-blue-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Задача анализа: {currentTask.status ? getTaskStatusText(currentTask.status.task_status) : 'Запуск...'}
                      </p>
                      {(document as any).num_chunks && (
                        <p className="text-sm text-blue-700">
                          Примерное время ожидания: {calculateEstimatedTime((document as any).num_chunks)}
                        </p>
                      )}
                      {currentTask.status?.error && (
                        <p className="text-sm text-red-600">{currentTask.status.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Start Analysis */}
              {(!analysisStatus || analysisStatus.status === 'not_analyzed') && !currentTask && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Язык анализа
                    </label>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value as 'ru' | 'en')}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="ru">Русский</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={handleStartAnalysis}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Запустить анализ
                  </button>
                </div>
              )}

              {/* Analysis Results */}
              {analysisResult && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Результаты анализа</h3>
                    <button
                      onClick={() => setShowRetryModal(true)}
                      disabled={isLoading || currentTask?.polling}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading || currentTask?.polling ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Повторить анализ
                    </button>
                  </div>
                  
                  <div className="bg-gray-50 rounded-md p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Найденные проблемы:</h4>
                    {analysisResult.issues && Array.isArray(analysisResult.issues) && analysisResult.issues.length > 0 ? (
                      <ul className="space-y-2">
                        {analysisResult.issues.map((issue, index) => {
                          console.log('Rendering issue:', issue);
                          return (
                            <li key={issue.id || index} className="text-sm text-gray-700 bg-white p-3 rounded border">
                              <div className="flex items-start space-x-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  issue.severity === 'critical' 
                                    ? 'bg-red-100 text-red-800'
                                    : issue.severity === 'warning'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {issue.severity === 'critical' ? 'Критично' : 
                                   issue.severity === 'warning' ? 'Предупреждение' : 'Информация'}
                                </span>
                                <span className="flex-1">{issue.issue || 'Описание проблемы недоступно'}</span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-600">
                        {!analysisResult.issues ? 'Данные о проблемах недоступны' : 'Проблем не найдено'}
                      </p>
                    )}
                  </div>

                  {analysisResult.summary && (
                    <div className="bg-blue-50 rounded-md p-4">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Резюме:</h4>
                      <p className="text-sm text-blue-800">{analysisResult.summary}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Sample Issues from Status */}
              {analysisStatus?.sample_issues && analysisStatus.sample_issues.length > 0 && !analysisResult && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Примеры найденных проблем:</h3>
                  <div className="bg-gray-50 rounded-md p-4">
                    <ul className="space-y-2">
                      {analysisStatus.sample_issues.map((issue, index) => (
                        <li key={index} className="text-sm text-gray-700 bg-white p-3 rounded border">
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Retry Analysis Modal */}
      <RetryAnalysisModal
        isOpen={showRetryModal}
        onClose={() => setShowRetryModal(false)}
        onConfirm={handleRetryAnalysis}
        language={retryLanguage}
        onLanguageChange={setRetryLanguage}
        isLoading={isLoading || currentTask?.polling || false}
      />
    </ErrorBoundary>
  );
};

// Retry Analysis Modal
const RetryAnalysisModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  language: 'ru' | 'en';
  onLanguageChange: (language: 'ru' | 'en') => void;
  isLoading: boolean;
}> = ({ isOpen, onClose, onConfirm, language, onLanguageChange, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Повторить анализ</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Язык анализа
            </label>
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as 'ru' | 'en')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Повторить анализ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 