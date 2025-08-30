import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useDocuments } from '../hooks/useDocuments';
import { useAnalysis } from '../hooks/useAnalysis';
import { Document, DocumentAnalysisStatusResponse } from '../types';
import { FileText, Upload, Play, AlertCircle, CheckCircle, Clock, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const { documents, isLoading, error, getDocuments } = useDocuments();
  const { getDocumentAnalysisStatus } = useAnalysis();
  const [analysisStatuses, setAnalysisStatuses] = useState<Record<number, DocumentAnalysisStatusResponse>>({});

  useEffect(() => {
    if (user?.id) {
      getDocuments(user.id);
    }
  }, [user?.id, getDocuments]);

  useEffect(() => {
    // Load analysis statuses for all documents
    const loadAnalysisStatuses = async () => {
      if (documents.length > 0) {
        const statuses: Record<number, DocumentAnalysisStatusResponse> = {};
        
        for (const doc of documents) {
          try {
            const status = await getDocumentAnalysisStatus(doc.id);
            statuses[doc.id] = status;
          } catch (err) {
            console.error(`Failed to load analysis status for document ${doc.id}:`, err);
          }
        }
        
        setAnalysisStatuses(statuses);
      }
    };

    loadAnalysisStatuses();
  }, [documents, getDocumentAnalysisStatus]);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Мои документы</h1>
        <Link
          to="/upload"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Upload className="h-4 w-4 mr-2" />
          Загрузить документ
        </Link>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Нет документов</h3>
          <p className="mt-1 text-sm text-gray-500">
            Начните с загрузки вашего первого документа.
          </p>
          <div className="mt-6">
            <Link
              to="/upload"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Upload className="h-4 w-4 mr-2" />
              Загрузить документ
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {documents.map((doc: Document) => {
              const analysisStatus = analysisStatuses[doc.id];
              
              return (
                <li key={doc.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="h-8 w-8 text-gray-400 mr-3" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {doc.filename}
                          </p>
                          <p className="text-sm text-gray-500">
                            Загружен {formatDate(doc.upload_time)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        {analysisStatus && (
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(analysisStatus.status)}
                            <span className="text-sm text-gray-600">
                              {getStatusText(analysisStatus.status)}
                            </span>
                            {analysisStatus.issues_count > 0 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {analysisStatus.issues_count} проблем
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div className="flex space-x-2">
                          <Link
                            to={`/analysis/${doc.id}`}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Анализ
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}; 