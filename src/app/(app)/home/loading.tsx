import { Skeleton } from "@/components/ui/Skeleton";

export default function HomeLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 26, padding: "2px 2px 12px" }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, maxWidth: 72 }}>
            <Skeleton height={12} />
            <Skeleton height={3} width="60%" />
          </div>
        ))}
      </div>
      <Skeleton variant="card" />
      <Skeleton variant="card" />
    </div>
  );
}