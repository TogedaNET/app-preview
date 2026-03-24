"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "./AuthContext";

interface Interest {
  name: string;
  icon: string;
  category: string;
}

interface Location {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface ProfileData {
  firstName: string;
  lastName: string;
  gender: string;
  birthDate: string;
  location: Location;
  interests: Interest[];
}

type Screen =
  | "welcome"
  | "login"
  | "register"
  | "verify"
  | "googleProfile"
  | "joining"
  | "success"
  | "error";

interface Props {
  type: "event" | "club";
  id: string;
  interests: Interest[];
  location: Location;
  onClose: () => void;
  initialScreen?: Screen;
}

// ── Validation ────────────────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function passwordChecks(pw: string) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[\^$*.[\]{}()?\-"!@#%&/\\,><':;|_~+=]/.test(pw),
    noSpace: !/\s/.test(pw),
  };
}

function isValidPassword(pw: string): boolean {
  return Object.values(passwordChecks(pw)).every(Boolean);
}

function containsOnlyLetters(s: string): boolean {
  return /^[\p{L}\s]+$/u.test(s);
}

function isValidName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 3 && containsOnlyLetters(trimmed);
}

function validDate(day: string, month: string, year: string): boolean {
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return false;
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  );
}

function hasAge18(day: string, month: string, year: string): boolean {
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  const birth = new Date(y, m - 1, d);
  const now = new Date();
  const age18 = new Date(birth.getFullYear() + 18, birth.getMonth(), birth.getDate());
  return now >= age18;
}

function validAge(day: string, month: string, year: string): boolean {
  const y = parseInt(year, 10);
  const currentYear = new Date().getFullYear();
  return y >= currentYear - 120;
}

// ── Geolocation ───────────────────────────────────────────────────────────────

async function getUserLocation(): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    const timer = setTimeout(() => resolve(null), 5000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
      { timeout: 5000 }
    );
  });
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-16 w-16">
      <circle cx="12" cy="12" r="11" fill="#22c55e" opacity="0.2" />
      <circle cx="12" cy="12" r="11" stroke="#22c55e" strokeWidth="1.5" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        stroke="#22c55e"
        d="m7.5 12 3 3 6-6"
      />
    </svg>
  );
}

function ErrorCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-16 w-16">
      <circle cx="12" cy="12" r="11" fill="#ef4444" opacity="0.2" />
      <circle cx="12" cy="12" r="11" stroke="#ef4444" strokeWidth="1.5" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        stroke="#ef4444"
        d="M15 9l-6 6M9 9l6 6"
      />
    </svg>
  );
}

function EnvelopeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-14 w-14 text-white/70" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

// ── Shared form input styles ─────────────────────────────────────────────────

const inputCls =
  "w-full rounded-xl bg-white/8 border border-white/10 px-4 py-3 text-sm text-white placeholder-stone-500 outline-none focus:border-white/30 focus:bg-white/10 transition-colors";

const labelCls = "block text-xs font-medium text-stone-400 mb-1.5";

const errorCls = "mt-1 text-xs text-red-400";

// ── Main component ────────────────────────────────────────────────────────────

export default function AuthModal({
  type,
  id,
  interests,
  location,
  onClose,
  initialScreen,
}: Props) {
  const { setToken } = useAuth();
  const noun = type === "event" ? "event" : "club";

  const [screen, setScreen] = useState<Screen>(initialScreen ?? "welcome");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);

  const [regForm, setRegForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    day: "",
    month: "",
    year: "",
    gender: "",
  });
  const [regErrors, setRegErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    day: "",
    month: "",
    year: "",
    gender: "",
  });
  const [showRegPw, setShowRegPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [verifyCode, setVerifyCode] = useState("");

  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    day: "",
    month: "",
    year: "",
    gender: "",
  });
  const [profileErrors, setProfileErrors] = useState({
    firstName: "",
    lastName: "",
    day: "",
    month: "",
    year: "",
    gender: "",
  });

  const [successType, setSuccessType] = useState<"joined" | "requested" | "already">("joined");

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // ── Join action ──────────────────────────────────────────────────────────────

  async function performJoin(token: string) {
    setScreen("joining");
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, id }),
      });
      if (res.ok) {
        setSuccessType("joined");
        setScreen("success");
      } else if (res.status === 409) {
        setSuccessType("already");
        setScreen("success");
      } else {
        const d = (await res.json()) as { error?: string };
        setError(d.error ?? "Failed to join");
        setScreen("error");
      }
    } catch {
      setError("Network error. Please try again.");
      setScreen("error");
    }
  }

  // ── Google sign-in ───────────────────────────────────────────────────────────

  function handleGoogleSignIn() {
    const callbackUrl = window.location.origin + "/auth/callback";
    const returnTo = window.location.pathname + window.location.search;
    localStorage.setItem("togeda_return_to", returnTo);
    localStorage.setItem("togeda_pending_join", JSON.stringify({ type, id }));
    const url = new URL(
      "https://togeda-main.auth.eu-central-1.amazoncognito.com/oauth2/authorize"
    );
    url.searchParams.set("client_id", "1056r625pmmd5cieos665rceii");
    url.searchParams.set("response_type", "token");
    url.searchParams.set("scope", "aws.cognito.signin.user.admin email openid phone");
    url.searchParams.set("identity_provider", "Google");
    url.searchParams.set("redirect_uri", callbackUrl);
    window.location.href = url.toString();
  }

  // ── Check Google user profile ─────────────────────────────────────────────

  async function checkGoogleUserProfile() {
    const token = localStorage.getItem("togeda_token");
    if (!token) {
      setScreen("welcome");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setToken(token);
      await performJoin(token);
    } else if (res.status === 404) {
      setLoading(false);
    } else {
      setLoading(false);
      setError("Failed to verify your account.");
    }
  }

  // ── Login ────────────────────────────────────────────────────────────────────

  async function handleLogin() {
    setError("");
    if (!isValidEmail(loginEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!loginPassword) {
      setError("Please enter your password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = (await res.json()) as { success?: boolean; token?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        setLoading(false);
        return;
      }
      setToken(data.token!);
      await performJoin(data.token!);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  // ── Register ─────────────────────────────────────────────────────────────────

  function validateRegForm(): boolean {
    const errors = {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      day: "",
      month: "",
      year: "",
      gender: "",
    };
    let valid = true;

    if (!isValidEmail(regForm.email)) {
      errors.email = "Enter a valid email address.";
      valid = false;
    }
    if (!isValidPassword(regForm.password)) {
      errors.password = "Password does not meet requirements.";
      valid = false;
    }
    if (regForm.password !== regForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
      valid = false;
    }
    if (!isValidName(regForm.firstName)) {
      errors.firstName = "First name must be at least 3 letters.";
      valid = false;
    }
    if (!isValidName(regForm.lastName)) {
      errors.lastName = "Last name must be at least 3 letters.";
      valid = false;
    }
    if (!validDate(regForm.day, regForm.month, regForm.year)) {
      errors.day = "Enter a valid date.";
      valid = false;
    } else if (!validAge(regForm.day, regForm.month, regForm.year)) {
      errors.year = "Year is out of range.";
      valid = false;
    } else if (!hasAge18(regForm.day, regForm.month, regForm.year)) {
      errors.day = "You must be at least 18 years old.";
      valid = false;
    }
    if (!regForm.gender) {
      errors.gender = "Please select a gender.";
      valid = false;
    }

    setRegErrors(errors);
    return valid;
  }

  async function handleRegister() {
    if (!validateRegForm()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regForm.email, password: regForm.password }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string; code?: string };
      if (!res.ok) {
        setError(data.error ?? "Registration failed.");
        setLoading(false);
        return;
      }
      setScreen("verify");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Verify ───────────────────────────────────────────────────────────────────

  async function handleVerify() {
    if (verifyCode.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const geo = await getUserLocation();
      const loc: Location = {
        ...location,
        latitude: geo?.lat ?? location.latitude,
        longitude: geo?.lon ?? location.longitude,
      };

      const d = parseInt(regForm.day, 10);
      const m = parseInt(regForm.month, 10);
      const y = parseInt(regForm.year, 10);
      const birthDate = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

      const profile: ProfileData = {
        firstName: regForm.firstName.trim(),
        lastName: regForm.lastName.trim(),
        gender: regForm.gender,
        birthDate,
        location: loc,
        interests,
      };

      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: regForm.email,
          password: regForm.password,
          code: verifyCode,
          profile,
        }),
      });
      const data = (await res.json()) as { success?: boolean; token?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Verification failed.");
        setLoading(false);
        return;
      }
      setToken(data.token!);
      await performJoin(data.token!);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  async function handleResendCode() {
    try {
      await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regForm.email }),
      });
    } catch {
      // silently ignore
    }
  }

  // ── Google Profile ────────────────────────────────────────────────────────────

  function validateProfileForm(): boolean {
    const errors = {
      firstName: "",
      lastName: "",
      day: "",
      month: "",
      year: "",
      gender: "",
    };
    let valid = true;

    if (!isValidName(profileForm.firstName)) {
      errors.firstName = "First name must be at least 3 letters.";
      valid = false;
    }
    if (!isValidName(profileForm.lastName)) {
      errors.lastName = "Last name must be at least 3 letters.";
      valid = false;
    }
    if (!validDate(profileForm.day, profileForm.month, profileForm.year)) {
      errors.day = "Enter a valid date.";
      valid = false;
    } else if (!validAge(profileForm.day, profileForm.month, profileForm.year)) {
      errors.year = "Year is out of range.";
      valid = false;
    } else if (!hasAge18(profileForm.day, profileForm.month, profileForm.year)) {
      errors.day = "You must be at least 18 years old.";
      valid = false;
    }
    if (!profileForm.gender) {
      errors.gender = "Please select a gender.";
      valid = false;
    }

    setProfileErrors(errors);
    return valid;
  }

  async function handleGoogleProfileSubmit() {
    if (!validateProfileForm()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("togeda_token");
      if (!token) {
        setScreen("welcome");
        return;
      }

      const geo = await getUserLocation();
      const loc: Location = {
        ...location,
        latitude: geo?.lat ?? location.latitude,
        longitude: geo?.lon ?? location.longitude,
      };

      const d = parseInt(profileForm.day, 10);
      const m = parseInt(profileForm.month, 10);
      const y = parseInt(profileForm.year, 10);
      const birthDate = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

      const profileData: ProfileData = {
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        gender: profileForm.gender,
        birthDate,
        location: loc,
        interests,
      };

      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to save profile.");
        setLoading(false);
        return;
      }

      setToken(token);
      await performJoin(token);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  // ── Render screens ────────────────────────────────────────────────────────────

  function renderContent() {
    switch (screen) {
      case "welcome":
        return WelcomeScreen();
      case "login":
        return LoginScreen();
      case "register":
        return RegisterScreen();
      case "verify":
        return VerifyScreen();
      case "googleProfile":
        return GoogleProfileScreen();
      case "joining":
        return JoiningScreen();
      case "success":
        return SuccessScreen();
      case "error":
        return ErrorScreen();
    }
  }

  function WelcomeScreen() {
    return (
      <div className="p-6 pb-8">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/togeda-logo.png" alt="Togeda" className="h-10 w-10 rounded-2xl" />
            <h2 className="text-lg font-bold text-white">Join this {noun}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleGoogleSignIn}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-stone-900 hover:bg-stone-100 transition-colors"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-stone-500">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setScreen("login")}
              className="rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white hover:bg-white/8 transition-colors"
            >
              Log in
            </button>
            <button
              onClick={() => setScreen("register")}
              className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-stone-900 hover:bg-stone-100 transition-colors"
            >
              Create account
            </button>
          </div>
        </div>
      </div>
    );
  }

  function LoginScreen() {
    return (
      <div className="p-6 pb-8">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => setScreen("welcome")}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h2 className="text-lg font-bold text-white">Welcome back</h2>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className={labelCls}>Email</label>
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputCls}
              onKeyDown={(e) => e.key === "Enter" && void handleLogin()}
            />
          </div>

          <div>
            <label className={labelCls}>Password</label>
            <div className="relative">
              <input
                type={showLoginPw ? "text" : "password"}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Your password"
                className={inputCls + " pr-12"}
                onKeyDown={(e) => e.key === "Enter" && void handleLogin()}
              />
              <button
                type="button"
                onClick={() => setShowLoginPw(!showLoginPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white transition-colors"
              >
                {showLoginPw ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            onClick={() => void handleLogin()}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-stone-900 hover:bg-stone-100 transition-colors disabled:opacity-50"
          >
            {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-400 border-t-stone-900" />}
            Log in
          </button>

          <p className="text-center text-xs text-stone-500">
            Don&apos;t have an account?{" "}
            <button
              onClick={() => setScreen("register")}
              className="text-white underline hover:no-underline"
            >
              Register
            </button>
          </p>
        </div>
      </div>
    );
  }

  function RegisterScreen() {
    const checks = passwordChecks(regForm.password);
    const checkItems: [keyof typeof checks, string][] = [
      ["length", "8+ characters"],
      ["upper", "Uppercase letter"],
      ["lower", "Lowercase letter"],
      ["number", "Number"],
      ["special", "Special character"],
      ["noSpace", "No spaces"],
    ];

    return (
      <div className="p-6 pb-8">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => setScreen("welcome")}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h2 className="text-lg font-bold text-white">Create your account</h2>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className={labelCls}>Email</label>
            <input
              type="email"
              value={regForm.email}
              onChange={(e) => setRegForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="you@example.com"
              className={inputCls}
            />
            {regErrors.email && <p className={errorCls}>{regErrors.email}</p>}
          </div>

          <div>
            <label className={labelCls}>Password</label>
            <div className="relative">
              <input
                type={showRegPw ? "text" : "password"}
                value={regForm.password}
                onChange={(e) => setRegForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Create a password"
                className={inputCls + " pr-12"}
              />
              <button
                type="button"
                onClick={() => setShowRegPw(!showRegPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white transition-colors"
              >
                {showRegPw ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
            {regErrors.password && <p className={errorCls}>{regErrors.password}</p>}
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
              {checkItems.map(([key, label]) => (
                <span key={key} className="flex items-center gap-1 text-xs">
                  <span className={`h-1.5 w-1.5 rounded-full ${checks[key] ? "bg-green-400" : "bg-stone-500"}`} />
                  <span className={checks[key] ? "text-green-400" : "text-stone-500"}>{label}</span>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>Confirm password</label>
            <div className="relative">
              <input
                type={showConfirmPw ? "text" : "password"}
                value={regForm.confirmPassword}
                onChange={(e) => setRegForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="Repeat your password"
                className={inputCls + " pr-12"}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw(!showConfirmPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white transition-colors"
              >
                {showConfirmPw ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
            {regErrors.confirmPassword && <p className={errorCls}>{regErrors.confirmPassword}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>First name</label>
              <input
                type="text"
                value={regForm.firstName}
                onChange={(e) => setRegForm((f) => ({ ...f, firstName: e.target.value }))}
                placeholder="First name"
                className={inputCls}
              />
              {regErrors.firstName && <p className={errorCls}>{regErrors.firstName}</p>}
            </div>
            <div>
              <label className={labelCls}>Last name</label>
              <input
                type="text"
                value={regForm.lastName}
                onChange={(e) => setRegForm((f) => ({ ...f, lastName: e.target.value }))}
                placeholder="Last name"
                className={inputCls}
              />
              {regErrors.lastName && <p className={errorCls}>{regErrors.lastName}</p>}
            </div>
          </div>

          <div>
            <label className={labelCls}>Birthday</label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={regForm.day}
                onChange={(e) => setRegForm((f) => ({ ...f, day: e.target.value }))}
                placeholder="DD"
                maxLength={2}
                inputMode="numeric"
                className={inputCls + " text-center"}
              />
              <input
                type="text"
                value={regForm.month}
                onChange={(e) => setRegForm((f) => ({ ...f, month: e.target.value }))}
                placeholder="MM"
                maxLength={2}
                inputMode="numeric"
                className={inputCls + " text-center"}
              />
              <input
                type="text"
                value={regForm.year}
                onChange={(e) => setRegForm((f) => ({ ...f, year: e.target.value }))}
                placeholder="YYYY"
                maxLength={4}
                inputMode="numeric"
                className={inputCls + " text-center"}
              />
            </div>
            {regErrors.day && <p className={errorCls}>{regErrors.day}</p>}
            {regErrors.year && <p className={errorCls}>{regErrors.year}</p>}
          </div>

          <div>
            <label className={labelCls}>Gender</label>
            <select
              value={regForm.gender}
              onChange={(e) => setRegForm((f) => ({ ...f, gender: e.target.value }))}
              className={inputCls}
            >
              <option value="" disabled>Select gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
              <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
            </select>
            {regErrors.gender && <p className={errorCls}>{regErrors.gender}</p>}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            onClick={() => void handleRegister()}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-stone-900 hover:bg-stone-100 transition-colors disabled:opacity-50"
          >
            {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-400 border-t-stone-900" />}
            Create account
          </button>
        </div>
      </div>
    );
  }

  function VerifyScreen() {
    return (
      <div className="p-6 pb-8">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <EnvelopeIcon />
          <div>
            <h2 className="text-lg font-bold text-white">Check your email</h2>
            <p className="mt-1 text-sm text-stone-400">
              We sent a 6-digit code to{" "}
              <span className="font-medium text-white">{regForm.email}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            inputMode="numeric"
            className={inputCls + " text-center text-2xl tracking-[0.5em] font-bold"}
            onKeyDown={(e) => e.key === "Enter" && void handleVerify()}
          />

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <button
            onClick={() => void handleVerify()}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-stone-900 hover:bg-stone-100 transition-colors disabled:opacity-50"
          >
            {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-400 border-t-stone-900" />}
            Verify
          </button>

          <p className="text-center text-xs text-stone-500">
            Didn&apos;t receive a code?{" "}
            <button
              onClick={() => void handleResendCode()}
              className="text-white underline hover:no-underline"
            >
              Resend
            </button>
          </p>
        </div>
      </div>
    );
  }

  function GoogleProfileScreen() {
    useEffect(() => {
      void checkGoogleUserProfile();
    }, []);

    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 p-10">
          <SpinnerIcon />
          <p className="text-sm text-stone-400">Loading…</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-6 text-center">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      );
    }

    return (
      <div className="p-6 pb-8">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white">Just a few details</h2>
          <p className="mt-1 text-sm text-stone-400">
            Tell us about yourself to complete your account
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>First name</label>
              <input
                type="text"
                value={profileForm.firstName}
                onChange={(e) => setProfileForm((f) => ({ ...f, firstName: e.target.value }))}
                placeholder="First name"
                className={inputCls}
              />
              {profileErrors.firstName && <p className={errorCls}>{profileErrors.firstName}</p>}
            </div>
            <div>
              <label className={labelCls}>Last name</label>
              <input
                type="text"
                value={profileForm.lastName}
                onChange={(e) => setProfileForm((f) => ({ ...f, lastName: e.target.value }))}
                placeholder="Last name"
                className={inputCls}
              />
              {profileErrors.lastName && <p className={errorCls}>{profileErrors.lastName}</p>}
            </div>
          </div>

          <div>
            <label className={labelCls}>Birthday</label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={profileForm.day}
                onChange={(e) => setProfileForm((f) => ({ ...f, day: e.target.value }))}
                placeholder="DD"
                maxLength={2}
                inputMode="numeric"
                className={inputCls + " text-center"}
              />
              <input
                type="text"
                value={profileForm.month}
                onChange={(e) => setProfileForm((f) => ({ ...f, month: e.target.value }))}
                placeholder="MM"
                maxLength={2}
                inputMode="numeric"
                className={inputCls + " text-center"}
              />
              <input
                type="text"
                value={profileForm.year}
                onChange={(e) => setProfileForm((f) => ({ ...f, year: e.target.value }))}
                placeholder="YYYY"
                maxLength={4}
                inputMode="numeric"
                className={inputCls + " text-center"}
              />
            </div>
            {profileErrors.day && <p className={errorCls}>{profileErrors.day}</p>}
            {profileErrors.year && <p className={errorCls}>{profileErrors.year}</p>}
          </div>

          <div>
            <label className={labelCls}>Gender</label>
            <select
              value={profileForm.gender}
              onChange={(e) => setProfileForm((f) => ({ ...f, gender: e.target.value }))}
              className={inputCls}
            >
              <option value="" disabled>Select gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
              <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
            </select>
            {profileErrors.gender && <p className={errorCls}>{profileErrors.gender}</p>}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            onClick={() => void handleGoogleProfileSubmit()}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-stone-900 hover:bg-stone-100 transition-colors disabled:opacity-50"
          >
            {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-400 border-t-stone-900" />}
            Complete Profile
          </button>
        </div>
      </div>
    );
  }

  function JoiningScreen() {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-10">
        <SpinnerIcon />
        <p className="text-sm text-stone-400">Joining…</p>
      </div>
    );
  }

  function SuccessScreen() {
    const headline = successType === "requested" ? "Request sent!" : "You're in!";
    let subtext: string;
    if (successType === "joined") {
      subtext = `You've successfully joined this ${noun}.`;
    } else if (successType === "requested") {
      subtext = "Your join request has been sent. The host will review it.";
    } else {
      subtext = `You're already a member of this ${noun}.`;
    }

    return (
      <div className="flex flex-col items-center gap-5 p-8 text-center">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
        <CheckCircleIcon />
        <div>
          <h2 className="text-xl font-bold text-white">{headline}</h2>
          <p className="mt-2 text-sm text-stone-400">{subtext}</p>
        </div>
        <button
          onClick={onClose}
          className="w-full rounded-xl bg-white py-3 text-sm font-bold text-stone-900 hover:bg-stone-100 transition-colors"
        >
          Done
        </button>
      </div>
    );
  }

  function ErrorScreen() {
    return (
      <div className="flex flex-col items-center gap-5 p-8 text-center">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
        <ErrorCircleIcon />
        <div>
          <h2 className="text-xl font-bold text-white">Something went wrong</h2>
          <p className="mt-2 text-sm text-stone-400">{error}</p>
        </div>
        <button
          onClick={() => { setError(""); setScreen("welcome"); }}
          className="w-full rounded-xl bg-white py-3 text-sm font-bold text-stone-900 hover:bg-stone-100 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-sm overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-stone-900 border border-white/10 shadow-2xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {renderContent()}
      </div>
    </div>,
    document.body
  );
}
