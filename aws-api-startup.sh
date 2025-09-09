#!/bin/bash

# AWS API 啟動腳本
echo "🚀 開始啟動 Bonds API..."

# 1. 進入 API 目錄（假設 API 在另一個目錄）
cd /path/to/your/api-directory

# 2. 安裝 API 依賴
echo "📦 安裝 API 依賴..."
npm install

# 3. 設定 API 環境變數
echo "⚙️ 設定 API 環境變數..."
export NODE_ENV=production
export PORT=3000
export CORS_ORIGIN=http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8080

# 4. 創建 API PM2 配置
cat > api-ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'bonds-api',
      script: 'server.js', // 或您的 API 入口文件
      cwd: '/path/to/your/api-directory',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        CORS_ORIGIN: 'http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8080'
      }
    }
  ]
};
EOF

# 5. 啟動 API
echo "🎯 啟動 API..."
pm2 start api-ecosystem.config.js

# 6. 設定 PM2 開機自啟
pm2 startup
pm2 save

echo "✅ API 已啟動！"
echo "🔧 API 地址: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000"



