"use client";

import { useEffect, useRef, useState } from "react";
import AuthModal from "./AuthModal";
import { useAuth } from "./AuthContext";

// ── Group ticket tiers ────────────────────────────────────────────────────────
// Each tier is ONE pre-made Stripe Payment Link with the DISCOUNTED total already
// baked in. simsh creates these 4 links in the Stripe dashboard and pastes the
// URLs + price labels here.
//
// To set up (per paid event):
//   1. Ask simsh for the discounted TOTAL of each pack (2 / 3 / 4 / 5 people) —
//      this is the single amount the Stripe Payment Link charges.
//   2. In Stripe → Payment Links, create one link per pack with that total and a
//      product name like "Togeda group ticket · 4 people". The product name is how
//      you read the ticket count back in the Payments list — keep it consistent.
//   3. Paste the link URL and the numeric `total` below. The per-person price shown
//      on the button is derived (total ÷ people) — DON'T type it in.
//
// NOTE: `total` is what ONE buyer pays to cover the whole group; the "€… each" line
// is display-only framing, not a real per-seat charge (Stripe bills the total once).
//
// The buyer's Togeda user id AND the event (post) id are packed into a single
// `client_reference_id` as `<userId>_<eventId>` at redirect time (both are UUIDs, so
// underscore is a safe delimiter), plus their email as `prefilled_email`. That one
// field is the only per-visitor channel a Payment Link forwards to the webhook, so it
// carries everything the backend needs to auto-join the buyer as a normal paid entry
// and to reconcile the payment in the Stripe Payments list (Export CSV → columns:
// amount, client_reference_id, email; ticket count = which product/link they bought).
// Because the event id rides in the ref, the SAME 4 links work for every group event
// (as long as the pack prices are the same) — no per-event links needed.
interface GroupTier {
  people: number;
  total: number; // discounted pack TOTAL baked into the Stripe link, e.g. 430 — leave 0 until known
  stripeLink: string; // full Stripe Payment Link URL — leave "" until created
}

const CURRENCY = "€";

// Per-ticket prices: 2→€225, 3→€215, 4→€210, 5→€200 each. `total` is people × per-ticket.
const GROUP_TIERS: GroupTier[] = [
  { people: 2, total: 450, stripeLink: "https://buy.stripe.com/4gMaEZ8hmemv2ric7z4Ja05" },
  { people: 3, total: 645, stripeLink: "https://buy.stripe.com/aFa14pbty92bgi8b3v4Ja01" },
  { people: 4, total: 840, stripeLink: "https://buy.stripe.com/7sY28t9lq92bfe4c7z4Ja02" },
  { people: 5, total: 1000, stripeLink: "https://buy.stripe.com/cNicN7416baj3vm2wZ4Ja03" },
];

function isConfigured(tier: GroupTier): boolean {
  return tier.stripeLink.startsWith("https://") && tier.total > 0;
}

/** Format a number as a currency string with thousands separators, e.g. 1000 → "£1,000". */
function money(amount: number): string {
  return `${CURRENCY}${Math.round(amount).toLocaleString("en-GB")}`;
}

/** Derived per-person price — display-only framing, see note above. */
function perPersonLabel(tier: GroupTier): string {
  return money(tier.total / tier.people);
}

/**
 * Append the buyer's identity + the event id so the webhook can auto-join them.
 * `client_reference_id` = `<userId>_<eventId>` — the backend splits on the underscore
 * (both halves are UUIDs, which never contain one) and joins the buyer to that event.
 */
function buildCheckoutUrl(base: string, userId: string, eventId: string, email: string): string {
  const url = new URL(base);
  url.searchParams.set("client_reference_id", `${userId}_${eventId}`);
  if (email) url.searchParams.set("prefilled_email", email);
  return url.toString();
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v5.018Z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
    </svg>
  );
}

/**
 * Group-discount entry point, shown only when the page URL carries the `togeda=1`
 * flag (gated by the parent). Reveals 4 pack sizes; each redirects to its pre-made
 * Stripe Payment Link with the buyer's user id attached.
 */
export default function GroupTicketCTA({ eventId }: { eventId: string }) {
  const { isAuthenticated, user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  // A tier the user picked before logging in — redirect to it once authenticated.
  const [pendingTier, setPendingTier] = useState<GroupTier | null>(null);
  const redirecting = useRef(false);

  function goToCheckout(tier: GroupTier) {
    if (redirecting.current || !user || !eventId) return;
    redirecting.current = true;
    // user.username is the backend user id (the "username" claim), NOT user.sub — the webhook
    // resolves the buyer with userRepository.findById on this exact value.
    window.location.href = buildCheckoutUrl(tier.stripeLink, user.username, eventId, user.email);
  }

  function handleSelect(tier: GroupTier) {
    if (!isConfigured(tier)) return;
    if (!isAuthenticated || !user) {
      // Need the user's id attached to the payment — sign in first, then resume.
      setPendingTier(tier);
      setShowAuthModal(true);
      return;
    }
    goToCheckout(tier);
  }

  // Resume the redirect after a successful login.
  useEffect(() => {
    if (isAuthenticated && user && pendingTier) {
      const tier = pendingTier;
      setPendingTier(null);
      setShowAuthModal(false);
      goToCheckout(tier);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, pendingTier]);

  return (
    <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.07] p-4">
      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex w-full items-center gap-3 text-left"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
            <UsersIcon />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-bold text-white">
              Buy tickets for you and your friends at a discount
            </span>
            <span className="block text-xs text-emerald-300/90">
              Click here to see group prices →
            </span>
          </span>
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-white">Choose your group size</p>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="text-xs font-medium text-stone-400 transition-colors hover:text-stone-200"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {GROUP_TIERS.map((tier) => {
              const ready = isConfigured(tier);
              return (
                <button
                  key={tier.people}
                  type="button"
                  onClick={() => handleSelect(tier)}
                  disabled={!ready}
                  className="flex flex-col items-center justify-center gap-0.5 rounded-xl border border-white/10 bg-white/5 py-3.5 transition-all hover:border-emerald-500/40 hover:bg-emerald-500/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/10 disabled:hover:bg-white/5"
                >
                  <span className="text-base font-bold text-white">{tier.people} people</span>
                  {ready ? (
                    <>
                      <span className="text-sm font-bold text-emerald-300">
                        {perPersonLabel(tier)} each
                      </span>
                      <span className="text-[11px] font-medium text-stone-400">
                        {money(tier.total)} total
                      </span>
                    </>
                  ) : (
                    <span className="text-xs font-medium text-emerald-300">Coming soon</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2.5 rounded-xl border border-white/10 bg-white/5 p-3">
            <span className="mt-0.5 shrink-0 text-emerald-300">
              <ChatIcon />
            </span>
            <p className="text-xs leading-relaxed text-stone-300">
              After you pay, we&apos;ll message you in the Togeda app and by email to get
              everyone&apos;s names — yours and your friends&apos;. If any of your friends
              are on Togeda, share their accounts too so we can add them to the event; then
              we&apos;ll add everyone for you.
            </p>
          </div>

          <p className="text-center text-[11px] text-stone-500">
            You&apos;ll be redirected to secure Stripe checkout. Your Togeda account is linked to the purchase.
          </p>
        </div>
      )}

      {showAuthModal && (
        <AuthModal
          onClose={() => {
            setShowAuthModal(false);
            setPendingTier(null);
          }}
        />
      )}
    </div>
  );
}
