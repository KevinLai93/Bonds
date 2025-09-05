# Financial Data API 串接文档

## 🔐 认证系统

### 登入API

#### 1. 用户登入
**端点**: `POST /api/login`  
**描述**: 验证用户凭据并返回JWT token  
**认证**: 无需认证（公开端点）

**请求体**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**成功响应** (200):
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "name": "Administrator"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h",
  "accountType": {
    "type": "admin",
    "displayName": "系統管理員",
    "category": "management"
  }
}
```

**错误响应** (401):
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

#### 2. 获取用户资料
**端点**: `GET /api/profile`  
**描述**: 获取当前登录用户的资料信息  
**认证**: 需要JWT token

**请求头**:
```
Authorization: Bearer {JWT_TOKEN}
```

**成功响应** (200):
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "name": "Administrator"
  },
  "accountType": {
    "type": "admin",
    "displayName": "系統管理員",
    "category": "management"
  }
}
```

## 👥 用户角色与账号分类

### 账号分类系统
系统根据用户名前缀自动识别账号类型，返回对应的分类信息：

| 账号类型 | 显示名称 | 分类 | 识别规则 | 说明 |
|---------|---------|------|---------|------|
| **admin** | 系統管理員 | management | 用户名以 `admin` 开头 | 管理員權限 |
| **analyst** | 財務分析師 | analysis | 用户名以 `analyst` 开头 | 分析師權限 |
| **entrust** | 信託用戶 | investment | 用户名以 `entrust` 开头 | 投資相關權限 |
| **ubot** | UBot用戶 | automation | 用户名以 `ubot` 开头 | 自動化權限 |
| **user** | 一般用戶 | basic | 其他用户名 | 基本權限 |

### 可用账号
| 用户名 | 密码 | 角色 | 账号类型 | 分类 | 说明 |
|--------|------|------|---------|------|------|
| admin | admin123 | admin | admin | management | 系統管理員 |
| analyst | analyst123 | analyst | analyst | analysis | 財務分析師 |
| user1 | user123 | user | user | basic | 一般用戶 |
| entrust001 | 2tTokhjidE | user | entrust | investment | 信託用戶1 |
| entrust002 | ebR0REdj3f | user | entrust | investment | 信託用戶2 |
| entrust003 | vu7UrMEG4v | user | entrust | investment | 信託用戶3 |
| ubot001 | ubot123456 | user | ubot | automation | UBot用戶1 |
| ubot002 | ubot789012 | user | ubot | automation | UBot用戶2 |

### 前端使用方式
```javascript
// 登入後獲取帳號分類
const loginResult = await fetch('/api/login', {
  method: 'POST',
  body: JSON.stringify({ username, password })
});
const { accountType } = await loginResult.json();

// 根據分類顯示不同介面
switch (accountType.category) {
  case 'management':
    // 顯示管理介面
    break;
  case 'investment':
    // 顯示投資介面
    break;
  case 'automation':
    // 顯示自動化介面
    break;
  case 'analysis':
    // 顯示分析介面
    break;
  default:
    // 顯示基本介面
    break;
}

// 設置CSS主題
document.body.className = `${accountType.category}-theme`;
```

### 角色权限
- **admin**: 可以访问所有API端点，包括用户管理
- **user**: 可以访问基本的数据查询API
- **analyst**: 可以访问分析和数据查询API

## 📡 Financial Data API 集成

### 3. 获取债券发行数据
**端点**: `GET /api/get_emissions?isin={ISIN_CODE}&lang={LANGUAGE}`  
**描述**: 获取指定ISIN的债券发行信息  
**认证**: 需要JWT token

**请求头**:
```
Authorization: Bearer {JWT_TOKEN}
```

**查询参数**:
- `isin`: 债券的ISIN代码（必需）
- `lang`: 语言设定，支持 `eng` (英文) 或 `rus` (俄文)，默认为 `eng`（可选）

**成功响应** (200):
```json
{
  "data": {
    // Financial Data API 返回的债券数据
  }
}
```

### 4. 获取债券违约数据
**端点**: `GET /api/financial-data/get_emission_default?isin={ISIN_CODE}`  
**描述**: 获取债券违约和重组债务数据  
**认证**: 需要JWT token

**请求头**:
```
Authorization: Bearer {JWT_TOKEN}
```

**查询参数**:
- `isin`: 债券的ISIN代码（可选）

**请求体** (POST):
```json
{
  "filters": [],
  "quantity": {
    "limit": 100,
    "offset": 0
  }
}
```

**使用示例**:
```
GET /api/financial-data/get_emission_default?isin=US037833DY36
```

### 5. 获取债券担保人数据
**端点**: `GET /api/financial-data/get_emission_guarantors?isin={ISIN_CODE}`  
**描述**: 获取债券担保人信息（如有）  
**认证**: 需要JWT token

**请求头**:
```
Authorization: Bearer {JWT_TOKEN}
```

**查询参数**:
- `isin`: 债券的ISIN代码（可选）

**请求体** (POST):
```json
{
  "filters": [],
  "quantity": {
    "limit": 100,
    "offset": 0
  }
}
```

### 6. 获取债券付息计划
**端点**: `GET /api/financial-data/get_flow_new?isin={ISIN_CODE}`  
**描述**: 获取债券付息计划数据  
**认证**: 需要JWT token

**请求头**:
```
Authorization: Bearer {JWT_TOKEN}
```

**查询参数**:
- `isin`: 债券的ISIN代码（可选）

**请求体** (POST):
```json
{
  "filters": [],
  "quantity": {
    "limit": 50,
    "offset": 0
  }
}
```

**技术说明**: 此端点内部会先将ISIN转换为emission_id，然后使用emission_id进行过滤查询。

### 7. 获取债券期权数据
**端点**: `GET /api/financial-data/get_offert?isin={ISIN_CODE}`  
**描述**: 获取债券put/call期权数据  
**认证**: 需要JWT token

**请求头**:
```
Authorization: Bearer {JWT_TOKEN}
```

**查询参数**:
- `isin`: 债券的ISIN代码（可选）

**请求体** (POST):
```json
{
  "filters": [],
  "quantity": {
    "limit": 100,
    "offset": 0
  }
}
```

### 8. 获取债券交易报价数据
**端点**: `GET /api/financial-data/get_tradings_new?isin={ISIN_CODE}&sort_by={SORT_OPTION}`  
**描述**: 获取债券交易所报价数据（最近40天）  
**认证**: 需要JWT token

**请求头**:
```
Authorization: Bearer {JWT_TOKEN}
```

**查询参数**:
- `isin`: 债券的ISIN代码（可选）
- `sort_by`: 排序方式（可选）
  - `date_desc`: 按日期降序排列（獲取最新數據，推薦）
  - `date_asc`: 按日期升序排列（獲取最舊數據）

**请求体** (POST):
```json
{
  "filters": [],
  "quantity": {
    "limit": 100,
    "offset": 0
  }
}
```

**使用示例**:
```bash
# 獲取最新交易數據（推薦）
curl -H "Authorization: Bearer YOUR_TOKEN" \
"http://localhost:3000/api/financial-data/get_tradings_new?isin=US037833DY36&sort_by=date_desc"

# 獲取歷史交易數據
curl -H "Authorization: Bearer YOUR_TOKEN" \
"http://localhost:3000/api/financial-data/get_tradings_new?isin=US037833DY36&sort_by=date_asc"
```

**注意**: 
- 此端点数据量很大，建议使用ISIN参数或过滤器来减少结果集大小
- 使用 `sort_by=date_desc` 可確保獲取最新的交易價格數據
- 數據包含買價、賣價、中間價、成交量等完整交易信息

## 🔧 技术实现

### JWT Token 格式
- **算法**: HS256
- **有效期**: 24小时（可配置）
- **密钥**: 通过环境变量 `JWT_SECRET` 配置

### 认证流程
1. 用户发送用户名/密码到 `/api/login`
2. 验证成功后返回JWT token
3. 后续请求在Header中携带 `Authorization: Bearer {token}`
4. 中间件自动验证token并提取用户信息

### 错误处理
- **401 Unauthorized**: Token无效或过期
- **403 Forbidden**: 权限不足
- **500 Internal Server Error**: 服务器内部错误

## 📝 使用示例

### 完整的前端集成流程

#### 1. 用户登入
```javascript
const login = async (username, password) => {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    if (data.success) {
      // 保存token到localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('accountType', JSON.stringify(data.accountType));
      return data;
    }
  } catch (error) {
    console.error('登入失败:', error);
  }
};
```

#### 2. 调用需要认证的API
```javascript
const callProtectedAPI = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 401) {
      // Token过期，重定向到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('accountType');
      window.location.href = '/login';
      return;
    }
    
    return await response.json();
  } catch (error) {
    console.error('API调用失败:', error);
  }
};

// 使用示例
const getEmissions = async (isin) => {
  const data = await callProtectedAPI(`/api/get_emissions?isin=${isin}`);
  return data;
};
```

#### 3. 登出
```javascript
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('accountType');
  // 重定向到登录页
  window.location.href = '/login';
};
```

## 🌐 环境配置

### 必需的环境变量
```bash
# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Financial Data API凭据
FINANCIAL_DATA_LOGIN=your_email@domain.com
FINANCIAL_DATA_PASSWORD=your_password
```

### 本地开发
```bash
# 启动本地服务器
npm start

# 服务器地址
https://localhost:6667
```

### 生产环境
- 使用AWS Lambda + API Gateway
- 通过Serverless Framework部署
- Financial Data API凭据存储在AWS Systems Manager Parameter Store

## 🏢 發行人資訊 API

### 6. 獲取發行人詳細資訊
**端點**: `GET /api/get_emitents`  
**描述**: 獲取發行人（公司）的詳細資訊，包括公司介紹、產業別、地址等  
**認證**: 需要JWT token

**請求頭**:
```
Authorization: Bearer {JWT_TOKEN}
```

**查詢參數**:
- `emitent_id`: 發行人ID（與 `emitent_name` 二選一）
- `emitent_name`: 發行人名稱（與 `emitent_id` 二選一）
- `lang`: 語言參數（`eng`/`zh`/`cht`/`zh-cn`/`zh-tw`，預設為 `eng`）

**使用示例**:
```bash
# 使用發行人ID查詢（英文）
curl -H "Authorization: Bearer YOUR_TOKEN" \
"http://localhost:3000/api/get_emitents?emitent_id=23541&lang=eng"

# 使用公司名稱查詢（簡體中文）
curl -H "Authorization: Bearer YOUR_TOKEN" \
"http://localhost:3000/api/get_emitents?emitent_name=Apple&lang=zh"

# 使用公司名稱查詢（繁體中文）
curl -H "Authorization: Bearer YOUR_TOKEN" \
"http://localhost:3000/api/get_emitents?emitent_name=Apple&lang=cht"

# 使用公司名稱查詢（台灣中文）
curl -H "Authorization: Bearer YOUR_TOKEN" \
"http://localhost:3000/api/get_emitents?emitent_name=Apple&lang=zh-tw"
```

**成功響應** (200):
```json
{
  "count": 1,
  "total": 1,
  "limit": 1,
  "offset": 0,
  "exec_time": 0.2342,
  "items": [
    {
      "id": "23541",
      "name_eng": "Apple",
      "full_name_eng": "Apple Inc",
      "type_name_eng": "corporate", // 中文版本: "企業"
      "branch_name_eng": "IT equipment", // 中文版本: "資訊科技設備"
      "country_name_eng": "USA", // 中文版本: "美國"
      "profile_eng": "Apple Inc. designs, manufactures, and markets personal computers...",
      "emitent_address_eng": "ONE APPLE PARK WAY CUPERTINO, USA, 95014",
      "site_eng": "http://www.apple.com/",
      "emitent_lei": "HWUPKR0MPOU8FGXBT394",
      "cik": "0000320193",
      "swift": "APLEUS66XXX"
    }
  ],
  "UserId": 3599,
  "RequestLang": "eng", // 中文版本: "zh"
  "meta": {
    "lang": "eng", // 中文版本: "zh"
    "user_id": 3599
  }
}
```

## 🌐 多語言支援

### 語言參數說明
所有API端點都支援 `lang` 查詢參數：

| 參數值 | 說明 | 支援的API | 翻譯狀態 |
|--------|------|-----------|----------|
| `eng` | 英文（預設） | 所有API | 無需翻譯 |
| `zh` | 簡體中文 | `get_emissions`, `get_emitents` | ✅ 完全支援 |
| `zh-cn` | 簡體中文 | `get_emissions`, `get_emitents` | ✅ 完全支援 |
| `cht` | 繁體中文 | `get_emissions`, `get_emitents` | ✅ 完全支援 |
| `zh-tw` | 台灣中文 | `get_emissions`, `get_emitents` | ✅ 完全支援 |

### 翻譯功能
當 `lang` 參數為中文時，系統會**精確翻譯**以下特定欄位：

**債券資料翻譯** (`get_emissions`):
- `emitent_branch_name_eng`: IT equipment → 資訊科技設備

**發行人資料翻譯** (`get_emitents`):
- `branch_name_eng`: IT equipment → 資訊科技設備
- `profile_eng`: 發行者簡介內容 → 中文翻譯

### 翻譯機制
1. **優先使用本地翻譯詞典**（快速響應）
2. **本地沒有時使用Free Translate API**（準確翻譯）
3. **只翻譯指定的兩個欄位**：
   - 產業別 (`branch_name_eng` 用於發行人，`emitent_branch_name_eng` 用於債券)
   - 發行者簡介 (`profile_eng` 用於發行人)
4. **其他所有欄位保持原文**（英文/俄文）

### 繁體中文支援
- **API參數**: `lang=cht` 或 `lang=zh-tw`
- **翻譯API**: 使用 `dl=zh-TW` 參數調用第三方翻譯服務
- **測試驗證**: 
  - `"Apple Inc"` → `"蘋果公司"`
  - `"IT equipment"` → `"IT設備"`
- **完全支援**: 繁體中文翻譯功能已完全可用

### 翻譯示例
```json
// 英文版本 (lang=eng)
{
  "emitent_name_eng": "Apple",
  "emitent_branch_name_eng": "IT equipment",
  "kind_name_eng": "International bonds",
  "emitent_type_name_eng": "corporate",
  "more_eng": "Apple Inc. designs, manufactures..."
}

// 簡體中文版本 (lang=zh)
{
  "name_eng": "Apple",                           // 保持英文
  "branch_name_eng": "IT设备",                   // ✅ 翻譯為簡體中文
  "type_name_eng": "corporate",                  // 保持英文
  "country_name_eng": "USA",                     // 保持英文
  "profile_eng": "苹果公司设计、制造..."          // ✅ 翻譯為簡體中文
}

// 繁體中文版本 (lang=cht 或 lang=zh-tw)
{
  "name_eng": "Apple",                           // 保持英文
  "branch_name_eng": "IT設備",                   // ✅ 翻譯為繁體中文
  "type_name_eng": "corporate",                  // 保持英文
  "country_name_eng": "USA",                     // 保持英文
  "profile_eng": "蘋果公司設計、製造..."          // ✅ 翻譯為繁體中文
}
```

## 📊 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证或token无效 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 🔒 安全注意事项

1. **JWT Secret**: 生产环境必须使用强密钥
2. **HTTPS**: 生产环境必须使用HTTPS
3. **Token存储**: 前端应安全存储token（如httpOnly cookie）
4. **Token过期**: 实现自动刷新机制
5. **权限控制**: 根据用户角色限制API访问

## 📞 技术支持

如有问题，请检查：
1. 网络连接是否正常
2. JWT token是否有效
3. 用户权限是否足够
4. API端点是否正确
5. 请求格式是否符合要求
