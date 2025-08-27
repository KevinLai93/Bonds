import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Bond } from '@/types/bond';
import { getEmissions } from '@/services/cbonds';

interface BondSearchState {
  bond: Bond | null;
  loading: boolean;
  error: string | null;
  isin: string;
}

interface BondSearchContextType extends BondSearchState {
  searchByISIN: (isin: string) => Promise<void>;
  clearResults: () => void;
  setISIN: (isin: string) => void;
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

function computeTenorYears(maturityDate: string): number {
  const maturity = new Date(maturityDate);
  const now = new Date();
  const diffTime = maturity.getTime() - now.getTime();
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
  return Math.max(0, parseFloat(diffYears.toFixed(1)));
}

function computeSchedule(emission: any) {
  const today = new Date();
  const maturity = new Date(emission.maturity_date);
  const firstCouponEnd = new Date(emission.first_coupon_end || emission.settlement_date);
  
  // Get coupon frequency (1=annual, 2=semi-annual, 4=quarterly, 12=monthly)
  const frequency = parseInt(emission.cupon_period) || 2;
  const monthsInterval = 12 / frequency; // Convert frequency to months interval
  
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
  
  return {
    previousCouponDate: previousCouponDate?.toISOString().split('T')[0] || '',
    nextCouponDate: nextCouponDate?.toISOString().split('T')[0] || ''
  };
}

function computeACI(emission: any, schedule: any): number {
  // 30/360 US rule accrued interest calculation
  if (!schedule.previousCouponDate) return 0;
  
  const couponRate = parseFloat(emission.emission_coupon_rate || emission.curr_coupon_rate || '0');
  const nominal = parseFloat(emission.eurobonds_nominal || '0');
  const frequency = parseInt(emission.cupon_period) || 2;
  
  if (couponRate === 0 || nominal === 0) return 0;
  
  const today = new Date();
  const prevCoupon = new Date(schedule.previousCouponDate);
  
  // 30/360 US rule day count
  const days360 = calculateDays360US(prevCoupon, today);
  const periodsPerYear = frequency;
  const daysInPeriod = 360 / periodsPerYear;
  
  // Accrued interest = (days elapsed / days in period) × (nominal × annual rate / frequency)
  const periodicCouponAmount = (nominal * couponRate / 100) / periodsPerYear;
  const accruedInterest = (days360 / daysInPeriod) * periodicCouponAmount;
  
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
  
  return 360 * (y2 - y1) + 30 * (m2 - m1) + (d2 - d1);
}

function mapEmissionToBond(emission: any): Bond {
  const schedule = computeSchedule(emission);
  const accruedInterest = computeACI(emission, schedule);
  const tenorYears = computeTenorYears(emission.maturity_date);
  const seniorityMapping = mapSeniority(emission.bond_rank_name_eng || emission.bond_rank_name || emission.bond_rank);
  
  return {
    id: emission.isin_code || '1',
    isin: emission.isin_code || '',
    name: emission.document_eng || emission.bbgid_ticker || '',
    issuer: emission.emitent_full_name_eng || emission.emitent_name_eng || '',
    industry: '', // Not provided by API
    currency: emission.currency_name as any || 'USD',
    investorType: ['一般', '專業', '機構'],
    country: emission.emitent_country_name_eng || '',
    remainingYears: tenorYears,
    issueDate: emission.settlement_date || '',
    maturityDate: emission.maturity_date || '',
    maturityType: '到期償還',
    couponRate: parseFloat(emission.emission_coupon_rate || emission.curr_coupon_rate || '0'),
    couponType: emission.coupon_type_name_eng === 'Fixed' ? '固定' : 
                 emission.coupon_type_name_eng === 'Floating' ? '浮動' : '其他',
    paymentFrequency: couponFreqText(emission.cupon_period) as any,
    previousCouponDate: schedule.previousCouponDate,
    nextCouponDate: schedule.nextCouponDate,
    accruedInterest,
    bidPrice: 0, // Fixed as null - display "—"
    askPrice: 0, // Fixed as null - display "—"
    yieldToMaturity: 0, // Fixed as null - display "—"
    spRating: '—', // Fixed as null - display "—"
    moodyRating: '—', // Fixed as null - display "—"
    fitchRating: '—', // Fixed as null - display "—"
    minDenomination: parseFloat(emission.integral_multiple || '10000'),
    minIncrement: parseFloat(emission.integral_multiple || '1000'),
    outstandingAmount: parseFloat(emission.outstanding_volume || emission.remaining_outstand_amount || '0'),
    seniority: seniorityMapping.seniority_text,
    seniority_text: seniorityMapping.seniority_text,
    seniority_raw: seniorityMapping.seniority_raw,
    riskNotes: '',
    defaultProbability1Y: 0,
    tlacMrel: false,
    parentCompanyCode: '',
    issuerDescription: '',
    issuerControl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export const BondSearchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<BondSearchState>({
    bond: null,
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
      const response = await getEmissions(isin);
      
      if (!response.items || response.items.length === 0) {
        const errorMsg = '查無此 ISIN 代碼的債券資料';
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: errorMsg,
          bond: null
        }));
        throw new Error(errorMsg);
      }

      const emission = response.items[0];
      const bond = mapEmissionToBond(emission);

      setState(prev => ({ 
        ...prev, 
        loading: false, 
        bond,
        error: null
      }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '查詢失敗，請檢查網路連線或稍後再試';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMsg
      }));
      throw error; // Re-throw so caller knows it failed
    }
  };

  const clearResults = () => {
    setState({
      bond: null,
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
        setISIN
      }}
    >
      {children}
    </BondSearchContext.Provider>
  );
};