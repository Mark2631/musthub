import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Wrench, Home as HomeIcon, ChevronRight, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { ListingCard } from "@/components/ListingCard";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ensureSeedData } from "@/lib/seed";
import type { Database } from "@/integrations/supabase/types";

type Listing = Database["public"]["Tables"]["listings"]["Row"];

const sections = [
  { type: "marketplace", label: "Marketplace", desc: "Phones, laptops, more", icon: ShoppingBag, color: "from-emerald-500 to-green-600" },
  { type: "service", label: "Services", desc: "Hair, tutors, repairs", icon: Wrench, color: "from-amber-500 to-orange-600" },
  { type: "rental", label: "Rentals", desc: "Hostels & houses", icon: HomeIcon, color: "from-sky-500 to-blue-600" },
] as const;

export default function Home() {
  const [recent, setRecent] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await ensureSeedData();
      const { data } = await supabase
        .from("listings")
        .select("*")
        .eq("status", "available")
        .order("created_at", { ascending: false })
        .limit(8);
      setRecent(data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      {/* Header */}
      <header className="px-4 pt-5 pb-4 bg-card border-b border-border">
        <Logo />
      </header>

      {/* Hero */}
      <section className="px-4 py-5">
        <h1 className="text-2xl font-extrabold tracking-tight">Karibu! 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">What do you need around campus today?</p>
      </section>

      {/* Three big cards */}
      <section className="px-4 space-y-3">
        {sections.map(({ type, label, desc, icon: Icon, color }) => (
          <Link
            key={type}
            to={`/browse?type=${type}`}
            className="flex items-center gap-4 bg-card rounded-2xl p-4 shadow-card hover:shadow-floating transition-shadow"
          >
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base">{label}</h3>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
        ))}
      </section>

      {/* Recent listings */}
      <section className="px-4 mt-7">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Fresh on campus</h2>
          <Link to="/browse" className="text-sm font-medium text-primary">See all</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : recent.length ? (
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-2">
            {recent.map((l) => (
              <div key={l.id} className="w-44 flex-shrink-0">
                <ListingCard listing={l} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-card rounded-2xl">
            <p className="text-sm text-muted-foreground mb-3">No listings yet — be first!</p>
            <Button asChild variant="hero"><Link to="/post"><Plus className="w-4 h-4" />Post one</Link></Button>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
