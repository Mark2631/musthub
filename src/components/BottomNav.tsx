import { Home, Search, PlusCircle, MessageSquare, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", icon: Home, label: "Home", end: true },
  { to: "/browse", icon: Search, label: "Browse" },
  { to: "/post", icon: PlusCircle, label: "Post", primary: true },
  { to: "/messages", icon: MessageSquare, label: "Messages" },
  { to: "/profile", icon: User, label: "Profile" },
];

export const BottomNav = () => {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: convs } = await supabase
        .from("conversations")
        .select("id")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);
      const ids = (convs ?? []).map((c) => c.id);
      if (!ids.length) return setUnread(0);
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", ids)
        .eq("read", false)
        .neq("sender_id", user.id);
      setUnread(count ?? 0);
    };
    load();
    const ch = supabase
      .channel("nav-msg-count")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border shadow-[0_-2px_10px_-4px_hsl(220_13%_18%_/_0.08)]">
      <div className="max-w-screen-sm mx-auto grid grid-cols-5 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {items.map(({ to, icon: Icon, label, end, primary }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition-colors relative",
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
              <div className="relative">
                <Icon className="w-5 h-5" />
                {to === "/messages" && unread > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </div>
            )}
            <span className={cn("text-[10px] font-medium", primary && "mt-0.5")}>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
