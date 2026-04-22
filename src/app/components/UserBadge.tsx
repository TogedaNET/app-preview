"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "./AuthContext";
import AuthModal from "./AuthModal";
import { StoreModal } from "./JoinCTA";

const DEEP_LINK_SCHEME = "togedaapp";
const ANDROID_PACKAGE = "net.togeda.app";
const ANDROID_API_HOST = "api.togeda.net";

interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
  occupation: string;
  profilePhotos: string[];
  friendsCount: number;
  participatedPostsCount: number;
  userRole: string;
}

export default function UserBadge() {
  const { user, token, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState<UserInfo | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasAutoOpenedModal = useRef(false);
  const storeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Derive deep link target from URL when on an event/club page
  const pageType = pathname === "/event" ? "event" as const
    : pathname === "/club" ? "club" as const
    : null;
  const pageId = searchParams.get("id");

  function handleOpenInApp() {
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);

    // If we're on an event/club page, try to deep link into the app first
    if (pageType && pageId && (isIOS || isAndroid)) {
      let deepLink: string;
      if (isAndroid) {
        deepLink = `intent://${ANDROID_API_HOST}/in-app/${pageType}?id=${pageId}#Intent;scheme=https;package=${ANDROID_PACKAGE};end`;
      } else {
        deepLink = `${DEEP_LINK_SCHEME}://${pageType}?id=${pageId}`;
      }
      window.location.href = deepLink;

      const onHide = () => {
        if (storeTimerRef.current) clearTimeout(storeTimerRef.current);
        document.removeEventListener("visibilitychange", onHide);
      };
      document.addEventListener("visibilitychange", onHide);
      storeTimerRef.current = setTimeout(() => {
        document.removeEventListener("visibilitychange", onHide);
        setShowStoreModal(true);
      }, 1800);
      return;
    }

    // Desktop or no specific page context → show store modal directly
    setShowStoreModal(true);
  }

  const fetchInfo = useCallback(() => {
    if (!token) return;
    void fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        if (r.ok) {
          const d = (await r.json()) as UserInfo;
          setInfo(d);
        }
      })
      .catch(() => undefined);
  }, [token]);

  // Fetch info + conditionally open profile modal when token becomes available
  useEffect(() => {
    if (!isAuthenticated || !token) {
      // Reset on logout
      hasAutoOpenedModal.current = false;
      setInfo(null);
      return;
    }
    void fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        if (r.ok) {
          const d = (await r.json()) as UserInfo;
          const isDeleted = d.email === "deletedEmail" && d.firstName === "Deleted" && d.lastName === "user";
          if (isDeleted) { logout(); return; }
          setInfo(d);
          if (!d.firstName && !hasAutoOpenedModal.current) {
            hasAutoOpenedModal.current = true;
            setShowProfileModal(true);
          }
        } else if (r.status === 404 && !hasAutoOpenedModal.current) {
          hasAutoOpenedModal.current = true;
          setShowProfileModal(true);
        }
      })
      .catch(() => undefined);
  }, [isAuthenticated, token, logout]);

  // Case 2: registered but email not yet confirmed → open verify
  useEffect(() => {
    const pendingEmail = localStorage.getItem("togeda_pending_email");
    const storedToken = localStorage.getItem("togeda_token");
    if (pendingEmail && !storedToken && !hasAutoOpenedModal.current) {
      hasAutoOpenedModal.current = true;
      setShowVerifyModal(true);
    }
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Not logged in — show a compact Log in button
  if (!isAuthenticated || !user) {
    return (
      <>
        <div className="fixed right-4 top-4 z-9998 flex items-center gap-2">
          <button
            onClick={handleOpenInApp}
            className="rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-sm transition-all hover:bg-white/20 active:scale-95"
          >
            Open in App
          </button>
          <button
            onClick={() => setShowAuth(true)}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-900 shadow-lg transition-all hover:bg-stone-100 active:scale-95"
          >
            Log in
          </button>
        </div>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} onProfileCreated={fetchInfo} />}
        {showVerifyModal && (
          <AuthModal
            initialScreen="verify"
            required
            onClose={() => setShowVerifyModal(false)}
            onProfileCreated={fetchInfo}
          />
        )}
        {showStoreModal && <StoreModal type={pageType ?? "event"} onClose={() => setShowStoreModal(false)} variant="explore" />}
      </>
    );
  }

  const fullName = info ? `${info.firstName} ${info.lastName}` : user.email;
  const email = info?.email ?? user.email;
  const photo = info?.profilePhotos?.[0];
  const initial = (info?.firstName ?? user.email).charAt(0).toUpperCase();

  return (
    <div ref={ref} className="fixed right-4 top-4 z-9998 flex items-center gap-2">
      {/* Open in App button */}
      <button
        onClick={handleOpenInApp}
        className="rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-sm transition-all hover:bg-white/20 active:scale-95"
      >
        Open in App
      </button>
      {/* Avatar button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Account"
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full ring-2 ring-white/20 shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        {photo ? (
          <img src={photo} alt={fullName} className="h-10 w-10 object-cover rounded-full" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-white text-sm font-bold text-stone-900">
            {initial}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-12 w-72 rounded-2xl border border-white/10 bg-stone-900 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-white/10">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-white/10">
              {photo ? (
                <img src={photo} alt={fullName} className="h-10 w-10 object-cover rounded-full" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-white text-sm font-bold text-stone-900">
                  {initial}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{fullName}</p>
              <p className="truncate text-xs text-stone-400">{email}</p>
              {info?.occupation && (
                <p className="truncate text-xs text-stone-500 mt-0.5">{info.occupation}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          {info && (
            <div className="grid grid-cols-2 divide-x divide-white/10 border-b border-white/10">
              <div className="flex flex-col items-center py-3">
                <span className="text-base font-bold text-white">{info.friendsCount}</span>
                <span className="text-[11px] text-stone-500">Friends</span>
              </div>
              <div className="flex flex-col items-center py-3">
                <span className="text-base font-bold text-white">{info.participatedPostsCount}</span>
                <span className="text-[11px] text-stone-500">Events joined</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="p-2">
            <button
              onClick={() => { logout(); setOpen(false); }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-stone-400 transition-colors hover:bg-white/8 hover:text-white"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
              Log out
            </button>
          </div>
        </div>
      )}
      {showProfileModal && (
        <AuthModal
          initialScreen="registerDetails"
          required
          onClose={() => setShowProfileModal(false)}
          onProfileCreated={fetchInfo}
        />
      )}
      {showStoreModal && <StoreModal type={pageType ?? "event"} onClose={() => setShowStoreModal(false)} variant="explore" />}
    </div>
  );
}
