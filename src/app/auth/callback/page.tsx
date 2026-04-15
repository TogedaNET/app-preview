"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");

    if (!accessToken) {
      setError(true);
      return;
    }

    localStorage.setItem("togeda_token", accessToken);
    localStorage.setItem("togeda_google_auth_complete", "1");

    const returnTo = localStorage.getItem("togeda_return_to");
    localStorage.removeItem("togeda_return_to");

    router.replace(returnTo ?? "/");
  }, [router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-950 text-white">
        <div className="text-center">
          <p className="text-stone-400">Authentication failed.</p>
          <Link href="/" className="mt-4 inline-block text-sm text-white underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-950 text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        <p className="text-sm text-stone-400">Completing sign in…</p>
      </div>
    </div>
  );
}
