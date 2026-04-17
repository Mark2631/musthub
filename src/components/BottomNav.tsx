import { Home, Search, PlusCircle, ListChecks, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", icon: Home, label: "Home", end: true },
  { to: "/browse", icon: Search, label: "Browse" },
  { to: "/post", icon: PlusCircle, label: "Post", primary: true },
  { to: "/my-listings", icon: ListChecks, label: "Mine" },
  { to: "/profile", icon: User, label: "Profile" },
];

export const BottomNav = () => (
  <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border">
    <div className="max-w-screen-sm mx-auto grid grid-cols-5 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
      {items.map(({ to, icon: Icon, label, end, primary }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition-colors",
              primary && "relative -mt-5",
              isActive ? "text-primary" : "text-muted-foreground"
            )
          }
        >
          {primary ? (
            <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center shadow-floating">
              <Icon className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} />
            </div>
          ) : (
            <Icon className="w-5 h-5" />
          )}
          <span className={cn("text-[10px] font-medium", primary && "mt-0.5")}>{label}</span>
        </NavLink>
      ))}
    </div>
  </nav>
);
