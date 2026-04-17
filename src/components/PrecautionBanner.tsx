import { ShieldAlert } from "lucide-react";
import { BUYER_PRECAUTION } from "@/lib/constants";

export const PrecautionBanner = () => (
  <div className="flex gap-2 items-start bg-warning/10 border border-warning/30 text-foreground rounded-2xl p-3">
    <ShieldAlert className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
    <p className="text-[11px] leading-relaxed">{BUYER_PRECAUTION}</p>
  </div>
);
