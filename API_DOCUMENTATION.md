# Financial Data API 完整文檔

## 🔐 認證系統

### 1. 用戶登入
**端點**: `POST /api/login`  
**描述**: 驗證用戶憑證並返回JWT token  
**認證**: 無需認證（公開端點）

**請求體**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**成功響應** (200):
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

**錯誤響應** (401):
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### 2. 獲取用戶資料
**端點**: `GET /api/profile`  
**描述**: 獲取當前登入用戶的資料資訊  
**認證**: 需要JWT token

**請求頭**:
```
Authorization: Bearer {JWT_TOKEN}
```

**成功響應** (200):
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

### 3. 健康檢查
**端點**: `GET /api/health`  
**描述**: 檢查API服務狀態  
**認證**: 無需認證

**成功響應** (200):
```json
{
  "status": "OK",
  "timestamp": "2025-01-27T10:30:00.000Z",
  "uptime": 3600
}
```

## 👥 用戶角色與帳號分類

### 帳號分類系統
系統根據用戶名前綴自動識別帳號類型，返回對應的分類資訊：

| 帳號類型 | 顯示名稱 | 分類 | 識別規則 | 說明 |
|---------|---------|------|---------|------|
| **admin** | 系統管理員 | management | 用戶名以 `admin` 開頭 | 管理員權限 |
| **analyst** | 財務分析師 | analysis | 用戶名以 `analyst` 開頭 | 分析師權限 |
| **entrust** | 信託用戶 | investment | 用戶名以 `entrust` 開頭 | 投資相關權限 |
| **ubot** | UBot用戶 | automation | 用戶名以 `ubot` 開頭 | 自動化權限 |
| **masterlink** | 元富證券 | investment | 用戶名以 `masterlink` 開頭 | 元富證券權限 |
| **esun** | 玉山銀行 | investment | 用戶名以 `esun` 開頭 | 玉山銀行權限 |
| **user** | 一般用戶 | basic | 其他用戶名 | 基本權限 |

### 可用帳號
| 用戶名 | 密碼 | 角色 | 帳號類型 | 分類 | 說明 |
|--------|------|------|---------|------|------|
| admin | admin123 | admin | admin | management | 系統管理員 |
| analyst | analyst123 | analyst | analyst | analysis | 財務分析師 |
| user1 | user123 | user | user | basic | 一般用戶 |
| entrust001 | 2tTokhjidE | user | entrust | investment | 信託用戶1 |
| entrust002 | ebR0REdj3f | user | entrust | investment | 信託用戶2 |
| entrust003 | vu7UrMEG4v | user | entrust | investment | 信託用戶3 |
| ubot001 | ubot123456 | user | ubot | automation | UBot用戶1 |
| ubot002 | ubot789012 | user | ubot | automation | UBot用戶2 |
| masterlink001 | masterlink123 | user | masterlink | investment | 元富證券用戶1 |
| masterlink002 | masterlink456 | user | masterlink | investment | 元富證券用戶2 |
| esun001 | esun123456 | user | esun | investment | 玉山銀行用戶1 |
| esun002 | esun789012 | user | esun | investment | 玉山銀行用戶2 |

## 📊 債券數據 API

### 4. 獲取債券發行資訊
**端點**: `GET /api/get_emissions?isin={ISIN}&lang={LANG}`  
**描述**: 獲取指定ISIN的債券發行資訊  
**認證**: 需要JWT token

**請求頭**:
```
Authorization: Bearer {JWT_TOKEN}
```

**查詢參數**:
- `isin`: 債券的ISIN代碼（必需）
- `lang`: 語言設定，支援 `eng` (英文) 或 `rus` (俄文)，默認為 `eng`（可選）

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
      "isin_code": "US037833FB15",
      "emitent_name_eng": "Apple",
      "document_eng": "Apple, 4.75% perp., USD",
      "maturity_date": null,
      
      // 前手息相關
      "curr_coupon_sum": "47.5",           // 前手息金額
      "curr_coupon_rate": "4.75",          // 息票利率
      "curr_coupon_date": "2025-11-12",    // 下次付息日期
      "eurobonds_nominal": "1000",         // 計算基礎面值
      
      // 票息類型相關
      "cupon_eng": "4.75%",                // 息票描述
      "floating_rate": "0",                // 是否浮動利率
      "coupon_type_name_eng": "Coupon bonds",
      "reference_rate_name_eng": "",       // 參考利率
      
      // 其他重要字段
      "outstanding_volume": "1250000000",
      "currency_name": "USD",
      "status_name_eng": "outstanding",
      "emitent_branch_name_eng": "IT equipment"
    }
  ],
  "UserId": 3599,
  "RequestLang": "eng",
  "meta": {
    "lang": "eng",
    "user_id": 3599
  }
}
```

### 5. 獲取發行人資訊
**端點**: `GET /api/get_emitents?emitent_id={ID}&lang={LANG}`  
**描述**: 獲取發行人（公司）的詳細資訊  
**認證**: 需要JWT token

**請求頭**:
```
Authorization: Bearer {JWT_TOKEN}
```

**查詢參數**:
- `emitent_id`: 發行人ID（與 `emitent_name` 二選一）
- `emitent_name`: 發行人名稱（與 `emitent_id` 二選一）
- `lang`: 語言參數（`eng`/`zh`/`cht`/`zh-cn`/`zh-tw`，預設為 `eng`）

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
      "type_name_eng": "corporate",
      "branch_name_eng": "IT equipment",
      "country_name_eng": "USA",
      "profile_eng": "Apple Inc. designs, manufactures, and markets personal computers...",
      "emitent_address_eng": "ONE APPLE PARK WAY CUPERTINO, USA, 95014",
      "site_eng": "http://www.apple.com/",
      "emitent_lei": "HWUPKR0MPOU8FGXBT394",
      "cik": "0000320193",
      "swift": "APLEUS66XXX"
    }
  ],
  "UserId": 3599,
  "RequestLang": "eng",
  "meta": {
    "lang": "eng",
    "user_id": 3599
  }
}
```

## 💰 價格和交易數據 API

### 6. 獲取交易報價數據
**端點**: `GET /api/financial-data/get_tradings_new?isin={ISIN}&sort_by={SORT_OPTION}`  
**描述**: 獲取債券交易所報價數據（最近40天）  
**認證**: 需要JWT token

**請求頭**:
```
Authorization: Bearer {JWT_TOKEN}
```

**查詢參數**:
- `isin`: 債券的ISIN代碼（可選）
- `sort_by`: 排序方式（可選）
  - `date_desc`: 按日期降序排列（獲取最新數據，推薦）
  - `date_asc`: 按日期升序排列（獲取最舊數據）

**請求體** (POST):
```json
{
  "filters": [],
  "quantity": {
    "limit": 100,
    "offset": 0
  }
}
```

**成功響應** (200):
```json
{
  "count": 5,
  "total": 5,
  "limit": 100,
  "offset": 0,
  "exec_time": 0.1234,
  "items": [
    {
      "date": "2025-09-05",
      "buying_quote": "101.98",      // BID 價格
      "selling_quote": "101.98",     // ASK 價格
      "avar_price": "101.98",        // 平均價格
      "volume": "0",                  // 成交量
      "trade_type": null
    }
  ],
  "UserId": 3599,
  "RequestLang": "eng",
  "meta": {
    "lang": "eng",
    "user_id": 3599
  }
}
```

### 7. 獲取買賣報價數據
**端點**: `GET /api/financial-data/get_offert?isin={ISIN}`  
**描述**: 獲取債券put/call期權數據  
**認證**: 需要JWT token

**請求頭**:
```
Authorization: Bearer {JWT_TOKEN}
```

**查詢參數**:
- `isin`: 債券的ISIN代碼（可選）

**請求體** (POST):
```json
{
  "filters": [],
  "quantity": {
    "limit": 100,
    "offset": 0
  }
}
```

### 8. 獲取付息計劃
**端點**: `GET /api/financial-data/get_flow_new?isin={ISIN}`  
**描述**: 獲取債券付息計劃數據  
**認證**: 需要JWT token

**請求頭**:
```
Authorization: Bearer {JWT_TOKEN}
```

**查詢參數**:
- `isin`: 債券的ISIN代碼（可選）

**請求體** (POST):
```json
{
  "filters": [],
  "quantity": {
    "limit": 50,
    "offset": 0
  }
}
```

**成功響應** (200):
```json
{
  "count": 10,
  "total": 10,
  "limit": 50,
  "offset": 0,
  "exec_time": 0.1234,
  "items": [
    {
      "date": "2021-02-20",
      "cupon_rate": "0.012500000000000",    // 息票利率
      "cupon_sum": "12.500000000000000",    // 息票金額
      "actual_payment_date": "2021-02-22"   // 實際支付日期
    }
  ],
  "UserId": 3599,
  "RequestLang": "eng",
  "meta": {
    "lang": "eng",
    "user_id": 3599
  }
}
```

## 🎯 票息類型分類

### 四種票息類型
| 類型 | 判斷條件 | 示例 | 顏色 |
|------|----------|------|------|
| **零息** | `cupon_eng` 為空或 "0%" | "" | #gray |
| **固定** | `floating_rate: "0"` 且無複雜結構 | "4.75%" | #green |
| **浮動** | `floating_rate: "1"` 且無分階段 | "3M LIBOR + 2.5%" | #blue |
| **變動** | 包含 "until" 和 "then" | "6.125% until...then..." | #orange |

### 前端分類邏輯
```javascript
function classifyCouponType(bondData) {
  const couponString = (bondData.cupon_eng || "").toLowerCase();
  const floatingRate = bondData.floating_rate;
  
  // 零息債券
  if (!couponString || couponString === "0%" || bondData.coupon_type_name_eng === "Zero coupon") {
    return "零息";
  }
  
  // 變動利率（分階段、混合型）
  if (couponString.includes("until") && couponString.includes("then")) {
    return "變動";
  }
  
  // 浮動利率
  if (floatingRate === "1" || 
      couponString.includes("ust yield") || 
      couponString.includes("libor") || 
      couponString.includes("sofr")) {
    return "浮動";
  }
  
  // 固定利率
  return "固定";
}
```

### 票息類型API響應格式
```json
{
  "items": [{
    "isin_code": "US05565QDX34",
    "cupon_eng": "6.125% until 2025-11-15, then 3M UST + 2.5%",
    "floating_rate": "0",
    "coupon_type_name_eng": "Coupon bonds",
    
    // 新增的分類字段
    "coupon_type_classified": "變動",
    "coupon_type_description": "分階段固定轉浮動利率",
    "coupon_type_color": "#orange",
    "current_stage": "固定階段",
    "next_stage": "浮動階段",
    "stage_transition_date": "2025-11-15"
  }]
}
```

## 🌐 多語言支援

### 支援的語言
| 參數值 | 說明 | 支援的API | 翻譯狀態 |
|--------|------|-----------|----------|
| `eng` | 英文（預設） | 所有API | 無需翻譯 |
| `zh` | 簡體中文 | `get_emissions`, `get_emitents` | ✅ 完全支援 |
| `zh-cn` | 簡體中文 | `get_emissions`, `get_emitents` | ✅ 完全支援 |
| `cht` | 繁體中文 | `get_emissions`, `get_emitents` | ✅ 完全支援 |
| `zh-tw` | 台灣中文 | `get_emissions`, `get_emitents` | ✅ 完全支援 |

### 翻譯字段
- 債券: `emitent_branch_name_eng` (產業別)
- 發行人: `branch_name_eng` (產業別), `profile_eng` (公司簡介)

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

## 📝 使用示例

### 完整的前端集成流程

#### 1. 用戶登入
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
    console.error('登入失敗:', error);
  }
};
```

#### 2. 調用需要認證的API
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
      // Token過期，重定向到登入頁
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('accountType');
      window.location.href = '/login';
      return;
    }
    
    return await response.json();
  } catch (error) {
    console.error('API調用失敗:', error);
  }
};

// 使用示例
const getEmissions = async (isin, lang = 'eng') => {
  const data = await callProtectedAPI(`/api/get_emissions?isin=${isin}&lang=${lang}`);
  return data;
};

const getPriceData = async (isin) => {
  const data = await callProtectedAPI(`/api/financial-data/get_tradings_new?isin=${isin}&sort_by=date_desc`);
  return data;
};
```

#### 3. 票息類型分類
```javascript
const getCouponType = (bondData) => {
  const couponString = (bondData.cupon_eng || "").toLowerCase();
  const floatingRate = bondData.floating_rate;
  
  if (!couponString || couponString === "0%") return "零息";
  if (couponString.includes("until") && couponString.includes("then")) return "變動";
  if (floatingRate === "1") return "浮動";
  return "固定";
};

// 使用示例
const bondData = await getEmissions('US05565QDX34');
const couponType = getCouponType(bondData.items[0]);
console.log(`票息類型: ${couponType}`); // 輸出: 票息類型: 變動
```

#### 4. 登出
```javascript
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('accountType');
  // 重定向到登入頁
  window.location.href = '/login';
};
```

## 🔧 技術規格

### JWT Token 格式
- **算法**: HS256
- **有效期**: 24小時（可配置）
- **密鑰**: 通過環境變量 `JWT_SECRET` 配置

### 認證流程
1. 用戶發送用戶名/密碼到 `/api/login`
2. 驗證成功後返回JWT token
3. 後續請求在Header中攜帶 `Authorization: Bearer {token}`
4. 中間件自動驗證token並提取用戶資訊

### 錯誤處理
- **401 Unauthorized**: Token無效或過期
- **403 Forbidden**: 權限不足
- **500 Internal Server Error**: 服務器內部錯誤

## 📊 數據字段說明

### 前手息計算
- **字段**: `curr_coupon_sum`
- **基礎**: `eurobonds_nominal` (1000)
- **公式**: 每 1000 面值的前手息金額
- **說明**: 前手息是基於 1000 面值計算的，這是正確的

### 價格數據
- **BID**: `buying_quote`
- **ASK**: `selling_quote`
- **平均價**: `avar_price`
- **成交量**: `volume`

### 票息資訊
- **利率**: `curr_coupon_rate`
- **金額**: `curr_coupon_sum`
- **下次付息**: `curr_coupon_date`
- **描述**: `cupon_eng`

## 🌐 環境配置

### 必需的環境變量
```bash
# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Financial Data API憑證
FINANCIAL_DATA_LOGIN=your_email@domain.com
FINANCIAL_DATA_PASSWORD=your_password

# 服務器配置
PORT=3000
NODE_ENV=development
```

### 本地開發
```bash
# 啟動本地服務器
npm run dev

# 服務器地址
http://localhost:3000
```

### 生產環境
- 使用AWS Lambda + API Gateway
- 通過Serverless Framework部署
- Financial Data API憑證存儲在AWS Systems Manager Parameter Store

## 📞 技術支援

如有問題，請檢查：
1. 網絡連接是否正常
2. JWT token是否有效
3. 用戶權限是否足夠
4. API端點是否正確
5. 請求格式是否符合要求

## 🔒 安全注意事項

1. **JWT Secret**: 生產環境必須使用強密鑰
2. **HTTPS**: 生產環境必須使用HTTPS
3. **Token存儲**: 前端應安全存儲token（如httpOnly cookie）
4. **Token過期**: 實現自動刷新機制
5. **權限控制**: 根據用戶角色限制API訪問