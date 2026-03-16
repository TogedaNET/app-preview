"use client";

import { useEffect } from "react";

const APP_STORE_URL = "https://apps.apple.com/bg/app/togeda-friends-activities/id6737203832";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=net.togeda.app";
const DEEP_LINK_SCHEME = "togedaapp";

interface AppRedirectProps {
  type: "event" | "club";
  id: string;
}

/**
 * Invisible component — on mount it tries the deep link.
 * If the app is installed the page goes into background and nothing else happens.
 * If the app is NOT installed, after 1.8 s it sends the user to the correct store.
 * On desktop it does nothing.
 */
export default function AppRedirect({ type, id }: AppRedirectProps) {
  useEffect(() => {
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);

    if (!isIOS && !isAndroid) return;

    const storeUrl = isIOS ? APP_STORE_URL : PLAY_STORE_URL;
    const deepLink = `${DEEP_LINK_SCHEME}://${type}?id=${id}`;

    window.location.href = deepLink;

    const onHide = () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onHide);
    };
    document.addEventListener("visibilitychange", onHide);

    const timer = setTimeout(() => {
      document.removeEventListener("visibilitychange", onHide);
      window.location.href = storeUrl;
    }, 1800);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [type, id]);

  return null;
}
