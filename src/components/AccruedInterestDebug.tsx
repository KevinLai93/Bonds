/**
 * 前手息計算調試組件
 * 用於調試特定債券的前手息計算問題
 */

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const AccruedInterestDebug: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [debugResults, setDebugResults] = useState<Array<{
    test: string;
    status: 'pending' | 'success' | 'error';
    message: string;
    data?: any;
    timestamp: Date;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 測試參數
  const [testParams, setTestParams] = useState({
    isin: 'US037833FB15',
    minAmount: '1000',
    couponRate: '1.25',
    frequency: '2', // 每半年
    lastCouponDate: '2025-08-20', // Apple 債券的配息日
    nextCouponDate: '2026-02-20'
  });

  const addDebugResult = (test: string, status: 'pending' | 'success' | 'error', message: string, data?: any) => {
    setDebugResults(prev => [...prev, {
      test,
      status,
      message,
      data,
      timestamp: new Date()
    }]);
  };

  const clearResults = () => {
    setDebugResults([]);
  };

  // 30/360 US rule day count calculation
  const calculateDays360US = (startDate: Date, endDate: Date): number => {
    let d1 = startDate.getDate();
    let d2 = endDate.getDate();
    let m1 = startDate.getMonth() + 1;
    let m2 = endDate.getMonth() + 1;
    let y1 = startDate.getFullYear();
    let y2 = endDate.getFullYear();

    if (d1 === 31) d1 = 30;
    if (d2 === 31 && d1 === 30) d2 = 30;
    if (d2 === 31 && d1 < 30) d2 = 30;
    if (d2 === 31 && d1 === 30) d2 = 30;

    return 360 * (y2 - y1) + 30 * (m2 - m1) + (d2 - d1);
  };

  // 計算前手息
  const calculateAccruedInterest = (minAmount: number, couponRate: number, frequency: number, lastCouponDate: string) => {
    if (couponRate === 0 || minAmount === 0) return 0;
    
    const today = new Date();
    const prevCoupon = new Date(lastCouponDate);
    
    const days360 = calculateDays360US(prevCoupon, today);
    const periodsPerYear = frequency;
    const daysInPeriod = 360 / periodsPerYear;
    
    const periodicCouponAmount = (minAmount * couponRate / 100) / periodsPerYear;
    const accruedInterest = (days360 / daysInPeriod) * periodicCouponAmount;
    
    return {
      days360,
      daysInPeriod,
      periodicCouponAmount,
      accruedInterest: Math.round(accruedInterest * 100) / 100,
      calculation: `(${days360} / ${daysInPeriod}) × ${periodicCouponAmount.toFixed(4)} = ${Math.round(accruedInterest * 100) / 100}`
    };
  };

  // 調試前手息計算
  const debugAccruedInterestCalculation = () => {
    setIsLoading(true);
    addDebugResult('前手息調試', 'pending', `正在調試 ${testParams.isin} 的前手息計算...`);
    
    try {
      const minAmount = parseFloat(testParams.minAmount);
      const couponRate = parseFloat(testParams.couponRate);
      const frequency = parseInt(testParams.frequency);
      
      const result = calculateAccruedInterest(minAmount, couponRate, frequency, testParams.lastCouponDate);
      
      const today = new Date();
      const prevCoupon = new Date(testParams.lastCouponDate);
      
      addDebugResult('計算結果', 'success', 
        `前手息計算完成: ${result.accruedInterest}`, {
        isin: testParams.isin,
        minAmount,
        couponRate,
        frequency,
        lastCouponDate: testParams.lastCouponDate,
        today: today.toISOString().split('T')[0],
        daysElapsed: result.days360,
        daysInPeriod: result.daysInPeriod,
        periodicCouponAmount: result.periodicCouponAmount,
        accruedInterest: result.accruedInterest,
        calculation: result.calculation
      });
      
      // 驗證計算
      const expectedCalculation = `(${result.days360} / ${result.daysInPeriod}) × ${result.periodicCouponAmount.toFixed(4)} = ${result.accruedInterest}`;
      addDebugResult('計算驗證', 'success', 
        `計算公式: ${expectedCalculation}`, {
        formula: '前手息 = (已過天數 / 配息期間天數) × (最小承作面額 × 年利率 / 配息頻率)',
        step1: `已過天數: ${result.days360} 天`,
        step2: `配息期間天數: ${result.daysInPeriod} 天`,
        step3: `每期配息金額: ${result.periodicCouponAmount.toFixed(4)}`,
        step4: `前手息: ${result.accruedInterest}`
      });
      
    } catch (error) {
      addDebugResult('前手息調試', 'error', `調試失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
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
        return <Badge variant="destructive">錯誤</Badge>;
    }
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>前手息計算調試</CardTitle>
          <CardDescription>請先登入以使用調試功能</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>前手息計算調試</CardTitle>
        <CardDescription>調試特定債券的前手息計算問題</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 測試參數 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="isin">ISIN</Label>
            <Input
              id="isin"
              value={testParams.isin}
              onChange={(e) => setTestParams(prev => ({ ...prev, isin: e.target.value }))}
              placeholder="債券ISIN"
            />
          </div>
          <div>
            <Label htmlFor="minAmount">最小承作面額</Label>
            <Input
              id="minAmount"
              type="number"
              value={testParams.minAmount}
              onChange={(e) => setTestParams(prev => ({ ...prev, minAmount: e.target.value }))}
              placeholder="1000"
            />
          </div>
          <div>
            <Label htmlFor="couponRate">票面利率 (%)</Label>
            <Input
              id="couponRate"
              type="number"
              step="0.01"
              value={testParams.couponRate}
              onChange={(e) => setTestParams(prev => ({ ...prev, couponRate: e.target.value }))}
              placeholder="1.25"
            />
          </div>
          <div>
            <Label htmlFor="frequency">配息頻率</Label>
            <Input
              id="frequency"
              type="number"
              value={testParams.frequency}
              onChange={(e) => setTestParams(prev => ({ ...prev, frequency: e.target.value }))}
              placeholder="2"
            />
          </div>
          <div>
            <Label htmlFor="lastCouponDate">上次配息日</Label>
            <Input
              id="lastCouponDate"
              type="date"
              value={testParams.lastCouponDate}
              onChange={(e) => setTestParams(prev => ({ ...prev, lastCouponDate: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="nextCouponDate">下次配息日</Label>
            <Input
              id="nextCouponDate"
              type="date"
              value={testParams.nextCouponDate}
              onChange={(e) => setTestParams(prev => ({ ...prev, nextCouponDate: e.target.value }))}
            />
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="flex gap-2">
          <Button 
            onClick={debugAccruedInterestCalculation} 
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? '調試中...' : '調試前手息計算'}
          </Button>
          <Button 
            onClick={clearResults} 
            variant="outline"
            disabled={isLoading}
          >
            清除結果
          </Button>
        </div>

        {/* 調試結果 */}
        {debugResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">調試結果</h4>
            {debugResults.map((result, index) => (
              <Alert key={index} className={result.status === 'error' ? 'border-red-200 bg-red-50' : result.status === 'success' ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(result.status)}
                    <span className="font-medium">{result.test}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {result.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <AlertDescription className="mt-2">
                  {result.message}
                  {result.data && (
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AccruedInterestDebug;
