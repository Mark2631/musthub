import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ListingCard } from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import type { Database } from "@/integrations/supabase/types";

type Listing = Database["public"]["Tables"]["listings"]["Row"];

export default function MyListings() {
  const { user } = useAuth();
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("listings").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setItems(data ?? []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div>
      <header className="px-4 pt-5 pb-3 bg-card border-b border-border flex items-center justify-between">
        <Logo compact />
        <span className="text-xs font-semibold text-muted-foreground">My Listings</span>
      </header>
      <div className="p-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="aspect-[3/4] bg-muted rounded-2xl animate-pulse" />)}
          </div>
        ) : items.length ? (
          <div className="grid grid-cols-2 gap-3">
            {items.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4 text-sm">You haven't posted anything yet.</p>
            <Button asChild variant="hero"><Link to="/post"><Plus className="w-4 h-4" />Post your first listing</Link></Button>
          </div>
        )}
      </div>
    </div>
  );
}
