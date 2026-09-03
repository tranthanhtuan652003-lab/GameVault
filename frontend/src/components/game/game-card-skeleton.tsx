export function GameCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-edge bg-surface">
      <div className="relative aspect-[16/10] bg-surface-2">
        <div className="skeleton-shimmer absolute inset-0" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="h-3 w-20 rounded bg-surface-2" />
        <div className="h-4 w-3/4 rounded bg-surface-2" />
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="h-5 w-14 rounded bg-surface-2" />
          <div className="h-9 w-9 rounded-lg bg-surface-2" />
        </div>
      </div>
    </div>
  );
}
