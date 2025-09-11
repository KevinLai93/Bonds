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
 * 使用Excel YIELD規則計算 YTM
 * 現在使用與Excel YIELD相同的計算方法
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
  
  // 計算結算日和到期日
  const today = new Date();
  const settlementDate = today;
  const maturityDate = new Date(today.getTime() + yearsToMaturity * 365 * 24 * 60 * 60 * 1000);
  
  // 使用Excel YIELD計算
  // Excel YIELD公式固定使用100作為redemption
  // 價格需要轉換為面值100的百分比價格
  const excelParams: ExcelYieldParams = {
    settlementDate: settlementDate,
    maturityDate: maturityDate,
    rate: couponRate / 100, // 轉換為小數
    pr: price, // 價格已經是面值100的百分比價格
    redemption: 100, // Excel YIELD固定使用100
    frequency: paymentFrequency,
    basis: 0 // 30/360日計法
  };
  
  return calculateExcelYield(excelParams);
}

/**
 * 簡化版 YTM 計算（用於快速估算）
 * 現在也使用Excel YIELD的簡化版本
 */
export function calculateYTMSimple(params: YTMCalculationParams): number {
  const {
    price,
    faceValue,
    couponRate,
    yearsToMaturity,
    paymentFrequency
  } = params;
  
  if (price <= 0 || faceValue <= 0 || yearsToMaturity <= 0) {
    return 0;
  }
  
  // 計算結算日和到期日
  const today = new Date();
  const settlementDate = today;
  const maturityDate = new Date(today.getTime() + yearsToMaturity * 365 * 24 * 60 * 60 * 1000);
  
  // 使用Excel YIELD簡化版計算
  // Excel YIELD公式固定使用100作為redemption
  return calculateExcelYieldSimple(
    settlementDate,
    maturityDate,
    couponRate / 100, // 轉換為小數
    price,
    100, // Excel YIELD固定使用100
    paymentFrequency || 2
  );
}

/**
 * 計算永續債券的 YTM
 */
export function calculatePerpetualYTM(price: number, couponRate: number): number {
  if (price <= 0) return 0;
  
  // 永續債券 YTM = 年票息 / 價格
  return couponRate / price * 100;
}

/**
 * Excel YIELD 公式計算
 * 使用與Excel相同的計算方法
 */
export interface ExcelYieldParams {
  settlementDate: Date;     // 結算日（今天日期）
  maturityDate: Date;       // 到期日
  rate: number;             // 票面利率（年利率，小數形式）
  pr: number;               // 買進價格（面值100的價格）
  redemption: number;       // 到期還款（通常為100）
  frequency: number;        // 一年配息次數（2表示半年付息）
  basis?: number;           // 日計基礎（0=30/360, 1=實際/實際, 2=實際/360, 3=實際/365, 4=30/360歐洲）
}

/**
 * 添加月份到日期
 */
function addMonths(date: Date, months: number): Date {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
}

/**
 * 計算上一付息日
 */
function previousCouponDate(settlement: Date, maturity: Date, freq: number): Date {
  const step = 12 / freq;
  let d = new Date(maturity);
  
  while (d > settlement) {
    d = addMonths(d, -step);
  }
  return d;
}

/**
 * 計算下一付息日
 */
function nextCouponDate(settlement: Date, maturity: Date, freq: number): Date {
  const prev = previousCouponDate(settlement, maturity, freq);
  const step = 12 / freq;
  return addMonths(prev, step);
}

/**
 * 計算剩餘付息次數
 */
function countCoupons(settlement: Date, maturity: Date, freq: number): number {
  let n = 0;
  let d = nextCouponDate(settlement, maturity, freq);
  const step = 12 / freq;
  
  while (d <= maturity) {
    n++;
    d = addMonths(d, step);
  }
  return n;
}

/**
 * 計算兩個日期之間的天數（30/360日計法）
 */
function days360(startDate: Date, endDate: Date, method: 'US' | 'European' = 'US'): number {
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth() + 1;
  const startDay = startDate.getDate();
  
  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth() + 1;
  const endDay = endDate.getDate();
  
  if (method === 'US') {
    // US 30/360 方法
    let d1 = startDay;
    let d2 = endDay;
    let m1 = startMonth;
    let m2 = endMonth;
    let y1 = startYear;
    let y2 = endYear;
    
    // 如果d1是31，設為30
    if (d1 === 31) d1 = 30;
    
    // 如果d2是31且d1是30或31，設d2為30
    if (d2 === 31 && d1 >= 30) d2 = 30;
    
    return (y2 - y1) * 360 + (m2 - m1) * 30 + (d2 - d1);
  } else {
    // European 30/360 方法
    let d1 = startDay;
    let d2 = endDay;
    let m1 = startMonth;
    let m2 = endMonth;
    let y1 = startYear;
    let y2 = endYear;
    
    // 如果d1是31，設為30
    if (d1 === 31) d1 = 30;
    
    // 如果d2是31，設為30
    if (d2 === 31) d2 = 30;
    
    return (y2 - y1) * 360 + (m2 - m1) * 30 + (d2 - d1);
  }
}

/**
 * 計算應計利息（更精確的Excel YIELD實現）
 */
function calculateAccruedInterest(
  settlementDate: Date,
  maturityDate: Date,
  rate: number,
  redemption: number,
  frequency: number,
  basis: number = 0
): number {
  // 簡化處理：假設債券剛發行，沒有應計利息
  // 或者使用更精確的計算方法
  
  // 計算從發行日到結算日的天數
  const issueDate = new Date(settlementDate.getTime() - 365 * 24 * 60 * 60 * 1000); // 假設1年前發行
  const daysSinceIssue = Math.floor((settlementDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // 計算付息週期天數
  const daysInPeriod = 365 / frequency;
  
  // 計算應計利息
  if (basis === 0) { // 30/360
    const days360SinceIssue = days360(issueDate, settlementDate);
    const days360InPeriod = 360 / frequency;
    return (redemption * rate / frequency) * (days360SinceIssue % days360InPeriod) / days360InPeriod;
  } else {
    // 實際天數計算
    const accruedDays = daysSinceIssue % Math.floor(daysInPeriod);
    return (redemption * rate / frequency) * (accruedDays / daysInPeriod);
  }
}

/**
 * Excel YIELD 函數實現（最新精確版本）
 * 基於完整的Excel YIELD算法，支持多種日計法
 */
export function calculateExcelYield(params: ExcelYieldParams): number {
  const {
    settlementDate,
    maturityDate,
    rate,
    pr,
    redemption,
    frequency,
    basis = 0
  } = params;
  
  // 參數驗證
  if (pr <= 0 || rate < 0 || frequency <= 0) {
    return 0;
  }
  
  if (settlementDate >= maturityDate) {
    return 0;
  }
  
  if (![1, 2, 4].includes(frequency)) {
    return 0;
  }
  
  if (basis < 0 || basis > 4) {
    return 0;
  }
  
  // 日期處理
  const dSet = stripTime(settlementDate);
  const dMat = stripTime(maturityDate);
  
  // Day-count helpers
  function days_30_360_us(d1: Date, d2: Date): number {
    const d1d = d1.getDate() === 31 ? 30 : d1.getDate();
    const d2d = (d2.getDate() === 31 && (d1d === 30 || d1d === 31)) ? 30 : d2.getDate();
    return (d2.getFullYear() - d1.getFullYear()) * 360 +
           (d2.getMonth() - d1.getMonth()) * 30 + (d2d - d1d);
  }
  
  function days_30_360_eu(d1: Date, d2: Date): number {
    const d1d = d1.getDate() === 31 ? 30 : d1.getDate();
    const d2d = d2.getDate() === 31 ? 30 : d2.getDate();
    return (d2.getFullYear() - d1.getFullYear()) * 360 +
           (d2.getMonth() - d1.getMonth()) * 30 + (d2d - d1d);
  }
  
  function diffDays(d1: Date, d2: Date): number {
    const ms = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate()) -
               Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
    return Math.round(ms / 86400000);
  }
  
  function daycount(d1: Date, d2: Date, basis: number): [number, number] {
    switch (basis) {
      case 0: return [days_30_360_us(d1, d2), 360];          // US 30/360
      case 1: {                                              // Actual/Actual
        const days = diffDays(d1, d2);
        const hasFeb29 = crossesFeb29(d1, d2);
        return [days, hasFeb29 ? 366 : 365];
      }
      case 2: return [diffDays(d1, d2), 360];                // Actual/360
      case 3: return [diffDays(d1, d2), 365];                // Actual/365
      case 4: return [days_30_360_eu(d1, d2), 360];          // EU 30/360
      default: return [0, 360];
    }
  }
  
  function crossesFeb29(d1: Date, d2: Date): boolean {
    const y1 = d1.getFullYear(), y2 = d2.getFullYear();
    for (let y = y1; y <= y2; y++) {
      if (isLeap(y)) {
        const feb29 = new Date(Date.UTC(y, 1, 29));
        if (feb29 >= stripTime(d1) && feb29 < stripTime(d2)) return true;
      }
    }
    return false;
  }
  
  function isLeap(y: number): boolean { 
    return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0); 
  }
  
  function stripTime(d: Date): Date { 
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); 
  }
  
  // Date helpers - 修正的付息日期计算
  function addMonthsEOM(d: Date, months: number): Date {
    const result = new Date(d);
    result.setMonth(result.getMonth() + months);
    return result;
  }
  
  function previousCouponDate(settle: Date, mat: Date, f: number): Date {
    const step = 12 / f;
    let d = new Date(mat);
    while (d > settle) {
      d = addMonthsEOM(d, -step);
    }
    return d;
  }
  
  function nextCouponDate(settle: Date, mat: Date, f: number): Date {
    const prev = previousCouponDate(settle, mat, f);
    return addMonthsEOM(prev, 12 / f);
  }
  
  function countCoupons(settle: Date, mat: Date, f: number): number {
    const step = 12 / f;
    let n = 0;
    let d = nextCouponDate(settle, mat, f);
    while (d <= mat) { n++; d = addMonthsEOM(d, step); }
    return n;
  }
  
  // 主計算
  const C = redemption * rate / frequency;                  // 每期票息
  const prevCP = previousCouponDate(dSet, dMat, frequency);
  const nextCP = nextCouponDate(dSet, dMat, frequency);
  const [A]   = daycount(prevCP, dSet, basis);               // 應計天數
  const [DSC] = daycount(dSet, nextCP, basis);               // 結算→下一票息
  const [E]   = daycount(prevCP, nextCP, basis);             // 單一期天數
  
  if (E === 0) return 0;
  
  const N = countCoupons(dSet, dMat, frequency);             // 剩餘期數（含到期）
  const accrual = C * (A / E);                               // 應計利息（淨價需扣掉）
  
  function priceFromY(y: number): number {
    const per = 1 + y / frequency;
    const shift = DSC / E;                                   // 部份期
    let pv = 0;
    for (let k = 1; k <= N; k++) {
      pv += C / Math.pow(per, shift + (k - 1));
    }
    pv += redemption / Math.pow(per, shift + (N - 1));
    const dirty = pv;
    return dirty - accrual;                                  // 轉回淨價
  }
  
  function f(y: number): number { return priceFromY(y) - pr; }
  function deriv(y: number): number {                        // 數值微分
    const h = Math.max(1e-8, Math.abs(y) * 1e-6);
    return (f(y + h) - f(y - h)) / (2 * h);
  }
  
  // 先牛頓法，再二分法保底
  let y = 0.04;                                              // 初值
  for (let i = 0; i < 100; i++) {
    const fy = f(y);
    if (Math.abs(fy) < 1e-12) return y * 100;
    const d = deriv(y);
    if (!isFinite(d) || d === 0) break;
    const yNew = y - fy / d;
    if (!(yNew > -0.999 && yNew < 10)) break;
    y = yNew;
  }
  
  // 二分夾擠
  let lo = -0.999, hi = 10.0, flo = f(lo), fhi = f(hi);
  if (flo * fhi > 0) {
    const hi2 = 15.0; fhi = f(hi2);
    if (flo * fhi <= 0) hi = hi2; 
    else { 
      const hi3 = 50.0; fhi = f(hi3); 
      if (flo * fhi <= 0) hi = hi3; 
      else return 0; // 無法找到根的夾擠區間
    }
  }
  
  for (let i = 0; i < 300; i++) {
    const mid = (lo + hi) / 2;
    const fmid = f(mid);
    if (Math.abs(fmid) < 1e-12) return mid * 100;
    if (flo * fmid <= 0) { hi = mid; fhi = fmid; } 
    else { lo = mid; flo = fmid; }
  }
  
  return ((lo + hi) / 2) * 100;                              // 轉換為百分比
}

/**
 * 簡化版Excel YIELD計算（用於快速估算）
 */
export function calculateExcelYieldSimple(
  settlementDate: Date,
  maturityDate: Date,
  rate: number,
  pr: number,
  redemption: number = 100,
  frequency: number = 2
): number {
  if (pr <= 0 || rate < 0 || frequency <= 0) {
    return 0;
  }
  
  // 計算剩餘年數
  const yearsToMaturity = (maturityDate.getTime() - settlementDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
  
  // 使用近似公式
  const annualCoupon = redemption * rate;
  const ytm = (annualCoupon + (redemption - pr) / yearsToMaturity) / ((redemption + pr) / 2);
  
  return Math.max(0, ytm * 100);
}

/**
 * 比較YTM計算與Excel YIELD的差異
 */
export function compareYTMvsExcelYield(
  settlementDate: Date,
  maturityDate: Date,
  couponRate: number, // 年利率百分比
  price: number,      // 買進價格
  faceValue: number = 100,
  frequency: number = 2
): {
  ytm: number;
  excelYield: number;
  difference: number;
  differencePercent: number;
} {
  // 計算剩餘年數
  const yearsToMaturity = (maturityDate.getTime() - settlementDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
  
  // 使用現有的YTM計算
  const ytmParams: YTMCalculationParams = {
    price: price,
    faceValue: faceValue,
    couponRate: couponRate,
    yearsToMaturity: yearsToMaturity,
    paymentFrequency: frequency,
    nextCouponDate: maturityDate.toISOString().split('T')[0], // 簡化處理
    issueDate: settlementDate.toISOString().split('T')[0]
  };
  
  const ytm = calculateYTM(ytmParams);
  
  // 使用Excel YIELD計算
  const excelParams: ExcelYieldParams = {
    settlementDate: settlementDate,
    maturityDate: maturityDate,
    rate: couponRate / 100, // 轉換為小數
    pr: price,
    redemption: faceValue,
    frequency: frequency,
    basis: 0 // 30/360日計法
  };
  
  const excelYield = calculateExcelYield(excelParams);
  
  const difference = excelYield - ytm;
  const differencePercent = ytm > 0 ? (difference / ytm) * 100 : 0;
  
  return {
    ytm,
    excelYield,
    difference,
    differencePercent
  };
}

/**
 * 測試函數：比較不同參數下的計算差異
 */
export function testYTMvsExcelYieldComparison() {
  const today = new Date();
  const testCases = [
    {
      name: "短期債券 (1年)",
      settlementDate: today,
      maturityDate: new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000),
      couponRate: 3.0, // 3%
      price: 98.5,
      faceValue: 100,
      frequency: 2
    },
    {
      name: "中期債券 (5年)",
      settlementDate: today,
      maturityDate: new Date(today.getTime() + 5 * 365 * 24 * 60 * 60 * 1000),
      couponRate: 4.5, // 4.5%
      price: 102.0,
      faceValue: 100,
      frequency: 2
    },
    {
      name: "長期債券 (10年)",
      settlementDate: today,
      maturityDate: new Date(today.getTime() + 10 * 365 * 24 * 60 * 60 * 1000),
      couponRate: 5.0, // 5%
      price: 95.0,
      faceValue: 100,
      frequency: 2
    },
    {
      name: "高折價債券",
      settlementDate: today,
      maturityDate: new Date(today.getTime() + 3 * 365 * 24 * 60 * 60 * 1000),
      couponRate: 2.0, // 2%
      price: 85.0,
      faceValue: 100,
      frequency: 2
    },
    {
      name: "高溢價債券",
      settlementDate: today,
      maturityDate: new Date(today.getTime() + 7 * 365 * 24 * 60 * 60 * 1000),
      couponRate: 6.0, // 6%
      price: 110.0,
      faceValue: 100,
      frequency: 2
    }
  ];
  
  console.log("=== YTM vs Excel YIELD 比較測試 ===");
  console.log("格式: [測試案例] YTM | Excel YIELD | 差異 | 差異百分比");
  console.log("=" * 60);
  
  testCases.forEach(testCase => {
    const result = compareYTMvsExcelYield(
      testCase.settlementDate,
      testCase.maturityDate,
      testCase.couponRate,
      testCase.price,
      testCase.faceValue,
      testCase.frequency
    );
    
    console.log(`[${testCase.name}]`);
    console.log(`  YTM: ${result.ytm.toFixed(4)}%`);
    console.log(`  Excel YIELD: ${result.excelYield.toFixed(4)}%`);
    console.log(`  差異: ${result.difference.toFixed(4)}%`);
    console.log(`  差異百分比: ${result.differencePercent.toFixed(2)}%`);
    console.log("---");
  });
  
  return testCases.map(testCase => ({
    ...testCase,
    result: compareYTMvsExcelYield(
      testCase.settlementDate,
      testCase.maturityDate,
      testCase.couponRate,
      testCase.price,
      testCase.faceValue,
      testCase.frequency
    )
  }));
}

