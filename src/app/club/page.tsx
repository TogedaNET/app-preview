import { notFound } from "next/navigation";
import { fetchClub, fetchClubMembers, type Club, type UserProfile } from "../../lib/api";
import ImageGallery from "../components/ImageGallery";
import ParticipantScroller from "../components/ParticipantScroller";
import JoinCTA, { StickyJoinBar } from "../components/JoinCTA";
import AppRedirect from "../components/AppRedirect";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function mapSrc(lat: number, lon: number) {
  const delta = 0.006;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lon - delta},${lat - delta},${lon + delta},${lat + delta}&layer=mapnik&marker=${lat},${lon}`;
}

function mapSrcBlurred(lat: number, lon: number) {
  const delta = 0.04;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lon - delta},${lat - delta},${lon + delta},${lat + delta}&layer=mapnik`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MemberAvatars({ members, count }: { members: UserProfile[]; count: number }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400">
          Members
        </h2>
        <span className="text-sm text-stone-300">
          <span className="font-semibold text-white">{count}</span> members
        </span>
      </div>
      <ParticipantScroller participants={members} count={count} />
    </section>
  );
}

function ClubDetailCard({ club }: { club: Club }) {
  const ownerName = `${club.owner.firstName} ${club.owner.lastName}`;
  const ownerPhoto = club.owner.profilePhotos[0];
  const loc = club.location;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-stone-400">
        Club details
      </h2>

      <ul className="space-y-4">
        {/* Owner */}
        <li className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center text-stone-400">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.563.563 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
            </svg>
          </span>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-white">{ownerName}</p>
            <p className="text-xs text-stone-400">Club organizer</p>
          </div>
          {ownerPhoto && (
            <img
              src={ownerPhoto}
              alt={ownerName}
              className="h-9 w-9 shrink-0 rounded-full border border-white/10 object-cover"
            />
          )}
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
            {loc.address && (
              <p className="text-xs text-stone-400">
                {club.askToJoin ? "Exact location will be revealed upon joining" : loc.address}
              </p>
            )}
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
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${club.accessibility === "PUBLIC"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-amber-500/20 text-amber-300"
                }`}
            >
              {club.accessibility === "PUBLIC" ? "Public" : "Private"}
            </span>
            {club.askToJoin && (
              <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                Ask to join
              </span>
            )}
          </div>
        </li>

        {/* Created */}
        {club.createdAt && (
          <li className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center text-stone-400">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-medium text-white">Founded</p>
              <p className="text-xs text-stone-400">{formatDate(club.createdAt)}</p>
            </div>
          </li>
        )}
      </ul>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ClubPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  if (!id) notFound();

  let club: Club;
  try {
    club = await fetchClub(id);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "404") notFound();
    throw err;
  }

  const members = await fetchClubMembers(id, 20).catch(() => club.previewMembers ?? []);

  const heroImage = club.images[0];
  const loc = club.location;
  const hasMap = loc.latitude !== 0 && loc.longitude !== 0;

  return (
    <div className="relative min-h-screen text-white">
      <AppRedirect type="club" id={id} />
      {/* Blurred background */}
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
      <div className="mx-auto w-full max-w-300">
      <div className="md:grid md:grid-cols-2">

        {/* Left — sticky image panel */}
        <div className="md:sticky md:top-0 md:h-screen md:overflow-hidden flex flex-col justify-start gap-3 p-6 lg:p-10">
          {(club.images.length > 0 || club.memories.length > 0) ? (
            <ImageGallery images={[...club.images, ...club.memories]} alt={club.title} />
          ) : (
            <div className="flex aspect-[9/13] w-full items-center justify-center rounded-2xl bg-stone-800/60">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="h-16 w-16 text-stone-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </div>
          )}
        </div>

        {/* Right — scrollable content */}
        <div className="flex flex-col gap-5 px-6 pt-2 pb-28 md:py-8 md:pb-28 lg:px-10 lg:py-12 lg:pb-12">

          {/* Title */}
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            {club.title}
          </h1>

          <JoinCTA type="club" id={id} count={club.membersCount} />

          <ClubDetailCard club={club} />
          <MemberAvatars members={members} count={club.membersCount} />

          {/* Interests */}
          {club.interests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {club.interests.map((interest) => (
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
              About this club
            </h2>
            <p className="whitespace-pre-line wrap-break-word text-sm leading-relaxed text-stone-200">
              {club.description ?? "No description provided."}
            </p>
          </section>

          {/* Location */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400">
              Location
            </h2>
            <p className="mb-1 font-semibold text-white">
              {club.askToJoin ? `${loc.city}, ${loc.country}` : loc.name}
            </p>
            <p className="mb-4 text-sm text-stone-400">
              {club.askToJoin
                ? "Exact location will be revealed upon joining"
                : [loc.address, loc.city, loc.country].filter(Boolean).join(", ")}
            </p>
            {hasMap && (
              <iframe
                src={club.askToJoin ? mapSrcBlurred(loc.latitude, loc.longitude) : mapSrc(loc.latitude, loc.longitude)}
                title="Club location"
                className="h-48 w-full rounded-xl border-0 opacity-90"
                loading="lazy"
              />
            )}
          </section>
        </div>
      </div>
      </div>

      <StickyJoinBar type="club" id={id} count={club.membersCount} />
    </div>
  );
}
