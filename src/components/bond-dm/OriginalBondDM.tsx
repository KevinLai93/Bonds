import React from 'react';
import { Bond, ExtendedBond } from '@/types/bond';

interface OriginalBondDMProps {
  bond: Bond | ExtendedBond;
  isPreview?: boolean;
  transactionAmount?: number; // 交易金額
}

export const OriginalBondDM: React.FC<OriginalBondDMProps> = ({ 
  bond, 
  isPreview = false,
  transactionAmount 
}) => {

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
        {/* Header 天 - 使用華南永昌證券 Logo */}
        <div className="mb-4">
          <div className="flex items-center justify-center mb-3">
            <div className="flex items-center gap-4">
              <img 
                src="/hua-nan-logo.png" 
                alt="華南永昌證券" 
                className="h-16 w-auto"
              />
            </div>
          </div>
          <div className="h-1 rounded-full" style={{ background: 'linear-gradient(to right, rgba(230, 0, 18, 0.2), #E60012, rgba(230, 0, 18, 0.2))' }}></div>
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
                borderTop: '20px solid #E60012'
              }}></div>
              
              <h3 className="font-bold mb-3 text-lg" style={{ color: '#000000' }}>發行公司介紹</h3>
              <div className="mb-3">
                <span className="font-bold text-lg" style={{ color: '#E60012' }}>{bond.issuer}</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#333333' }}>
                {(bond as ExtendedBond)?.emitentInfo?.profile_eng || bond.issuerDescription || `${bond.issuer}為全球領先的企業，信用評等優良，具高度現金流與國際市場地位。`}
              </p>
            </div>

            {/* Bond Details - 不同顏色方案 */}
            <div className="p-6 rounded-lg" style={{ 
              background: 'linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%)',
              border: '2px solid #E60012',
              boxShadow: '0 4px 12px rgba(230, 0, 18, 0.15)'
            }}>
              <h3 className="font-bold mb-4 text-lg" style={{ color: '#333333' }}>債券資訊</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span style={{ color: '#6B7280' }}>債券名稱：</span>
                  <span className="font-semibold" style={{ color: '#E60012' }}>{bond.name}</span>
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
                    backgroundColor: '#E60012',
                    color: '#FFFFFF'
                  }}>{bond.currency}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics - 強制修正 PDF 文字偏下問題 */}
          <div className="flex justify-center gap-8 mb-6">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full mb-2 flex items-center justify-center" style={{ 
                backgroundColor: '#E60012',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}>
                <span className="font-bold text-lg" style={{ 
                  color: '#FFFFFF',
                  lineHeight: '1',
                  margin: '0',
                  padding: '0'
                }}>{typeof bond.bidPrice === 'number' ? bond.bidPrice.toFixed(2) : bond.bidPrice}</span>
              </div>
              <p className="text-sm font-medium" style={{ color: '#333333' }}>價格</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 border-2 rounded-full mb-2 flex items-center justify-center" style={{ 
                backgroundColor: '#FFFFFF',
                borderColor: '#E60012',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}>
                <span className="font-bold text-sm" style={{ 
                  color: '#E60012',
                  lineHeight: '1',
                  margin: '0',
                  padding: '0'
                }}>{typeof bond.yieldToMaturity === 'number' ? (bond.yieldToMaturity * 100).toFixed(2) : bond.yieldToMaturity}%</span>
              </div>
              <p className="text-sm font-medium" style={{ color: '#333333' }}>到期殖利率</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 border-2 rounded-full mb-2 flex items-center justify-center" style={{ 
                backgroundColor: '#FFFFFF',
                borderColor: '#E60012',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}>
                <span className="font-bold text-sm" style={{ 
                  color: '#E60012',
                  lineHeight: '1',
                  margin: '0',
                  padding: '0'
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
                <div className="w-3 h-3 rounded-full mb-1 mx-auto" style={{ backgroundColor: '#E60012' }}></div>
                <p className="text-xs font-medium" style={{ color: '#333333' }}>{paymentTimeline.issueDate}</p>
                <p className="text-xs" style={{ color: '#999999' }}>發行日</p>
              </div>
              
              {/* 連接線1 - 填滿到上次配息日 */}
              <div className="flex-1 h-0.5 mx-2" style={{ backgroundColor: '#E60012' }}></div>
              
              {/* 上次配息日 */}
              <div className="text-center flex-1">
                <div className="w-3 h-3 rounded-full mb-1 mx-auto" style={{ backgroundColor: '#E60012' }}></div>
                <p className="text-xs font-medium" style={{ color: '#333333' }}>{paymentTimeline.lastCouponDate || '待定'}</p>
                <p className="text-xs" style={{ color: '#999999' }}>上次配息</p>
              </div>
              
              {/* 連接線2 - 未填滿 */}
              <div className="flex-1 h-0.5 mx-2" style={{ backgroundColor: '#999999' }}></div>
              
              {/* 下次配息日 */}
              <div className="text-center flex-1">
                <div className="w-3 h-3 rounded-full mb-1 mx-auto" style={{ backgroundColor: '#E60012' }}></div>
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
            <p className="text-xs mt-2 text-center" style={{ color: '#E60012' }}>下一次配息日：{bond.nextCouponDate || '待定'}</p>
          </div>

          {/* Total Interest - 減少高度，文字大小調整 */}
          <div className="border p-4 rounded-lg text-center" style={{ 
            backgroundColor: 'rgba(230, 0, 18, 0.05)', 
            borderColor: 'rgba(230, 0, 18, 0.2)' 
          }}>
            <h4 className="font-bold mb-2 text-lg" style={{ color: '#333333' }}>到期總共可領利息</h4>
            <p className="text-2xl font-bold mb-1" style={{ color: '#E60012' }}>{calculateTotalInterest()}</p>
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
                <span className="font-semibold" style={{ color: '#333333' }}>{bond.remainingYears} 年</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#6B7280' }}>受償順位：</span>
                <span style={{ color: '#333333' }}>{bond.seniority_text || bond.seniority}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#6B7280' }}>配息頻率：</span>
                <span style={{ color: '#333333' }}>{bond.paymentFrequency}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#6B7280' }}>最小承作金額：</span>
                <span className="font-semibold" style={{ color: '#E60012' }}>
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
                  backgroundColor: '#E60012',
                  color: '#FFFFFF'
                }}>{bond.moodyRating}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#6B7280' }}>S&P：</span>
                <span className="px-2 py-1 rounded text-xs font-semibold" style={{ 
                  backgroundColor: '#E60012',
                  color: '#FFFFFF'
                }}>{bond.spRating}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#6B7280' }}>Fitch：</span>
                <span className="px-2 py-1 rounded text-xs font-semibold" style={{ 
                  backgroundColor: '#E60012',
                  color: '#FFFFFF'
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
                <span className="font-semibold" style={{ color: '#E60012' }}>{bond.nextCouponDate || '待定'}</span>
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
