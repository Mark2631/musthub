import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ChevronLeft, MapPin, MessageCircle, Pencil, Trash2, CheckCircle2, RotateCcw, Phone, ImageIcon, BadgeCheck, Flag, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatKsh, timeAgo, TYPE_LABELS, waLink } from "@/lib/constants";
import { PrecautionBanner } from "@/components/PrecautionBanner";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Database } from "@/integrations/supabase/types";

type Listing = Database["public"]["Tables"]["listings"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const nav = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
      setListing(data ?? null);
      if (data) {
        const { data: prof } = await supabase.from("profiles").select("*").eq("user_id", data.user_id).maybeSingle();
        setSeller(prof ?? null);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="p-10 flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!listing) return (
    <div className="p-10 text-center">
      <p className="text-muted-foreground mb-4">Listing not found.</p>
      <Button asChild variant="outline"><Link to="/browse">Browse listings</Link></Button>
    </div>
  );

  const isOwner = user?.id === listing.user_id;
  const photos = listing.photos.length ? listing.photos : [];
  const videos = listing.videos ?? [];
  const isService = listing.type === "service";

  const reportListing = async () => {
    if (!user) return toast.error("Sign in first");
    const reason = window.prompt("Why are you reporting this listing? (e.g. scam, inappropriate)");
    if (!reason) return;
    const { error } = await supabase.from("reports").insert({ listing_id: listing.id, reporter_id: user.id, reason });
    if (error) return toast.error(error.message);
    toast.success("Thanks — we'll review this listing.");
  };

  const toggleSold = async () => {
    const next = listing.status === "sold" ? "available" : "sold";
    const { error } = await supabase.from("listings").update({ status: next }).eq("id", listing.id);
    if (error) return toast.error(error.message);
    setListing({ ...listing, status: next });
    toast.success(next === "sold" ? "Marked as sold" : "Marked available");
  };

  const handleDelete = async () => {
    const { error } = await supabase.from("listings").delete().eq("id", listing.id);
    if (error) return toast.error(error.message);
    toast.success("Listing deleted");
    nav("/my-listings", { replace: true });
  };

  return (
    <div>
      {/* Photo gallery — taller for services */}
      <div className={`relative bg-muted ${isService ? "aspect-[4/3]" : "aspect-square"}`}>
        {photos.length ? (
          <>
            <img src={photos[photoIdx]} alt={listing.title} className="w-full h-full object-cover" />
            {photos.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photos.map((_, i) => (
                  <button key={i} onClick={() => setPhotoIdx(i)} className={`w-2 h-2 rounded-full transition-all ${i === photoIdx ? "bg-white w-6" : "bg-white/60"}`} />
                ))}
              </div>
            )}
          </>
        ) : videos.length ? (
          <video src={videos[0]} className="w-full h-full object-cover" controls playsInline />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageIcon className="w-16 h-16" /></div>
        )}
        <button onClick={() => nav(-1)} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-background/90 backdrop-blur flex items-center justify-center shadow-card">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <Badge className="absolute top-4 right-4 bg-background/90 text-foreground hover:bg-background/90 border-0">{TYPE_LABELS[listing.type]}</Badge>
      </div>

      {/* Video gallery for services (or any listing with videos + photos) */}
      {videos.length > 0 && photos.length > 0 && (
        <div className="px-5 pt-5">
          <h2 className="font-bold text-sm mb-2">Video{videos.length > 1 ? "s" : ""}</h2>
          <div className="space-y-3">
            {videos.map((src, i) => (
              <video key={i} src={src} controls playsInline className="w-full rounded-2xl bg-foreground aspect-video object-cover" />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-5 space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{listing.title}</h1>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-bold text-primary">{formatKsh(listing.price)}</p>
            {listing.negotiable && <span className="text-xs font-semibold text-warning">Negotiable</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>{listing.location}</span>
          <span>•</span>
          <span>{timeAgo(listing.created_at)}</span>
        </div>

        {listing.status === "sold" && (
          <Badge variant="destructive" className="text-sm">Sold</Badge>
        )}

        <div>
          <h2 className="font-bold text-sm mb-1">Description</h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{listing.description}</p>
        </div>

        <div>
          <h2 className="font-bold text-sm mb-2">Category</h2>
          <Badge variant="secondary">{listing.category}</Badge>
        </div>

        {/* Seller */}
        <Link to={`/seller/${listing.user_id}`} className="block bg-card rounded-2xl p-4 shadow-soft hover:shadow-card transition-shadow">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Seller</p>
          <p className="font-semibold mt-1 flex items-center gap-1.5">
            {seller?.name ?? "MUST Student"}
            {seller?.is_verified_seller && <BadgeCheck className="w-4 h-4 text-primary" />}
            <span className="ml-auto text-[11px] font-medium text-primary">View profile →</span>
          </p>
          <span className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Phone className="w-3.5 h-3.5" /> {listing.contact_phone}
          </span>
        </Link>

        <PrecautionBanner />

        {!isOwner && (
          <button onClick={reportListing} className="w-full text-xs text-muted-foreground flex items-center justify-center gap-1.5 py-2 hover:text-destructive transition-colors">
            <Flag className="w-3.5 h-3.5" /> Report this listing
          </button>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-16 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border p-3 max-w-screen-sm mx-auto z-30">
        {isOwner ? (
          <div className="flex gap-2">
            <Button asChild variant="outline" className="flex-1"><Link to={`/edit/${listing.id}`}><Pencil className="w-4 h-4" />Edit</Link></Button>
            <Button onClick={toggleSold} variant="outline" className="flex-1">
              {listing.status === "sold" ? <><RotateCcw className="w-4 h-4" />Available</> : <><CheckCircle2 className="w-4 h-4" />Sold</>}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="destructive" size="icon"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
                  <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="xl"
              className="flex-1"
              onClick={async () => {
                if (!user) { toast.error("Messaging requires an account and is currently unavailable."); return; }
                if (user.id === listing.user_id) return;
                // Find or create conversation
                const { data: existing } = await supabase
                  .from("conversations")
                  .select("id")
                  .eq("listing_id", listing.id)
                  .eq("buyer_id", user.id)
                  .eq("seller_id", listing.user_id)
                  .maybeSingle();
                if (existing) { nav(`/messages/${existing.id}`); return; }
                const { data: created, error } = await supabase
                  .from("conversations")
                  .insert({ listing_id: listing.id, buyer_id: user.id, seller_id: listing.user_id })
                  .select("id")
                  .single();
                if (error) return toast.error(error.message);
                nav(`/messages/${created.id}`);
              }}
            >
              <MessageSquare className="w-5 h-5" />Message
            </Button>
            <Button asChild variant="hero" size="xl" className="flex-1">
              <a href={waLink(listing.contact_phone, listing.title)} target="_blank" rel="noreferrer">
                <MessageCircle className="w-5 h-5" />WhatsApp
              </a>
            </Button>
          </div>
        )}
      </div>
      <div className="h-20" />
    </div>
  );
}
