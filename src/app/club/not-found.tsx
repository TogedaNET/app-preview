export default function ClubNotFound() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-stone-950 px-6 text-white">
      {/* Ambient gradient orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-500/20 via-fuchsia-500/10 to-transparent blur-3xl" />
        <div className="absolute bottom-[-200px] left-[10%] h-[420px] w-[420px] rounded-full bg-gradient-to-tr from-emerald-500/20 via-cyan-500/10 to-transparent blur-3xl" />
        <div className="absolute right-[5%] top-[20%] h-[360px] w-[360px] rounded-full bg-gradient-to-bl from-amber-500/15 via-rose-500/10 to-transparent blur-3xl" />
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
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400/30 via-fuchsia-400/20 to-emerald-500/30 blur-xl" />
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
                  d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
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
          <p className="relative mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-300/90">
            Club not found
          </p>
          <h1 className="relative bg-gradient-to-b from-white to-white/70 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
            This club has moved on
          </h1>
          <p className="relative mx-auto mt-4 max-w-sm text-sm leading-relaxed text-stone-300/90">
            The link may be broken, the club may have disbanded, or it might
            never have existed. Either way — there is so much more waiting for
            you.
          </p>

          {/* Decorative divider */}
          <div className="relative my-7 flex items-center justify-center gap-2">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-white/20" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-white/20" />
          </div>

          {/* Tip */}
          <p className="relative text-xs text-stone-400">
            Open the app to discover clubs and communities near you.
          </p>
        </div>

        {/* Footnote */}
        <p className="mt-6 text-center text-[11px] uppercase tracking-[0.2em] text-stone-500">
          Error 404 · Club
        </p>
      </div>
    </div>
  );
}
