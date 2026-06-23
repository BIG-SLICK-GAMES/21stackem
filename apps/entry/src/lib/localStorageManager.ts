// Local Storage Manager for Purchase History and Transaction Logs
// This reduces Firebase usage by storing non-essential data locally

export interface PurchaseRecord {
  id: string;
  packageName: string;
  chipsAwarded: number;
  pricePaid: number;
  timestamp: string;
  source: 'shop' | 'bonus' | 'daily';
}

export interface TransactionRecord {
  id: string;
  type: 'win' | 'loss' | 'purchase' | 'bonus';
  amount: number;
  description: string;
  gameType?: string;
  timestamp: string;
  balanceAfter: number;
}

export interface LocalGameData {
  purchases: PurchaseRecord[];
  transactions: TransactionRecord[];
  totalPurchased: number;
  totalSpent: number;
  lastSync: string;
  // OPTIMIZED: Add user profile data that doesn't need Firebase
  userXP: number;
  userLevel: number;
  country: string | null;
  preferences: {
    notifications: boolean;
    sound: boolean;
    theme: string;
  };
}

const STORAGE_KEYS = {
  PURCHASES: 'gamehub_purchases',
  TRANSACTIONS: 'gamehub_transactions',
  GAME_DATA: 'gamehub_game_data',
  USER_PROFILE: 'gamehub_user_profile'
};

class LocalStorageManager {
  // Purchase History Management
  addPurchase(purchase: Omit<PurchaseRecord, 'id' | 'timestamp'>): PurchaseRecord {
    const newPurchase: PurchaseRecord = {
      ...purchase,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };

    const purchases = this.getPurchases();
    purchases.push(newPurchase);
    
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
    
    // Update totals
    this.updatePurchaseTotals();
    
    console.log('💾 Purchase saved locally:', newPurchase);
    return newPurchase;
  }

  getPurchases(): PurchaseRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PURCHASES);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading purchases from local storage:', error);
      return [];
    }
  }

  // Transaction Log Management
  addTransaction(transaction: Omit<TransactionRecord, 'id' | 'timestamp'>): TransactionRecord {
    const newTransaction: TransactionRecord = {
      ...transaction,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };

    const transactions = this.getTransactions();
    transactions.push(newTransaction);
    
    // Keep only last 1000 transactions to prevent storage bloat
    if (transactions.length > 1000) {
      transactions.splice(0, transactions.length - 1000);
    }
    
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    
    console.log('💾 Transaction saved locally:', newTransaction);
    return newTransaction;
  }

  getTransactions(limit?: number): TransactionRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      const transactions = stored ? JSON.parse(stored) : [];
      
      if (limit) {
        return transactions.slice(-limit).reverse(); // Get most recent
      }
      
      return transactions.reverse(); // Most recent first
    } catch (error) {
      console.error('Error loading transactions from local storage:', error);
      return [];
    }
  }

  // Game Data Management
  getGameData(): LocalGameData {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.GAME_DATA);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading game data from local storage:', error);
    }

    // Return default data
    return {
      purchases: [],
      transactions: [],
      totalPurchased: 0,
      totalSpent: 0,
      lastSync: new Date().toISOString()
      userXP: 0,
      userLevel: 1,
      country: null,
      preferences: {
        notifications: true,
        sound: true,
        theme: 'orange'
      }
    };
  }

  updateGameData(data: Partial<LocalGameData>): void {
    const currentData = this.getGameData();
    const updatedData = {
      ...currentData,
      ...data,
      lastSync: new Date().toISOString()
    };
    
    localStorage.setItem(STORAGE_KEYS.GAME_DATA, JSON.stringify(updatedData));
  }

  // OPTIMIZED: User profile management (non-essential data)
  getUserProfile(userId: string) {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEYS.USER_PROFILE}_${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading user profile from local storage:', error);
    }
    
    return {
      xp: 0,
      level: 1,
      country: null,
      preferences: {
        notifications: true,
        sound: true,
        theme: 'orange'
      },
      lastActivity: Date.now(),
      isOnline: true
    };
  }
  
  updateUserProfile(userId: string, updates: any): void {
    const currentProfile = this.getUserProfile(userId);
    const updatedProfile = {
      ...currentProfile,
      ...updates,
      lastUpdated: Date.now()
    };
    
    localStorage.setItem(`${STORAGE_KEYS.USER_PROFILE}_${userId}`, JSON.stringify(updatedProfile));
  }
  // Statistics and Analytics (Local Only)
  getPurchaseStats() {
    const purchases = this.getPurchases();
    const totalSpent = purchases.reduce((sum, p) => sum + p.pricePaid, 0);
    const totalChips = purchases.reduce((sum, p) => sum + p.chipsAwarded, 0);
    
    return {
      totalPurchases: purchases.length,
      totalSpent,
      totalChipsPurchased: totalChips,
      averagePurchase: purchases.length > 0 ? totalSpent / purchases.length : 0,
      firstPurchase: purchases.length > 0 ? purchases[0].timestamp : null,
      lastPurchase: purchases.length > 0 ? purchases[purchases.length - 1].timestamp : null
    };
  }

  getTransactionStats() {
    const transactions = this.getTransactions();
    const wins = transactions.filter(t => t.type === 'win');
    const losses = transactions.filter(t => t.type === 'loss');
    
    return {
      totalTransactions: transactions.length,
      totalWins: wins.length,
      totalLosses: losses.length,
      totalWinAmount: wins.reduce((sum, t) => sum + t.amount, 0),
      totalLossAmount: losses.reduce((sum, t) => sum + Math.abs(t.amount), 0),
      winRate: transactions.length > 0 ? (wins.length / transactions.length) * 100 : 0
    };
  }

  // Utility Methods
  private updatePurchaseTotals(): void {
    const purchases = this.getPurchases();
    const totalSpent = purchases.reduce((sum, p) => sum + p.pricePaid, 0);
    const totalPurchased = purchases.reduce((sum, p) => sum + p.chipsAwarded, 0);
    
    this.updateGameData({
      totalSpent,
      totalPurchased
    });
  }

  // Export/Import for backup
  exportData(): string {
    const data = {
      purchases: this.getPurchases(),
      transactions: this.getTransactions(),
      gameData: this.getGameData(),
      exportDate: new Date().toISOString()
    };
    
    return JSON.stringify(data, null, 2);
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.purchases) {
        localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(data.purchases));
      }
      
      if (data.transactions) {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
      }
      
      if (data.gameData) {
        localStorage.setItem(STORAGE_KEYS.GAME_DATA, JSON.stringify(data.gameData));
      }
      
      console.log('✅ Data imported successfully');
      return true;
    } catch (error) {
      console.error('❌ Error importing data:', error);
      return false;
    }
  }

  // Clear all local data (for testing or reset)
  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.PURCHASES);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.GAME_DATA);
    
    // Clear user profile data
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(STORAGE_KEYS.USER_PROFILE)) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('🗑️ All local game data cleared');
  }

  // Get storage usage info
  getStorageInfo() {
    const purchases = localStorage.getItem(STORAGE_KEYS.PURCHASES) || '';
    const transactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '';
    const gameData = localStorage.getItem(STORAGE_KEYS.GAME_DATA) || '';
    
    return {
      purchasesSize: new Blob([purchases]).size,
      transactionsSize: new Blob([transactions]).size,
      gameDataSize: new Blob([gameData]).size,
      totalSize: new Blob([purchases + transactions + gameData]).size
    };
  }
}

// Export singleton instance
export const localStorageManager = new LocalStorageManager();

// Helper functions for easy access
export const addPurchase = (purchase: Omit<PurchaseRecord, 'id' | 'timestamp'>) => 
  localStorageManager.addPurchase(purchase);

export const addTransaction = (transaction: Omit<TransactionRecord, 'id' | 'timestamp'>) => 
  localStorageManager.addTransaction(transaction);

export const getPurchaseHistory = () => localStorageManager.getPurchases();
export const getTransactionHistory = (limit?: number) => localStorageManager.getTransactions(limit);
export const getPurchaseStats = () => localStorageManager.getPurchaseStats();
export const getTransactionStats = () => localStorageManager.getTransactionStats();