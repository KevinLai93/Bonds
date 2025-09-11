// 寻找完美的票面利率，使YTM完全匹配Excel结果

function days360(startDate, endDate, method = 'US') {
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth() + 1;
  const startDay = startDate.getDate();
  
  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth() + 1;
  const endDay = endDate.getDate();
  
  if (method === 'US') {
    let d1 = startDay;
    let d2 = endDay;
    let m1 = startMonth;
    let m2 = endMonth;
    let y1 = startYear;
    let y2 = endYear;
    
    if (d1 === 31) d1 = 30;
    if (d2 === 31 && d1 >= 30) d2 = 30;
    
    return (y2 - y1) * 360 + (m2 - m1) * 30 + (d2 - d1);
  } else {
    let d1 = startDay;
    let d2 = endDay;
    let m1 = startMonth;
    let m2 = endMonth;
    let y1 = startYear;
    let y2 = endYear;
    
    if (d1 === 31) d1 = 30;
    if (d2 === 31) d2 = 30;
    
    return (y2 - y1) * 360 + (m2 - m1) * 30 + (d2 - d1);
  }
}

function calculateYTM(settlementDate, maturityDate, rate, pr, redemption, frequency) {
  if (pr <= 0 || rate < 0 || frequency <= 0) {
    return 0;
  }
  
  const daysToMaturity = days360(settlementDate, maturityDate, 'US');
  const yearsToMaturity = daysToMaturity / 360;
  const totalPeriods = Math.ceil(yearsToMaturity * frequency);
  
  let yieldRate = 0.1;
  const tolerance = 1e-15;
  const maxIterations = 1000;
  
  for (let i = 0; i < maxIterations; i++) {
    let presentValue = 0;
    const couponPayment = redemption * rate / frequency;
    
    for (let period = 1; period <= totalPeriods; period++) {
      const timeToPayment = period / frequency;
      presentValue += couponPayment / Math.pow(1 + yieldRate, timeToPayment);
    }
    
    presentValue += redemption / Math.pow(1 + yieldRate, yearsToMaturity);
    
    const error = presentValue - pr;
    
    if (Math.abs(error) < tolerance) {
      break;
    }
    
    let derivative = 0;
    for (let period = 1; period <= totalPeriods; period++) {
      const timeToPayment = period / frequency;
      derivative -= (timeToPayment * couponPayment) / Math.pow(1 + yieldRate, timeToPayment + 1);
    }
    derivative -= (yearsToMaturity * redemption) / Math.pow(1 + yieldRate, yearsToMaturity + 1);
    
    if (Math.abs(derivative) < 1e-15) {
      yieldRate = (yieldRate + 0.1) / 2;
    } else {
      yieldRate = yieldRate - error / derivative;
    }
    
    yieldRate = Math.max(0.0001, Math.min(yieldRate, 1.0));
  }
  
  return yieldRate * 100;
}

function findPerfectCouponRate(settlementDate, maturityDate, targetYTM, pr, redemption, frequency) {
  // 使用二分法寻找完美的票面利率
  let lowRate = 0.01; // 1%
  let highRate = 0.02; // 2%
  const tolerance = 1e-8;
  const maxIterations = 100;
  
  console.log("=== 二分法寻找完美票面利率 ===");
  console.log(`目标YTM: ${targetYTM}%`);
  console.log(`买进价格: ${pr}`);
  console.log(`面值: ${redemption}`);
  console.log(`付息频率: ${frequency}`);
  console.log("=".repeat(50));
  
  for (let i = 0; i < maxIterations; i++) {
    const midRate = (lowRate + highRate) / 2;
    
    // 计算当前票面利率对应的YTM
    const currentYTM = calculateYTM(settlementDate, maturityDate, midRate, pr, redemption, frequency);
    const difference = currentYTM - targetYTM;
    
    if (i < 10 || i % 10 === 0) {
      console.log(`迭代 ${i}: 票面利率=${(midRate * 100).toFixed(6)}%, YTM=${currentYTM.toFixed(6)}%, 差异=${difference.toFixed(8)}%`);
    }
    
    if (Math.abs(difference) < tolerance) {
      console.log(`\n收敛于第 ${i} 次迭代`);
      console.log(`完美票面利率: ${(midRate * 100).toFixed(6)}%`);
      console.log(`计算YTM: ${currentYTM.toFixed(6)}%`);
      console.log(`与目标差异: ${Math.abs(difference).toFixed(8)}%`);
      return {
        couponRate: midRate,
        ytm: currentYTM,
        difference: Math.abs(difference)
      };
    }
    
    if (difference > 0) {
      highRate = midRate;
    } else {
      lowRate = midRate;
    }
  }
  
  const finalRate = (lowRate + highRate) / 2;
  const finalYTM = calculateYTM(settlementDate, maturityDate, finalRate, pr, redemption, frequency);
  
  console.log(`\n未完全收敛，最终结果:`);
  console.log(`票面利率: ${(finalRate * 100).toFixed(6)}%`);
  console.log(`计算YTM: ${finalYTM.toFixed(6)}%`);
  console.log(`与目标差异: ${Math.abs(finalYTM - targetYTM).toFixed(8)}%`);
  
  return {
    couponRate: finalRate,
    ytm: finalYTM,
    difference: Math.abs(finalYTM - targetYTM)
  };
}

console.log("=== 寻找完美票面利率 ===");
console.log("目标：使YTM完全匹配Excel/彭博的3.79248678230%");
console.log("=".repeat(60));

const today = new Date();
const maturityDate = new Date(today.getTime() + 4.99 * 365 * 24 * 60 * 60 * 1000);

const result = findPerfectCouponRate(
  today,
  maturityDate,
  3.79248678230, // Excel/彭博的YTM
  88.64, // 买进价格
  100, // 面值
  2 // 半年付息
);

console.log("\n=== 最终结果 ===");
console.log(`建议的票面利率: ${(result.couponRate * 100).toFixed(6)}%`);
console.log(`当前显示: 1.25%`);
console.log(`差异: ${Math.abs(result.couponRate * 100 - 1.25).toFixed(6)}%`);

if (result.difference < 0.0001) {
  console.log("✅ 完美匹配！差异小于0.0001%");
} else if (result.difference < 0.001) {
  console.log("✅ 几乎完美！差异小于0.001%");
} else if (result.difference < 0.01) {
  console.log("⚠️ 接近完美，差异小于0.01%");
} else {
  console.log("❌ 需要进一步调整");
}

// 验证结果
console.log("\n=== 验证结果 ===");
const verificationYTM = calculateYTM(today, maturityDate, result.couponRate, 88.64, 100, 2);
console.log(`验证YTM: ${verificationYTM.toFixed(6)}%`);
console.log(`与目标差异: ${Math.abs(verificationYTM - 3.79248678230).toFixed(8)}%`);

// 反向验证：如果YTM是3.79248678230%，对应的价格
function calculatePriceFromYTM(settlementDate, maturityDate, rate, redemption, frequency, targetYTM) {
  const ytm = targetYTM / 100;
  const daysToMaturity = days360(settlementDate, maturityDate, 'US');
  const yearsToMaturity = daysToMaturity / 360;
  const totalPeriods = Math.ceil(yearsToMaturity * frequency);
  
  let presentValue = 0;
  const couponPayment = redemption * rate / frequency;
  
  for (let period = 1; period <= totalPeriods; period++) {
    const timeToPayment = period / frequency;
    presentValue += couponPayment / Math.pow(1 + ytm, timeToPayment);
  }
  
  presentValue += redemption / Math.pow(1 + ytm, yearsToMaturity);
  return presentValue;
}

const calculatedPrice = calculatePriceFromYTM(today, maturityDate, result.couponRate, 100, 2, 3.79248678230);
console.log(`\n反向验证：如果YTM是3.79248678230%，对应价格: ${calculatedPrice.toFixed(6)}`);
console.log(`与实际价格差异: ${Math.abs(calculatedPrice - 88.64).toFixed(6)}`);
