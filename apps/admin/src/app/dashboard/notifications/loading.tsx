export default function NotificationsLoading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <div className="h-9 w-64 rounded bg-gray-200 animate-pulse" />
          <div className="h-4 w-80 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="h-10 w-40 rounded bg-gray-200 animate-pulse" />
      </div>
      <div className="space-y-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-[#E5E5E0] rounded-[1.25rem] p-6 flex flex-col gap-5 lg:flex-row">
            <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse" />
            <div className="flex-1 space-y-4">
              <div className="h-6 w-1/3 rounded bg-gray-200 animate-pulse" />
              <div className="h-4 w-full rounded bg-gray-200 animate-pulse" />
              <div className="flex flex-wrap gap-3">
                <div className="h-5 w-16 rounded-full bg-gray-200 animate-pulse" />
                <div className="h-5 w-24 rounded-full bg-gray-200 animate-pulse" />
              </div>
            </div>
            <div className="w-full space-y-3 flex flex-row gap-3 lg:w-20 lg:flex-col lg:justify-center">
              <div className="h-8 rounded bg-gray-200 animate-pulse" />
              <div className="h-8 rounded bg-gray-200 animate-pulse" />
              <div className="h-8 rounded bg-gray-200 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
