// 使用本機 API 服務器
const LOCAL_API_URL = "https://3.112.203.237/api";

async function cbondsGet(endpoint: string, params: any = {}) {
  const url = new URL(`${LOCAL_API_URL}/${endpoint}`);
  
  // 添加查詢參數
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  console.log('呼叫本機 API:', url.toString());

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    console.log('本機 API 回應狀態:', res.status);

    if (!res.ok) {
      const text = await res.text();
      console.error('本機 API 錯誤:', text);
      throw new Error(`Local API failed: ${res.status} ${text}`);
    }
    
    const json = await res.json();
    console.log('本機 API 回應資料:', json);
    return json;
    
  } catch (error) {
    console.error('本機 API 呼叫失敗:', error);
    throw error;
  }
}

export function getEmissions(isin: string): Promise<any> {
  return cbondsGet("get_emissions", {
    isin: isin.trim().toUpperCase()
  });
}