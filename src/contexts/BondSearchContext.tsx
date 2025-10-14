import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Bond, ExtendedBond, TradingData, PaymentFlow, DefaultRisk, OptionData, GuarantorData } from '@/types/bond';
import { cbondsAPI } from '@/services/cbonds';

interface BondSearchState {
  bond: Bond | null;
  extendedBond: ExtendedBond | null;
  loading: boolean;
  error: string | null;
  isin: string;
}

interface BondSearchContextType extends BondSearchState {
  searchByISIN: (isin: string) => Promise<void>;
  clearResults: () => void;
  setISIN: (isin: string) => void;
  refreshBondData: (isin: string) => Promise<void>;
}

const BondSearchContext = createContext<BondSearchContextType | undefined>(undefined);

export const useBondSearch = () => {
  const context = useContext(BondSearchContext);
  if (context === undefined) {
    throw new Error('useBondSearch must be used within a BondSearchProvider');
  }
  return context;
};

// Helper functions for data mapping and calculations

// Map bond_rank_name_eng to UI seniority categories
function mapSeniority(bond_rank_name_eng: string | undefined | null): {
  seniority_text: '優先無擔保' | '優先有擔保' | '次順位' | '永續';
  seniority_raw: string;
} {
  const src = (bond_rank_name_eng || '').toLowerCase();
  const raw = bond_rank_name_eng || '—';
  
  // Priority order: 永續 → 次順位 → 有擔保 → 無擔保 (default)
  
  // 1. 永續 (Perpetual)
  if (src.includes('perpet') || src.includes('perp') || 
      src.includes('additional tier 1') || src.includes('at1') || 
      src.includes('coco')) {
    return { seniority_text: '永續', seniority_raw: raw };
  }
  
  // 2. 次順位 (Subordinated)
  if (src.includes('subordinat') || src.includes('tier 2') || 
      src.includes('lower tier 2') || src.includes('junior') || 
      src.includes('mezzanine') || src.includes('hybrid')) {
    return { seniority_text: '次順位', seniority_raw: raw };
  }
  
  // 3. 優先有擔保 (Secured)
  if (src.includes('secured') || src.includes('covered') || 
      src.includes('mortgage') || src.includes('guaranteed')) {
    return { seniority_text: '優先有擔保', seniority_raw: raw };
  }
  
  // 4. 優先無擔保 (Default)
  return { seniority_text: '優先無擔保', seniority_raw: raw };
}
function couponFreqText(cuponPeriod: number | string): string {
  const period = typeof cuponPeriod === 'string' ? parseInt(cuponPeriod) : cuponPeriod;
  switch (period) {
    case 1: return '每年';
    case 2: return '每半年';
    case 4: return '每季';
    case 12: return '每月';
    default: return '不配';
  }
}

// 格式化債券名稱中的日期格式
function formatBondNameDate(bondName: string): string {
  if (!bondName) return bondName;
  
  // 匹配日期格式：20aug2030, 20AUG2030, 20Aug2030 等
  const datePattern = /(\d{1,2})([a-zA-Z]{3})(\d{4})/g;
  
  return bondName.replace(datePattern, (match, day, month, year) => {
    // 月份映射
    const monthMap: { [key: string]: string } = {
      'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
      'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
      'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
    };
    
    const monthLower = month.toLowerCase();
    const monthNum = monthMap[monthLower] || month;
    
    // 轉換為 MM/DD/YY 格式
    const dayPadded = day.padStart(2, '0');
    const yearShort = year.slice(-2);
    
    return `${monthNum}/${dayPadded}/${yearShort}`;
  });
}

// 從債券名稱中提取股票代碼
function extractTickerFromName(bondName: string): string {
  if (!bondName) return '';
  
  console.log('extractTickerFromName - 債券名稱:', bondName);
  
  // 方案 1: 嘗試從債券名稱開頭提取股票代碼 (如 "AAPL 1.25% 20aug2030")
  const tickerMatch = bondName.match(/^([A-Z]{2,5})\s/);
  if (tickerMatch) {
    console.log('extractTickerFromName - 從名稱模式提取到股票代碼:', tickerMatch[1]);
    return tickerMatch[1];
  }
  
  // 方案 2: 從公司名稱中提取可能的股票代碼
  // 提取公司名稱（通常在逗號前）
  const companyName = bondName.split(',')[0].trim();
  console.log('extractTickerFromName - 提取的公司名稱:', companyName);
  
  // 方案 3: 常見公司的快速映射（只保留最重要的）
  const commonTickers: { [key: string]: string } = {
    'Apple': 'AAPL',
    'Apple Inc': 'AAPL',
    'Microsoft': 'MSFT',
    'Google': 'GOOGL',
    'Alphabet': 'GOOGL',
    'Amazon': 'AMZN',
    'Tesla': 'TSLA',
    'Meta': 'META',
    'Facebook': 'META',
    'Netflix': 'NFLX',
    'NVIDIA': 'NVDA',
    'Intel': 'INTC',
    'IBM': 'IBM',
    'Oracle': 'ORCL',
    'Cisco': 'CSCO',
    'Salesforce': 'CRM',
    'Adobe': 'ADBE',
    'PayPal': 'PYPL',
    'Uber': 'UBER',
    'Airbnb': 'ABNB',
    'Zoom': 'ZM',
    'Spotify': 'SPOT',
    'Twitter': 'TWTR',
    'Snapchat': 'SNAP',
    'Pinterest': 'PINS',
    'Square': 'SQ',
    'Shopify': 'SHOP',
    'Disney': 'DIS',
    'Warner Bros': 'WBD',
    'Comcast': 'CMCSA',
    'AT&T': 'T',
    'Verizon': 'VZ',
    'T-Mobile': 'TMUS',
    'Boeing': 'BA',
    'General Motors': 'GM',
    'Ford': 'F',
    'Toyota': 'TM',
    'Honda': 'HMC',
    'Sony': 'SNE',
    'Samsung': 'SSNLF',
    'LG': 'LPL',
    'Panasonic': 'PCRFY',
    'Canon': 'CAJ',
    'Nintendo': 'NTDOY',
    'Pfizer': 'PFE',
    'Johnson & Johnson': 'JNJ',
    'Procter & Gamble': 'PG',
    'Coca-Cola': 'KO',
    'PepsiCo': 'PEP',
    'McDonald\'s': 'MCD',
    'Starbucks': 'SBUX',
    'Nike': 'NKE',
    'Walmart': 'WMT',
    'Target': 'TGT',
    'Home Depot': 'HD',
    'Costco': 'COST',
    'FedEx': 'FDX',
    'UPS': 'UPS'
  };
  
  for (const [company, ticker] of Object.entries(commonTickers)) {
    if (companyName.includes(company)) {
      console.log('extractTickerFromName - 從常見公司映射找到股票代碼:', ticker);
      return ticker;
    }
  }
  
  // 方案 4: 如果都沒有找到，返回空字符串
  console.log('extractTickerFromName - 未找到股票代碼');
  return '';
}

function computeTenorYears(maturityDate: string): number | null {
  // 永續債券的 maturity_date 為 null 或空字符串
  if (!maturityDate || maturityDate === 'null' || maturityDate === '') {
    return null; // 返回 null 表示永續債券
  }
  
  const maturity = new Date(maturityDate);
  if (isNaN(maturity.getTime())) {
    return null; // 無效日期也返回 null
  }
  
  const now = new Date();
  const diffTime = maturity.getTime() - now.getTime();
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
  return Math.max(0, parseFloat(diffYears.toFixed(1)));
}

function computeSchedule(emission: any) {
  const today = new Date();
  
  // 安全地解析到期日
  let maturity: Date;
  try {
    maturity = new Date(emission.maturity_date);
    if (isNaN(maturity.getTime())) {
      console.error('無效的到期日:', emission.maturity_date);
      return {
        previousCouponDate: null,
        nextCouponDate: null
      };
    }
  } catch (error) {
    console.error('解析到期日時發生錯誤:', error, 'maturity_date:', emission.maturity_date);
    return {
      previousCouponDate: null,
      nextCouponDate: null
    };
  }
  
  // Get coupon frequency (1=annual, 2=semi-annual, 4=quarterly, 12=monthly)
  const frequency = parseInt(emission.cupon_period) || 2;
  const monthsInterval = 12 / frequency; // Convert frequency to months interval
  
  // 嘗試多種方式獲取起始配息日期
  let firstCouponEnd: Date;
  
  try {
    if (emission.first_coupon_end) {
      firstCouponEnd = new Date(emission.first_coupon_end);
      if (isNaN(firstCouponEnd.getTime())) {
        throw new Error('無效的 first_coupon_end');
      }
    } else if (emission.settlement_date) {
      firstCouponEnd = new Date(emission.settlement_date);
      if (isNaN(firstCouponEnd.getTime())) {
        throw new Error('無效的 settlement_date');
      }
    } else {
      // 如果沒有明確的配息日期，嘗試從發行日計算
      const issueDate = new Date(emission.issue_date);
      if (isNaN(issueDate.getTime())) {
        throw new Error('無效的 issue_date');
      }
      firstCouponEnd = new Date(issueDate);
      // 假設第一次配息在發行後6個月（對於半年配息）
      firstCouponEnd.setMonth(firstCouponEnd.getMonth() + monthsInterval);
    }
  } catch (error) {
    console.error('解析配息日期時發生錯誤:', error, {
      isin: emission.isin_code,
      first_coupon_end: emission.first_coupon_end,
      settlement_date: emission.settlement_date,
      issue_date: emission.issue_date
    });
    return {
      previousCouponDate: null,
      nextCouponDate: null
    };
  }
  
  console.log('配息日期計算:', {
    isin: emission.isin_code,
    issueDate: emission.issue_date,
    maturityDate: emission.maturity_date,
    firstCouponEnd: emission.first_coupon_end,
    settlementDate: emission.settlement_date,
    calculatedFirstCoupon: firstCouponEnd.toISOString().split('T')[0],
    frequency,
    monthsInterval
  });
  
  return {
    isin: emission.isin_code,
    issueDate: emission.issue_date,
    maturityDate: emission.maturity_date,
    firstCouponEnd: emission.first_coupon_end,
    settlementDate: emission.settlement_date,
    calculatedFirstCoupon: firstCouponEnd.toISOString().split('T')[0],
    frequency,
    monthsInterval
  };
  
  // Generate coupon dates from first_coupon_end to maturity
  const couponDates: Date[] = [];
  let currentDate = new Date(firstCouponEnd);
  
  while (currentDate <= maturity) {
    couponDates.push(new Date(currentDate));
    currentDate.setMonth(currentDate.getMonth() + monthsInterval);
  }
  
  // Find previous and next coupon dates
  let previousCouponDate: Date | null = null;
  let nextCouponDate: Date | null = null;
  
  for (const date of couponDates) {
    if (date <= today) {
      previousCouponDate = date;
    } else if (!nextCouponDate) {
      nextCouponDate = date;
      break;
    }
  }
  
  console.log('配息日期結果:', {
    isin: emission.isin_code,
    previousCouponDate: previousCouponDate?.toISOString().split('T')[0] || '無',
    nextCouponDate: nextCouponDate?.toISOString().split('T')[0] || '無',
    totalCouponDates: couponDates.length,
    couponDates: couponDates.map(d => d.toISOString().split('T')[0]).slice(0, 5) // 只顯示前5個
  });
  
  return {
    previousCouponDate: previousCouponDate?.toISOString().split('T')[0] || '',
    nextCouponDate: nextCouponDate?.toISOString().split('T')[0] || ''
  };
}

function computeACI(emission: any, schedule: any, minDenomination?: number): number {
  const couponRate = parseFloat(emission.emission_coupon_rate || emission.curr_coupon_rate || '0');
  const frequency = parseInt(emission.cupon_period) || 2;
  
  if (couponRate === 0) {
    console.log('前手息計算 - 票面利率為0:', {
      isin: emission.isin_code,
      couponRate
    });
    return 0;
  }
  
  const today = new Date();
  let startDate: Date;
  
  try {
    // 如果有上次配息日，使用上次配息日；否則使用發行日
    if (schedule.previousCouponDate) {
      startDate = new Date(schedule.previousCouponDate);
      if (isNaN(startDate.getTime())) {
        throw new Error('無效的 previousCouponDate');
      }
      console.log('前手息計算 - 使用上次配息日:', {
        isin: emission.isin_code,
        previousCouponDate: schedule.previousCouponDate
      });
    } else {
      startDate = new Date(emission.issue_date);
      if (isNaN(startDate.getTime())) {
        throw new Error('無效的 issue_date');
      }
      console.log('前手息計算 - 使用發行日（剛發行債券）:', {
        isin: emission.isin_code,
        issueDate: emission.issue_date,
        previousCouponDate: '無'
      });
    }
  } catch (error) {
    console.error('前手息計算 - 日期解析錯誤:', error, {
      isin: emission.isin_code,
      previousCouponDate: schedule.previousCouponDate,
      issueDate: emission.issue_date
    });
    return 0;
  }
  
  // 30/360 US rule day count
  const days360 = calculateDays360US(startDate, today);
  const periodsPerYear = frequency;
  const daysInPeriod = 360 / periodsPerYear;
  
  // 使用最小承作面額作為計算基礎，如果沒有提供則使用預設的10000
  const baseAmount = minDenomination || 10000;
  
  // Accrued interest = (days elapsed / days in period) × (base amount × annual rate / frequency)
  const periodicCouponAmount = (baseAmount * couponRate / 100) / periodsPerYear;
  const accruedInterest = (days360 / daysInPeriod) * periodicCouponAmount;
  
  console.log('前手息計算 - 30/360 US rule:', {
    isin: emission.isin_code,
    startDate: startDate.toISOString().split('T')[0],
    today: today.toISOString().split('T')[0],
    couponRate,
    frequency,
    days360,
    daysInPeriod,
    baseAmount,
    periodicCouponAmount,
    accruedInterest: Math.round(accruedInterest * 100) / 100
  });
  
  return Math.round(accruedInterest * 100) / 100; // Round to 2 decimal places
}

function calculateDays360US(startDate: Date, endDate: Date): number {
  // 30/360 US (NASD) day count convention
  let d1 = startDate.getDate();
  let d2 = endDate.getDate();
  const m1 = startDate.getMonth() + 1;
  const m2 = endDate.getMonth() + 1;
  const y1 = startDate.getFullYear();
  const y2 = endDate.getFullYear();
  
  // Adjust day counts according to 30/360 US rules
  if (d1 === 31) d1 = 30;
  if (d2 === 31 && d1 === 30) d2 = 30;
  
  // 計算天數時 +1，因為要包含當日利息
  return 360 * (y2 - y1) + 30 * (m2 - m1) + (d2 - d1) + 1;
}

// 獲取最新的有效價格資料
function getLatestValidPrices(tradingData: TradingData[]): {
  bidPrice: number;
  askPrice: number;
  lastPrice: number;
  yieldToMaturity: number;
  tradingDate: string;
} | null {
  if (tradingData.length === 0) return null;
  
  // 尋找最新的有效價格（至少有一個價格不為0）
  for (const trading of tradingData) {
    if (trading.bidPrice > 0 || trading.askPrice > 0 || trading.lastPrice > 0) {
      // 檢查 BID 和 Ask 價格是否相同
      if (trading.bidPrice === trading.askPrice && trading.bidPrice > 0 && trading.askPrice > 0) {
        // 如果相同，繼續查找下一個不同的價格
        console.log(`價格相同警告: BID=${trading.bidPrice}, Ask=${trading.askPrice}, 日期=${trading.tradingDate}`);
        continue;
      }
      
      return {
        bidPrice: trading.bidPrice,
        askPrice: trading.askPrice,
        lastPrice: trading.lastPrice,
        yieldToMaturity: trading.yieldToMaturity,
        tradingDate: trading.tradingDate
      };
    }
  }
  
  // 如果所有價格都相同，返回最新的價格（即使相同）
  for (const trading of tradingData) {
    if (trading.bidPrice > 0 || trading.askPrice > 0 || trading.lastPrice > 0) {
      console.log(`所有價格都相同，使用最新價格: BID=${trading.bidPrice}, Ask=${trading.askPrice}, 日期=${trading.tradingDate}`);
      return {
        bidPrice: trading.bidPrice,
        askPrice: trading.askPrice,
        lastPrice: trading.lastPrice,
        yieldToMaturity: trading.yieldToMaturity,
        tradingDate: trading.tradingDate
      };
    }
  }
  
  return null;
}

// 處理交易資料
function processTradingData(tradingResponse: any): TradingData[] {
  if (!tradingResponse?.items) return [];
  
  // 先過濾掉價格為0的資料，然後按日期排序
  const validItems = tradingResponse.items
    .map((item: any) => {
      // 根據 API 實際返回的字段名稱進行映射
      const bidPrice = parseFloat(item.buying_quote || item.bid_price || '0');
      const askPrice = parseFloat(item.selling_quote || item.ask_price || '0');
      const lastPrice = parseFloat(item.last_price || '0');
      
      return {
        ...item,
        bidPrice,
        askPrice,
        lastPrice
      };
    })
    .filter((item: any) => {
      // 過濾條件：至少有一個價格不為0
      return item.bidPrice > 0 || item.askPrice > 0 || item.lastPrice > 0;
    })
    .sort((a: any, b: any) => {
      // 按日期降序排序，確保最新的資料在前面
      const dateA = new Date(a.date || a.trading_date || '');
      const dateB = new Date(b.date || b.trading_date || '');
      return dateB.getTime() - dateA.getTime();
    });
  
  return validItems.map((item: any) => {
    // 使用中間價作為 YTM 的參考，或者使用 bid/offer 的平均值
    const ytmBid = parseFloat(item.ytm_bid || '0');
    const ytmOffer = parseFloat(item.ytm_offer || '0');
    let yieldToMaturity = ytmBid > 0 && ytmOffer > 0 ? (ytmBid + ytmOffer) / 2 : 
                         ytmBid > 0 ? ytmBid : ytmOffer;
    
    console.log('處理交易數據:', {
      isin: item.isin_code,
      buying_quote: item.buying_quote,
      selling_quote: item.selling_quote,
      last_price: item.last_price,
      bidPrice: item.bidPrice,
      askPrice: item.askPrice,
      lastPrice: item.lastPrice,
      ytm_bid: item.ytm_bid,
      ytm_offer: item.ytm_offer,
      calculated_ytm: yieldToMaturity,
      date: item.date || item.trading_date
    });
    
    return {
      isin: item.isin_code || '',
      tradingDate: item.date || item.trading_date || '',
      bidPrice: item.bidPrice,
      askPrice: item.askPrice,
      lastPrice: item.lastPrice,
      volume: parseFloat(item.volume || '0'),
      yieldToMaturity,
      spread: item.askPrice - item.bidPrice,
      source: item.trading_ground_id || item.source || ''
    };
  });
}

// 處理付息計劃
function processPaymentFlows(flowResponse: any): PaymentFlow[] {
  if (!flowResponse?.items) return [];
  
  return flowResponse.items.map((item: any) => ({
    isin: item.isin_code || '',
    paymentDate: item.payment_date || '',
    paymentType: item.payment_type || 'Coupon',
    amount: parseFloat(item.amount || '0'),
    currency: item.currency || 'USD',
    accruedDays: parseInt(item.accrued_days || '0'),
    accruedInterest: parseFloat(item.accrued_interest || '0'),
    principalAmount: parseFloat(item.principal_amount || '0'),
    couponRate: parseFloat(item.coupon_rate || '0')
  }));
}

// 處理違約風險資料
function processDefaultRisk(defaultResponse: any): DefaultRisk | null {
  if (!defaultResponse?.items || defaultResponse.items.length === 0) {
    console.log('processDefaultRisk - 沒有違約數據，返回 null');
    return null;
  }
  
  const item = defaultResponse.items[0];
  console.log('processDefaultRisk - API 返回的違約數據:', {
    hasDefaultProbability1Y: !!item.default_probability_1y,
    hasDefaultProbability5Y: !!item.default_probability_5y,
    hasRecoveryRate: !!item.recovery_rate,
    hasCreditSpread: !!item.credit_spread,
    itemKeys: Object.keys(item)
  });
  
  // 檢查是否有預測的違約機率數據
  const prob1Y = parseFloat(item.default_probability_1y || '0');
  const prob5Y = parseFloat(item.default_probability_5y || '0');
  
  // 如果沒有預測數據，基於信用評等估算（僅作為示例）
  let estimatedProb1Y = prob1Y;
  let estimatedProb5Y = prob5Y;
  
  if (prob1Y === 0 && prob5Y === 0) {
    console.log('processDefaultRisk - 沒有預測違約機率數據，使用估算值');
    // 基於信用評等的粗略估算（實際應用中應該使用更精確的模型）
    // 這裡使用保守的估算值
    estimatedProb1Y = 0.001; // 0.1% - 對於高信用評等債券的保守估算
    estimatedProb5Y = 0.005; // 0.5% - 五年期估算
  }
  
  let riskLevel: 'Low' | 'Medium' | 'High' | 'Very High' = 'Low';
  if (estimatedProb1Y > 0.05) riskLevel = 'Very High';
  else if (estimatedProb1Y > 0.02) riskLevel = 'High';
  else if (estimatedProb1Y > 0.005) riskLevel = 'Medium';
  
  return {
    isin: item.isin_code || '',
    defaultProbability1Y: estimatedProb1Y,
    defaultProbability5Y: estimatedProb5Y,
    recoveryRate: parseFloat(item.recovery_rate || '0.4'), // 默認 40% 回收率
    creditSpread: parseFloat(item.credit_spread || '0'),
    lastUpdated: item.last_updated || new Date().toISOString(),
    riskLevel
  };
}

// 處理期權資料
function processOptionData(optionResponse: any): OptionData | null {
  if (!optionResponse?.items || optionResponse.items.length === 0) return null;
  
  const item = optionResponse.items[0];
  return {
    isin: item.isin_code || '',
    optionType: item.option_type || 'Both',
    callDate: item.call_date || undefined,
    putDate: item.put_date || undefined,
    callPrice: parseFloat(item.call_price || '0') || undefined,
    putPrice: parseFloat(item.put_price || '0') || undefined,
    callNoticeDays: parseInt(item.call_notice_days || '0') || undefined,
    putNoticeDays: parseInt(item.put_notice_days || '0') || undefined,
    isCallable: item.is_callable === true || item.is_callable === 'true',
    isPutable: item.is_putable === true || item.is_putable === 'true'
  };
}

// 處理擔保人資料
function processGuarantorData(guarantorResponse: any): GuarantorData[] {
  if (!guarantorResponse?.items) return [];
  
  return guarantorResponse.items.map((item: any) => ({
    isin: item.isin_code || '',
    guarantorName: item.guarantor_name || '',
    guarantorType: item.guarantor_type || 'Corporate',
    guaranteeAmount: parseFloat(item.guarantee_amount || '0'),
    guaranteeCurrency: item.guarantee_currency || 'USD',
    guaranteePercentage: parseFloat(item.guarantee_percentage || '0'),
    creditRating: item.credit_rating || '',
    country: item.country || ''
  }));
}

function mapEmissionToBond(emission: any, emitentInfo?: any): Bond {
  const schedule = computeSchedule(emission);
  const tenorYears = computeTenorYears(emission.maturity_date);
  const seniorityMapping = mapSeniority(emission.bond_rank_name_eng || emission.bond_rank_name || emission.bond_rank);
  
  // 判斷是否為永續債券
  const isPerpetual = !emission.maturity_date || 
                     emission.maturity_date === 'null' || 
                     emission.maturity_date === '' ||
                     seniorityMapping.seniority_text === '永續' ||
                     emission.bond_rank_name_eng?.toLowerCase().includes('perpetual') ||
                     emission.bond_rank_name_eng?.toLowerCase().includes('perp');
  
  // 獲取最小承作面額
  const minDenomination = parseFloat(emission.eurobonds_nominal || emission.integral_multiple || '10000');
  
  // 使用最小承作面額計算前手息
  const accruedInterest = computeACI(emission, schedule, minDenomination);
  
  return {
    id: emission.isin_code || '1',
    isin: emission.isin_code || '',
    name: formatBondNameDate(emission.document_eng || emission.bbgid_ticker || ''),
    issuer: emission.emitent_full_name_zh || emission.emitent_name_zh || emission.emitent_full_name_eng || emission.emitent_name_eng || '',
    industry: emitentInfo?.branch_name_zh || emitentInfo?.branch_name_eng || '', // 從發行人 API 獲取產業別（優先中文）
    currency: emission.currency_name as any || 'USD',
    investorType: ['一般', '專業', '機構'],
    country: emission.emitent_country_name_zh || emission.emitent_country_name_eng || '',
    remainingYears: tenorYears,
    issueDate: emission.settlement_date || '',
    maturityDate: isPerpetual ? '' : (emission.maturity_date || ''),
    maturityType: isPerpetual ? '永續' : '到期償還',
    couponRate: parseFloat(emission.emission_coupon_rate || emission.curr_coupon_rate || '0'),
    couponType: (() => {
      const couponString = emission.cupon_eng || '';
      const floatingRate = emission.floating_rate;
      
      console.log('API 票息類型判斷:', {
        coupon_type_name_eng: emission.coupon_type_name_eng,
        cupon_eng: couponString,
        floating_rate: floatingRate
      });
      
      // 零息債券
      if (!couponString || couponString === "0%" || emission.coupon_type_name_eng === "Zero coupon") {
        return '零息';
      }
      
      // 變動利率（分階段、混合型）
      if (couponString.includes("until") && couponString.includes("then")) {
        return '變動';
      }
      
      // 浮動利率
      if (floatingRate === "1" || 
          couponString.includes("ust yield") || 
          couponString.includes("libor") || 
          couponString.includes("sofr")) {
        return '浮動';
      }
      
      // 固定利率
      return '固定';
    })(),
    paymentFrequency: couponFreqText(emission.cupon_period) as any,
    previousCouponDate: schedule.previousCouponDate,
    nextCouponDate: schedule.nextCouponDate,
    accruedInterest,
    bidPrice: 0, // 將在 createExtendedBond 中從交易數據更新
    askPrice: 0, // 將在 createExtendedBond 中從交易數據更新
    yieldToMaturity: 0, // 將在 createExtendedBond 中從交易數據更新
    spRating: emission.sp_rating_zh || emission.sp_rating_eng || '—', // 信用評等（優先中文）
    moodyRating: emission.moody_rating_zh || emission.moody_rating_eng || '—', // 信用評等（優先中文）
    fitchRating: emission.fitch_rating_zh || emission.fitch_rating_eng || '—', // 信用評等（優先中文）
    minDenomination: parseFloat(emission.integral_multiple || '10000'),
    minIncrement: parseFloat(emission.integral_multiple || '1000'),
    outstandingAmount: parseFloat(emission.outstanding_volume || emission.remaining_outstand_amount || '0'),
    seniority: seniorityMapping.seniority_text,
    seniority_text: seniorityMapping.seniority_text,
    seniority_raw: seniorityMapping.seniority_raw,
    riskNotes: '',
    defaultProbability1Y: 0,
    tlacMrel: false,
    parentCompanyCode: (() => {
      const bondName = emission.name_eng || emission.name || '';
      const ticker = extractTickerFromName(bondName);
      console.log('mapEmissionToBond - 債券名稱:', bondName, '提取的股票代碼:', ticker);
      return ticker;
    })(),
    issuerDescription: '',
    issuerControl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// 創建擴展債券資料
function createExtendedBond(
  baseBond: Bond,
  tradingData: TradingData[],
  paymentFlows: PaymentFlow[],
  defaultRisk: DefaultRisk | null,
  optionData: OptionData | null,
  guarantors: GuarantorData[],
  emitentInfo?: any
): ExtendedBond {
  console.log('createExtendedBond 被調用:', {
    isin: baseBond.isin,
    name: baseBond.name,
    couponRate: baseBond.couponRate,
    accruedInterest: baseBond.accruedInterest
  });
  // 獲取最新的有效價格資料
  const latestValidPrices = getLatestValidPrices(tradingData);
  
  // 從交易數據中提取最新的有效價格和收益率
  let updatedBond = { ...baseBond };
  
  if (latestValidPrices) {
    // 使用最新的有效價格資料
    updatedBond = {
      ...baseBond,
      bidPrice: latestValidPrices.bidPrice,
      askPrice: latestValidPrices.askPrice,
      yieldToMaturity: latestValidPrices.yieldToMaturity
    };
    
    console.log('更新債券價格數據:', {
      originalBidPrice: baseBond.bidPrice,
      originalAskPrice: baseBond.askPrice,
      finalBidPrice: latestValidPrices.bidPrice,
      finalAskPrice: latestValidPrices.askPrice,
      yieldToMaturity: latestValidPrices.yieldToMaturity,
      lastPrice: latestValidPrices.lastPrice,
      tradingDate: latestValidPrices.tradingDate,
      totalTradingRecords: tradingData.length
    });
  } else {
    console.log('沒有有效的交易數據，使用預設值');
  }

  // 重新計算前手息（確保使用最新的計算邏輯）
  console.log('開始重新計算前手息 - baseBond 數據:', {
    isin: baseBond.isin,
    couponRate: baseBond.couponRate,
    paymentFrequency: baseBond.paymentFrequency,
    minDenomination: baseBond.minDenomination,
    maturityDate: baseBond.maturityDate,
    issueDate: baseBond.issueDate,
    previousCouponDate: baseBond.previousCouponDate,
    nextCouponDate: baseBond.nextCouponDate,
    originalAccruedInterest: baseBond.accruedInterest
  });
  
  const today = new Date();
  
  // 安全地解析到期日
  let maturity: Date;
  try {
    maturity = new Date(baseBond.maturityDate);
    if (isNaN(maturity.getTime())) {
      console.error('無效的到期日:', baseBond.maturityDate);
      return {
        ...updatedBond,
        dataStatus: { emissions: 'error', tradings: 'error', flows: 'error', defaults: 'error', options: 'error', guarantors: 'error' },
        lastDataUpdate: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('解析到期日時發生錯誤:', error, 'maturityDate:', baseBond.maturityDate);
    return {
      ...updatedBond,
      dataStatus: { emissions: 'error', tradings: 'error', flows: 'error', defaults: 'error', options: 'error', guarantors: 'error' },
      lastDataUpdate: new Date().toISOString()
    };
  }
  
  const frequency = baseBond.paymentFrequency === '每年' ? 1 : 
                   baseBond.paymentFrequency === '每半年' ? 2 :
                   baseBond.paymentFrequency === '每季' ? 4 :
                   baseBond.paymentFrequency === '每月' ? 12 : 2;
  
  // 計算配息日期
  const monthsInterval = 12 / frequency;
  let firstCouponEnd: Date;
  
  try {
    if (baseBond.previousCouponDate) {
      firstCouponEnd = new Date(baseBond.previousCouponDate);
      if (isNaN(firstCouponEnd.getTime())) {
        throw new Error('無效的 previousCouponDate');
      }
    } else {
      // 如果沒有上次配息日，從發行日計算
      const issueDate = new Date(baseBond.issueDate);
      if (isNaN(issueDate.getTime())) {
        throw new Error('無效的 issueDate');
      }
      firstCouponEnd = new Date(issueDate);
      firstCouponEnd.setMonth(firstCouponEnd.getMonth() + monthsInterval);
    }
  } catch (error) {
    console.error('解析配息日期時發生錯誤:', error, {
      isin: baseBond.isin,
      previousCouponDate: baseBond.previousCouponDate,
      issueDate: baseBond.issueDate
    });
    return {
      ...updatedBond,
      dataStatus: { emissions: 'error', tradings: 'error', flows: 'error', defaults: 'error', options: 'error', guarantors: 'error' },
      lastDataUpdate: new Date().toISOString()
    };
  }
  
  // 生成配息日期
  const couponDates: Date[] = [];
  let currentDate = new Date(firstCouponEnd);
  
  while (currentDate <= maturity) {
    couponDates.push(new Date(currentDate));
    currentDate.setMonth(currentDate.getMonth() + monthsInterval);
  }
  
  // 找到上次和下次配息日
  let previousCouponDate: Date | null = null;
  let nextCouponDate: Date | null = null;
  
  for (const date of couponDates) {
    if (date <= today) {
      previousCouponDate = date;
    } else if (!nextCouponDate) {
      nextCouponDate = date;
      break;
    }
  }
  
  // 重新計算前手息
  let recalculatedAccruedInterest = 0;
  if (baseBond.couponRate > 0) {
    let startDate: Date;
    
    try {
      // 如果有上次配息日，使用上次配息日；否則使用發行日
      if (previousCouponDate) {
        startDate = previousCouponDate;
        console.log('重新計算前手息 - 使用上次配息日:', {
          isin: baseBond.isin,
          previousCouponDate: previousCouponDate.toISOString().split('T')[0]
        });
      } else {
        startDate = new Date(baseBond.issueDate);
        if (isNaN(startDate.getTime())) {
          throw new Error('無效的 issueDate');
        }
        console.log('重新計算前手息 - 使用發行日（剛發行債券）:', {
          isin: baseBond.isin,
          issueDate: baseBond.issueDate,
          previousCouponDate: '無'
        });
      }
      
      const days360 = calculateDays360US(startDate, today);
      const periodsPerYear = frequency;
      const daysInPeriod = 360 / periodsPerYear;
      const baseAmount = baseBond.minDenomination || 10000;
      const periodicCouponAmount = (baseAmount * baseBond.couponRate / 100) / periodsPerYear;
      recalculatedAccruedInterest = (days360 / daysInPeriod) * periodicCouponAmount;
      recalculatedAccruedInterest = Math.round(recalculatedAccruedInterest * 100) / 100;
    } catch (error) {
      console.error('重新計算前手息時發生錯誤:', error, {
        isin: baseBond.isin,
        previousCouponDate: previousCouponDate?.toISOString().split('T')[0],
        issueDate: baseBond.issueDate
      });
      recalculatedAccruedInterest = 0;
    }
  }
  
  console.log('重新計算前手息:', {
    isin: baseBond.isin,
    previousCouponDate: previousCouponDate?.toISOString().split('T')[0] || '無',
    nextCouponDate: nextCouponDate?.toISOString().split('T')[0] || '無',
    couponRate: baseBond.couponRate,
    frequency,
    minDenomination: baseBond.minDenomination,
    originalAccruedInterest: baseBond.accruedInterest,
    recalculatedAccruedInterest
  });
  
  // 更新前手息
  updatedBond = {
    ...updatedBond,
    accruedInterest: recalculatedAccruedInterest,
    previousCouponDate: previousCouponDate?.toISOString().split('T')[0] || '',
    nextCouponDate: nextCouponDate?.toISOString().split('T')[0] || ''
  };

  // 使用違約風險資料更新風險資訊
  const riskUpdatedBond = defaultRisk ? {
    ...updatedBond,
    defaultProbability1Y: defaultRisk.defaultProbability1Y
  } : updatedBond;

  return {
    ...riskUpdatedBond,
    tradingData,
    latestTrading: latestValidPrices ? {
      isin: riskUpdatedBond.isin,
      tradingDate: latestValidPrices.tradingDate,
      bidPrice: latestValidPrices.bidPrice,
      askPrice: latestValidPrices.askPrice,
      lastPrice: latestValidPrices.lastPrice,
      volume: 0, // 從 latestValidPrices 中沒有 volume 資訊
      yieldToMaturity: latestValidPrices.yieldToMaturity,
      spread: latestValidPrices.askPrice - latestValidPrices.bidPrice,
      source: ''
    } : null,
    paymentFlows,
    nextPayments: paymentFlows.filter(flow => 
      new Date(flow.paymentDate) > new Date()
    ).slice(0, 5), // 未來5次付息
    defaultRisk,
    optionData,
    guarantors,
    emitentInfo,
    dataStatus: {
      emissions: 'loaded',
      tradings: tradingData.length > 0 ? 'loaded' : 'error',
      flows: paymentFlows.length > 0 ? 'loaded' : 'error',
      defaults: defaultRisk ? 'loaded' : 'error',
      options: optionData ? 'loaded' : 'error',
      guarantors: guarantors.length > 0 ? 'loaded' : 'error'
    },
    lastDataUpdate: new Date().toISOString()
  };
}

export const BondSearchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<BondSearchState>({
    bond: null,
    extendedBond: null,
    loading: false,
    error: null,
    isin: ''
  });

  const searchByISIN = async (isin: string) => {
    if (!isin.trim()) {
      const errorMsg = '請輸入 ISIN 代碼';
      setState(prev => ({ ...prev, error: errorMsg }));
      throw new Error(errorMsg);
    }

    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null,
      isin: isin.trim().toUpperCase()
    }));

    try {
      // 🚀 優化策略：先檢查債券是否存在
      console.log('🔍 步驟 1: 檢查債券是否存在...');
      const emissionsResponse = await (cbondsAPI as any).getEmissions(isin, 'cht');
      
      // 如果沒有找到債券，直接返回錯誤
      if (!emissionsResponse?.items?.length) {
        const errorMsg = `未找到 ISIN: ${isin} 的債券資料`;
        setState(prev => ({ ...prev, error: errorMsg, loading: false }));
        throw new Error(errorMsg);
      }

      console.log('✅ 債券存在，開始載入詳細資料...');
      
      // 🚀 先處理基本資料，確認有資料後再載入其他
      const emission = emissionsResponse.items[0];
      const baseBond = mapEmissionToBond(emission, null); // 先不傳 emitentInfo
      
      // 🚀 先顯示基本資料（但保持 loading 狀態）
      console.log('📊 步驟 2: 顯示基本債券資料...');
      setState(prev => ({ 
        ...prev, 
        bond: baseBond,
        extendedBond: baseBond // 先用基本資料，但保持 loading: true
      }));

      // 🚀 步驟 3: 並行調用其他 API 端點（確認有資料後才執行）
      console.log('📈 步驟 3: 載入詳細資料...');
      const [tradingsResponse, flowsResponse, defaultsResponse, optionsResponse, guarantorsResponse] = await Promise.allSettled([
        cbondsAPI.getTradingsNew(isin),
        cbondsAPI.getFlowNew(isin),
        cbondsAPI.getEmissionDefault(isin),
        cbondsAPI.getOffert(isin),
        cbondsAPI.getEmissionGuarantors(isin)
      ]);

      // 獲取發行人詳細信息（中文版本）
      let emitentInfo = null;
      if (emissionsResponse?.items?.[0]?.emitent_id) {
        try {
          const emitentResponse = await cbondsAPI.getEmitents(emissionsResponse.items[0].emitent_id, 'cht');
          if (emitentResponse?.items?.[0]) {
            emitentInfo = emitentResponse.items[0];
            console.log('發行人信息（中文）:', emitentInfo);
            console.log('發行人信息字段:', Object.keys(emitentInfo));
            console.log('profile_zh:', emitentInfo.profile_zh);
            console.log('profile_eng:', emitentInfo.profile_eng);
          }
        } catch (error) {
          console.warn('獲取發行人信息失敗:', error);
        }
      }

      // 🚀 步驟 4: 處理其他 API 回應（可選）
      console.log('交易數據 API 回應:', tradingsResponse);
      const tradingData = tradingsResponse.status === 'fulfilled' ? 
        processTradingData(tradingsResponse.value) : [];
      console.log('處理後的交易數據:', tradingData);
      
      const paymentFlows = flowsResponse.status === 'fulfilled' ? 
        processPaymentFlows(flowsResponse.value) : [];
      
      const defaultRisk = defaultsResponse.status === 'fulfilled' ? 
        processDefaultRisk(defaultsResponse.value) : null;
      
      const optionData = optionsResponse.status === 'fulfilled' ? 
        processOptionData(optionsResponse.value) : null;
      
      const guarantors = guarantorsResponse.status === 'fulfilled' ? 
        processGuarantorData(guarantorsResponse.value) : [];

      // 創建完整的擴展債券資料
      console.log('創建擴展債券前的數據:', {
        baseBond: { bidPrice: baseBond.bidPrice, askPrice: baseBond.askPrice, yieldToMaturity: baseBond.yieldToMaturity },
        tradingDataLength: tradingData.length,
        tradingData: tradingData
      });
      
      const extendedBond = createExtendedBond(
        baseBond,
        tradingData,
        paymentFlows,
        defaultRisk,
        optionData,
        guarantors,
        emitentInfo
      );
      
      console.log('創建擴展債券後的數據:', {
        bidPrice: extendedBond.bidPrice,
        askPrice: extendedBond.askPrice,
        yieldToMaturity: extendedBond.yieldToMaturity
      });

      // 🚀 更新為完整資料並結束 loading
      console.log('✅ 步驟 4: 更新為完整資料...');
      setState(prev => ({ 
        ...prev, 
        extendedBond,
        loading: false, // 所有 API 調用完成後才結束 loading
        error: null
      }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '查詢失敗，請檢查網路連線或稍後再試';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMsg,
        bond: null,
        extendedBond: null
      }));
      throw error; // Re-throw so caller knows it failed
    }
  };

  const refreshBondData = async (isin: string) => {
    // 重新整理資料，只更新非發行資料
    if (!state.extendedBond) return;

    try {
      const [tradingsResponse, flowsResponse, defaultsResponse, optionsResponse, guarantorsResponse] = await Promise.allSettled([
        cbondsAPI.getTradingsNew(isin),
        cbondsAPI.getFlowNew(isin),
        cbondsAPI.getEmissionDefault(isin),
        cbondsAPI.getOffert(isin),
        cbondsAPI.getEmissionGuarantors(isin)
      ]);

      const tradingData = tradingsResponse.status === 'fulfilled' ? 
        processTradingData(tradingsResponse.value) : state.extendedBond.tradingData || [];
      
      const paymentFlows = flowsResponse.status === 'fulfilled' ? 
        processPaymentFlows(flowsResponse.value) : state.extendedBond.paymentFlows || [];
      
      const defaultRisk = defaultsResponse.status === 'fulfilled' ? 
        processDefaultRisk(defaultsResponse.value) : state.extendedBond.defaultRisk;
      
      const optionData = optionsResponse.status === 'fulfilled' ? 
        processOptionData(optionsResponse.value) : state.extendedBond.optionData;
      
      const guarantors = guarantorsResponse.status === 'fulfilled' ? 
        processGuarantorData(guarantorsResponse.value) : state.extendedBond.guarantors || [];

      // 更新擴展債券資料
      const updatedExtendedBond = createExtendedBond(
        state.bond!,
        tradingData,
        paymentFlows,
        defaultRisk,
        optionData,
        guarantors
      );

      setState(prev => ({ 
        ...prev, 
        extendedBond: updatedExtendedBond
      }));
    } catch (error) {
      console.error('重新整理債券資料失敗:', error);
    }
  };

  const clearResults = () => {
    setState({
      bond: null,
      extendedBond: null,
      loading: false,
      error: null,
      isin: ''
    });
  };

  const setISIN = (isin: string) => {
    setState(prev => ({ ...prev, isin }));
  };

  return (
    <BondSearchContext.Provider 
      value={{
        ...state,
        searchByISIN,
        clearResults,
        setISIN,
        refreshBondData
      }}
    >
      {children}
    </BondSearchContext.Provider>
  );
};