export default function PizzasLoading() {
  return (
    <div className="space-y-6">
      <div className="h-9 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="table-wrap">
        <div className="w-full">
          {/* Header row skeleton */}
          <div className="grid grid-cols-8 gap-4 p-4 bg-gray-100 border-b border-[#E5E5E0]">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
          {/* Data rows */}
          {Array.from({ length: 6 }).map((_, rowIdx) => (
            <div key={rowIdx} className="grid grid-cols-8 gap-4 p-4 border-b border-[#E5E5E0]">
              <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-12 bg-gray-200 rounded animate-pulse mx-auto" />
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
