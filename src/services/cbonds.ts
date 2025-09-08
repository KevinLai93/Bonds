import { getDevApiUrl, getProdApiUrl } from '@/utils/protocol';
import { apiGet, apiPost, ApiResponse } from '@/utils/apiHandler';

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
  const url = `${LOCAL_API_URL}/api/${endpoint}`;
  console.log('呼叫本機 API:', url, '參數:', params);

  const response = await apiGet(url, params, requiresAuth);
  
  if (response.error) {
    throw new Error(response.error);
  }
  
  console.log('本機 API 回應資料:', response.data);
  return response.data;
}

// 公開 API 函數
export const cbondsAPI = {
  // 認證相關
  async login(username: string, password: string) {
    const response = await apiPost(`${LOCAL_API_URL}/api/login`, 
      { username, password }, 
      false // 登入不需要認證
    );
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    const data = response.data;
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
    const response = await apiGet(`${LOCAL_API_URL}/api/health`, {}, false);
    return response.data;
  }
};

// 向後相容的函數
export function getEmissions(isin: string): Promise<any> {
  return cbondsAPI.getEmissions(isin);
}

// 導出認證管理器
export { authManager };