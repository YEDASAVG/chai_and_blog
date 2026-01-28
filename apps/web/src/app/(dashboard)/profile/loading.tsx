export default function ProfileLoading() {
  return (
    <div className="max-w-2xl animate-pulse motion-reduce:animate-none" role="status" aria-label="Loading profile">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-2">
        <div className="h-8 bg-gray-800 rounded w-44" />
        <div className="h-5 bg-gray-800/50 rounded w-32" />
      </div>
      <div className="h-5 bg-gray-800/50 rounded w-56 mb-8" />

      {/* Avatar & Info Card Skeleton */}
      <div className="flex items-start gap-6 p-6 bg-gray-800/30 rounded-xl border border-gray-800 mb-6">
        <div className="w-20 h-20 rounded-full bg-gray-700 shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-gray-700/50 rounded w-20 mb-2" />
          <div className="h-5 bg-gray-700 rounded w-32 mb-4" />
          <div className="h-4 bg-gray-700/50 rounded w-16 mb-2" />
          <div className="h-5 bg-gray-700 rounded w-48" />
        </div>
      </div>

      {/* Form Fields Skeleton */}
      <div className="space-y-6">
        {/* Name Field */}
        <div>
          <div className="h-4 bg-gray-700/50 rounded w-28 mb-2" />
          <div className="h-12 bg-gray-800/50 rounded-lg w-full" />
        </div>

        {/* Bio Field */}
        <div>
          <div className="h-4 bg-gray-700/50 rounded w-20 mb-2" />
          <div className="h-24 bg-gray-800/50 rounded-lg w-full" />
        </div>

        {/* Social Links */}
        <div className="space-y-4">
          <div className="h-4 bg-gray-700/50 rounded w-24 mb-2" />
          <div className="h-12 bg-gray-800/50 rounded-lg w-full" />
          <div className="h-12 bg-gray-800/50 rounded-lg w-full" />
          <div className="h-12 bg-gray-800/50 rounded-lg w-full" />
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <div className="h-12 bg-gray-700 rounded-lg w-36" />
        </div>
      </div>
    </div>
  );
}
