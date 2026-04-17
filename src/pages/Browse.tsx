import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListingCard } from "@/components/ListingCard";
import { CATEGORIES, ListingType } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import type { Database } from "@/integrations/supabase/types";

type Listing = Database["public"]["Tables"]["listings"]["Row"];
type TabKey = "all" | ListingType;

export default function Browse() {
  const [params, setParams] = useSearchParams();
  const initialType = (params.get("type") as TabKey | null) ?? "all";
  const [tab, setTab] = useState<TabKey>(initialType);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [maxPrice, setMaxPrice] = useState<number>(100000);
  const [sort, setSort] = useState<"newest" | "price">("newest");
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTab(((params.get("type") as TabKey | null) ?? "all"));
    setCategory("all");
  }, [params]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let query = supabase.from("listings").select("*").eq("status", "available");
      if (tab !== "all") query = query.eq("type", tab);
      if (sort === "newest") query = query.order("created_at", { ascending: false });
      else query = query.order("price", { ascending: true, nullsFirst: false });
      const { data } = await query.limit(200);
      setItems(data ?? []);
      setLoading(false);
    })();
  }, [tab, sort]);

  const filtered = useMemo(() => {
    return items.filter((l) => {
      if (q && !`${l.title} ${l.description} ${l.location}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (category !== "all" && l.category !== category) return false;
      if (l.price !== null && l.price > maxPrice) return false;
      return true;
    });
  }, [items, q, category, maxPrice]);

  const categoryOptions = tab === "all" ? [] : CATEGORIES[tab];

  return (
    <div>
      <header className="px-4 pt-5 pb-3 bg-card border-b border-border sticky top-0 z-30">
        <div className="flex items-center justify-between mb-3">
          <Logo compact />
          <span className="text-xs font-semibold text-muted-foreground">Browse</span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search listings..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 h-11 bg-muted/60 border-0"
          />
        </div>
      </header>

      <Tabs value={tab} onValueChange={(v) => { setTab(v as TabKey); setParams(v === "all" ? {} : { type: v }); }} className="px-4 pt-3">
        <TabsList className="w-full grid grid-cols-4 h-10">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="marketplace">Items</TabsTrigger>
          <TabsTrigger value="service">Services</TabsTrigger>
          <TabsTrigger value="rental">Rentals</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="px-4 mt-3 flex items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5"><SlidersHorizontal className="w-3.5 h-3.5" />Filters</Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl">
            <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
            <div className="space-y-5 py-5">
              {tab !== "all" && (
                <div>
                  <label className="text-sm font-medium block mb-2">Category</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categoryOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <label className="text-sm font-medium block mb-2">Max price: KSh {maxPrice.toLocaleString()}</label>
                <Slider value={[maxPrice]} min={500} max={100000} step={500} onValueChange={(v) => setMaxPrice(v[0])} />
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <Select value={sort} onValueChange={(v) => setSort(v as any)}>
          <SelectTrigger className="h-9 w-auto gap-1 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price">Lowest price</SelectItem>
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} results</span>
      </div>

      <section className="px-4 mt-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => <div key={i} className="aspect-[3/4] bg-muted rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length ? (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        ) : (
          <div className="text-center py-16 text-sm text-muted-foreground">No listings match your filters.</div>
        )}
      </section>
    </div>
  );
}
