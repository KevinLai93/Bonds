/**
 * 前手息計算測試組件
 * 用於測試前手息計算邏輯是否正確
 */

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const AccruedInterestTest: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    status: 'pending' | 'success' | 'error';
    message: string;
    data?: any;
    timestamp: Date;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 測試參數
  const [testParams, setTestParams] = useState({
    minAmount: '10000',
    couponRate: '2.5',
    frequency: '2', // 每半年
    lastCouponDate: '2024-06-15',
    transactionAmount: '1000000'
  });

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
  const calculateAccruedInterest = (minAmount: number, couponRate: number, frequency: number, lastCouponDate?: string) => {
    if (couponRate === 0 || minAmount === 0) return 0;
    
    if (lastCouponDate) {
      const today = new Date();
      const prevCoupon = new Date(lastCouponDate);
      
      const days360 = calculateDays360US(prevCoupon, today);
      const periodsPerYear = frequency;
      const daysInPeriod = 360 / periodsPerYear;
      
      const periodicCouponAmount = (minAmount * couponRate / 100) / periodsPerYear;
      const accruedInterest = (days360 / daysInPeriod) * periodicCouponAmount;
      
      return Math.round(accruedInterest * 100) / 100;
    }
    
    const periodsPerYear = frequency;
    const accruedInterest = (minAmount * couponRate / 100) / periodsPerYear;
    
    return Math.round(accruedInterest * 100) / 100;
  };

  // 測試前手息計算
  const testAccruedInterestCalculation = () => {
    setIsLoading(true);
    addTestResult('前手息計算測試', 'pending', '正在測試前手息計算...');
    
    try {
      const minAmount = parseFloat(testParams.minAmount);
      const couponRate = parseFloat(testParams.couponRate);
      const frequency = parseInt(testParams.frequency);
      const lastCouponDate = testParams.lastCouponDate;
      const transactionAmount = parseFloat(testParams.transactionAmount);

      // 計算前手息（每一最小承作面額）
      const accruedInterestPerMinAmount = calculateAccruedInterest(minAmount, couponRate, frequency, lastCouponDate);
      
      // 計算實際前手息（基於數量）
      const quantity = transactionAmount / (minAmount / 100); // 假設價格為100
      const actualAccruedInterest = (accruedInterestPerMinAmount / minAmount) * quantity;
      
      // 計算總交割金額
      const totalSettlement = transactionAmount + actualAccruedInterest;

      addTestResult('前手息計算測試', 'success', 
        `前手息計算完成`, 
        {
          minAmount,
          couponRate,
          frequency,
          lastCouponDate,
          transactionAmount,
          accruedInterestPerMinAmount,
          actualAccruedInterest: Math.round(actualAccruedInterest * 100) / 100,
          totalSettlement: Math.round(totalSettlement * 100) / 100,
          calculationFormula: `(前手息每面額 ${accruedInterestPerMinAmount} / 最小承作面額 ${minAmount}) × 數量 ${Math.round(quantity * 100) / 100} = ${Math.round(actualAccruedInterest * 100) / 100}`
        }
      );

    } catch (error) {
      addTestResult('前手息計算測試', 'error', `計算失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 測試不同最小承作面額的影響
  const testMinAmountImpact = () => {
    setIsLoading(true);
    addTestResult('最小承作面額影響測試', 'pending', '正在測試不同最小承作面額的影響...');
    
    try {
      const couponRate = parseFloat(testParams.couponRate);
      const frequency = parseInt(testParams.frequency);
      const lastCouponDate = testParams.lastCouponDate;
      const transactionAmount = parseFloat(testParams.transactionAmount);

      const testAmounts = [1000, 5000, 10000, 50000, 100000];
      const results = testAmounts.map(minAmount => {
        const accruedInterestPerMinAmount = calculateAccruedInterest(minAmount, couponRate, frequency, lastCouponDate);
        const quantity = transactionAmount / (minAmount / 100); // 假設價格為100
        const actualAccruedInterest = (accruedInterestPerMinAmount / minAmount) * quantity;
        const totalSettlement = transactionAmount + actualAccruedInterest;
        
        return {
          minAmount,
          accruedInterestPerMinAmount,
          actualAccruedInterest: Math.round(actualAccruedInterest * 100) / 100,
          totalSettlement: Math.round(totalSettlement * 100) / 100
        };
      });

      addTestResult('最小承作面額影響測試', 'success', 
        `測試完成，比較了 ${testAmounts.length} 種不同的最小承作面額`, 
        { results }
      );

    } catch (error) {
      addTestResult('最小承作面額影響測試', 'error', `測試失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
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
          <CardTitle>前手息計算測試</CardTitle>
          <CardDescription>請先登入以進行測試</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              您需要先登入才能進行前手息計算測試。
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
          <CardTitle>前手息計算測試</CardTitle>
          <CardDescription>
            測試前手息計算邏輯是否正確
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minAmount">最小承作面額</Label>
              <Input
                id="minAmount"
                value={testParams.minAmount}
                onChange={(e) => setTestParams(prev => ({ ...prev, minAmount: e.target.value }))}
                type="number"
              />
            </div>
            <div>
              <Label htmlFor="couponRate">票面利率 (%)</Label>
              <Input
                id="couponRate"
                value={testParams.couponRate}
                onChange={(e) => setTestParams(prev => ({ ...prev, couponRate: e.target.value }))}
                type="number"
                step="0.01"
              />
            </div>
            <div>
              <Label htmlFor="frequency">付息頻率</Label>
              <select
                id="frequency"
                value={testParams.frequency}
                onChange={(e) => setTestParams(prev => ({ ...prev, frequency: e.target.value }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="1">每年</option>
                <option value="2">每半年</option>
                <option value="4">每季</option>
                <option value="12">每月</option>
              </select>
            </div>
            <div>
              <Label htmlFor="lastCouponDate">上次付息日</Label>
              <Input
                id="lastCouponDate"
                value={testParams.lastCouponDate}
                onChange={(e) => setTestParams(prev => ({ ...prev, lastCouponDate: e.target.value }))}
                type="date"
              />
            </div>
            <div>
              <Label htmlFor="transactionAmount">交易金額</Label>
              <Input
                id="transactionAmount"
                value={testParams.transactionAmount}
                onChange={(e) => setTestParams(prev => ({ ...prev, transactionAmount: e.target.value }))}
                type="number"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={testAccruedInterestCalculation} 
              disabled={isLoading}
              variant="outline"
            >
              測試前手息計算
            </Button>
            <Button 
              onClick={testMinAmountImpact} 
              disabled={isLoading}
              variant="outline"
            >
              測試最小承作面額影響
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

export default AccruedInterestTest;
