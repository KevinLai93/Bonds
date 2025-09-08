import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useBondSearch } from '@/contexts/BondSearchContext';
import { 
  ArrowLeft, 
  Download, 
  Image as ImageIcon, 
  TrendingUp,
  Calendar,
  DollarSign,
  Shield,
  Building,
  FileSpreadsheet,
  FileText,
  Star
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { sampleBond, type Bond } from '@/types/bond';
import Header from '@/components/Header';
import { BondDMModal } from '@/components/bond-dm/BondDMModal';
import * as XLSX from 'xlsx';

const BondDetail = () => {
  const { isin } = useParams<{ isin: string }>();
  const navigate = useNavigate();
  const { bond, extendedBond } = useBondSearch();
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDMModalOpen, setIsDMModalOpen] = useState(false);

  if (!isin) return <Navigate to="/search" replace />;

  // Use context bond if ISIN matches, otherwise redirect to search
  // 優先使用 extendedBond 因為它包含最新的價格數據
  const contextBond = extendedBond || bond;
  const displayBond = contextBond && contextBond.isin === isin ? contextBond : null;
  
  // 調試信息
  console.log('BondDetail - displayBond:', {
    isin: displayBond?.isin,
    industry: displayBond?.industry,
    emitentInfo: (displayBond as any)?.emitentInfo
  });
  
  // 如果沒有匹配的債券資料，重定向到搜尋頁面
  if (!displayBond) return <Navigate to="/search" replace />;

  // 強制重新計算前手息（用於調試）
  const recalculateAccruedInterest = (bond: any) => {
    if (!bond || bond.couponRate <= 0) return bond.accruedInterest || 0;
    
    const today = new Date();
    const maturity = new Date(bond.maturityDate);
    const frequency = bond.paymentFrequency === '每年' ? 1 : 
                     bond.paymentFrequency === '每半年' ? 2 :
                     bond.paymentFrequency === '每季' ? 4 :
                     bond.paymentFrequency === '每月' ? 12 : 2;
    
    // 計算配息日期
    const monthsInterval = 12 / frequency;
    let firstCouponEnd: Date;
    
    if (bond.previousCouponDate) {
      firstCouponEnd = new Date(bond.previousCouponDate);
    } else {
      // 如果沒有上次配息日，從發行日計算
      const issueDate = new Date(bond.issueDate);
      firstCouponEnd = new Date(issueDate);
      firstCouponEnd.setMonth(firstCouponEnd.getMonth() + monthsInterval);
    }
    
    // 生成配息日期
    const couponDates: Date[] = [];
    let currentDate = new Date(firstCouponEnd);
    
    while (currentDate <= maturity) {
      couponDates.push(new Date(currentDate));
      currentDate.setMonth(currentDate.getMonth() + monthsInterval);
    }
    
    // 找到上次和下次配息日
    let previousCouponDate: Date | null = null;
    let nextCouponDate: Date | null = null;
    
    for (const date of couponDates) {
      if (date <= today) {
        previousCouponDate = date;
      } else if (!nextCouponDate) {
        nextCouponDate = date;
        break;
      }
    }
    
    // 計算前手息 - 如果有上次配息日使用上次配息日，否則使用發行日
    let startDate: Date;
    if (previousCouponDate) {
      startDate = previousCouponDate;
      console.log('BondDetail 前手息計算 - 使用上次配息日:', {
        isin: bond.isin,
        previousCouponDate: previousCouponDate.toISOString().split('T')[0]
      });
    } else {
      startDate = new Date(bond.issueDate);
      console.log('BondDetail 前手息計算 - 使用發行日（剛發行債券）:', {
        isin: bond.isin,
        issueDate: bond.issueDate,
        previousCouponDate: '無'
      });
    }
    
    // 30/360 US rule day count
    let d1 = startDate.getDate();
    let d2 = today.getDate();
    let m1 = startDate.getMonth() + 1;
    let m2 = today.getMonth() + 1;
    let y1 = startDate.getFullYear();
    let y2 = today.getFullYear();
    
    if (d1 === 31) d1 = 30;
    if (d2 === 31 && d1 === 30) d2 = 30;
    if (d2 === 31 && d1 < 30) d2 = 30;
    
    const days360 = 360 * (y2 - y1) + 30 * (m2 - m1) + (d2 - d1);
    const periodsPerYear = frequency;
    const daysInPeriod = 360 / periodsPerYear;
    const baseAmount = bond.minDenomination || 10000;
    const periodicCouponAmount = (baseAmount * bond.couponRate / 100) / periodsPerYear;
    const accruedInterest = (days360 / daysInPeriod) * periodicCouponAmount;
    
    console.log('BondDetail 前手息計算:', {
      isin: bond.isin,
      startDate: startDate.toISOString().split('T')[0],
      today: today.toISOString().split('T')[0],
      days360,
      daysInPeriod,
      baseAmount,
      periodicCouponAmount,
      accruedInterest: Math.round(accruedInterest * 100) / 100
    });
    
    return Math.round(accruedInterest * 100) / 100;
  };

  // 重新計算前手息
  const recalculatedAccruedInterest = recalculateAccruedInterest(displayBond);

  const handleGenerateCard = async () => {
    setIsGeneratingCard(true);
    
    try {
      // Show generating message
      alert('正在生成專業債券圖卡，請稍候...');
      
      // In a real application, the images would be generated via API
      // For now, we simulate the download process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Create download functions for the generated images
      const downloadVertical = () => {
        const link = document.createElement('a');
        link.href = new URL('../assets/bond-card-US037833DY36-vertical.png', import.meta.url).href;
        link.download = `${displayBond.name.replace(/[^a-zA-Z0-9]/g, '_')}_vertical_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      const downloadHorizontal = () => {
        const link = document.createElement('a');
        link.href = new URL('../assets/bond-card-US037833DY36-horizontal.png', import.meta.url).href;
        link.download = `${displayBond.name.replace(/[^a-zA-Z0-9]/g, '_')}_horizontal_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      // Show success message with download options
      const result = confirm(
        `圖卡生成成功！\n\n已生成兩種格式：\n- 垂直版 (1080×1350) - 適合社群分享\n- 水平版 (1200×628) - 適合社媒貼文\n\n點擊「確定」下載垂直版，點擊「取消」下載水平版`
      );
      
      if (result) {
        downloadVertical();
      } else {
        downloadHorizontal();
      }
      
    } catch (error) {
      console.error('圖卡生成失敗:', error);
      alert('圖卡生成失敗，請稍後再試');
    } finally {
      setIsGeneratingCard(false);
    }
  };

  // 計算所有配息日期和金額
  const calculateCouponSchedule = () => {
    if (!displayBond) return [];

    const investmentAmount = 1000000; // 預設100萬
    const couponRate = displayBond.couponRate || 0;
    const annualCoupon = (investmentAmount * couponRate) / 100;
    
    const issueDate = new Date(displayBond.issueDate);
    const maturityDate = new Date(displayBond.maturityDate);
    const nextCouponDate = new Date(displayBond.nextCouponDate);
    
    const couponSchedule = [];
    
    // 根據配息頻率計算每次配息金額和間隔
    let couponAmount = annualCoupon;
    let monthsInterval = 12; // 預設每年
    
    switch (displayBond.paymentFrequency) {
      case '每半年':
        couponAmount = annualCoupon / 2; // 每半年配息，每次是年配息的一半
        monthsInterval = 6;
        break;
      case '每季':
        couponAmount = annualCoupon / 4; // 每季配息，每次是年配息的1/4
        monthsInterval = 3;
        break;
      case '每月':
        couponAmount = annualCoupon / 12; // 每月配息，每次是年配息的1/12
        monthsInterval = 1;
        break;
      case '每年':
      default:
        couponAmount = annualCoupon; // 每年配息
        monthsInterval = 12;
        break;
    }
    
    // 從下一個配息日開始計算
    const currentDate = new Date(nextCouponDate);
    
    while (currentDate <= maturityDate) {
      couponSchedule.push({
        配息日期: currentDate.toLocaleDateString('zh-TW'),
        配息金額: couponAmount.toLocaleString('zh-TW', {
          style: 'currency',
          currency: displayBond.currency || 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        投資金額: investmentAmount.toLocaleString('zh-TW', {
          style: 'currency',
          currency: displayBond.currency || 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }),
        票息率: `${couponRate}%`,
        配息頻率: displayBond.paymentFrequency || '每年'
      });
      
      // 根據配息頻率增加時間間隔
      currentDate.setMonth(currentDate.getMonth() + monthsInterval);
    }
    
    return couponSchedule;
  };

  const handleExportSpreadsheet = async () => {
    if (!displayBond) {
      alert('無法匯出：缺少債券資料');
      return;
    }

    setIsExporting(true);
    
    try {
      // 計算配息時程表
      const couponSchedule = calculateCouponSchedule();
      
      if (couponSchedule.length === 0) {
        alert('無法計算配息時程表');
        return;
      }

      // 創建工作表數據
      const worksheetData = [
        // 標題行
        ['債券配息時程表'],
        [''],
        ['債券名稱', displayBond.name],
        ['ISIN', displayBond.isin],
        ['發行日', displayBond.issueDate],
        ['到期日', displayBond.maturityDate],
        ['票息率', `${displayBond.couponRate}%`],
        ['投資金額', `1,000,000 ${displayBond.currency || 'USD'}`],
        [''],
        // 配息時程表標題
        ['配息日期', '配息金額', '投資金額', '票息率', '配息頻率'],
        // 配息數據
        ...couponSchedule.map(item => [
          item.配息日期,
          item.配息金額,
          item.投資金額,
          item.票息率,
          item.配息頻率
        ])
      ];

      // 創建工作簿
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // 設置列寬
      worksheet['!cols'] = [
        { wch: 15 }, // 配息日期
        { wch: 20 }, // 配息金額
        { wch: 20 }, // 投資金額
        { wch: 10 }, // 票息率
        { wch: 12 }  // 配息頻率
      ];
      
      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(workbook, worksheet, '配息時程表');
      
      // 生成文件名
      const fileName = `${displayBond.name}-配息時程表-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // 下載文件
      XLSX.writeFile(workbook, fileName);
      
      console.log('Excel 匯出成功！');
    } catch (error) {
      console.error('Excel 匯出失敗:', error);
      alert('匯出失敗，請稍後再試');
    } finally {
      setIsExporting(false);
    }
  };

  const getRatingColor = (rating: string) => {
    if (!rating || rating === 'N.A.') return 'bg-muted text-muted-foreground';
    if (rating.startsWith('AAA') || rating.startsWith('Aaa')) return 'bg-success text-success-foreground';
    if (rating.startsWith('AA') || rating.startsWith('Aa')) return 'bg-primary text-primary-foreground';
    if (rating.startsWith('A')) return 'bg-warning text-warning-foreground';
    if (rating.startsWith('BBB') || rating.startsWith('Baa')) return 'bg-secondary text-secondary-foreground';
    return 'bg-destructive text-destructive-foreground';
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <Link 
            to="/search"
            className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回搜尋結果
          </Link>
          
          <Card className="shadow-financial">
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-foreground">
                    {displayBond.name}
                  </h1>
                  <p className="text-xl text-muted-foreground">
                    ISIN: {displayBond.isin}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={getRatingColor(displayBond.spRating)}>
                        S&P: {displayBond.spRating}
                      </Badge>
                      <Badge className={getRatingColor(displayBond.moodyRating)}>
                        Moody's: {displayBond.moodyRating}
                      </Badge>
                      <Badge className={getRatingColor(displayBond.fitchRating)}>
                        Fitch: {displayBond.fitchRating}
                      </Badge>
                      <Badge variant="outline" className="ml-2">
                        {displayBond.currency}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        onClick={() => navigate(`/card-editor/${displayBond.isin}`)}
                        className="bg-gradient-financial hover:shadow-hover transition-all"
                      >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        {isGeneratingCard ? '生成中...' : '編輯圖卡'}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={handleExportSpreadsheet}
                        disabled={isExporting}
                      >
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        {isExporting ? '匯出中...' : '匯出試算表'}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setIsDMModalOpen(true)}
                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        查看DM
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Credit & Issuer Info */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="w-5 h-5 mr-2 text-primary" />
                信用 & 發行人資訊
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">發行人</p>
                <p className="text-xl font-bold">{displayBond.issuer}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">產業別</p>
                  <Badge variant="outline">
                    {displayBond.industry || (displayBond as any)?.emitentInfo?.branch_name_eng || '—'}
                  </Badge>
                </div>
                {displayBond.parentCompanyCode && (
                  <div>
                    <p className="text-sm text-muted-foreground">母公司代碼</p>
                    <p className="font-medium">{displayBond.parentCompanyCode}</p>
                  </div>
                )}
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">信用評等</p>
                <div className="flex flex-wrap gap-2">
                  <Badge className={getRatingColor(displayBond.spRating)}>
                    S&P: {displayBond.spRating}
                  </Badge>
                  <Badge className={getRatingColor(displayBond.moodyRating)}>
                    Moody's: {displayBond.moodyRating}
                  </Badge>
                  <Badge className={getRatingColor(displayBond.fitchRating)}>
                    Fitch: {displayBond.fitchRating}
                  </Badge>
                </div>
              </div>
              
              {((displayBond as any)?.emitentInfo?.profile_eng || displayBond.issuerDescription) && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">發行者簡介</p>
                  <p className="text-sm leading-relaxed">
                    {(displayBond as any)?.emitentInfo?.profile_eng || displayBond.issuerDescription}
                  </p>
                </div>
              )}
              
              {displayBond.issuerControl && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">發行人控管</p>
                  <div className="text-sm leading-relaxed whitespace-pre-line">
                    {displayBond.issuerControl}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Basic & Trading Info */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-primary" />
                基本資訊 & 交易
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">幣別</p>
                  <p className="font-medium">{displayBond.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">國家</p>
                  <p className="font-medium">{displayBond.country}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Bid Price</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(displayBond.bidPrice, displayBond.currency)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">YTM</p>
                  <p className="text-2xl font-bold text-success">
                    {(displayBond.yieldToMaturity * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Ask Price</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(displayBond.askPrice, displayBond.currency)}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">前手息(最小承作金額)</p>
                  <p className="font-medium">{formatCurrency(recalculatedAccruedInterest, displayBond.currency)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">未償額</p>
                  <p className="font-medium">{new Intl.NumberFormat('zh-TW').format(displayBond.outstandingAmount)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">最小承作金額</p>
                  <p className="font-medium">{new Intl.NumberFormat('zh-TW').format(displayBond.minDenomination)} {displayBond.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">最小累加金額</p>
                  <p className="font-medium">{new Intl.NumberFormat('zh-TW').format(displayBond.minIncrement)} {displayBond.currency}</p>
                </div>
              </div>
              
              {displayBond.riskNotes && (
                <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                  <p className="text-sm font-medium text-warning-foreground">風險備註</p>
                  <p className="text-sm mt-1">{displayBond.riskNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Coupon & Payment Info */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary" />
                票息 & 配息資訊
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">票面利率</p>
                  <p className="text-xl font-bold text-primary">{displayBond.couponRate.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">票息類型</p>
                  <Badge variant="outline">{displayBond.couponType}</Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">配息頻率</p>
                  <p className="font-medium">{displayBond.paymentFrequency}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">剩餘年期</p>
                  <p className="font-medium">{displayBond.remainingYears.toFixed(1)} 年</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                {displayBond.previousCouponDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">上一配息日</p>
                    <p className="font-medium">{formatDate(displayBond.previousCouponDate)}</p>
                  </div>
                )}
                {displayBond.nextCouponDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">下一配息日</p>
                    <p className="font-medium text-success">{formatDate(displayBond.nextCouponDate)}</p>
                  </div>
                )}
                {displayBond.nextCallDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">下一買回日</p>
                    <p className="font-medium text-warning">{formatDate(displayBond.nextCallDate)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Duration & Maturity */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                存續 & 到期資訊
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">發行日</p>
                  <p className="font-medium">{formatDate(displayBond.issueDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">到期日</p>
                  <p className="font-medium">{formatDate(displayBond.maturityDate)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">到期類型</p>
                  <Badge variant="outline">{displayBond.maturityType}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">償還順位</p>
                  <Badge variant="outline">{displayBond.seniority_text || displayBond.seniority}</Badge>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">一年違約機率</p>
                <p className="font-medium">{(displayBond.defaultProbability1Y * 100).toFixed(4)}%</p>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">TLAC/MREL:</span>
                <Badge variant={displayBond.tlacMrel ? "default" : "outline"}>
                  {displayBond.tlacMrel ? '適用' : '不適用'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Updated timestamp */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          最後更新：{new Date(displayBond.updatedAt).toLocaleString('zh-TW')}
        </div>
      </main>

      {/* DM Modal */}
      <BondDMModal 
        bond={displayBond}
        isOpen={isDMModalOpen}
        onClose={() => setIsDMModalOpen(false)}
      />
    </div>
  );
};

export default BondDetail;