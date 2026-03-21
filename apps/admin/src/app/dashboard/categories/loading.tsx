export default function CategoriesLoading() {
  return (
    <div className="space-y-6">
      <div className="h-9 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="table-wrap">
        <div className="w-full">
          {/* Header row */}
          <div className="grid grid-cols-6 gap-4 p-4 bg-gray-100 border-b border-[#E5E5E0]">
            <div className="h-4 w-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse ml-auto" />
          </div>
          {/* Data rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-4 p-4 border-b border-[#E5E5E0]">
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
