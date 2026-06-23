import React, { useState, useEffect } from 'react';
import { X, Download, Upload, Trash2, ShoppingBag, TrendingUp, Calendar } from 'lucide-react';
import { 
  getPurchaseHistory, 
  getTransactionHistory, 
  getPurchaseStats, 
  getTransactionStats,
  localStorageManager,
  PurchaseRecord,
  TransactionRecord 
} from '../lib/localStorageManager';

interface PurchaseHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PurchaseHistoryModal({ isOpen, onClose }: PurchaseHistoryModalProps) {
  const [activeTab, setActiveTab] = useState<'purchases' | 'transactions' | 'stats'>('purchases');
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [purchaseStats, setPurchaseStats] = useState<any>({});
  const [transactionStats, setTransactionStats] = useState<any>({});

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = () => {
    setPurchases(getPurchaseHistory());
    setTransactions(getTransactionHistory(100)); // Last 100 transactions
    setPurchaseStats(getPurchaseStats());
    setTransactionStats(getTransactionStats());
  };

  const handleExport = () => {
    const data = localStorageManager.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gamehub-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (localStorageManager.importData(content)) {
          loadData();
          alert('Data imported successfully!');
        } else {
          alert('Error importing data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
      localStorageManager.clearAllData();
      loadData();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl border border-orange-500/30 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl shadow-orange-500/20">
        <div className="flex items-center justify-between p-6 border-b border-orange-500/20">
          <h3 className="text-2xl font-bold text-white">Purchase & Transaction History</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-orange-500/20">
          {[
            { id: 'purchases', label: 'Purchases', icon: ShoppingBag },
            { id: 'transactions', label: 'Transactions', icon: TrendingUp },
            { id: 'stats', label: 'Statistics', icon: Calendar }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center space-x-2 px-6 py-4 font-semibold transition-all ${
                activeTab === id
                  ? 'text-orange-400 border-b-2 border-orange-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Purchases Tab */}
          {activeTab === 'purchases' && (
            <div className="space-y-4">
              {purchases.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No purchases found</p>
              ) : (
                purchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-semibold">{purchase.packageName}</h4>
                        <p className="text-gray-400 text-sm">
                          {new Date(purchase.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-yellow-400 font-bold">
                          {purchase.chipsAwarded.toLocaleString()} chips
                        </p>
                        <p className="text-green-400 text-sm">${purchase.pricePaid}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="space-y-2">
              {transactions.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No transactions found</p>
              ) : (
                transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          transaction.type === 'win' ? 'bg-green-500' :
                          transaction.type === 'loss' ? 'bg-red-500' :
                          transaction.type === 'purchase' ? 'bg-blue-500' :
                          'bg-yellow-500'
                        }`}></div>
                        <div>
                          <p className="text-white text-sm font-medium">{transaction.description}</p>
                          <p className="text-gray-400 text-xs">
                            {new Date(transaction.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-sm ${
                          transaction.type === 'win' || transaction.type === 'purchase' 
                            ? 'text-green-400' 
                            : 'text-red-400'
                        }`}>
                          {transaction.type === 'win' || transaction.type === 'purchase' ? '+' : '-'}
                          {transaction.amount.toLocaleString()}
                        </p>
                        <p className="text-gray-400 text-xs">
                          Balance: {transaction.balanceAfter.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
                <h4 className="text-white font-bold mb-4">Purchase Statistics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Purchases:</span>
                    <span className="text-white">{purchaseStats.totalPurchases || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Spent:</span>
                    <span className="text-green-400">${(purchaseStats.totalSpent || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Chips Purchased:</span>
                    <span className="text-yellow-400">{(purchaseStats.totalChipsPurchased || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Average Purchase:</span>
                    <span className="text-blue-400">${(purchaseStats.averagePurchase || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
                <h4 className="text-white font-bold mb-4">Game Statistics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Games:</span>
                    <span className="text-white">{transactionStats.totalTransactions || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Wins:</span>
                    <span className="text-green-400">{transactionStats.totalWins || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Losses:</span>
                    <span className="text-red-400">{transactionStats.totalLosses || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Win Rate:</span>
                    <span className="text-purple-400">{(transactionStats.winRate || 0).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-orange-500/20">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            
            <label className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Import</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>

          <button
            onClick={handleClearData}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        </div>
      </div>
    </div>
  );
}