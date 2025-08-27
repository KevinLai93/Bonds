import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Download, Plus, ChevronDown, ChevronUp, MoreHorizontal,
  GripVertical, Eye, FileText, FileImage, Upload, Palette, AlertCircle, X
} from 'lucide-react';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { sampleBond, type Bond } from '@/types/bond';
import { ProfessionalBondCard } from '@/components/ProfessionalBondCard';
import { useBondSearch } from '@/contexts/BondSearchContext';

// === A4 常數（輸出像素） ===
export const PX_A4_300 = { w: 2480, h: 3508 }; // 210/25.4*300, 297/25.4*300
export const PX_A4_150 = { w: 1240, h: 1754 }; // 210/25.4*150, 297/25.4*150

// === 債券資料查詢（優先使用 API 結果，否則使用樣本資料） ===
const getBondByIsin = (isin: string, searchedBond: Bond | null): Bond | null => {
  // 如果搜尋結果的 ISIN 匹配，使用 API 資料
  if (searchedBond && searchedBond.isin === isin) {
    return searchedBond;
  }
  // 否則檢查是否為樣本資料
  return sampleBond.isin === isin ? sampleBond : null;
};

interface EditableCardData {
  // Header & Design
  logoText: string;
  mainTitle: string;
  subtitle: string;

  // 債券基本資訊
  productName: string;
  isin: string;
  currency: string;
  investorType: string[];
  couponRate: string;
  couponType: string;
  minAmount: string;
  minIncrement: string;
  accruedInterest: string;

  // 重要日程
  issueDate: string;
  maturityDate: string;
  lastCouponDate: string;
  nextCouponDate: string;
  nextCallDate: string;

  // 價格與殖利率
  bidPrice: string;
  ytm: string;
  askPrice: string;
  tradingPrice: string;
  quantity: string;
  transactionAmount: string;
  totalSettlement: string;
  remainingYears: string;

  // 三大評等
  spRating: string;
  moodyRating: string;
  fitchRating: string;
  seniorityRank: string;
  maturityType: string;
  paymentFrequency: string;

  // 發行資訊
  issuer: string;
  industry: string;
  country: string;
  parentCode: string;
  issuerDescription: string;
  issuerControl: string;
  riskNotes: string;
  defaultProbability: string;
  outstandingAmount: string;
  tlacMrel: boolean;
}

interface ThemeConfig {
  autoColorFromLogo: boolean;
  lockThemeColor: boolean;
  colorSource: 'logo' | 'manual' | 'default';
  brandColors: {
    50: string; 100: string; 200: string; 300: string; 400: string;
    500: string; 600: string; 700: string; 800: string; 900: string;
    foreground: string;
  };
}

const CardEditor = () => {
  const { isin } = useParams<{ isin: string }>();
  const { bond: searchedBond, searchByISIN } = useBondSearch();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [isExtractingColors, setIsExtractingColors] = useState(false);
  const [openAccordions, setOpenAccordions] = useState<string[]>(['header', 'basic-info', 'pricing', 'ratings']);

  // 預覽狀態與參考
  const [showPreview, setShowPreview] = useState(false);
  const previewViewportRef = useRef<HTMLDivElement>(null);
  const previewA4Ref = useRef<HTMLDivElement>(null);

  // 匯出方向 / 單頁設定（沿用你原本）
  const [orientation] = useState<'portrait' | 'landscape'>('portrait');
  const [strictSinglePage] = useState(true);

  if (!isin) return <Navigate to="/search" replace />;
  
  // 嘗試取得債券資料
  const bond = getBondByIsin(isin, searchedBond);
  
  // 如果沒有找到債券資料，嘗試搜尋
  useEffect(() => {
    if (!bond && isin && isin !== searchedBond?.isin) {
      searchByISIN(isin);
    }
  }, [bond, isin, searchedBond?.isin, searchByISIN]);
  
  // 如果沒有債券資料且不是載入中，返回搜尋頁面
  if (!bond && searchedBond?.isin !== isin) {
    return <Navigate to="/search" replace />;
  }

  // 編輯資料（根據債券資料初始化）
  const [cardData, setCardData] = useState<EditableCardData>(() => {
    if (bond) {
      return {
        logoText: 'EUF BondDesk Pro',
        mainTitle: bond.name || '債券投資機會',
        subtitle: '專業債券投資服務',
        productName: bond.name || '',
        isin: bond.isin || '',
        currency: bond.currency || '',
        investorType: ['一般'],
        couponRate: bond.couponRate?.toString() || '',
        couponType: bond.couponType || '固定',
        minAmount: bond.minDenomination?.toString() || '',
        minIncrement: '10000',
        accruedInterest: bond.accruedInterest?.toString() || '',
        issueDate: bond.issueDate || '',
        maturityDate: bond.maturityDate || '',
        lastCouponDate: bond.previousCouponDate || '',
        nextCouponDate: bond.nextCouponDate || '',
        nextCallDate: '',
        bidPrice: bond.bidPrice?.toString() || '',
        ytm: bond.yieldToMaturity?.toString() || '',
        askPrice: bond.askPrice?.toString() || '',
        tradingPrice: bond.bidPrice?.toString() || '',
        quantity: '30000.00',
        transactionAmount: '',
        totalSettlement: '',
        remainingYears: bond.remainingYears?.toString() || '',
        spRating: bond.spRating || '',
        moodyRating: bond.moodyRating || '',
        fitchRating: bond.fitchRating || '',
        seniorityRank: bond.seniority_text || bond.seniority || '',
        maturityType: '到期償還',
        paymentFrequency: bond.paymentFrequency || '',
        issuer: bond.issuer || '',
        industry: bond.industry || '',
        country: bond.country || '',
        parentCode: '',
        issuerDescription: bond.issuerDescription || '',
        issuerControl: '• 嚴格的財務管控\n• 定期財務報告\n• 信用評等監控',
        riskNotes: bond.riskNotes || '匯率風險、利率風險、信用風險',
        defaultProbability: '0.0000',
        outstandingAmount: bond.outstandingAmount?.toString() || '',
        tlacMrel: false
      };
    }
    // 預設資料
    return {
      logoText: 'EUF BondDesk Pro',
      mainTitle: '債券投資機會',
      subtitle: '專業債券投資服務',
      productName: '',
      isin: isin || '',
      currency: 'USD',
      investorType: ['一般'],
      couponRate: '',
      couponType: '固定',
      minAmount: '',
      minIncrement: '10000',
      accruedInterest: '',
      issueDate: '',
      maturityDate: '',
      lastCouponDate: '',
      nextCouponDate: '',
      nextCallDate: '',
      bidPrice: '',
      ytm: '',
      askPrice: '',
      tradingPrice: '',
      quantity: '30000.00',
      transactionAmount: '',
      totalSettlement: '',
      remainingYears: '',
      spRating: '',
      moodyRating: '',
      fitchRating: '',
      seniorityRank: '',
      maturityType: '到期償還',
      paymentFrequency: '',
      issuer: '',
      industry: '',
      country: '',
      parentCode: '',
      issuerDescription: '',
      issuerControl: '• 嚴格的財務管控\n• 定期財務報告\n• 信用評等監控',
      riskNotes: '匯率風險、利率風險、信用風險',
      defaultProbability: '0.0000',
      outstandingAmount: '',
      tlacMrel: false
    };
  });

  // 當債券資料更新時，更新編輯資料
  useEffect(() => {
    if (bond && bond.isin === isin) {
      setCardData(prev => ({
        ...prev,
        productName: bond.name || prev.productName,
        isin: bond.isin || prev.isin,
        currency: bond.currency || prev.currency,
        couponRate: bond.couponRate?.toString() || prev.couponRate,
        couponType: bond.couponType || prev.couponType,
        minAmount: bond.minDenomination?.toString() || prev.minAmount,
        accruedInterest: bond.accruedInterest?.toString() || prev.accruedInterest,
        issueDate: bond.issueDate || prev.issueDate,
        maturityDate: bond.maturityDate || prev.maturityDate,
        lastCouponDate: bond.previousCouponDate || prev.lastCouponDate,
        nextCouponDate: bond.nextCouponDate || prev.nextCouponDate,
        bidPrice: bond.bidPrice?.toString() || prev.bidPrice,
        ytm: bond.yieldToMaturity?.toString() || prev.ytm,
        askPrice: bond.askPrice?.toString() || prev.askPrice,
        tradingPrice: bond.bidPrice?.toString() || prev.tradingPrice,
        remainingYears: bond.remainingYears?.toString() || prev.remainingYears,
        spRating: bond.spRating || prev.spRating,
        moodyRating: bond.moodyRating || prev.moodyRating,
        fitchRating: bond.fitchRating || prev.fitchRating,
        seniorityRank: bond.seniority_text || bond.seniority || prev.seniorityRank,
        paymentFrequency: bond.paymentFrequency || prev.paymentFrequency,
        issuer: bond.issuer || prev.issuer,
        industry: bond.industry || prev.industry,
        country: bond.country || prev.country,
        issuerDescription: bond.issuerDescription || prev.issuerDescription,
        riskNotes: bond.riskNotes || prev.riskNotes,
        outstandingAmount: bond.outstandingAmount?.toString() || prev.outstandingAmount,
      }));
    }
  }, [bond, isin]);

  const [themeConfig, setThemeConfig] = useState<ThemeConfig>({
    autoColorFromLogo: true,
    lockThemeColor: false,
    colorSource: 'default',
    brandColors: {
      50: '0 85% 97%',
      100: '0 85% 94%',
      200: '0 85% 89%',
      300: '0 85% 82%',
      400: '0 85% 71%',
      500: '0 85% 59%',
      600: '0 85% 47%',
      700: '0 85% 37%',
      800: '0 85% 29%',
      900: '0 85% 23%',
      foreground: '0 0% 100%'
    }
  });

  const handleInputChange = useCallback((field: keyof EditableCardData, value: string | string[] | boolean) => {
    setCardData(prev => ({ ...prev, [field]: value as any }));
  }, []);

  // ===== 顏色處理（沿用你原本） =====
  const generateBrandScale = useCallback((baseColor: string) => {
    const hexToHsl = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) { case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break; }
        h /= 6;
      }
      return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
    };
    const [h, s, l] = hexToHsl(baseColor);
    return {
      50: `${h} ${Math.max(s - 20, 10)}% 97%`,
      100: `${h} ${Math.max(s - 15, 15)}% 94%`,
      200: `${h} ${Math.max(s - 10, 20)}% 89%`,
      300: `${h} ${Math.max(s - 5, 25)}% 82%`,
      400: `${h} ${s}% 71%`,
      500: `${h} ${s}% ${Math.max(l - 10, 50)}%`,
      600: `${h} ${s}% ${Math.max(l - 20, 40)}%`,
      700: `${h} ${s}% ${Math.max(l - 30, 30)}%`,
      800: `${h} ${s}% ${Math.max(l - 40, 20)}%`,
      900: `${h} ${s}% ${Math.max(l - 50, 10)}%`,
      foreground: l > 50 ? '0 0% 0%' : '0 0% 100%'
    };
  }, []);

  const applyBrandColors = useCallback((colors: ThemeConfig['brandColors']) => {
    const root = document.documentElement;
    Object.entries(colors).forEach(([k, v]) => {
      if (k === 'foreground') root.style.setProperty('--brand-foreground', v);
      else root.style.setProperty(`--brand-${k}`, v);
    });
    root.style.setProperty('--brand', 'var(--brand-600)');
  }, []);

  // ===== Logo 上傳＆取色（沿用你原本） =====
  const extractDominantColor = async (imageFile: File): Promise<string> =>
    new Promise<string>((resolve) => {
      setIsExtractingColors(true);
      try {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        img.onload = () => {
          if (!ctx) return resolve('#DC2626');
          const size = 100; canvas.width = size; canvas.height = size;
          ctx.drawImage(img, 0, 0, size, size);
          const { data } = ctx.getImageData(0, 0, size, size);
          const map = new Map<string, number>();
          for (let i = 0; i < data.length; i += 16) {
            const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
            if (a < 128) continue;
            const bright = (r*299 + g*587 + b*114) / 1000;
            if (bright < 50 || bright > 200) continue;
            const hex = `#${((1<<24) + (r<<16)+(g<<8)+b).toString(16).slice(1)}`;
            map.set(hex, (map.get(hex) || 0) + 1);
          }
          let dom = '#DC2626', max = 0;
          for (const [c,cnt] of map.entries()) if (cnt > max) { dom = c; max = cnt; }
          resolve(dom);
        };
        img.src = URL.createObjectURL(imageFile);
      } finally {
        setIsExtractingColors(false);
      }
    });

  // Convert blob to base64 for better export compatibility
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('請選擇圖片檔案');
    if (file.size > 5 * 1024 * 1024) return toast.error('圖片檔案大小不能超過 5MB');
    
    try {
      // Convert to base64 for better export compatibility
      const base64 = await blobToBase64(file);
      setLogoImage(base64);
      
      if (themeConfig.autoColorFromLogo && !themeConfig.lockThemeColor) {
        const dominant = await extractDominantColor(file);
        const scale = generateBrandScale(dominant);
        setThemeConfig(p => ({ ...p, brandColors: scale, colorSource: 'logo' }));
        applyBrandColors(scale);
        toast.success('Logo 上傳成功！已自動更新配色');
      } else {
        toast.success('Logo 上傳成功！');
      }
    } catch (error) {
      console.error('Logo upload failed:', error);
      toast.error('Logo 上傳失敗');
    }
  };
  const handleRemoveLogo = () => { if (logoImage) URL.revokeObjectURL(logoImage); setLogoImage(null); toast.success('Logo 已移除'); };

  const handleColorChange = (hex: string) => {
    if (themeConfig.lockThemeColor) return;
    const scale = generateBrandScale(hex);
    setThemeConfig(p => ({ ...p, brandColors: scale, colorSource: 'manual', autoColorFromLogo: false }));
    applyBrandColors(scale);
  };

  useEffect(() => { applyBrandColors(themeConfig.brandColors); }, [applyBrandColors, themeConfig.brandColors]);

  // Wait for all images to load
  const waitForImages = (element: HTMLElement): Promise<void> => {
    return new Promise((resolve) => {
      const images = element.querySelectorAll('img');
      let loadedCount = 0;
      const totalImages = images.length;
      
      if (totalImages === 0) {
        resolve();
        return;
      }
      
      const checkComplete = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
          console.log('Export: All images loaded');
          resolve();
        }
      };
      
      images.forEach(img => {
        if (img.complete && img.naturalHeight !== 0) {
          checkComplete();
        } else {
          img.onload = checkComplete;
          img.onerror = checkComplete;
        }
      });
      
      // Fallback timeout
      setTimeout(() => {
        console.log('Export: Image loading timeout, proceeding anyway');
        resolve();
      }, 3000);
    });
  };

  // ===== 簡化的匯出準備 =====
  const prepareForExport = async () => {
    const card = document.getElementById('bondA4');
    console.log('Export: Finding bondA4 element:', card);
    
    if (!card) {
      console.error('Export: bondA4 element not found in DOM');
      toast.error('匯出失敗：找不到圖卡元素');
      return null;
    }
    
    console.log('Export: Setting up card for export');
    
    // 儲存原始樣式
    const originalStyles = {
      visibility: card.style.visibility,
      position: card.style.position,
      zIndex: card.style.zIndex,
      display: card.style.display,
    };
    
    card.dataset.originalStyles = JSON.stringify(originalStyles);
    
    // 設置為可見和可捕獲
    card.style.visibility = 'visible';
    card.style.position = 'static';
    card.style.zIndex = 'auto';
    card.style.display = 'block';
    
    // 確保所有收合區塊都展開
    setOpenAccordions(['header', 'basic-info', 'pricing', 'ratings']);
    
    // 等待 DOM 更新和圖片載入
    console.log('Export: Waiting for DOM update');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Wait for images to load
    console.log('Export: Waiting for images to load');
    await waitForImages(card);
    
    console.log('Export: Card prepared successfully, dimensions:', card.offsetWidth, 'x', card.offsetHeight);
    return card;
  };
  const restoreAfterExport = (card: HTMLElement | null) => {
    if (!card) return;
    console.log('Export: Restoring card after export');
    
    try {
      // 恢復所有修改的樣式
      if (card.dataset.originalStyles) {
        const originalStyles = JSON.parse(card.dataset.originalStyles);
        console.log('Export: Restoring card styles:', originalStyles);
        
        card.style.visibility = originalStyles.visibility || '';
        card.style.position = originalStyles.position || '';
        card.style.zIndex = originalStyles.zIndex || '';
        card.style.display = originalStyles.display || '';
        card.style.alignItems = originalStyles.alignItems || '';
        card.style.justifyContent = originalStyles.justifyContent || '';
        
        delete card.dataset.originalStyles;
      }
      
      console.log('Export: Card restoration completed');
    } catch (error) {
      console.error('Export: Error during restoration:', error);
    }
  };
  const fitToA4 = (card: HTMLElement) => {
    if (!strictSinglePage) return;
    const innerH = card.clientHeight;
    const contentH = card.scrollHeight;
    const scale = Math.min(1, innerH / contentH);
    if (scale < 1) {
      card.style.transform = `scale(${scale})`;
      card.style.transformOrigin = 'center center';  // Center the scaling
    }
  };
  const downloadPNG = async (dpi: 150 | 300 = 300) => {
    const { w, h } = dpi === 300 ? PX_A4_300 : PX_A4_150;
    console.log(`Export: Starting PNG export at ${dpi}DPI`);
    setIsExporting(true);
    
    try {
      const card = await prepareForExport();
      if (!card) {
        console.error('Export: Failed to prepare card for export');
        return;
      }
      
      console.log('Export: Waiting for DOM update and font loading');
      await new Promise(r => setTimeout(r, 1000)); // Extended wait time
      fitToA4(card);
      
      console.log('Export: Generating PNG with dimensions:', w, 'x', h);
      
      // Enhanced toPng options for better compatibility
      const options = {
        pixelRatio: 1,
        width: w,
        height: h,
        cacheBust: true,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        skipFonts: false,
        preferredFontFormat: 'woff2',
        style: { 
          transform: 'none',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        },
        filter: (node: HTMLElement) => {
          // Skip problematic elements
          if (node.tagName === 'SCRIPT') return false;
          if (node.tagName === 'STYLE' && node.textContent?.includes('@import')) return false;
          return true;
        }
      };
      
      const dataUrl = await toPng(card, options);
      console.log('Export: PNG generated successfully, length:', dataUrl.length);
      
      restoreAfterExport(card);
      
      // Create download link
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `euf-bond-${dpi}dpi.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      console.log('Export: Download triggered');
      toast.success(`PNG ${dpi}DPI 下載完成`);
      
    } catch (error) {
      console.error('Export: PNG export failed with full error:', error);
      console.error('Export: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('Export: Error name:', error instanceof Error ? error.name : 'Unknown');
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Export: Error message details:', errorMessage);
      
      // Provide more specific error messages based on error type
      if (errorMessage.includes('Failed to fetch')) {
        toast.error('PNG 匯出失敗：圖片載入問題，請檢查 Logo 圖片格式');
        console.log('Export: Suggestion - Try removing logo or using a different image format');
      } else if (errorMessage.includes('canvas')) {
        toast.error('PNG 匯出失敗：Canvas 渲染問題，請嘗試簡化內容');
      } else if (errorMessage.includes('NetworkError')) {
        toast.error('PNG 匯出失敗：網路問題，請檢查連線並重試');
      } else if (errorMessage.includes('SecurityError')) {
        toast.error('PNG 匯出失敗：安全限制，請嘗試重新上傳圖片');
      } else {
        toast.error(`PNG 匯出失敗：${errorMessage.substring(0, 100)}...`);
      }
      
      restoreAfterExport(document.getElementById('bondA4'));
    } finally {
      setIsExporting(false);
    }
  };
  const downloadPDF = async () => {
    console.log('Export: Starting PDF export with proper centering');
    setIsExporting(true);
    
    try {
      const card = await prepareForExport();
      if (!card) {
        console.error('Export: Failed to prepare card for export');
        return;
      }
      
      console.log('Export: Waiting for DOM update and font loading');
      await new Promise(r => setTimeout(r, 1000));
      fitToA4(card);
      
      console.log('Export: Generating PDF image');
      
      const canvas = await html2canvas(card, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        width: card.offsetWidth,
        height: card.offsetHeight,
        backgroundColor: '#ffffff',
        logging: false,
        ignoreElements: (element) => {
          return element.tagName === 'SCRIPT' || 
                 (element.tagName === 'STYLE' && element.textContent?.includes('@import'));
        }
      });
      
      console.log('Export: Canvas generated, size:', canvas.width, 'x', canvas.height);
      
      restoreAfterExport(card);
      
      // Create PDF with A4 dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate proper centering in PDF
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = 297; // A4 height in mm
      const margin = 10; // 10mm margin
      
      const maxWidth = pdfWidth - (margin * 2);
      const maxHeight = pdfHeight - (margin * 2);
      
      // Calculate image dimensions maintaining aspect ratio
      const imgAspectRatio = canvas.width / canvas.height;
      let imgWidth = maxWidth;
      let imgHeight = imgWidth / imgAspectRatio;
      
      if (imgHeight > maxHeight) {
        imgHeight = maxHeight;
        imgWidth = imgHeight * imgAspectRatio;
      }
      
      // Center the image
      const x = (pdfWidth - imgWidth) / 2;
      const y = (pdfHeight - imgHeight) / 2;
      
      console.log('Export: Adding image to PDF with centering - position:', x, y, 'size:', imgWidth, imgHeight);
      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      
      // Download
      pdf.save('euf-bond-card.pdf');
      console.log('Export: PDF download triggered');
      toast.success('PDF 下載完成');
      
    } catch (error) {
      console.error('Export: PDF export failed:', error);
      toast.error('PDF 匯出失敗：' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsExporting(false);
    }
  };

  // Fallback PDF export using html2canvas
  const downloadPDFWithFallback = async () => {
    console.log('Export: Starting fallback PDF export with html2canvas');
    const card = await prepareForExport();
    if (!card) return;
    
    try {
      const canvas = await html2canvas(card, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scale: 2,
        width: card.offsetWidth,
        height: card.offsetHeight,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ 
        orientation, 
        unit: 'mm', 
        format: 'a4',
        compress: true
      });
      
      // 簡化的備用方案：直接滿版
      const pdfWidth = orientation === 'portrait' ? 210 : 297;
      const pdfHeight = orientation === 'portrait' ? 297 : 210;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, '', 'FAST');
      
      pdf.save('euf-bond-a4-fallback.pdf');
      toast.success('PDF 匯出完成 (備用方法)');
      
    } finally {
      restoreAfterExport(card);
    }
  };

  // ==== 修復的預覽功能 ====
  const PreviewContent = useCallback(() => {
    if (!showPreview) return null;
    
    console.log('Preview: Rendering preview content');
    
    // 創建與匯出完全相同的卡片數據，確保類型正確
    const previewCardData = {
      logoText: cardData.logoText,
      mainTitle: cardData.mainTitle,
      subtitle: cardData.subtitle,
      productName: cardData.productName,
      isin: cardData.isin,
      currency: cardData.currency,
      issuer: cardData.issuer,
      industry: cardData.industry,
      country: cardData.country,
      issueDate: cardData.issueDate,
      maturityDate: cardData.maturityDate,
      couponRate: cardData.couponRate, // Keep as string
      couponType: cardData.couponType,
      ytm: cardData.ytm, // Keep as string  
      tradingPrice: cardData.tradingPrice, // Keep as string
      remainingYears: cardData.remainingYears, // Keep as string
      spRating: cardData.spRating,
      moodyRating: cardData.moodyRating,
      fitchRating: cardData.fitchRating,
      bidPrice: cardData.bidPrice, // Keep as string
      askPrice: cardData.askPrice, // Keep as string
      minAmount: cardData.minAmount, // Keep as string
      accruedInterest: cardData.accruedInterest, // Keep as string
      lastCouponDate: cardData.lastCouponDate,
      nextCouponDate: cardData.nextCouponDate,
      nextCallDate: cardData.nextCallDate || undefined,
      parentCode: cardData.parentCode,
      paymentFrequency: cardData.paymentFrequency,
      issuerDescription: cardData.issuerDescription,
      investorType: cardData.investorType,
      logoImage: logoImage,
      transactionAmount: cardData.transactionAmount, // Keep as string
      totalSettlement: cardData.totalSettlement, // Keep as string
      seniorityRank: cardData.seniorityRank,
      maturityType: cardData.maturityType,
      quantity: cardData.quantity, // Keep as string
      outstandingAmount: cardData.outstandingAmount,
      defaultProbability: cardData.defaultProbability,
      issuerControl: cardData.issuerControl,
      riskNotes: cardData.riskNotes,
      tlacMrel: cardData.tlacMrel
    };

    return (
      <div className="w-full h-full flex items-start justify-center p-4 overflow-auto">
        <div 
          className="border border-border rounded-lg shadow-lg bg-white"
          style={{
            width: '595px',
            minHeight: '842px',
            transform: 'scale(0.6)',
            transformOrigin: 'top center'
          }}
        >
          <ProfessionalBondCard
            data={previewCardData}
            format="A4"
            isExporting={false}
          />
        </div>
      </div>
    );
  }, [cardData, logoImage, showPreview]);

  const toggleAccordion = (id: string) =>
    setOpenAccordions(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));

  const presetColors = [
    { name: '品牌藍', color: '#1E40AF' },
    { name: '穩重灰', color: '#374151' },
    { name: '金融紅', color: '#DC2626' },
  ];


return (

  <div className="min-h-screen bg-background">
    {/* ===== 頂部工具列 ===== */}
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link to={`/bond/${isin}`} className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回設定
        </Link>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)} className="flex items-center space-x-2">
            <Eye className="w-4 h-4" />
            <span>預覽</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                disabled={isExporting}
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? '匯出中...' : '匯出'}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem 
                onClick={() => downloadPNG(300)}
                disabled={isExporting}
              >
                <FileImage className="w-4 h-4 mr-2" />
                PNG 300DPI (A4)
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => downloadPNG(150)}
                disabled={isExporting}
              >
                <FileImage className="w-4 h-4 mr-2" />
                PNG 150DPI (A4)
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={downloadPDF}
                disabled={isExporting}
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF A4
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>

    {/* ===== 編輯畫面 ===== */}
    <main className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">圖卡編輯器</h1>
        <p className="text-muted-foreground">編輯債券資訊並生成專業圖卡</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="space-y-4">
          {/* 報告標題 / 品牌樣式 */}
          <Card className="shadow-card">
            <div className={`p-1 rounded-t-lg transition-colors ${openAccordions.includes('header') ? 'bg-brand-600' : ''}`}>
              <div className="flex items-center p-3">
                <div className="flex items-center flex-1 cursor-pointer" onClick={() => toggleAccordion('header')}>
                  <GripVertical className="w-4 h-4 mr-2 text-muted-foreground" />
                  <div className="flex items-center space-x-2">
                    <Palette className="w-4 h-4" />
                    <span className={`font-medium ${openAccordions.includes('header') ? 'text-white' : 'text-foreground'}`}>
                      報告標題 / 品牌樣式
                    </span>
                  </div>
                  <div className="ml-auto flex items-center space-x-2">
                    {!openAccordions.includes('header') && (
                      <div className="flex space-x-1">
                        <Badge variant="secondary" className="text-xs">
                          {themeConfig.colorSource === 'logo' ? 'Logo配色' : themeConfig.colorSource === 'manual' ? '手動配色' : '預設配色'}
                        </Badge>
                        <div className="w-4 h-4 rounded border" style={{ backgroundColor: `hsl(${themeConfig.brandColors[600]})` }} />
                      </div>
                    )}
                    {openAccordions.includes('header') ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>
            </div>

            {openAccordions.includes('header') && (
              <CardContent className="space-y-4 pt-4">
                {/* Logo 上傳 */}
                <div>
                  <Label>Logo 圖片</Label>
                  <div className="mt-2">
                    {logoImage ? (
                      <div className="flex items-center gap-4">
                        <img src={logoImage} alt="Logo Preview" className="w-16 h-16 object-contain border rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleRemoveLogo}>移除</Button>
                            <Input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logoReplace" />
                            <Button variant="outline" size="sm" onClick={() => document.getElementById('logoReplace')?.click()} disabled={isExtractingColors}>
                              {isExtractingColors ? '分析中...' : '更換'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logoUpload" />
                        <Button variant="outline" onClick={() => document.getElementById('logoUpload')?.click()} disabled={isExtractingColors} className="w-full">
                          <Upload className="w-4 h-4 mr-2" />
                          {isExtractingColors ? '分析中...' : '上傳 Logo 圖片'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 自動配色與鎖色 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>啟用 Logo 自動配色</Label>
                    <Switch checked={themeConfig.autoColorFromLogo} onCheckedChange={(checked) => setThemeConfig((p) => ({ ...p, autoColorFromLogo: checked }))} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>鎖定主題色</Label>
                    <Switch checked={themeConfig.lockThemeColor} onCheckedChange={(checked) => setThemeConfig((p) => ({ ...p, lockThemeColor: checked }))} />
                  </div>
                </div>

                {/* 主色調 */}
                <div className="space-y-3">
                  <Label>主色調（手動）</Label>
                  <div className="flex gap-2">
                    <Input type="color" onChange={(e) => handleColorChange(e.target.value)} disabled={themeConfig.lockThemeColor} className="w-16 p-1 h-10" />
                    <Input onChange={(e) => handleColorChange(e.target.value)} disabled={themeConfig.lockThemeColor} className="flex-1" placeholder="#DC2626" />
                  </div>
                  <div className="flex gap-2">
                    {[
                      { name: '品牌藍', color: '#1E40AF' },
                      { name: '穩重灰', color: '#374151' },
                      { name: '金融紅', color: '#DC2626' },
                    ].map((p) => (
                      <Button key={p.name} variant="outline" size="sm" onClick={() => handleColorChange(p.color)} disabled={themeConfig.lockThemeColor}>
                        <div className="w-3 h-3 rounded mr-2" style={{ backgroundColor: p.color }} />
                        {p.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 標題 */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="mainTitle">圖卡主標題</Label>
                    <Input id="mainTitle" value={cardData.mainTitle} onChange={(e) => handleInputChange('mainTitle', e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="subtitle">子標題（可空）</Label>
                    <Input id="subtitle" value={cardData.subtitle} onChange={(e) => handleInputChange('subtitle', e.target.value)} />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* 債券基本資訊 */}
          <Card className="shadow-card">
            <div className={`p-1 rounded-t-lg transition-colors ${openAccordions.includes('basic-info') ? 'bg-brand-600' : ''}`}>
              <div className="flex items-center p-3">
                <div className="flex items-center flex-1 cursor-pointer" onClick={() => toggleAccordion('basic-info')}>
                  <GripVertical className="w-4 h-4 mr-2 text-muted-foreground" />
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span className={`font-medium ${openAccordions.includes('basic-info') ? 'text-white' : 'text-foreground'}`}>債券基本資訊</span>
                  </div>
                  <div className="ml-auto flex items-center space-x-2">
                    {!openAccordions.includes('basic-info') && (
                      <div className="flex space-x-1">
                        <Badge variant="secondary" className="text-xs">{cardData.isin}</Badge>
                        <Badge variant="secondary" className="text-xs">{cardData.currency}</Badge>
                        <Badge variant="secondary" className="text-xs">{cardData.couponRate}%</Badge>
                      </div>
                    )}
                    {openAccordions.includes('basic-info') ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>
            </div>

            {openAccordions.includes('basic-info') && (
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="productName">商品名稱 Name of Product</Label>
                    <Input id="productName" value={cardData.productName} onChange={(e) => handleInputChange('productName', e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="isin">債券代碼 ISIN Code {!cardData.isin && <AlertCircle className="inline w-4 h-4 ml-1 text-destructive" />}</Label>
                    <Input id="isin" value={cardData.isin} onChange={(e) => handleInputChange('isin', e.target.value)} className={!cardData.isin ? 'border-destructive' : ''} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="currency">幣別 Currency</Label>
                    <Select value={cardData.currency} onValueChange={(v) => handleInputChange('currency', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="JPY">JPY</SelectItem>
                        <SelectItem value="TWD">TWD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="couponRate">票面利息 (%)</Label>
                    <Input id="couponRate" type="number" step="0.01" value={cardData.couponRate} onChange={(e) => handleInputChange('couponRate', e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="couponType">票息類型</Label>
                    <Select value={cardData.couponType} onValueChange={(v) => handleInputChange('couponType', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="固定">固定</SelectItem>
                        <SelectItem value="浮動">浮動</SelectItem>
                        <SelectItem value="零息">零息</SelectItem>
                        <SelectItem value="階梯">階梯</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="issuer">債券發行人</Label>
                    <Input id="issuer" value={cardData.issuer} onChange={(e) => handleInputChange('issuer', e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="industry">產業別</Label>
                    <Input id="industry" value={cardData.industry} onChange={(e) => handleInputChange('industry', e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="minAmount">最小承作金額(原幣)</Label>
                    <Input id="minAmount" type="number" value={cardData.minAmount} onChange={(e) => handleInputChange('minAmount', e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="minIncrement">最小累加金額(原幣)</Label>
                    <Input id="minIncrement" type="number" value={cardData.minIncrement} onChange={(e) => handleInputChange('minIncrement', e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="remainingYears">剩餘年期</Label>
                    <Input id="remainingYears" type="number" step="0.01" value={cardData.remainingYears} onChange={(e) => handleInputChange('remainingYears', e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="investorType">投資人身分別</Label>
                    <Select value={cardData.investorType[0]} onValueChange={(v) => handleInputChange('investorType', [v])}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="一般">一般</SelectItem>
                        <SelectItem value="專業">專業</SelectItem>
                        <SelectItem value="機構">機構</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="accruedInterest">前手息（每一萬面額）</Label>
                    <Input id="accruedInterest" type="number" step="0.01" value={cardData.accruedInterest} onChange={(e) => handleInputChange('accruedInterest', e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="issueDate">發行日</Label>
                    <Input id="issueDate" type="date" value={cardData.issueDate.split('/').reverse().join('-')} onChange={(e) => handleInputChange('issueDate', e.target.value.split('-').reverse().join('/'))} />
                  </div>
                  <div>
                    <Label htmlFor="maturityDate">到期日</Label>
                    <Input id="maturityDate" type="date" value={cardData.maturityDate.split('/').reverse().join('-')} onChange={(e) => handleInputChange('maturityDate', e.target.value.split('-').reverse().join('/'))} />
                  </div>
                  <div>
                    <Label htmlFor="nextCouponDate">下一配息日</Label>
                    <Input id="nextCouponDate" type="date" value={cardData.nextCouponDate.split('/').reverse().join('-')} onChange={(e) => handleInputChange('nextCouponDate', e.target.value.split('-').reverse().join('/'))} />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* 價格與殖利率 */}
          <Card className="shadow-card">
            <div className={`p-1 rounded-t-lg transition-colors ${openAccordions.includes('pricing') ? 'bg-brand-600' : ''}`}>
              <div className="flex items-center p-3">
                <div className="flex items-center flex-1 cursor-pointer" onClick={() => toggleAccordion('pricing')}>
                  <GripVertical className="w-4 h-4 mr-2 text-muted-foreground" />
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span className={`font-medium ${openAccordions.includes('pricing') ? 'text-white' : 'text-foreground'}`}>價格與殖利率</span>
                  </div>
                  <div className="ml-auto flex items-center space-x-2">
                    {!openAccordions.includes('pricing') && (
                      <div className="flex space-x-1">
                        <Badge variant="secondary" className="text-xs">YTM {cardData.ytm}%</Badge>
                        <Badge variant="secondary" className="text-xs">${cardData.tradingPrice}</Badge>
                      </div>
                    )}
                    {openAccordions.includes('pricing') ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>
            </div>

            {openAccordions.includes('pricing') && (
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="bidPrice">參考客戶賣價 (Bid)</Label>
                    <Input id="bidPrice" type="number" step="0.01" value={cardData.bidPrice} onChange={(e) => handleInputChange('bidPrice', e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="askPrice">參考客戶買價 (Ask)</Label>
                    <Input id="askPrice" type="number" step="0.01" value={cardData.askPrice} onChange={(e) => handleInputChange('askPrice', e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="ytm">到期殖利率 (%)</Label>
                    <Input id="ytm" type="number" step="0.01" value={cardData.ytm} onChange={(e) => handleInputChange('ytm', e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tradingPrice">參考價格</Label>
                    <Input id="tradingPrice" type="number" step="0.01" value={cardData.tradingPrice} onChange={(e) => handleInputChange('tradingPrice', e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="quantity">數量 (Quantity)</Label>
                    <Input id="quantity" type="number" step="0.01" value={cardData.quantity} onChange={(e) => handleInputChange('quantity', e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="transactionAmount">交易金額</Label>
                    <Input id="transactionAmount" type="number" step="0.01" value={cardData.transactionAmount} onChange={(e) => handleInputChange('transactionAmount', e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="totalSettlement">總交割金額</Label>
                    <Input id="totalSettlement" type="number" step="0.01" value={cardData.totalSettlement} onChange={(e) => handleInputChange('totalSettlement', e.target.value)} />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* 三大信評 */}
          <Card className="shadow-card">
            <div className={`p-1 rounded-t-lg transition-colors ${openAccordions.includes('ratings') ? 'bg-brand-600' : ''}`}>
              <div className="flex items-center p-3">
                <div className="flex items-center flex-1 cursor-pointer" onClick={() => toggleAccordion('ratings')}>
                  <GripVertical className="w-4 h-4 mr-2 text-muted-foreground" />
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span className={`font-medium ${openAccordions.includes('ratings') ? 'text-white' : 'text-foreground'}`}>三大信評</span>
                  </div>
                  <div className="ml-auto flex items-center space-x-2">
                    {!openAccordions.includes('ratings') && (
                      <div className="flex space-x-1">
                        <Badge variant="secondary" className="text-xs">S&P {cardData.spRating}</Badge>
                        <Badge variant="secondary" className="text-xs">Moody's {cardData.moodyRating}</Badge>
                        <Badge variant="secondary" className="text-xs">Fitch {cardData.fitchRating}</Badge>
                      </div>
                    )}
                    {openAccordions.includes('ratings') ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>
            </div>

            {openAccordions.includes('ratings') && (
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="spRating">標準普爾 (S&P)</Label>
                    <Input id="spRating" value={cardData.spRating} onChange={(e) => handleInputChange('spRating', e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="moodyRating">穆迪 (Moody's)</Label>
                    <Input id="moodyRating" value={cardData.moodyRating} onChange={(e) => handleInputChange('moodyRating', e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="fitchRating">惠譽 (Fitch)</Label>
                    <Input id="fitchRating" value={cardData.fitchRating} onChange={(e) => handleInputChange('fitchRating', e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="seniority">償還順位</Label>
                    <Select value={cardData.seniorityRank} onValueChange={(v) => handleInputChange('seniorityRank', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="優先無擔保">優先無擔保</SelectItem>
                        <SelectItem value="優先有擔保">優先有擔保</SelectItem>
                        <SelectItem value="次順位">次順位</SelectItem>
                        <SelectItem value="永續">永續</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="paymentFrequency">配息頻率</Label>
                    <Select value={cardData.paymentFrequency} onValueChange={(v) => handleInputChange('paymentFrequency', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="每月">每月</SelectItem>
                        <SelectItem value="每季">每季</SelectItem>
                        <SelectItem value="每半年">每半年</SelectItem>
                        <SelectItem value="每年">每年</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="maturityType">到期類型</Label>
                  <Select value={cardData.maturityType} onValueChange={(v) => handleInputChange('maturityType', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="到期償還">到期償還</SelectItem>
                      <SelectItem value="可贖回">可贖回</SelectItem>
                      <SelectItem value="可賣回">可賣回</SelectItem>
                      <SelectItem value="永續">永續</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </main>

    {/* ===== 隱藏的匯出容器（始終可用） ===== */}
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ 
      position: 'absolute',
      clip: 'rect(0, 0, 0, 0)',
      clipPath: 'inset(50%)',
      height: '1px',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      width: '1px',
      top: '0',
      left: '0'
    }}>
      <div
        id="bondA4"
        className="w-[210mm] h-[297mm] p-[12mm] bg-white overflow-hidden"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: 'translateZ(0)',
          WebkitFontSmoothing: 'antialiased',
          fontSmooth: 'always',
          textRendering: 'optimizeLegibility'
        }}
      >
        <ProfessionalBondCard data={{ ...cardData, logoImage }} isExporting={isExporting} />
      </div>
    </div>

{/* ===== 修復的預覽 Dialog ===== */}
<Dialog open={showPreview} onOpenChange={setShowPreview}>
  <DialogContent className="max-w-6xl max-h-[90vh] w-[90vw] p-2">
    <DialogHeader className="pb-2">
      <div className="flex items-center justify-between">
        <div>
          <DialogTitle>預覽圖卡</DialogTitle>
          <DialogDescription>A4 格式預覽 - 與匯出效果完全一致</DialogDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </DialogHeader>
    
    <div 
      className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden"
      style={{ minHeight: '500px', maxHeight: '70vh' }}
    >
      <PreviewContent />
    </div>
  </DialogContent>
</Dialog>

</div>
);

};

export default CardEditor;
