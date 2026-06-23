import { useState } from "react";
import * as React from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Loader2, X } from "lucide-react";

interface CheckoutFormProps {
  itemName: string;
  amount: number;
  chips: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CheckoutForm({
  itemName,
  amount,
  chips,
  onSuccess,
  onCancel,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Scroll to the checkout form when it mounts
  React.useEffect(() => {
    const checkoutElement = document.getElementById("checkout-form-container");
    if (checkoutElement) {
      checkoutElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError("Stripe has not loaded yet. Please wait.");
      return;
    }

    // Check if PaymentElement is ready
    if (!isReady) {
      setError("Payment form is still loading. Please wait.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Submit the form to collect payment details
      const { error: submitError } = await elements.submit();

      if (submitError) {
        setError(submitError.message || "Failed to submit payment details");
        setLoading(false);
        return;
      }

      // Confirm the payment
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/shop",
        },
        redirect: "if_required",
      });

      if (confirmError) {
        setError(confirmError.message || "Payment failed");
      } else {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div
        id="checkout-form-container"
        className="bg-gradient-to-br from-gray-900 to-gray-800 border border-orange-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-gradient-to-br from-gray-900 to-gray-800 pb-4 z-10">
          <h3 className="text-2xl font-bold text-white">Complete Purchase</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/30 rounded-xl p-4 mb-6">
          <div className="text-center">
            <p className="text-gray-300 text-sm">Purchasing</p>
            <p className="text-2xl font-bold text-white mt-1">{itemName}</p>
            <p className="text-orange-400 text-lg mt-2">
              🪙 {chips.toLocaleString()} Chips
            </p>
            <p className="text-3xl font-bold text-white mt-2">
              ${amount.toFixed(2)}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <PaymentElement
            onReady={() => setIsReady(true)}
            onLoadError={(error) => {
              console.error("PaymentElement load error:", error);
              setError("Failed to load payment form. Please try again.");
            }}
          />

          {!isReady && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
              <span className="ml-2 text-gray-400">
                Loading payment form...
              </span>
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 sticky bottom-0 bg-gradient-to-br from-gray-900 to-gray-800 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!stripe || !isReady || loading}
              className="flex-1 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay $${amount.toFixed(2)}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
