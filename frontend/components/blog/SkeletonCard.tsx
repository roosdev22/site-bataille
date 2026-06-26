export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100">
      <div className="h-48 bg-gray-200 animate-pulse" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
      </div>
    </div>
  );
}