"use client";

import type { UserProfile } from "../../lib/api";

function Avatar({ p, size = 14 }: { p: UserProfile; size?: number }) {
  const photo = (p.profilePhotos ?? [])[0];
  const name = `${p.firstName} ${p.lastName}`;
  const px = size * 4; // tailwind h-14 = 56px

  return photo ? (
    <img
      src={photo}
      alt={name}
      title={name}
      loading="lazy"
      className="shrink-0 rounded-full border-2 border-white/10 object-cover shadow-md"
      style={{ width: px, height: px }}
    />
  ) : (
    <div
      title={name}
      className="flex shrink-0 items-center justify-center rounded-full border-2 border-white/10 bg-gradient-to-br from-stone-600 to-stone-800 font-bold text-white shadow-md"
      style={{ width: px, height: px, fontSize: px * 0.35 }}
    >
      {p.firstName?.[0] ?? "?"}
    </div>
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
}: {
  items: UserProfile[];
  speed: "normal" | "slow";
}) {
  // Tile the items so each group always has MIN_GROUP_SIZE+ avatars.
  // Two separate groups each with a trailing gap (pr-4 = gap-4) so that
  // translateX(-50%) lands exactly at the start of the second group —
  // the seam gap matches every other gap, perfectly seamless.
  const group = tile(items);

  return (
    <div
      className="overflow-hidden"
      style={{
        maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
      }}
    >
      <div
        className={`flex w-max ${speed === "slow" ? "animate-marquee-slow" : "animate-marquee"}`}
      >
        {[0, 1].map((gi) => (
          <div key={gi} className="flex shrink-0 gap-4 pr-4">
            {group.map((p, i) => (
              <Avatar key={`${p.id}-${gi}-${i}`} p={p} />
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
}: {
  participants: UserProfile[];
  count: number;
}) {
  const SCROLL_THRESHOLD = 10;

  if (participants.length === 0) {
    return (
      <p className="text-sm text-stone-400">
        <span className="font-semibold text-white">{count}</span> going
      </p>
    );
  }

  // Static layout — total count ≤ 10
  if (count <= SCROLL_THRESHOLD) {
    return (
      <div className="flex flex-wrap gap-3">
        {participants.map((p, i) => (
          <Avatar key={p.id ?? i} p={p} />
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
    );
  }

  // Marquee layout — split into two rows
  const mid = Math.ceil(participants.length / 2);
  const row1 = participants.slice(0, mid);
  const row2 = participants.slice(mid);

  return (
    <div className="flex flex-col gap-3">
      <MarqueeRow items={row1} speed="normal" />
      <MarqueeRow items={row2} speed="slow" />
    </div>
  );
}
