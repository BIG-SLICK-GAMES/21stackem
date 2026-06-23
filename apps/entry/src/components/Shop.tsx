import React, { useEffect, useState } from "react";
import { ArrowLeft, Coins, ExternalLink, RefreshCw, ShoppingCart } from "lucide-react";

import {
  bsgBuyShopItem,
  bsgGetProfile,
  bsgGetShop,
  type BsgShopItem,
  type BsgUser,
} from "../lib/bsgApi";

interface ShopProps {
  profile: BsgUser;
  onPurchase: (newChipAmount: number) => void;
  onBack: () => void;
}

function formatCurrency(price: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(price);
}

export default function Shop({ profile, onPurchase, onBack }: ShopProps) {
  const [items, setItems] = useState<BsgShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingPrice, setBuyingPrice] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  async function loadShop() {
    setLoading(true);
    setMessage("");
    try {
      const shopItems = await bsgGetShop();
      setItems(shopItems);
      if (!shopItems.length) setMessage("No chip packages are configured in BSG yet.");
    } catch (error: any) {
      setMessage(error.message || "Failed to load BSG shop.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBuy(item: BsgShopItem) {
    setBuyingPrice(item.nPrice);
    setMessage("");

    try {
      const result = await bsgBuyShopItem(item.nPrice);

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }

      const updatedProfile = await bsgGetProfile();
      onPurchase(updatedProfile.chips);
      setMessage(
        `Purchase complete. New shared balance: ${updatedProfile.chips.toLocaleString()} chips.`
      );
    } catch (error: any) {
      setMessage(error.message || "Purchase failed.");
    } finally {
      setBuyingPrice(null);
    }
  }

  useEffect(() => {
    loadShop();
  }, []);

  return (
    <div className="min-h-screen space-y-6 py-4 text-gray-100">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-gray-300 transition hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Games Hub
        </button>

        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3">
          <div className="flex items-center gap-2 text-yellow-300">
            <Coins className="h-5 w-5" />
            <span className="font-black">{profile.chips.toLocaleString()}</span>
            <span className="text-sm text-yellow-100/80">shared chips</span>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-black text-white sm:text-4xl">Chip Shop</h2>
        <p className="mt-2 max-w-2xl text-sm text-gray-400">
          Hub checkout uses the BSG shop and wallet records.
        </p>
      </div>

      {message && (
        <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 text-sm font-semibold text-orange-100">
          {message}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-8 text-center text-gray-300">
          Loading BSG shop...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => {
            const title = item.sTitle || `${item.nChips.toLocaleString()} Chips`;
            const currency = item.sCurrency || "usd";
            const isBuying = buyingPrice === item.nPrice;

            return (
              <article
                key={`${item._id || item.nPrice}-${index}`}
                className="rounded-xl border border-gray-700/60 bg-gray-800/70 p-5 shadow-xl shadow-black/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-white">{title}</h3>
                    <p className="mt-1 text-sm text-gray-400">
                      {item.sDescription || "Shared wallet chip package"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-yellow-500/15 p-3 text-yellow-300">
                    <Coins className="h-6 w-6" />
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <div className="text-3xl font-black text-yellow-300">
                    {Number(item.nChips || 0).toLocaleString()}
                  </div>
                  <div className="text-sm font-semibold text-gray-300">chips</div>
                  <div className="text-2xl font-black text-white">
                    {formatCurrency(Number(item.nPrice || 0), currency)}
                  </div>
                </div>

                <button
                  onClick={() => handleBuy(item)}
                  disabled={isBuying}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 px-4 py-3 font-black text-white transition hover:from-orange-400 hover:to-red-500 disabled:cursor-wait disabled:opacity-60"
                >
                  {isBuying ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-4 w-4" />
                  )}
                  {isBuying ? "Starting Checkout..." : "Buy In Hub"}
                </button>
              </article>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border border-gray-700/50 bg-black/20 p-4 text-xs text-gray-400">
        <ExternalLink className="mr-2 inline h-4 w-4 text-orange-300" />
        Purchases are recorded against the BSG Mongo wallet. Stripe can be added
        to this BSG shop flow when payment processing is ready.
      </div>
    </div>
  );
}
