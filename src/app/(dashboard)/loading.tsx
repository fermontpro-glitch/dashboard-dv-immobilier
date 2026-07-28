export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <div className="h-7 w-56 rounded-md bg-butter" />
          <div className="h-4 w-80 rounded-md bg-butter/70" />
        </div>
        <div className="h-10 w-32 rounded-md bg-butter" />
      </div>

      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-blossom-100 p-5 h-[132px] flex flex-col gap-3">
            <div className="h-3 w-24 rounded bg-butter" />
            <div className="h-8 w-20 rounded bg-butter" />
            <div className="h-5 w-16 rounded-pill bg-butter" />
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-blossom-100 p-6 h-64">
        <div className="h-4 w-64 rounded bg-butter mb-4" />
        <div className="h-40 w-full rounded-md bg-butter/60" />
      </div>
    </div>
  );
}
