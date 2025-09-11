# 前手息計算邏輯更新

## 概述

更新了前手息的計算邏輯，讓它基於最小承作面額來計算，而不是固定的10000面額。這樣可以更準確地反映實際的交易成本。

## 主要修改

### 1. 債券基本資訊的前手息計算

**修改位置**: `src/contexts/BondSearchContext.tsx`

**變更內容**:
- 修改 `computeACI` 函數，接受 `minDenomination` 參數
- 使用最小承作面額作為計算基礎，而不是固定的 `eurobonds_nominal`
- 在 `mapEmissionToBond` 函數中傳入最小承作面額

```typescript
function computeACI(emission: any, schedule: any, minDenomination?: number): number {
  // 使用最小承作面額作為計算基礎，如果沒有提供則使用預設的10000
  const baseAmount = minDenomination || 10000;
  
  // Accrued interest = (days elapsed / days in period) × (base amount × annual rate / frequency)
  const periodicCouponAmount = (baseAmount * couponRate / 100) / periodsPerYear;
  const accruedInterest = (days360 / daysInPeriod) * periodicCouponAmount;
  
  return Math.round(accruedInterest * 100) / 100;
}
```

### 2. 圖卡編輯器的前手息重新計算

**修改位置**: `src/pages/CardEditor.tsx`

**新增功能**:
- 添加 `recalculateAccruedInterest` 函數，用於重新計算前手息
- 當最小承作面額改變時，自動重新計算前手息
- 更新前手息標籤文字為「前手息（每一最小承作面額）」

```typescript
// 重新計算前手息（基於最小承作面額）
const recalculateAccruedInterest = useCallback((minAmount: number, couponRate: number, frequency: number) => {
  if (couponRate === 0 || minAmount === 0) return 0;
  
  const periodsPerYear = frequency;
  const accruedInterest = (minAmount * couponRate / 100) / periodsPerYear;
  
  return Math.round(accruedInterest * 100) / 100;
}, []);
```

### 3. 價格與殖利率區塊的前手息計算

**修改內容**:
- 更新前手息計算公式，使用最小承作面額而不是固定的10000
- 當交易金額或數量改變時，基於最小承作面額計算前手息

```typescript
// 計算前手息：基於最小承作面額計算
const minAmount = parseFloat(prev.minAmount) || 10000;
const accruedInterestPerMinAmount = parseFloat(prev.accruedInterest) || 0;
const accruedInterest = (parseFloat(transactionAmount) / minAmount * accruedInterestPerMinAmount).toFixed(2);
```

## 計算邏輯

### 原始計算方式
```
前手息 = (交易金額 / 10000) × 前手息（每一萬面額）
```

### 新的計算方式
```
前手息 = (交易金額 / 最小承作面額) × 前手息（每一最小承作面額）
```

## 觸發條件

### 1. 當最小承作面額改變時
- 自動重新計算前手息（每一最小承作面額）
- 重新計算總交割金額
- 更新所有相關的計算結果

### 2. 當交易金額或數量改變時
- 基於當前的最小承作面額計算前手息
- 更新總交割金額

### 3. 當票面利率或付息頻率改變時
- 重新計算前手息（每一最小承作面額）

## 支援的付息頻率

- **每年**: 1次
- **每半年**: 2次
- **每季**: 4次
- **每月**: 12次
- **預設**: 2次（每半年）

## 使用方式

### 自動計算
系統會自動根據最小承作面額計算前手息，無需手動操作。

### 手動調整
用戶可以手動編輯「前手息（每一最小承作面額）」欄位，系統會自動更新相關計算。

## 注意事項

1. **向後相容**: 如果沒有最小承作面額資料，系統會使用預設的10000作為計算基礎
2. **精度控制**: 所有計算結果都會四捨五入到小數點後2位
3. **實時更新**: 當任何相關欄位改變時，前手息會立即重新計算
4. **驗證機制**: 系統會驗證輸入值的有效性，避免無效計算

## 測試建議

1. **基本功能**: 測試最小承作面額改變時前手息是否正確重新計算
2. **交易計算**: 測試交易金額和數量改變時前手息計算是否正確
3. **邊界條件**: 測試極值情況下的計算結果
4. **數據一致性**: 確保所有相關欄位的計算結果保持一致

## 文件結構

```
src/
├── contexts/
│   └── BondSearchContext.tsx    # 債券資料處理和前手息計算
└── pages/
    └── CardEditor.tsx           # 圖卡編輯器和前手息重新計算
```




