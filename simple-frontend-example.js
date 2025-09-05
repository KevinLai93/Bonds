// 簡化的前端帳號分類使用示例
// 根據帳號類型顯示不同的介面

class SimpleAccountManager {
  constructor() {
    this.accountType = null;
    this.user = null;
  }

  // 登入並獲取帳號分類
  async login(username, password) {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      
      if (data.success) {
        this.user = data.user;
        this.accountType = data.accountType;
        this.applyAccountType();
        return data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  // 從Profile獲取帳號分類
  async getProfile() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        this.user = data.user;
        this.accountType = data.accountType;
        this.applyAccountType();
        return data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Failed to get profile:', error);
      throw error;
    }
  }

  // 根據帳號類型應用不同的介面
  applyAccountType() {
    if (!this.accountType) return;

    console.log(`帳號類型: ${this.accountType.type}`);
    console.log(`顯示名稱: ${this.accountType.displayName}`);
    console.log(`分類: ${this.accountType.category}`);

    // 根據分類顯示不同的介面
    switch (this.accountType.category) {
      case 'management':
        this.showManagementInterface();
        break;
      case 'analysis':
        this.showAnalysisInterface();
        break;
      case 'investment':
        this.showInvestmentInterface();
        break;
      case 'automation':
        this.showAutomationInterface();
        break;
      case 'basic':
      default:
        this.showBasicInterface();
        break;
    }
  }

  // 管理介面
  showManagementInterface() {
    console.log('顯示管理介面');
    document.body.className = 'management-theme';
    document.title = '系統管理 - Financial Data API';
    
    // 顯示管理功能
    this.showElement('user-management', true);
    this.showElement('system-settings', true);
    this.showElement('audit-logs', true);
    this.showElement('bulk-operations', true);
  }

  // 分析介面
  showAnalysisInterface() {
    console.log('顯示分析介面');
    document.body.className = 'analysis-theme';
    document.title = '財務分析 - Financial Data API';
    
    // 顯示分析功能
    this.showElement('analytics-dashboard', true);
    this.showElement('custom-reports', true);
    this.showElement('portfolio-analysis', true);
    this.showElement('forecast-tools', true);
  }

  // 投資介面
  showInvestmentInterface() {
    console.log('顯示投資介面');
    document.body.className = 'investment-theme';
    document.title = '信託投資 - Financial Data API';
    
    // 顯示投資功能
    this.showElement('investment-dashboard', true);
    this.showElement('portfolio-management', true);
    this.showElement('risk-assessment', true);
    this.showElement('compliance-check', true);
  }

  // 自動化介面
  showAutomationInterface() {
    console.log('顯示自動化介面');
    document.body.className = 'automation-theme';
    document.title = 'UBot自動化 - Financial Data API';
    
    // 顯示自動化功能
    this.showElement('bot-controls', true);
    this.showElement('automation-scripts', true);
    this.showElement('scheduled-tasks', true);
    this.showElement('api-monitoring', true);
  }

  // 基本介面
  showBasicInterface() {
    console.log('顯示基本介面');
    document.body.className = 'basic-theme';
    document.title = 'Financial Data API';
    
    // 只顯示基本功能
    this.showElement('basic-search', true);
    this.showElement('favorites', true);
    this.showElement('basic-reports', true);
  }

  // 顯示/隱藏元素
  showElement(elementId, show) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = show ? 'block' : 'none';
    }
  }

  // 檢查是否為特定帳號類型
  isAccountType(type) {
    return this.accountType && this.accountType.type === type;
  }

  // 檢查是否為特定分類
  isCategory(category) {
    return this.accountType && this.accountType.category === category;
  }
}

// 使用示例
const accountManager = new SimpleAccountManager();

// 測試不同帳號類型
async function testAccountTypes() {
  const testAccounts = [
    { username: 'admin', password: 'admin123' },
    { username: 'analyst', password: 'analyst123' },
    { username: 'entrust001', password: '2tTokhjidE' },
    { username: 'ubot001', password: 'ubot123456' },
    { username: 'user1', password: 'user123' }
  ];

  for (const account of testAccounts) {
    console.log(`\n=== 測試帳號: ${account.username} ===`);
    
    try {
      const result = await accountManager.login(account.username, account.password);
      console.log('登入成功:', result.accountType);
      
      // 檢查帳號類型
      if (accountManager.isAccountType('admin')) {
        console.log('✅ 這是管理員帳號');
      }
      if (accountManager.isCategory('investment')) {
        console.log('✅ 這是投資相關帳號');
      }
      if (accountManager.isCategory('automation')) {
        console.log('✅ 這是自動化帳號');
      }
      
    } catch (error) {
      console.error('登入失敗:', error.message);
    }
  }
}

// 前端使用方式
function frontendUsage() {
  console.log('\n=== 前端使用方式 ===');
  
  // 1. 登入後檢查帳號類型
  if (accountManager.isAccountType('admin')) {
    // 顯示管理功能
    console.log('顯示管理功能');
  }
  
  if (accountManager.isCategory('investment')) {
    // 顯示投資相關功能
    console.log('顯示投資功能');
  }
  
  if (accountManager.isCategory('automation')) {
    // 顯示自動化功能
    console.log('顯示自動化功能');
  }
  
  // 2. 根據分類設置不同的CSS類別
  document.body.className = `${accountManager.accountType.category}-theme`;
  
  // 3. 根據類型顯示不同的導航選單
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    const category = item.dataset.category;
    if (category && category !== accountManager.accountType.category) {
      item.style.display = 'none';
    }
  });
}

// 導出模組
export { SimpleAccountManager, testAccountTypes, frontendUsage };
