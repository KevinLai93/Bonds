# Token 失效自動登出功能實現

## 概述

當任意 API 回傳 token 失效時，系統會自動執行登出操作，清除本地認證資料並跳轉到登入頁面。

## 實現的功能

### 1. 統一的 API 處理工具 (`src/utils/apiHandler.ts`)

創建了統一的 API 調用工具，自動處理所有 token 失效情況：

- **自動檢測多種 token 失效格式**：
  - `error: "Invalid token"`
  - `code: "INVALID_TOKEN"`
  - `message: "The provided token is invalid or expired"`
  - `error: "認證已過期，請重新登入"`
  - `error: "當前登入已失效，請重新登入"`
  - HTTP 401 狀態碼

- **自動清除認證資料**：
  - 清除 `localStorage` 中的 token
  - 清除用戶資料
  - 清除帳戶類型資料

- **觸發登出事件**：
  - 發送 `tokenExpired` 自定義事件
  - 包含錯誤訊息詳情

### 2. 更新現有 API 服務

#### `src/services/cbonds.ts`
- 使用統一的 `apiGet` 和 `apiPost` 函數
- 所有 API 調用都自動包含 token 失效處理
- 簡化了錯誤處理邏輯

#### `src/services/cbondsApi.ts`
- 更新為使用統一的 API 處理工具
- 保持 Supabase 認證的獨立性

### 3. 認證上下文監聽 (`src/contexts/AuthContext.tsx`)

- **事件監聽器**：監聽 `tokenExpired` 事件
- **自動登出**：清除所有認證狀態
- **用戶提示**：顯示 toast 錯誤訊息
- **頁面跳轉**：自動跳轉到登入頁面

### 4. 測試頁面 (`/token-test`)

創建了專門的測試頁面來驗證功能：

- **401 錯誤測試**：模擬無效 token 觸發 401
- **Token 失效事件測試**：手動觸發 token 失效事件
- **正常 API 調用測試**：驗證正常情況下的 API 調用
- **清除認證資料測試**：測試資料清除功能

## 使用方式

### 訪問測試頁面
```
http://localhost:8080/token-test
```

### 在代碼中使用統一的 API 工具

```typescript
import { apiGet, apiPost, apiPut, apiDelete } from '@/utils/apiHandler';

// GET 請求
const response = await apiGet('/api/endpoint', { param: 'value' }, true);

// POST 請求
const response = await apiPost('/api/endpoint', { data: 'value' }, true);

// 檢查回應
if (response.error) {
  console.error('API 錯誤:', response.error);
} else {
  console.log('API 成功:', response.data);
}
```

## 支援的錯誤格式

系統會自動檢測以下 token 失效錯誤格式：

1. **HTTP 狀態碼**：
   - `401 Unauthorized`

2. **JSON 回應錯誤**：
   ```json
   {
     "error": "Invalid token",
     "message": "The provided token is invalid or expired",
     "code": "INVALID_TOKEN"
   }
   ```

3. **中文錯誤訊息**：
   ```json
   {
     "error": "認證已過期，請重新登入"
   }
   ```

4. **其他格式**：
   ```json
   {
     "error": "當前登入已失效，請重新登入"
   }
   ```

## 自動處理流程

1. **API 調用**：使用統一的 API 工具發送請求
2. **錯誤檢測**：自動檢測 HTTP 狀態碼和回應內容
3. **資料清除**：清除所有本地認證資料
4. **事件觸發**：發送 `tokenExpired` 事件
5. **用戶提示**：顯示錯誤訊息 toast
6. **頁面跳轉**：自動跳轉到登入頁面

## 技術細節

### 事件系統
```typescript
// 觸發 token 失效事件
window.dispatchEvent(new CustomEvent('tokenExpired', { 
  detail: { message: '當前登入已失效，請重新登入' } 
}));

// 監聽事件
window.addEventListener('tokenExpired', (event: CustomEvent) => {
  // 處理登出邏輯
});
```

### 認證資料清除
```typescript
localStorage.removeItem('token');
localStorage.removeItem('bonds_user');
localStorage.removeItem('bonds_account_type');
```

## 測試建議

1. **正常登入**：確保正常登入流程不受影響
2. **Token 失效**：測試各種 token 失效情況
3. **API 錯誤**：測試其他 API 錯誤是否正常處理
4. **頁面跳轉**：確保登出後正確跳轉到登入頁面
5. **資料清除**：確認所有認證資料都被正確清除

## 注意事項

- 所有 API 調用都應該使用統一的 `apiHandler` 工具
- 避免直接使用 `fetch` 進行需要認證的 API 調用
- 測試頁面僅用於開發環境，生產環境應移除
- 確保後端 API 回傳的錯誤格式符合預期

## 文件結構

```
src/
├── utils/
│   └── apiHandler.ts          # 統一的 API 處理工具
├── services/
│   ├── cbonds.ts             # 更新為使用統一工具
│   └── cbondsApi.ts          # 更新為使用統一工具
├── contexts/
│   └── AuthContext.tsx       # 監聽 token 失效事件
├── components/
│   └── TokenExpiryTest.tsx   # 測試組件
└── pages/
    └── TokenTestPage.tsx     # 測試頁面
```



