"use client";

import { useEffect } from "react";

const DEEP_LINK_SCHEME = "togedaapp";

interface AppRedirectProps {
  type: "event" | "club";
  id: string;
}

/**
 * Invisible component — on mount it tries the custom scheme deep link.
 * Universal Links handle the case where the link is opened outside the browser
 * (e.g. iMessage, WhatsApp) — the OS opens the app directly without loading this page.
 * This component handles the in-browser case: if the app is installed it will open,
 * if not the user stays on the preview page.
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
  }, [type, id]);

  return null;
}
