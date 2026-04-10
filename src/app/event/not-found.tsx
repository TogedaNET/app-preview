export default function EventNotFound() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-stone-950 px-6 text-white">
      {/* Ambient gradient orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-br from-amber-500/20 via-rose-500/10 to-transparent blur-3xl" />
        <div className="absolute bottom-[-200px] left-[10%] h-[420px] w-[420px] rounded-full bg-gradient-to-tr from-indigo-500/20 via-fuchsia-500/10 to-transparent blur-3xl" />
        <div className="absolute right-[5%] top-[20%] h-[360px] w-[360px] rounded-full bg-gradient-to-bl from-emerald-500/15 via-cyan-500/10 to-transparent blur-3xl" />
      </div>

      {/* Subtle grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] sm:p-10">
          {/* Soft inner glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-3xl"
            style={{
              background:
                "radial-gradient(120% 60% at 50% 0%, rgba(255,255,255,0.08), transparent 60%)",
            }}
          />

          {/* Icon badge */}
          <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400/30 via-rose-400/20 to-fuchsia-500/30 blur-xl" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-md">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.4}
                className="h-9 w-9 text-white/90"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m9.5 13.5 5 4M14.5 13.5l-5 4"
                />
              </svg>
            </div>
          </div>

          {/* Headline */}
          <p className="relative mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-300/90">
            Event not found
          </p>
          <h1 className="relative bg-gradient-to-b from-white to-white/70 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
            This event has slipped away
          </h1>
          <p className="relative mx-auto mt-4 max-w-sm text-sm leading-relaxed text-stone-300/90">
            The link may be broken, the event may have ended, or it might never
            have existed. Either way — there is so much more waiting for you.
          </p>

          {/* Decorative divider */}
          <div className="relative my-7 flex items-center justify-center gap-2">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-white/20" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-white/20" />
          </div>

          {/* Tip */}
          <p className="relative text-xs text-stone-400">
            Open the app to discover events happening near you.
          </p>
        </div>

        {/* Footnote */}
        <p className="mt-6 text-center text-[11px] uppercase tracking-[0.2em] text-stone-500">
          Error 404 · Event
        </p>
      </div>
    </div>
  );
}
