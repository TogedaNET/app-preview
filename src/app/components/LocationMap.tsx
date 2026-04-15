"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

interface Props {
  lat: number;
  lon: number;
  askToJoin: boolean;
  id: string;
  type: "event" | "club";
  apiKey: string | undefined;
}

export default function LocationMap({ lat, lon, askToJoin, id, type, apiKey }: Props) {
  const { isAuthenticated, token } = useAuth();
  const [isParticipant, setIsParticipant] = useState(false);

  useEffect(() => {
    if (!askToJoin) return; // No need to fetch — exact map is always shown
    if (!isAuthenticated || !token) return;

    const url =
      type === "event"
        ? `/api/event-status?postId=${id}`
        : `/api/club-status?clubId=${id}`;

    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json() as Promise<{ currentUserStatus?: string; currentUserRole?: string }>)
      .then((data) => {
        const status = data.currentUserStatus ?? "";
        const role = data.currentUserRole ?? "";
        setIsParticipant(
          status === "PARTICIPATING" || role === "HOST" || role === "CO_HOST" || role === "ADMIN",
        );
      })
      .catch(() => undefined);
  }, [askToJoin, id, type, isAuthenticated, token]);

  const showExact = !askToJoin || isParticipant;

  const embedSrc = showExact
    ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lon}&zoom=15`
    : `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${lat},${lon}&zoom=13`;

  // Directions: coordinates pin the exact spot; Google Maps reverse-geocodes to show the street name
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;

  const iframe = (
    <iframe
      src={embedSrc}
      title="Location map"
      className="h-48 w-full rounded-xl border-0 opacity-90"
      loading="lazy"
      allowFullScreen
    />
  );

  if (showExact) {
    return (
      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block cursor-pointer overflow-hidden rounded-xl"
        aria-label="Open in Google Maps"
      >
        {iframe}
      </a>
    );
  }

  return <div className="overflow-hidden rounded-xl">{iframe}</div>;
}
