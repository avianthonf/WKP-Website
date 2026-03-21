export default function OrdersLoading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-9 w-48 rounded bg-gray-200 animate-pulse" />
        <div className="h-10 w-24 rounded bg-gray-200 animate-pulse" />
      </div>
      <div className="flex flex-col gap-6 pb-4 md:flex-row md:overflow-x-auto">
        {[1, 2, 3].map((col) => (
          <div key={col} className="flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-[#E5E5E0] bg-gray-50 md:w-80 md:shrink-0">
            <div className="flex items-center justify-between border-b border-[#E5E5E0] bg-white p-5">
              <div className="h-5 w-24 rounded bg-gray-200 animate-pulse" />
              <div className="h-5 w-8 rounded bg-gray-200 animate-pulse" />
            </div>
            <div className="flex min-h-[200px] flex-1 flex-col gap-4 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 rounded-[1rem] border border-[#E5E5E0] bg-white animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
