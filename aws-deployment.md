# AWS 部署配置指南

## 環境變數設定

在 AWS 部署時，需要設定以下環境變數：

### 1. 在 AWS 控制台或環境變數中設定：

```bash
# 強制使用 HTTPS
VITE_FORCE_HTTPS=true
VITE_AUTO_PROTOCOL_DETECTION=true

# 生產環境 API 端點（同一台服務器，不同端口）
VITE_PROD_API_BASE_URL_HTTPS=https://bonds.euf.world
VITE_API_BASE_URL_HTTPS=https://bonds.euf.world

# API 端口配置
VITE_API_PORT=80

# Supabase 配置（如果使用）
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 2. 在 package.json 中添加構建腳本：

```json
{
  "scripts": {
    "build:prod": "VITE_FORCE_HTTPS=true npm run build",
    "preview:prod": "npm run build:prod && npm run preview"
  }
}
```

## AWS 部署步驟

### 1. 使用 AWS Amplify 部署：

1. 在 AWS Amplify 控制台創建新應用
2. 連接 GitHub 倉庫
3. 在構建設置中添加環境變數
4. 構建命令：`npm run build:prod`

### 2. 使用 AWS S3 + CloudFront 部署：

1. 構建項目：`npm run build:prod`
2. 上傳 `dist` 文件夾到 S3
3. 配置 CloudFront 分發
4. 設定自定義域名和 SSL 證書

### 3. 使用 AWS Elastic Beanstalk 部署：

1. 創建 `Dockerrun.aws.json` 或使用 Node.js 平台
2. 設定環境變數
3. 部署應用

## 重要注意事項

1. **CORS 設定**：確保後端 API 允許前端域名的跨域請求
2. **SSL 證書**：確保使用有效的 SSL 證書
3. **環境變數**：在 AWS 控制台正確設定所有必要的環境變數
4. **API 端點**：確保 API 端點使用 HTTPS 協議
5. **端口配置**：如果 API 和前端在同一台服務器，確保設定正確的 `VITE_API_PORT`
6. **防火牆設定**：確保 API 端口（如 3000）在 AWS 安全組中開放

## 測試 HTTPS 配置

部署後，可以通過以下方式測試：

1. 檢查瀏覽器開發者工具的 Network 標籤
2. 確認所有 API 請求都使用 HTTPS
3. 檢查控制台是否有混合內容警告
