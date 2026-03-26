"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import type { Currency } from "~/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StripePaymentSheet {
  paymentIntent: string; // PaymentIntent client secret
  ephemeralKey: string;
  customer: string;
  publishableKey: string;
}

export interface PostFees {
  ticketPrice?: number;
  serviceFee?: number;
  platformFee?: number;
  totalAmount?: number;
  currency?: string;
  [key: string]: unknown;
}

// ── Fee breakdown row ─────────────────────────────────────────────────────────

function FeeRow({ label, amount, symbol, bold }: { label: string; amount: number; symbol: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "font-semibold text-white" : "text-stone-300"}`}>
      <span className="text-sm">{label}</span>
      <span className="text-sm">{symbol}{amount.toFixed(2)}</span>
    </div>
  );
}

// ── Checkout form (must be inside <Elements>) ─────────────────────────────────

function CheckoutForm({
  totalAmount,
  currencySymbol,
  onSuccess,
  onClose,
}: {
  totalAmount: number;
  currencySymbol: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed. Please try again.");
      setIsProcessing(false);
    } else {
      onSuccess();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="min-h-[200px]">
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onClose}
          disabled={isProcessing}
          className="flex-1 rounded-2xl border border-white/15 py-3.5 text-sm font-semibold text-stone-300 transition-colors hover:bg-white/5 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || !elements || isProcessing}
          className="flex-1 rounded-2xl bg-white py-3.5 text-sm font-bold text-stone-900 transition-all active:scale-[0.98] hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing…
            </span>
          ) : (
            `Pay ${currencySymbol}${totalAmount.toFixed(2)} & Join`
          )}
        </button>
      </div>
    </form>
  );
}

// ── Modal shell ───────────────────────────────────────────────────────────────

interface PaymentModalProps {
  postId: string;
  payment: number;
  currency: Currency;
  token: string;
  onSuccess: () => void;
  onClose: () => void;
}

export default function PaymentModal({
  postId,
  payment,
  currency,
  token,
  onSuccess,
  onClose,
}: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fees, setFees] = useState<PostFees | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Fetch fees and payment sheet on mount
  useEffect(() => {
    async function init() {
      try {
        const [feesRes, sheetRes] = await Promise.all([
          fetch(`/api/post-fees?postId=${postId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/payment-sheet/event?postId=${postId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        // Fees are optional — display gracefully if missing
        if (feesRes.ok) {
          const feesData = (await feesRes.json()) as PostFees;
          setFees(feesData);
        }

        if (!sheetRes.ok) {
          const errData = (await sheetRes.json().catch(() => ({}))) as { error?: string };
          throw new Error(errData.error ?? "Failed to initialize payment");
        }

        const sheet = (await sheetRes.json()) as StripePaymentSheet;
        setStripePromise(loadStripe(sheet.publishableKey));
        setClientSecret(sheet.paymentIntent);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    }

    void init();
  }, [postId, token]);

  const symbol = currency?.symbol ?? "";
  const totalAmount = fees?.totalAmount ?? payment;

  const content = (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-stone-900 border border-white/10 p-6 pb-10 sm:pb-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20 sm:hidden" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">Complete your payment</h2>
          <p className="mt-1 text-sm text-stone-400">Pay securely to join this event</p>
        </div>

        {/* Fee breakdown */}
        <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400">Order summary</p>
          <div className="space-y-2">
            <FeeRow label="Ticket" amount={fees?.ticketPrice ?? payment} symbol={symbol} />
            {(() => {
              const combinedFee = (fees?.serviceFee ?? 0) + (fees?.platformFee ?? 0);
              return combinedFee > 0
                ? <FeeRow label="Fee" amount={combinedFee} symbol={symbol} />
                : null;
            })()}
            <div className="border-t border-white/10 pt-2 mt-2">
              <FeeRow label="Total" amount={totalAmount} symbol={symbol} bold />
            </div>
          </div>
        </div>

        {/* Stripe payment form */}
        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <svg className="h-8 w-8 animate-spin text-stone-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}

        {loadError && (
          <div className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-300 mb-4">
            {loadError}
          </div>
        )}

        {!isLoading && !loadError && clientSecret && stripePromise && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "night",
                variables: {
                  colorPrimary: "#ffffff",
                  colorBackground: "#1c1917",
                  colorText: "#e7e5e4",
                  colorDanger: "#f87171",
                  fontFamily: "inherit",
                  borderRadius: "12px",
                },
              },
            }}
          >
            <CheckoutForm
              totalAmount={totalAmount}
              currencySymbol={symbol}
              onSuccess={onSuccess}
              onClose={onClose}
            />
          </Elements>
        )}

        {/* Stripe branding */}
        <p className="mt-4 text-center text-xs text-stone-500">
          Secured by{" "}
          <span className="font-semibold text-stone-400">Stripe</span>
        </p>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
