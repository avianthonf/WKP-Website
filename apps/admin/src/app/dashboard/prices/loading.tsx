export default function PricesLoading() {
  return (
    <div className="space-y-8">
      <div className="h-9 w-48 rounded bg-gray-200 animate-pulse" />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* Left panel - Pizzas */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-8 w-8 rounded bg-gray-200 animate-pulse" />
            <div className="h-6 w-40 rounded bg-gray-200 animate-pulse" />
          </div>
          {[1, 2].map((group) => (
            <div key={group} className="overflow-hidden rounded-[1.25rem] border border-[#E5E5E0] bg-white shadow-sm">
              <div className="h-10 w-1/3 rounded bg-gray-200 animate-pulse border-b border-[#E5E5E0]" />
              <div className="space-y-3 p-3">
                {[1, 2, 3, 4].map((row) => (
                  <div key={row} className="grid grid-cols-4 gap-3 p-2.5">
                    <div className="h-4 rounded bg-gray-200 animate-pulse" />
                    <div className="h-6 rounded bg-gray-200 animate-pulse" />
                    <div className="h-6 rounded bg-gray-200 animate-pulse" />
                    <div className="h-6 rounded bg-gray-200 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right panel - Extras/Addons/Desserts */}
        <div className="space-y-6">
          <div className="overflow-hidden rounded-[1.25rem] border border-[#E5E5E0] bg-white shadow-sm">
            <div className="border-b border-[#E5E5E0] bg-gray-50 px-5 py-4">
              <div className="mb-2 h-5 w-20 rounded bg-gray-200 animate-pulse" />
              <div className="h-3 w-48 rounded bg-gray-200 animate-pulse" />
            </div>
            <div className="p-3">
              <div className="grid grid-cols-4 gap-3 border-b border-[#E5E5E0] p-2.5">
                <div className="h-3 rounded bg-gray-200 animate-pulse" />
                <div className="h-3 rounded bg-gray-200 animate-pulse" />
                <div className="h-3 rounded bg-gray-200 animate-pulse" />
                <div className="h-3 rounded bg-gray-200 animate-pulse" />
              </div>
              {[1, 2, 3].map((row) => (
                <div key={row} className="grid grid-cols-4 gap-3 p-2.5">
                  <div className="h-4 rounded bg-gray-200 animate-pulse" />
                  <div className="h-6 rounded bg-gray-200 animate-pulse" />
                  <div className="h-6 rounded bg-gray-200 animate-pulse" />
                  <div className="h-6 rounded bg-gray-200 animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.25rem] border border-[#E5E5E0] bg-white shadow-sm">
            <div className="border-b border-[#E5E5E0] bg-gray-50 px-5 py-4">
              <div className="mb-2 h-5 w-40 rounded bg-gray-200 animate-pulse" />
              <div className="h-3 w-56 rounded bg-gray-200 animate-pulse" />
            </div>
            <div className="p-3">
              <div className="grid grid-cols-3 gap-3 border-b border-[#E5E5E0] p-2.5">
                <div className="h-3 rounded bg-gray-200 animate-pulse" />
                <div className="h-3 rounded bg-gray-200 animate-pulse" />
                <div className="h-3 rounded bg-gray-200 animate-pulse" />
              </div>
              {[1, 2, 3, 4].map((row) => (
                <div key={row} className="grid grid-cols-3 gap-3 p-2.5">
                  <div className="h-4 rounded bg-gray-200 animate-pulse" />
                  <div className="h-4 w-12 rounded bg-gray-200 animate-pulse" />
                  <div className="h-6 rounded bg-gray-200 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
