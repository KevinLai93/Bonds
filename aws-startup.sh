#!/bin/bash

# AWS 啟動腳本
echo "🚀 開始啟動 Bonds 應用..."

# 1. 進入項目目錄
cd /path/to/your/bonds-project

# 2. 安裝 Node.js 依賴
echo "📦 安裝依賴..."
npm install

# 3. 創建生產環境變數檔案
echo "⚙️ 創建生產環境變數檔案..."
cat > .env.production << EOF
# 生產環境 API
VITE_PROD_API_BASE_URL_HTTPS=https://bonds.euf.world
VITE_PROD_API_BASE_URL_HTTP=http://bonds.euf.world

# 強制使用 HTTPS
VITE_FORCE_HTTPS=true
VITE_AUTO_PROTOCOL_DETECTION=true

# API 端口配置
VITE_API_PORT=3000
EOF

# 4. 設定環境變數
echo "⚙️ 設定環境變數..."
export VITE_FORCE_HTTPS=true
export VITE_AUTO_PROTOCOL_DETECTION=true
export VITE_API_PORT=3000
export VITE_PROD_API_BASE_URL_HTTPS=https://bonds.euf.world
export VITE_API_BASE_URL_HTTPS=https://bonds.euf.world

# 5. 構建生產環境
echo "🔨 構建生產環境..."
npm run build:prod

# 6. 安裝 PM2 (進程管理器)
echo "📦 安裝 PM2..."
npm install -g pm2

# 7. 創建 PM2 配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'bonds-frontend',
      script: 'npm',
      args: 'run preview',
      cwd: '/path/to/your/bonds-project',
      env: {
        NODE_ENV: 'production',
        PORT: 8080
      }
    }
  ]
};
EOF

# 8. 啟動應用
echo "🎯 啟動應用..."
pm2 start ecosystem.config.js

# 9. 設定 PM2 開機自啟
pm2 startup
pm2 save

echo "✅ 應用已啟動！"
echo "🌐 前端地址: https://bonds.euf.world"
echo "🔧 API 地址: https://bonds.euf.world:3000"
