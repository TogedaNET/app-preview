import { notFound } from "next/navigation";
import { fetchEvent, fetchEventParticipants, type Event, type UserProfile } from "../../../lib/api";
import ImageGallery from "../../components/ImageGallery";
import ParticipantScroller from "../../components/ParticipantScroller";
import JoinCTA, { StickyJoinBar } from "../../components/JoinCTA";
import AppRedirect from "../../components/AppRedirect";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateRange(from: string, to: string) {
  const f = new Date(from);
  const t = new Date(to);
  const date = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(f);
  const fromTime = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(f);
  const toTime = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(t);
  return `${date}, ${fromTime}–${toTime}`;
}

function formatFullDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

function mapSrc(lat: number, lon: number) {
  const delta = 0.006;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lon - delta},${lat - delta},${lon + delta},${lat + delta}&layer=mapnik&marker=${lat},${lon}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ParticipantAvatars({ participants, count }: { participants: UserProfile[]; count: number }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400">
          Participants
        </h2>
        <span className="text-sm text-stone-300">
          <span className="font-semibold text-white">{count}</span> going
        </span>
      </div>
      <ParticipantScroller participants={participants} count={count} />
    </section>
  );
}

function EventDetailCard({ event }: { event: Event }) {
  const ownerName = `${event.owner.firstName} ${event.owner.lastName}`;
  const ownerPhoto = event.owner.profilePhotos[0];
  const isFree = !event.payment || event.payment === 0;
  const loc = event.location;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-stone-400">
        Event details
      </h2>

      <ul className="space-y-4">
        {/* Organizer */}
        <li className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center text-stone-400">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.563.563 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
            </svg>
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{ownerName}</p>
            <p className="text-xs text-stone-400">Host of the event</p>
          </div>
          {ownerPhoto && (
            <img
              src={ownerPhoto}
              alt={ownerName}
              className="h-9 w-9 shrink-0 rounded-full object-cover border border-white/10"
            />
          )}
        </li>

        {/* Date & time */}
        <li className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center text-stone-400">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-medium text-white">
              {formatDateRange(event.fromDate, event.toDate)}
            </p>
            <p className="text-xs text-stone-400">
              {isToday(event.fromDate) ? "Today · " : ""}
              {formatFullDate(event.fromDate)}
            </p>
          </div>
        </li>

        {/* Location */}
        <li className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center text-stone-400">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-medium text-white">
              {loc.city}, {loc.country}
            </p>
            <p className="text-xs text-stone-400">
              {loc.name ?? loc.address ?? "Exact location available after joining"}
            </p>
          </div>
        </li>

        {/* Accessibility */}
        <li className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center text-stone-400">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${event.accessibility === "PUBLIC"
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-amber-500/20 text-amber-300"
                }`}
            >
              {event.accessibility === "PUBLIC" ? "Public" : "Private"}
            </span>
            {event.askToJoin && (
              <span className="inline-flex items-center rounded-full bg-stone-700/60 px-2.5 py-0.5 text-xs font-medium text-stone-300">
                Ask to join
              </span>
            )}
          </div>
        </li>

        {/* Price */}
        <li className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center text-stone-400">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
            </svg>
          </span>
          {isFree ? (
            <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
              Free
            </span>
          ) : (
            <span className="text-sm font-semibold text-white">
              {event.currency?.symbol ?? ""}
              {event.payment}
            </span>
          )}
        </li>
      </ul>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let event: Event;
  try {
    event = await fetchEvent(id);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "404") notFound();
    throw err; // surface auth errors, network errors, etc.
  }

  const participants = await fetchEventParticipants(id, 20).catch(() => []);

  const heroImage = event.images[0];
  const loc = event.location;
  const hasMap = loc.latitude !== 0 && loc.longitude !== 0;

  return (
    <div className="relative min-h-screen text-white">
      <AppRedirect type="event" id={id} />
      {/* Blurred background from event image */}
      {heroImage && (
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <img
            src={heroImage}
            alt=""
            aria-hidden
            className="h-full w-full scale-110 object-cover opacity-35 blur-3xl"
          />
          <div className="absolute inset-0 bg-stone-950/80" />
        </div>
      )}
      {!heroImage && <div className="fixed inset-0 -z-10 bg-stone-950" />}

      {/* Two-column sticky layout */}
      <div className="lg:grid lg:grid-cols-2">

        {/* Left — sticky image panel */}
        <div className="lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden flex flex-col justify-center gap-3 p-6 lg:p-10">
          {event.images.length > 0 ? (
            <ImageGallery images={event.images} alt={event.title} />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-stone-800/60">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="h-16 w-16 text-stone-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </div>
          )}
        </div>

        {/* Right — scrollable content */}
        <div className="flex flex-col gap-5 px-6 py-8 lg:px-10 lg:py-12">

          {/* Title */}
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            {event.title}
          </h1>

          <JoinCTA type="event" id={id} count={event.participantsCount} />

          <EventDetailCard event={event} />
          <ParticipantAvatars participants={participants} count={event.participantsCount} />

          {/* Interests */}
          {event.interests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {event.interests.map((interest) => (
                <span
                  key={interest.name}
                  className="inline-flex items-center gap-1 rounded-full bg-white/8 px-3 py-1 text-xs font-medium text-stone-300"
                >
                  {interest.icon && <span>{interest.icon}</span>}
                  {interest.name}
                </span>
              ))}
            </div>
          )}

          {/* About */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400">
              About this event
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-stone-200">
              {event.description ?? "No description provided."}
            </p>
          </section>

          {/* Location */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400">
              Location
            </h2>
            <p className="mb-1 font-semibold text-white">{loc.name}</p>
            <p className="mb-4 text-sm text-stone-400">
              {[loc.address, loc.city, loc.country].filter(Boolean).join(", ")}
            </p>
            {hasMap && (
              <iframe
                src={mapSrc(loc.latitude, loc.longitude)}
                title="Event location"
                className="h-48 w-full rounded-xl border-0 opacity-90"
                loading="lazy"
              />
            )}
          </section>
        </div>
      </div>

      <StickyJoinBar type="event" id={id} count={event.participantsCount} />
    </div>
  );
}
