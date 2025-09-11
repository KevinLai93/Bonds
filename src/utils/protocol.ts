/**
 * 協議檢測和切換工具
 */

export interface ProtocolConfig {
  isHttps: boolean;
  currentProtocol: string;
  forceHttps: boolean;
  autoDetection: boolean;
}

/**
 * 獲取當前協議配置
 */
export function getProtocolConfig(): ProtocolConfig {
  const currentProtocol = window.location.protocol;
  const isHttps = currentProtocol === 'https:';
  const forceHttps = import.meta.env.VITE_FORCE_HTTPS === 'true';
  const autoDetection = import.meta.env.VITE_AUTO_PROTOCOL_DETECTION !== 'false';

  return {
    isHttps,
    currentProtocol,
    forceHttps,
    autoDetection
  };
}

/**
 * 根據協議選擇對應的 API URL
 */
export function getApiUrlByProtocol(
  httpUrl: string,
  httpsUrl: string,
  fallbackUrl?: string
): string {
    const config = getProtocolConfig();
  
    if (config.isHttps || config.forceHttps) {
      return httpsUrl;
    } else {
      return httpUrl;
    }
  }
  
  /**
   * 檢查是否需要切換到 HTTPS
   */
  export function shouldUseHttps(): boolean {
    const config = getProtocolConfig();
    return config.isHttps || config.forceHttps;
  }
  
  /**
   * 獲取開發環境的 API URL
   */
  export function getDevApiUrl(): string {
    const config = getProtocolConfig();
  
    if (config.isHttps || config.forceHttps) {
      return import.meta.env.VITE_API_BASE_URL_HTTPS || "https://localhost:3000";
    } else {
      return import.meta.env.VITE_API_BASE_URL_HTTP || "http://localhost:3000";
    }
  }

  /**
 * 獲取生產環境的 API URL
 */
export function getProdApiUrl(): string {
    const config = getProtocolConfig();
  
    if (config.autoDetection) {
      if (config.isHttps || config.forceHttps) {
        return import.meta.env.VITE_PROD_API_BASE_URL_HTTPS || `${window.location.protocol}//${window.location.hostname}:${import.meta.env.VITE_API_PORT || '3000'}`;
      } else {
        return import.meta.env.VITE_PROD_API_BASE_URL_HTTP || `${window.location.protocol}//${window.location.hostname}:${import.meta.env.VITE_API_PORT || '3000'}`;
      }
    } else {
      // 如果沒有設定環境變數，使用同一個 hostname 但不同的 port
      return `${window.location.protocol}//${window.location.hostname}:${import.meta.env.VITE_API_PORT || '3000'}`;
    }
  }

  /**
 * 獲取 Supabase URL
 */
export function getSupabaseUrl(): string {
    const config = getProtocolConfig();
  
    if (import.meta.env.DEV) {
      // 開發環境
      if (config.isHttps || config.forceHttps) {
        return import.meta.env.VITE_SUPABASE_URL_HTTPS || 'https://localhost:54321';
      } else {
        return import.meta.env.VITE_SUPABASE_URL_HTTP || 'http://localhost:54321';
      }
    } else {
      // 生產環境
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (baseUrl) {
        return baseUrl;
      }
  
      return `${window.location.protocol}//${window.location.host}`;
    }
  }

  /**
 * 切換到 HTTPS（如果當前是 HTTP）
 */
export function switchToHttps(): void {
    if (window.location.protocol === 'http:') {
      const httpsUrl = window.location.href.replace('http:', 'https:');
      window.location.href = httpsUrl;
    }
  }
  
  /**
   * 切換到 HTTP（如果當前是 HTTPS）
   */
  export function switchToHttp(): void {
    if (window.location.protocol === 'https:') {
      const httpUrl = window.location.href.replace('https:', 'http:');
      window.location.href = httpUrl;
    }
  }