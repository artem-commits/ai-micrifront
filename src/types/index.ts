// Auth Service Types
export interface CreateUserRequest {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  grant_type?: string;
  scope?: string;
  client_id?: string;
  client_secret?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface User {
  id: number;
  username: string;
  is_admin?: boolean;
  is_verified?: boolean;
  // Optional fields that might be present in some responses
  first_name?: string;
  last_name?: string;
  email?: string;
}

// Document Service Types
export interface Document {
  id: number;
  filename: string;
  owner_id: number;
  status: string;
  created_at: string;
  updated_at: string;
  file_size?: number;
  file_type?: string;
}

export interface DocumentChunk {
  id: number;
  document_id: number;
  content: string;
  chunk_index: number;
  created_at: string;
}

export interface DocumentUploadResponse {
  task_id: string;
  message: string;
  status: string;
}

export interface TaskStatus {
  task_id: string;
  state: 'PENDING' | 'STARTED' | 'SUCCESS' | 'FAILURE';
  status: string;
  result?: {
    status: string;
    progress: number;
    document_id: number;
    num_chunks: number;
  };
  error?: string;
}

export interface DocumentsListResponse {
  documents: Document[];
  total: number;
  skip: number;
  limit: number;
}

export interface DocumentChunksResponse {
  chunks: DocumentChunk[];
  total: number;
  skip: number;
  limit: number;
}

// Analysis Service Types
export interface AnalysisStatusResponse {
  status: string;
  message: string;
  document_id: number;
  task_id: string;
}

export interface TaskStatusResponse {
  task_id: string;
  task_status: 'PENDING' | 'STARTED' | 'SUCCESS' | 'FAILURE';
  document_id: number | null;
  analysis_result: string | null;
  issues_found: boolean | null;
  error: string | null;
}

export interface DocumentAnalysisStatusResponse {
  document_id: number;
  analyzed: boolean;
  issues_count: number;
  status: 'not_analyzed' | 'in_progress' | 'completed';
  last_analyzed: string | null;
  sample_issues: string[] | null;
}

export interface AnalysisResult {
  document_id: number;
  issues: AnalysisIssue[];
  summary?: string;
  language?: 'ru' | 'en';
}

export interface AnalysisIssue {
  id: number;
  document_id: number;
  issue: string;
  severity: 'critical' | 'warning' | 'info';
}

// App State Types
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
} 