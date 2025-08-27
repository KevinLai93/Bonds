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
  Star
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { sampleBond, type Bond } from '@/types/bond';
import Header from '@/components/Header';

const BondDetail = () => {
  const { isin } = useParams<{ isin: string }>();
  const navigate = useNavigate();
  const { bond } = useBondSearch();
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isin) return <Navigate to="/search" replace />;

  // Use context bond if ISIN matches, otherwise use sample data
  const displayBond = bond && bond.isin === isin ? bond : sampleBond;
  if (!displayBond) return <Navigate to="/search" replace />;

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

  const handleExportSpreadsheet = async () => {
    setIsExporting(true);
    // Mock export delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsExporting(false);
    // In real app, this would generate and download CSV/XLSX
    alert('試算表匯出功能開發中...');
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
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    {displayBond.yieldToMaturity.toFixed(2)}%
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
                  <p className="text-sm text-muted-foreground">前手息 (每萬面額)</p>
                  <p className="font-medium">{formatCurrency(displayBond.accruedInterest, displayBond.currency)}</p>
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
            </CardContent>
          </Card>

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
                  <Badge variant="outline">{displayBond.industry}</Badge>
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
              
              {displayBond.issuerDescription && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">發行者簡介</p>
                  <p className="text-sm leading-relaxed">{displayBond.issuerDescription}</p>
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
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>TLAC/MREL:</span>
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
    </div>
  );
};

export default BondDetail;