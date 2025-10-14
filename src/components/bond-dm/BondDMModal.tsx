import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Bond, ExtendedBond } from '@/types/bond';
import { OriginalBondDM } from './OriginalBondDM';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface BondDMModalProps {
  bond: Bond | ExtendedBond;
  isOpen: boolean;
  onClose: () => void;
  transactionAmount?: number; // 交易金額
  tradeDirection?: string; // 客戶需求：買/賣
}

export const BondDMModal: React.FC<BondDMModalProps> = ({ 
  bond, 
  isOpen, 
  onClose,
  transactionAmount,
  tradeDirection 
}) => {
  const dmRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    if (!dmRef.current) return;

    try {
      // 等待所有圖片載入完成
      const images = dmRef.current.querySelectorAll('img');
      const imagePromises = Array.from(images).map((img) => {
        return new Promise((resolve) => {
          if (img.complete && img.naturalHeight !== 0) {
            resolve(img);
          } else {
            img.onload = () => resolve(img);
            img.onerror = () => resolve(img); // 即使載入失敗也繼續
          }
        });
      });
      
      await Promise.all(imagePromises);
      
      // 額外等待 100ms 確保所有資源載入完成
      await new Promise(resolve => setTimeout(resolve, 100));

      // 優化 html2canvas 設置 - 修正跑版問題
      const canvas = await html2canvas(dmRef.current, {
        scale: 2, // 降低解析度避免跑版
        useCORS: false, // 關閉 CORS 檢查
        allowTaint: true, // 允許跨域圖片
        backgroundColor: '#ffffff',
        width: 794, // 固定 A4 寬度
        height: 1123, // 固定 A4 高度
        logging: false,
        removeContainer: true,
        onclone: (clonedDoc) => {
          // 確保 Logo 圖片在克隆文檔中正確載入
          const clonedImages = clonedDoc.querySelectorAll('img');
          clonedImages.forEach((img) => {
            if (img instanceof HTMLImageElement) {
              // 確保圖片完全載入
              if (!img.complete || img.naturalHeight === 0) {
                // 如果圖片未載入，重新設定 src
                const originalSrc = img.src;
                img.src = '';
                img.src = originalSrc;
              }
              // 確保圖片樣式正確
              img.style.cssText += `
                object-fit: contain !important;
                height: auto !important;
                width: auto !important;
                max-width: 100% !important;
                max-height: 100% !important;
              `;
            }
          });

          // 在克隆的文檔中修正圓圈中文字的垂直對齊問題
          const clonedCircles = clonedDoc.querySelectorAll('.flex.items-center.justify-center');
          clonedCircles.forEach((circle) => {
            if (circle instanceof HTMLElement) {
              // 檢查是否有底色
              const hasBackground = circle.style.backgroundColor || 
                                  getComputedStyle(circle).backgroundColor !== 'rgba(0, 0, 0, 0)';
              
              if (hasBackground) {
                // 修正圓圈的垂直對齊
                circle.style.cssText += `
                  display: flex !important;
                  align-items: center !important;
                  justify-content: center !important;
                  vertical-align: middle !important;
                  text-align: center !important;
                `;
                
                // 調整內部 span 的樣式，修正文字偏下問題
                const span = circle.querySelector('span');
                if (span instanceof HTMLElement) {
                  span.style.cssText += `
                    line-height: 1 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    vertical-align: middle !important;
                    text-align: center !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    height: 100% !important;
                    width: 100% !important;
                    transform: translateY(-3px) !important;
                    position: relative !important;
                  `;
                }
              }
            }
          });

          // 修正克隆文檔中所有圓圈的垂直對齊
          const allClonedCircles = clonedDoc.querySelectorAll('div[class*="rounded-full"]');
          allClonedCircles.forEach((circle) => {
            if (circle instanceof HTMLElement) {
              circle.style.cssText += `
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                vertical-align: middle !important;
                text-align: center !important;
              `;
              
              const spans = circle.querySelectorAll('span');
              spans.forEach((span) => {
                if (span instanceof HTMLElement) {
                  span.style.cssText += `
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    vertical-align: middle !important;
                    text-align: center !important;
                    line-height: 1 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    height: 100% !important;
                    width: 100% !important;
                    transform: translateY(-3px) !important;
                    position: relative !important;
                  `;
                }
              });
            }
          });

          // 使用更強力的方法 - 直接修改所有有背景色的span
          console.log('開始處理PDF背景位置調整...');
          
          const allSpans = clonedDoc.querySelectorAll('span');
          let processedCount = 0;
          
          allSpans.forEach((span) => {
            if (span instanceof HTMLElement) {
              const computedStyle = getComputedStyle(span);
              const inlineBg = span.style.backgroundColor;
              const computedBg = computedStyle.backgroundColor;
              
              // 檢查是否為目標文字（USD, Aaa, AA+, N.A.）
              const text = span.textContent?.trim();
              const isTargetText = text && (text === 'USD' || text === 'Aaa' || text === 'AA+' || text === 'N.A.');
              
              // 檢查是否已經有背景
              const hasBackground = inlineBg || 
                                  (computedBg && computedBg !== 'rgba(0, 0, 0, 0)' && 
                                   computedBg !== 'transparent' && 
                                   computedBg !== 'initial' &&
                                   computedBg !== 'inherit');
              
              // 處理所有目標文字，不管是否已有背景
              if (isTargetText) {
                console.log('處理目標文字:', text, '內聯背景:', inlineBg, '計算背景:', computedBg);
                
                // 獲取原始背景色，如果是目標文字且沒有背景，使用預設色
                let originalBg = span.style.backgroundColor || getComputedStyle(span).backgroundColor;
                if (isTargetText && (!originalBg || originalBg === 'rgba(0, 0, 0, 0)' || originalBg === 'transparent')) {
                  originalBg = '#9d5bc3'; // 預設的輔助色
                }
                
                // 設定基本樣式
                span.style.setProperty('display', 'inline-block', 'important');
                span.style.setProperty('vertical-align', 'baseline', 'important');
                span.style.setProperty('text-align', 'center', 'important');
                span.style.setProperty('line-height', '1.2', 'important');
                span.style.setProperty('position', 'relative', 'important');
                
                // 創建以文字為中心的背景
                const textNode = span.childNodes[0];
                if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                  const textContent = textNode.textContent || '';
                  
                  // 創建包裝容器
                  const wrapper = clonedDoc.createElement('span');
                  wrapper.style.cssText = `
                    position: relative !important;
                    display: inline-block !important;
                    vertical-align: baseline !important;
                  `;
                  
                  // 創建背景元素（包含文字和 padding）
                  const backgroundElement = clonedDoc.createElement('span');
                  backgroundElement.style.cssText = `
                    background-color: ${originalBg} !important;
                    color: #FFFFFF !important;
                    padding: 4px 8px !important;
                    border-radius: 12px !important;
                    display: inline-block !important;
                    vertical-align: middle !important;
                    white-space: nowrap !important;
                    position: relative !important;
                    line-height: 1 !important;
                    text-align: center !important;
                  `;
                  backgroundElement.textContent = textContent;
                  
                                  // 清空原 span 並重新組織
                span.innerHTML = '';
                span.style.setProperty('padding', '0', 'important');
                span.style.setProperty('margin', '0', 'important');
                span.style.setProperty('background-color', 'transparent', 'important');
                span.appendChild(wrapper);
                wrapper.appendChild(backgroundElement);
                  
                  console.log('創建以文字為中心的背景，顏色:', originalBg, '文字:', textContent);
                } else {
                  // 備用方案：直接設定背景
                  span.style.setProperty('background-color', originalBg, 'important');
                  span.style.setProperty('color', '#FFFFFF', 'important');
                  span.style.setProperty('padding', '2px 6px', 'important');
                  span.style.setProperty('border-radius', '12px', 'important');
                  span.style.setProperty('display', 'inline-block', 'important');
                  span.style.setProperty('vertical-align', 'baseline', 'important');
                  
                  console.log('備用方案：直接設定背景色，顏色:', originalBg, '文字:', text);
                }
                
                processedCount++;
              } else {
                // 調試：顯示沒有背景的span
                if (text && (text === 'USD' || text === 'Aaa' || text === 'AA+' || text === 'N.A.')) {
                  console.log('未檢測到背景的目標span:', text, '內聯背景:', inlineBg, '計算背景:', computedBg);
                }
              }
            }
          });
          
          console.log(`總共處理了 ${processedCount} 個有背景的span元素`);
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // A4 標準尺寸 (mm)
      const pdfWidth = 210;
      const pdfHeight = 297;
      
      // 滿版 PDF 設定 - 減少白邊，讓內容更滿版
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // 計算縮放比例，優先填滿寬度，讓內容更滿版
      const scaleX = pdfWidth / imgWidth;
      const scaleY = pdfHeight / imgHeight;
      
      // 使用較大的縮放比例，讓內容更滿版
      const scale = Math.max(scaleX, scaleY) * 25.4; // 轉換為 mm
      
      // 計算最終尺寸
      const finalWidth = imgWidth * scale / 25.4;
      const finalHeight = imgHeight * scale / 25.4;
      
      // 計算位置，讓內容填滿整個 A4 頁面
      let offsetX = 0;
      let offsetY = 0;
      
      if (finalWidth > pdfWidth) {
        // 如果寬度超出，居中顯示
        offsetX = (finalWidth - pdfWidth) / 2;
      }
      
      if (finalHeight > pdfHeight) {
        // 如果高度超出，居中顯示
        offsetY = (finalHeight - pdfHeight) / 2;
      }
      
      // 添加圖片到 PDF，使用滿版設定
      pdf.addImage(imgData, 'JPEG', -offsetX, -offsetY, finalWidth, finalHeight);
      
      // 生成檔案名稱
      const fileName = `${bond.name}-債券資訊-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      console.log('PDF 生成成功！');
    } catch (error) {
      console.error('PDF 生成失敗:', error);
      alert('PDF 生成失敗，請稍後再試');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            債券 DM - {bond.name}
          </h2>
          <div className="flex items-center gap-2">
            <Button 
              variant="default" 
              size="sm" 
              onClick={downloadPDF}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              下載 PDF
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="gap-2">
              <X className="w-4 h-4" />
              關閉
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
          <div ref={dmRef}>
            <OriginalBondDM bond={bond} isPreview={true} transactionAmount={transactionAmount} tradeDirection={tradeDirection} />
          </div>
        </div>
      </div>
    </div>
  );
};
