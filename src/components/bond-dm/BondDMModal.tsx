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
}

export const BondDMModal: React.FC<BondDMModalProps> = ({ 
  bond, 
  isOpen, 
  onClose,
  transactionAmount 
}) => {
  const dmRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    if (!dmRef.current) return;

    try {
      // 在 PDF 生成前，只針對有底色文字的圓圈添加 padding 修正
      const circles = dmRef.current.querySelectorAll('.flex.items-center.justify-center');
      const originalStyles: string[] = [];
      
      circles.forEach((circle, index) => {
        if (circle instanceof HTMLElement) {
          // 保存原始樣式
          originalStyles[index] = circle.style.cssText;
          
          // 檢查是否有底色（紅色背景或白色背景）
          const hasBackground = circle.style.backgroundColor || 
                              getComputedStyle(circle).backgroundColor !== 'rgba(0, 0, 0, 0)';
          
          if (hasBackground) {
            // 只對有底色的圓圈添加 padding 修正
            circle.style.cssText += `
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              padding-top: 8px !important;
              padding-bottom: 8px !important;
            `;
            
            // 調整內部 span 的樣式
            const span = circle.querySelector('span');
            if (span instanceof HTMLElement) {
              span.style.cssText += `
                line-height: 1 !important;
                margin: 0 !important;
                padding: 0 !important;
              `;
            }
          }
        }
      });

      // 優化 html2canvas 設置 - 修正跑版問題
      const canvas = await html2canvas(dmRef.current, {
        scale: 2, // 降低解析度避免記憶體問題
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: undefined, // 讓 html2canvas 自動計算寬度
        height: undefined, // 讓 html2canvas 自動計算高度
        logging: false,
        removeContainer: true,
        onclone: (clonedDoc) => {
          // 在克隆的文檔中再次應用樣式，只針對有底色的圓圈
          const clonedCircles = clonedDoc.querySelectorAll('.flex.items-center.justify-center');
          clonedCircles.forEach((circle) => {
            if (circle instanceof HTMLElement) {
              // 檢查是否有底色
              const hasBackground = circle.style.backgroundColor || 
                                  getComputedStyle(circle).backgroundColor !== 'rgba(0, 0, 0, 0)';
              
              if (hasBackground) {
                circle.style.cssText += `
                  display: flex !important;
                  align-items: center !important;
                  justify-content: center !important;
                  padding-top: 8px !important;
                  padding-bottom: 8px !important;
                `;
                
                const span = circle.querySelector('span');
                if (span instanceof HTMLElement) {
                  span.style.cssText += `
                    line-height: 1 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                  `;
                }
              }
            }
          });
        }
      });

      // 恢復原始樣式
      circles.forEach((circle, index) => {
        if (circle instanceof HTMLElement && originalStyles[index]) {
          circle.style.cssText = originalStyles[index];
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
            <OriginalBondDM bond={bond} isPreview={true} transactionAmount={transactionAmount} />
          </div>
        </div>
      </div>
    </div>
  );
};
