import logoImg from "@/assets/logo.png";

export const Logo = ({ compact = false }: { compact?: boolean }) => (
  <div className="flex items-center gap-2">
    <img
      src={logoImg}
      alt="MeruCampusHub logo"
      width={36}
      height={36}
      className="w-9 h-9 rounded-xl shadow-floating object-cover"
    />
    {!compact && (
      <div className="leading-tight">
        <div className="font-extrabold text-base tracking-tight">MeruCampusHub</div>
        <div className="text-[10px] uppercase tracking-wider text-primary font-semibold">MUST Students Only</div>
      </div>
    )}
  </div>
);
