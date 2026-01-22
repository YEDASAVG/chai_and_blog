export default function DashboardPageLoading() {
  return (
    <div className="animate-pulse">
      {/* Welcome Section Skeleton */}
      <div className="mb-8">
        <div className="h-9 bg-gray-800 rounded-lg w-72 mb-2" />
        <div className="h-5 bg-gray-800/50 rounded w-80" />
      </div>

      {/* Featured Blogs Skeleton */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-800 rounded w-36" />
          <div className="h-4 bg-gray-800/50 rounded w-20" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5 h-44"
            >
              <div className="h-6 bg-gray-700 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-700/50 rounded w-full mb-2" />
              <div className="h-4 bg-gray-700/50 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>

      {/* Your Blogs Section Skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-gray-800 rounded w-28" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-gray-800/30 border border-gray-800 rounded-xl p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="h-6 bg-gray-700 rounded w-2/3 mb-2" />
                <div className="h-4 bg-gray-700/50 rounded w-32" />
              </div>
              <div className="h-6 bg-gray-700 rounded-full w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
