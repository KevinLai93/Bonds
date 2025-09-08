import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Filter, Download, Home } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { sampleBond, type Bond, filterOptions } from '@/types/bond';
import { useBondSearch } from '@/contexts/BondSearchContext';
import Header from '@/components/Header';
import ISINSearchBox from '@/components/ISINSearchBox';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

const SearchPage = () => {
  const { bond, extendedBond } = useBondSearch();
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  
  // 檢查是否有搜尋結果，如果沒有則重定向到首頁
  useEffect(() => {
    if (!bond && !extendedBond) {
      // 沒有搜尋結果時，重定向到首頁
      navigate('/');
    }
  }, [bond, extendedBond, navigate]);
  
  // Use searched bond if available, otherwise show sample data
  // 優先使用 extendedBond 因為它包含最新的價格數據
  const displayBond = extendedBond || bond;
  const mockBonds: Bond[] = displayBond ? [displayBond] : [sampleBond];
  
  // 匯出 Excel 功能
  const handleExportExcel = () => {
    if (!mockBonds || mockBonds.length === 0) {
      toast.error('沒有資料可以匯出');
      return;
    }

    setIsExporting(true);
    
    try {
      // 準備工作表資料
      const worksheetData = mockBonds.map(bond => ({
        '債券名稱': bond.name,
        'ISIN': bond.isin,
        '發行人': bond.issuer,
        '幣別': bond.currency,
        '剩餘年期': bond.remainingYears,
        '票息(%)': bond.couponRate,
        'Bid': bond.bidPrice,
        'YTM (%)': bond.yieldToMaturity,
        'Ask': bond.askPrice,
        'S&P評等': bond.spRating,
        'Moody評等': bond.moodyRating,
        'Fitch評等': bond.fitchRating,
        '配息頻率': bond.paymentFrequency,
        '到期日': bond.maturityDate,
        '國家': bond.country,
        '產業': bond.industry,
        '最小承作金額': bond.minAmount,
        '最小累加金額': bond.minIncrement,
        '發行日': bond.issueDate,
        '下一配息日': bond.nextCouponDate,
        '前手息': bond.accruedInterest,
        '投資人身分別': bond.investorType.join(', '),
        '母公司代碼': bond.parentCompanyCode || '',
        '一年違約機率': bond.defaultProbability1Y ? `${(bond.defaultProbability1Y * 100).toFixed(4)}%` : '',
        '發行人描述': bond.issuerDescription || ''
      }));

      // 創建工作簿
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);

      // 設置欄位寬度
      const columnWidths = [
        { wch: 30 }, // 債券名稱
        { wch: 15 }, // ISIN
        { wch: 20 }, // 發行人
        { wch: 8 },  // 幣別
        { wch: 10 }, // 剩餘年期
        { wch: 10 }, // 票息(%)
        { wch: 10 }, // Bid
        { wch: 10 }, // YTM (%)
        { wch: 10 }, // Ask
        { wch: 10 }, // S&P評等
        { wch: 10 }, // Moody評等
        { wch: 10 }, // Fitch評等
        { wch: 12 }, // 配息頻率
        { wch: 12 }, // 到期日
        { wch: 10 }, // 國家
        { wch: 15 }, // 產業
        { wch: 15 }, // 最小承作金額
        { wch: 15 }, // 最小累加金額
        { wch: 12 }, // 發行日
        { wch: 12 }, // 下一配息日
        { wch: 10 }, // 前手息
        { wch: 15 }, // 投資人身分別
        { wch: 12 }, // 母公司代碼
        { wch: 15 }, // 一年違約機率
        { wch: 30 }  // 發行人描述
      ];
      
      worksheet['!cols'] = columnWidths;

      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(workbook, worksheet, '債券查詢結果');

      // 生成檔案名稱
      const fileName = `債券查詢結果_${new Date().toISOString().slice(0, 10)}.xlsx`;

      // 下載檔案
      XLSX.writeFile(workbook, fileName);
      
      toast.success(`已匯出 ${mockBonds.length} 筆債券資料到 ${fileName}`);
      
    } catch (error) {
      console.error('匯出 Excel 失敗:', error);
      toast.error('匯出失敗，請重試');
    } finally {
      setIsExporting(false);
    }
  };

  const [selectedColumns, setSelectedColumns] = useState({
    isin: true,
    name: true,
    issuer: true,
    currency: true,
    remainingYears: true,
    couponRate: true,
    bidPrice: true,
    yieldToMaturity: true,
    askPrice: true,
    spRating: true,
    paymentFrequency: true,
    maturityDate: true,
    country: true,
    // Additional columns (hidden by default)
    industry: false,
    moodyRating: false,
    fitchRating: false,
    couponType: false,
    seniority: false,
    minDenomination: false,
    outstandingAmount: false,
    accruedInterest: false,
    nextCouponDate: false,
    riskNotes: false
  });

  // Always show current bonds (either searched or sample)
  const filteredBonds = mockBonds;

  const toggleColumn = (column: string) => {
    setSelectedColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const getRatingColor = (rating: string) => {
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        {/* Return to Home Button */}
        <div className="mb-4">
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2">
              <Home className="w-4 h-4" />
              返回首頁
            </Button>
          </Link>
        </div>
        
        {/* Search Header */}
        <Card className="mb-6 shadow-card">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-foreground">
              債券資訊查詢
            </CardTitle>
            <p className="text-muted-foreground">
              輸入 ISIN 代碼或關鍵字搜尋債券資訊
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <ISINSearchBox />
              </div>
              
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="lg" className="px-6">
                    <Filter className="w-4 h-4 mr-2" />
                    篩選
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>進階篩選</SheetTitle>
                    <SheetDescription>
                      選擇要顯示的欄位和篩選條件
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="mt-6 space-y-6">
                    <div>
                      <h4 className="font-medium mb-3">顯示欄位</h4>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {Object.entries(selectedColumns).map(([column, checked]) => (
                          <div key={column} className="flex items-center space-x-2">
                            <Checkbox
                              id={column}
                              checked={checked}
                              onCheckedChange={() => toggleColumn(column)}
                            />
                            <label 
                              htmlFor={column} 
                              className="text-sm cursor-pointer"
                            >
                              {getColumnLabel(column)}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="px-6"
                onClick={handleExportExcel}
                disabled={isExporting}
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? '匯出中...' : '匯出'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                搜尋結果 ({filteredBonds.length} 筆)
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                {bond ? `已找到 ISIN: ${bond.isin}` : '範例資料'}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.entries(selectedColumns)
                      .filter(([_, visible]) => visible)
                      .map(([column]) => (
                        <TableHead key={column} className="whitespace-nowrap">
                          {getColumnLabel(column)}
                        </TableHead>
                      ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBonds.map((bond) => (
                    <TableRow 
                      key={bond.id}
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                    >
                      {Object.entries(selectedColumns)
                        .filter(([_, visible]) => visible)
                        .map(([column]) => (
                      <TableCell key={column} className="whitespace-nowrap">
                        <div className="flex gap-2">
                          <Link 
                            to={`/bond/${bond.isin}`}
                            className="flex-1 hover:text-primary transition-colors"
                          >
                            {renderCellValue(bond, column)}
                          </Link>
                          {column === 'isin' && (
                            <Link 
                              to={`/card-editor/${bond.isin}`}
                              className="ml-2"
                            >
                              <Button variant="outline" size="sm">
                                編輯圖卡
                              </Button>
                            </Link>
                          )}
                        </div>
                      </TableCell>
                        ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {filteredBonds.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  請使用上方搜尋框查詢債券資訊
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

function getColumnLabel(column: string): string {
  const labels: Record<string, string> = {
    isin: 'ISIN',
    name: '債券名稱',
    issuer: '發行人',
    currency: '幣別',
    remainingYears: '剩餘年期',
    couponRate: '票息 (%)',
    bidPrice: 'Bid',
    yieldToMaturity: 'YTM (%)',
    askPrice: 'Ask',
    spRating: 'S&P',
    paymentFrequency: '配息頻率',
    maturityDate: '到期日',
    country: '國家',
    industry: '產業',
    moodyRating: "Moody's",
    fitchRating: 'Fitch',
    couponType: '票息類型',
    seniority: '償還順位',
    minDenomination: '最小承作',
    outstandingAmount: '未償額',
    accruedInterest: '前手息',
    nextCouponDate: '下次配息',
    riskNotes: '風險備註'
  };
  return labels[column] || column;
}

function renderCellValue(bond: Bond, column: string): React.ReactNode {
  const value = bond[column as keyof Bond];
  
  switch (column) {
    case 'spRating':
    case 'moodyRating':
    case 'fitchRating':
      // 顯示實際的信用評等（現在 API 支援中文版本）
      return value && value !== '—' ? (
        <Badge className={getRatingColor(value as string)}>
          {value as string}
        </Badge>
      ) : (
        <Badge className="bg-muted text-muted-foreground text-xs">
          —
        </Badge>
      );
    case 'couponRate':
      return `${(value as number).toFixed(2)}%`;
    case 'yieldToMaturity':
      // 顯示實際的到期殖利率（API 返回的是小數格式，如 0.043 = 4.3%）
      return value && (value as number) > 0 ? `${((value as number) * 100).toFixed(2)}%` : '—';
    case 'bidPrice':
    case 'askPrice':
      // 顯示實際的買賣價格
      return value && (value as number) > 0 ? (value as number).toFixed(2) : '—';
    case 'remainingYears':
      return value !== null ? `${(value as number).toFixed(1)} 年` : '永續';
    case 'currency':
      return <Badge variant="outline">{value as string}</Badge>;
    case 'maturityDate':
      return value && value !== '' ? new Date(value as string).toLocaleDateString('zh-TW') : '永續';
    case 'nextCouponDate':
    case 'previousCouponDate':
      return value ? new Date(value as string).toLocaleDateString('zh-TW') : '-';
    case 'minDenomination':
    case 'outstandingAmount':
      return new Intl.NumberFormat('zh-TW').format(value as number);
    case 'accruedInterest':
      return `${(value as number).toFixed(2)}`;
    case 'seniority':
      return (bond as any).seniority_text || value as React.ReactNode;
    default:
      return value as React.ReactNode;
  }
}

function getRatingColor(rating: string): string {
  if (!rating || rating === 'N.A.') return 'bg-muted text-muted-foreground';
  if (rating.startsWith('AAA') || rating.startsWith('Aaa')) return 'bg-success text-success-foreground';
  if (rating.startsWith('AA') || rating.startsWith('Aa')) return 'bg-primary text-primary-foreground';
  if (rating.startsWith('A')) return 'bg-warning text-warning-foreground';
  if (rating.startsWith('BBB') || rating.startsWith('Baa')) return 'bg-secondary text-secondary-foreground';
  return 'bg-destructive text-destructive-foreground';
}

export default SearchPage;