import React, { useState, useEffect } from 'react';
import { ProtocolSwitcher } from '@/components/ProtocolSwitcher';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getProtocolConfig, getDevApiUrl, getProdApiUrl, getSupabaseUrl } from '@/utils/protocol';
import { cbondsAPI } from '@/services/cbonds';
import { useBondSearch } from '@/contexts/BondSearchContext';

export const ProtocolTest: React.FC = () => {
  const [protocolConfig, setProtocolConfig] = useState(getProtocolConfig());
  const [apiUrls, setApiUrls] = useState({
    dev: '',
    prod: '',
    supabase: ''
  });
  const [testResult, setTestResult] = useState<string>('');
  const [bondTestResult, setBondTestResult] = useState<string>('');
  const { searchByISIN, bond, extendedBond, loading, error } = useBondSearch();

  useEffect(() => {
    // 更新協議配置和 API URLs
    const config = getProtocolConfig();
    setProtocolConfig(config);
    setApiUrls({
      dev: getDevApiUrl(),
      prod: getProdApiUrl(),
      supabase: getSupabaseUrl()
    });
  }, []);

  const testApiConnection = async () => {
    setTestResult('測試中...');
    try {
      const result = await cbondsAPI.healthCheck();
      setTestResult(`✅ API 連接成功: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      setTestResult(`❌ API 連接失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  const testBondData = async () => {
    setBondTestResult('測試債券數據中...');
    try {
      await searchByISIN('US037833DY36');
      setBondTestResult('✅ 債券數據測試完成，請查看下方結果');
    } catch (error) {
      setBondTestResult(`❌ 債券數據測試失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">協議切換測試頁面</h1>
        <p className="text-muted-foreground">
          測試 HTTP/HTTPS 協議自動切換功能
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 協議切換組件 */}
        <ProtocolSwitcher />

        {/* 當前配置資訊 */}
        <Card>
          <CardHeader>
            <CardTitle>當前配置</CardTitle>
            <CardDescription>顯示當前的協議和 API 配置</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>當前協議:</span>
                <Badge variant={protocolConfig.isHttps ? 'default' : 'secondary'}>
                  {protocolConfig.currentProtocol.toUpperCase()}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>強制 HTTPS:</span>
                <Badge variant={protocolConfig.forceHttps ? 'default' : 'outline'}>
                  {protocolConfig.forceHttps ? '啟用' : '停用'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>自動檢測:</span>
                <Badge variant={protocolConfig.autoDetection ? 'default' : 'outline'}>
                  {protocolConfig.autoDetection ? '啟用' : '停用'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API URLs 資訊 */}
      <Card>
        <CardHeader>
          <CardTitle>API 端點配置</CardTitle>
          <CardDescription>顯示當前使用的 API 端點</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div>
              <span className="font-medium">開發環境 API:</span>
              <code className="ml-2 px-2 py-1 bg-muted rounded text-sm">
                {apiUrls.dev}
              </code>
            </div>
            <div>
              <span className="font-medium">生產環境 API:</span>
              <code className="ml-2 px-2 py-1 bg-muted rounded text-sm">
                {apiUrls.prod}
              </code>
            </div>
            <div>
              <span className="font-medium">Supabase URL:</span>
              <code className="ml-2 px-2 py-1 bg-muted rounded text-sm">
                {apiUrls.supabase}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API 連接測試 */}
      <Card>
        <CardHeader>
          <CardTitle>API 連接測試</CardTitle>
          <CardDescription>測試當前配置的 API 連接</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testApiConnection} className="w-full">
            測試 API 連接
          </Button>
          {testResult && (
            <div className="p-4 bg-muted rounded-lg">
              <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 債券數據測試 */}
      <Card>
        <CardHeader>
          <CardTitle>債券數據測試</CardTitle>
          <CardDescription>測試債券價格數據映射功能</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testBondData} disabled={loading} className="w-full">
            {loading ? '測試中...' : '測試債券數據 (US037833DY36)'}
          </Button>
          {bondTestResult && (
            <div className="p-4 bg-muted rounded-lg">
              <pre className="text-sm whitespace-pre-wrap">{bondTestResult}</pre>
            </div>
          )}
          
          {/* 顯示債券數據結果 */}
          {bond && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold mb-2">債券基本信息:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>ISIN: {bond.isin}</div>
                <div>發行人: {bond.issuer}</div>
                <div>幣別: {bond.currency}</div>
                <div>票面利率: {bond.couponRate.toFixed(2)}%</div>
              </div>
            </div>
          )}
          
          {extendedBond && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-2">價格數據:</h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>買入價: {extendedBond.bidPrice.toFixed(2)}</div>
                <div>賣出價: {extendedBond.askPrice.toFixed(2)}</div>
                <div>到期殖利率: {(extendedBond.yieldToMaturity * 100).toFixed(2)}%</div>
              </div>
              {extendedBond.latestTrading && (
                <div className="mt-2 text-xs text-gray-600">
                  最新交易數據: {extendedBond.latestTrading.tradingDate}
                </div>
              )}
            </div>
          )}
          
          {error && (
            <div className="p-4 bg-red-50 rounded-lg">
              <h4 className="font-semibold text-red-600 mb-2">錯誤:</h4>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 使用說明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用說明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <p>1. 使用上方的協議切換組件來切換 HTTP/HTTPS</p>
            <p>2. 系統會自動檢測當前頁面的協議並選擇對應的 API 端點</p>
            <p>3. 點擊「測試 API 連接」按鈕來驗證當前配置是否正常</p>
            <p>4. 查看「當前配置」和「API 端點配置」來了解系統狀態</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
