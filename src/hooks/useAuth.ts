import { useState, useEffect, useCallback } from 'react';
import { User, CreateUserRequest, LoginRequest } from '../types';
import { authApi, setAuthData, clearAuthData, getStoredUser, getStoredToken } from '../services/api';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: CreateUserRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication status...');
        const storedUser = getStoredUser();
        const token = getStoredToken();
        
        console.log('Stored user:', storedUser);
        console.log('Stored token:', token ? 'exists' : 'not found');
        
        if (storedUser && token) {
          console.log('User and token found, verifying token...');
          // Verify token is still valid
          const currentUser = await authApi.getCurrentUser();
          console.log('Token verification successful, current user:', currentUser);
          setUser(currentUser);
          setIsAuthenticated(true);
        } else {
          console.log('No stored user or token found');
        }
      } catch (err) {
        console.error('Token verification failed:', err);
        // Token is invalid, clear stored data
        clearAuthData();
      } finally {
        console.log('Setting isLoading to false');
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Attempting to login with credentials:', { username: credentials.username });
      
      const authResponse = await authApi.login(credentials);
      console.log('Login response received:', authResponse);
      
      // Save tokens first
      localStorage.setItem('accessToken', authResponse.access_token);
      localStorage.setItem('refreshToken', authResponse.refresh_token);
      
      console.log('Tokens saved to localStorage');
      
      // Now get user info with the token
      const currentUser = await authApi.getCurrentUser();
      console.log('Current user info:', currentUser);
      
      // Save user info
      localStorage.setItem('user', JSON.stringify(currentUser));
      
      setUser(currentUser);
      setIsAuthenticated(true);
      
      console.log('Login successful, user authenticated');
    } catch (err: any) {
      console.error('Login error:', err);
      console.error('Error response:', err.response);
      
      const errorMessage = err.response?.data?.detail || 
                         err.response?.data?.message || 
                         err.message || 
                         'Ошибка входа';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (userData: CreateUserRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Attempting to register user:', userData);
      console.log('Auth API URL:', import.meta.env.VITE_AUTH_API_URL);
      
      await authApi.register(userData);
      console.log('Registration successful');
    } catch (err: any) {
      console.error('Registration error:', err);
      console.error('Error response:', err.response);
      console.error('Error message:', err.message);
      
      const errorMessage = err.response?.data?.detail || 
                         err.response?.data?.message || 
                         err.message || 
                         'Ошибка регистрации';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearAuthData();
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  };
}; 