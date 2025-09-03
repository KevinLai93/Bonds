import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { cbondsAPI } from '@/services/cbonds';

interface User {
  id: number;
  username: string;
  role: string;
  name: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 檢查本地儲存的登入狀態
  useEffect(() => {
    const savedUser = localStorage.getItem('bonds_user');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('bonds_user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await cbondsAPI.login(username, password);
      
      if (response.success && response.user) {
        const userData: User = {
          id: response.user.id,
          username: response.user.username,
          role: response.user.role,
          name: response.user.name,
          email: response.user.email
        };
        
        setUser(userData);
        localStorage.setItem('bonds_user', JSON.stringify(userData));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    cbondsAPI.logout();
    setUser(null);
    localStorage.removeItem('bonds_user');
    localStorage.removeItem('token');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
