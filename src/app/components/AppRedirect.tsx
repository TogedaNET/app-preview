"use client";

import { useEffect } from "react";

const DEEP_LINK_SCHEME = "togedaapp";
const ANDROID_PACKAGE = "net.togeda.app";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=net.togeda.app";

interface AppRedirectProps {
  type: "event" | "club";
  id: string;
}

/**
 * Invisible component — on mount it tries to open the app via a deep link.
 *
 * iOS: fires the custom scheme. Universal Links (apple-app-site-association) handle
 * links opened outside the browser at OS level, so the page is never loaded in that case.
 *
 * Android: uses an Android Intent URL instead of the raw custom scheme.
 * Intent URLs work in Telegram, Instagram, and other WebViews that block custom schemes.
 * The S.browser_fallback_url parameter lets Android handle the Play Store redirect
 * natively — no JS timer tricks needed.
 *
 * Desktop: does nothing.
 */
export default function AppRedirect({ type, id }: AppRedirectProps) {
  useEffect(() => {
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);

    if (isIOS) {
      window.location.href = `${DEEP_LINK_SCHEME}://${type}?id=${id}`;
      return;
    }

    if (isAndroid) {
      // intent://<path>#Intent;scheme=<scheme>;package=<pkg>;S.browser_fallback_url=<url>;end
      // Android reconstructs: togedaapp://<type>?id=<id>
      const fallback = encodeURIComponent(PLAY_STORE_URL);
      const intentUrl = `intent://${type}?id=${id}#Intent;scheme=${DEEP_LINK_SCHEME};package=${ANDROID_PACKAGE};S.browser_fallback_url=${fallback};end`;
      window.location.href = intentUrl;
    }
  }, [type, id]);

  return null;
}
