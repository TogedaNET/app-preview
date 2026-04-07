"use client";

import { useGoogleLogin } from "@react-oauth/google";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
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
  visibleGender: boolean;
  birthDate: string;
  occupation: string;
  phoneNumber: string;
  location: Location;
  interests: Interest[];
  profilePhotos: string[];
  subToEmail: boolean;
  referralCodeUsed: string;
}

type Screen =
  | "welcome"
  | "login"
  | "register"
  | "registerDetails"
  | "verify"
  | "googleProfile"
  | "joining"
  | "success"
  | "error";

interface Props {
  type?: "event" | "club";
  id?: string;
  onClose: () => void;
  onProfileCreated?: () => void;
  initialScreen?: Screen;
  required?: boolean;
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
  onClose,
  onProfileCreated,
  initialScreen,
  required = false,
}: Props) {
  const { setToken, setDisplayName, logout } = useAuth();
  const noun = type === "event" ? "event" : "club";
  const hasJoinContext = !!type && !!id;

  const loginWithGoogle = useGoogleLogin({
    flow: "auth-code",
    onSuccess: (codeResponse) => void handleGoogleCode(codeResponse.code),
    onError: () => {
      setLoading(false);
      setError("Google sign-in failed. Please try again.");
    },
  });

  const [screen, setScreen] = useState<Screen>(initialScreen ?? "welcome");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const regMonthRef = useRef<HTMLInputElement>(null);
  const regYearRef = useRef<HTMLInputElement>(null);
const photoInputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // ── Location autocomplete ─────────────────────────────────────────────────
  const [cityInput, setCityInput] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [regLocation, setRegLocation] = useState<{
    display: string;
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const cityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    visibleGender: true,
    occupation: "Work",
    phoneNumber: Array.from({ length: 15 }, () => Math.floor(Math.random() * 10)).join(""),
    photoUrl: "",
    subToEmail: true,
    referralCode: "",
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
    occupation: "",
    city: "",
  });
  const [showRegPw, setShowRegPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [verifyCode, setVerifyCode] = useState("");

  const [successType, setSuccessType] = useState<"joined" | "requested" | "already" | "ended">("joined");

  // Pre-fill email/password from localStorage when resuming a pending verification
  useEffect(() => {
    if (initialScreen === "verify") {
      const pendingEmail = localStorage.getItem("togeda_pending_email");
      const pendingPassword = localStorage.getItem("togeda_pending_password");
      if (pendingEmail ?? pendingPassword) {
        setRegForm((f) => ({
          ...f,
          email: pendingEmail ?? f.email,
          password: pendingPassword ?? f.password,
        }));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on Escape (disabled when required or on profile setup screens)
  useEffect(() => {
    if (required || screen === "registerDetails" || screen === "googleProfile") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, required, screen]);

  // Trigger Google profile check when that screen becomes active
  useEffect(() => {
    if (screen === "googleProfile") {
      void checkGoogleUserProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // ── Join action ──────────────────────────────────────────────────────────────

  async function performJoin(token: string) {
    if (!hasJoinContext) {
      setSuccessType("joined");
      setScreen("success");
      return;
    }
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
        const msg = (d.error ?? "").toLowerCase();
        if (msg.includes("started") || msg.includes("ended") || msg.includes("past") || msg.includes("expired")) {
          setSuccessType("ended");
          setScreen("success");
        } else {
          setError(d.error ?? "Failed to join");
          setScreen("error");
        }
      }
    } catch {
      setError("Network error. Please try again.");
      setScreen("error");
    }
  }

  // ── Google sign-in ───────────────────────────────────────────────────────────

  async function handleGoogleCode(code: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !data.token) {
        setError(data.error ?? "Google sign-in failed.");
        setLoading(false);
        return;
      }
      const authToken = data.token;
      localStorage.setItem("togeda_token", authToken);

      // Check profile while spinner is still showing — never flash the About You form
      const meRes = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (meRes.ok) {
        const profile = (await meRes.json()) as { firstName?: string };
        if (profile.firstName) {
          // Profile complete — log in directly, no About You
          localStorage.setItem("togeda_display_name", profile.firstName);
          setToken(authToken);
          await performJoin(authToken);
        } else {
          // Profile exists but incomplete — show About You
          setLoading(false);
          setScreen("googleProfile");
        }
      } else if (meRes.status === 404) {
        // No profile yet — show About You
        setLoading(false);
        setScreen("googleProfile");
      } else {
        setLoading(false);
        setError("Failed to verify your account.");
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
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
      const profile = (await res.json()) as { firstName?: string };
      if (profile.firstName) {
        // Profile complete — log in and proceed
        localStorage.setItem("togeda_display_name", profile.firstName);
        setToken(token);
        await performJoin(token);
      } else {
        // Profile record exists but firstName not filled yet — show About You
        setLoading(false);
      }
    } else if (res.status === 404) {
      // No profile at all — show About You
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
      const authToken = data.token!;
      // Check profile while spinner is still showing — same pattern as Google flow
      const meRes = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (meRes.ok) {
        const profile = (await meRes.json()) as { firstName?: string };
        if (profile.firstName) {
          // Profile complete — log in and proceed
          setDisplayName(profile.firstName);
          setToken(authToken);
          await performJoin(authToken);
        } else {
          // Profile exists but firstName not filled — show About You
          localStorage.setItem("togeda_token", authToken);
          setLoading(false);
          setScreen("registerDetails");
        }
      } else {
        // No profile yet (404) — show About You
        localStorage.setItem("togeda_token", authToken);
        setLoading(false);
        setScreen("registerDetails");
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  // ── Register ─────────────────────────────────────────────────────────────────

  function validateRegBasic(): boolean {
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
      occupation: "",
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

    setRegErrors(errors);
    return valid;
  }

  function validateRegDetails(): boolean {
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
      occupation: "",
      city: "",
    };
    let valid = true;

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
    if (!regForm.occupation.trim()) {
      errors.occupation = "Please enter your occupation.";
      valid = false;
    }
    if (!regLocation) {
      errors.city = "Please select your city.";
      valid = false;
    }

    setRegErrors(errors);
    return valid;
  }

  async function handleSignUp() {
    if (!validateRegBasic()) return;
    setError("");
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
      // Persist so we can resume after a page refresh
      localStorage.setItem("togeda_pending_email", regForm.email);
      localStorage.setItem("togeda_pending_password", regForm.password);
      setScreen("verify");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Google Places ────────────────────────────────────────────────────────────
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || autocompleteServiceRef.current) return;
    if (typeof google !== "undefined" && google.maps?.places) {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
      placesServiceRef.current = new google.maps.places.PlacesService(document.createElement("div"));
      return;
    }
    const existing = document.querySelector('script[src*="maps.googleapis.com"][src*="language=en"]');
    if (existing) {
      if (typeof google !== "undefined" && google.maps?.places) {
        autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
        placesServiceRef.current = new google.maps.places.PlacesService(document.createElement("div"));
      } else {
        existing.addEventListener("load", () => {
          autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
          placesServiceRef.current = new google.maps.places.PlacesService(document.createElement("div"));
        });
      }
      return;
    }
    // Remove any old script without language=en
    document.querySelectorAll('script[src*="maps.googleapis.com"]').forEach((s) => s.remove());
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=en`;
    script.async = true;
    script.onload = () => {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
      placesServiceRef.current = new google.maps.places.PlacesService(document.createElement("div"));
    };
    document.head.appendChild(script);
  }, []);

  // ── Auto-fill location from browser geolocation ──────────────────────────
  useEffect(() => {
    if (screen !== "registerDetails" && screen !== "googleProfile") return;
    if (regLocation) return;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      void fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`,
        { headers: { "User-Agent": "togeda-web-app" } }
      )
        .then((r) => r.json())
        .then((data: { address?: { city?: string; town?: string; village?: string; state?: string; country?: string }; display_name?: string }) => {
          const addr = data.address ?? {};
          const city = addr.city ?? addr.town ?? addr.village ?? "";
          const state = addr.state ?? "";
          const country = addr.country ?? "";
          if (!city) return;
          const display = [city, state, country].filter(Boolean).join(", ");
          setRegLocation({ display, name: city, address: display, city, state, country, latitude, longitude });
          setCityInput(display);
        });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  function handleCityInput(value: string) {
    setCityInput(value);
    if (regLocation) setRegLocation(null);
    if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current);
    if (!value.trim()) {
      setCitySuggestions([]);
      setCityDropdownOpen(false);
      return;
    }
    cityDebounceRef.current = setTimeout(() => {
      if (!autocompleteServiceRef.current) return;
      void autocompleteServiceRef.current.getPlacePredictions(
        { input: value, types: ["(cities)"] },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setCitySuggestions(predictions.slice(0, 4));
            setCityDropdownOpen(true);
          } else {
            setCitySuggestions([]);
            setCityDropdownOpen(false);
          }
        }
      );
    }, 500);
  }

  function handleCitySelect(prediction: google.maps.places.AutocompletePrediction) {
    if (!placesServiceRef.current) return;
    placesServiceRef.current.getDetails(
      { placeId: prediction.place_id, fields: ["address_components", "formatted_address", "geometry", "name"] },
      (place, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !place) return;
        let city = "";
        let state = "";
        let country = "";
        for (const comp of place.address_components ?? []) {
          if (comp.types.includes("locality") || comp.types.includes("postal_town")) city = comp.long_name;
          else if (comp.types.includes("administrative_area_level_1")) state = comp.long_name;
          else if (comp.types.includes("country")) country = comp.long_name;
        }
        if (!city) city = place.name ?? prediction.structured_formatting.main_text;
        const lat = place.geometry?.location?.lat() ?? 0;
        const lng = place.geometry?.location?.lng() ?? 0;
        const display = prediction.description;
        const name = place.name ?? city;
        const address = place.formatted_address ?? display;
        setRegLocation({ display, name, address, city, state, country, latitude: lat, longitude: lng });
        setCityInput(display);
        setCitySuggestions([]);
        setCityDropdownOpen(false);
      }
    );
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // allow re-picking the same file
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  }

  async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
    const image = new window.Image();
    image.src = imageSrc;
    await new Promise<void>((resolve) => { image.onload = () => resolve(); });
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 1000;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, 600, 1000);
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      }, "image/jpeg", 0.9);
    });
  }

  async function confirmCrop() {
    if (!cropSrc || !croppedAreaPixels) return;
    setCropSrc(null);
    setUploadingPhoto(true);
    try {
      const blob = await getCroppedBlob(cropSrc, croppedAreaPixels);
      const token = localStorage.getItem("togeda_token");
      const uuid = `WEB_${crypto.randomUUID()}`;

      const formData = new FormData();
      formData.append("file", blob, `${uuid}.jpeg`);
      formData.append("bucketName", "togeda-profile-photos");
      formData.append("keyName", uuid);

      const res = await fetch("/api/upload/presign", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        setError("Photo upload failed. Please try again.");
        return;
      }

      const { url } = (await res.json()) as { url: string };
      setRegForm((f) => ({ ...f, photoUrl: url }));
    } catch {
      setError("Photo upload failed. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleRegisterDetailsSubmit() {
    if (!validateRegDetails()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("togeda_token");
      if (!token) {
        setError("Session expired. Please start over.");
        setScreen("register");
        return;
      }

      const loc: Location = {
        name: regLocation?.name ?? "",
        address: regLocation?.address ?? "",
        city: regLocation?.city ?? "",
        state: regLocation?.state ?? "",
        country: regLocation?.country ?? "",
        latitude: regLocation?.latitude ?? 0,
        longitude: regLocation?.longitude ?? 0,
      };

      const d = parseInt(regForm.day, 10);
      const m = parseInt(regForm.month, 10);
      const y = parseInt(regForm.year, 10);
      const birthDate = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

      const profile: ProfileData = {
        firstName: regForm.firstName.trim(),
        lastName: regForm.lastName.trim(),
        gender: regForm.gender,
        visibleGender: regForm.visibleGender,
        birthDate,
        occupation: regForm.occupation.trim(),
        phoneNumber: regForm.phoneNumber.trim(),
        location: loc,
        interests: [
          { name: "Networking", icon: "🗣️", category: "social" },
          { name: "Events", icon: "📆", category: "social" },
          { name: "Traveling", icon: "✈️", category: "hobby" },
          { name: "Self-improvement", icon: "🗿", category: "hobby" },
          { name: "Reading", icon: "🤓", category: "hobby" },
        ],
        profilePhotos: regForm.photoUrl.trim()
          ? [regForm.photoUrl.trim()]
          : ["https://togeda-profile-photos.s3.eu-central-1.amazonaws.com/ChatGPT+Image+26.03.2026+%D0%B3.%2C+21_44_25.png"],
        subToEmail: regForm.subToEmail,
        referralCodeUsed: regForm.referralCode.trim(),
      };

      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to save profile.");
        setLoading(false);
        return;
      }

      localStorage.setItem("togeda_display_name", regForm.firstName.trim());
      setToken(token);
      onProfileCreated?.();
      await performJoin(token);
    } catch {
      setError("Network error. Please try again.");
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
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: regForm.email,
          password: regForm.password,
          code: verifyCode,
        }),
      });
      const data = (await res.json()) as { success?: boolean; token?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Verification failed.");
        setLoading(false);
        return;
      }

      const token = data.token!;
      localStorage.setItem("togeda_token", token);
      localStorage.removeItem("togeda_pending_email");
      localStorage.removeItem("togeda_pending_password");

      // Check if user already has a profile
      const meRes = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (meRes.ok) {
        const profile = (await meRes.json()) as { firstName?: string };
        if (profile.firstName) localStorage.setItem("togeda_display_name", profile.firstName);
        setToken(token);
        await performJoin(token);
      } else {
        // No profile yet — let them fill it in
        setLoading(false);
        setScreen("registerDetails");
      }
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

  // ── Render screens ────────────────────────────────────────────────────────────

  function renderContent() {
    switch (screen) {
      case "welcome":
        return WelcomeScreen();
      case "login":
        return LoginScreen();
      case "register":
        return RegisterScreen();
      case "registerDetails":
        return RegisterDetailsScreen();
      case "verify":
        return VerifyScreen();
      case "googleProfile":
        // While checkGoogleUserProfile is running (JoinCTA redirect case), show spinner
        if (loading) {
          return (
            <div className="flex flex-col items-center justify-center gap-4 p-12">
              <SpinnerIcon />
              <p className="text-sm text-stone-400">Checking your account…</p>
            </div>
          );
        }
        return RegisterDetailsScreen();
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
            <h2 className="text-lg font-bold text-white">{hasJoinContext ? `Join this ${noun}` : "Welcome to Togeda"}</h2>
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
            onClick={() => { setLoading(true); loginWithGoogle(); }}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-stone-900 hover:bg-stone-100 transition-colors disabled:opacity-60"
          >
            {loading
              ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-400 border-t-stone-900" />
              : <GoogleIcon />}
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
          {error && <p className="text-center text-sm text-red-400">{error}</p>}
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

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            onClick={() => void handleSignUp()}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-stone-900 hover:bg-stone-100 transition-colors disabled:opacity-50"
          >
            {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-400 border-t-stone-900" />}
            Continue
          </button>

          <p className="text-center text-xs text-stone-500">
            Already have an account?{" "}
            <button onClick={() => setScreen("login")} className="text-white underline hover:no-underline">
              Log in
            </button>
          </p>
        </div>
      </div>
    );
  }

  function RegisterDetailsScreen() {
    return (
      <div className="p-6 pb-8">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
        <div className="mb-6 flex items-center gap-3">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">About you</h2>
            <p className="text-xs text-stone-500">Almost done — just a few details</p>
          </div>
          {(required || screen === "googleProfile") && (
            <button
              onClick={() => { logout(); onClose(); }}
              className="text-xs text-stone-500 hover:text-white transition-colors"
            >
              Log out
            </button>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {/* Profile photo picker */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => !uploadingPhoto && photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="group relative w-24 overflow-hidden rounded-xl ring-2 ring-white/10 transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ aspectRatio: "9/12" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={regForm.photoUrl || "/default-profile-image.png"}
                alt="Profile photo"
                className="h-full w-full object-cover"
              />
              {uploadingPhoto ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-end justify-end p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5 text-stone-900">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                    </svg>
                  </div>
                </div>
              )}
            </button>
            <p className="text-xs text-stone-500">
              Profile photo <span className="text-stone-600">(optional)</span>
            </p>
            {regForm.photoUrl && (
              <button
                type="button"
                onClick={() => setRegForm((f) => ({ ...f, photoUrl: "" }))}
                className="text-xs text-stone-600 hover:text-stone-400 transition-colors"
              >
                Remove photo
              </button>
            )}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
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
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                  setRegForm((f) => ({ ...f, day: val }));
                  if (val.length === 2) regMonthRef.current?.focus();
                }}
                placeholder="DD"
                maxLength={2}
                inputMode="numeric"
                className={inputCls + " text-center"}
              />
              <input
                ref={regMonthRef}
                type="text"
                value={regForm.month}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                  setRegForm((f) => ({ ...f, month: val }));
                  if (val.length === 2) regYearRef.current?.focus();
                }}
                placeholder="MM"
                maxLength={2}
                inputMode="numeric"
                className={inputCls + " text-center"}
              />
              <input
                ref={regYearRef}
                type="text"
                value={regForm.year}
                onChange={(e) => setRegForm((f) => ({ ...f, year: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
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
            <div className="grid grid-cols-2 gap-2">
              {(["MALE", "FEMALE"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setRegForm((f) => ({ ...f, gender: g }))}
                  className={`rounded-xl border py-3 text-sm font-semibold transition-colors ${
                    regForm.gender === g
                      ? "border-white bg-white text-stone-900"
                      : "border-white/10 bg-white/5 text-stone-300 hover:bg-white/10"
                  }`}
                >
                  {g === "MALE" ? "Male" : "Female"}
                </button>
              ))}
            </div>
            {regErrors.gender && <p className={errorCls}>{regErrors.gender}</p>}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-stone-400">Show gender on profile</span>
              <button
                type="button"
                onClick={() => setRegForm((f) => ({ ...f, visibleGender: !f.visibleGender }))}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${regForm.visibleGender ? "bg-white" : "bg-white/20"}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-stone-900 transition-transform ${regForm.visibleGender ? "translate-x-4" : "translate-x-1"}`} />
              </button>
            </div>
          </div>

          <div>
            <label className={labelCls}>City</label>
            <div className="relative">
              <input
                ref={cityInputRef}
                type="text"
                value={cityInput}
                onChange={(e) => handleCityInput(e.target.value)}
                onBlur={() => setTimeout(() => setCityDropdownOpen(false), 150)}
                onFocus={() => { if (citySuggestions.length > 0) setCityDropdownOpen(true); }}
                placeholder="Search your city…"
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                className={inputCls + (regLocation ? " ring-1 ring-green-500/50" : "")}
              />
              {cityDropdownOpen && citySuggestions.length > 0 && (
                <ul className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-white/10 bg-stone-800 shadow-xl">
                  {citySuggestions.map((p) => (
                    <li key={p.place_id}>
                      <button
                        type="button"
                        onMouseDown={() => handleCitySelect(p)}
                        className="flex w-full flex-col px-4 py-2.5 text-left transition-colors hover:bg-white/8"
                      >
                        <span className="text-sm text-white">{p.structured_formatting.main_text}</span>
                        <span className="text-xs text-stone-500">{p.structured_formatting.secondary_text}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {regErrors.city && <p className={errorCls}>{regErrors.city}</p>}
          </div>

          <div>
            <label className={labelCls}>Occupation</label>
            <input
              type="text"
              value={regForm.occupation}
              onChange={(e) => setRegForm((f) => ({ ...f, occupation: e.target.value }))}
              placeholder="e.g. Software Engineer"
              className={inputCls}
            />
            {regErrors.occupation && <p className={errorCls}>{regErrors.occupation}</p>}
          </div>


          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">Email updates</p>
              <p className="text-xs text-stone-500">Receive news and activity alerts</p>
            </div>
            <button
              type="button"
              onClick={() => setRegForm((f) => ({ ...f, subToEmail: !f.subToEmail }))}
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${regForm.subToEmail ? "bg-white" : "bg-white/20"}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-stone-900 transition-transform ${regForm.subToEmail ? "translate-x-4" : "translate-x-1"}`} />
            </button>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            onClick={() => void handleRegisterDetailsSubmit()}
            disabled={loading || uploadingPhoto}
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
        {required && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => { localStorage.removeItem("togeda_pending_email"); localStorage.removeItem("togeda_pending_password"); onClose(); }}
              className="text-xs text-stone-500 hover:text-white transition-colors"
            >
              Log out
            </button>
          </div>
        )}
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

  function JoiningScreen() {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-10">
        <SpinnerIcon />
        <p className="text-sm text-stone-400">Joining…</p>
      </div>
    );
  }

  function SuccessScreen() {
    const headline =
      successType === "requested" ? "Request sent!" :
      successType === "ended" ? "You're signed in!" :
      "You're in!";
    let subtext: string;
    if (successType === "joined") {
      subtext = `You've successfully joined this ${noun}.`;
    } else if (successType === "requested") {
      subtext = "Your join request has been sent. The host will review it.";
    } else if (successType === "ended") {
      subtext = `This ${noun} has already taken place, but your account is ready. Look out for upcoming events!`;
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

  if (cropSrc) {
    return createPortal(
      <div className="fixed inset-0 z-[10000] flex flex-col bg-stone-950">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <button
            onClick={() => setCropSrc(null)}
            className="text-sm text-stone-400 transition-colors hover:text-white"
          >
            Cancel
          </button>
          <p className="text-sm font-semibold text-white">Crop Photo</p>
          <button
            onClick={() => void confirmCrop()}
            className="text-sm font-semibold text-white transition-colors hover:text-stone-300"
          >
            Done
          </button>
        </div>

        {/* Cropper */}
        <div className="relative flex-1">
          <Cropper
            image={cropSrc}
            crop={crop}
            zoom={zoom}
            aspect={600 / 1000}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
          />
        </div>

        {/* Zoom slider */}
        <div className="border-t border-white/10 px-6 py-4">
          <p className="mb-2 text-center text-xs text-stone-500">Pinch or drag to adjust</p>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-white"
          />
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center"
      onClick={(required || screen === "registerDetails" || screen === "googleProfile") ? undefined : onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-sm overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-stone-900 border border-white/10 shadow-2xl max-h-[90vh] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-stone-600 [&::-webkit-scrollbar-thumb:hover]:bg-stone-500"
        onClick={(e) => e.stopPropagation()}
      >
        {renderContent()}
      </div>
    </div>,
    document.body
  );
}
