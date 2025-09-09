/**
 * Token 測試頁面
 * 用於測試 token 失效自動登出功能
 */

import React from 'react';
import TokenExpiryTest from '@/components/TokenExpiryTest';
import TokenExpiryDebugTest from '@/components/TokenExpiryDebugTest';
import PriceFilterTest from '@/components/PriceFilterTest';
import AccruedInterestTest from '@/components/AccruedInterestTest';
import PriceDebugTest from '@/components/PriceDebugTest';
import AccruedInterestDebug from '@/components/AccruedInterestDebug';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TokenTestPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">系統測試頁面</h1>
        <p className="text-gray-600">
          測試系統的各種功能，包括 token 失效處理和價格過濾
        </p>
      </div>

      <Alert>
        <AlertDescription>
          <strong>注意:</strong> 這個頁面用於測試系統的各種功能。
          請確保您已經登入，然後可以進行各種測試來驗證系統是否正常運作。
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="token-test" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="token-test">Token 失效測試</TabsTrigger>
          <TabsTrigger value="token-debug">Token 調試測試</TabsTrigger>
          <TabsTrigger value="price-filter">價格過濾測試</TabsTrigger>
          <TabsTrigger value="accrued-interest">前手息計算測試</TabsTrigger>
          <TabsTrigger value="accrued-debug">前手息調試</TabsTrigger>
          <TabsTrigger value="price-debug">價格調試測試</TabsTrigger>
        </TabsList>
        
        <TabsContent value="token-test" className="space-y-4">
          <TokenExpiryTest />
        </TabsContent>
        
        <TabsContent value="token-debug" className="space-y-4">
          <TokenExpiryDebugTest />
        </TabsContent>
        
        <TabsContent value="price-filter" className="space-y-4">
          <PriceFilterTest />
        </TabsContent>
        
        <TabsContent value="accrued-interest" className="space-y-4">
          <AccruedInterestTest />
        </TabsContent>
        
        <TabsContent value="accrued-debug" className="space-y-4">
          <AccruedInterestDebug />
        </TabsContent>
        
        <TabsContent value="price-debug" className="space-y-4">
          <PriceDebugTest />
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>功能說明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Token 失效處理功能:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>統一的 API 處理工具，自動檢測 token 失效</li>
              <li>當 API 回傳 401 狀態碼時自動清除認證資料</li>
              <li>當 API 回應包含 token 失效錯誤時自動觸發登出</li>
              <li>自動跳轉到登入頁面並顯示錯誤訊息</li>
              <li>支援多種 token 失效錯誤格式的檢測</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">價格過濾功能:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>自動過濾掉價格為0的交易資料</li>
              <li>按日期排序，確保取得最新的有效價格</li>
              <li>至少有一個價格不為0的資料才會被保留</li>
              <li>優先使用最新的有效 BID 和 Ask 價格</li>
              <li>如果最新資料價格為0，會繼續尋找更早的有效資料</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">前手息計算功能:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>基於最小承作面額計算前手息</li>
              <li>使用30/360 US規則進行精確計算</li>
              <li>當最小承作面額改變時自動重新計算</li>
              <li>當票面利率或付息頻率改變時自動重新計算</li>
              <li>前手息變動時同步更新總交割金額</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">價格調試功能:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>調試特定債券的 BID 和 Ask 價格問題</li>
              <li>分析 API 返回的原始價格數據</li>
              <li>檢查數據處理邏輯是否正確</li>
              <li>識別價格相同的原因</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">支援的錯誤格式:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li><code>error: "Invalid token"</code></li>
              <li><code>code: "INVALID_TOKEN"</code></li>
              <li><code>message: "The provided token is invalid or expired"</code></li>
              <li><code>error: "認證已過期，請重新登入"</code></li>
              <li><code>error: "當前登入已失效，請重新登入"</code></li>
              <li>HTTP 401 狀態碼</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenTestPage;
