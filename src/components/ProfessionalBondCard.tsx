import React from 'react';
import { Building, IdCard, Coins, Shield, Clock, Repeat, Calendar, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AutoFitText } from './AutoFitText';

interface BondCardData {
  // Brand and basic info
  logoImage?: string;
  logoText: string;
  mainTitle: string;
  subtitle: string;
  
  // Basic bond information
  productName: string;
  isin: string;
  issuer: string;
  industry: string;
  currency: string;
  couponRate: string;
  couponType: string;
  remainingYears: string;
  investorType: string[];
  minAmount: string;
  
  // Important dates
  issueDate: string;
  maturityDate: string;
  nextCouponDate: string;
  nextCallDate?: string;
  
  // Pricing and yield
  bidPrice: string;
  askPrice: string;
  ytm: string;
  tradingPrice: string;
  transactionAmount: string;
  totalSettlement: string;
  
  // Credit ratings
  spRating: string;
  moodyRating: string;
  fitchRating: string;
  seniorityRank: string;
  maturityType: string;
  paymentFrequency: string;
  
  // Geographic info
  country: string;
}

interface ProfessionalBondCardProps {
  data: BondCardData;
  format?: '1080x1350' | '1200x628' | 'A4';
  className?: string;
  isExporting?: boolean;
  dataTime?: string;
  [key: string]: any; // Allow additional props like data-professional-card
}

const CountryFlags: { [key: string]: string } = {
  'US': '🇺🇸',
  'TW': '🇹🇼',
  'CN': '🇨🇳',
  'JP': '🇯🇵',
  'KR': '🇰🇷',
  'SG': '🇸🇬',
  'HK': '🇭🇰',
  'GB': '🇬🇧',
  'DE': '🇩🇪',
  'FR': '🇫🇷',
};

export function ProfessionalBondCard({ data, format = '1080x1350', className = '', isExporting = false, dataTime, ...restProps }: ProfessionalBondCardProps) {
  // Filter out React-specific props that shouldn't be passed to DOM
  const { isA4: _, ...props } = restProps;
  const isPortrait = format === '1080x1350';
  const isA4 = format === 'A4';
  const isLocal = data.country === 'TW';
  const flag = CountryFlags[data.country] || '🌐';
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  const formatNumber = (value: string) => {
    const num = parseFloat(value);
    return isNaN(num) ? value : num.toLocaleString();
  };

  const formatPercent = (value: string) => {
    const num = parseFloat(value);
    return isNaN(num) ? value : num.toFixed(2);
  };

  return (
    <div 
      id="bondCard"
      className={`
        bg-white relative
        ${isExporting ? 'overflow-visible' : 'overflow-hidden'}
        ${isA4 ? 'w-[750px]' : (isPortrait ? 'w-[680px]' : 'w-[720px]')}
        ${isExporting || isA4 ? 'h-auto min-h-[1060px]' : (isPortrait ? 'h-[675px] max-h-[675px] overflow-y-auto' : 'h-[314px] max-h-[314px] overflow-y-auto')}
        ${className}
      `} 
      style={isExporting ? { height: 'auto', maxHeight: 'none', overflow: 'visible' } : {}}
      {...props}>
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.04]">
        <div className="w-full h-full" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--brand-600)) 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }} />
      </div>

      <div className={`p-6 flex flex-col h-full ${isA4 ? 'gap-8' : (isPortrait ? 'gap-4' : 'gap-3')}`}>
        {/* Header */}
        <div className={`flex items-start justify-between ${isA4 ? 'mb-6' : (isPortrait ? 'mb-4' : 'mb-3')}`}>
          {/* Logo in top-left */}
          <div className="flex-shrink-0">
            {data.logoImage && (
              <img src={data.logoImage} alt="Logo" className={`object-contain rounded ${isA4 ? 'w-24 h-24' : 'w-20 h-20'}`} />
            )}
          </div>
          
          {/* Title and Subtitle centered */}
          <div className="flex-1 text-center px-4">
            <AutoFitText maxFontSize={isA4 ? 36 : (isPortrait ? 32 : 24)} minFontSize={18} maxLines={2} className="font-bold text-gray-800">
              {data.mainTitle}
            </AutoFitText>
            <AutoFitText maxFontSize={isA4 ? 20 : (isPortrait ? 18 : 14)} minFontSize={12} maxLines={2} className="text-gray-600 mt-1 block">
              {data.subtitle}
            </AutoFitText>
          </div>
          
          {/* Badges on the right */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <Badge variant="outline" className="border-[hsl(var(--brand-200))] text-[hsl(var(--brand-700))]">
              {flag} {isLocal ? '本地公司債' : '海外公司債'}
            </Badge>
            <Badge variant="outline" className="border-[hsl(var(--brand-200))] text-[hsl(var(--brand-700))]">
              <Building className="w-3 h-3 mr-1" />
              華南永昌證券
            </Badge>
          </div>
        </div>

        {/* Product Name */}
        <div className="text-center">
          <AutoFitText maxFontSize={isA4 ? 24 : (isPortrait ? 20 : 16)} minFontSize={14} maxLines={3} className="font-bold text-gray-800 px-8">
            {data.productName}
          </AutoFitText>
        </div>

        {/* KPIs Grid */}
        <div className={`grid gap-${isA4 ? '6' : '3'} ${isA4 ? 'grid-cols-2' : (isPortrait ? 'grid-cols-2' : 'grid-cols-4')}`}>
          {[
            { icon: TrendingUp, label: '殖利率', value: `${formatPercent(data.ytm)}%`, color: '#22c55e' },
            { icon: Coins, label: '票面利率', value: `${formatPercent(data.couponRate)}%`, color: '#3b82f6' },
            { icon: Shield, label: '信評等級', value: data.spRating || 'N.A.', color: '#f59e0b' },
            { icon: Calendar, label: `剩餘年限`, value: `${data.remainingYears}年`, color: '#8b5cf6' }
          ].map((kpi, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className={`p-3 flex flex-col justify-center ${isA4 ? 'h-32' : (isPortrait ? 'h-20' : 'h-16')}`}>
                <div className="flex items-center gap-2 mb-2">
                  <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                  <span className={`text-xs font-medium text-gray-600 ${isA4 ? 'text-sm' : (isPortrait ? '' : 'text-[10px]')}`}>{kpi.label}</span>
                </div>
                <AutoFitText maxFontSize={isA4 ? 32 : (isPortrait ? 24 : 18)} minFontSize={12} className="font-bold text-gray-800">
                  {kpi.value}
                </AutoFitText>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className={`grid gap-${isA4 ? '6' : '4'} flex-1 ${isA4 || isPortrait ? 'grid-cols-1' : 'grid-cols-3'}`}>
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 p-3 rounded-t-xl border-b" style={{
              backgroundColor: `hsl(var(--brand-600))`,
              color: `hsl(var(--brand-foreground))`
            }}>
              <IdCard className="w-4 h-4" />
              <span className="font-semibold text-sm">基本資料</span>
            </div>
            <div className={`p-4 space-y-${isA4 ? '3' : '2'} text-sm`}>
              <div className="flex justify-between">
                <span className="text-gray-600">ISIN</span>
                <AutoFitText maxFontSize={14} minFontSize={10} className="font-mono font-medium">
                  {data.isin}
                </AutoFitText>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">發行人</span>
                <AutoFitText maxFontSize={14} minFontSize={10} className="font-medium text-right flex-1 ml-2">
                  {data.issuer}
                </AutoFitText>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">產業別</span>
                <AutoFitText maxFontSize={14} minFontSize={10} className="font-medium text-right flex-1 ml-2">
                  {data.industry}
                </AutoFitText>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">幣別</span>
                <span className="font-medium">{data.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">票息類型</span>
                <Badge variant="outline" className="text-xs border-[hsl(var(--brand-200))] text-[hsl(var(--brand-700))]">
                  {data.couponType}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">投資人身分</span>
                <AutoFitText maxFontSize={14} minFontSize={10} className="font-medium text-right flex-1 ml-2">
                  {data.investorType.join(', ')}
                </AutoFitText>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">最小承作</span>
                <AutoFitText maxFontSize={14} minFontSize={10} className="font-medium">
                  {formatNumber(data.minAmount)}
                </AutoFitText>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 p-3 rounded-t-xl border-b" style={{
              backgroundColor: `hsl(var(--brand-600))`,
              color: `hsl(var(--brand-foreground))`
            }}>
              <Calendar className="w-4 h-4" />
              <span className="font-semibold text-sm">重要日程</span>
            </div>
            <div className={`p-4 ${isA4 ? 'py-6' : ''}`}>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute top-6 left-0 right-0 h-0.5" style={{ backgroundColor: `hsl(var(--brand-200))` }} />
                
                <div className="flex justify-between items-start relative">
                  {/* Issue Date */}
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full border-2 border-white shadow-md z-10" style={{ backgroundColor: `hsl(var(--brand-600))` }} />
                    <div className={`text-xs font-medium text-gray-900 mt-2 ${isA4 ? 'text-sm' : ''}`}>發行日</div>
                    <div className={`text-xs text-gray-600 ${isA4 ? 'text-sm' : ''}`}>{data.issueDate}</div>
                  </div>
                  
                  {/* Next Coupon Date */}
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full border-2 border-white shadow-md z-10" style={{ backgroundColor: `hsl(var(--brand-400))` }} />
                    <div className={`text-xs font-medium text-gray-900 mt-2 text-center ${isA4 ? 'text-sm' : ''}`}>下一配息日</div>
                    <div className={`text-xs text-gray-600 ${isA4 ? 'text-sm' : ''}`}>{data.nextCouponDate}</div>
                  </div>
                  
                  {/* Call Date (if exists) */}
                  {data.nextCallDate && (
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rotate-45 border border-white shadow-md z-10" style={{ backgroundColor: `hsl(var(--brand-500))` }} />
                      <div className={`text-xs font-medium text-gray-900 mt-2 text-center ${isA4 ? 'text-sm' : ''}`}>下一買回日</div>
                      <div className={`text-xs text-gray-600 ${isA4 ? 'text-sm' : ''}`}>{data.nextCallDate}</div>
                    </div>
                  )}
                  
                  {/* Maturity Date */}
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full border-2 border-white shadow-md z-10" style={{ backgroundColor: `hsl(var(--brand-600))` }} />
                    <div className={`text-xs font-medium text-gray-900 mt-2 ${isA4 ? 'text-sm' : ''}`}>到期日</div>
                    <div className={`text-xs text-gray-600 ${isA4 ? 'text-sm' : ''}`}>{data.maturityDate}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Credit Section */}
          <div className="space-y-4">
            {/* Pricing */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 p-3 rounded-t-xl border-b" style={{
                backgroundColor: `hsl(var(--brand-600))`,
                color: `hsl(var(--brand-foreground))`
              }}>
                <TrendingUp className="w-4 h-4" />
                <span className="font-semibold text-sm">價格與金額</span>
              </div>
              <div className={`p-3 space-y-${isA4 ? '3' : '2'} text-xs`}>
                <div className="flex justify-between">
                  <span className="text-gray-600">參考賣價</span>
                  <AutoFitText maxFontSize={12} minFontSize={10} className="font-mono font-medium">
                    {data.bidPrice}
                  </AutoFitText>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">參考買價</span>
                  <AutoFitText maxFontSize={12} minFontSize={10} className="font-mono font-medium">
                    {data.askPrice}
                  </AutoFitText>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">參考價格</span>
                  <AutoFitText maxFontSize={12} minFontSize={10} className="font-mono font-medium">
                    {data.tradingPrice}
                  </AutoFitText>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">交易金額</span>
                  <AutoFitText maxFontSize={12} minFontSize={10} className="font-mono font-medium">
                    {formatNumber(data.transactionAmount)}
                  </AutoFitText>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">總交割金額</span>
                  <AutoFitText maxFontSize={12} minFontSize={10} className="font-mono font-medium">
                    {formatNumber(data.totalSettlement)}
                  </AutoFitText>
                </div>
              </div>
            </div>

            {/* Credit Ratings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 p-3 rounded-t-xl border-b" style={{
                backgroundColor: `hsl(var(--brand-600))`,
                color: `hsl(var(--brand-foreground))`
              }}>
                <Shield className="w-4 h-4" />
                <span className="font-semibold text-sm">信用與結構</span>
              </div>
              <div className="p-3">
                <div className={`flex flex-wrap gap-1 ${isA4 ? 'mb-4' : 'mb-3'}`}>
                  <Badge variant="outline" className="text-xs border-[hsl(var(--brand-200))] text-[hsl(var(--brand-700))]">
                    S&P: {data.spRating || 'N.A.'}
                  </Badge>
                  <Badge variant="outline" className="text-xs border-[hsl(var(--brand-200))] text-[hsl(var(--brand-700))]">
                    Moody's: {data.moodyRating || 'N.A.'}
                  </Badge>
                  <Badge variant={data.fitchRating ? "outline" : "secondary"} className={`text-xs ${data.fitchRating ? 'border-[hsl(var(--brand-200))] text-[hsl(var(--brand-700))]' : 'bg-gray-200 text-gray-500 border-gray-300'}`}>
                    Fitch: {data.fitchRating || 'N.A.'}
                  </Badge>
                </div>
                <div className={`space-y-${isA4 ? '2' : '1'} text-xs`}>
                  <div className="flex items-center gap-2">
                    <Shield className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-600">{data.seniorityRank}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-600">{data.maturityType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Repeat className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-600">{data.paymentFrequency}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-center text-xs text-gray-500 mt-auto">
          <div className="text-center">
            <div>資料時間</div>
            <div>{dataTime || new Date().toLocaleString('zh-TW', { 
              year: 'numeric', 
              month: '2-digit', 
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            })}</div>
          </div>
        </div>
      </div>
    </div>
  );
}