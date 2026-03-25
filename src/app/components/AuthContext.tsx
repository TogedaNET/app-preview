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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [displayName, setDisplayNameState] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("togeda_token");
    if (stored) {
      const decoded = decodeJwtPayload(stored);
      if (decoded) {
        setTokenState(stored);
        setUser(decoded);
      } else {
        localStorage.removeItem("togeda_token");
      }
    }
    const name = localStorage.getItem("togeda_display_name");
    if (name) setDisplayNameState(name);
  }, []);

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
    setToken(null);
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
