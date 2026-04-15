"use client";

import { createContext, useContext, useEffect, useState } from "react";

export interface AuthUser {
  sub: string;
  email: string;
}

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  displayName: string | null;
  isAuthenticated: boolean;
  setToken: (t: string | null) => void;
  setDisplayName: (name: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  token: null,
  user: null,
  displayName: null,
  isAuthenticated: false,
  setToken: () => undefined,
  setDisplayName: () => undefined,
  logout: () => undefined,
});

function decodeJwtPayload(token: string): AuthUser | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1]!.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    const payload = JSON.parse(json) as {
      sub?: string;
      email?: string;
      username?: string;
      // Cognito access tokens use "username" instead of "email"
      exp?: number;
    };
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    const email = payload.email ?? payload.username;
    if (!payload.sub || !email) return null;
    return { sub: payload.sub, email };
  } catch {
    return null;
  }
}

/** Decode token claims without checking expiry — used to recover username from an expired token. */
function extractUsernameFromToken(token: string): string | null {
  try {
    const base64 = token.split(".")[1]!.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64)) as { email?: string; username?: string };
    return payload.email ?? payload.username ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [displayName, setDisplayNameState] = useState<string | null>(null);

  // On mount: restore session from localStorage, silently refresh if token is expired
  useEffect(() => {
    const stored = localStorage.getItem("togeda_token");
    if (stored) {
      const decoded = decodeJwtPayload(stored);
      if (decoded) {
        setTokenState(stored);
        setUser(decoded);
      } else {
        // Access token expired — clear it and try a silent refresh using the httpOnly cookie
        localStorage.removeItem("togeda_token");
        const username = extractUsernameFromToken(stored);
        if (username) {
          void (async () => {
            const res = await fetch("/api/auth/refresh", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username }),
            });
            if (!res.ok) return; // Refresh token also expired — user stays logged out
            const data = (await res.json()) as { token?: string };
            if (data.token) setToken(data.token);
          })();
        }
      }
    }
    const name = localStorage.getItem("togeda_display_name");
    if (name) setDisplayNameState(name);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Whenever the access token changes, schedule a proactive refresh just before it expires
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    try {
      const raw = JSON.parse(
        atob(token.split(".")[1]!.replace(/-/g, "+").replace(/_/g, "/"))
      ) as { exp?: number; email?: string; username?: string };

      if (!raw.exp) return;
      const username = raw.email ?? raw.username;
      if (!username) return;

      async function doRefresh() {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });
        if (cancelled) return;
        if (!res.ok) { logout(); return; }
        const data = (await res.json()) as { token?: string };
        if (data.token) setToken(data.token);
        else logout();
      }

      const msUntilRefresh = raw.exp * 1000 - Date.now() - 60_000; // 60s before expiry
      if (msUntilRefresh <= 0) {
        void doRefresh();
        return;
      }

      const id = setTimeout(() => void doRefresh(), msUntilRefresh);
      return () => {
        cancelled = true;
        clearTimeout(id);
      };
    } catch { /* ignore malformed token */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function setDisplayName(name: string | null) {
    if (name) {
      localStorage.setItem("togeda_display_name", name);
    } else {
      localStorage.removeItem("togeda_display_name");
    }
    setDisplayNameState(name);
  }

  function setToken(t: string | null) {
    if (t) {
      localStorage.setItem("togeda_token", t);
      setUser(decodeJwtPayload(t));
      const name = localStorage.getItem("togeda_display_name");
      if (name) setDisplayNameState(name);
    } else {
      localStorage.removeItem("togeda_token");
      localStorage.removeItem("togeda_display_name");
      setUser(null);
      setDisplayNameState(null);
    }
    setTokenState(t);
  }

  function logout() {
    localStorage.removeItem("togeda_joined_events");
    localStorage.removeItem("togeda_pending_email");
    localStorage.removeItem("togeda_pending_password");
    setToken(null);
    void fetch("/api/auth/logout", { method: "POST" });
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        displayName,
        isAuthenticated: !!token && !!user,
        setToken,
        setDisplayName,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
