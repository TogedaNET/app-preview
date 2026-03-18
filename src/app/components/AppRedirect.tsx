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
 * Android: fires the intent URL (no auto-fallback). If the app doesn't open
 * within 1800ms, shows the StoreModal so the user can pick their store manually.
 *
 * Desktop: does nothing.
 */
export default function AppRedirect({ type, id }: AppRedirectProps) {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);

    if (isIOS) {
      window.location.href = `${DEEP_LINK_SCHEME}://${type}?id=${id}`;
      return;
    }

    if (isAndroid) {
      // No S.browser_fallback_url — if the app isn't installed the page stays loaded.
      // We detect this via visibilitychange + timeout and show the StoreModal instead.
      const intentUrl = `intent://${ANDROID_API_HOST}/in-app/${type}?id=${id}#Intent;scheme=https;package=${ANDROID_PACKAGE};end`;
      window.location.href = intentUrl;

      const onHide = () => {
        clearTimeout(timer);
        document.removeEventListener("visibilitychange", onHide);
      };
      document.addEventListener("visibilitychange", onHide);
      const timer = setTimeout(() => {
        document.removeEventListener("visibilitychange", onHide);
        setShowModal(true);
      }, 1800);
    }
  }, [type, id]);

  if (!showModal) return null;

  return <StoreModal type={type} onClose={() => setShowModal(false)} />;
}
