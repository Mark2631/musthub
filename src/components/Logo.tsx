import { GraduationCap } from "lucide-react";

export const Logo = ({ compact = false }: { compact?: boolean }) => (
  <div className="flex items-center gap-2">
    <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-floating">
      <GraduationCap className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
    </div>
    {!compact && (
      <div className="leading-tight">
        <div className="font-extrabold text-base tracking-tight">MeruCampusHub</div>
        <div className="text-[10px] uppercase tracking-wider text-primary font-semibold">MUST Students Only</div>
      </div>
    )}
  </div>
);
