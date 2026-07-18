import { cn } from "../utils/format";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "subtle";
  size?: "sm" | "md";
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200",
        "active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0d12]",
        size === "sm" ? "px-3 py-2 text-sm md:py-1.5" : "px-4 py-2.5 text-sm",
        variant === "primary" &&
          "bg-brand-500 text-white shadow-lg shadow-brand-500/25 hover:-translate-y-0.5 hover:bg-brand-400 hover:shadow-brand-500/35",
        variant === "subtle" &&
          "bg-white/10 text-white hover:bg-white/15 hover:-translate-y-0.5",
        variant === "ghost" &&
          "text-white/70 hover:bg-white/10 hover:text-white",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
