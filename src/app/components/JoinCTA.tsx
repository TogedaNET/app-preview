"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const APP_STORE_URL = "https://apps.apple.com/bg/app/togeda-friends-activities/id6737203832";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=net.togeda.app";
const DEEP_LINK_SCHEME = "togedaapp";

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

function StoreModal({ type, onClose }: { type: "event" | "club"; onClose: () => void }) {
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
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl font-black tracking-tight text-white">
            T
          </div>
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
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
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
              <path d="M3 20.5v-17c0-.83 1-.9 1.4-.4l14 8.5c.4.25.4.85 0 1.1l-14 8.5c-.4.4-1.4.33-1.4-.7z" fill="#4CAF50"/>
              <path d="M3 3.5l9.5 9.5L3 22" fill="#F44336"/>
              <path d="M17 12L3 3.5" fill="#FFEB3B" opacity=".9"/>
              <path d="M17 12L3 20.5" fill="#2196F3" opacity=".9"/>
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

function useJoin(deepLink: string, platform: Platform) {
  const [showModal, setShowModal] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleJoin() {
    if (platform === "desktop" || platform === "unknown") {
      setShowModal(true);
      return;
    }
    // Mobile: try deep link; if app opens the page goes hidden — cancel the store redirect
    const storeUrl = platform === "ios" ? APP_STORE_URL : PLAY_STORE_URL;
    window.location.href = deepLink;
    const onHide = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      document.removeEventListener("visibilitychange", onHide);
    };
    document.addEventListener("visibilitychange", onHide);
    timerRef.current = setTimeout(() => {
      document.removeEventListener("visibilitychange", onHide);
      window.location.href = storeUrl;
    }, 1800);
  }

  return { showModal, setShowModal, handleJoin };
}

// ── JoinCTA (inline, right column) ────────────────────────────────────────

interface Props {
  type: "event" | "club";
  id: string;
  count?: number;
}

export default function JoinCTA({ type, id, count }: Props) {
  const [platform, setPlatform] = useState<Platform>("unknown");
  useEffect(() => setPlatform(detectPlatform()), []);

  const deepLink = `${DEEP_LINK_SCHEME}://${type}?id=${id}`;
  const label = type === "event" ? "Join Event" : "Join Club";
  const { showModal, setShowModal, handleJoin } = useJoin(deepLink, platform);

  if (platform === "unknown") return null;

  return (
    <>
      <div className="flex flex-col gap-3">
        <button
          onClick={handleJoin}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-base font-bold text-stone-900 shadow-lg transition-all active:scale-[0.98] hover:bg-stone-100"
        >
          <PlusIcon />
          {label}
        </button>
        {count !== undefined && count > 1 && (
          <p className="text-center text-sm text-stone-400">
            Join <span className="font-semibold text-white">{count.toLocaleString()}</span>{" "}
            {type === "event" ? "people going" : "members"}
          </p>
        )}
      </div>

      {showModal && <StoreModal type={type} onClose={() => setShowModal(false)} />}
    </>
  );
}

// ── StickyJoinBar (fixed bottom, mobile only) ─────────────────────────────

export function StickyJoinBar({ type, id, count }: Props) {
  const [platform, setPlatform] = useState<Platform>("unknown");
  useEffect(() => setPlatform(detectPlatform()), []);

  const deepLink = `${DEEP_LINK_SCHEME}://${type}?id=${id}`;
  const label = type === "event" ? "Join Event" : "Join Club";
  const isMobile = platform === "ios" || platform === "android";
  const { showModal, setShowModal, handleJoin } = useJoin(deepLink, platform);

  if (!isMobile) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-stone-950/95 px-4 pb-8 pt-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            {count !== undefined && count > 0 && (
              <span className="text-xs text-stone-400">
                <span className="font-semibold text-white">{count.toLocaleString()}</span>{" "}
                {type === "event" ? "going" : "members"}
              </span>
            )}
            <span className="text-xs text-stone-500">Open in Togeda app</span>
          </div>
          <button
            onClick={handleJoin}
            className="ml-auto flex shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-stone-900 transition-transform active:scale-95"
          >
            <PlusIcon />
            {label}
          </button>
        </div>
      </div>

      {showModal && <StoreModal type={type} onClose={() => setShowModal(false)} />}
    </>
  );
}
