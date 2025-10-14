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
  transactionAmount?: number; // 客戶需求：交易金額
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

      // 找到 DM 內容區域（固定尺寸的 div），只截取 DM 部分
      const dmContent = dmRef.current.querySelector('div[style*="width: 794px"]') || dmRef.current;
      
      // 最簡化 html2canvas 設置避免跑版
      const canvas = await html2canvas(dmContent, {
        backgroundColor: '#ffffff',
        logging: false,
        width: 794, // 固定 DM 寬度
        height: 1123, // 固定 DM 高度
        onclone: (clonedDoc) => {
          // 處理跨域圖片問題 - 根據不同帳號類型使用對應的本地圖片
          const clonedImages = clonedDoc.querySelectorAll('img');
          console.log('🔍 onclone: 找到', clonedImages.length, '個圖片');
          
          clonedImages.forEach((img, index) => {
            if (img instanceof HTMLImageElement) {
              console.log(`🖼️ 圖片 ${index + 1}:`, img.src);
              
              // 如果是跨域圖片，根據 URL 判斷使用哪個本地圖片
              if (img.src.includes('s3.ap-northeast-1.amazonaws.com')) {
                console.log('🌐 發現跨域圖片:', img.src);
                
                if (img.src.includes('darwin.png')) {
                  console.log('🦘 替換為 Darwin Logo');
                  img.src = window.location.origin + '/darwin.png';
                } else if (img.src.includes('esun.png')) {
                  console.log('🏦 替換為玉山 Logo');
                  img.src = window.location.origin + '/esun.png';
                } else if (img.src.includes('hua-nan-logo.png')) {
                  console.log('🏢 替換為華南 Logo');
                  img.src = window.location.origin + '/hua-nan-logo.png';
                } else if (img.src.includes('masterlink.png')) {
                  console.log('📊 替換為元富 Logo');
                  img.src = window.location.origin + '/masterlink.png';
                } else if (img.src.includes('ubot-logo.png')) {
                  console.log('🤖 替換為 Ubot Logo');
                  img.src = window.location.origin + '/ubot-logo.png';
                } else {
                  console.log('🔄 替換為預設 EUF Logo');
                  img.src = window.location.origin + '/euf.png';
                }
                
                console.log('✅ 新圖片路徑:', img.src);
              }
            }
          });
        }
      });

      // 使用更簡單的方式生成 PDF
      const imgData = canvas.toDataURL('image/png');
      
      // 創建 PDF 實例
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // 獲取 A4 尺寸
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // 滿版顯示，直接填滿整個 A4 頁面
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
      
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