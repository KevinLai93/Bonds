/**
 * 前端API调用示例
 * 这个文件包含了所有API端点的调用示例
 */

const API_BASE_URL = 'http://localhost:3000';

// 认证管理类
class AuthManager {
  constructor() {
    this.token = localStorage.getItem('token');
  }
  
  async login(username, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '登录失败');
      }
      
      const data = await response.json();
      this.token = data.token;
      localStorage.setItem('token', this.token);
      return data;
    } catch (error) {
      console.error('登录错误:', error);
      throw error;
    }
  }
  
  getAuthHeaders() {
    if (!this.token) {
      throw new Error('用户未登录');
    }
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }
  
  logout() {
    this.token = null;
    localStorage.removeItem('token');
  }
  
  isLoggedIn() {
    return !!this.token;
  }
}

// 创建全局认证管理器实例
const auth = new AuthManager();

// API调用封装
async function apiCall(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...auth.getAuthHeaders(),
        ...options.headers
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API调用失败:', error);
    throw error;
  }
}

// 公开API调用函数
const API = {
  // 认证相关
  async login(username, password) {
    return await auth.login(username, password);
  },
  
  async logout() {
    auth.logout();
  },
  
  async getProfile() {
    return await apiCall('/api/profile');
  },
  
  // 债券数据API
  async getEmissions(isin, lang = 'eng') {
    const endpoint = isin ? `/api/get_emissions?isin=${isin}&lang=${lang}` : `/api/get_emissions?lang=${lang}`;
    return await apiCall(endpoint);
  },
  
  async getEmissionDefault(isin) {
    const endpoint = isin ? `/api/cbonds/get_emission_default?isin=${isin}` : '/api/cbonds/get_emission_default';
    return await apiCall(endpoint);
  },
  
  async getTradingsNew(isin, sortBy = 'date_desc') {
    let endpoint = '/api/cbonds/get_tradings_new';
    const params = [];
    if (isin) params.push(`isin=${isin}`);
    if (sortBy) params.push(`sort_by=${sortBy}`);
    if (params.length > 0) endpoint += '?' + params.join('&');
    return await apiCall(endpoint);
  },
  
  async getFlowNew(isin) {
    const endpoint = isin ? `/api/cbonds/get_flow_new?isin=${isin}` : '/api/cbonds/get_flow_new';
    return await apiCall(endpoint);
  },
  
  async getOffert(isin) {
    const endpoint = isin ? `/api/cbonds/get_offert?isin=${isin}` : '/api/cbonds/get_offert';
    return await apiCall(endpoint);
  },
  
  async getEmissionGuarantors(isin) {
    const endpoint = isin ? `/api/cbonds/get_emission_guarantors?isin=${isin}` : '/api/cbonds/get_emission_guarantors';
    return await apiCall(endpoint);
  },
  
  // 發行人資訊API
  async getEmitents(emitentId, emitentName, lang = 'eng') {
    let endpoint = '/api/get_emitents?';
    if (emitentId) {
      endpoint += `emitent_id=${emitentId}`;
    } else if (emitentName) {
      endpoint += `emitent_name=${emitentName}`;
    } else {
      throw new Error('必須提供 emitentId 或 emitentName');
    }
    endpoint += `&lang=${lang}`;
    return await apiCall(endpoint);
  },
  
  // 健康检查
  async healthCheck() {
    return await fetch(`${API_BASE_URL}/api/health`).then(res => res.json());
  }
};

// 使用示例
async function example() {
  try {
    console.log('=== API集成示例 ===');
    
    // 1. 健康检查
    console.log('1. 检查API健康状态...');
    const health = await API.healthCheck();
    console.log('API状态:', health);
    
    // 2. 用户登录
    console.log('2. 用户登录...');
    const loginResult = await API.login('admin', 'admin123');
    console.log('登录成功:', loginResult.user);
    
    // 3. 获取用户信息
    console.log('3. 获取用户信息...');
    const profile = await API.getProfile();
    console.log('用户信息:', profile);
    
    // 4. 查询债券数据
    const isin = 'US037833DY36';
    console.log(`4. 查询债券数据 (ISIN: ${isin})...`);
    
    // 获取债券发行数据（英文）
    const emissions = await API.getEmissions(isin, 'eng');
    console.log('债券发行数据（英文）:', emissions);
    
    // 获取债券发行数据（中文，只翻译產業別）
    const emissionsZh = await API.getEmissions(isin, 'zh');
    console.log('债券发行数据（中文）:', emissionsZh);
    
    // 获取债券交易报价（最新数据）
    const tradings = await API.getTradingsNew(isin, 'date_desc');
    console.log('债券交易报价（最新）:', tradings);
    
    // 获取债券交易报价（历史数据）
    const tradingsHistory = await API.getTradingsNew(isin, 'date_asc');
    console.log('债券交易报价（历史）:', tradingsHistory);
    
    // 获取债券付息计划
    const flow = await API.getFlowNew(isin);
    console.log('债券付息计划:', flow);
    
    // 获取债券违约数据
    const defaults = await API.getEmissionDefault(isin);
    console.log('债券违约数据:', defaults);
    
    // 获取债券期权数据
    const offert = await API.getOffert(isin);
    console.log('债券期权数据:', offert);
    
    // 获取债券担保人数据
    const guarantors = await API.getEmissionGuarantors(isin);
    console.log('债券担保人数据:', guarantors);
    
    // 5. 查询發行人資訊（中文，翻譯產業別和發行者簡介）
    console.log('5. 查询發行人資訊（中文）...');
    const emitentId = '23541'; // Apple的發行人ID
    const emitentInfo = await API.getEmitents(emitentId, null, 'zh');
    console.log('發行人資訊（中文）:', emitentInfo);
    
    // 6. 查询發行人資訊（英文）
    console.log('6. 查询發行人資訊（英文）...');
    const emitentInfoEng = await API.getEmitents(emitentId, null, 'eng');
    console.log('發行人資訊（英文）:', emitentInfoEng);
    
    // 7. 使用公司名稱查詢發行人資訊
    console.log('7. 使用公司名稱查詢發行人資訊...');
    const emitentByName = await API.getEmitents(null, 'Apple', 'zh');
    console.log('按名稱查詢發行人資訊:', emitentByName);
    
    console.log('=== 示例完成 ===');
    
  } catch (error) {
    console.error('示例执行失败:', error);
  }
}

// 错误处理示例
async function errorHandlingExample() {
  try {
    // 尝试访问需要认证的API（未登录）
    await API.getProfile();
  } catch (error) {
    console.log('预期的错误:', error.message);
    
    // 登录后重试
    await API.login('admin', 'admin123');
    const profile = await API.getProfile();
    console.log('登录后获取用户信息成功:', profile);
  }
}

// 批量查询示例
async function batchQueryExample() {
  const isins = ['US037833DY36', 'US037833DY37', 'US037833DY38'];
  const results = {};
  
  try {
    await API.login('admin', 'admin123');
    
    for (const isin of isins) {
      console.log(`查询ISIN: ${isin}`);
      try {
        results[isin] = {
          emissions: await API.getEmissions(isin),
          tradings: await API.getTradingsNew(isin, 'date_desc'), // 獲取最新數據
          flow: await API.getFlowNew(isin)
        };
      } catch (error) {
        console.error(`查询${isin}失败:`, error.message);
        results[isin] = { error: error.message };
      }
    }
    
    console.log('批量查询结果:', results);
  } catch (error) {
    console.error('批量查询失败:', error);
  }
}

// 导出API对象供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API, AuthManager, example, errorHandlingExample, batchQueryExample };
}

// 翻譯功能示例
async function translationExample() {
  try {
    console.log('=== 翻譯功能示例 ===');
    
    // 登入
    await API.login('admin', 'admin123');
    
    const isin = 'US037833DY36';
    const emitentId = '23541';
    
    // 1. 債券資料翻譯對比
    console.log('1. 債券資料翻譯對比...');
    
    // 英文版本
    const bondEng = await API.getEmissions(isin, 'eng');
    console.log('英文版本 - 產業別:', bondEng.items[0]?.emitent_branch_name_eng);
    
    // 中文版本（只翻譯產業別）
    const bondZh = await API.getEmissions(isin, 'zh');
    console.log('中文版本 - 產業別:', bondZh.items[0]?.emitent_branch_name_eng);
    console.log('中文版本 - 債券類型:', bondZh.items[0]?.kind_name_eng); // 保持英文
    
    // 2. 發行人資料翻譯對比
    console.log('2. 發行人資料翻譯對比...');
    
    // 英文版本
    const emitentEng = await API.getEmitents(emitentId, null, 'eng');
    console.log('英文版本 - 產業別:', emitentEng.items[0]?.branch_name_eng);
    console.log('英文版本 - 公司類型:', emitentEng.items[0]?.type_name_eng);
    
    // 中文版本（只翻譯產業別和發行者簡介）
    const emitentZh = await API.getEmitents(emitentId, null, 'zh');
    console.log('中文版本 - 產業別:', emitentZh.items[0]?.branch_name_eng);
    console.log('中文版本 - 公司類型:', emitentZh.items[0]?.type_name_eng); // 保持英文
    console.log('中文版本 - 發行者簡介:', emitentZh.items[0]?.more_eng);
    
    console.log('=== 翻譯功能示例完成 ===');
    
  } catch (error) {
    console.error('翻譯功能示例失敗:', error);
  }
}

// 價格查詢示例
async function priceQueryExample() {
  try {
    console.log('=== 價格查詢示例 ===');
    
    // 登入
    await API.login('admin', 'admin123');
    
    const isin = 'US037833DY36';
    
    // 1. 獲取最新價格
    console.log('1. 獲取最新價格...');
    const latestPrices = await API.getTradingsNew(isin, 'date_desc');
    const latestDate = latestPrices.items[0]?.date;
    const latestTrades = latestPrices.items.filter(item => item.date === latestDate);
    console.log(`最新交易日期: ${latestDate}`);
    console.log(`最新交易筆數: ${latestTrades.length}`);
    console.log('最新價格範圍:', {
      minBuy: Math.min(...latestTrades.map(t => parseFloat(t.buying_quote) || 0)),
      maxBuy: Math.max(...latestTrades.map(t => parseFloat(t.buying_quote) || 0)),
      minSell: Math.min(...latestTrades.map(t => parseFloat(t.selling_quote) || 0)),
      maxSell: Math.max(...latestTrades.map(t => parseFloat(t.selling_quote) || 0))
    });
    
    // 2. 獲取過去一週的價格趨勢
    console.log('2. 獲取過去一週的價格趨勢...');
    const weeklyData = latestPrices.items
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-7) // 最近7天
      .reduce((acc, item) => {
        if (!acc[item.date]) {
          acc[item.date] = [];
        }
        acc[item.date].push(item);
        return acc;
      }, {});
    
    console.log('過去一週價格趨勢:');
    Object.keys(weeklyData).forEach(date => {
      const dayTrades = weeklyData[date];
      const avgPrice = dayTrades.reduce((sum, trade) => 
        sum + (parseFloat(trade.mid_price) || parseFloat(trade.buying_quote) || 0), 0
      ) / dayTrades.length;
      console.log(`${date}: ${dayTrades.length}筆交易, 平均價格: ${avgPrice.toFixed(2)}`);
    });
    
    // 3. 實時價格監控示例
    console.log('3. 實時價格監控示例...');
    console.log('開始監控價格變化（每30秒更新一次）...');
    
    let lastPrice = null;
    const monitorPrices = async () => {
      try {
        const currentPrices = await API.getTradingsNew(isin, 'date_desc');
        const currentDate = currentPrices.items[0]?.date;
        const currentTrades = currentPrices.items.filter(item => item.date === currentDate);
        
        if (currentTrades.length > 0) {
          const avgPrice = currentTrades.reduce((sum, trade) => 
            sum + (parseFloat(trade.mid_price) || parseFloat(trade.buying_quote) || 0), 0
          ) / currentTrades.length;
          
          if (lastPrice !== null) {
            const change = avgPrice - lastPrice;
            const changePercent = (change / lastPrice) * 100;
            console.log(`價格變化: ${avgPrice.toFixed(2)} (${change > 0 ? '+' : ''}${change.toFixed(2)}, ${changePercent.toFixed(2)}%)`);
          } else {
            console.log(`當前價格: ${avgPrice.toFixed(2)}`);
          }
          
          lastPrice = avgPrice;
        }
      } catch (error) {
        console.error('價格監控錯誤:', error.message);
      }
    };
    
    // 立即執行一次
    await monitorPrices();
    
    // 設置定時器（實際應用中可能需要更長的間隔）
    const intervalId = setInterval(monitorPrices, 30000); // 30秒
    
    // 5秒後停止監控（示例）
    setTimeout(() => {
      clearInterval(intervalId);
      console.log('價格監控已停止');
    }, 5000);
    
    console.log('=== 價格查詢示例完成 ===');
    
  } catch (error) {
    console.error('價格查詢示例失敗:', error);
  }
}

// 在浏览器环境中，将API对象挂载到window
if (typeof window !== 'undefined') {
  window.API = API;
  window.AuthManager = AuthManager;
  window.apiExamples = {
    example,
    errorHandlingExample,
    batchQueryExample,
    translationExample,
    priceQueryExample
  };
}
