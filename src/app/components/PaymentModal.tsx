"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  ExpressCheckoutElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import type { StripeExpressCheckoutElementConfirmEvent } from "@stripe/stripe-js";
import type { Currency, EventStatus } from "~/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StripePaymentSheet {
  clientSecret: string;
  publishableKey: string;
  ownerStripeAccountId: string;
}

export interface PostFees {
  stripeFee: number;
  togedaFee: number;
  postPrice: number;
  totalPrice: number;
  currency?: { name: string; symbol: string; code: string };
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

  async function handleExpressConfirm(event: StripeExpressCheckoutElementConfirmEvent) {
    if (!stripe || !elements) return;

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "Payment failed. Please try again.");
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed. Please try again.");
    } else {
      onSuccess();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <ExpressCheckoutElement
        onConfirm={handleExpressConfirm}
        options={{
          buttonType: { applePay: "buy", googlePay: "buy" },
          buttonTheme: { applePay: "white-outline", googlePay: "white" },
        }}
      />
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
  ownerPaysStripeFee?: boolean;
  status?: EventStatus;
  allowJoinAfterStart?: boolean;
  count?: number;
  maximumPeople?: number;
  askToJoin?: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

export default function PaymentModal({
  postId,
  payment,
  currency,
  token,
  ownerPaysStripeFee,
  status,
  allowJoinAfterStart,
  count,
  maximumPeople,
  askToJoin,
  onSuccess,
  onClose,
}: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fees, setFees] = useState<PostFees | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  // Stale-data lock: detected after refetching the event on modal open
  const [freshBlockedReason, setFreshBlockedReason] = useState<"policy" | "full" | "ended" | null>(null);

  // Prop-based blocking (stale page data) — used for the instant early-return before any fetch
  const joinBlockedByPolicy = status === "HAS_STARTED" && allowJoinAfterStart === false;
  const maxParticipantsReached = !!maximumPeople && maximumPeople > 0 && (count ?? 0) >= maximumPeople;
  const hasEnded = status === "HAS_ENDED";
  const isLockedByProps = joinBlockedByPolicy || maxParticipantsReached || hasEnded;

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // On every open: refetch the event to catch stale state (e.g. tickets sold out since page load)
  useEffect(() => {
    if (isLockedByProps) return;

    async function init() {
      try {
        // 1. Refetch event to get the latest participant count, status, and join policy
        const eventRes = await fetch(`/api/event-details?postId=${postId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (eventRes.ok) {
          const fresh = (await eventRes.json()) as {
            status: string;
            allowJoinAfterStart: boolean;
            participantsCount: number;
            maximumPeople: number;
          };
          const freshEnded = fresh.status === "HAS_ENDED";
          const freshBlocked = fresh.status === "HAS_STARTED" && fresh.allowJoinAfterStart === false;
          const freshFull = fresh.maximumPeople > 0 && fresh.participantsCount >= fresh.maximumPeople;
          if (freshEnded) { setFreshBlockedReason("ended"); setIsLoading(false); return; }
          if (freshBlocked) { setFreshBlockedReason("policy"); setIsLoading(false); return; }
          if (freshFull) { setFreshBlockedReason("full"); setIsLoading(false); return; }
        }

        // 2. Event is still joinable — fetch fees and payment sheet in parallel
        const [feesRes, sheetRes] = await Promise.all([
          fetch(`/api/post-fees?postId=${postId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/payment-sheet/event?postId=${postId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (feesRes.ok) {
          setFees((await feesRes.json()) as PostFees);
        }

        if (!sheetRes.ok) {
          const errData = (await sheetRes.json().catch(() => ({}))) as { error?: string };
          throw new Error(errData.error ?? "Failed to initialize payment");
        }
        const sheet = (await sheetRes.json()) as StripePaymentSheet;
        setStripePromise(loadStripe(sheet.publishableKey, { stripeAccount: sheet.ownerStripeAccountId }));
        setClientSecret(sheet.clientSecret);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    }

    void init();
  }, [postId, token, isLockedByProps]);

  const symbol = currency?.symbol ?? "";
  const hostAbsorbsFees = ownerPaysStripeFee === true;
  const totalAmount = fees ? (hostAbsorbsFees ? fees.postPrice : fees.totalPrice) : payment;

  // ── Shared sheet wrapper ───────────────────────────────────────────────────
  function SheetWrapper({ children }: { children: React.ReactNode }) {
    return (
      <div
        className="fixed inset-0 z-9999 flex items-end justify-center sm:items-center"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <div
          className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-stone-900 border border-white/10 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto mt-4 mb-0 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
          {children}
        </div>
      </div>
    );
  }

  // ── Locked state — show immediately when props already indicate it (no fetch needed) ──
  if (isLockedByProps) {
    const lockedMessage = joinBlockedByPolicy
      ? "This event has already started and is no longer accepting new participants."
      : hasEnded
      ? "This event has ended and payments are closed."
      : "All tickets have been sold. Check back in case someone cancels.";

    const lockedContent = (
      <SheetWrapper>
        <div className="px-6 pt-8 pb-10 sm:pb-8 flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-bold text-white">
              {joinBlockedByPolicy ? "Event Ongoing" : hasEnded ? "Event Ended" : "Sold Out"}
            </h2>
            <p className="mt-1 text-sm text-stone-400">Payment unavailable</p>
          </div>
          <div className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-300">
            {lockedMessage}
          </div>
          <button
            onClick={onClose}
            className="w-full rounded-2xl border border-white/15 py-3.5 text-sm font-semibold text-stone-300 hover:bg-white/5 transition-colors"
          >
            Close
          </button>
        </div>
      </SheetWrapper>
    );

    return createPortal(lockedContent, document.body);
  }

  const content = (
    <div
      className="fixed inset-0 z-9999 flex items-end justify-center sm:items-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-stone-900 border border-white/10 shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="shrink-0 px-6 pt-6 pb-0">
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
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 pb-10 sm:pb-6 flex-1 min-h-0">
          {/* Fee breakdown */}
          <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400">Order summary</p>
            <div className="space-y-2">
              <FeeRow label="Ticket" amount={fees?.postPrice ?? payment} symbol={symbol} />
              {fees && (
                <FeeRow
                  label="Service fee"
                  amount={hostAbsorbsFees ? 0 : fees.stripeFee + fees.togedaFee}
                  symbol={symbol}
                />
              )}
              {hostAbsorbsFees && (
                <p className="text-xs text-stone-500">Service fee covered by the host</p>
              )}
              <div className="border-t border-white/10 pt-2 mt-2">
                <FeeRow label="Total" amount={totalAmount} symbol={symbol} bold />
              </div>
            </div>
          </div>

          {/* Status notices */}
          {joinBlockedByPolicy && (
            <div className="mb-4 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-300">
              This event is currently underway and is no longer accepting new participants. Follow the host to stay updated on upcoming events.
            </div>
          )}
          {!joinBlockedByPolicy && maxParticipantsReached && (
            <div className="mb-4 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-300">
              Tickets are sold out. If someone cancels you may be able to grab their spot — check back soon.
            </div>
          )}
          {!joinBlockedByPolicy && !maxParticipantsReached && status === "HAS_STARTED" && (
            <div className="mb-4 rounded-xl bg-amber-500/15 px-4 py-3 text-sm text-amber-300">
              This event has already started, but you&apos;re still welcome to join. Pay now and be part of it.
            </div>
          )}
          {askToJoin && !freshBlockedReason && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-white/5 px-4 py-3 text-sm text-stone-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="mt-0.5 h-4 w-4 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              Request a ticket — once the organizer approves, your ticket will be automatically purchased.
            </div>
          )}

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

          {freshBlockedReason && !isLoading && (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-300">
                {freshBlockedReason === "policy"
                  ? "This event has already started and is no longer accepting new participants."
                  : freshBlockedReason === "ended"
                  ? "This event has ended and payments are closed."
                  : "All tickets have been sold. Check back in case someone cancels."}
              </div>
              <button
                onClick={onClose}
                className="w-full rounded-2xl border border-white/15 py-3.5 text-sm font-semibold text-stone-300 hover:bg-white/5 transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {!freshBlockedReason && !isLoading && !loadError && clientSecret && stripePromise && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                fonts: [
                  {
                    cssSrc: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap",
                  },
                ],
                appearance: {
                  theme: "night",
                  variables: {
                    colorPrimary: "#ffffff",
                    colorBackground: "#292524",
                    colorText: "#e7e5e4",
                    colorTextSecondary: "#a8a29e",
                    colorTextPlaceholder: "#57534e",
                    colorDanger: "#f87171",
                    colorIconTab: "#a8a29e",
                    colorIconTabHover: "#e7e5e4",
                    colorIconTabSelected: "#ffffff",
                    fontFamily: "'Geist', sans-serif",
                    fontSizeBase: "14px",
                    borderRadius: "12px",
                    spacingGridRow: "16px",
                  },
                  rules: {
                    ".Input": {
                      backgroundColor: "#292524",
                      border: "1px solid rgba(255,255,255,0.10)",
                      boxShadow: "none",
                    },
                    ".Input:focus": {
                      border: "1px solid rgba(255,255,255,0.30)",
                      boxShadow: "0 0 0 3px rgba(255,255,255,0.05)",
                      outline: "none",
                    },
                    ".Tab": {
                      border: "1px solid rgba(255,255,255,0.08)",
                      backgroundColor: "transparent",
                      boxShadow: "none",
                      color: "#a8a29e",
                    },
                    ".Tab:hover": {
                      border: "1px solid rgba(255,255,255,0.18)",
                      color: "#e7e5e4",
                    },
                    ".Tab--selected": {
                      border: "1px solid rgba(255,255,255,0.22)",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      boxShadow: "none",
                      color: "#ffffff",
                    },
                    ".Tab--selected:hover": {
                      color: "#ffffff",
                    },
                    ".Label": {
                      color: "#78716c",
                      fontSize: "11px",
                      fontWeight: "600",
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                    },
                    ".Error": {
                      color: "#f87171",
                    },
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
    </div>
  );

  return createPortal(content, document.body);
}
