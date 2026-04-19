import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Wrench, GraduationCap, ChevronRight, Plus, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { ListingCard } from "@/components/ListingCard";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ensureSeedData } from "@/lib/seed";
import { greetingFor } from "@/lib/greeting";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type Listing = Database["public"]["Tables"]["listings"]["Row"];

const sections = [
  { to: "/browse?type=marketplace", label: "Marketplace", desc: "Phones, laptops, more", icon: ShoppingBag, color: "from-emerald-500 to-green-600" },
  { to: "/browse?type=service", label: "Services", desc: "Hair, tutors, repairs", icon: Wrench, color: "from-amber-500 to-orange-600" },
  { to: "/my-school", label: "My School", desc: "Rentals, updates, links", icon: GraduationCap, color: "from-sky-500 to-blue-600" },
] as const;

export default function Home() {
  const { user } = useAuth();
  const [recent, setRecent] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ items: 0, housing: 0 });
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      await ensureSeedData();
      const reqs: Promise<any>[] = [
        supabase.from("listings").select("*").eq("status", "available").order("created_at", { ascending: false }).limit(8),
        supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "available").in("type", ["marketplace", "service"] as any),
        supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "available").in("type", ["rental-info", "rental"] as any),
      ];
      if (user) reqs.push(supabase.from("profiles").select("name").eq("user_id", user.id).maybeSingle());
      const [{ data }, items, housing, prof] = await Promise.all(reqs);
      setRecent(data ?? []);
      setStats({ items: items.count ?? 0, housing: housing.count ?? 0 });
      if (prof?.data?.name) setName(prof.data.name);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div>
      <header className="px-4 pt-5 pb-4 bg-card border-b border-border flex items-center justify-between">
        <Logo />
        <ThemeToggle />
      </header>

      <section className="px-4 py-5">
        <h1 className="text-2xl font-extrabold tracking-tight">{greetingFor(name)} 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">For MUST students only.</p>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-card rounded-2xl p-3 shadow-soft">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><TrendingUp className="w-3 h-3" /> Listings</div>
            <p className="text-xl font-extrabold mt-1">{stats.items}</p>
            <p className="text-[10px] text-muted-foreground">items & services</p>
          </div>
          <div className="bg-card rounded-2xl p-3 shadow-soft">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><GraduationCap className="w-3 h-3" /> Housing</div>
            <p className="text-xl font-extrabold mt-1">{stats.housing}</p>
            <p className="text-[10px] text-muted-foreground">rooms near campus</p>
          </div>
        </div>
      </section>

      <section className="px-4 space-y-3">
        {sections.map(({ to, label, desc, icon: Icon, color }) => (
          <Link
            key={to}
            to={to}
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
