interface StatBlockProps {
  value: string;
  label: string;
  size?: "sm" | "md" | "lg";
  align?: "start" | "center";
}

export function StatBlock({ value, label, size = "md", align = "center" }: StatBlockProps) {
  const valueClass = size === "lg" ? "text-[26px]" : size === "md" ? "text-[22px]" : "text-[18px]";
  return (
    <div className={`flex flex-col gap-1 ${align === "center" ? "text-center" : "text-left"}`}>
      <span className={`${valueClass} font-bold leading-tight tracking-tight text-text-primary`} style={{ fontFeatureSettings: "var(--font-feature-tabular)" }}>
        {value}
      </span>
      <span className="text-[12.5px] text-text-muted">{label}</span>
    </div>
  );
}