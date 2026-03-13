import { env } from "~/env.js";
import { getServiceToken } from "./auth";

// ── Shared types ─────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  profilePhotos: string[];
  occupation: string;
  location: Location;
  birthDate: string;
  isDeleted: boolean;
  userRole: string;
}

export interface Location {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface Interest {
  name: string;
  icon: string;
  category: string;
}

export interface Currency {
  name: string;
  symbol: string;
  code: string;
}

// ── Event (Post) ──────────────────────────────────────────────────────────────

export interface Event {
  id: string;
  title: string;
  images: string[];
  description: string;
  maximumPeople: number;
  location: Location;
  toDate: string;
  fromDate: string;
  createdAt: string;
  interests: Interest[];
  owner: UserProfile;
  payment: number;
  currency: Currency;
  currentUserStatus: string;
  currentUserRole: string;
  accessibility: "PUBLIC" | "PRIVATE";
  askToJoin: boolean;
  participantsCount: number;
  status: string;
  hasTickets: boolean;
  clubId: string | null;
  rating: number;
}

// ── Club ──────────────────────────────────────────────────────────────────────

export interface Club {
  id: string;
  owner: UserProfile;
  title: string;
  images: string[];
  description: string;
  location: Location;
  accessibility: "PUBLIC" | "PRIVATE";
  askToJoin: boolean;
  currentUserStatus: string;
  currentUserRole: string;
  interests: Interest[];
  memories: string[];
  membersCount: number;
  previewMembers: UserProfile[];
  createdAt: string;
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string): Promise<T> {
  const token = await getServiceToken();
  const response = await fetch(`${env.BACKEND_URL}${path}`, {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const err = new Error(`API ${path} failed: ${response.status} ${body}`);
    (err as NodeJS.ErrnoException).code = String(response.status);
    throw err;
  }

  return response.json() as Promise<T>;
}

export function fetchEvent(id: string): Promise<Event> {
  return apiFetch<Event>(`/posts/${id}`);
}

export async function fetchEventParticipants(id: string, pageSize = 20): Promise<UserProfile[]> {
  const res = await apiFetch<{ data: { user: UserProfile }[] }>(
    `/posts/${id}/participants?pageNumber=0&pageSize=${pageSize}`
  );
  return (res.data ?? []).map((entry) => entry.user);
}

export function fetchClub(id: string): Promise<Club> {
  return apiFetch<Club>(`/clubs/${id}`);
}

export async function fetchClubMembers(id: string, pageSize = 20): Promise<UserProfile[]> {
  const res = await apiFetch<{ data: { user: UserProfile }[] }>(
    `/clubs/${id}/members?pageNumber=0&pageSize=${pageSize}`
  );
  return (res.data ?? []).map((entry) => entry.user);
}
