import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  profile: any;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => void;
  quickLogin: (role: 'entrepreneur' | 'job_seeker' | 'investor') => Promise<User>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('vb_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const data = await api.getMe();
      setUser(data.user);
      setProfile(data.profile);
    } catch {
      localStorage.removeItem('vb_token');
      setToken(null);
      setUser(null);
      setProfile(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('vb_token');
      if (storedToken) {
        await refreshUser();
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, pass: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password: pass });
      localStorage.setItem('vb_token', res.access_token);
      setToken(res.access_token);
      setUser(res.user);
      setProfile(res.profile);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      localStorage.setItem('vb_token', res.access_token);
      setToken(res.access_token);
      setUser(res.user);
      await refreshUser();
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('vb_token');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const quickLogin = async (role: 'entrepreneur' | 'job_seeker' | 'investor'): Promise<User> => {
    let email = 'founder@ecotrack.io';
    if (role === 'job_seeker') email = 'alex.dev@gmail.com';
    if (role === 'investor') email = 'marcus.vc@apexventures.com';
    return await login(email, 'password123');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        isLoading,
        login,
        register,
        logout,
        quickLogin,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
