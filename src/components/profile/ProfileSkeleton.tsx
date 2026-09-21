import { Skeleton } from "@/components/ui";

/** One loading shape for both profile routes, matching ProfileScreen's. */
export function ProfileSkeleton() {
  return (
    <div className="flex flex-col pb-[96px]">
      <Skeleton className="h-[132px] w-full rounded-none xl:h-[200px]" />
      <div className="flex flex-col gap-[14px] px-[16px] xl:px-[26px]">
        <div className="-mt-[38px] xl:-mt-[56px]">
          <Skeleton variant="circle" className="h-[90px] w-[90px] border-[3px] border-[var(--surface-page)]" />
        </div>
        <Skeleton className="h-[24px] w-[220px] rounded" />
        <Skeleton className="h-[14px] w-[140px] rounded" />
        <Skeleton className="h-[14px] w-full rounded" />
        <Skeleton className="h-[14px] w-[70%] rounded" />
        <div className="flex gap-[26px] pt-[10px]">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[36px] w-[62px] rounded" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-[12px] px-[16px] pt-[24px] sm:grid-cols-3 xl:px-[26px]">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[180px] rounded-card" />
        ))}
      </div>
    </div>
  );
}
