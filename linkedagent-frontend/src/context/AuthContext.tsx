import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../api/auth';
import type { UserInfo, LoginDTO } from '../api/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  userInfo: UserInfo | null;
  loading: boolean;
  login: (data: LoginDTO) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUserInfo = async () => {
    try {
      const info = await authApi.getUserInfo();
      setUserInfo(info);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      setIsAuthenticated(false);
      setUserInfo(null);
      localStorage.removeItem('accessToken');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchUserInfo();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (data: LoginDTO) => {
    const res = await authApi.login(data);
    localStorage.setItem('accessToken', res.token);
    await fetchUserInfo();
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setIsAuthenticated(false);
    setUserInfo(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userInfo, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
