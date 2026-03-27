"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import AuthModal from "./AuthModal";
import PaymentModal from "./PaymentModal";
import { useAuth } from "./AuthContext";
import type { Currency, Interest, Location } from "~/lib/api";

const APP_STORE_URL = "https://apps.apple.com/bg/app/togeda-friends-activities/id6737203832";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=net.togeda.app";
const DEEP_LINK_SCHEME = "togedaapp";
const ANDROID_PACKAGE = "net.togeda.app";
const ANDROID_API_HOST = "api.togeda.net";

type Platform = "ios" | "android" | "desktop" | "unknown";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

// ── Store modal ────────────────────────────────────────────────────────────

export function StoreModal({ type, onClose }: { type: "event" | "club"; onClose: () => void }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const noun = type === "event" ? "this event" : "this club";

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        className="relative z-10 w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-stone-900 border border-white/10 p-6 pb-10 sm:pb-6 shadow-2xl"
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

        {/* Togeda wordmark / icon */}
        <div className="mb-5 flex flex-col items-center gap-3 text-center">
          <img src="/togeda-logo.png" alt="Togeda" className="h-16 w-16 rounded-2xl" />
          <div>
            <p className="text-lg font-bold text-white">Open in Togeda</p>
            <p className="mt-1 text-sm text-stone-400">
              Download the free app to join {noun}
            </p>
          </div>
        </div>

        {/* Store buttons */}
        <div className="flex flex-col gap-3">
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl bg-white px-5 py-3.5 transition-all hover:bg-stone-100 active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0 fill-stone-900">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            <div className="flex-1">
              <p className="text-[11px] font-medium text-stone-500">Download on the</p>
              <p className="text-base font-bold text-stone-900 leading-tight">App Store</p>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-stone-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </a>

          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl bg-white px-5 py-3.5 transition-all hover:bg-stone-100 active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" fill="none">
              <path d="M3 20.5v-17c0-.83 1-.9 1.4-.4l14 8.5c.4.25.4.85 0 1.1l-14 8.5c-.4.4-1.4.33-1.4-.7z" fill="#4CAF50" />
              <path d="M3 3.5l9.5 9.5L3 22" fill="#F44336" />
              <path d="M17 12L3 3.5" fill="#FFEB3B" opacity=".9" />
              <path d="M17 12L3 20.5" fill="#2196F3" opacity=".9" />
            </svg>
            <div className="flex-1">
              <p className="text-[11px] font-medium text-stone-500">Get it on</p>
              <p className="text-base font-bold text-stone-900 leading-tight">Google Play</p>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-stone-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Shared join logic hook ─────────────────────────────────────────────────

function buildDeepLink(type: "event" | "club", id: string, platform: Platform): string {
  if (platform === "android") {
    return `intent://${ANDROID_API_HOST}/in-app/${type}?id=${id}#Intent;scheme=https;package=${ANDROID_PACKAGE};end`;
  }
  return `${DEEP_LINK_SCHEME}://${type}?id=${id}`;
}

type JoinResult = "joined" | "requested" | "already" | "ended" | "error" | null;

const JOINED_EVENTS_KEY = "togeda_joined_events";

function getJoinedEvents(): string[] {
  try {
    return JSON.parse(localStorage.getItem(JOINED_EVENTS_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function markEventJoined(id: string) {
  const joined = getJoinedEvents();
  if (!joined.includes(id)) {
    localStorage.setItem(JOINED_EVENTS_KEY, JSON.stringify([...joined, id]));
  }
}

function useJoin(
  type: "event" | "club",
  id: string,
  platform: Platform,
  payment?: number,
) {
  const { isAuthenticated, token } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [authInitialScreen, setAuthInitialScreen] = useState<"welcome" | "googleProfile">("welcome");
  const [joinResult, setJoinResult] = useState<JoinResult>(null);
  const [isParticipant, setIsParticipant] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check localStorage for prior join, then verify with backend using user token
  useEffect(() => {
    if (type !== "event") return;
    if (isAuthenticated && token) {
      // Always verify with backend when authenticated so stale localStorage
      // from a previous account doesn't bleed into the current session.
      fetch(`/api/event-status?postId=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json() as Promise<{ currentUserStatus?: string }>)
        .then(({ currentUserStatus }) => {
          if (currentUserStatus === "PARTICIPATING" || currentUserStatus === "OWNER") {
            setIsParticipant(true);
            markEventJoined(id);
          } else {
            setIsParticipant(false);
          }
        })
        .catch(() => undefined);
    } else {
      // Not authenticated — fall back to localStorage only
      setIsParticipant(getJoinedEvents().includes(id));
    }
  }, [id, type, isAuthenticated, token]);

  async function handleJoin() {
    if (platform === "desktop" || platform === "unknown") {
      if (isAuthenticated && token) {
        const isPaid = type === "event" && payment && payment > 0;
        if (isPaid) {
          // Paid event → open payment modal
          setShowPaymentModal(true);
        } else {
          // Free event → join directly
          try {
            const res = await fetch("/api/join", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ type, id }),
            });
            const data = (await res.json()) as { success?: boolean; error?: string };
            if (data.success) {
              setJoinResult("joined");
              if (type === "event") markEventJoined(id);
            } else {
              const msg = (data.error ?? "").toLowerCase();
              if (msg.includes("already")) {
                setJoinResult("already");
                if (type === "event") markEventJoined(id);
              } else if (msg.includes("request")) setJoinResult("requested");
              else if (["started", "ended", "past", "expired"].some((k) => msg.includes(k))) setJoinResult("ended");
              else setJoinResult("error");
            }
          } catch {
            setJoinResult("error");
          }
        }
      } else {
        setShowAuthModal(true);
      }
      return;
    }

    // Mobile (iOS + Android): try deep link, show StoreModal if app doesn't open
    const deepLink = buildDeepLink(type, id, platform);
    window.location.href = deepLink;

    const onHide = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      document.removeEventListener("visibilitychange", onHide);
    };
    document.addEventListener("visibilitychange", onHide);
    timerRef.current = setTimeout(() => {
      document.removeEventListener("visibilitychange", onHide);
      setShowModal(true);
    }, 1800);
  }

  function handlePaymentSuccess() {
    setShowPaymentModal(false);
    setIsParticipant(true);
    if (type === "event") markEventJoined(id);
  }

  return {
    showModal, setShowModal,
    showAuthModal, setShowAuthModal,
    showPaymentModal, setShowPaymentModal,
    authInitialScreen, setAuthInitialScreen,
    joinResult, setJoinResult,
    isParticipant,
    handleJoin,
    handlePaymentSuccess,
  };
}

// ── JoinCTA (inline, right column) ────────────────────────────────────────

interface Props {
  type: "event" | "club";
  id: string;
  count?: number;
  interests?: Interest[];
  location?: Location;
  payment?: number;
  currency?: Currency;
}

function joinResultMessage(result: JoinResult, type: "event" | "club"): string {
  if (result === "joined") return type === "event" ? "You're going! 🎉" : "You joined the club! 🎉";
  if (result === "requested") return "Request sent! You'll be notified when approved.";
  if (result === "already") return type === "event" ? "You're already going to this event." : "You're already a member.";
  if (result === "ended") return "This event has already ended.";
  return "Something went wrong. Please try again.";
}

export default function JoinCTA({ type, id, count, interests, location, payment, currency }: Props) {
  const { token } = useAuth();
  const [platform, setPlatform] = useState<Platform>("unknown");
  useEffect(() => setPlatform(detectPlatform()), []);

  const isPaidEvent = type === "event" && !!payment && payment > 0;
  const label = isPaidEvent
    ? `Join Event · ${currency?.symbol ?? ""}${payment}`
    : type === "event" ? "Join Event" : "Join Club";

  const {
    showModal, setShowModal,
    showAuthModal, setShowAuthModal,
    showPaymentModal, setShowPaymentModal,
    authInitialScreen, setAuthInitialScreen,
    joinResult, setJoinResult,
    isParticipant,
    handleJoin,
    handlePaymentSuccess,
  } = useJoin(type, id, platform, payment);

  useEffect(() => {
    const flag = localStorage.getItem("togeda_google_auth_complete");
    if (flag) {
      localStorage.removeItem("togeda_google_auth_complete");
      setShowAuthModal(true);
      setAuthInitialScreen("googleProfile");
    }
  }, [setShowAuthModal, setAuthInitialScreen]);

  const defaultLocation: Location = location ?? {
    name: "",
    address: "",
    city: "",
    state: "",
    country: "",
    latitude: 0,
    longitude: 0,
  };

  if (platform === "unknown") return null;

  return (
    <>
      <div className="flex flex-col gap-3">
        {isParticipant || joinResult === "joined" ? (
          <div className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 py-4 text-base font-bold text-emerald-300">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            {type === "event" ? "You're going!" : "You're a member!"}
          </div>
        ) : (
          <button
            onClick={handleJoin}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-base font-bold text-stone-900 shadow-lg transition-all active:scale-[0.98] hover:bg-stone-100"
          >
            <PlusIcon />
            {label}
          </button>
        )}
        {joinResult && joinResult !== "joined" && (
          <div className={`rounded-xl px-4 py-3 text-sm text-center font-medium ${joinResult === "error" ? "bg-red-500/15 text-red-300" : "bg-white/10 text-white"}`}>
            {joinResultMessage(joinResult, type)}
            <button onClick={() => setJoinResult(null)} className="ml-2 text-xs opacity-60 hover:opacity-100">✕</button>
          </div>
        )}
        {count !== undefined && count > 1 && (
          <p className="text-center text-sm text-stone-400">
            Join <span className="font-semibold text-white">{count.toLocaleString()}</span>{" "}
            {type === "event" ? "people going" : "members"}
          </p>
        )}
      </div>

      {showModal && <StoreModal type={type} onClose={() => setShowModal(false)} />}
      {showAuthModal && (
        <AuthModal
          type={type}
          id={id}
          interests={interests ?? []}
          location={defaultLocation}
          onClose={() => setShowAuthModal(false)}
          initialScreen={authInitialScreen}
        />
      )}
      {showPaymentModal && token && currency && (
        <PaymentModal
          postId={id}
          payment={payment!}
          currency={currency}
          token={token}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </>
  );
}

// ── StickyJoinBar (fixed bottom, mobile only) ────────────────────────────

export function StickyJoinBar({ type, id, count, interests, location, payment, currency }: Props) {
  const { token } = useAuth();
  const [platform, setPlatform] = useState<Platform>("unknown");
  useEffect(() => setPlatform(detectPlatform()), []);

  const isPaidEvent = type === "event" && !!payment && payment > 0;
  const label = isPaidEvent
    ? `Join · ${currency?.symbol ?? ""}${payment}`
    : type === "event" ? "Join Event" : "Join Club";
  const isMobile = platform === "ios" || platform === "android";
  const {
    showModal, setShowModal,
    showAuthModal, setShowAuthModal,
    showPaymentModal, setShowPaymentModal,
    authInitialScreen, setAuthInitialScreen,
    joinResult, setJoinResult,
    isParticipant,
    handleJoin,
    handlePaymentSuccess,
  } = useJoin(type, id, platform, payment);

  useEffect(() => {
    const flag = localStorage.getItem("togeda_google_auth_complete");
    if (flag) {
      localStorage.removeItem("togeda_google_auth_complete");
      setShowAuthModal(true);
      setAuthInitialScreen("googleProfile");
    }
  }, [setShowAuthModal, setAuthInitialScreen]);

  const defaultLocation: Location = location ?? {
    name: "",
    address: "",
    city: "",
    state: "",
    country: "",
    latitude: 0,
    longitude: 0,
  };

  if (!isMobile) return null;

  const alreadyJoined = isParticipant || joinResult === "joined";

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-stone-950/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-300 items-center gap-3 px-6 pb-8 pt-3 lg:px-10">
          <div className="flex flex-col">
            {count !== undefined && count > 0 && (
              <span className="text-xs text-stone-400">
                <span className="font-semibold text-white">{count.toLocaleString()}</span>{" "}
                {type === "event" ? "going" : "members"}
              </span>
            )}
            <span className="text-xs text-stone-500">Open in Togeda app</span>
          </div>
          {alreadyJoined ? (
            <div className="ml-auto flex shrink-0 items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 px-6 py-3 text-sm font-bold text-emerald-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              {type === "event" ? "You're going!" : "Joined!"}
            </div>
          ) : (
            <button
              onClick={handleJoin}
              className="ml-auto flex shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-stone-900 transition-transform active:scale-95"
            >
              <PlusIcon />
              {label}
            </button>
          )}
        </div>
        {joinResult && joinResult !== "joined" && (
          <div
            className="border-t border-white/10 px-6 py-2 text-xs text-center text-stone-300 cursor-pointer"
            onClick={() => setJoinResult(null)}
          >
            {joinResultMessage(joinResult, type)}
          </div>
        )}
      </div>

      {showModal && <StoreModal type={type} onClose={() => setShowModal(false)} />}
      {showAuthModal && (
        <AuthModal
          type={type}
          id={id}
          interests={interests ?? []}
          location={defaultLocation}
          onClose={() => setShowAuthModal(false)}
          initialScreen={authInitialScreen}
        />
      )}
      {showPaymentModal && token && currency && (
        <PaymentModal
          postId={id}
          payment={payment!}
          currency={currency}
          token={token}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </>
  );
}
