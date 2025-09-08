import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Download, Plus, ChevronDown, ChevronUp, MoreHorizontal,
  GripVertical, Eye, FileText, FileImage, Upload, Palette, AlertCircle, X, Edit3, Check, X as XIcon
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
import { sampleBond, type Bond, type ExtendedBond } from '@/types/bond';
import { ProfessionalBondCard } from '@/components/ProfessionalBondCard';
import { useBondSearch } from '@/contexts/BondSearchContext';
import { useAuth } from '@/contexts/AuthContext';
import { BondDMModal } from '@/components/bond-dm/BondDMModal';

// 格式化數字：添加千分位，當小數點後無數字時不顯示兩位數
const formatNumber = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';
  
  // 如果是整數，不顯示小數點
  if (num % 1 === 0) {
    return num.toLocaleString();
  }
  
  // 有小數點時，保留兩位小數並添加千分位
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
};

// === A4 常數（輸出像素） ===
export const PX_A4_300 = { w: 2480, h: 3508 }; // 210/25.4*300, 297/25.4*300
export const PX_A4_150 = { w: 1240, h: 1754 }; // 210/25.4*150, 297/25.4*150

// === 債券資料查詢（只使用 API 結果，不使用樣本資料） ===
const getBondByIsin = (isin: string, searchedBond: Bond | ExtendedBond | null): Bond | ExtendedBond | null => {
  // 只返回 API 搜尋結果，不使用樣本資料
  if (searchedBond && searchedBond.isin === isin) {
    return searchedBond;
  }
  // 沒有 API 資料時返回 null
  return null;
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
  tradeDirection: string; // 客戶需求

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
  const { bond: searchedBond, extendedBond, searchByISIN } = useBondSearch();
  const { accountType } = useAuth();
  
  // 根據 accountType 獲取標題背景色
  const getHeaderBackgroundColor = () => {
    if (!accountType) {
      return '#54b5e9'; // 預設 EUF 顏色
    }
    
    switch (accountType.type) {
      case 'entrust':
        return '#E60012'; // 使用現有的品牌色 (對應 var(--brand-600))
      case 'ubot':
        return '#16899d'; // Ubot 專用色
      default:
        return '#54b5e9'; // EUF 顏色
    }
  };
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [isExtractingColors, setIsExtractingColors] = useState(false);
  const [openAccordions, setOpenAccordions] = useState<string[]>(['header', 'basic-info', 'pricing', 'ratings']);
  
  // 編輯狀態管理
  const [editingFields, setEditingFields] = useState<Set<string>>(new Set());
  const [tempValues, setTempValues] = useState<Record<string, string>>({});

  // 預覽狀態與參考
  const [showPreview, setShowPreview] = useState(false);
  const [showDM, setShowDM] = useState(false);
  const previewViewportRef = useRef<HTMLDivElement>(null);
  const previewA4Ref = useRef<HTMLDivElement>(null);

  // 匯出方向 / 單頁設定（沿用你原本）
  const [orientation] = useState<'portrait' | 'landscape'>('portrait');
  const [strictSinglePage] = useState(true);
  
  // 追蹤是否已經初始化過
  const [isInitialized, setIsInitialized] = useState(false);

  if (!isin) return <Navigate to="/search" replace />;
  
  // 嘗試取得債券資料，優先使用 extendedBond（包含價格數據）
  const bond = getBondByIsin(isin, extendedBond || searchedBond);
  
  // 調試信息
  console.log('CardEditor - extendedBond:', extendedBond);
  console.log('CardEditor - searchedBond:', searchedBond);
  console.log('CardEditor - final bond:', bond);
  
  // 如果沒有債券資料，直接跳轉到查詢頁面
  if (!bond || !bond.isin || bond.isin !== isin) {
    return <Navigate to="/search" replace />;
  }

  // 編輯資料（根據債券資料初始化）
  const [cardData, setCardData] = useState<EditableCardData>(() => ({
        logoText: 'EUF BondDesk Pro',
        mainTitle: bond.name || '債券投資機會',
        subtitle: '專業債券投資服務',
        productName: bond.name || '',
        isin: bond.isin || '',
        currency: bond.currency || '',
        investorType: ['一般'],
        couponRate: bond.couponRate?.toString() || '',
    couponType: bond?.couponType || '固定',
        minAmount: bond.minDenomination?.toString() || '',
    minIncrement: bond.minIncrement?.toString() || '10000',
    accruedInterest: bond.accruedInterest?.toString() || '0.00',
        issueDate: bond.issueDate || '',
        maturityDate: bond.maturityDate || '',
        lastCouponDate: bond.previousCouponDate || '',
        nextCouponDate: bond.nextCouponDate || '',
        nextCallDate: '',
    bidPrice: bond.bidPrice && bond.bidPrice > 0 ? bond.bidPrice.toString() : '',
    ytm: '',
    askPrice: bond.askPrice && bond.askPrice > 0 ? bond.askPrice.toString() : '',
    tradingPrice: bond.askPrice && bond.askPrice > 0 ? bond.askPrice.toString() : '', // 預設使用買價
        quantity: '30000.00',
    transactionAmount: (() => {
      const quantity = 30000;
      const price = bond.askPrice && bond.askPrice > 0 ? bond.askPrice : 100; // 使用買價或預設100
      return ((price / 100) * quantity).toFixed(2);
    })(),
    totalSettlement: (() => {
      const quantity = 30000;
      const price = bond.askPrice && bond.askPrice > 0 ? bond.askPrice : 100;
      const transactionAmount = (price / 100) * quantity;
      const minAmount = parseFloat(bond.minDenomination?.toString() || '10000');
      const accruedInterestPerMinAmount = parseFloat(bond.accruedInterest?.toString() || '0');
      const accruedInterest = ((accruedInterestPerMinAmount / minAmount) * quantity);
      return (transactionAmount + accruedInterest).toFixed(2);
    })(),
        remainingYears: bond.remainingYears?.toString() || '',
    tradeDirection: '買',
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
    defaultProbability: bond.defaultProbability1Y?.toString() || '0.0000',
        outstandingAmount: bond.outstandingAmount?.toString() || '',
    tlacMrel: bond.tlacMrel || false
  }));

  // 當 isin 改變時，重置初始化狀態
  useEffect(() => {
    setIsInitialized(false);
  }, [isin]);

  // 當債券資料加載完成後，初始化 cardData
  useEffect(() => {
    if (bond && bond.isin === isin && !cardData) {
      console.log('CardEditor - 債券資料已加載，初始化 cardData');
      setCardData({
      logoText: 'EUF BondDesk Pro',
        mainTitle: bond.name || '債券投資機會',
      subtitle: '專業債券投資服務',
        productName: bond.name || '',
        isin: bond.isin || '',
        currency: bond.currency || '',
      investorType: ['一般'],
        couponRate: bond.couponRate?.toString() || '',
        couponType: bond?.couponType || '固定',
        minAmount: bond.minDenomination?.toString() || '',
        minIncrement: bond.minIncrement?.toString() || '10000',
        accruedInterest: bond.accruedInterest?.toString() || '0.00',
        issueDate: bond.issueDate || '',
        maturityDate: bond.maturityDate || '',
        lastCouponDate: bond.previousCouponDate || '',
        nextCouponDate: bond.nextCouponDate || '',
      nextCallDate: '',
        bidPrice: bond.bidPrice && bond.bidPrice > 0 ? bond.bidPrice.toString() : '',
      ytm: '',
        askPrice: bond.askPrice && bond.askPrice > 0 ? bond.askPrice.toString() : '',
        tradingPrice: bond.askPrice && bond.askPrice > 0 ? bond.askPrice.toString() : '', // 預設使用買價
      quantity: '30000.00',
        transactionAmount: (() => {
          const quantity = 30000;
          const price = bond.askPrice && bond.askPrice > 0 ? bond.askPrice : 100; // 使用買價或預設100
          return ((price / 100) * quantity).toFixed(2);
        })(),
        totalSettlement: (() => {
          const quantity = 30000;
          const price = bond.askPrice && bond.askPrice > 0 ? bond.askPrice : 100;
          const transactionAmount = (price / 100) * quantity;
          const minAmount = parseFloat(bond.minDenomination?.toString() || '10000');
          const accruedInterestPerMinAmount = parseFloat(bond.accruedInterest?.toString() || '0');
          const accruedInterest = ((accruedInterestPerMinAmount / minAmount) * quantity);
          return (transactionAmount + accruedInterest).toFixed(2);
        })(),
        remainingYears: bond.remainingYears?.toString() || '',
        tradeDirection: '買',
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
        defaultProbability: bond.defaultProbability1Y?.toString() || '0.0000',
        outstandingAmount: bond.outstandingAmount?.toString() || '',
        tlacMrel: bond.tlacMrel || false
      });
    }
  }, [bond, isin, cardData]);

  // 當 extendedBond 數據加載完成後，重新初始化 cardData
  useEffect(() => {
    console.log('CardEditor - useEffect 觸發:', {
      hasExtendedBond: !!extendedBond,
      extendedBondIsin: extendedBond?.isin,
      currentIsin: isin,
      isInitialized: isInitialized,
      yieldToMaturity: extendedBond?.yieldToMaturity,
      hasBond: !!bond
    });
    
    // 只有在有債券資料且 extendedBond 匹配且未初始化時才更新
    if (bond && extendedBond && extendedBond.isin === isin && !isInitialized) {
      console.log('CardEditor - extendedBond 數據已加載，重新初始化 cardData');
      
      // 計算 YTM - 檢查是否需要轉換
      let ytmValue = '';
      if (extendedBond.yieldToMaturity && extendedBond.yieldToMaturity > 0) {
        let finalYtm = extendedBond.yieldToMaturity;
        
        // 如果 YTM 值小於 1，表示是小數形式，需要乘以 100 轉換為百分比
        if (finalYtm < 1) {
          finalYtm = finalYtm * 100;
        }
        
        finalYtm = Math.round(finalYtm * 100) / 100; // 四捨五入到小數點第二位
        ytmValue = finalYtm.toString();
        console.log('CardEditor - YTM 計算:', {
          original: extendedBond.yieldToMaturity,
          isLessThanOne: extendedBond.yieldToMaturity < 1,
          final: finalYtm,
          ytmValue: ytmValue
        });
      } else {
        console.log('CardEditor - YTM 條件不滿足:', {
          yieldToMaturity: extendedBond.yieldToMaturity,
          isPositive: extendedBond.yieldToMaturity > 0
        });
      }
      
      // 計算票息類型
      const couponType = extendedBond.couponType || '固定';
      
      console.log('CardEditor - 準備更新 cardData:', {
        ytm: ytmValue,
        couponType: couponType,
        bidPrice: extendedBond.bidPrice,
        askPrice: extendedBond.askPrice
      });
      
      setCardData(prev => {
        const newData = {
          ...prev,
          ytm: ytmValue,
          couponType: couponType,
          bidPrice: extendedBond.bidPrice && extendedBond.bidPrice > 0 ? extendedBond.bidPrice.toString() : prev.bidPrice,
          askPrice: extendedBond.askPrice && extendedBond.askPrice > 0 ? extendedBond.askPrice.toString() : prev.askPrice,
          tradingPrice: extendedBond.bidPrice && extendedBond.bidPrice > 0 ? extendedBond.bidPrice.toString() : prev.tradingPrice,
        };
        
        console.log('CardEditor - 更新後的 cardData:', newData);
        return newData;
      });
      
      setIsInitialized(true);
    }
  }, [extendedBond, isin]);

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
        // ytm 由專門的 useEffect 處理，這裡不設置
        askPrice: bond.askPrice?.toString() || prev.askPrice,
        tradingPrice: bond.askPrice?.toString() || prev.tradingPrice, // 預設使用買價
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

  // 監控 cardData 的變化
  useEffect(() => {
    console.log('CardEditor - cardData 已更新:', {
      ytm: cardData.ytm,
      couponType: cardData.couponType,
      bidPrice: cardData.bidPrice,
      askPrice: cardData.askPrice
    });
  }, [cardData.ytm, cardData.couponType, cardData.bidPrice, cardData.askPrice]);

  // 驗證數量（面額）
  const validateQuantity = useCallback((quantity: number, minAmount: number, minIncrement: number) => {
    const errors: string[] = [];
    
    // 檢查是否小於最小承作面額
    if (quantity < minAmount) {
      errors.push(`數量 ${quantity.toLocaleString()} 小於最小承作面額 ${minAmount.toLocaleString()}`);
    }
    
    // 檢查是否無法被最小疊加面額整除
    if (quantity % minIncrement !== 0) {
      errors.push(`最小疊加面額為 ${minIncrement.toLocaleString()}，請輸入 ${minIncrement.toLocaleString()} 的倍數`);
    }
    
    return errors;
  }, []);

  // 重新計算前手息（基於最小承作面額）
  const recalculateAccruedInterest = useCallback((minAmount: number, couponRate: number, frequency: number, lastCouponDate?: string) => {
    if (couponRate === 0 || minAmount === 0) return 0;
    
    // 如果有上次付息日，使用30/360 US規則計算
    if (lastCouponDate) {
      const today = new Date();
      const prevCoupon = new Date(lastCouponDate);
      
      // 30/360 US rule day count
      let d1 = prevCoupon.getDate();
      let d2 = today.getDate();
      let m1 = prevCoupon.getMonth() + 1;
      let m2 = today.getMonth() + 1;
      let y1 = prevCoupon.getFullYear();
      let y2 = today.getFullYear();
      
      if (d1 === 31) d1 = 30;
      if (d2 === 31 && d1 === 30) d2 = 30;
      if (d2 === 31 && d1 < 30) d2 = 30;
      if (d2 === 31 && d1 === 30) d2 = 30;
      
      // 計算天數時 +1，因為要包含當日利息
      const days360 = 360 * (y2 - y1) + 30 * (m2 - m1) + (d2 - d1) + 1;
      const periodsPerYear = frequency;
      const daysInPeriod = 360 / periodsPerYear;
      
      const periodicCouponAmount = (minAmount * couponRate / 100) / periodsPerYear;
      const accruedInterest = (days360 / daysInPeriod) * periodicCouponAmount;
      
      return Math.round(accruedInterest * 100) / 100;
    }
    
    // 如果沒有上次付息日，使用簡化計算
    const periodsPerYear = frequency;
    const accruedInterest = (minAmount * couponRate / 100) / periodsPerYear;
    
    return Math.round(accruedInterest * 100) / 100;
  }, []);

  const handleInputChange = useCallback((field: keyof EditableCardData, value: string | string[] | boolean) => {
    setCardData(prev => {
      const newData = { ...prev, [field]: value as any };
      
      // 當買價或賣價改變時，如果當前選擇的方向對應，也要更新參考價格和交易金額
      if (field === 'bidPrice' && prev.tradeDirection === '賣') {
        newData.tradingPrice = value as string;
        // 重新計算交易金額
        const price = parseFloat(value as string);
        const quantity = parseFloat(prev.quantity);
        if (!isNaN(price) && !isNaN(quantity) && price > 0 && quantity > 0) {
          newData.transactionAmount = ((price / 100) * quantity).toFixed(2);
          // 重新計算總交割金額
          const accruedInterest = parseFloat(prev.accruedInterest) || 0;
          newData.totalSettlement = (parseFloat(newData.transactionAmount) + accruedInterest).toFixed(2);
        }
      } else if (field === 'askPrice' && prev.tradeDirection === '買') {
        newData.tradingPrice = value as string;
        // 重新計算交易金額
        const price = parseFloat(value as string);
        const quantity = parseFloat(prev.quantity);
        if (!isNaN(price) && !isNaN(quantity) && price > 0 && quantity > 0) {
          newData.transactionAmount = ((price / 100) * quantity).toFixed(2);
          // 重新計算總交割金額
          const accruedInterest = parseFloat(prev.accruedInterest) || 0;
          newData.totalSettlement = (parseFloat(newData.transactionAmount) + accruedInterest).toFixed(2);
        }
      }
      
      // 當參考價格或數量改變時，自動計算交易金額
      if (field === 'tradingPrice' || field === 'quantity') {
        const price = parseFloat(field === 'tradingPrice' ? value as string : prev.tradingPrice);
        const qty = parseFloat(field === 'quantity' ? value as string : prev.quantity);
        
        if (!isNaN(price) && !isNaN(qty) && price > 0 && qty > 0) {
          const transactionAmount = ((price / 100) * qty).toFixed(2);
          newData.transactionAmount = transactionAmount;
          
          // 計算前手息：基於數量計算
          const quantity = parseFloat(prev.quantity) || 0;
          const minAmount = parseFloat(prev.minAmount) || 10000;
          const accruedInterestPerMinAmount = parseFloat(prev.accruedInterest) || 0;
          const accruedInterest = ((accruedInterestPerMinAmount / minAmount) * quantity).toFixed(2);
          newData.totalSettlement = (parseFloat(transactionAmount) + parseFloat(accruedInterest)).toFixed(2);
          
          // 如果是數量改變，驗證數量是否符合最小承作和最小疊加要求
          if (field === 'quantity') {
            const minAmount = parseFloat(prev.minAmount) || 0;
            const minIncrement = parseFloat(prev.minIncrement) || 1;
            
            if (qty > 0 && minAmount > 0 && minIncrement > 0) {
              const errors = validateQuantity(qty, minAmount, minIncrement);
              if (errors.length > 0) {
                errors.forEach(error => toast.warning(error));
              }
            }
          }
        }
      }
      
      // 當交易金額改變時，反向計算數量
      if (field === 'transactionAmount') {
        const price = parseFloat(prev.tradingPrice);
        const transactionAmount = parseFloat(value as string);
        
        if (!isNaN(price) && !isNaN(transactionAmount) && price > 0 && transactionAmount > 0) {
          const calculatedQuantity = (transactionAmount / (price / 100)).toFixed(2);
          newData.quantity = calculatedQuantity;
          
          // 計算前手息：基於數量計算
          const quantity = parseFloat(prev.quantity) || 0;
          const minAmount = parseFloat(prev.minAmount) || 10000;
          const accruedInterestPerMinAmount = parseFloat(prev.accruedInterest) || 0;
          const accruedInterest = ((accruedInterestPerMinAmount / minAmount) * quantity).toFixed(2);
          newData.totalSettlement = (transactionAmount + parseFloat(accruedInterest)).toFixed(2);
          
          // 交易金額不再進行最小承作和最小疊加驗證
        }
      }
      
      // 當最小承作面額改變時，重新計算前手息
      if (field === 'minAmount') {
        const minAmount = parseFloat(value as string) || 0;
        const couponRate = parseFloat(prev.couponRate) || 0;
        const frequency = prev.paymentFrequency === '每年' ? 1 : 
                         prev.paymentFrequency === '每半年' ? 2 :
                         prev.paymentFrequency === '每季' ? 4 :
                         prev.paymentFrequency === '每月' ? 12 : 2;
        
        if (minAmount > 0 && couponRate > 0) {
          const newAccruedInterest = recalculateAccruedInterest(minAmount, couponRate, frequency, prev.lastCouponDate);
          newData.accruedInterest = newAccruedInterest.toFixed(2);
          
          // 重新計算總交割金額
          const transactionAmount = parseFloat(prev.transactionAmount) || 0;
          const quantity = parseFloat(prev.quantity) || 0;
          if (transactionAmount > 0 && quantity > 0) {
            const accruedInterest = ((newAccruedInterest / minAmount) * quantity).toFixed(2);
            newData.totalSettlement = (transactionAmount + parseFloat(accruedInterest)).toFixed(2);
          }
        }
      }
      
      // 當票面利率或付息頻率改變時，重新計算前手息
      if (field === 'couponRate' || field === 'paymentFrequency') {
        const minAmount = parseFloat(prev.minAmount) || 0;
        const couponRate = field === 'couponRate' ? parseFloat(value as string) : parseFloat(prev.couponRate) || 0;
        const frequency = field === 'paymentFrequency' ? 
          (value === '每年' ? 1 : 
           value === '每半年' ? 2 :
           value === '每季' ? 4 :
           value === '每月' ? 12 : 2) :
          (prev.paymentFrequency === '每年' ? 1 : 
           prev.paymentFrequency === '每半年' ? 2 :
           prev.paymentFrequency === '每季' ? 4 :
           prev.paymentFrequency === '每月' ? 12 : 2);
        
        if (minAmount > 0 && couponRate > 0) {
          const newAccruedInterest = recalculateAccruedInterest(minAmount, couponRate, frequency, prev.lastCouponDate);
          newData.accruedInterest = newAccruedInterest.toFixed(2);
          
          // 重新計算總交割金額
          const transactionAmount = parseFloat(prev.transactionAmount) || 0;
          const quantity = parseFloat(prev.quantity) || 0;
          if (transactionAmount > 0 && quantity > 0) {
            const accruedInterest = ((newAccruedInterest / minAmount) * quantity).toFixed(2);
            newData.totalSettlement = (transactionAmount + parseFloat(accruedInterest)).toFixed(2);
          }
        }
      }
      
      // 當前手息（每一最小承作面額）改變時，重新計算總交割金額
      if (field === 'accruedInterest') {
        const transactionAmount = parseFloat(prev.transactionAmount) || 0;
        const quantity = parseFloat(prev.quantity) || 0;
        const minAmount = parseFloat(prev.minAmount) || 10000;
        const accruedInterestPerMinAmount = parseFloat(value as string) || 0;
        
        if (transactionAmount > 0 && quantity > 0) {
          const accruedInterest = ((accruedInterestPerMinAmount / minAmount) * quantity).toFixed(2);
          newData.totalSettlement = (transactionAmount + parseFloat(accruedInterest)).toFixed(2);
        }
      }
      
      return newData;
    });
  }, [validateQuantity, recalculateAccruedInterest]);

  // 專門處理 YTM 輸入，確保輸入的是百分比值
  const handleYTMChange = useCallback((value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      // 直接使用輸入值，因為我們已經在 useEffect 中處理了轉換
      const formattedValue = Math.round(numValue * 100) / 100; // 四捨五入到小數點第二位
      setCardData(prev => ({ ...prev, ytm: formattedValue.toString() }));
    } else {
      setCardData(prev => ({ ...prev, ytm: value }));
    }
  }, []);

  // 編輯相關函數
  const startEditing = useCallback((field: string) => {
    setEditingFields(prev => new Set(prev).add(field));
    setTempValues(prev => ({ ...prev, [field]: cardData[field as keyof EditableCardData] as string }));
  }, [cardData]);

  const cancelEditing = useCallback((field: string) => {
    setEditingFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(field);
      return newSet;
    });
    setTempValues(prev => {
      const newTemp = { ...prev };
      delete newTemp[field];
      return newTemp;
    });
  }, []);

  const saveEditing = useCallback((field: string) => {
    const newValue = tempValues[field];
    if (newValue !== undefined) {
      // 特殊處理 investorType，因為它是數組
      if (field === 'investorType') {
        handleInputChange(field as keyof EditableCardData, [newValue]);
      } else {
        handleInputChange(field as keyof EditableCardData, newValue);
      }
    }
    setEditingFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(field);
      return newSet;
    });
    setTempValues(prev => {
      const newTemp = { ...prev };
      delete newTemp[field];
      return newTemp;
    });
  }, [tempValues, handleInputChange]);

  const handleTempValueChange = useCallback((field: string, value: string) => {
    setTempValues(prev => ({ ...prev, [field]: value }));
  }, []);

  // 處理買賣方向變更
  const handleTradeDirectionChange = useCallback((direction: string) => {
    setCardData(prev => {
      let newTradingPrice = '';
      
      if (direction === '買') {
        // 選擇「買」時，參考價格使用「參考客戶買價」
        newTradingPrice = prev.askPrice || '';
      } else if (direction === '賣') {
        // 選擇「賣」時，參考價格使用「參考客戶賣價」
        newTradingPrice = prev.bidPrice || '';
      }
      
      // 數量固定不變，以新價格更新交易金額
      let newTransactionAmount = prev.transactionAmount;
      let newTotalSettlement = prev.totalSettlement;
      
      if (newTradingPrice && prev.quantity) {
        const price = parseFloat(newTradingPrice);
        const quantity = parseFloat(prev.quantity);
        
        if (!isNaN(price) && !isNaN(quantity) && price > 0 && quantity > 0) {
          // 重新計算交易金額：債券價格是百分比，需要除以100
          newTransactionAmount = ((price / 100) * quantity).toFixed(2);
          
          // 重新計算總交割金額
          const accruedInterest = parseFloat(prev.accruedInterest) || 0;
          newTotalSettlement = (parseFloat(newTransactionAmount) + accruedInterest).toFixed(2);
        }
      }
      
      return {
        ...prev,
        tradeDirection: direction,
        tradingPrice: newTradingPrice,
        transactionAmount: newTransactionAmount,
        totalSettlement: newTotalSettlement
      };
    });
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
          {false && (
          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)} className="flex items-center space-x-2">
            <Eye className="w-4 h-4" />
            <span>預覽</span>
          </Button>
          )}

          <Button variant="outline" size="sm" onClick={() => setShowDM(true)} className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>查看DM</span>
          </Button>

          {false && (
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
          )}
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
          {/* 報告標題 / 品牌樣式 - 已隱藏 */}
          {false && <Card className="shadow-card">
            <div 
              className="p-1 rounded-t-lg transition-colors" 
              style={{ backgroundColor: openAccordions.includes('header') ? getHeaderBackgroundColor() : '' }}
            >
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
          </Card>}

          {/* 債券基本資訊 */}
          <Card className="shadow-card">
            <div 
              className="p-1 rounded-t-lg transition-colors" 
              style={{ backgroundColor: openAccordions.includes('basic-info') ? getHeaderBackgroundColor() : '' }}
            >
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
                    <Input id="productName" value={cardData.productName} readOnly className="bg-gray-50 text-gray-500" />
                  </div>
                  <div>
                    <Label htmlFor="isin">債券代碼 ISIN Code {!cardData.isin && <AlertCircle className="inline w-4 h-4 ml-1 text-destructive" />}</Label>
                    <Input id="isin" value={cardData.isin} readOnly className={`bg-gray-50 text-gray-500 ${!cardData.isin ? 'border-destructive' : ''}`} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="currency">幣別 Currency</Label>
                    <Select value={cardData.currency} disabled>
                      <SelectTrigger className="bg-gray-50 text-gray-500"><SelectValue /></SelectTrigger>
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
                    <Input id="couponRate" type="number" step="0.01" value={cardData.couponRate} readOnly className="bg-gray-50 text-gray-500" />
                  </div>
                  <div>
                    <Label htmlFor="couponType">票息類型</Label>
                    <Select value={cardData.couponType} disabled>
                      <SelectTrigger className="bg-gray-50 text-gray-500"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="固定">固定</SelectItem>
                        <SelectItem value="浮動">浮動</SelectItem>
                        <SelectItem value="零息">零息</SelectItem>
                        <SelectItem value="變動">變動</SelectItem>
                        <SelectItem value="其他">其他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>


                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="issuer">債券發行人</Label>
                    <Input id="issuer" value={cardData.issuer} readOnly className="bg-gray-50 text-gray-500" />
                  </div>
                  <div>
                    <Label htmlFor="industry">產業別</Label>
                    <Input id="industry" value={cardData.industry} readOnly className="bg-gray-50 text-gray-500" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="minAmount" className="flex items-center justify-between">
                      最小承作面額
                      {!editingFields.has('minAmount') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing('minAmount')}
                          className="h-6 w-6 p-0"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      )}
                    </Label>
                    {editingFields.has('minAmount') ? (
                      <div className="flex items-center gap-1">
                        <Input
                          id="minAmount"
                          type="number"
                          value={tempValues.minAmount || ''}
                          onChange={(e) => handleTempValueChange('minAmount', e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => saveEditing('minAmount')}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelEditing('minAmount')}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <XIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Input id="minAmount" type="number" value={cardData.minAmount} readOnly className="bg-gray-50" />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="minIncrement" className="flex items-center justify-between">
                      最小疊加面額
                      {!editingFields.has('minIncrement') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing('minIncrement')}
                          className="h-6 w-6 p-0"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      )}
                    </Label>
                    {editingFields.has('minIncrement') ? (
                      <div className="flex items-center gap-1">
                        <Input
                          id="minIncrement"
                          type="number"
                          value={tempValues.minIncrement || ''}
                          onChange={(e) => handleTempValueChange('minIncrement', e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => saveEditing('minIncrement')}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelEditing('minIncrement')}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <XIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Input id="minIncrement" type="number" value={cardData.minIncrement} readOnly className="bg-gray-50" />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="remainingYears">剩餘年期</Label>
                    <Input 
                      id="remainingYears" 
                      type="text" 
                      value={cardData.remainingYears === '' || cardData.remainingYears === 'null' ? '永續' : cardData.remainingYears} 
                      readOnly 
                      className="bg-gray-50 text-gray-500" 
                    />
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
                    <Label htmlFor="accruedInterest" className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        前手息（每一最小承作面額）
                      </div>
                      {!editingFields.has('accruedInterest') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing('accruedInterest')}
                          className="h-6 w-6 p-0"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      )}
                    </Label>
                    {editingFields.has('accruedInterest') ? (
                      <div className="flex items-center gap-1">
                        <Input
                          id="accruedInterest"
                          type="number"
                          step="0.01"
                          value={tempValues.accruedInterest || ''}
                          onChange={(e) => handleTempValueChange('accruedInterest', e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => saveEditing('accruedInterest')}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelEditing('accruedInterest')}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <XIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Input 
                        id="accruedInterest" 
                        type="text" 
                        value={formatNumber(cardData.accruedInterest)} 
                        readOnly 
                        className="bg-gray-50"
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="issueDate">發行日</Label>
                    <Input id="issueDate" type="date" value={cardData.issueDate.split('/').reverse().join('-')} readOnly className="bg-gray-50 text-gray-500" />
                  </div>
                  <div>
                    <Label htmlFor="maturityDate">到期日</Label>
                    <Input 
                      id="maturityDate" 
                      type="text" 
                      value={cardData.maturityDate === '' || cardData.maturityDate === 'null' ? '永續' : cardData.maturityDate} 
                      readOnly 
                      className="bg-gray-50 text-gray-500" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="nextCouponDate">下一配息日</Label>
                    <Input id="nextCouponDate" type="date" value={cardData.nextCouponDate.split('/').reverse().join('-')} readOnly className="bg-gray-50 text-gray-500" />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* 價格與殖利率 */}
          <Card className="shadow-card">
            <div 
              className="p-1 rounded-t-lg transition-colors" 
              style={{ backgroundColor: openAccordions.includes('pricing') ? getHeaderBackgroundColor() : '' }}
            >
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
                        <Badge variant="secondary" className="text-xs">
                          YTM {cardData.maturityType === '永續' ? 'N/A' : `${cardData.ytm}%`}
                        </Badge>
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
                {/* 買賣方向選擇 */}
                <div className="mb-4">
                  <Label htmlFor="tradeDirection">客戶需求</Label>
                  <Select value={cardData.tradeDirection} onValueChange={handleTradeDirectionChange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="買">買</SelectItem>
                      <SelectItem value="賣">賣</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="bidPrice" className="flex items-center justify-between">
                      參考客戶賣價 (Bid)
                      {!editingFields.has('bidPrice') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing('bidPrice')}
                          className="h-6 w-6 p-0"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      )}
                    </Label>
                    {editingFields.has('bidPrice') ? (
                      <div className="flex items-center gap-1">
                        <Input
                          id="bidPrice"
                          type="number"
                          step="0.01"
                          value={tempValues.bidPrice || ''}
                          onChange={(e) => handleTempValueChange('bidPrice', e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => saveEditing('bidPrice')}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelEditing('bidPrice')}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <XIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Input id="bidPrice" type="number" step="0.01" value={parseFloat(cardData.bidPrice) ? parseFloat(cardData.bidPrice).toFixed(2) : cardData.bidPrice} readOnly className="bg-gray-50" />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="askPrice" className="flex items-center justify-between">
                      參考客戶買價 (Ask)
                      {!editingFields.has('askPrice') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing('askPrice')}
                          className="h-6 w-6 p-0"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      )}
                    </Label>
                    {editingFields.has('askPrice') ? (
                      <div className="flex items-center gap-1">
                        <Input
                          id="askPrice"
                          type="number"
                          step="0.01"
                          value={tempValues.askPrice || ''}
                          onChange={(e) => handleTempValueChange('askPrice', e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => saveEditing('askPrice')}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelEditing('askPrice')}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <XIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Input id="askPrice" type="number" step="0.01" value={parseFloat(cardData.askPrice) ? parseFloat(cardData.askPrice).toFixed(2) : cardData.askPrice} readOnly className="bg-gray-50" />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="ytm">到期殖利率 (%)</Label>
                    <Input id="ytm" type="number" step="0.01" value={cardData.ytm} readOnly className="bg-gray-50 text-gray-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tradingPrice" className="flex items-center justify-between">
                      參考價格
                      {!editingFields.has('tradingPrice') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing('tradingPrice')}
                          className="h-6 w-6 p-0"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      )}
                    </Label>
                    {editingFields.has('tradingPrice') ? (
                      <div className="flex items-center gap-1">
                        <Input
                          id="tradingPrice"
                          type="number"
                          step="0.01"
                          value={tempValues.tradingPrice || ''}
                          onChange={(e) => handleTempValueChange('tradingPrice', e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => saveEditing('tradingPrice')}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelEditing('tradingPrice')}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <XIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Input id="tradingPrice" type="number" step="0.01" value={parseFloat(cardData.tradingPrice) ? parseFloat(cardData.tradingPrice).toFixed(2) : cardData.tradingPrice} readOnly className="bg-gray-50" />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="quantity" className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        數量 (Quantity)
                        {(() => {
                          const quantity = parseFloat(cardData.quantity) || 0;
                          const minAmount = parseFloat(cardData.minAmount) || 0;
                          const minIncrement = parseFloat(cardData.minIncrement) || 1;
                          const hasError = quantity > 0 && minAmount > 0 && minIncrement > 0 && 
                            (quantity < minAmount || quantity % minIncrement !== 0);
                          return hasError ? <AlertCircle className="w-4 h-4 text-destructive" /> : null;
                        })()}
                  </div>
                      {!editingFields.has('quantity') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing('quantity')}
                          className="h-6 w-6 p-0"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      )}
                    </Label>
                    {editingFields.has('quantity') ? (
                      <div className="flex items-center gap-1">
                        <Input
                          id="quantity"
                          type="number"
                          step="0.01"
                          value={tempValues.quantity || ''}
                          onChange={(e) => handleTempValueChange('quantity', e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => saveEditing('quantity')}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelEditing('quantity')}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <XIcon className="h-3 w-3" />
                        </Button>
                </div>
                    ) : (
                      <Input 
                        id="quantity" 
                        type="text" 
                        value={formatNumber(cardData.quantity)} 
                        readOnly 
                        className={`bg-gray-50 ${(() => {
                          const quantity = parseFloat(cardData.quantity) || 0;
                          const minAmount = parseFloat(cardData.minAmount) || 0;
                          const minIncrement = parseFloat(cardData.minIncrement) || 1;
                          const hasError = quantity > 0 && minAmount > 0 && minIncrement > 0 && 
                            (quantity < minAmount || quantity % minIncrement !== 0);
                          return hasError ? 'border-destructive' : '';
                        })()}`}
                      />
                    )}
                    {(() => {
                      const quantity = parseFloat(cardData.quantity) || 0;
                      const minAmount = parseFloat(cardData.minAmount) || 0;
                      const minIncrement = parseFloat(cardData.minIncrement) || 1;
                      const errors: string[] = [];
                      
                      if (quantity > 0 && minAmount > 0 && quantity < minAmount) {
                        errors.push(`小於最小承作面額 ${minAmount.toLocaleString()}`);
                      }
                      if (quantity > 0 && minIncrement > 0 && quantity % minIncrement !== 0) {
                        errors.push(`最小疊加面額為 ${minIncrement.toLocaleString()}，請輸入 ${minIncrement.toLocaleString()} 的倍數`);
                      }
                      
                      return errors.length > 0 ? (
                        <div className="text-xs text-destructive mt-1">
                          {errors.map((error, index) => (
                            <div key={index}>{error}</div>
                          ))}
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="transactionAmount" className="flex items-center justify-between">
                      交易金額
                      {!editingFields.has('transactionAmount') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing('transactionAmount')}
                          className="h-6 w-6 p-0"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      )}
                    </Label>
                    {editingFields.has('transactionAmount') ? (
                      <div className="flex items-center gap-1">
                        <Input
                          id="transactionAmount"
                          type="number"
                          step="0.01"
                          value={tempValues.transactionAmount || ''}
                          onChange={(e) => handleTempValueChange('transactionAmount', e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => saveEditing('transactionAmount')}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelEditing('transactionAmount')}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <XIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Input 
                        id="transactionAmount" 
                        type="text" 
                        value={formatNumber(cardData.transactionAmount)} 
                        readOnly 
                        className="bg-gray-50"
                      />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="accruedInterest">前手息</Label>
                    <Input 
                      id="accruedInterest" 
                      type="text" 
                      value={formatNumber(((parseFloat(cardData.accruedInterest) || 0) / (parseFloat(cardData.minAmount) || 10000)) * (parseFloat(cardData.quantity) || 0))} 
                      readOnly 
                      className="bg-gray-50 text-gray-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalSettlement">總交割金額</Label>
                    <Input id="totalSettlement" type="text" value={formatNumber(cardData.totalSettlement)} readOnly className="bg-gray-50 text-gray-500" />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* 三大信評 */}
          <Card className="shadow-card">
            <div 
              className="p-1 rounded-t-lg transition-colors" 
              style={{ backgroundColor: openAccordions.includes('ratings') ? getHeaderBackgroundColor() : '' }}
            >
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
                    <Label htmlFor="spRating" className="flex items-center justify-between">
                      標準普爾 (S&P)
                      {!editingFields.has('spRating') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing('spRating')}
                          className="h-6 w-6 p-0"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      )}
                    </Label>
                    {editingFields.has('spRating') ? (
                      <div className="flex items-center gap-1">
                        <Input
                          id="spRating"
                          value={tempValues.spRating || ''}
                          onChange={(e) => handleTempValueChange('spRating', e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => saveEditing('spRating')}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelEditing('spRating')}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <XIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Input id="spRating" value={cardData.spRating} readOnly className="bg-gray-50" />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="moodyRating" className="flex items-center justify-between">
                      穆迪 (Moody's)
                      {!editingFields.has('moodyRating') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing('moodyRating')}
                          className="h-6 w-6 p-0"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      )}
                    </Label>
                    {editingFields.has('moodyRating') ? (
                      <div className="flex items-center gap-1">
                        <Input
                          id="moodyRating"
                          value={tempValues.moodyRating || ''}
                          onChange={(e) => handleTempValueChange('moodyRating', e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => saveEditing('moodyRating')}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelEditing('moodyRating')}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <XIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Input id="moodyRating" value={cardData.moodyRating} readOnly className="bg-gray-50" />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="fitchRating" className="flex items-center justify-between">
                      惠譽 (Fitch)
                      {!editingFields.has('fitchRating') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing('fitchRating')}
                          className="h-6 w-6 p-0"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      )}
                    </Label>
                    {editingFields.has('fitchRating') ? (
                      <div className="flex items-center gap-1">
                        <Input
                          id="fitchRating"
                          value={tempValues.fitchRating || ''}
                          onChange={(e) => handleTempValueChange('fitchRating', e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => saveEditing('fitchRating')}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelEditing('fitchRating')}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <XIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Input id="fitchRating" value={cardData.fitchRating} readOnly className="bg-gray-50" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="seniority">償還順位</Label>
                    <Select value={cardData.seniorityRank} disabled>
                      <SelectTrigger className="bg-gray-50 text-gray-500"><SelectValue /></SelectTrigger>
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
                    <Select value={cardData.paymentFrequency} disabled>
                      <SelectTrigger className="bg-gray-50 text-gray-500"><SelectValue /></SelectTrigger>
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
                  <Select value={cardData.maturityType} disabled>
                    <SelectTrigger className="bg-gray-50 text-gray-500"><SelectValue /></SelectTrigger>
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

  {/* DM Modal */}
  <BondDMModal 
    bond={{
      ...bond,
      spRating: cardData.spRating,
      moodyRating: cardData.moodyRating,
      fitchRating: cardData.fitchRating,
      couponRate: parseFloat(cardData.couponRate) || 0,
      yieldToMaturity: (parseFloat(cardData.ytm) || 0) / 100, // cardData.ytm 已經是百分比格式，需要轉換回小數格式
      bidPrice: parseFloat(cardData.bidPrice) || 0,
      askPrice: parseFloat(cardData.askPrice) || 0,

      remainingYears: parseFloat(cardData.remainingYears) || 0,

      issuer: cardData.issuer,
      country: cardData.country,
      industry: cardData.industry,
      paymentFrequency: cardData.paymentFrequency as "每年" | "每半年" | "每季" | "每月" | "不配",
      maturityType: cardData.maturityType as "到期償還" | "可提前贖回" | "永續" | "其他",
      seniority_text: cardData.seniorityRank as "永續" | "優先無擔保" | "優先有擔保" | "次順位",
      issuerDescription: cardData.issuerDescription,
      issuerControl: cardData.issuerControl,
      riskNotes: cardData.riskNotes,
      defaultProbability1Y: parseFloat(cardData.defaultProbability) || 0,
      outstandingAmount: parseFloat(cardData.outstandingAmount) || 0,
      investorType: cardData.investorType // 使用編輯器選擇的投資人身份
    }} 
    isOpen={showDM} 
    onClose={() => setShowDM(false)}
    transactionAmount={parseFloat(cardData.transactionAmount) || undefined}
    tradeDirection={cardData.tradeDirection}
  />
</div>
);

};

export default CardEditor;
