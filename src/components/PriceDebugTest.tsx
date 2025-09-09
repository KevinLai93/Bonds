/**
 * 價格調試測試組件
 * 用於調試 US037833FB15 的 BID 和 Ask 價格問題
 */

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiGet } from '@/utils/apiHandler';

const PriceDebugTest: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    status: 'pending' | 'success' | 'error';
    message: string;
    data?: any;
    timestamp: Date;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isin, setIsin] = useState('US037833FB15');

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

  // 調試 US037833FB15 的價格數據
  const debugPriceData = async () => {
    setIsLoading(true);
    addTestResult('價格數據調試', 'pending', `正在調試 ${isin} 的價格數據...`);
    
    try {
      // 調用交易數據 API - 使用統一的 apiHandler
      const apiUrl = import.meta.env.DEV 
        ? (import.meta.env.VITE_API_BASE_URL_HTTP || 'http://localhost:3000')
        : (import.meta.env.VITE_PROD_API_BASE_URL_HTTP || 'http://localhost:3000');
      
      const response = await apiGet(`${apiUrl}/api/cbonds/get_tradings_new`, {
        isin: isin,
        sort_by: 'date_desc'
      }, true);

      if (response.error) {
        throw new Error(response.error);
      }

      const data = response.data;

      const tradingData = data.items || [];
      
      addTestResult('API 原始數據', 'success', `獲取到 ${tradingData.length} 筆交易數據`, {
        totalRecords: tradingData.length,
        rawData: tradingData.slice(0, 5) // 只顯示前5筆
      });

      // 分析價格數據
      const priceAnalysis = tradingData.map((item: any, index: number) => {
        const buyingQuote = item.buying_quote;
        const sellingQuote = item.selling_quote;
        const lastPrice = item.last_price;
        const bidPrice = parseFloat(buyingQuote || '0');
        const askPrice = parseFloat(sellingQuote || '0');
        const lastPriceNum = parseFloat(lastPrice || '0');
        
        return {
          index,
          date: item.date || item.trading_date,
          rawData: {
            buying_quote: buyingQuote,
            selling_quote: sellingQuote,
            last_price: lastPrice,
            ytm_bid: item.ytm_bid,
            ytm_offer: item.ytm_offer
          },
          parsedData: {
            bidPrice,
            askPrice,
            lastPrice: lastPriceNum
          },
          analysis: {
            bidAskSame: bidPrice === askPrice,
            bidPriceZero: bidPrice === 0,
            askPriceZero: askPrice === 0,
            hasValidPrice: bidPrice > 0 || askPrice > 0 || lastPriceNum > 0,
            spread: askPrice - bidPrice
          }
        };
      });

      addTestResult('價格分析', 'success', `分析了 ${priceAnalysis.length} 筆價格數據`, {
        analysis: priceAnalysis.slice(0, 10), // 只顯示前10筆分析
        summary: {
          totalRecords: priceAnalysis.length,
          bidAskSameCount: priceAnalysis.filter(p => p.analysis.bidAskSame).length,
          bidPriceZeroCount: priceAnalysis.filter(p => p.analysis.bidPriceZero).length,
          askPriceZeroCount: priceAnalysis.filter(p => p.analysis.askPriceZero).length,
          validPriceCount: priceAnalysis.filter(p => p.analysis.hasValidPrice).length
        }
      });

      // 模擬處理邏輯（使用新的價格選擇邏輯）
      const processedData = tradingData
        .map((item: any) => {
          const bidPrice = parseFloat(item.buying_quote || item.bid_price || '0');
          const askPrice = parseFloat(item.selling_quote || item.ask_price || '0');
          const lastPrice = parseFloat(item.last_price || '0');
          
          return {
            ...item,
            bidPrice,
            askPrice,
            lastPrice,
            isSame: bidPrice === askPrice && bidPrice > 0 && askPrice > 0
          };
        })
        .filter((item: any) => {
          return item.bidPrice > 0 || item.askPrice > 0 || item.lastPrice > 0;
        })
        .sort((a: any, b: any) => {
          const dateA = new Date(a.date || a.trading_date || '');
          const dateB = new Date(b.date || b.trading_date || '');
          return dateB.getTime() - dateA.getTime();
        });

      // 使用新的價格選擇邏輯
      let selectedData = null;
      let selectionReason = '';
      
      // 首先尋找 BID 和 Ask 不同的價格
      for (const item of processedData) {
        if (!item.isSame) {
          selectedData = item;
          selectionReason = '找到 BID 和 Ask 不同的價格';
          break;
        }
      }
      
      // 如果沒找到不同的價格，使用最新的價格（即使相同）
      if (!selectedData && processedData.length > 0) {
        selectedData = processedData[0];
        selectionReason = '所有價格都相同，使用最新價格';
      }
      
      addTestResult('價格選擇邏輯', selectedData ? 'success' : 'error', 
        selectedData ? `${selectionReason}: BID=${selectedData.bidPrice}, Ask=${selectedData.askPrice}` : '未找到有效價格', {
        selectedData: selectedData ? {
          date: selectedData.date || selectedData.trading_date,
          bidPrice: selectedData.bidPrice,
          askPrice: selectedData.askPrice,
          lastPrice: selectedData.lastPrice,
          spread: selectedData.askPrice - selectedData.bidPrice,
          isSame: selectedData.isSame
        } : null,
        selectionReason,
        allProcessedData: processedData.slice(0, 5),
        samePriceCount: processedData.filter(p => p.isSame).length
      });

    } catch (error) {
      addTestResult('價格數據調試', 'error', `調試失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
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
          <CardTitle>價格調試測試</CardTitle>
          <CardDescription>請先登入以進行測試</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              您需要先登入才能進行價格調試測試。
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
          <CardTitle>價格調試測試</CardTitle>
          <CardDescription>
            調試 US037833FB15 的 BID 和 Ask 價格問題
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="isin">ISIN 代碼</Label>
            <Input
              id="isin"
              value={isin}
              onChange={(e) => setIsin(e.target.value)}
              placeholder="輸入 ISIN 代碼"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={debugPriceData} 
              disabled={isLoading}
              variant="outline"
            >
              調試價格數據
            </Button>
            <Button 
              onClick={clearResults} 
              disabled={isLoading}
              variant="secondary"
            >
              清除結果
            </Button>
          </div>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>調試結果</CardTitle>
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

export default PriceDebugTest;
