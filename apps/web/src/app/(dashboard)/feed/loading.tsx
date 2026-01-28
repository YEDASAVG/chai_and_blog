export default function FeedLoading() {
  return (
    <div className="animate-pulse motion-reduce:animate-none" role="status" aria-label="Loading feed">
      {/* Header Skeleton */}
      <div className="mb-10">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <div className="h-9 bg-gray-800 rounded-lg w-48 mb-2" />
            <div className="h-5 bg-gray-800/50 rounded w-96 mt-2" />
          </div>
          <div className="h-10 bg-gray-800 rounded-lg w-64" />
        </div>
      </div>

      {/* Blog List Skeleton */}
      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <article
            key={i}
            className="bg-gray-800/30 border border-gray-800 rounded-xl p-6"
          >
            {/* Author Skeleton */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-700" />
              <div className="h-4 bg-gray-700 rounded w-32" />
              <div className="h-4 bg-gray-700/50 rounded w-24 ml-2" />
            </div>

            {/* Title Skeleton */}
            <div className="h-7 bg-gray-700 rounded w-3/4 mb-3" />

            {/* Preview Skeleton */}
            <div className="h-4 bg-gray-700/50 rounded w-full mb-2" />
            <div className="h-4 bg-gray-700/50 rounded w-5/6 mb-4" />

            {/* Meta Skeleton */}
            <div className="h-4 bg-gray-700/30 rounded w-24" />
          </article>
        ))}
      </div>
    </div>
  );
}
