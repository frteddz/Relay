import { cn } from "../utils/format";

export function EmptyState({
  icon,
  title,
  description,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center",
        className
      )}
    >
      {icon && <div className="mb-1 rounded-2xl bg-white/5 p-3 text-white/35">{icon}</div>}
      <p className="text-sm font-medium text-white/75">{title}</p>
      {description && (
        <p className="max-w-xs text-xs text-white/40">{description}</p>
      )}
    </div>
  );
}
