/**
 * 統一的 API 處理工具
 * 處理所有 API 調用中的 token 失效情況
 */

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  status?: number;
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  requiresAuth?: boolean;
}

/**
 * 觸發 token 失效事件
 */
function triggerTokenExpired(message: string = '當前登入已失效，請重新登入') {
  window.dispatchEvent(new CustomEvent('tokenExpired', { 
    detail: { message } 
  }));
}

/**
 * 檢查回應是否表示 token 失效
 */
function isTokenExpired(response: any): boolean {
  if (!response) return false;
  
  // 添加調試信息
  console.log('檢查 token 失效:', {
    response,
    error: response.error,
    code: response.code,
    message: response.message
  });
  
  // 檢查各種可能的 token 失效錯誤格式
  const isExpired = (
    response.error === "Invalid token" ||
    response.error === "invalid token" ||
    response.code === "INVALID_TOKEN" ||
    response.message === "The provided token is invalid or expired" ||
    response.error === "認證已過期，請重新登入" ||
    response.error === "當前登入已失效，請重新登入"
  );
  
  console.log('Token 失效檢查結果:', isExpired);
  return isExpired;
}

/**
 * 統一的 API 調用函數
 */
export async function apiCall<T = any>(
  url: string, 
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    headers = {},
    body,
    requiresAuth = true
  } = options;

  try {
    // 準備請求頭
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    };

    // 如果需要認證，添加 Authorization header
    if (requiresAuth) {
      const token = localStorage.getItem('token');
      if (!token) {
        triggerTokenExpired('未找到認證 token，請重新登入');
        return { error: '未找到認證 token，請重新登入' };
      }
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    // 發送請求
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    // 處理 HTTP 狀態碼
    if (!response.ok) {
      if (response.status === 401) {
        // 401 未授權，清除本地 token
        localStorage.removeItem('token');
        localStorage.removeItem('bonds_user');
        localStorage.removeItem('bonds_account_type');
        triggerTokenExpired('認證已過期，請重新登入');
        return { error: '認證已過期，請重新登入' };
      }
      
      // 對於 403 錯誤，也要檢查是否為 token 失效
      if (response.status === 403) {
        console.log('收到 403 錯誤，檢查是否為 token 失效');
        try {
          const errorData = await response.json();
          console.log('403 錯誤數據:', errorData);
          if (isTokenExpired(errorData)) {
            console.log('確認是 token 失效，觸發登出');
            localStorage.removeItem('token');
            localStorage.removeItem('bonds_user');
            localStorage.removeItem('bonds_account_type');
            triggerTokenExpired(errorData.message || '當前登入已失效，請重新登入');
            return { error: errorData.message || '當前登入已失效，請重新登入' };
          } else {
            console.log('403 錯誤不是 token 失效');
          }
        } catch (jsonError) {
          console.log('403 錯誤無法解析為 JSON:', jsonError);
          // 403 錯誤無法解析為 JSON，繼續正常處理
        }
      }
      
      const errorText = await response.text();
      console.error(`API 錯誤 ${response.status}:`, errorText);
      return { 
        error: `API 呼叫失敗: ${response.status} ${errorText}`,
        status: response.status 
      };
    }

    // 解析回應
    const data = await response.json();
    
    // 檢查回應內容是否表示 token 失效
    if (isTokenExpired(data)) {
      localStorage.removeItem('token');
      localStorage.removeItem('bonds_user');
      localStorage.removeItem('bonds_account_type');
      triggerTokenExpired(data.message || '當前登入已失效，請重新登入');
      return { error: data.message || '當前登入已失效，請重新登入' };
    }

    return { data, status: response.status };

  } catch (error) {
    console.error('API 呼叫失敗:', error);
    return { 
      error: error instanceof Error ? error.message : '未知錯誤',
      status: 500 
    };
  }
}

/**
 * GET 請求的便捷函數
 */
export async function apiGet<T = any>(
  url: string, 
  params: Record<string, any> = {},
  requiresAuth: boolean = true
): Promise<ApiResponse<T>> {
  // 構建查詢參數
  const urlObj = new URL(url);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      urlObj.searchParams.append(key, String(value));
    }
  });

  return apiCall<T>(urlObj.toString(), { 
    method: 'GET', 
    requiresAuth 
  });
}

/**
 * POST 請求的便捷函數
 */
export async function apiPost<T = any>(
  url: string, 
  body: any = {},
  requiresAuth: boolean = true
): Promise<ApiResponse<T>> {
  return apiCall<T>(url, { 
    method: 'POST', 
    body, 
    requiresAuth 
  });
}

/**
 * PUT 請求的便捷函數
 */
export async function apiPut<T = any>(
  url: string, 
  body: any = {},
  requiresAuth: boolean = true
): Promise<ApiResponse<T>> {
  return apiCall<T>(url, { 
    method: 'PUT', 
    body, 
    requiresAuth 
  });
}

/**
 * DELETE 請求的便捷函數
 */
export async function apiDelete<T = any>(
  url: string, 
  requiresAuth: boolean = true
): Promise<ApiResponse<T>> {
  return apiCall<T>(url, { 
    method: 'DELETE', 
    requiresAuth 
  });
}



