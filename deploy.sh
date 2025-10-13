#!/bin/bash

# ====================================================
# 前端 AWS 部署腳本
# ====================================================

set -e  # 遇到錯誤立即退出

echo "🚀 開始部署前端到 AWS..."
echo "================================"

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 函數：打印彩色訊息
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 檢查 Node.js 版本
echo ""
echo "📋 檢查環境..."
NODE_VERSION=$(node --version)
print_status "Node.js 版本: $NODE_VERSION"

NPM_VERSION=$(npm --version)
print_status "npm 版本: $NPM_VERSION"

# 步驟 1: 更新代碼
echo ""
echo "📥 步驟 1: 更新代碼..."
if [ -d ".git" ]; then
    git pull origin main
    print_status "代碼更新完成"
else
    print_warning "不是 Git 倉庫，跳過代碼更新"
fi

# 步驟 2: 安裝依賴
echo ""
echo "📦 步驟 2: 安裝依賴..."
npm install
print_status "依賴安裝完成"

# 步驟 3: 清理舊文件
echo ""
echo "🧹 步驟 3: 清理舊文件..."
rm -rf dist node_modules/.vite
print_status "舊文件清理完成"

# 步驟 4: 構建項目
echo ""
echo "🔨 步驟 4: 構建項目..."
echo "構建中... (這可能需要幾分鐘)"
npm run build 2>&1 | tee build.log

# 檢查構建結果
if [ $? -eq 0 ]; then
    print_status "構建成功完成"
else
    print_error "構建失敗，請檢查 build.log"
    exit 1
fi

# 步驟 5: 檢查構建輸出
echo ""
echo "📊 步驟 5: 檢查構建結果..."

if [ -d "dist" ]; then
    DIST_SIZE=$(du -sh dist/ | cut -f1)
    print_status "dist 目錄大小: $DIST_SIZE"
    
    if [ -f "dist/index.html" ]; then
        print_status "index.html 存在"
    else
        print_error "index.html 不存在"
        exit 1
    fi
    
    ASSET_COUNT=$(find dist/assets -name "*.js" -o -name "*.css" 2>/dev/null | wc -l)
    print_status "靜態資源文件數量: $ASSET_COUNT"
else
    print_error "dist 目錄不存在"
    exit 1
fi

# 步驟 6: 檢查構建日誌中的錯誤
echo ""
echo "🔍 步驟 6: 檢查構建日誌..."

ERROR_COUNT=$(grep -i "error" build.log | wc -l)
WARNING_COUNT=$(grep -i "warning" build.log | wc -l)

if [ $ERROR_COUNT -gt 0 ]; then
    print_warning "發現 $ERROR_COUNT 個錯誤"
    echo "最近的錯誤："
    grep -i "error" build.log | tail -5
else
    print_status "沒有發現錯誤"
fi

if [ $WARNING_COUNT -gt 0 ]; then
    print_warning "發現 $WARNING_COUNT 個警告"
else
    print_status "沒有發現警告"
fi

# 步驟 7: 生成部署報告
echo ""
echo "📋 步驟 7: 生成部署報告..."

DEPLOY_TIME=$(date '+%Y-%m-%d %H:%M:%S')
REPORT_FILE="deploy-report-$(date +%Y%m%d-%H%M%S).txt"

cat > $REPORT_FILE << EOF
前端部署報告
============
部署時間: $DEPLOY_TIME
Node.js 版本: $NODE_VERSION
npm 版本: $NPM_VERSION
構建狀態: 成功
dist 目錄大小: $DIST_SIZE
靜態資源數量: $ASSET_COUNT
錯誤數量: $ERROR_COUNT
警告數量: $WARNING_COUNT

文件結構:
$(find dist -type f | head -20)

構建日誌摘要:
$(tail -20 build.log)
EOF

print_status "部署報告已生成: $REPORT_FILE"

# 完成
echo ""
echo "🎉 部署完成！"
echo "================================"
print_status "前端已成功構建到 dist/ 目錄"
print_status "請配置 Nginx 指向 dist/ 目錄"
print_status "部署報告: $REPORT_FILE"

echo ""
echo "📝 下一步："
echo "1. 配置 Nginx 指向 dist/ 目錄"
echo "2. 重啟 Nginx: sudo systemctl restart nginx"
echo "3. 測試網站訪問"

# 顯示 Nginx 配置提示
echo ""
echo "💡 Nginx 配置範例："
echo "server {"
echo "    listen 80;"
echo "    server_name your-domain.com;"
echo "    root $(pwd)/dist;"
echo "    index index.html;"
echo "    location / {"
echo "        try_files \$uri \$uri/ /index.html;"
echo "    }"
echo "}"
