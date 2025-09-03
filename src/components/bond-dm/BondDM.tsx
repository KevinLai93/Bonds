import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Eye } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Bond, ExtendedBond } from '@/types/bond';
import './bond-dm.css';

interface BondDMProps {
  bond: Bond | ExtendedBond;
  isPreview?: boolean;
}

export const BondDM: React.FC<BondDMProps> = ({ 
  bond, 
  isPreview = false 
}) => {
  const dmRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    if (!dmRef.current) return;

    try {
      const canvas = await html2canvas(dmRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123, // A4 height in pixels at 96 DPI
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // A4 dimensions in mm
      const pdfWidth = 210;
      const pdfHeight = 297;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${bond.name}-債券資訊.pdf`);
    } catch (error) {
      console.error('PDF 生成失敗:', error);
    }
  };

  // 計算配息日期（基於債券資訊）
  const getPaymentDates = () => {
    const dates = [];
    const today = new Date();
    const maturity = new Date(bond.maturityDate);
    let currentDate = new Date(bond.nextCouponDate || bond.issueDate);
    
    while (currentDate <= maturity && dates.length < 6) {
      dates.push(currentDate.toLocaleDateString('zh-TW'));
      // 根據付息頻率計算下一個日期
      if (bond.paymentFrequency === '每半年') {
        currentDate.setMonth(currentDate.getMonth() + 6);
      } else if (bond.paymentFrequency === '每年') {
        currentDate.setFullYear(currentDate.getFullYear() + 1);
      } else if (bond.paymentFrequency === '每季') {
        currentDate.setMonth(currentDate.getMonth() + 3);
      } else if (bond.paymentFrequency === '每月') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }
    
    return dates;
  };

  const paymentDates = getPaymentDates();

  // 格式化貨幣
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // 計算到期總利息
  const calculateTotalInterest = () => {
    const investmentAmount = 1000000; // 100萬面額
    const annualInterest = (investmentAmount * bond.couponRate) / 100;
    const totalInterest = annualInterest * bond.remainingYears;
    return formatCurrency(totalInterest, bond.currency);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-background bond-dm-container">
      {!isPreview && (
        <div className="mb-6 flex gap-4 justify-center">
          <Button variant="outline" className="gap-2">
            <Eye className="w-4 h-4" />
            預覽模式
          </Button>
          <Button onClick={downloadPDF} className="gap-2">
            <Download className="w-4 h-4" />
            下載 PDF
          </Button>
        </div>
      )}

      <div 
        ref={dmRef}
        className="bg-background border border-border shadow-lg"
        style={{ 
          width: '794px', 
          height: '1123px',
          margin: '0 auto',
          padding: '20px',
          fontSize: '14px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        {/* Header 天 */}
        <div className="mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">H</span>
              </div>
              <div>
                <h1 className="text-primary font-bold text-2xl tracking-wider">華南永昌證券</h1>
                <p className="text-primary text-sm font-medium tracking-widest">HUA NAN SECURITIES</p>
              </div>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20 rounded-full"></div>
        </div>

        {/* Main Content 中 */}
        <div className="mb-6">
          {/* Top Row */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Company Info */}
            <div className="bg-financial-light-gray p-4 rounded-lg">
              <h3 className="font-bold text-financial-dark-gray mb-2">發行公司介紹</h3>
              <p className="text-sm text-financial-dark-gray leading-relaxed">
                {(bond as ExtendedBond)?.emitentInfo?.profile_eng || bond.issuerDescription || `${bond.issuer}為全球領先的企業，信用評等優良，具高度現金流與國際市場地位。`}
              </p>
            </div>

            {/* Bond Details */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-financial-medium-gray">債券名稱：</span>
                  <span className="font-semibold text-financial-dark-gray">{bond.name}</span>
                </div>
                <div>
                  <span className="text-financial-medium-gray">ISIN：</span>
                  <span className="font-mono text-financial-dark-gray">{bond.isin}</span>
                </div>
                <div>
                  <span className="text-financial-medium-gray">票面類型：</span>
                  <span className="text-financial-dark-gray">{bond.couponType}</span>
                </div>
                <div>
                  <span className="text-financial-medium-gray">到期日：</span>
                  <span className="text-financial-dark-gray">{bond.maturityDate}</span>
                </div>
                <div>
                  <span className="text-financial-medium-gray">幣別：</span>
                  <span className="font-semibold text-financial-dark-gray">{bond.currency}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="flex justify-center gap-8 mb-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-2">
                <span className="text-primary-foreground font-bold text-lg">{typeof bond.bidPrice === 'number' ? bond.bidPrice.toFixed(2) : bond.bidPrice}</span>
              </div>
              <p className="text-sm font-medium text-financial-dark-gray">價格</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 border-2 border-primary rounded-full flex items-center justify-center mb-2">
                <span className="text-primary font-bold text-sm">{typeof bond.yieldToMaturity === 'number' ? (bond.yieldToMaturity * 100).toFixed(2) : bond.yieldToMaturity}%</span>
              </div>
              <p className="text-sm font-medium text-financial-dark-gray">到期殖利率</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 border-2 border-primary rounded-full flex items-center justify-center mb-2">
                <span className="text-primary font-bold text-sm">{typeof bond.couponRate === 'number' ? bond.couponRate.toFixed(2) : bond.couponRate}%</span>
              </div>
              <p className="text-sm font-medium text-financial-dark-gray">票面利率</p>
            </div>
          </div>

          {/* Payment Timeline */}
          <div className="bg-financial-light-gray p-4 rounded-lg mb-4">
            <h4 className="font-semibold text-financial-dark-gray mb-3">配息時間軸 - {bond.paymentFrequency}</h4>
            <div className="flex items-center justify-between">
              {paymentDates.map((date, index) => (
                <div key={index} className="flex items-center">
                  <div className="text-center">
                    <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-primary' : 'bg-financial-medium-gray'} mb-1`}></div>
                    <p className="text-xs text-financial-dark-gray font-medium">{date}</p>
                  </div>
                  {index < paymentDates.length - 1 && (
                    <div className="w-24 h-0.5 bg-financial-medium-gray mx-4"></div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-primary mt-2">下一次配息日：{bond.nextCouponDate || '待定'}</p>
          </div>

          {/* Total Interest */}
          <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
            <h4 className="font-semibold text-financial-dark-gray mb-1">到期總共可領利息</h4>
            <p className="text-lg font-bold text-primary">{calculateTotalInterest()}</p>
            <p className="text-xs text-financial-medium-gray">（以投資 1,000,000 面額為例）</p>
          </div>
        </div>

        {/* Bottom Section 地 */}
        <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
          {/* Basic Info */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-financial-medium-gray">剩餘年限：</span>
              <span className="font-semibold text-financial-dark-gray">{bond.remainingYears} 年</span>
            </div>
            <div className="flex justify-between">
              <span className="text-financial-medium-gray">受償順位：</span>
              <span className="text-financial-dark-gray">{bond.seniority_text || bond.seniority}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-financial-medium-gray">配息頻率：</span>
              <span className="text-financial-dark-gray">{bond.paymentFrequency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-financial-medium-gray">最小承作金額：</span>
              <span className="font-semibold text-financial-dark-gray">
                {new Intl.NumberFormat('zh-TW').format(bond.minDenomination)} {bond.currency}
              </span>
            </div>
          </div>

          {/* Credit Ratings */}
          <div className="space-y-2">
            <h4 className="font-semibold text-financial-dark-gray mb-2">三大信評</h4>
            <div className="flex justify-between">
              <span className="text-financial-medium-gray">Moody's：</span>
              <span className="font-semibold text-primary">{bond.moodyRating}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-financial-medium-gray">S&P：</span>
              <span className="font-semibold text-primary">{bond.spRating}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-financial-medium-gray">Fitch：</span>
              <span className="font-semibold text-primary">{bond.fitchRating}</span>
            </div>
            <div className="flex justify-between mt-3">
              <span className="text-financial-medium-gray">投資人身分：</span>
              <span className="text-financial-dark-gray">{bond.investorType.join(', ')}</span>
            </div>
          </div>

          {/* Schedule Info */}
          <div className="space-y-2">
            <h4 className="font-semibold text-financial-dark-gray mb-2">相關日程</h4>
            <div className="flex justify-between">
              <span className="text-financial-medium-gray">發行日：</span>
              <span className="text-financial-dark-gray">{bond.issueDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-financial-medium-gray">下一配息日：</span>
              <span className="text-primary font-semibold">{bond.nextCouponDate || '待定'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-financial-medium-gray">到期類型：</span>
              <span className="text-financial-dark-gray">{bond.maturityType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-financial-medium-gray">贖回條件：</span>
              <span className="text-financial-dark-gray">
                {bond.maturityType === '可提前贖回' ? '可提前贖回' : '不可提前贖回'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-financial-medium-gray/20 p-3 rounded text-center">
          <p className="text-xs text-financial-medium-gray">
            本資料僅供參考，不構成投資建議，投資人應自行評估投資風險。
          </p>
        </div>
      </div>
    </div>
  );
};
