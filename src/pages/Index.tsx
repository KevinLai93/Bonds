import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, BarChart3, FileText, Zap } from 'lucide-react';
import { useBondSearch } from '@/contexts/BondSearchContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Header from '@/components/Header';
import EUFLogo from '@/components/EUFLogo';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { searchByISIN, loading, error, bond } = useBondSearch();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      try {
        await searchByISIN(searchQuery.trim());
        // 搜尋成功後跳轉到搜尋結果頁面
        navigate('/search');
      } catch (err) {
        // 搜尋失敗時也跳轉到搜尋頁面，讓搜尋頁面顯示錯誤訊息
        console.error('Search failed:', err);
        navigate('/search');
      }
    } else {
      // 沒有輸入ISIN時顯示錯誤提示，不導航到搜尋頁面
      toast.error('請輸入 ISIN 代碼');
    }
  };

  const handleExampleSearch = async () => {
    setSearchQuery('US037833DY36');
    try {
      await searchByISIN('US037833DY36');
      // 搜尋成功後跳轉到搜尋結果頁面
      navigate('/search');
    } catch (err) {
      // 搜尋失敗時也跳轉到搜尋頁面，讓搜尋頁面顯示錯誤訊息
      console.error('Search failed:', err);
      navigate('/search');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Logo 調試資訊 */}
        <LogoDebug />
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-financial">
              <EUFLogo size={80} />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-foreground mb-4">
            EUF BondDesk Pro
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            專業債券資訊查詢與分析平台 - 支援圖卡生成與報表輸出
          </p>
          
          {/* Main Search */}
          <Card className="max-w-2xl mx-auto shadow-financial mb-8">
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    placeholder="輸入完整ISIN代碼查詢債券資料，如US037833DY36"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-14 text-lg"
                  />
                </div>
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={loading}
                  className="w-full h-12 text-lg bg-gradient-financial hover:shadow-hover transition-all"
                >
                  <Search className="w-5 h-5 mr-2" />
                  {loading ? '搜尋中...' : '開始搜尋'}
                </Button>
              </form>
              
              {/* Error display */}
              {error && (
                <div className="mt-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <p className="text-sm font-medium text-destructive">搜尋失敗</p>
                  <p className="text-sm text-destructive/80 mt-1">{error}</p>
                </div>
              )}
              
              <div className="mt-4 text-center">
                <button
                  onClick={handleExampleSearch}
                  className="text-sm text-primary hover:text-primary-glow transition-colors"
                >
                  試試範例：AAPL 1 1/4 08/20/30 (US037833DY36)
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="shadow-card hover:shadow-hover transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Search className="w-5 h-5 mr-2 text-primary" />
                智能搜尋
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                支援 ISIN 代碼、公司名稱、關鍵字搜尋，快速定位目標債券
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-hover transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <BarChart3 className="w-5 h-5 mr-2 text-primary" />
                專業數據
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                完整的債券資訊，包含評等、殖利率、配息、風險指標等
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-hover transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <FileText className="w-5 h-5 mr-2 text-primary" />
                圖卡生成
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                一鍵生成專業債券資訊圖卡，支援社群分享格式
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-hover transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Zap className="w-5 h-5 mr-2 text-primary" />
                報表匯出
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                支援 CSV、XLSX 格式匯出，便於進一步分析處理
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sample Data Preview - Hidden */}
        {false && (
          <Card className="shadow-financial">
            <CardHeader>
              <CardTitle className="text-center">範例債券資訊</CardTitle>
              <p className="text-center text-muted-foreground">
                內建範例資料：Apple Inc. 債券
              </p>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-card p-6 rounded-lg border">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">債券名稱</p>
                    <p className="font-bold">AAPL 1 1/4 08/20/30</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ISIN</p>
                    <p className="font-bold">US037833DY36</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">YTM</p>
                    <p className="font-bold text-success">3.74%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">評等</p>
                    <div className="flex justify-center gap-1">
                      <Badge className="bg-primary text-primary-foreground text-xs">AA+</Badge>
                      <Badge className="bg-success text-success-foreground text-xs">Aaa</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Index;
