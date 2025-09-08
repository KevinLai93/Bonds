// CBonds API 服務
// 提供統一的API調用介面

import { getSupabaseUrl } from '@/utils/protocol';
import { apiPost, ApiResponse } from '@/utils/apiHandler';

const SUPABASE_URL = getSupabaseUrl();
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

interface CbondsApiResponse<T = any> {
  data?: T;
  error?: string;
  status?: number;
}

/**
 * 通用API調用函數
 */
async function callCbondsApi<T>(
  endpoint: string, 
  body: any = {}
): Promise<CbondsApiResponse<T>> {
  const response = await apiPost<T>(`${SUPABASE_URL}/functions/v1/${endpoint}`, {
    ...body,
    // 添加 Supabase 認證
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    }
  }, false); // Supabase 使用自己的認證，不需要 token 失效處理

  return response;
}



/**
 * 搜尋債券 (使用現有的cbonds-proxy)
 */
export async function searchBonds(params: any = {}): Promise<CbondsApiResponse> {
  return callCbondsApi('cbonds-proxy', {
    endpoint: 'search_bonds',
    ...params
  });
}

export default {
  searchBonds,
};
