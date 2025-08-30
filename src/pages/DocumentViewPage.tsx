import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDocuments } from '../hooks/useDocuments';
import { Document } from '../types';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';

export const DocumentViewPage: React.FC = () => {
  const { docId } = useParams<{ docId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { documents, getDocuments } = useDocuments();

  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Debug information
  console.log('DocumentViewPage - docId:', docId);
  console.log('DocumentViewPage - documents:', documents);
  console.log('DocumentViewPage - user:', user);

  // Load user's documents when user is available
  useEffect(() => {
    if (user?.id) {
      console.log('DocumentViewPage: Loading documents for user:', user.id);
      getDocuments(user.id);
    }
  }, [user?.id, getDocuments]);

  useEffect(() => {
    console.log('DocumentViewPage useEffect - docId:', docId, 'documents length:', documents.length);
    
    if (docId) {
      const docIdNum = parseInt(docId);
      console.log('Looking for document with id:', docIdNum);
      
      if (documents.length > 0) {
        const doc = documents.find(d => d.id === docIdNum);
        console.log('Found document:', doc);
        
        if (doc) {
          console.log('Setting document...');
          setDocument(doc);
          setIsLoading(false);
        } else {
          console.log('Document not found in documents list, redirecting to /documents');
          console.log('Available document IDs:', documents.map(d => d.id));
          navigate('/documents');
        }
      } else {
        console.log('Documents list is empty, waiting for documents to load...');
      }
    } else {
      console.log('No docId provided');
    }
  }, [docId, documents, navigate]);

  if (isLoading) {
    console.log('DocumentViewPage: Loading...');
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-sm text-gray-600">Загрузка документа...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    console.log('DocumentViewPage: Document not loaded yet, showing loading...');
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-sm text-gray-600">Загрузка документа...</p>
        </div>
      </div>
    );
  }

  console.log('DocumentViewPage: Rendering with document:', document);

  return (
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
          <h1 className="text-2xl font-bold text-gray-900">Просмотр документа</h1>
          <p className="text-sm text-gray-600">{document.filename}</p>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-6">
            {/* Document Info */}
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-gray-400" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">{document.filename}</h3>
                <p className="text-sm text-gray-500">
                  Загружен {new Date(document.created_at).toLocaleDateString('ru-RU')}
                </p>
                <p className="text-sm text-gray-500">
                  Статус: {document.status}
                </p>
                {document.file_size && (
                  <p className="text-sm text-gray-500">
                    Размер: {(document.file_size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>
            </div>

            {/* Document Content Placeholder */}
            <div className="bg-gray-50 rounded-md p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Содержимое документа</h4>
              <p className="text-sm text-gray-600">
                Здесь будет отображаться содержимое документа. Функция просмотра содержимого пока не реализована.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 