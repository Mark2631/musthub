import { cn } from "@/lib/utils";

type Props = {
  name?: string | null;
  url?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizeMap = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-9 h-9 text-sm",
  md: "w-11 h-11 text-base",
  lg: "w-16 h-16 text-xl",
  xl: "w-20 h-20 text-3xl",
};

export const Avatar = ({ name, url, size = "md", className }: Props) => {
  const initial = (name || "M").trim().slice(0, 1).toUpperCase();
  const base = cn(
    "rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-extrabold",
    sizeMap[size],
    className
  );
  if (url) {
    return (
      <div className={base}>
        <img src={url} alt={name ?? "avatar"} loading="lazy" className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className={cn(base, "gradient-primary text-primary-foreground")}>
      {initial}
    </div>
  );
};
