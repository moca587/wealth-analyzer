export default function Loading() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center" role="status" aria-label="Loading">
      <div className="h-8 w-8 rounded-full border-2 border-muted border-t-accent animate-spin" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
