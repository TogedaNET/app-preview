"use client";

import { useEffect } from "react";

const DEEP_LINK_SCHEME = "togedaapp";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=net.togeda.app";

interface AppRedirectProps {
  type: "event" | "club";
  id: string;
}

/**
 * Invisible component — on mount it tries the custom scheme deep link.
 * Universal Links handle the case where the link is opened outside the browser
 * (e.g. iMessage, WhatsApp) — the OS opens the app directly without loading this page.
 * This component handles the in-browser case: if the app is installed it will open,
 * if not the user stays on the preview page (iOS) or gets redirected to the Play Store (Android).
 * On desktop it does nothing.
 */
export default function AppRedirect({ type, id }: AppRedirectProps) {
  useEffect(() => {
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);

    if (!isIOS && !isAndroid) return;

    const deepLink = `${DEEP_LINK_SCHEME}://${type}?id=${id}`;
    window.location.href = deepLink;

    if (isAndroid) {
      const onHide = () => {
        clearTimeout(timer);
        document.removeEventListener("visibilitychange", onHide);
      };
      document.addEventListener("visibilitychange", onHide);
      const timer = setTimeout(() => {
        document.removeEventListener("visibilitychange", onHide);
        window.location.href = PLAY_STORE_URL;
      }, 1800);
    }
  }, [type, id]);

  return null;
}
