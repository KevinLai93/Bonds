import React from 'react';
import { Bond, ExtendedBond } from '@/types/bond';
import ProfileLogo from '@/components/ProfileLogo';
import { useAuth } from '@/contexts/AuthContext';

interface OriginalBondDMProps {
  bond: Bond | ExtendedBond;
  isPreview?: boolean;
  transactionAmount?: number; // 交易金額
  tradeDirection?: string; // 客戶需求：買/賣
}

export const OriginalBondDM: React.FC<OriginalBondDMProps> = ({ 
  bond, 
  isPreview = false,
  transactionAmount,
  tradeDirection 
}) => {
  const { accountType, brandColors } = useAuth();
  
  // 使用 API 傳遞的品牌色系，如果沒有則使用預設值
  const getThemeColor = () => {
    if (brandColors?.theme_color) {
      return brandColors.theme_color;
    }
    
    // 預設色系（向後相容）
    if (!accountType) {
      return '#54b5e9'; // 預設 EUF 顏色
    }
    
    switch (accountType.type) {
      case 'entrust':
        return '#E60012'; // 華南永昌證券紅色
      case 'ubot':
        return '#16899d'; // Ubot 專用色
      case 'masterlink':
        return '#E8180E'; // 元富紅
      case 'esun':
        return '#019c97'; // 玉山綠
      case 'darwin':
        return '#015caf'; // 達盈藍
      default:
        return '#54b5e9'; // EUF 顏色
    }
  };

  // 使用 API 傳遞的輔助色，如果沒有則使用預設值
  const getAuxiliaryColor = () => {
    if (brandColors?.auxiliary_color) {
      return brandColors.auxiliary_color;
    }
    
    // 預設色系（向後相容）
    if (!accountType) {
      return '#9d5bc3'; // 預設 EUF 紫色
    }
    
    switch (accountType.type) {
      case 'entrust':
        return '#E60012'; // 華南永昌證券紅色
      case 'ubot':
        return '#e6003b'; // Ubot 紅
      case 'masterlink':
        return '#E8180E'; // 元富紅
      case 'esun':
        return '#019c97'; // 玉山綠
      case 'darwin':
        return '#ffb21b'; // 達盈黃
      default:
        return '#9d5bc3'; // EUF 紫色
    }
  };
  
  const themeColor = getThemeColor();
  const auxiliaryColor = getAuxiliaryColor();

  // 計算配息時間軸的關鍵日期
  const getPaymentTimeline = () => {
    const issueDate = new Date(bond.issueDate);
    const maturityDate = new Date(bond.maturityDate);
    const nextCouponDate = bond.nextCouponDate ? new Date(bond.nextCouponDate) : null;
    
    // 計算上次配息日（下次配息日往前推一個週期）
    let lastCouponDate = null;
    if (nextCouponDate) {
      lastCouponDate = new Date(nextCouponDate);
      if (bond.paymentFrequency === '每半年') {
        lastCouponDate.setMonth(lastCouponDate.getMonth() - 6);
      } else if (bond.paymentFrequency === '每年') {
        lastCouponDate.setFullYear(lastCouponDate.getFullYear() - 1);
      } else if (bond.paymentFrequency === '每季') {
        lastCouponDate.setMonth(lastCouponDate.getMonth() - 3);
      } else if (bond.paymentFrequency === '每月') {
        lastCouponDate.setMonth(lastCouponDate.getMonth() - 1);
      }
    }
    
    // 計算下下次配息日
    let nextNextCouponDate = null;
    if (nextCouponDate) {
      nextNextCouponDate = new Date(nextCouponDate);
      if (bond.paymentFrequency === '每半年') {
        nextNextCouponDate.setMonth(nextNextCouponDate.getMonth() + 6);
      } else if (bond.paymentFrequency === '每年') {
        nextNextCouponDate.setFullYear(nextNextCouponDate.getFullYear() + 1);
      } else if (bond.paymentFrequency === '每季') {
        nextNextCouponDate.setMonth(nextNextCouponDate.getMonth() + 3);
      } else if (bond.paymentFrequency === '每月') {
        nextNextCouponDate.setMonth(nextNextCouponDate.getMonth() + 1);
      }
    }
    
    return {
      issueDate: issueDate.toLocaleDateString('zh-TW'),
      lastCouponDate: lastCouponDate ? lastCouponDate.toLocaleDateString('zh-TW') : null,
      nextCouponDate: nextCouponDate ? nextCouponDate.toLocaleDateString('zh-TW') : null,
      nextNextCouponDate: nextNextCouponDate ? nextNextCouponDate.toLocaleDateString('zh-TW') : null,
      maturityDate: maturityDate.toLocaleDateString('zh-TW')
    };
  };

  const paymentTimeline = getPaymentTimeline();

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
    const investmentAmount = transactionAmount || 1000000; // 使用交易金額，預設為100萬
    const annualInterest = (investmentAmount * bond.couponRate) / 100;
    const totalInterest = annualInterest * bond.remainingYears;
    return formatCurrency(totalInterest, bond.currency);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-background">


              <div 
          className="bg-background"
          style={{ 
            width: '794px', 
            height: '1123px',
            margin: '0 auto',
            padding: '16px 24px 24px 24px',
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}
        >
        {/* Header 天 - 根據 Profile type 顯示對應 Logo */}
        <div className="mb-4">
          <div className="flex items-center justify-center mb-3">
            <div className="flex items-center gap-4">
              <div className="h-16 flex items-center justify-center">
                <ProfileLogo />
              </div>
            </div>
          </div>
          <div className="h-1 rounded-full" style={{ 
            background: `linear-gradient(to right, ${auxiliaryColor}20, ${auxiliaryColor}, ${auxiliaryColor}20)` 
          }}></div>
        </div>

        {/* Main Content 中 */}
        <div className="mb-6">
          {/* Top Row - 1:1 比例，不同樣式 */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Company Info - 特殊造型 */}
            <div className="p-6 rounded-xl relative overflow-hidden" style={{ 
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
            }}>
              {/* 裝飾性角標 */}
              <div className="absolute top-0 right-0 w-0 h-0" style={{
                borderLeft: '20px solid transparent',
                borderTop: `20px solid ${auxiliaryColor}`
              }}></div>
              
              <h3 className="font-bold mb-3 text-lg" style={{ color: '#000000' }}>發行公司介紹</h3>
              <div className="mb-3">
                <span className="font-bold text-lg" style={{ color: auxiliaryColor }}>{bond.issuer}</span>
              </div>
              <p className="text-sm leading-relaxed text-left" style={{ color: '#333333' }}>
                {(bond as ExtendedBond)?.emitentInfo?.profile_eng || bond.issuerDescription || `${bond.issuer}為全球領先的企業，信用評等優良，具高度現金流與國際市場地位。`}
              </p>
            </div>

            {/* Bond Details - 不同顏色方案 */}
            <div className="p-6 rounded-lg" style={{ 
              background: 'linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%)',
              border: `2px solid ${auxiliaryColor}`,
              boxShadow: `0 4px 12px ${auxiliaryColor}25`
            }}>
              <h3 className="font-bold mb-4 text-lg" style={{ color: '#333333' }}>債券資訊</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span style={{ color: '#6B7280' }}>債券名稱：</span>
                  <span className="font-semibold" style={{ color: auxiliaryColor }}>{bond.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: '#6B7280' }}>ISIN：</span>
                  <span className="font-mono" style={{ color: '#374151' }}>{bond.isin}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: '#6B7280' }}>票面類型：</span>
                  <span style={{ color: '#374151' }}>{bond.couponType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: '#6B7280' }}>到期日：</span>
                  <span className="font-bold" style={{ color: '#374151' }}>{bond.maturityDate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: '#6B7280' }}>幣別：</span>
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold" style={{ 
                  backgroundColor: auxiliaryColor,
                  color: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  verticalAlign: 'middle'
                }}>{bond.currency}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics - 強制修正 PDF 文字偏下問題 */}
          <div className="flex justify-center gap-8 mb-6">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full mb-2 flex items-center justify-center" style={{ 
                backgroundColor: auxiliaryColor,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span className="font-bold text-lg" style={{ 
                  color: '#FFFFFF',
                  lineHeight: '1',
                  margin: '0',
                  padding: '0',
                  verticalAlign: 'middle',
                  textAlign: 'center',
                  display: 'inline-block'
                }}>{(() => {
                  // 根據客戶需求選擇對應的價格
                  if (tradeDirection === '買') {
                    return typeof bond.askPrice === 'number' ? bond.askPrice.toFixed(2) : bond.askPrice;
                  } else if (tradeDirection === '賣') {
                    return typeof bond.bidPrice === 'number' ? bond.bidPrice.toFixed(2) : bond.bidPrice;
                  } else {
                    // 預設使用 Ask 價格（債券資訊頁面）
                    return typeof bond.askPrice === 'number' ? bond.askPrice.toFixed(2) : bond.askPrice;
                  }
                })()}</span>
              </div>
              <p className="text-sm font-medium" style={{ color: '#333333' }}>價格</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 border-2 rounded-full mb-2 flex items-center justify-center" style={{ 
                backgroundColor: '#FFFFFF',
                borderColor: auxiliaryColor,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span className="font-bold text-sm" style={{ 
                  color: auxiliaryColor,
                  lineHeight: '1',
                  margin: '0',
                  padding: '0',
                  verticalAlign: 'middle',
                  textAlign: 'center',
                  display: 'inline-block'
                }}>
                  {bond.maturityType === '永續' 
                    ? 'N/A' 
                    : `${typeof bond.yieldToMaturity === 'number' ? (bond.yieldToMaturity * 100).toFixed(2) : bond.yieldToMaturity}%`}
                </span>
              </div>
              <p className="text-sm font-medium" style={{ color: '#333333' }}>到期殖利率</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 border-2 rounded-full mb-2 flex items-center justify-center" style={{ 
                backgroundColor: '#FFFFFF',
                borderColor: auxiliaryColor,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span className="font-bold text-sm" style={{ 
                  color: auxiliaryColor,
                  lineHeight: '1',
                  margin: '0',
                  padding: '0',
                  verticalAlign: 'middle',
                  textAlign: 'center',
                  display: 'inline-block'
                }}>{typeof bond.couponRate === 'number' ? bond.couponRate.toFixed(2) : bond.couponRate}%</span>
              </div>
              <p className="text-sm font-medium" style={{ color: '#333333' }}>票面利率</p>
            </div>
          </div>

          {/* Payment Timeline - 固定5點時間軸，紅點對齊置中 */}
          <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: '#F5F5F5' }}>
            <h4 className="font-semibold mb-3" style={{ color: '#333333' }}>配息時間軸 - {bond.paymentFrequency}</h4>
            <div className="flex items-center justify-between w-full">
              {/* 發行日 */}
              <div className="text-center flex-1">
                <div className="w-3 h-3 rounded-full mb-1 mx-auto" style={{ backgroundColor: auxiliaryColor }}></div>
                <p className="text-xs font-medium" style={{ color: '#333333' }}>{paymentTimeline.issueDate}</p>
                <p className="text-xs" style={{ color: '#999999' }}>發行日</p>
              </div>
              
              {/* 連接線1 - 填滿到上次配息日 */}
              <div className="flex-1 h-0.5 mx-2" style={{ backgroundColor: auxiliaryColor }}></div>
              
              {/* 上次配息日 */}
              <div className="text-center flex-1">
                <div className="w-3 h-3 rounded-full mb-1 mx-auto" style={{ backgroundColor: auxiliaryColor }}></div>
                <p className="text-xs font-medium" style={{ color: '#333333' }}>{paymentTimeline.lastCouponDate || '待定'}</p>
                <p className="text-xs" style={{ color: '#999999' }}>上次配息</p>
              </div>
              
              {/* 連接線2 - 未填滿 */}
              <div className="flex-1 h-0.5 mx-2" style={{ backgroundColor: '#999999' }}></div>
              
              {/* 下次配息日 */}
              <div className="text-center flex-1">
                <div className="w-3 h-3 rounded-full mb-1 mx-auto" style={{ backgroundColor: '#999999' }}></div>
                <p className="text-xs font-medium" style={{ color: '#333333' }}>{paymentTimeline.nextCouponDate || '待定'}</p>
                <p className="text-xs" style={{ color: '#999999' }}>下次配息</p>
              </div>
              
              {/* 連接線3 - 未填滿 */}
              <div className="flex-1 h-0.5 mx-2" style={{ backgroundColor: '#999999' }}></div>
              
              {/* 下下次配息日 */}
              <div className="text-center flex-1">
                <div className="w-3 h-3 rounded-full mb-1 mx-auto" style={{ backgroundColor: '#999999' }}></div>
                <p className="text-xs font-medium" style={{ color: '#333333' }}>{paymentTimeline.nextNextCouponDate || '待定'}</p>
                <p className="text-xs" style={{ color: '#999999' }}>下下次配息</p>
              </div>
              
              {/* 連接線4 - 未填滿 */}
              <div className="flex-1 h-0.5 mx-2" style={{ backgroundColor: '#999999' }}></div>
              
              {/* 到期日 */}
              <div className="text-center flex-1">
                <div className="w-3 h-3 rounded-full mb-1 mx-auto" style={{ backgroundColor: '#999999' }}></div>
                <p className="text-xs font-medium" style={{ color: '#333333' }}>{paymentTimeline.maturityDate}</p>
                <p className="text-xs" style={{ color: '#999999' }}>到期日</p>
              </div>
            </div>
            <p className="text-xs mt-2 text-center" style={{ color: auxiliaryColor }}>下一次配息日：{bond.nextCouponDate || '待定'}</p>
          </div>

          {/* Total Interest - 減少高度，文字大小調整 */}
          <div className="border p-4 rounded-lg text-center" style={{ 
            backgroundColor: 'rgba(230, 0, 18, 0.05)', 
            borderColor: 'rgba(230, 0, 18, 0.2)' 
          }}>
            <h4 className="font-bold mb-2 text-lg" style={{ color: '#333333' }}>到期總共可領利息</h4>
            <p className="text-2xl font-bold mb-1" style={{ color: auxiliaryColor }}>{calculateTotalInterest()}</p>
            <p className="text-xs" style={{ color: '#999999' }}>
              （以投資 {formatCurrency(transactionAmount || 1000000, bond.currency)} 面額為例）
            </p>
          </div>
        </div>

        {/* Bottom Section 地 - 等分三區塊，有邊框 */}
        <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
          {/* Basic Info */}
          <div className="p-4 rounded-lg border" style={{ 
            backgroundColor: '#F8F9FA',
            borderColor: '#E5E7EB'
          }}>
            <h4 className="font-semibold mb-3 text-base" style={{ color: '#333333' }}>基本資訊</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span style={{ color: '#6B7280' }}>剩餘年限：</span>
                <span className="font-semibold" style={{ color: auxiliaryColor }}>{bond.remainingYears} 年</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#6B7280' }}>受償順位：</span>
                <span style={{ color: auxiliaryColor }}>{bond.seniority_text || bond.seniority}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#6B7280' }}>配息頻率：</span>
                <span style={{ color: auxiliaryColor }}>{bond.paymentFrequency}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#6B7280' }}>最小承作金額：</span>
                <span className="font-semibold" style={{ color: auxiliaryColor }}>
                  {new Intl.NumberFormat('zh-TW').format(bond.minDenomination)} {bond.currency}
                </span>
              </div>
            </div>
          </div>

          {/* Credit Ratings - 有底色 */}
          <div className="p-4 rounded-lg border" style={{ 
            backgroundColor: '#FEF2F2',
            borderColor: '#FECACA'
          }}>
            <h4 className="font-semibold mb-3 text-base" style={{ color: '#333333' }}>三大信評</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span style={{ color: '#6B7280' }}>Moody's：</span>
                <span className="px-2 py-1 rounded text-xs font-semibold" style={{ 
                  backgroundColor: auxiliaryColor,
                  color: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  verticalAlign: 'middle'
                }}>{bond.moodyRating}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#6B7280' }}>S&P：</span>
                <span className="px-2 py-1 rounded text-xs font-semibold" style={{ 
                  backgroundColor: auxiliaryColor,
                  color: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  verticalAlign: 'middle'
                }}>{bond.spRating}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#6B7280' }}>Fitch：</span>
                <span className="px-2 py-1 rounded text-xs font-semibold" style={{ 
                  backgroundColor: auxiliaryColor,
                  color: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  verticalAlign: 'middle'
                }}>{bond.fitchRating}</span>
              </div>
              <div className="flex justify-between mt-3">
                <span style={{ color: '#6B7280' }}>投資人身分：</span>
                <span style={{ color: '#333333' }}>{bond.investorType.join(', ')}</span>
              </div>
            </div>
          </div>

          {/* Schedule Info */}
          <div className="p-4 rounded-lg border" style={{ 
            backgroundColor: '#F8F9FA',
            borderColor: '#E5E7EB'
          }}>
            <h4 className="font-semibold mb-3 text-base" style={{ color: '#333333' }}>相關日程</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span style={{ color: '#6B7280' }}>發行日：</span>
                <span style={{ color: '#333333' }}>{bond.issueDate}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#6B7280' }}>下一配息日：</span>
                <span className="font-semibold" style={{ color: auxiliaryColor }}>{bond.nextCouponDate || '待定'}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#6B7280' }}>到期類型：</span>
                <span style={{ color: '#333333' }}>{bond.maturityType}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#6B7280' }}>贖回條件：</span>
                <span style={{ color: '#333333' }}>
                  {bond.maturityType === '可提前贖回' ? '可提前贖回' : '不可提前贖回'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 rounded text-center" style={{ backgroundColor: 'rgba(153, 153, 153, 0.2)' }}>
          <p className="text-xs" style={{ color: '#999999' }}>
            本資料僅供參考，不構成投資建議，投資人應自行評估投資風險。
          </p>
        </div>
      </div>
    </div>
  );
};
