import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  CreateUserRequest, 
  LoginRequest, 
  AuthResponse, 
  User,
  DocumentUploadResponse,
  TaskStatus,
  DocumentsListResponse,
  DocumentChunksResponse,
  AnalysisStatusResponse,
  TaskStatusResponse,
  DocumentAnalysisStatusResponse,
  AnalysisResult
} from '../types';

// API Configuration
const API_CONFIG = {
  AUTH_BASE_URL: import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8001',
  DOCS_BASE_URL: import.meta.env.VITE_DOCS_API_URL || 'http://localhost:8000',
  ANALYSIS_BASE_URL: import.meta.env.VITE_ANALYSIS_API_URL || 'http://localhost:4000',
};

// Utility function for token refresh
const refreshToken = async (refreshToken: string): Promise<AuthResponse> => {
  const response = await axios.post(`${API_CONFIG.AUTH_BASE_URL}/auth/refresh?refresh_token=${refreshToken}`);
  return response.data;
};

// Create axios instances for each service
const createApiInstance = (baseURL: string): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Request interceptor to add auth token
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Add CORS headers
      config.headers['Access-Control-Allow-Origin'] = '*';
      config.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      config.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
      
      console.log('Making request to:', config.url);
      console.log('Request method:', config.method);
      console.log('Request headers:', config.headers);
      
      return config;
    },
    (error) => {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle token refresh
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      console.log('Response received:', response.status, response.config.url);
      return response;
    },
    async (error) => {
      console.error('Response error:', error);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshTokenValue = localStorage.getItem('refreshToken');
          if (refreshTokenValue) {
            const response = await refreshToken(refreshTokenValue);
            localStorage.setItem('accessToken', response.access_token);
            localStorage.setItem('refreshToken', response.refresh_token);
            
            originalRequest.headers.Authorization = `Bearer ${response.access_token}`;
            return instance(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

// API instances
const authApiInstance = createApiInstance(API_CONFIG.AUTH_BASE_URL);
const docsApiInstance = createApiInstance(API_CONFIG.DOCS_BASE_URL);
const analysisApiInstance = createApiInstance(API_CONFIG.ANALYSIS_BASE_URL);

// Auth Service API
export const authApi = {
  register: async (userData: CreateUserRequest): Promise<void> => {
    console.log('Making registration request to:', `${API_CONFIG.AUTH_BASE_URL}/auth/`);
    console.log('Request data:', userData);
    
    try {
      const response = await authApiInstance.post('/auth/', userData);
      console.log('Registration response:', response);
      return response.data;
    } catch (error) {
      console.error('Registration request failed:', error);
      throw error;
    }
  },

  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    console.log('Making login request to:', `${API_CONFIG.AUTH_BASE_URL}/auth/token`);
    console.log('Login credentials:', { username: credentials.username });
    
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    formData.append('grant_type', 'password');

    console.log('Form data:', formData.toString());

    try {
      const response = await authApiInstance.post('/auth/token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      console.log('Login response:', response);
      return response.data;
    } catch (error) {
      console.error('Login request failed:', error);
      throw error;
    }
  },

  refreshToken: async (refreshTokenValue: string): Promise<AuthResponse> => {
    const response = await authApiInstance.post(`/auth/refresh?refresh_token=${refreshTokenValue}`);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    console.log('Making getCurrentUser request to:', `${API_CONFIG.AUTH_BASE_URL}/auth/read_current_user`);
    
    try {
      const response = await authApiInstance.get('/auth/read_current_user');
      console.log('GetCurrentUser response:', response);
      console.log('GetCurrentUser response data:', response.data);
      
      // Handle the case where user data is wrapped in a "User" key
      let userData = response.data;
      if (response.data && response.data.User) {
        userData = response.data.User;
        console.log('Extracted user data from User key:', userData);
      }
      
      return userData;
    } catch (error) {
      console.error('GetCurrentUser request failed:', error);
      throw error;
    }
  },

  logout: async (refreshTokenValue: string): Promise<void> => {
    await authApiInstance.post(`/auth/logout?refresh_token=${refreshTokenValue}`);
  },
};

// Documents Service API
export const docsApi = {
  uploadDocument: async (file: File, ownerId: number): Promise<DocumentUploadResponse> => {
    console.log('Making upload document request to:', `${API_CONFIG.DOCS_BASE_URL}/api/documents/?owner_id=${ownerId}`);
    console.log('File info:', { name: file.name, size: file.size, type: file.type });
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await docsApiInstance.post(`/api/documents/?owner_id=${ownerId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Upload response:', response);
      return response.data;
    } catch (error) {
      console.error('Upload request failed:', error);
      throw error;
    }
  },

  getDocuments: async (skip = 0, limit = 100): Promise<DocumentsListResponse> => {
    console.log('Making get documents request to:', `${API_CONFIG.DOCS_BASE_URL}/api/documents/?skip=${skip}&limit=${limit}`);
    
    try {
      const response = await docsApiInstance.get(`/api/documents/?skip=${skip}&limit=${limit}`);
      console.log('Get documents response:', response);
      return response.data;
    } catch (error) {
      console.error('Get documents request failed:', error);
      throw error;
    }
  },

  getDocumentsByOwner: async (ownerId: number, skip = 0, limit = 100): Promise<DocumentsListResponse> => {
    console.log('Making get documents by owner request to:', `${API_CONFIG.DOCS_BASE_URL}/api/documents/owner/${ownerId}?skip=${skip}&limit=${limit}`);
    
    try {
      const response = await docsApiInstance.get(`/api/documents/owner/${ownerId}?skip=${skip}&limit=${limit}`);
      console.log('Get documents by owner response:', response);
      return response.data;
    } catch (error) {
      console.error('Get documents by owner request failed:', error);
      throw error;
    }
  },

  getDocumentChunks: async (documentId: number, skip = 0, limit = 100): Promise<DocumentChunksResponse> => {
    console.log('Making get document chunks request to:', `${API_CONFIG.DOCS_BASE_URL}/api/documents/${documentId}/chunks?skip=${skip}&limit=${limit}`);
    
    try {
      const response = await docsApiInstance.get(`/api/documents/${documentId}/chunks?skip=${skip}&limit=${limit}`);
      console.log('Get document chunks response:', response);
      return response.data;
    } catch (error) {
      console.error('Get document chunks request failed:', error);
      throw error;
    }
  },

  getTaskStatus: async (taskId: string): Promise<TaskStatus> => {
    console.log('Making get task status request to:', `${API_CONFIG.DOCS_BASE_URL}/api/documents/task/${taskId}`);
    
    try {
      const response = await docsApiInstance.get(`/api/documents/task/${taskId}`);
      console.log('Get task status response:', response);
      console.log('Get task status response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get task status request failed:', error);
      throw error;
    }
  },
};

// Analysis Service API
export const analysisApi = {
  startAnalysis: async (docId: number, language: 'ru' | 'en', retry = false): Promise<AnalysisStatusResponse> => {
    console.log('Making start analysis request to:', `${API_CONFIG.ANALYSIS_BASE_URL}/analyze/${docId}?language=${language}&retry=${retry}`);
    
    try {
      const response = await analysisApiInstance.post(`/analyze/${docId}?language=${language}&retry=${retry}`);
      console.log('Start analysis response:', response);
      return response.data;
    } catch (error) {
      console.error('Start analysis request failed:', error);
      throw error;
    }
  },

  getTaskStatus: async (taskId: string): Promise<TaskStatusResponse> => {
    console.log('Making get analysis task status request to:', `${API_CONFIG.ANALYSIS_BASE_URL}/analyze/status/${taskId}`);
    
    try {
      const response = await analysisApiInstance.get(`/analyze/status/${taskId}`);
      console.log('Get analysis task status response:', response);
      return response.data;
    } catch (error) {
      console.error('Get analysis task status request failed:', error);
      throw error;
    }
  },

  getDocumentAnalysisStatus: async (docId: number): Promise<DocumentAnalysisStatusResponse> => {
    console.log('Making get document analysis status request to:', `${API_CONFIG.ANALYSIS_BASE_URL}/analyze/document/${docId}/status`);
    
    try {
      const response = await analysisApiInstance.get(`/analyze/document/${docId}/status`);
      console.log('Get document analysis status response:', response);
      return response.data;
    } catch (error) {
      console.error('Get document analysis status request failed:', error);
      throw error;
    }
  },

  getAnalysisResult: async (docId: number): Promise<AnalysisResult> => {
    console.log('Making get analysis result request to:', `${API_CONFIG.ANALYSIS_BASE_URL}/analyze/result?doc_id=${docId}`);
    
    try {
      const response = await analysisApiInstance.get(`/analyze/result?doc_id=${docId}`);
      console.log('Get analysis result response:', response);
      console.log('Get analysis result response data:', response.data);
      console.log('Get analysis result response data type:', typeof response.data);
      console.log('Get analysis result response data structure:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error('Get analysis result request failed:', error);
      throw error;
    }
  },
};

// Utility functions
export const clearAuthData = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

export const setAuthData = (authResponse: AuthResponse, user: User) => {
  localStorage.setItem('accessToken', authResponse.access_token);
  localStorage.setItem('refreshToken', authResponse.refresh_token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const getStoredToken = (): string | null => {
  return localStorage.getItem('accessToken');
}; 