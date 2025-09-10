import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { cbondsAPI } from '@/services/cbonds';

interface TestResult {
  id: string;
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export const AccountTypeDebugTest: React.FC = () => {
  const { accountType, user } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addTestResult = (test: string, status: 'success' | 'error' | 'warning', message: string, details?: any) => {
    const result: TestResult = {
      id: Date.now().toString(),
      test,
      status,
      message,
      details
    };
    setTestResults(prev => [...prev, result]);
  };

  const testAccountTypeDetection = async () => {
    setIsLoading(true);
    setTestResults([]);

    try {
      // 測試 masterlink003 登入
      addTestResult('登入測試', 'warning', '正在測試 masterlink003 登入...');
      
      const loginResponse = await cbondsAPI.login('masterlink003', 'masterlink789');
      addTestResult('登入回應', 'success', '登入成功', loginResponse);

      // 測試 profile 獲取
      addTestResult('Profile 測試', 'warning', '正在獲取用戶資料...');
      
      const profileResponse = await cbondsAPI.getProfile();
      addTestResult('Profile 回應', 'success', 'Profile 獲取成功', profileResponse);

      // 分析 accountType
      if (profileResponse.success && profileResponse.accountType) {
        const { type, displayName, category } = profileResponse.accountType;
        addTestResult('帳號類型分析', 'success', `類型: ${type}, 顯示名稱: ${displayName}, 分類: ${category}`, profileResponse.accountType);
        
        if (type === 'masterlink') {
          addTestResult('Masterlink 識別', 'success', '✅ 成功識別為 masterlink 類型');
        } else {
          addTestResult('Masterlink 識別', 'error', `❌ 未識別為 masterlink，實際類型: ${type}`);
        }
      } else {
        addTestResult('帳號類型分析', 'error', '❌ 無法獲取 accountType 資訊');
      }

      // 測試其他 masterlink 帳號
      const testAccounts = [
        { username: 'masterlink001', password: 'masterlink123' },
        { username: 'masterlink002', password: 'masterlink456' }
      ];

      for (const account of testAccounts) {
        try {
          addTestResult(`${account.username} 測試`, 'warning', `正在測試 ${account.username}...`);
          
          const testLoginResponse = await cbondsAPI.login(account.username, account.password);
          if (testLoginResponse.success) {
            const testProfileResponse = await cbondsAPI.getProfile();
            if (testProfileResponse.success && testProfileResponse.accountType) {
              const { type } = testProfileResponse.accountType;
              if (type === 'masterlink') {
                addTestResult(`${account.username} 識別`, 'success', `✅ ${account.username} 正確識別為 masterlink`);
              } else {
                addTestResult(`${account.username} 識別`, 'error', `❌ ${account.username} 未識別為 masterlink，實際類型: ${type}`);
              }
            } else {
              addTestResult(`${account.username} 識別`, 'error', `❌ ${account.username} 無法獲取 accountType`);
            }
          } else {
            addTestResult(`${account.username} 登入`, 'error', `❌ ${account.username} 登入失敗`);
          }
        } catch (error) {
          addTestResult(`${account.username} 測試`, 'error', `❌ ${account.username} 測試失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
        }
      }

    } catch (error) {
      addTestResult('測試失敗', 'error', `測試過程中發生錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>帳號類型識別測試</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={testAccountTypeDetection} 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? '測試中...' : '測試 Masterlink 帳號識別'}
            </Button>
            <Button 
              onClick={clearResults} 
              variant="outline"
              disabled={isLoading}
            >
              清除結果
            </Button>
          </div>

          {/* 當前狀態 */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">當前登入狀態</h3>
            <div className="space-y-1 text-sm">
              <div>用戶名: {user?.username || '未登入'}</div>
              <div>帳號類型: {accountType?.type || '未設定'}</div>
              <div>顯示名稱: {accountType?.displayName || '未設定'}</div>
              <div>分類: {accountType?.category || '未設定'}</div>
            </div>
          </div>

          {/* 測試結果 */}
          {testResults.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">測試結果</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {testResults.map((result) => (
                  <div key={result.id} className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-medium ${getStatusColor(result.status)}`}>
                        {result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⚠️'}
                      </span>
                      <span className="font-semibold">{result.test}</span>
                    </div>
                    <p className="text-sm text-gray-700">{result.message}</p>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer">查看詳細資訊</summary>
                        <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountTypeDebugTest;

