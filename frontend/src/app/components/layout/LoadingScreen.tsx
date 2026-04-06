export const LoadingScreen = () => {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fafaf8] px-6 text-slate-800">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/3 h-80 w-80 rounded-full bg-emerald-400/15 blur-3xl" />
      </div>

      <section className="relative w-full max-w-md rounded-3xl border border-emerald-100/70 bg-white/80 p-8 shadow-[0_20px_70px_-35px_rgba(15,23,42,0.45)] backdrop-blur-sm">
        <div className="mb-8 flex items-center gap-4">
          <div className="relative h-11 w-11 shrink-0">
            <span className="absolute inset-0 rounded-2xl border-2 border-emerald-500/30" />
            <span className="absolute inset-0 animate-ping rounded-2xl border-2 border-emerald-500/30" />
            <span className="absolute inset-2 rounded-xl bg-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">Fleet Intelligence</p>
            <h1 className="text-xl font-semibold text-slate-900">Preparing your dashboard</h1>
          </div>
        </div>

        <div className="space-y-3">
          <div className="h-2 overflow-hidden rounded-full bg-slate-200/80">
            <div className="h-full w-2/3 animate-[loader_1.4s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500" />
          </div>
          <p className="text-sm text-slate-500">Syncing routes, trips, and maintenance insights.</p>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3">
          <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-12 animate-pulse rounded-xl bg-emerald-100/60" />
          <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </section>

      <style>{`
        @keyframes loader {
          0%,
          100% {
            transform: translateX(-35%);
          }
          50% {
            transform: translateX(40%);
          }
        }
      `}</style>
    </div>
  );
};
