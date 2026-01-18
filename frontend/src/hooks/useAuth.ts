/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import apiClient from '../api/apiClient';

export const useAuth = () => {
  const navigate = useNavigate();
  const {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    error,
    setAuthentication,
    clearAuthentication,
    setLoading,
    setError,
    logout: storeLogout,
  } = useAuthStore();

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        data: {
          user: any;
          accessToken: string;
        };
      }>('/auth/login', { email, password });

      if (response.success) {
        setAuthentication(response.data.user, response.data.accessToken);
        return { success: true };
      } else {
        setError(response.message || 'Login failed');
        return { success: false, error: response.message };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'An error occurred during login';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        data: {
          user: any;
          accessToken: string;
        };
      }>('/auth/register', { email, password, firstName, lastName });

      if (response.success) {
        setAuthentication(response.data.user, response.data.accessToken);
        return { success: true };
      } else {
        setError(response.message || 'Registration failed');
        return { success: false, error: response.message };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'An error occurred during registration';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      storeLogout();
      clearAuthentication();
      navigate('/login');
    }
  };

  const checkAuth = async () => {
    if (!accessToken) {
      clearAuthentication();
      return false;
    }

    setLoading(true);

    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { user: any };
      }>('/auth/me');

      if (response.success) {
        setAuthentication(response.data.user, accessToken);
        return true;
      } else {
        clearAuthentication();
        return false;
      }
    } catch (error) {
      clearAuthentication();
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: {
          user: any;
          accessToken: string;
        };
      }>('/auth/refresh');

      if (response.success) {
        setAuthentication(response.data.user, response.data.accessToken);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    return false;
  };

  // Auto-check auth on mount
  useEffect(() => {
    if (accessToken && !isAuthenticated) {
      checkAuth();
    }
  }, []);

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    checkAuth,
    refreshToken,
    setError,
  };
};