import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { cbondsAPI } from '@/services/cbonds';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  username: string;
  role: string;
  name: string;
  email?: string;
  logo_url?: string;
}

interface AccountType {
  type: string;
  displayName: string;
  category: string;
}

interface BrandColors {
  theme_color: string;
  auxiliary_color: string;
  background_color: string;
}

interface AuthContextType {
  user: User | null;
  accountType: AccountType | null;
  brandColors: BrandColors | null;
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
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [brandColors, setBrandColors] = useState<BrandColors | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 檢查本地儲存的登入狀態
  useEffect(() => {
    const savedUser = localStorage.getItem('bonds_user');
    const savedAccountType = localStorage.getItem('bonds_account_type');
    const savedBrandColors = localStorage.getItem('bonds_brand_colors');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        
        if (savedAccountType) {
          const accountTypeData = JSON.parse(savedAccountType);
          setAccountType(accountTypeData);
        }
        
        if (savedBrandColors) {
          const brandColorsData = JSON.parse(savedBrandColors);
          setBrandColors(brandColorsData);
        }
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('bonds_user');
        localStorage.removeItem('bonds_account_type');
        localStorage.removeItem('bonds_brand_colors');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const logout = () => {
    cbondsAPI.logout();
    setUser(null);
    setAccountType(null);
    setBrandColors(null);
    localStorage.removeItem('bonds_user');
    localStorage.removeItem('bonds_account_type');
    localStorage.removeItem('bonds_brand_colors');
    localStorage.removeItem('token');
  };

  // 監聽 TOKEN 失效事件
  useEffect(() => {
    const handleTokenExpired = (event: CustomEvent) => {
      const message = event.detail?.message || '當前登入已失效，請重新登入';
      
      // 顯示提示訊息
      toast.error(message);
      
      // 執行登出
      logout();
      
      // 跳轉到登入頁面
      navigate('/login');
    };

    // 添加事件監聽器
    window.addEventListener('tokenExpired', handleTokenExpired as EventListener);

    // 清理事件監聽器
    return () => {
      window.removeEventListener('tokenExpired', handleTokenExpired as EventListener);
    };
  }, [navigate]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await cbondsAPI.login(username, password);
      
      if (response.success && response.user) {
        const userData: User = {
          id: response.user.id,
          username: response.user.username,
          role: response.user.role,
          name: response.user.name,
          email: response.user.email,
          logo_url: response.user.logo_url
        };
        
        setUser(userData);
        localStorage.setItem('bonds_user', JSON.stringify(userData));
        
        // 設置 accountType 和 brandColors
        if (response.accountType) {
          setAccountType(response.accountType);
          localStorage.setItem('bonds_account_type', JSON.stringify(response.accountType));
        }
        
        if (response.brandColors) {
          setBrandColors(response.brandColors);
          localStorage.setItem('bonds_brand_colors', JSON.stringify(response.brandColors));
        }
        
        // 如果登入回應中沒有 brandColors，嘗試從 profile 獲取
        if (!response.brandColors) {
          try {
            const profileResponse = await cbondsAPI.getProfile();
            if (profileResponse.success) {
              if (profileResponse.accountType) {
                setAccountType(profileResponse.accountType);
                localStorage.setItem('bonds_account_type', JSON.stringify(profileResponse.accountType));
              }
              if (profileResponse.brandColors) {
                setBrandColors(profileResponse.brandColors);
                localStorage.setItem('bonds_brand_colors', JSON.stringify(profileResponse.brandColors));
              }
            }
          } catch (profileError) {
            console.warn('Failed to fetch profile data:', profileError);
          }
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    accountType,
    brandColors,
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
