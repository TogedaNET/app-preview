"use client";

import { useState } from "react";
import { StoreModal } from "./JoinCTA";

export default function HostRow({
  name,
  photo,
  type,
  label = "Host of the event",
}: {
  name: string;
  photo?: string;
  type: "event" | "club";
  label?: string;
}) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="flex w-full items-center gap-3 text-left transition-opacity hover:opacity-80 active:opacity-60"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center text-stone-400">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.563.563 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
          </svg>
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{name}</p>
          <p className="text-xs text-stone-400">{label}</p>
        </div>
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={name}
            className="h-9 w-9 shrink-0 rounded-full object-cover border border-white/10"
          />
        )}
      </button>
      {showModal && <StoreModal type={type} variant="explore" onClose={() => setShowModal(false)} />}
    </>
  );
}
