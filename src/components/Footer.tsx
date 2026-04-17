import { Heart } from "lucide-react";

export const Footer = () => (
  <footer className="px-4 py-6 text-center text-xs text-muted-foreground">
    <p className="flex items-center justify-center gap-1">
      Built for MUST students by a fellow student
      <Heart className="w-3 h-3 fill-primary text-primary" />
    </p>
    <p className="mt-1">Free & simple</p>
  </footer>
);
