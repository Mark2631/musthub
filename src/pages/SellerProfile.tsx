import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, BadgeCheck, GraduationCap, MessageCircle, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ListingCard } from "@/components/ListingCard";
import { Footer } from "@/components/Footer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar } from "@/components/Avatar";
import { waLink } from "@/lib/constants";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Listing = Database["public"]["Tables"]["listings"]["Row"];

export default function SellerProfile() {
  const { userId } = useParams<{ userId: string }>();
  const nav = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const [{ data: prof }, { data: list }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("listings").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      ]);
      setProfile(prof ?? null);
      setListings(list ?? []);
      setLoading(false);
    })();
  }, [userId]);

  if (loading) return <div className="p-10 flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!profile) return (
    <div className="p-10 text-center">
      <p className="text-muted-foreground mb-4">Seller not found.</p>
      <Button asChild variant="outline"><Link to="/browse">Back to Browse</Link></Button>
    </div>
  );

  const services = listings.filter((l) => l.type === "service" && l.status === "available");
  const items = listings.filter((l) => l.type === "marketplace" && l.status === "available");
  const rentals = listings.filter((l) => l.type === "rental-info" && l.status === "available");

  const phone = listings[0]?.contact_phone ?? profile.phone ?? "";
  const wa = phone ? waLink(phone, `your services on MeruCampusHub`) : "#";

  return (
    <div>
      <header className="px-4 pt-5 pb-3 bg-card border-b border-border sticky top-0 z-30 flex items-center gap-2">
        <button onClick={() => nav(-1)} className="p-1 -ml-1"><ChevronLeft className="w-6 h-6" /></button>
        <h1 className="font-bold text-base flex-1 truncate">Seller profile</h1>
        <ThemeToggle />
      </header>

      <section className="px-5 py-6">
        <div className="bg-card rounded-3xl p-6 shadow-card text-center">
          <Avatar name={profile.name || profile.email} url={profile.avatar_url} size="xl" className="mx-auto shadow-floating border-4 border-card" />
          <h2 className="font-bold text-lg mt-3 flex items-center justify-center gap-1.5">
            {profile.name || "MUST Student"}
            {profile.is_verified_seller && <BadgeCheck className="w-5 h-5 text-primary" />}
          </h2>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
            <GraduationCap className="w-3 h-3" /> {profile.university || "MUST"}
          </p>
          {profile.bio && <p className="text-sm mt-3 text-foreground/90">{profile.bio}</p>}
          <div className="flex items-center justify-center gap-2 mt-4 text-xs">
            <Badge variant="secondary">{listings.length} listings</Badge>
            {profile.is_verified_seller && <Badge className="bg-primary/15 text-primary hover:bg-primary/15 border-0">Verified</Badge>}
          </div>
        </div>

        {phone && (
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Button asChild variant="hero">
              <a href={wa} target="_blank" rel="noreferrer"><MessageCircle className="w-4 h-4" />WhatsApp</a>
            </Button>
            <Button asChild variant="outline">
              <a href={`tel:${phone}`}><Phone className="w-4 h-4" />Call</a>
            </Button>
          </div>
        )}
      </section>

      {services.length > 0 && (
        <section className="px-4 mt-2">
          <h3 className="text-base font-bold mb-3">Services offered</h3>
          <div className="grid grid-cols-2 gap-3">
            {services.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </section>
      )}

      {items.length > 0 && (
        <section className="px-4 mt-7">
          <h3 className="text-base font-bold mb-3">Items for sale</h3>
          <div className="grid grid-cols-2 gap-3">
            {items.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </section>
      )}

      {rentals.length > 0 && (
        <section className="px-4 mt-7">
          <h3 className="text-base font-bold mb-3">Rentals listed</h3>
          <div className="grid grid-cols-2 gap-3">
            {rentals.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </section>
      )}

      {listings.length === 0 && (
        <p className="text-center text-sm text-muted-foreground px-4 py-12">No active listings yet.</p>
      )}

      <Footer />
    </div>
  );
}
