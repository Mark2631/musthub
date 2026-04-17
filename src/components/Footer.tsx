import { ShieldAlert } from "lucide-react";

export const Footer = () => (
  <footer className="px-4 py-6 text-center text-xs text-muted-foreground space-y-1">
    <p>Built by a MUST student • Free to use</p>
    <p className="flex items-center justify-center gap-1">
      <ShieldAlert className="w-3 h-3 text-warning" />
      Meet safely • Report abuse
    </p>
  </footer>
);
