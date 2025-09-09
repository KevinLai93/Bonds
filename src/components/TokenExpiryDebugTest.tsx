/**
 * Token 失效調試測試組件
 * 用於測試 INVALID_TOKEN 錯誤是否正確觸發自動登出
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { apiGet } from '@/utils/apiHandler';

const TokenExpiryDebugTest: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    status: 'pending' | 'success' | 'error';
    message: string;
    data?: any;
    timestamp: Date;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  // 監聽 token 失效事件
  useEffect(() => {
    const handleTokenExpired = (event: CustomEvent) => {
      console.log('TokenExpiryDebugTest 收到 token 失效事件:', event.detail);
      addTestResult('Token 失效事件', 'success', `收到 token 失效事件: ${event.detail?.message}`, event.detail);
    };

    window.addEventListener('tokenExpired', handleTokenExpired as EventListener);
    
    return () => {
      window.removeEventListener('tokenExpired', handleTokenExpired as EventListener);
    };
  }, []);

  // 測試正常的 API 調用
  const testNormalApiCall = async () => {
    setIsLoading(true);
    addTestResult('正常 API 調用', 'pending', '正在測試正常的 API 調用...');
    
    try {
      const apiUrl = import.meta.env.DEV 
        ? (import.meta.env.VITE_API_BASE_URL_HTTP || 'http://localhost:3000')
        : (import.meta.env.VITE_PROD_API_BASE_URL_HTTP || 'http://localhost:3000');
      
      const response = await apiGet(`${apiUrl}/api/profile`, {}, true);
      
      if (response.error) {
        addTestResult('正常 API 調用', 'error', `API 調用失敗: ${response.error}`);
      } else {
        addTestResult('正常 API 調用', 'success', 'API 調用成功', response.data);
      }
    } catch (error) {
      addTestResult('正常 API 調用', 'error', `API 調用異常: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 模擬 token 失效的 API 調用
  const testInvalidTokenCall = async () => {
    setIsLoading(true);
    addTestResult('模擬 Token 失效', 'pending', '正在模擬 token 失效情況...');
    
    try {
      // 先清除 token
      localStorage.removeItem('token');
      
      const apiUrl = import.meta.env.DEV 
        ? (import.meta.env.VITE_API_BASE_URL_HTTP || 'http://localhost:3000')
        : (import.meta.env.VITE_PROD_API_BASE_URL_HTTP || 'http://localhost:3000');
      
      const response = await apiGet(`${apiUrl}/api/profile`, {}, true);
      
      if (response.error) {
        addTestResult('模擬 Token 失效', 'success', `預期的錯誤: ${response.error}`, response);
      } else {
        addTestResult('模擬 Token 失效', 'error', '應該返回錯誤但沒有');
      }
    } catch (error) {
      addTestResult('模擬 Token 失效', 'success', `捕獲到異常: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 測試手動觸發 token 失效事件
  const testManualTokenExpired = () => {
    addTestResult('手動觸發 Token 失效', 'pending', '正在手動觸發 token 失效事件...');
    
    // 手動觸發 token 失效事件
    window.dispatchEvent(new CustomEvent('tokenExpired', { 
      detail: { message: '手動觸發的 token 失效測試' } 
    }));
    
    addTestResult('手動觸發 Token 失效', 'success', '已手動觸發 token 失效事件');
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
          <CardTitle>Token 失效調試測試</CardTitle>
          <CardDescription>請先登入以進行測試</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              您需要先登入才能進行 token 失效調試測試。
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
          <CardTitle>Token 失效調試測試</CardTitle>
          <CardDescription>
            測試 INVALID_TOKEN 錯誤是否正確觸發自動登出機制
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={testNormalApiCall} 
              disabled={isLoading}
              variant="outline"
            >
              測試正常 API 調用
            </Button>
            <Button 
              onClick={testInvalidTokenCall} 
              disabled={isLoading}
              variant="outline"
            >
              模擬 Token 失效
            </Button>
            <Button 
              onClick={testManualTokenExpired} 
              disabled={isLoading}
              variant="outline"
            >
              手動觸發 Token 失效
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

export default TokenExpiryDebugTest;
