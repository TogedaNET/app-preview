"use client";

import { useEffect, useRef, useState } from "react";

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

function StoreBadges() {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 transition-colors hover:bg-white/20">
        {/* Apple logo */}
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
        <div className="text-left leading-tight">
          <p className="text-[10px] text-white/60">Download on the</p>
          <p className="text-sm font-semibold text-white">App Store</p>
        </div>
      </a>

      <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 transition-colors hover:bg-white/20">
        {/* Play Store logo */}
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
          <path d="M3 20.5v-17c0-.83 1-.9 1.4-.4l14 8.5c.4.25.4.85 0 1.1l-14 8.5c-.4.4-1.4.33-1.4-.7z" fill="#4CAF50"/>
          <path d="M3 3.5l9.5 9.5L3 22" fill="#F44336"/>
          <path d="M17 12L3 3.5" fill="#FFEB3B" opacity=".8"/>
          <path d="M17 12L3 20.5" fill="#2196F3" opacity=".8"/>
        </svg>
        <div className="text-left leading-tight">
          <p className="text-[10px] text-white/60">Get it on</p>
          <p className="text-sm font-semibold text-white">Google Play</p>
        </div>
      </a>
    </div>
  );
}

interface Props {
  type: "event" | "club";
  id: string;
  count?: number;
}

export default function JoinCTA({ type, id, count }: Props) {
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [showStore, setShowStore] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setPlatform(detectPlatform()), []);

  const deepLink = `${DEEP_LINK_SCHEME}://${type}?id=${id}`;
  const label = type === "event" ? "Join Event" : "Join Club";
  const isMobile = platform === "ios" || platform === "android";

  function handleJoin() {
    // Try opening the app
    window.location.href = deepLink;

    // If the app opens, the page loses visibility — cancel the timer
    const onHide = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      document.removeEventListener("visibilitychange", onHide);
    };
    document.addEventListener("visibilitychange", onHide);

    // After 1.8s, if still here, the app isn't installed — show store badges
    timerRef.current = setTimeout(() => {
      document.removeEventListener("visibilitychange", onHide);
      setShowStore(true);
    }, 1800);
  }

  if (platform === "unknown") return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Primary Join button */}
      <button
        onClick={isMobile ? handleJoin : () => setShowStore(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-base font-bold text-stone-900 shadow-lg transition-all active:scale-[0.98] hover:bg-stone-100"
      >
        <PlusIcon />
        {label}
      </button>

      {/* Social proof */}
      {count !== undefined && count > 1 && (
        <p className="text-center text-sm text-stone-400">
          Join <span className="font-semibold text-white">{count.toLocaleString()}</span>{" "}
          {type === "event" ? "people going" : "members"}
        </p>
      )}

      {/* Store badges — shown after join tap if app not installed (or on desktop) */}
      {showStore && (
        <div className="flex flex-col gap-2">
          <p className="text-center text-sm font-medium text-white">
            Get the app to join
          </p>
          <StoreBadges />
        </div>
      )}
    </div>
  );
}

/* ── Sticky bottom bar — mobile only ─────────────────────────────────────── */
export function StickyJoinBar({ type, id, count }: Props) {
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [showStore, setShowStore] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setPlatform(detectPlatform()), []);

  const deepLink = `${DEEP_LINK_SCHEME}://${type}?id=${id}`;
  const label = type === "event" ? "Join Event" : "Join Club";
  const isMobile = platform === "ios" || platform === "android";

  function handleJoin() {
    window.location.href = deepLink;
    const onHide = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      document.removeEventListener("visibilitychange", onHide);
    };
    document.addEventListener("visibilitychange", onHide);
    timerRef.current = setTimeout(() => {
      document.removeEventListener("visibilitychange", onHide);
      setShowStore(true);
    }, 1800);
  }

  if (!isMobile) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-stone-950/95 px-4 pb-6 pt-3 backdrop-blur-md">
      {showStore ? (
        /* App not installed — show store badges */
        <div className="flex flex-col gap-2">
          <p className="text-center text-sm font-medium text-white">Get the app to join</p>
          <StoreBadges />
        </div>
      ) : (
        /* Default — join button + count */
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
      )}
    </div>
  );
}
