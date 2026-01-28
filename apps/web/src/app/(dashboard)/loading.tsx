export default function DashboardLoading() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[400px]" role="status" aria-label="Loading">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-gray-700 border-t-[#f97316] animate-spin motion-reduce:animate-none" />
        </div>
        <p className="text-gray-400 text-sm animate-pulse motion-reduce:animate-none">Loading…</p>
      </div>
    </div>
  );
}
