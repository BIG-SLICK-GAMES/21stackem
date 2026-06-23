import React, { useState } from "react";
import {
  ShoppingBag,
  Coins,
  Star,
  Zap,
  Crown,
  Gem,
  ArrowRight,
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  username: string;
  chips: number;
  created_at: string;
  country?: string | null;
  level?: number;
  experience?: number;
}

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price_real_money: number;
  chip_amount: number;
  popular?: boolean;
  bonus_percentage?: number;
}

interface ShopSidebarProps {
  profile: UserProfile;
  onPurchase: (newChipAmount: number) => void;
}

const featuredPackages: ShopItem[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    name: "Starter Pack",
    description: "Perfect for beginners",
    price_real_money: 0.99,
    chip_amount: 1000,
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    name: "Value Pack",
    description: "Most popular choice",
    price_real_money: 4.99,
    chip_amount: 5000,
    popular: true,
    bonus_percentage: 10,
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    name: "Premium Pack",
    description: "Great value for serious players",
    price_real_money: 9.99,
    chip_amount: 12000,
    bonus_percentage: 20,
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440005",
    name: "Ultimate Pack",
    description: "The ultimate gaming experience",
    price_real_money: 49.99,
    chip_amount: 75000,
    bonus_percentage: 50,
  },
];

const getPackageIcon = (packageName: string) => {
  if (packageName.includes("Value")) return Star;
  if (packageName.includes("Premium")) return Zap;
  if (packageName.includes("Ultimate")) return Gem;
  return Coins;
};

const getPackageColor = (packageName: string) => {
  if (packageName.includes("Value")) return "from-blue-500 to-blue-600";
  if (packageName.includes("Premium")) return "from-purple-500 to-purple-600";
  if (packageName.includes("Ultimate")) return "from-yellow-500 to-orange-500";
  return "from-gray-500 to-gray-600";
};

export default function ShopSidebar({ profile, onPurchase }: ShopSidebarProps) {
  const [loading, setLoading] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  const handlePurchase = async (item: ShopItem) => {
    setLoading(true);

    try {
      // Update chips locally
      const newChipAmount = profile.chips + item.chip_amount;

      setPurchaseSuccess(item.name);

      setTimeout(() => setPurchaseSuccess(null), 3000);
    } catch (error) {
      console.error("Purchase failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-orange-500/20 rounded-2xl shadow-xl shadow-orange-500/10 overflow-hidden">
      {/* Modern Glass Header */}
      <div className="relative h-16 bg-gradient-to-r from-gray-800/60 via-gray-700/40 to-gray-800/60 backdrop-blur-xl border-b border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-white font-semibold text-lg">Chip Shop</h3>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10"></div>
      </div>

      <div className="p-4 space-y-4">
        {purchaseSuccess && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-center">
            <p className="text-green-400 font-semibold text-sm">
              🎉 {purchaseSuccess} claimed!
            </p>
          </div>
        )}

        <div className="text-center mb-4">
          <p className="text-gray-400 text-sm">
            Get free chips to power up your gaming!
          </p>
        </div>

        <div className="space-y-3">
          {featuredPackages.map((item) => {
            const IconComponent = getPackageIcon(item.name);
            const colorClass = getPackageColor(item.name);

            return (
              <div
                key={item.id}
                className={`relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-orange-500/20 rounded-xl p-4 hover:border-orange-500/40 transition-all duration-300 hover:scale-[1.02] ${
                  item.popular ? "ring-1 ring-orange-500/30" : ""
                }`}
              >
                {item.popular && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      POPULAR
                    </div>
                  </div>
                )}

                {item.bonus_percentage && (
                  <div className="absolute -top-1 -right-1">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      +{item.bonus_percentage}%
                    </div>
                  </div>
                )}

                <div className="text-center space-y-3">
                  <div
                    className={`mx-auto w-10 h-10 bg-gradient-to-r ${colorClass} rounded-lg flex items-center justify-center`}
                  >
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>

                  <div>
                    <h4 className="text-white font-bold text-sm mb-1">
                      {item.name}
                    </h4>
                    <p className="text-gray-400 text-xs mb-2">
                      {item.description}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-center space-x-1">
                      <Coins className="w-4 h-4 text-yellow-400" />
                      <span className="text-lg font-bold text-yellow-400">
                        {item.chip_amount.toLocaleString()}
                      </span>
                    </div>

                    <div className="text-xl font-bold text-white">
                      ${item.price_real_money}
                    </div>
                  </div>

                  <button
                    onClick={() => handlePurchase(item)}
                    disabled={loading}
                    className={`w-full bg-gradient-to-r ${colorClass} text-white py-2 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2 text-sm`}
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>Get Free</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-orange-500/20 pt-4">
          <button
            onClick={() => {
              /* Navigate to full shop */
            }}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center space-x-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>View Full Shop</span>
          </button>
        </div>

        <div className="text-center">
          <div className="flex justify-center space-x-2 text-gray-400 text-xs">
            <span>🔒 Secure</span>
            <span>💳 Stripe</span>
            <span>🛡️ Safe</span>
          </div>
        </div>
      </div>
    </div>
  );
}
