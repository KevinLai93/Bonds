# 前端API集成指南

## 📋 前端开发需要的文件

### 1. **API文档** - `API_DOCUMENTATION.md`
- 完整的API端点说明
- 认证方式（JWT Token）
- 请求/响应格式
- 错误处理

### 2. **环境配置** - `.env.example`
```bash
# API基础URL
API_BASE_URL=https://your-domain.com
# 或者本地开发
API_BASE_URL=https://localhost:6667

# JWT配置（可选，用于调试）
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### 3. **API测试示例** - `api-examples.js`
```javascript
// 前端API调用示例
const API_BASE_URL = 'https://localhost:6667';

// 1. 用户登录
async function login(username, password) {
  const response = await fetch(`${API_BASE_URL}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password })
  });
  
  if (!response.ok) {
    throw new Error('登录失败');
  }
  
  const data = await response.json();
  return data.token; // 保存到localStorage
}

// 2. 获取债券数据（需要token）
async function getBondData(isin, token) {
  const response = await fetch(`${API_BASE_URL}/api/get_emissions?isin=${isin}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  if (!response.ok) {
    throw new Error('获取数据失败');
  }
  
  return await response.json();
}

// 3. 获取债券交易报价
async function getBondTrading(isin, token) {
  const response = await fetch(`${API_BASE_URL}/api/cbonds/get_tradings_new?isin=${isin}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
}

// 4. 获取债券付息计划
async function getBondFlow(isin, token) {
  const response = await fetch(`${API_BASE_URL}/api/cbonds/get_flow_new?isin=${isin}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
}

// 使用示例
async function example() {
  try {
    // 登录获取token
    const token = await login('admin', 'admin123');
    localStorage.setItem('token', token);
    
    // 查询债券数据
    const bondData = await getBondData('US037833DY36', token);
    console.log('债券数据:', bondData);
    
    // 查询交易报价
    const tradingData = await getBondTrading('US037833DY36', token);
    console.log('交易报价:', tradingData);
    
    // 查询付息计划
    const flowData = await getBondFlow('US037833DY36', token);
    console.log('付息计划:', flowData);
    
  } catch (error) {
    console.error('API调用错误:', error);
  }
}
```

## 🔐 认证流程

### 1. 登录获取Token
```javascript
POST /api/login
{
  "username": "admin",
  "password": "admin123"
}

// 响应
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "name": "Administrator"
  }
}
```

### 2. 使用Token访问API
```javascript
// 所有后续API调用都需要在Header中包含token
Authorization: Bearer {JWT_TOKEN}
```

## 📊 可用的API端点

| 端点 | 方法 | 描述 | 需要ISIN |
|------|------|------|----------|
| `/api/login` | POST | 用户登录 | ❌ |
| `/api/profile` | GET | 用户信息 | ❌ |
| `/api/get_emissions?isin={ISIN}` | GET | 债券发行数据 | ✅ |
| `/api/cbonds/get_emission_default?isin={ISIN}` | GET | 债券违约数据 | ✅ |
| `/api/cbonds/get_tradings_new?isin={ISIN}` | GET | 债券交易报价 | ✅ |
| `/api/cbonds/get_flow_new?isin={ISIN}` | GET | 债券付息计划 | ✅ |
| `/api/cbonds/get_offert?isin={ISIN}` | GET | 债券期权数据 | ✅ |
| `/api/cbonds/get_emission_guarantors?isin={ISIN}` | GET | 债券担保人数据 | ✅ |

## 🚀 快速开始

### 1. 设置环境变量
```bash
# 复制环境配置模板
cp .env.example .env

# 编辑.env文件，设置API_BASE_URL
API_BASE_URL=https://localhost:6667
```

### 2. 安装依赖（如果需要）
```bash
# 如果使用fetch polyfill
npm install node-fetch

# 或者使用axios
npm install axios
```

### 3. 测试连接
```javascript
// 测试API连接
async function testConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const data = await response.json();
    console.log('API连接正常:', data);
  } catch (error) {
    console.error('API连接失败:', error);
  }
}
```

## ⚠️ 注意事项

### 1. HTTPS证书
- 本地开发使用自签名证书，浏览器会显示安全警告
- 生产环境需要配置有效的SSL证书

### 2. CORS设置
- API已启用CORS，支持跨域请求
- 如果遇到CORS问题，检查请求头设置

### 3. 错误处理
```javascript
// 统一错误处理
async function apiCall(url, options = {}) {
  try {
    const response = await fetch(url, options);
    
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
```

### 4. Token管理
```javascript
// Token自动刷新和存储
class AuthManager {
  constructor() {
    this.token = localStorage.getItem('token');
  }
  
  async login(username, password) {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    this.token = data.token;
    localStorage.setItem('token', this.token);
    return data;
  }
  
  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }
  
  logout() {
    this.token = null;
    localStorage.removeItem('token');
  }
}
```

## 📞 技术支持

如果遇到问题，请检查：
1. API服务是否正在运行
2. 网络连接是否正常
3. Token是否有效
4. 请求格式是否正确

更多详细信息请参考 `API_DOCUMENTATION.md` 文件。
