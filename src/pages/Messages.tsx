import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/Avatar";
import { timeAgo } from "@/lib/constants";

type ConvRow = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  last_message: string | null;
  last_message_at: string;
};

type Enriched = ConvRow & {
  other_name: string;
  other_avatar: string | null;
  listing_title: string;
  unread: number;
};

export default function Messages() {
  const { user } = useAuth();
  const [items, setItems] = useState<Enriched[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: convs } = await supabase
        .from("conversations")
        .select("*")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false });
      const list = (convs ?? []) as ConvRow[];
      if (!list.length) { setItems([]); setLoading(false); return; }

      const otherIds = Array.from(new Set(list.map((c) => (c.buyer_id === user.id ? c.seller_id : c.buyer_id))));
      const listingIds = Array.from(new Set(list.map((c) => c.listing_id)));

      const [{ data: profs }, { data: listings }, { data: unreadRows }] = await Promise.all([
        supabase.from("profiles").select("user_id,name,avatar_url").in("user_id", otherIds),
        supabase.from("listings").select("id,title").in("id", listingIds),
        supabase.from("messages").select("conversation_id").eq("read", false).neq("sender_id", user.id).in("conversation_id", list.map((c) => c.id)),
      ]);

      const profMap = new Map((profs ?? []).map((p) => [p.user_id, p]));
      const titleMap = new Map((listings ?? []).map((l) => [l.id, l.title]));
      const unreadMap = new Map<string, number>();
      (unreadRows ?? []).forEach((r) => unreadMap.set(r.conversation_id, (unreadMap.get(r.conversation_id) ?? 0) + 1));

      setItems(list.map((c) => {
        const otherId = c.buyer_id === user.id ? c.seller_id : c.buyer_id;
        const p = profMap.get(otherId);
        return {
          ...c,
          other_name: p?.name ?? "MUST Student",
          other_avatar: p?.avatar_url ?? null,
          listing_title: titleMap.get(c.listing_id) ?? "Listing",
          unread: unreadMap.get(c.id) ?? 0,
        };
      }));
      setLoading(false);
    };
    load();

    const ch = supabase
      .channel("inbox-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, load)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground mb-4">Sign in to see your messages.</p>
        <Button asChild variant="hero"><Link to="/auth">Sign in</Link></Button>
      </div>
    );
  }

  return (
    <div>
      <header className="px-4 pt-5 pb-4 bg-card border-b border-border flex items-center justify-between shadow-soft">
        <Logo compact />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="text-xs font-semibold text-muted-foreground">Messages</span>
        </div>
      </header>

      <section className="px-4 py-5">
        <h1 className="text-xl font-extrabold mb-1 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" /> Inbox
        </h1>
        <p className="text-xs text-muted-foreground">Chat directly with buyers & sellers on campus.</p>
      </section>

      <section className="px-4">
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)}
          </div>
        ) : items.length ? (
          <ul className="bg-card rounded-2xl shadow-card border border-border divide-y divide-border overflow-hidden">
            {items.map((c) => (
              <li key={c.id}>
                <Link to={`/messages/${c.id}`} className="flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors">
                  <div className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                    {c.other_name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm truncate">{c.other_name}</p>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">{timeAgo(c.last_message_at)}</span>
                    </div>
                    <p className="text-[11px] text-primary font-medium truncate">Re: {c.listing_title}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{c.last_message ?? "Start the conversation"}</p>
                  </div>
                  {c.unread > 0 ? (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{c.unread}</span>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="bg-card rounded-2xl border border-border shadow-soft p-8 text-center">
            <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No messages yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Open a listing and tap "Message Seller" to start.</p>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
