/**
 * 價格過濾測試組件
 * 用於測試價格為0的資料過濾功能
 */

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { cbondsAPI } from '@/services/cbonds';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PriceFilterTest: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    status: 'pending' | 'success' | 'error';
    message: string;
    data?: any;
    timestamp: Date;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testIsin, setTestIsin] = useState('US037833DY36');

  const addTestResult = (test: string, status: 'pending' | 'success' | 'error', message: string, data?: any) => {
    setTestResults(prev => [...prev, {
      test,
      status,
      message,
      data,
      timestamp: new Date()
    }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // 測試價格過濾功能
  const testPriceFiltering = async () => {
    if (!testIsin.trim()) {
      addTestResult('價格過濾測試', 'error', '請輸入 ISIN 代碼');
      return;
    }

    setIsLoading(true);
    addTestResult('價格過濾測試', 'pending', '正在測試價格過濾功能...');
    
    try {
      // 獲取交易資料
      const tradingResponse = await cbondsAPI.getTradingsNew(testIsin, 'date_desc');
      
      if (!tradingResponse?.items) {
        addTestResult('價格過濾測試', 'error', '沒有獲取到交易資料');
        return;
      }

      const rawItems = tradingResponse.items;
      const totalItems = rawItems.length;
      
      // 分析原始資料
      const zeroPriceItems = rawItems.filter((item: any) => {
        const bidPrice = parseFloat(item.buying_quote || item.bid_price || '0');
        const askPrice = parseFloat(item.selling_quote || item.ask_price || '0');
        const lastPrice = parseFloat(item.last_price || '0');
        return bidPrice === 0 && askPrice === 0 && lastPrice === 0;
      });

      const validItems = rawItems.filter((item: any) => {
        const bidPrice = parseFloat(item.buying_quote || item.bid_price || '0');
        const askPrice = parseFloat(item.selling_quote || item.ask_price || '0');
        const lastPrice = parseFloat(item.last_price || '0');
        return bidPrice > 0 || askPrice > 0 || lastPrice > 0;
      });

      // 按日期排序
      const sortedValidItems = validItems.sort((a: any, b: any) => {
        const dateA = new Date(a.date || a.trading_date || '');
        const dateB = new Date(b.date || b.trading_date || '');
        return dateB.getTime() - dateA.getTime();
      });

      const latestValidItem = sortedValidItems[0];

      addTestResult('價格過濾測試', 'success', 
        `成功過濾價格資料。總共 ${totalItems} 筆，其中 ${zeroPriceItems.length} 筆價格為0，${validItems.length} 筆有效價格`, 
        {
          totalItems,
          zeroPriceItems: zeroPriceItems.length,
          validItems: validItems.length,
          latestValidItem: latestValidItem ? {
            date: latestValidItem.date || latestValidItem.trading_date,
            bidPrice: parseFloat(latestValidItem.buying_quote || latestValidItem.bid_price || '0'),
            askPrice: parseFloat(latestValidItem.selling_quote || latestValidItem.ask_price || '0'),
            lastPrice: parseFloat(latestValidItem.last_price || '0')
          } : null
        }
      );

    } catch (error) {
      addTestResult('價格過濾測試', 'error', `測試失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 測試完整債券搜尋流程
  const testFullBondSearch = async () => {
    if (!testIsin.trim()) {
      addTestResult('完整搜尋測試', 'error', '請輸入 ISIN 代碼');
      return;
    }

    setIsLoading(true);
    addTestResult('完整搜尋測試', 'pending', '正在測試完整債券搜尋流程...');
    
    try {
      // 這裡我們需要模擬 BondSearchContext 的搜尋流程
      // 由於我們無法直接調用 context，我們手動調用 API 來模擬
      const [emissionsResponse, tradingsResponse] = await Promise.allSettled([
        cbondsAPI.getEmissions(testIsin, 'cht'),
        cbondsAPI.getTradingsNew(testIsin, 'date_desc')
      ]);

      if (emissionsResponse.status === 'fulfilled' && tradingsResponse.status === 'fulfilled') {
        const emission = emissionsResponse.value?.items?.[0];
        const tradingData = tradingsResponse.value?.items || [];

        if (emission) {
          // 模擬價格過濾邏輯
          const validTradingItems = tradingData.filter((item: any) => {
            const bidPrice = parseFloat(item.buying_quote || item.bid_price || '0');
            const askPrice = parseFloat(item.selling_quote || item.ask_price || '0');
            const lastPrice = parseFloat(item.last_price || '0');
            return bidPrice > 0 || askPrice > 0 || lastPrice > 0;
          });

          const sortedItems = validTradingItems.sort((a: any, b: any) => {
            const dateA = new Date(a.date || a.trading_date || '');
            const dateB = new Date(b.date || b.trading_date || '');
            return dateB.getTime() - dateA.getTime();
          });

          const latestItem = sortedItems[0];

          addTestResult('完整搜尋測試', 'success', 
            `完整搜尋成功。找到 ${validTradingItems.length} 筆有效交易資料`, 
            {
              bondName: emission.name_eng || emission.name_cht,
              isin: emission.isin_code,
              totalTradingItems: tradingData.length,
              validTradingItems: validTradingItems.length,
              latestPrice: latestItem ? {
                date: latestItem.date || latestItem.trading_date,
                bidPrice: parseFloat(latestItem.buying_quote || latestItem.bid_price || '0'),
                askPrice: parseFloat(latestItem.selling_quote || latestItem.ask_price || '0'),
                lastPrice: parseFloat(latestItem.last_price || '0')
              } : null
            }
          );
        } else {
          addTestResult('完整搜尋測試', 'error', '沒有找到債券資料');
        }
      } else {
        addTestResult('完整搜尋測試', 'error', 'API 調用失敗');
      }

    } catch (error) {
      addTestResult('完整搜尋測試', 'error', `測試失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">進行中</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-500">成功</Badge>;
      case 'error':
        return <Badge variant="destructive">失敗</Badge>;
    }
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>價格過濾測試</CardTitle>
          <CardDescription>請先登入以進行測試</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              您需要先登入才能進行價格過濾測試。
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>價格過濾測試</CardTitle>
          <CardDescription>
            測試當交易資料中價格為0時的過濾功能
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-isin">測試 ISIN 代碼</Label>
            <Input
              id="test-isin"
              value={testIsin}
              onChange={(e) => setTestIsin(e.target.value)}
              placeholder="輸入 ISIN 代碼，例如：US037833DY36"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={testPriceFiltering} 
              disabled={isLoading}
              variant="outline"
            >
              測試價格過濾
            </Button>
            <Button 
              onClick={testFullBondSearch} 
              disabled={isLoading}
              variant="outline"
            >
              測試完整搜尋
            </Button>
            <Button 
              onClick={clearResults} 
              disabled={isLoading}
              variant="secondary"
            >
              清除結果
            </Button>
          </div>
          
          <div className="text-sm text-gray-600">
            <p><strong>當前用戶:</strong> {user?.username}</p>
            <p><strong>認證狀態:</strong> {isAuthenticated ? '已登入' : '未登入'}</p>
          </div>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>測試結果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{result.test}</span>
                      {getStatusBadge(result.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                    {result.data && (
                      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        <pre>{JSON.stringify(result.data, null, 2)}</pre>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {result.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PriceFilterTest;


