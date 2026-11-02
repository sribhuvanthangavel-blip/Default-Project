export default function SiteLoading() {
  return (
    <div className="container-page py-24" role="status" aria-live="polite">
      <span className="sr-only">Loading page</span>
      <div className="mx-auto max-w-3xl animate-pulse">
        <div className="h-3 w-24 rounded-full bg-line" />
        <div className="mt-6 h-12 w-3/4 rounded-2xl bg-line/80" />
        <div className="mt-4 h-12 w-1/2 rounded-2xl bg-line/60" />
        <div className="mt-10 space-y-3">
          <div className="h-4 w-full rounded-full bg-line/70" />
          <div className="h-4 w-11/12 rounded-full bg-line/60" />
          <div className="h-4 w-3/4 rounded-full bg-line/50" />
        </div>
      </div>
    </div>
  );
}
