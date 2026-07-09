import { useAuthStore } from '../store/index';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, getErrorMessage } from '../utils/api-client';

export function useAuth() {
  const navigate = useNavigate();
  const { user, token, setUser, setToken, logout } = useAuthStore();

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await authApi.login(email, password);
        const { token, ...userData } = response.data;
        setToken(token);
        setUser(userData);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        navigate('/');
        return { success: true };
      } catch (error) {
        const message = getErrorMessage(error);
        return { success: false, error: message };
      }
    },
    [setToken, setUser, navigate],
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        const response = await authApi.register(email, password, name);
        const { token, ...userData } = response.data;
        setToken(token);
        setUser(userData);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        navigate('/');
        return { success: true };
      } catch (error) {
        const message = getErrorMessage(error);
        return { success: false, error: message };
      }
    },
    [setToken, setUser, navigate],
  );

  const logoutUser = useCallback(() => {
    logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }, [logout, navigate]);

  return {
    user,
    token,
    isAuthenticated: !!token,
    login,
    register,
    logout: logoutUser,
  };
}
