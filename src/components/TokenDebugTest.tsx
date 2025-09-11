/**
 * Token 失效調試測試組件
 * 用於測試 INVALID_TOKEN 錯誤是否正確觸發自動登出
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cbondsAPI } from '@/services/cbonds';
import { apiGet } from '@/utils/apiHandler';

const TokenDebugTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testIsin, setTestIsin] = useState('US037833DY36');

  const addResult = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const result = `[${timestamp}] ${message}`;
    setTestResults(prev => [...prev, result]);
    console.log(`[TokenDebug] ${message}`);
  };

  // 監聽 token 失效事件
  useEffect(() => {
    const handleTokenExpired = (event: CustomEvent) => {
      addResult(`✅ TOKEN 失效事件被觸發: ${event.detail?.message || '未知原因'}`, 'success');
    };

    window.addEventListener('tokenExpired', handleTokenExpired as EventListener);
    
    return () => {
      window.removeEventListener('tokenExpired', handleTokenExpired as EventListener);
    };
  }, []);

  const testDirectAPI = async () => {
    setIsLoading(true);
    addResult('🔍 測試直接 API 調用...');
    
    try {
      const result = await apiGet('/api/get_emissions', { 
        isin: testIsin, 
        lang: 'cht' 
      });
      
      if (result.error) {
        addResult(`❌ API 返回錯誤: ${result.error}`, 'error');
      } else {
        addResult(`✅ API 調用成功`, 'success');
      }
    } catch (error) {
      addResult(`❌ API 調用異常: ${error}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const testCbondsAPI = async () => {
    setIsLoading(true);
    addResult('🔍 測試 cbondsAPI 調用...');
    
    try {
      const result = await cbondsAPI.getEmissions(testIsin, 'cht');
      addResult(`✅ cbondsAPI 調用成功`, 'success');
    } catch (error) {
      addResult(`❌ cbondsAPI 調用異常: ${error}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const testInvalidToken = async () => {
    setIsLoading(true);
    addResult('🔍 測試無效 token...');
    
    try {
      // 手動設置無效 token
      localStorage.setItem('token', 'invalid_token_12345');
      
      const result = await apiGet('/api/get_emissions', { 
        isin: testIsin, 
        lang: 'cht' 
      });
      
      if (result.error) {
        addResult(`❌ API 返回錯誤: ${result.error}`, 'error');
      } else {
        addResult(`✅ API 調用成功`, 'success');
      }
    } catch (error) {
      addResult(`❌ API 調用異常: ${error}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const checkCurrentToken = () => {
    const token = localStorage.getItem('token');
    if (token) {
      addResult(`🔑 當前 token: ${token.substring(0, 20)}...`, 'info');
    } else {
      addResult(`❌ 沒有找到 token`, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Token 失效調試測試</CardTitle>
          <CardDescription>
            測試 INVALID_TOKEN 錯誤是否正確觸發自動登出機制
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="testIsin">測試 ISIN</Label>
              <Input
                id="testIsin"
                value={testIsin}
                onChange={(e) => setTestIsin(e.target.value)}
                placeholder="US037833DY36"
              />
            </div>
            <div className="space-y-2">
              <Label>當前狀態</Label>
              <Button onClick={checkCurrentToken} variant="outline" className="w-full">
                檢查 Token
              </Button>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Button 
              onClick={testDirectAPI} 
              disabled={isLoading}
              variant="outline"
            >
              測試直接 API
            </Button>
            <Button 
              onClick={testCbondsAPI} 
              disabled={isLoading}
              variant="outline"
            >
              測試 cbondsAPI
            </Button>
            <Button 
              onClick={testInvalidToken} 
              disabled={isLoading}
              variant="destructive"
            >
              測試無效 Token
            </Button>
          </div>

          <div className="flex justify-between items-center">
            <Button onClick={clearResults} variant="ghost" size="sm">
              清除結果
            </Button>
            <Badge variant={isLoading ? "default" : "secondary"}>
              {isLoading ? "測試中..." : "就緒"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>測試結果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Alert>
        <AlertDescription>
          <strong>說明：</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>「測試直接 API」：使用 apiGet 直接調用 API</li>
            <li>「測試 cbondsAPI」：使用 cbondsAPI 調用 API</li>
            <li>「測試無效 Token」：手動設置無效 token 並測試</li>
            <li>如果 token 失效，應該會觸發自動登出並顯示 toast 提示</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default TokenDebugTest;

