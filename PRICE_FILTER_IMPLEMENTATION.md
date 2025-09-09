# 價格過濾功能實現

## 概述

為了解決交易資料中最新資料價格為0的問題，實現了智能價格過濾功能，確保系統總是使用最新一筆且不為0的BID和Ask價格。

## 實現的功能

### 1. 交易資料過濾 (`processTradingData`)

**過濾邏輯**：
- 先解析所有交易資料的價格欄位
- 過濾掉所有價格都為0的資料
- 按日期降序排序，確保最新資料在前面

```typescript
// 過濾條件：至少有一個價格不為0
const validItems = tradingResponse.items
  .map((item: any) => {
    const bidPrice = parseFloat(item.buying_quote || item.bid_price || '0');
    const askPrice = parseFloat(item.selling_quote || item.ask_price || '0');
    const lastPrice = parseFloat(item.last_price || '0');
    return { ...item, bidPrice, askPrice, lastPrice };
  })
  .filter((item: any) => {
    return item.bidPrice > 0 || item.askPrice > 0 || item.lastPrice > 0;
  })
  .sort((a: any, b: any) => {
    const dateA = new Date(a.date || a.trading_date || '');
    const dateB = new Date(b.date || b.trading_date || '');
    return dateB.getTime() - dateA.getTime();
  });
```

### 2. 最新有效價格獲取 (`getLatestValidPrices`)

**功能**：
- 從已排序的交易資料中尋找最新的有效價格
- 確保至少有一個價格不為0
- 返回完整的價格資訊

```typescript
function getLatestValidPrices(tradingData: TradingData[]): {
  bidPrice: number;
  askPrice: number;
  lastPrice: number;
  yieldToMaturity: number;
  tradingDate: string;
} | null {
  if (tradingData.length === 0) return null;
  
  for (const trading of tradingData) {
    if (trading.bidPrice > 0 || trading.askPrice > 0 || trading.lastPrice > 0) {
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
```

### 3. 債券價格更新 (`createExtendedBond`)

**更新邏輯**：
- 使用最新的有效價格資料更新債券資訊
- 如果沒有有效價格，則使用預設值
- 提供詳細的日誌記錄

```typescript
const latestValidPrices = getLatestValidPrices(tradingData);

if (latestValidPrices) {
  updatedBond = {
    ...baseBond,
    bidPrice: latestValidPrices.bidPrice,
    askPrice: latestValidPrices.askPrice,
    lastPrice: latestValidPrices.lastPrice,
    yieldToMaturity: latestValidPrices.yieldToMaturity
  };
}
```

## 支援的價格欄位

### CBonds API 原始欄位
- `buying_quote` → **BID 價格**
- `selling_quote` → **Ask 價格**
- `last_price` → 最後成交價
- `bid_price` → 備用 BID 價格欄位
- `ask_price` → 備用 Ask 價格欄位

### 過濾條件
- **BID 價格 > 0** 或
- **Ask 價格 > 0** 或
- **最後成交價 > 0**

只要滿足其中一個條件，該筆交易資料就會被保留。

## 測試功能

### 測試頁面
訪問 `http://localhost:8080/token-test` 並切換到「價格過濾測試」標籤。

### 測試功能
1. **價格過濾測試**：
   - 輸入 ISIN 代碼
   - 分析原始交易資料
   - 顯示過濾結果統計
   - 展示最新的有效價格

2. **完整搜尋測試**：
   - 模擬完整的債券搜尋流程
   - 測試價格過濾在實際應用中的效果
   - 顯示最終的價格資料

## 處理流程

### 1. 資料獲取
```
API 調用 → 原始交易資料 → 價格解析
```

### 2. 資料過濾
```
價格解析 → 過濾零價格 → 按日期排序
```

### 3. 價格選擇
```
排序後資料 → 尋找最新有效價格 → 更新債券資訊
```

### 4. 備用方案
```
如果沒有有效價格 → 使用預設值 → 記錄警告
```

## 日誌記錄

系統會記錄詳細的處理過程：

```typescript
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
```

## 優勢

1. **智能過濾**：自動過濾無效的價格資料
2. **時間優先**：確保使用最新的有效價格
3. **備用方案**：當沒有有效價格時使用預設值
4. **詳細記錄**：提供完整的處理過程日誌
5. **測試支援**：提供專門的測試工具驗證功能

## 使用方式

### 自動處理
價格過濾功能會自動在債券搜尋過程中執行，無需手動調用。

### 手動測試
1. 訪問測試頁面：`/token-test`
2. 切換到「價格過濾測試」標籤
3. 輸入要測試的 ISIN 代碼
4. 點擊「測試價格過濾」或「測試完整搜尋」

## 注意事項

- 過濾功能會保留所有有效的交易資料，不只是最新的
- 如果所有交易資料的價格都為0，會使用債券發行資料中的預設價格
- 系統會記錄詳細的處理過程，方便調試和監控
- 測試功能僅用於開發環境，生產環境應移除測試頁面

## 文件結構

```
src/
├── contexts/
│   └── BondSearchContext.tsx    # 主要實現文件
├── components/
│   └── PriceFilterTest.tsx      # 測試組件
└── pages/
    └── TokenTestPage.tsx        # 測試頁面
```

