export default function SettingsLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="h-9 w-64 rounded bg-gray-200 animate-pulse" />
        <div className="h-4 w-96 rounded bg-gray-200 animate-pulse" />
      </div>

      {/* Power controls */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="space-y-5 rounded-[1.25rem] border border-[#E5E5E0] bg-white p-7">
            <div className="flex items-center gap-5">
              <div className="h-12 w-12 rounded-[1rem] bg-gray-200 animate-pulse" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-32 rounded bg-gray-200 animate-pulse" />
                <div className="h-4 w-48 rounded bg-gray-200 animate-pulse" />
              </div>
            </div>
            <div className="h-12 w-full rounded bg-gray-200 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Config table */}
      <div className="overflow-hidden rounded-[1.25rem] border border-[#E5E5E0] bg-white">
        <div className="divide-y divide-[#E5E5E0]">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 xl:grid-cols-12">
              <div className="h-4 rounded bg-gray-200 animate-pulse xl:col-span-2" />
              <div className="h-4 rounded bg-gray-200 animate-pulse xl:col-span-4" />
              <div className="h-4 rounded bg-gray-200 animate-pulse xl:col-span-2" />
              <div className="h-4 rounded bg-gray-200 animate-pulse xl:col-span-3" />
              <div className="h-8 rounded bg-gray-200 animate-pulse xl:col-span-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
