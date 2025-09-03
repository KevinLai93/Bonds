# HTTP/HTTPS 協議自動切換設定指南

## 概述

本專案已支援 HTTP 和 HTTPS 協議的自動檢測和切換功能。系統會根據當前頁面的協議自動選擇對應的 API 端點。

## 功能特性

- ✅ 自動檢測當前頁面協議（HTTP/HTTPS）
- ✅ 根據協議自動選擇對應的 API 端點
- ✅ 支援開發環境和生產環境的不同配置
- ✅ 可強制使用 HTTPS
- ✅ 提供協議切換組件
- ✅ 完整的環境變數配置

## 環境變數配置

### 開發環境變數

在 `Bonds/.env.local` 文件中配置以下變數：

```bash
# 開發環境 API 端點
VITE_API_BASE_URL_HTTP=http://localhost:3000
VITE_API_BASE_URL_HTTPS=https://localhost:3000

# Supabase 配置
VITE_SUPABASE_URL_HTTP=http://localhost:54321
VITE_SUPABASE_URL_HTTPS=https://localhost:54321
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# 協議控制
VITE_FORCE_HTTPS=false
VITE_AUTO_PROTOCOL_DETECTION=true
```

### 生產環境變數

```bash
# 生產環境 API 端點
VITE_PROD_API_BASE_URL_HTTP=http://your-production-domain.com
VITE_PROD_API_BASE_URL_HTTPS=https://your-production-domain.com

# 協議控制
VITE_FORCE_HTTPS=true
VITE_AUTO_PROTOCOL_DETECTION=true
```

## 使用方法

### 1. 自動協議檢測

系統會自動檢測當前頁面的協議並選擇對應的 API 端點：

- 如果頁面使用 `https://`，API 請求會發送到 HTTPS 端點
- 如果頁面使用 `http://`，API 請求會發送到 HTTP 端點

### 2. 強制使用 HTTPS

設定 `VITE_FORCE_HTTPS=true` 可以強制所有 API 請求使用 HTTPS：

```bash
VITE_FORCE_HTTPS=true
```

### 3. 禁用自動檢測

設定 `VITE_AUTO_PROTOCOL_DETECTION=false` 可以禁用自動協議檢測：

```bash
VITE_AUTO_PROTOCOL_DETECTION=false
```

### 4. 使用協議切換組件

在需要的地方引入 `ProtocolSwitcher` 組件：

```tsx
import { ProtocolSwitcher } from '@/components/ProtocolSwitcher';

function App() {
  return (
    <div>
      {/* 其他組件 */}
      <ProtocolSwitcher className="mt-4" />
    </div>
  );
}
```

## API 服務更新

### cbonds.ts 服務

已更新 `cbonds.ts` 服務以支援協議自動檢測：

```typescript
import { getDevApiUrl, getProdApiUrl } from '@/utils/protocol';

const getApiUrl = () => {
  if (import.meta.env.DEV) {
    return getDevApiUrl();
  } else {
    return getProdApiUrl();
  }
};
```

### cbondsApi.ts 服務

已更新 `cbondsApi.ts` 服務以支援 Supabase URL 的協議自動檢測：

```typescript
import { getSupabaseUrl } from '@/utils/protocol';

const SUPABASE_URL = getSupabaseUrl();
```

## 協議工具函數

新增了 `src/utils/protocol.ts` 工具文件，提供以下功能：

- `getProtocolConfig()`: 獲取當前協議配置
- `getApiUrlByProtocol()`: 根據協議選擇 API URL
- `shouldUseHttps()`: 檢查是否需要使用 HTTPS
- `getDevApiUrl()`: 獲取開發環境 API URL
- `getProdApiUrl()`: 獲取生產環境 API URL
- `getSupabaseUrl()`: 獲取 Supabase URL
- `switchToHttps()`: 切換到 HTTPS
- `switchToHttp()`: 切換到 HTTP

## 部署建議

### 開發環境

1. 確保後端 API 同時支援 HTTP 和 HTTPS
2. 配置 SSL 證書用於 HTTPS 連接
3. 設定環境變數指向正確的端點

### 生產環境

1. 建議強制使用 HTTPS：`VITE_FORCE_HTTPS=true`
2. 配置正確的生產環境 API 端點
3. 確保 SSL 證書有效

## 故障排除

### 常見問題

1. **API 請求失敗**
   - 檢查環境變數是否正確設定
   - 確認後端 API 支援對應的協議
   - 檢查 SSL 證書是否有效

2. **協議切換不生效**
   - 確認 `VITE_AUTO_PROTOCOL_DETECTION` 設定為 `true`
   - 檢查瀏覽器是否支援協議切換
   - 確認沒有被 `VITE_FORCE_HTTPS` 強制設定

3. **開發環境 HTTPS 連接失敗**
   - 確認本地 SSL 證書配置正確
   - 檢查防火牆設定
   - 確認端口沒有被佔用

### 調試方法

1. 檢查瀏覽器開發者工具的 Network 標籤
2. 查看控制台日誌中的 API URL 資訊
3. 使用 `ProtocolSwitcher` 組件檢查當前協議狀態

## 安全注意事項

1. 生產環境建議強制使用 HTTPS
2. 定期更新 SSL 證書
3. 確保 API 端點的安全性
4. 不要在環境變數中暴露敏感資訊

## 更新日誌

- **v1.0.0**: 初始版本，支援 HTTP/HTTPS 自動切換
- 新增協議檢測工具函數
- 新增協議切換組件
- 更新 API 服務以支援協議自動檢測
