import { cn } from "../utils/format";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl",
        "shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-[border-color,background-color,transform] duration-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function SectionTitle({ title, subtitle, action }: SectionTitleProps) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-sm text-white/50">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
