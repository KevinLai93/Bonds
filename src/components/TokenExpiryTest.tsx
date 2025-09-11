/**
 * Token 失效測試組件
 * 用於測試當 API 回傳 token 失效時的自動登出功能
 */

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { cbondsAPI } from '@/services/cbonds';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const TokenExpiryTest: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    status: 'pending' | 'success' | 'error';
    message: string;
    timestamp: Date;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addTestResult = (test: string, status: 'pending' | 'success' | 'error', message: string) => {
    setTestResults(prev => [...prev, {
      test,
      status,
      message,
      timestamp: new Date()
    }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // 測試 1: 模擬 401 錯誤
  const test401Error = async () => {
    setIsLoading(true);
    addTestResult('401 錯誤測試', 'pending', '正在測試...');
    
    try {
      // 手動設置一個無效的 token 來觸發 401
      const originalToken = localStorage.getItem('token');
      localStorage.setItem('token', 'invalid-token-for-testing');
      
      await cbondsAPI.getProfile();
      
      addTestResult('401 錯誤測試', 'error', '應該觸發 401 錯誤但沒有');
    } catch (error) {
      addTestResult('401 錯誤測試', 'success', `成功捕獲錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      // 恢復原始 token
      if (originalToken) {
        localStorage.setItem('token', originalToken);
      } else {
        localStorage.removeItem('token');
      }
      setIsLoading(false);
    }
  };

  // 測試 2: 模擬 API 回應中的 token 失效錯誤
  const testTokenExpiredResponse = async () => {
    setIsLoading(true);
    addTestResult('Token 失效回應測試', 'pending', '正在測試...');
    
    try {
      // 這個測試需要後端配合，或者我們可以模擬一個會回傳 token 失效的 API 調用
      // 由於我們無法直接控制後端回應，我們將測試事件觸發機制
      
      // 手動觸發 token 失效事件
      window.dispatchEvent(new CustomEvent('tokenExpired', { 
        detail: { message: '測試用的 token 失效事件' } 
      }));
      
      addTestResult('Token 失效回應測試', 'success', '手動觸發 token 失效事件成功');
    } catch (error) {
      addTestResult('Token 失效回應測試', 'error', `測試失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 測試 3: 測試正常的 API 調用
  const testNormalApiCall = async () => {
    setIsLoading(true);
    addTestResult('正常 API 調用測試', 'pending', '正在測試...');
    
    try {
      if (!isAuthenticated) {
        addTestResult('正常 API 調用測試', 'error', '用戶未登入，無法測試');
        return;
      }
      
      await cbondsAPI.getProfile();
      addTestResult('正常 API 調用測試', 'success', 'API 調用成功');
    } catch (error) {
      addTestResult('正常 API 調用測試', 'error', `API 調用失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 測試 4: 清除所有認證資料
  const testClearAuth = () => {
    addTestResult('清除認證資料測試', 'pending', '正在測試...');
    
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('bonds_user');
      localStorage.removeItem('bonds_account_type');
      
      addTestResult('清除認證資料測試', 'success', '成功清除所有認證資料');
    } catch (error) {
      addTestResult('清除認證資料測試', 'error', `清除失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
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
          <CardTitle>Token 失效測試</CardTitle>
          <CardDescription>請先登入以進行測試</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              您需要先登入才能進行 Token 失效測試。
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
          <CardTitle>Token 失效測試</CardTitle>
          <CardDescription>
            測試當 API 回傳 token 失效時的自動登出功能
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={test401Error} 
              disabled={isLoading}
              variant="outline"
            >
              測試 401 錯誤
            </Button>
            <Button 
              onClick={testTokenExpiredResponse} 
              disabled={isLoading}
              variant="outline"
            >
              測試 Token 失效事件
            </Button>
            <Button 
              onClick={testNormalApiCall} 
              disabled={isLoading}
              variant="outline"
            >
              測試正常 API 調用
            </Button>
            <Button 
              onClick={testClearAuth} 
              disabled={isLoading}
              variant="outline"
            >
              清除認證資料
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
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{result.test}</span>
                      {getStatusBadge(result.status)}
                    </div>
                    <p className="text-sm text-gray-600">{result.message}</p>
                    <p className="text-xs text-gray-400">
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

export default TokenExpiryTest;




