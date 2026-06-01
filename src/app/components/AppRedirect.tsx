"use client";

import { useEffect, useState } from "react";
import { StoreModal } from "./JoinCTA";

const DEEP_LINK_SCHEME = "togedaapp";
const ANDROID_PACKAGE = "net.togeda.app";
const ANDROID_API_HOST = "api.togeda.net";

interface AppRedirectProps {
  type: "event" | "club";
  id: string;
}

/**
 * On mount, tries to open the app via a deep link.
 *
 * iOS: fires the custom scheme. Universal Links handle links opened outside the
 * browser at OS level so the page never loads in that case.
 *
 * Android: fires the intent URL with an `S.browser_fallback_url` pointing back to
 * this page with a `?store=1` flag. When the app is installed the intent opens it
 * directly; when it isn't, Chrome navigates to the fallback (this page + flag)
 * instead of auto-opening Google Play, and we show the StoreModal so the user can
 * choose their store or stay on the website.
 *
 * Desktop: does nothing.
 */
export default function AppRedirect({ type, id }: AppRedirectProps) {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Returned here from a failed Android intent (app not installed) → ask the
    // user via the StoreModal instead of redirecting again. Strip the flag so a
    // manual refresh doesn't loop or re-show the modal.
    const params = new URLSearchParams(window.location.search);
    if (params.get("store") === "1") {
      setShowModal(true);
      params.delete("store");
      const query = params.toString();
      const clean = window.location.pathname + (query ? `?${query}` : "") + window.location.hash;
      window.history.replaceState(null, "", clean);
      return;
    }

    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);

    if (isIOS) {
      window.location.href = `${DEEP_LINK_SCHEME}://${type}?id=${id}`;
      return;
    }

    if (isAndroid) {
      // Fall back to this page + ?store=1 so that when the app isn't installed
      // Chrome returns here (and we show the StoreModal) instead of auto-opening
      // Google Play. When the app is installed the intent opens it directly.
      const back = new URL(window.location.href);
      back.searchParams.set("store", "1");
      const fallback = encodeURIComponent(back.toString());
      const intentUrl = `intent://${ANDROID_API_HOST}/in-app/${type}?id=${id}#Intent;scheme=https;package=${ANDROID_PACKAGE};S.browser_fallback_url=${fallback};end`;
      window.location.href = intentUrl;
    }
  }, [type, id]);

  if (!showModal) return null;

  return <StoreModal type={type} onClose={() => setShowModal(false)} />;
}
