import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDocuments } from '../hooks/useDocuments';
import { DocumentUploadResponse, TaskStatus } from '../types';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';

export const UploadPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { uploadDocument, getTaskStatus } = useDocuments();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
    message: string;
    taskId?: string;
    error?: string;
  }>({ status: 'idle', message: '' });

  // Debug user info
  console.log('UploadPage - user:', user);
  console.log('UploadPage - user.id:', user?.id);

  // Force user reload if user is not loaded
  useEffect(() => {
    if (!user || !user.id) {
      console.log('UploadPage - user not loaded, forcing reload...');
      // You can add logic here to force user reload if needed
    }
  }, [user]);

  // Remove the useEffect that redirects to login since this page is already protected
  // useEffect(() => {
  //   if (!user) {
  //     navigate('/login');
  //   }
  // }, [user, navigate]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File select event triggered');
    const file = e.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name, file.size, file.type);
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert('Пожалуйста, выберите PDF или DOCX файл');
        return;
      }
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('Размер файла не должен превышать 10MB');
        return;
      }
      
      setSelectedFile(file);
      setUploadProgress({ status: 'idle', message: '' });
      console.log('File set successfully');
    } else {
      console.log('No file selected');
    }
  };

  const handleFileUploadClick = () => {
    console.log('File upload button clicked');
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      console.log('File input found, clicking...');
      fileInput.click();
    } else {
      console.error('File input not found!');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert('Пожалуйста, выберите PDF или DOCX файл');
        return;
      }
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('Размер файла не должен превышать 10MB');
        return;
      }
      
      setSelectedFile(file);
      setUploadProgress({ status: 'idle', message: '' });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) {
      console.error('Upload failed: selectedFile:', selectedFile, 'user:', user);
      return;
    }

    if (!user.id) {
      console.error('Upload failed: user.id is undefined');
      alert('Ошибка: ID пользователя не найден. Попробуйте войти заново.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress({ status: 'uploading', message: 'Загрузка файла...' });

      console.log('Starting upload with user.id:', user.id);
      const response: DocumentUploadResponse = await uploadDocument(selectedFile, user.id);
      
      setUploadProgress({ 
        status: 'processing', 
        message: 'Обработка документа...',
        taskId: response.task_id 
      });

      // Poll for task status
      await pollTaskStatus(response.task_id);
      
    } catch (error: any) {
      setUploadProgress({ 
        status: 'error', 
        message: 'Ошибка загрузки',
        error: error.message || 'Неизвестная ошибка'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const pollTaskStatus = async (taskId: string) => {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        const status: TaskStatus = await getTaskStatus(taskId);
        console.log('Task status response:', status);
        
        if (status.state === 'SUCCESS') {
          console.log('Task completed successfully');
          setUploadProgress({ 
            status: 'completed', 
            message: 'Документ успешно обработан',
            taskId 
          });
          return;
        } else if (status.state === 'FAILURE') {
          console.log('Task failed');
          setUploadProgress({ 
            status: 'error', 
            message: 'Ошибка обработки документа',
            error: status.error || 'Неизвестная ошибка',
            taskId 
          });
          return;
        }
        
        console.log('Task still in progress, state:', status.state);
        
        // Continue polling
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000);
        } else {
          setUploadProgress({ 
            status: 'error', 
            message: 'Превышено время ожидания',
            error: 'Обработка документа занимает больше времени, чем ожидалось',
            taskId 
          });
        }
      } catch (error: any) {
        console.error('Polling error:', error);
        setUploadProgress({ 
          status: 'error', 
          message: 'Ошибка проверки статуса',
          error: error.message || 'Неизвестная ошибка',
          taskId 
        });
      }
    };

    poll();
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadProgress({ status: 'idle', message: '' });
  };

  const getProgressIcon = () => {
    switch (uploadProgress.status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-8 w-8 text-red-600" />;
      default:
        return <Upload className="h-8 w-8 text-gray-400" />;
    }
  };

  const getProgressMessage = () => {
    return uploadProgress.message;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Загрузка документа</h1>
        <p className="mt-2 text-sm text-gray-600">
          Загрузите PDF или DOCX файл для анализа
        </p>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {uploadProgress.status === 'idle' && (
            <div className="space-y-6">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={handleFileUploadClick}
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Выберите файл
                    </button>
                    <p className="mt-2 text-xs text-gray-500">
                      PDF или DOCX до 10MB
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Или перетащите файл сюда
                    </p>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept=".pdf,.docx"
                      className="sr-only"
                      onChange={handleFileSelect}
                    />
                  </div>
                </div>
              </div>

              {selectedFile && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}

              {selectedFile && (
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Загрузить документ'
                  )}
                </button>
              )}
            </div>
          )}

          {uploadProgress.status !== 'idle' && (
            <div className="text-center space-y-4">
              {getProgressIcon()}
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {getProgressMessage()}
                </h3>
                {uploadProgress.error && (
                  <p className="mt-2 text-sm text-red-600">{uploadProgress.error}</p>
                )}
              </div>
              
              {uploadProgress.status === 'completed' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Документ успешно загружен и обработан
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => navigate('/documents')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      К документам
                    </button>
                    <button
                      onClick={resetUpload}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Загрузить еще
                    </button>
                  </div>
                </div>
              )}
              
              {uploadProgress.status === 'error' && (
                <div className="space-y-4">
                  <button
                    onClick={resetUpload}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Попробовать снова
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 