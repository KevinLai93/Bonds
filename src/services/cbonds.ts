import { getDevApiUrl, getProdApiUrl } from '@/utils/protocol';

// 根據環境和協議自動選擇 API 端點
const getApiUrl = () => {
  if (import.meta.env.DEV) {
    return getDevApiUrl();
  } else {
    return getProdApiUrl();
  }
};

const LOCAL_API_URL = getApiUrl();

// 認證管理
class AuthManager {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  getAuthHeaders() {
    if (!this.token) {
      throw new Error('用戶未登入，請先登入');
    }
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  isAuthenticated() {
    return !!this.token;
  }
}

const authManager = new AuthManager();

async function cbondsGet(endpoint: string, params: any = {}, requiresAuth: boolean = true) {
  const url = new URL(`${LOCAL_API_URL}/api/${endpoint}`);
  
  // 添加查詢參數
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  console.log('呼叫本機 API:', url.toString());

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };

    // 如果需要認證，添加 Authorization header
    if (requiresAuth) {
      Object.assign(headers, authManager.getAuthHeaders());
    }

    const res = await fetch(url.toString(), {
      method: "GET",
      headers
    });

    console.log('本機 API 回應狀態:', res.status);

    if (!res.ok) {
      if (res.status === 401) {
        // Token 過期，清除本地 token
        authManager.clearToken();
        throw new Error('認證已過期，請重新登入');
      }
      const text = await res.text();
      console.error('本機 API 錯誤:', text);
      throw new Error(`API 呼叫失敗: ${res.status} ${text}`);
    }
    
    const json = await res.json();
    
    // 檢查回應中是否包含 TOKEN 失效錯誤
    if (json.error === "Invalid token" || json.code === "INVALID_TOKEN") {
      console.log('檢測到 TOKEN 失效:', json);
      authManager.clearToken();
      // 觸發登出事件
      window.dispatchEvent(new CustomEvent('tokenExpired', { detail: { message: '當前登入已失效，請重新登入' } }));
      throw new Error('當前登入已失效，請重新登入');
    }
    
    console.log('本機 API 回應資料:', json);
    return json;
    
  } catch (error) {
    console.error('本機 API 呼叫失敗:', error);
    throw error;
  }
}

// 公開 API 函數
export const cbondsAPI = {
  // 認證相關
  async login(username: string, password: string) {
    const response = await fetch(`${LOCAL_API_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '登入失敗');
    }
    
    const data = await response.json();
    authManager.setToken(data.token);
    return data;
  },

  async logout() {
    authManager.clearToken();
  },

  async getProfile() {
    return cbondsGet("profile", {}, true);
  },

  // 債券資料 API
  async getEmissions(isin?: string, lang: string = 'eng') {
    const params: any = { lang };
    if (isin) {
      params.isin = isin.trim().toUpperCase();
    }
    return cbondsGet("get_emissions", params, true);
  },

  async getEmissionDefault(isin?: string) {
    const params = isin ? { isin: isin.trim().toUpperCase() } : {};
    return cbondsGet("financial-data/get_emission_default", params, true);
  },

  async getTradingsNew(isin?: string, sortBy: string = 'date_desc') {
    const params: any = { sort_by: sortBy };
    if (isin) {
      params.isin = isin.trim().toUpperCase();
    }
    return cbondsGet("financial-data/get_tradings_new", params, true);
  },

  async getFlowNew(isin?: string) {
    const params = isin ? { isin: isin.trim().toUpperCase() } : {};
    return cbondsGet("financial-data/get_flow_new", params, true);
  },

  async getOffert(isin?: string) {
    const params = isin ? { isin: isin.trim().toUpperCase() } : {};
    return cbondsGet("financial-data/get_offert", params, true);
  },

  async getEmissionGuarantors(isin?: string) {
    const params = isin ? { isin: isin.trim().toUpperCase() } : {};
    return cbondsGet("financial-data/get_emission_guarantors", params, true);
  },

  // 獲取發行人詳細信息
  async getEmitents(emitentId: string, lang: string = 'eng'): Promise<any> {
    return cbondsGet(`get_emitents?emitent_id=${emitentId}&lang=${lang}`, {}, true);
  },

  // 健康檢查
  async healthCheck() {
    return fetch(`${LOCAL_API_URL}/api/health`).then(res => res.json());
  }
};

// 向後相容的函數
export function getEmissions(isin: string): Promise<any> {
  return cbondsAPI.getEmissions(isin);
}

// 導出認證管理器
export { authManager };