// Bond Data Model - Complete financial instrument definition
export interface Bond {
  // Core identifiers
  id: string;
  isin: string; // 國際代號_ISIN_CODE
  name: string; // 債券名稱_公司簡稱_票息_到期日
  issuer: string; // 債券發行人
  
  // Classification
  industry: string; // 產業別
  currency: 'USD' | 'EUR' | 'JPY' | 'TWD' | 'CNY' | 'GBP' | 'AUD' | 'CAD' | 'CHF' | 'HKD';
  investorType: string[]; // 投資人身分別 (一般/專業/機構)
  country: string; // 國家
  
  // Duration & Maturity
  remainingYears: number; // 剩餘年期_年
  issueDate: string; // 發行日
  maturityDate: string; // 到期日
  maturityType: '到期償還' | '可提前贖回' | '永續' | '其他';
  
  // Coupon & Interest
  couponRate: number; // 票面利率_%
  couponType: '固定' | '浮動' | '零息' | '階梯' | '其他';
  paymentFrequency: '每年' | '每半年' | '每季' | '每月' | '不配';
  previousCouponDate?: string; // 上一配息日
  nextCouponDate?: string; // 下一配息日
  nextCallDate?: string; // 下一買回日
  accruedInterest: number; // 前手息_每一萬面額
  
  // Pricing
  bidPrice: number; // 參考客戶賣價_Bid_Price
  askPrice: number; // 參考客戶買價_Ask_Price
  yieldToMaturity: number; // 參考到期殖利率_%
  
  // Credit Ratings
  spRating: string; // 信用評等_標準普爾
  moodyRating: string; // 信用評等_穆迪
  fitchRating: string; // 信用評等_惠譽
  
  // Transaction Details
  minDenomination: number; // 最小承作金額_原幣
  minIncrement: number; // 最小累加金額_原幣
  outstandingAmount: number; // 未償額
  
  // Structure
  seniority: '優先無擔保' | '優先有擔保' | '次順位' | '永續' | '其他';
  seniority_text: '優先無擔保' | '優先有擔保' | '次順位' | '永續'; // UI display value
  seniority_raw: string; // Original API string
  
  // Risk & Compliance
  riskNotes: string; // 風險備註
  defaultProbability1Y: number; // 一年違約機率
  tlacMrel: boolean; // TLAC_MREL指定
  parentCompanyCode?: string; // 母公司代碼
  
  // Additional Information
  issuerDescription: string; // 發行者簡介
  issuerControl: string; // 發行人控管
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

// 新增：交易資料介面
export interface TradingData {
  isin: string;
  tradingDate: string;
  bidPrice: number;
  askPrice: number;
  lastPrice: number;
  volume: number;
  yieldToMaturity: number;
  spread: number;
  source: string;
}

// 新增：付息計劃介面
export interface PaymentFlow {
  isin: string;
  paymentDate: string;
  paymentType: 'Coupon' | 'Principal' | 'Call' | 'Put';
  amount: number;
  currency: string;
  accruedDays: number;
  accruedInterest: number;
  principalAmount?: number;
  couponRate?: number;
}

// 新增：違約風險資料介面
export interface DefaultRisk {
  isin: string;
  defaultProbability1Y: number;
  defaultProbability5Y: number;
  recoveryRate: number;
  creditSpread: number;
  lastUpdated: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Very High';
}

// 新增：期權資料介面
export interface OptionData {
  isin: string;
  optionType: 'Call' | 'Put' | 'Both';
  callDate?: string;
  putDate?: string;
  callPrice?: number;
  putPrice?: number;
  callNoticeDays?: number;
  putNoticeDays?: number;
  isCallable: boolean;
  isPutable: boolean;
}

// 新增：擔保人資料介面
export interface GuarantorData {
  isin: string;
  guarantorName: string;
  guarantorType: 'Corporate' | 'Government' | 'Bank' | 'Insurance';
  guaranteeAmount: number;
  guaranteeCurrency: string;
  guaranteePercentage: number;
  creditRating: string;
  country: string;
}

// 擴展的債券資料介面（包含所有 API 資料）
export interface ExtendedBond extends Bond {
  // 交易資料
  tradingData?: TradingData[];
  latestTrading?: TradingData;
  
  // 付息計劃
  paymentFlows?: PaymentFlow[];
  nextPayments?: PaymentFlow[];
  
  // 違約風險
  defaultRisk?: DefaultRisk;
  
  // 期權資料
  optionData?: OptionData;
  
  // 擔保人資料
  guarantors?: GuarantorData[];
  
  // 發行人詳細信息
  emitentInfo?: {
    id: string;
    name_eng: string;
    full_name_eng: string;
    type_name_eng: string;
    branch_name_eng: string;
    country_name_eng: string;
    profile_eng: string;
    profile_zh?: string; // 中文版發行者簡介
    emitent_address_eng: string;
    site_eng: string;
    emitent_lei?: string;
    cik?: string;
    swift?: string;
  };
  
  // API 狀態
  dataStatus: {
    emissions: 'loaded' | 'loading' | 'error';
    tradings: 'loaded' | 'loading' | 'error';
    flows: 'loaded' | 'loading' | 'error';
    defaults: 'loaded' | 'loading' | 'error';
    options: 'loaded' | 'loading' | 'error';
    guarantors: 'loaded' | 'loading' | 'error';
  };
  
  // 最後更新時間
  lastDataUpdate: string;
}

// Sample bond data - AAPL example
export const sampleBond: Bond = {
  id: '1',
  isin: 'US037833DY36',
  name: 'AAPL 1 1/4 08/20/30',
  issuer: '蘋果公司',
  industry: '科技',
  currency: 'USD',
  investorType: ['一般', '專業', '機構'],
  country: '美國',
  remainingYears: 5.00,
  issueDate: '2020-08-20',
  maturityDate: '2030-08-20',
  maturityType: '到期償還',
  couponRate: 1.25,
  couponType: '固定',
  paymentFrequency: '每半年',
  previousCouponDate: '2024-02-20',
  nextCouponDate: '2024-08-20',
  accruedInterest: 1.04,
  bidPrice: 88.72,
  askPrice: 89.25,
  yieldToMaturity: 3.74,
  spRating: 'AA+',
  moodyRating: 'Aaa',
  fitchRating: 'N.A.',
  minDenomination: 10000,
  minIncrement: 1000,
  outstandingAmount: 5000000000,
  seniority: '優先無擔保',
  seniority_text: '優先無擔保',
  seniority_raw: 'Senior Unsecured',
  riskNotes: '流動性良好，信用風險低',
  defaultProbability1Y: 0.0012,
  tlacMrel: false,
  parentCompanyCode: 'AAPL',
  issuerDescription: 'Apple Inc. 為全球領先的科技公司，主要設計、製造和銷售消費電子產品、電腦軟體和線上服務。',
  issuerControl: '• 強勁現金流\n• 多元化產品組合\n• 全球品牌認知度高\n• 持續創新能力',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T10:30:00Z'
};

// Filter options for the search interface
export const filterOptions = {
  currencies: ['USD', 'EUR', 'JPY', 'TWD', 'CNY', 'GBP', 'AUD', 'CAD', 'CHF', 'HKD'],
  ratings: ['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 'BBB+', 'BBB', 'BBB-', 'BB+', 'BB', 'BB-', 'B+', 'B', 'B-', 'CCC+', 'CCC', 'CCC-', 'CC', 'C', 'D'],
  couponTypes: ['固定', '浮動', '零息', '階梯', '其他'],
  paymentFrequencies: ['每年', '每半年', '每季', '每月', '不配'],
  seniorities: ['優先無擔保', '優先有擔保', '次順位', '永續'],
  maturityTypes: ['到期償還', '可提前贖回', '永續', '其他'],
  countries: ['美國', '德國', '日本', '英國', '法國', '澳洲', '加拿大', '瑞士', '荷蘭', '其他']
};