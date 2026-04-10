"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import AuthModal from "./AuthModal";
import PaymentModal from "./PaymentModal";
import { useAuth } from "./AuthContext";
import type { Currency, EventStatus, ParticipantStatus, ArrivalStatus } from "~/lib/api";

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

export function StoreModal({ type, onClose, variant = "join" }: { type: "event" | "club"; onClose: () => void; variant?: "join" | "explore" | "contact" }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const noun = type === "event" ? "this event" : "this club";
  const title = variant === "explore" ? "See more on Togeda" : variant === "contact" ? "Contact Organizer" : "Open in Togeda";
  const subtitle = variant === "explore"
    ? "Download the free app for more information and full access to all features."
    : variant === "contact"
    ? "Message the organizer directly in the Togeda app to request a refund."
    : `Download the free app to join ${noun}`;

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
            <p className="text-lg font-bold text-white">{title}</p>
            <p className="mt-1 text-sm text-stone-400">
              {subtitle}
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

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function useJoin(
  type: "event" | "club",
  id: string,
  platform: Platform,
  payment?: number,
  askToJoin?: boolean,
  eventLat?: number,
  eventLon?: number,
) {
  const router = useRouter();
  const { isAuthenticated, token } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [authInitialScreen, setAuthInitialScreen] = useState<"welcome" | "googleProfile">("welcome");
  const [joinResult, setJoinResult] = useState<JoinResult>(null);
  const [joining, setJoining] = useState(false);
  const [userStatus, setUserStatus] = useState<ParticipantStatus | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userArrivalStatus, setUserArrivalStatus] = useState<ArrivalStatus | null>(null);
  const [confirmingLocation, setConfirmingLocation] = useState(false);
  const [locationFeedback, setLocationFeedback] = useState<{ meters?: number; denied?: boolean; visible: boolean } | null>(null);
  const locationFeedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [statusKey, setStatusKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch the logged-in user's participation status and role
  useEffect(() => {
    if (!isAuthenticated || !token) {
      setUserStatus(null);
      setUserRole(null);
      return;
    }
    const url = type === "club"
      ? `/api/club-status?clubId=${id}`
      : `/api/event-status?postId=${id}`;
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json() as Promise<{ currentUserStatus?: string; currentUserRole?: string; currentUserArrivalStatus?: string }>)
      .then((data) => {
        setUserStatus((data.currentUserStatus as ParticipantStatus) ?? null);
        setUserRole(data.currentUserRole ?? null);
        setUserArrivalStatus((data.currentUserArrivalStatus as ArrivalStatus) ?? null);
      })
      .catch(() => undefined);
  }, [id, type, isAuthenticated, token, statusKey]);

  const isParticipant = userStatus === "PARTICIPATING";
  const isInQueue = userStatus === "IN_QUEUE";
  const isHost = type === "club"
    ? userRole === "ADMIN"
    : userRole === "HOST" || userRole === "CO_HOST";

  async function handleJoin() {
    if (platform === "desktop" || platform === "unknown") {
      if (isAuthenticated && token) {
        const isPaid = type === "event" && payment && payment > 0;
        if (isPaid) {
          setShowPaymentModal(true);
        } else {
          // Free event → call /posts/{id}/tryToJoinPost via proxy
          setJoining(true);
          try {
            const res = await fetch("/api/join", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ type, id }),
            });
            const data = (await res.json()) as { success?: boolean; error?: string };
            if (data.success) {
              setJoinResult(askToJoin ? "requested" : "joined");
              setStatusKey((k) => k + 1);
              router.refresh();
            } else {
              const msg = (data.error ?? "").toLowerCase();
              if (msg.includes("already")) {
                setJoinResult("already");
                setStatusKey((k) => k + 1);
                router.refresh();
              } else if (msg.includes("request")) setJoinResult("requested");
              else if (["started", "ended", "past", "expired"].some((k) => msg.includes(k))) setJoinResult("ended");
              else setJoinResult("error");
            }
          } catch {
            setJoinResult("error");
          } finally {
            setJoining(false);
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

  const [leaving, setLeaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  async function handleCancel() {
    if (!token) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/cancel-join", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type, id }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (data.success) {
        setJoinResult(null);
        setStatusKey((k) => k + 1);
        router.refresh();
      } else {
        setJoinResult("error");
      }
    } catch {
      setJoinResult("error");
    } finally {
      setCancelling(false);
    }
  }

  async function handleLeave() {
    if (!token) return;
    setLeaving(true);
    try {
      const res = await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type, id }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (data.success) {
        setJoinResult(null);
        setStatusKey((k) => k + 1);
        router.refresh();
      } else {
        setJoinResult("error");
      }
    } catch {
      setJoinResult("error");
    } finally {
      setLeaving(false);
    }
  }

  function handlePaymentSuccess() {
    setShowPaymentModal(false);
    setJoinResult(askToJoin ? "requested" : "joined");
    setStatusKey((k) => k + 1);
    // Delay the refresh to give the backend time to process the payment
    // and register the participant before we re-fetch the page data.
    setTimeout(() => router.refresh(), 1500);
  }

  async function handleConfirmLocation() {
    if (!token || eventLat === undefined || eventLon === undefined) return;
    setLocationFeedback(null);
    setConfirmingLocation(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
      );
      const meters = haversineMeters(pos.coords.latitude, pos.coords.longitude, eventLat, eventLon);
      if (meters <= 50) {
        // Show distance briefly even on success, then confirm
        setLocationFeedback({ meters: Math.round(meters), visible: true });
        locationFeedbackTimer.current = setTimeout(() => {
          setLocationFeedback((f) => f ? { ...f, visible: false } : f);
          setTimeout(() => setLocationFeedback(null), 400);
        }, 2000);
        const res = await fetch("/api/confirm-arrival", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ postId: id }),
        });
        const data = (await res.json()) as { success?: boolean };
        if (data.success) {
          setStatusKey((k) => k + 1);
          router.refresh();
        }
      } else {
        // Too far — show distance feedback with fade-out after 2s
        setLocationFeedback({ meters: Math.round(meters), visible: true });
        if (locationFeedbackTimer.current) clearTimeout(locationFeedbackTimer.current);
        locationFeedbackTimer.current = setTimeout(() => {
          setLocationFeedback((f) => f ? { ...f, visible: false } : f);
          setTimeout(() => setLocationFeedback(null), 400);
        }, 2000);
      }
    } catch (err) {
      if ((err as GeolocationPositionError).code === 1) {
        // PERMISSION_DENIED — keep message visible until they try again
        setLocationFeedback({ denied: true, visible: true });
      }
    } finally {
      setConfirmingLocation(false);
    }
  }

  function handleOpenInApp() {
    if (platform === "ios" || platform === "android") {
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
    } else {
      setShowModal(true);
    }
  }

  return {
    showModal, setShowModal,
    showAuthModal, setShowAuthModal,
    showPaymentModal, setShowPaymentModal,
    authInitialScreen, setAuthInitialScreen,
    joinResult, setJoinResult,
    isParticipant,
    isInQueue,
    isHost,
    userArrivalStatus,
    confirmingLocation,
    locationFeedback,
    joining,
    leaving,
    cancelling,
    handleJoin,
    handleLeave,
    handleCancel,
    handlePaymentSuccess,
    handleConfirmLocation,
    handleOpenInApp,
  };
}

// ── Contact Organizer modal ────────────────────────────────────────────────

function ContactOrganizerModal({
  type,
  ownerName,
  ownerEmail,
  onOpenApp,
  onClose,
}: {
  type: "event" | "club";
  ownerName?: string;
  ownerEmail?: string;
  onOpenApp: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const noun = type === "event" ? "event organizer" : "club organizer";

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-end justify-center sm:items-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-stone-900 border border-white/10 p-6 pb-10 sm:pb-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-6">
          <p className="text-lg font-bold text-white">Contact Organizer</p>
          {ownerName && (
            <p className="mt-1 text-sm text-stone-400">
              Get in touch with <span className="font-medium text-stone-300">{ownerName}</span>
            </p>
          )}
          {!ownerName && (
            <p className="mt-1 text-sm text-stone-400">Reach out to the {noun} directly.</p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {/* Via app */}
          <button
            onClick={() => { onClose(); onOpenApp(); }}
            className="flex items-center gap-4 rounded-2xl bg-white/8 border border-white/10 px-5 py-4 text-left transition-all hover:bg-white/12 active:scale-[0.98]"
          >
            <img src="/togeda-logo.png" alt="Togeda" className="h-10 w-10 rounded-xl shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Message in Togeda</p>
              <p className="text-xs text-stone-400 mt-0.5">Open the app to send a direct message</p>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-stone-500 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          {/* Via email */}
          {ownerEmail ? (
            <a
              href={`mailto:${ownerEmail}`}
              onClick={onClose}
              className="flex items-center gap-4 rounded-2xl bg-white/8 border border-white/10 px-5 py-4 text-left transition-all hover:bg-white/12 active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5 text-stone-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">Send an Email</p>
                <p className="truncate text-xs text-stone-400 mt-0.5">{ownerEmail}</p>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-stone-500 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </a>
          ) : (
            <div className="flex items-center gap-4 rounded-2xl bg-white/5 border border-white/8 px-5 py-4 opacity-40">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5 text-stone-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">Send an Email</p>
                <p className="text-xs text-stone-500 mt-0.5">Email not available</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── JoinCTA (inline, right column) ────────────────────────────────────────

interface Props {
  type: "event" | "club";
  id: string;
  count?: number;
  maximumPeople?: number;
  payment?: number;
  currency?: Currency;
  status?: EventStatus;
  askToJoin?: boolean;
  allowJoinAfterStart?: boolean;
  needsLocationalConfirmation?: boolean;
  eventLat?: number;
  eventLon?: number;
  ownerEmail?: string;
  ownerName?: string;
  ownerPaysStripeFee?: boolean;
}

function joinResultMessage(result: JoinResult, type: "event" | "club"): string {
  if (result === "joined") return type === "event" ? "You're going! 🎉" : "You joined the club! 🎉";
  if (result === "requested") return "Request sent! You'll be notified when approved.";
  if (result === "already") return type === "event" ? "You're already going to this event." : "You're already a member.";
  if (result === "ended") return "This event has already ended.";
  return "Something went wrong. Please try again.";
}

export default function JoinCTA({ type, id, count, maximumPeople, payment, currency, status, askToJoin: _askToJoin, allowJoinAfterStart, needsLocationalConfirmation, eventLat, eventLon, ownerEmail, ownerName, ownerPaysStripeFee }: Props) {
  const { token } = useAuth();
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [showContactModal, setShowContactModal] = useState(false);
  useEffect(() => setPlatform(detectPlatform()), []);

  const isPaidEvent = type === "event" && !!payment && payment > 0;
  const label = isPaidEvent
    ? `Join Event · ${currency?.symbol ?? ""}${payment}`
    : type === "event" ? "Join Event" : "Join Club";
  const hasStartedAndClosed = type === "event" && status === "HAS_STARTED" && allowJoinAfterStart === false;
  const isFull = type === "event" && !!maximumPeople && maximumPeople > 0 && (count ?? 0) >= maximumPeople;

  const hasEnded = type === "event" && status === "HAS_ENDED";

  const {
    showModal, setShowModal,
    showAuthModal, setShowAuthModal,
    showPaymentModal, setShowPaymentModal,
    authInitialScreen, setAuthInitialScreen,
    joinResult, setJoinResult,
    isParticipant,
    isInQueue,
    isHost,
    userArrivalStatus,
    confirmingLocation,
    locationFeedback,
    joining,
    leaving,
    cancelling,
    handleJoin,
    handleLeave,
    handleCancel,
    handlePaymentSuccess,
    handleConfirmLocation,
    handleOpenInApp,
  } = useJoin(type, id, platform, payment, _askToJoin, eventLat, eventLon);

  const canLeave = type === "club"
    ? isParticipant && !isHost
    : isParticipant && !isPaidEvent && status === "NOT_STARTED";
  const needsLocationConfirm = isParticipant && !!needsLocationalConfirmation && userArrivalStatus !== "ARRIVED" && status === "HAS_STARTED";

  useEffect(() => {
    const flag = localStorage.getItem("togeda_google_auth_complete");
    if (flag) {
      localStorage.removeItem("togeda_google_auth_complete");
      setShowAuthModal(true);
      setAuthInitialScreen("googleProfile");
    }
  }, [setShowAuthModal, setAuthInitialScreen]);

  if (platform === "unknown") return null;

  return (
    <>
      <div className="flex flex-col gap-3">
        {isHost ? (
          <button
            onClick={handleOpenInApp}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500/20 border border-amber-500/30 py-4 text-base font-bold text-amber-300 transition-all hover:bg-amber-500/30 active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
            </svg>
            {"You're the host · Manage in app"}
          </button>
        ) : hasEnded ? (
          <div className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-500/20 border border-red-500/30 py-4 text-base font-bold text-red-300">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            Event Has Ended
          </div>
        ) : hasStartedAndClosed && !isParticipant && !isInQueue ? (
          <div className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-500/20 border border-stone-500/30 py-4 text-base font-bold text-stone-300">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            Event Has Started · Joining Closed
          </div>
        ) : isFull && !isParticipant && !isInQueue ? (
          <div className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-500/20 border border-stone-500/30 py-4 text-base font-bold text-stone-300">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
            Event Is Full
          </div>
        ) : canLeave ? (
          <button
            onClick={handleLeave}
            disabled={leaving}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-500/20 border border-red-500/30 py-4 text-base font-bold text-red-300 transition-all hover:bg-red-500/30 active:scale-[0.98] disabled:opacity-60"
          >
            {leaving ? (
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3-3h-9m0 0 3-3m-3 3 3 3" />
              </svg>
            )}
            {leaving ? "Leaving..." : type === "club" ? "Leave Club" : "Leave Event"}
          </button>
        ) : (isInQueue || joinResult === "requested") ? (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500/20 border border-amber-500/30 py-4 text-base font-bold text-amber-300 transition-all hover:bg-amber-500/30 active:scale-[0.98] disabled:opacity-60"
          >
            {cancelling ? (
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            )}
            {cancelling ? "Cancelling..." : "Cancel Request"}
          </button>
        ) : needsLocationConfirm ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={handleConfirmLocation}
              disabled={confirmingLocation}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500/20 border border-blue-500/30 py-4 text-base font-bold text-blue-300 transition-all hover:bg-blue-500/30 active:scale-[0.98] disabled:opacity-60"
            >
              {confirmingLocation ? (
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
              )}
              {confirmingLocation ? "Locating..." : "Confirm Location"}
            </button>
            {locationFeedback && (
              <p
                className={`text-center text-sm font-medium transition-opacity duration-400 ${locationFeedback.denied ? "text-amber-300" : "text-red-300"}`}
                style={{ opacity: locationFeedback.visible ? 1 : 0 }}
              >
                {locationFeedback.denied
                  ? "Enable location access in your browser to confirm arrival"
                  : `You are ${locationFeedback.meters}m away · must be within 50m`}
              </p>
            )}
          </div>
        ) : isParticipant || joinResult === "joined" ? (
          <div className="flex flex-col gap-2">
            <div className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 py-4 text-base font-bold text-emerald-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              {type === "event" ? "You're going!" : "You're a member!"}
            </div>
            {isPaidEvent && (
              <button
                onClick={() => setShowContactModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-stone-400 transition-all hover:bg-white/10 hover:text-stone-300 active:scale-[0.98]"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                Contact organizer
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={handleJoin}
            disabled={joining}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-base font-bold text-stone-900 shadow-lg transition-all active:scale-[0.98] hover:bg-stone-100 disabled:opacity-60"
          >
            {joining ? (
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <PlusIcon />
            )}
            {joining ? "Joining..." : label}
          </button>
        )}
        {joinResult && joinResult !== "joined" && joinResult !== "requested" && (
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
      {showContactModal && (
        <ContactOrganizerModal
          type={type}
          ownerName={ownerName}
          ownerEmail={ownerEmail}
          onOpenApp={() => setShowModal(true)}
          onClose={() => setShowContactModal(false)}
        />
      )}
      {showAuthModal && (
        <AuthModal
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
          ownerPaysStripeFee={ownerPaysStripeFee}
          status={status}
          allowJoinAfterStart={allowJoinAfterStart}
          count={count}
          maximumPeople={maximumPeople}
          askToJoin={_askToJoin}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </>
  );
}

// ── StickyJoinBar (fixed bottom, mobile only) ────────────────────────────

export function StickyJoinBar({ type, id, count, maximumPeople, payment, currency, status, askToJoin: _askToJoin, allowJoinAfterStart, needsLocationalConfirmation, eventLat, eventLon, ownerEmail, ownerName, ownerPaysStripeFee }: Props) {
  const { token } = useAuth();
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [showContactModal, setShowContactModal] = useState(false);
  useEffect(() => setPlatform(detectPlatform()), []);

  const isPaidEvent = type === "event" && !!payment && payment > 0;
  const label = isPaidEvent
    ? `Join · ${currency?.symbol ?? ""}${payment}`
    : type === "event" ? "Join Event" : "Join Club";
  const isMobile = platform === "ios" || platform === "android";
  const hasEnded = type === "event" && status === "HAS_ENDED";
  const hasStartedAndClosed = type === "event" && status === "HAS_STARTED" && allowJoinAfterStart === false;
  const isFull = type === "event" && !!maximumPeople && maximumPeople > 0 && (count ?? 0) >= maximumPeople;
  const {
    showModal, setShowModal,
    showAuthModal, setShowAuthModal,
    showPaymentModal, setShowPaymentModal,
    authInitialScreen, setAuthInitialScreen,
    joinResult, setJoinResult,
    isParticipant,
    isInQueue,
    isHost,
    userArrivalStatus,
    confirmingLocation,
    locationFeedback,
    joining,
    leaving,
    cancelling,
    handleJoin,
    handleLeave,
    handleCancel,
    handlePaymentSuccess,
    handleConfirmLocation,
    handleOpenInApp,
  } = useJoin(type, id, platform, payment, _askToJoin, eventLat, eventLon);

  const canLeave = type === "club"
    ? isParticipant && !isHost
    : isParticipant && !isPaidEvent && status === "NOT_STARTED";
  const needsLocationConfirm = isParticipant && !!needsLocationalConfirmation && userArrivalStatus !== "ARRIVED" && status === "HAS_STARTED";

  useEffect(() => {
    const flag = localStorage.getItem("togeda_google_auth_complete");
    if (flag) {
      localStorage.removeItem("togeda_google_auth_complete");
      setShowAuthModal(true);
      setAuthInitialScreen("googleProfile");
    }
  }, [setShowAuthModal, setAuthInitialScreen]);

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
          {isHost ? (
            <button
              onClick={handleOpenInApp}
              className="ml-auto flex shrink-0 items-center gap-2 rounded-xl bg-amber-500/20 border border-amber-500/30 px-6 py-3 text-sm font-bold text-amber-300 transition-all hover:bg-amber-500/30 active:scale-95"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
              </svg>
              {"Manage in app"}
            </button>
          ) : hasEnded ? (
            <div className="ml-auto flex shrink-0 items-center gap-2 rounded-xl bg-red-500/20 border border-red-500/30 px-6 py-3 text-sm font-bold text-red-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              Event Has Ended
            </div>
          ) : hasStartedAndClosed && !isParticipant && !isInQueue ? (
            <div className="ml-auto flex shrink-0 items-center gap-2 rounded-xl bg-stone-500/20 border border-stone-500/30 px-6 py-3 text-sm font-bold text-stone-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              Joining Closed
            </div>
          ) : isFull && !isParticipant && !isInQueue ? (
            <div className="ml-auto flex shrink-0 items-center gap-2 rounded-xl bg-stone-500/20 border border-stone-500/30 px-6 py-3 text-sm font-bold text-stone-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
              </svg>
              Event Is Full
            </div>
          ) : needsLocationConfirm ? (
            <div className="ml-auto flex shrink-0 flex-col items-end gap-1">
              <button
                onClick={handleConfirmLocation}
                disabled={confirmingLocation}
                className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-500/20 border border-blue-500/30 px-6 py-3 text-sm font-bold text-blue-300 transition-all hover:bg-blue-500/30 active:scale-95 disabled:opacity-60"
              >
                {confirmingLocation ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                )}
                {confirmingLocation ? "Locating..." : "Confirm Location"}
              </button>
              {locationFeedback && (
                <p
                  className={`text-xs font-medium transition-opacity duration-400 ${locationFeedback.denied ? "text-amber-300" : "text-red-300"}`}
                  style={{ opacity: locationFeedback.visible ? 1 : 0 }}
                >
                  {locationFeedback.denied
                    ? "Enable location in browser settings"
                    : `${locationFeedback.meters}m away · must be within 50m`}
                </p>
              )}
            </div>
          ) : alreadyJoined ? (
            canLeave ? (
              <button
                onClick={handleLeave}
                disabled={leaving}
                className="ml-auto flex shrink-0 items-center gap-2 rounded-xl border border-red-500/30 px-6 py-3 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/10 active:scale-95 disabled:opacity-60"
              >
                {leaving ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3-3h-9m0 0 3-3m-3 3 3 3" />
                  </svg>
                )}
                {leaving ? "Leaving..." : "Leave"}
              </button>
            ) : isPaidEvent ? (
              <div className="ml-auto flex shrink-0 items-center gap-2">
                <div className="flex shrink-0 items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 px-4 py-3 text-sm font-bold text-emerald-300">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  {type === "event" ? "You're going!" : "Joined!"}
                </div>
                <button
                  onClick={() => setShowContactModal(true)}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-medium text-stone-400 transition-all hover:bg-white/10 hover:text-stone-300 active:scale-95"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-3.5 w-3.5 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                  Contact organizer
                </button>
              </div>
            ) : (
              <div className="ml-auto flex shrink-0 items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 px-6 py-3 text-sm font-bold text-emerald-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                {type === "event" ? "You're going!" : "Joined!"}
              </div>
            )
          ) : (isInQueue || joinResult === "requested") ? (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="ml-auto flex shrink-0 items-center gap-2 rounded-xl bg-amber-500/20 border border-amber-500/30 px-6 py-3 text-sm font-bold text-amber-300 transition-all hover:bg-amber-500/30 active:scale-95 disabled:opacity-60"
            >
              {cancelling ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              )}
              {cancelling ? "Cancelling..." : "Cancel"}
            </button>
          ) : (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="ml-auto flex shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-stone-900 transition-transform active:scale-95 disabled:opacity-60"
            >
              {joining ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <PlusIcon />
              )}
              {joining ? "Joining..." : label}
            </button>
          )}
        </div>
        {joinResult && joinResult !== "joined" && joinResult !== "requested" && (
          <div
            className="border-t border-white/10 px-6 py-2 text-xs text-center text-stone-300 cursor-pointer"
            onClick={() => setJoinResult(null)}
          >
            {joinResultMessage(joinResult, type)}
          </div>
        )}
      </div>

      {showModal && <StoreModal type={type} onClose={() => setShowModal(false)} />}
      {showContactModal && (
        <ContactOrganizerModal
          type={type}
          ownerName={ownerName}
          ownerEmail={ownerEmail}
          onOpenApp={() => setShowModal(true)}
          onClose={() => setShowContactModal(false)}
        />
      )}
      {showAuthModal && (
        <AuthModal
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
          ownerPaysStripeFee={ownerPaysStripeFee}
          status={status}
          allowJoinAfterStart={allowJoinAfterStart}
          count={count}
          maximumPeople={maximumPeople}
          askToJoin={_askToJoin}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </>
  );
}
