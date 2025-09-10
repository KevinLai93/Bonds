/**
 * YTM (Yield to Maturity) 計算工具
 * 使用牛頓-拉夫遜法計算債券的到期殖利率
 */

export interface YTMCalculationParams {
  price: number;           // 債券現價
  faceValue: number;       // 面值
  couponRate: number;      // 票面利率 (百分比)
  yearsToMaturity: number; // 到期年數
  paymentFrequency: number; // 付息頻率 (每年幾次)
  nextCouponDate?: string; // 下次付息日
  issueDate?: string;      // 發行日
}

/**
 * 計算下次付息日到今天的天數
 */
function getDaysToNextCoupon(nextCouponDate: string, issueDate: string): number {
  const today = new Date();
  const nextCoupon = new Date(nextCouponDate);
  const issue = new Date(issueDate);
  
  // 如果下次付息日已過，計算到下一個付息日
  if (nextCoupon <= today) {
    const daysInPeriod = 365 / 2; // 假設半年付息
    return daysInPeriod - (today.getTime() - nextCoupon.getTime()) / (1000 * 60 * 60 * 24);
  }
  
  return (nextCoupon.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
}

/**
 * 計算債券現金流的現值
 */
function calculatePresentValue(
  ytm: number,
  faceValue: number,
  couponRate: number,
  yearsToMaturity: number,
  paymentFrequency: number,
  daysToNextCoupon: number = 0
): number {
  const periodsPerYear = paymentFrequency;
  const totalPeriods = Math.ceil(yearsToMaturity * periodsPerYear);
  const couponPayment = (faceValue * couponRate / 100) / periodsPerYear;
  
  let presentValue = 0;
  
  // 計算票息現值
  for (let i = 1; i <= totalPeriods; i++) {
    const periodTime = (i - 1) + (daysToNextCoupon / (365 / periodsPerYear));
    presentValue += couponPayment / Math.pow(1 + ytm / periodsPerYear, periodTime);
  }
  
  // 計算面值現值
  const maturityTime = yearsToMaturity + (daysToNextCoupon / 365);
  presentValue += faceValue / Math.pow(1 + ytm, maturityTime);
  
  return presentValue;
}

/**
 * 計算現金流現值對 YTM 的導數
 */
function calculateDerivative(
  ytm: number,
  faceValue: number,
  couponRate: number,
  yearsToMaturity: number,
  paymentFrequency: number,
  daysToNextCoupon: number = 0
): number {
  const periodsPerYear = paymentFrequency;
  const totalPeriods = Math.ceil(yearsToMaturity * periodsPerYear);
  const couponPayment = (faceValue * couponRate / 100) / periodsPerYear;
  
  let derivative = 0;
  
  // 計算票息導數
  for (let i = 1; i <= totalPeriods; i++) {
    const periodTime = (i - 1) + (daysToNextCoupon / (365 / periodsPerYear));
    derivative -= (periodTime * couponPayment) / (periodsPerYear * Math.pow(1 + ytm / periodsPerYear, periodTime + 1));
  }
  
  // 計算面值導數
  const maturityTime = yearsToMaturity + (daysToNextCoupon / 365);
  derivative -= (maturityTime * faceValue) / Math.pow(1 + ytm, maturityTime + 1);
  
  return derivative;
}

/**
 * 使用牛頓-拉夫遜法計算 YTM
 */
export function calculateYTM(params: YTMCalculationParams): number {
  const {
    price,
    faceValue,
    couponRate,
    yearsToMaturity,
    paymentFrequency,
    nextCouponDate,
    issueDate
  } = params;
  
  // 參數驗證
  if (price <= 0 || faceValue <= 0 || yearsToMaturity <= 0 || paymentFrequency <= 0) {
    return 0;
  }
  
  // 計算天數到下次付息
  let daysToNextCoupon = 0;
  if (nextCouponDate && issueDate) {
    daysToNextCoupon = getDaysToNextCoupon(nextCouponDate, issueDate);
  }
  
  // 初始猜測值 (使用近似公式)
  let ytm = (couponRate + (faceValue - price) / yearsToMaturity) / ((faceValue + price) / 2);
  ytm = Math.max(0.001, Math.min(ytm, 0.5)); // 限制在合理範圍內
  
  // 牛頓-拉夫遜迭代
  const maxIterations = 100;
  const tolerance = 1e-6;
  
  for (let i = 0; i < maxIterations; i++) {
    const presentValue = calculatePresentValue(ytm, faceValue, couponRate, yearsToMaturity, paymentFrequency, daysToNextCoupon);
    const derivative = calculateDerivative(ytm, faceValue, couponRate, yearsToMaturity, paymentFrequency, daysToNextCoupon);
    
    const error = presentValue - price;
    
    if (Math.abs(error) < tolerance) {
      break;
    }
    
    if (Math.abs(derivative) < 1e-10) {
      // 導數太小，使用二分法
      ytm = (ytm + 0.1) / 2;
    } else {
      ytm = ytm - error / derivative;
    }
    
    // 限制在合理範圍內
    ytm = Math.max(0.001, Math.min(ytm, 0.5));
  }
  
  // 轉換為百分比
  return ytm * 100;
}

/**
 * 簡化版 YTM 計算（用於快速估算）
 */
export function calculateYTMSimple(params: YTMCalculationParams): number {
  const {
    price,
    faceValue,
    couponRate,
    yearsToMaturity
  } = params;
  
  if (price <= 0 || faceValue <= 0 || yearsToMaturity <= 0) {
    return 0;
  }
  
  // 使用近似公式
  const annualCoupon = faceValue * couponRate / 100;
  const ytm = (annualCoupon + (faceValue - price) / yearsToMaturity) / ((faceValue + price) / 2);
  
  return Math.max(0, ytm * 100);
}

/**
 * 計算永續債券的 YTM
 */
export function calculatePerpetualYTM(price: number, couponRate: number): number {
  if (price <= 0) return 0;
  
  // 永續債券 YTM = 年票息 / 價格
  return couponRate / price * 100;
}
