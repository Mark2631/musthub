import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Home as HomeIcon, ExternalLink, Megaphone, MapPin, Plus, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { ListingCard } from "@/components/ListingCard";
import { Footer } from "@/components/Footer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { SCHOOL_LINKS } from "@/lib/constants";
import type { Database } from "@/integrations/supabase/types";

type Listing = Database["public"]["Tables"]["listings"]["Row"];

export default function MySchool() {
  const [rentals, setRentals] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("listings")
        // include legacy "rental" type (pre-migration seeds) plus new "rental-info"
        .select("*")
        .in("type", ["rental-info", "rental"] as any)
        .eq("status", "available")
        .order("created_at", { ascending: false })
        .limit(20);
      setRentals(data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <header className="px-4 pt-5 pb-4 bg-card border-b border-border flex items-center justify-between">
        <Logo compact />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="text-xs font-semibold text-muted-foreground">My School</span>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 py-5">
        <div className="bg-gradient-to-br from-primary to-primary-glow rounded-3xl p-5 text-primary-foreground shadow-floating">
          <GraduationCap className="w-8 h-8 mb-2" />
          <h1 className="text-xl font-extrabold">Meru University of Science & Technology</h1>
          <p className="text-xs opacity-90 mt-1">Your campus hub for housing, updates and useful links.</p>
        </div>
      </section>

      {/* Housing / Rentals */}
      <section className="px-4 mt-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <HomeIcon className="w-5 h-5 text-primary" /> Housing near campus
          </h2>
          <Link to="/post" className="text-xs font-medium text-primary flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(2)].map((_, i) => <div key={i} className="aspect-[3/4] bg-muted rounded-2xl animate-pulse" />)}
          </div>
        ) : rentals.length ? (
          <div className="grid grid-cols-2 gap-3">
            {rentals.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        ) : (
          <div className="bg-card rounded-2xl p-5 text-center text-sm text-muted-foreground">
            No housing listings yet.
            <div className="mt-3">
              <Button asChild variant="hero" size="sm"><Link to="/post"><Plus className="w-4 h-4" />Post a rental</Link></Button>
            </div>
          </div>
        )}
      </section>

      {/* School Updates */}
      <section className="px-4 mt-7">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary" /> Campus updates
        </h2>
        <div className="bg-card rounded-2xl p-4 shadow-soft">
          <p className="text-sm font-semibold">📚 Semester-end exams</p>
          <p className="text-xs text-muted-foreground mt-1">Check the student portal for the official timetable. Plan revision early.</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-soft mt-2">
          <p className="text-sm font-semibold">🎉 MUST cultural week</p>
          <p className="text-xs text-muted-foreground mt-1">Join clubs and societies for upcoming campus events. Watch this space.</p>
        </div>
        <p className="text-[11px] text-muted-foreground text-center mt-2">More live updates coming soon.</p>
      </section>

      {/* Useful links */}
      <section className="px-4 mt-7">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-primary" /> Useful links
        </h2>
        <div className="bg-card rounded-2xl shadow-soft divide-y divide-border overflow-hidden">
          {SCHOOL_LINKS.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/50 transition-colors"
            >
              <span className="font-medium">{link.label}</span>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>
          ))}
        </div>
      </section>

      {/* About MUST */}
      <section className="px-4 mt-7">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Info className="w-5 h-5 text-primary" /> About MUST
        </h2>
        <div className="bg-card rounded-2xl p-4 shadow-soft text-sm leading-relaxed text-foreground/90">
          <p>
            Meru University of Science & Technology is a public university located in Meru County, Kenya.
            It offers programmes in engineering, computing, business, agriculture and more.
          </p>
          <p className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" /> Nchiru, Meru County
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
