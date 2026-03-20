import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

export interface User {
  id: number;
  name: string;
  email: string;
  profile?: any;
  preference?: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  hasProfile: boolean | null;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  checkProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  const checkSession = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No token');
      }

      const response = await api.get('/user');
      const currentUser = response.data;
      setUser(currentUser);
      setHasProfile(!!currentUser.profile);
    } catch (error) {
      setUser(null);
      setHasProfile(null);
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('auth_token', token);
    setUser(userData);
    setHasProfile(!!userData.profile);
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('auth_token');
    setUser(null);
    setHasProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, hasProfile, login, logout, checkSession, checkProfile: checkSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
