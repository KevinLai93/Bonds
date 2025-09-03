// CBonds API 服務
// 提供統一的API調用介面

import { getSupabaseUrl } from '@/utils/protocol';

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
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data, status: response.status };
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error);
    return { 
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500 
    };
  }
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
