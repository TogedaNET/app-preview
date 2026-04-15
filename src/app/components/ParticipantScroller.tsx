"use client";

import { useState } from "react";
import type { UserProfile } from "../../lib/api";
import { StoreModal } from "./JoinCTA";

function Avatar({ p, size = 14, onClick }: { p: UserProfile; size?: number; onClick: () => void }) {
  const photo = (p.profilePhotos ?? [])[0];
  const name = `${p.firstName} ${p.lastName}`;
  const px = size * 4;

  return (
    <button type="button" onClick={onClick} className="shrink-0 cursor-pointer transition-opacity hover:opacity-80 active:opacity-60">
      {photo ? (
        <img
          src={photo}
          alt={name}
          title={name}
          loading="lazy"
          className="rounded-full border-2 border-white/10 object-cover shadow-md"
          style={{ width: px, height: px }}
        />
      ) : (
        <div
          title={name}
          className="flex items-center justify-center rounded-full border-2 border-white/10 bg-gradient-to-br from-stone-600 to-stone-800 font-bold text-white shadow-md"
          style={{ width: px, height: px, fontSize: px * 0.35 }}
        >
          {p.firstName?.[0] ?? "?"}
        </div>
      )}
    </button>
  );
}

// Minimum avatars per group to guarantee a dense, full-looking row.
const MIN_GROUP_SIZE = 12;

function tile(items: UserProfile[]): UserProfile[] {
  if (items.length === 0) return [];
  const times = Math.max(2, Math.ceil(MIN_GROUP_SIZE / items.length));
  return Array.from({ length: times }, () => items).flat();
}

function MarqueeRow({
  items,
  speed,
  onAvatarClick,
}: {
  items: UserProfile[];
  speed: "normal" | "slow";
  onAvatarClick: () => void;
}) {
  const group = tile(items);

  return (
    <div
      className="overflow-hidden"
      style={{
        maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
      }}
    >
      <div className={`flex w-max ${speed === "slow" ? "animate-marquee-slow" : "animate-marquee"}`}>
        {[0, 1].map((gi) => (
          <div key={gi} className="flex shrink-0 gap-4 pr-4">
            {group.map((p, i) => (
              <Avatar key={`${p.id}-${gi}-${i}`} p={p} onClick={onAvatarClick} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ParticipantScroller({
  participants,
  count,
  type,
}: {
  participants: UserProfile[];
  count: number;
  type: "event" | "club";
}) {
  const [showModal, setShowModal] = useState(false);
  const SCROLL_THRESHOLD = 10;

  if (participants.length === 0) {
    return (
      <p className="text-sm text-stone-400">
        <span className="font-semibold text-white">{count}</span> going
      </p>
    );
  }

  return (
    <>
      {count <= SCROLL_THRESHOLD ? (
        <div className="flex flex-wrap gap-3">
          {participants.map((p, i) => (
            <Avatar key={p.id ?? i} p={p} onClick={() => setShowModal(true)} />
          ))}
          {count > participants.length && (
            <div
              className="flex shrink-0 items-center justify-center rounded-full border-2 border-white/10 bg-stone-700 text-sm font-semibold text-stone-300 shadow-md"
              style={{ width: 56, height: 56 }}
            >
              +{count - participants.length}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <MarqueeRow items={participants.slice(0, Math.ceil(participants.length / 2))} speed="normal" onAvatarClick={() => setShowModal(true)} />
          <MarqueeRow items={participants.slice(Math.ceil(participants.length / 2))} speed="slow" onAvatarClick={() => setShowModal(true)} />
        </div>
      )}
      {showModal && <StoreModal type={type} variant="explore" onClose={() => setShowModal(false)} />}
    </>
  );
}
