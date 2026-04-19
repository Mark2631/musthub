import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Shield, Trash2, Eye, Flag, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { timeAgo } from "@/lib/constants";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type Report = {
  id: string;
  reason: string;
  details: string | null;
  created_at: string;
  listing_id: string | null;
  post_id: string | null;
  reporter_id: string;
};

type ListingLite = { id: string; title: string; description: string; photos: string[]; user_id: string };
type PostLite = { id: string; body: string; photo_url: string | null; user_id: string };

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const nav = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [listings, setListings] = useState<Map<string, ListingLite>>(new Map());
  const [posts, setPosts] = useState<Map<string, PostLite>>(new Map());
  const [loading, setLoading] = useState(true);
  const [allListings, setAllListings] = useState<ListingLite[]>([]);
  const [allPosts, setAllPosts] = useState<PostLite[]>([]);
  const [tab, setTab] = useState<"reports" | "listings" | "posts">("reports");

  const load = async () => {
    setLoading(true);
    const { data: reps } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
    const list = (reps ?? []) as Report[];
    setReports(list);

    const listingIds = list.map((r) => r.listing_id).filter(Boolean) as string[];
    const postIds = list.map((r) => r.post_id).filter(Boolean) as string[];

    const [{ data: ls }, { data: ps }, { data: allL }, { data: allP }] = await Promise.all([
      listingIds.length ? supabase.from("listings").select("id,title,description,photos,user_id").in("id", listingIds) : Promise.resolve({ data: [] } as any),
      postIds.length ? supabase.from("community_posts").select("id,body,photo_url,user_id").in("id", postIds) : Promise.resolve({ data: [] } as any),
      supabase.from("listings").select("id,title,description,photos,user_id").order("created_at", { ascending: false }).limit(50),
      supabase.from("community_posts").select("id,body,photo_url,user_id").order("created_at", { ascending: false }).limit(50),
    ]);

    setListings(new Map((ls ?? []).map((l: ListingLite) => [l.id, l])));
    setPosts(new Map((ps ?? []).map((p: PostLite) => [p.id, p])));
    setAllListings((allL ?? []) as ListingLite[]);
    setAllPosts((allP ?? []) as PostLite[]);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  if (authLoading || roleLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!user || !isAdmin) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-3" />
        <h1 className="font-bold text-lg">Access denied</h1>
        <p className="text-sm text-muted-foreground mb-4">This area is for app admins only.</p>
        <Button variant="outline" onClick={() => nav("/")}>Back to Home</Button>
      </div>
    );
  }

  const deleteListing = async (id: string) => {
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Listing deleted");
    load();
  };

  const deletePost = async (id: string) => {
    const { error } = await supabase.from("community_posts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Post deleted");
    load();
  };

  const ignoreReport = async (id: string) => {
    const { error } = await supabase.from("reports").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Report dismissed");
    load();
  };

  const ConfirmDelete = ({ onConfirm, label, children }: { onConfirm: () => void; label: string; children: React.ReactNode }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this {label}?</AlertDialogTitle>
          <AlertDialogDescription>This permanently removes it for everyone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <div>
      <header className="px-4 pt-5 pb-3 bg-card border-b border-border sticky top-0 z-30 flex items-center gap-2 shadow-soft">
        <button onClick={() => nav(-1)} className="p-1 -ml-1"><ChevronLeft className="w-6 h-6" /></button>
        <Logo compact />
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-full flex items-center gap-1">
            <Shield className="w-3 h-3" /> ADMIN
          </span>
        </div>
      </header>

      <section className="p-4">
        <h1 className="text-2xl font-extrabold tracking-tight">Moderation</h1>
        <p className="text-xs text-muted-foreground mt-1">Review reports and remove bad content.</p>

        <div className="grid grid-cols-3 gap-2 mt-4 bg-card rounded-2xl p-1 border border-border shadow-soft">
          {[
            { k: "reports", label: `Reports (${reports.length})` },
            { k: "listings", label: "Listings" },
            { k: "posts", label: "Posts" },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k as any)}
              className={`text-xs font-semibold py-2 rounded-xl transition-colors ${tab === t.k ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className="px-4 pb-10 space-y-3">
        {loading && <div className="text-center text-sm text-muted-foreground py-6">Loading…</div>}

        {!loading && tab === "reports" && (
          reports.length ? reports.map((r) => {
            const l = r.listing_id ? listings.get(r.listing_id) : null;
            const p = r.post_id ? posts.get(r.post_id) : null;
            return (
              <article key={r.id} className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-destructive">
                    <Flag className="w-3.5 h-3.5" /> {r.reason}
                    <span className="ml-auto text-[10px] text-muted-foreground font-normal">{timeAgo(r.created_at)}</span>
                  </div>
                  {r.details && <p className="text-xs text-muted-foreground mt-1">{r.details}</p>}
                  {l && (
                    <div className="mt-3 flex gap-3">
                      {l.photos?.[0] && <img src={l.photos[0]} alt="" loading="lazy" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase font-bold text-primary">Listing</p>
                        <p className="font-semibold text-sm truncate">{l.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{l.description}</p>
                      </div>
                    </div>
                  )}
                  {p && (
                    <div className="mt-3 flex gap-3">
                      {p.photo_url && <img src={p.photo_url} alt="" loading="lazy" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase font-bold text-primary">Community Post</p>
                        <p className="text-xs line-clamp-3">{p.body}</p>
                      </div>
                    </div>
                  )}
                  {!l && !p && <p className="text-xs text-muted-foreground mt-2 italic">Original content already removed.</p>}
                </div>
                <div className="flex border-t border-border divide-x divide-border">
                  <Button variant="ghost" size="sm" className="flex-1 rounded-none" onClick={() => ignoreReport(r.id)}>
                    <Eye className="w-3.5 h-3.5" />Ignore
                  </Button>
                  {l && (
                    <ConfirmDelete onConfirm={() => deleteListing(l.id)} label="listing">
                      <Button variant="ghost" size="sm" className="flex-1 rounded-none text-destructive hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />Delete listing
                      </Button>
                    </ConfirmDelete>
                  )}
                  {p && (
                    <ConfirmDelete onConfirm={() => deletePost(p.id)} label="post">
                      <Button variant="ghost" size="sm" className="flex-1 rounded-none text-destructive hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />Delete post
                      </Button>
                    </ConfirmDelete>
                  )}
                </div>
              </article>
            );
          }) : <p className="text-center text-sm text-muted-foreground py-8">🎉 No reports — everything is clean!</p>
        )}

        {!loading && tab === "listings" && (
          allListings.length ? allListings.map((l) => (
            <article key={l.id} className="bg-card rounded-2xl border border-border shadow-card p-3 flex gap-3 items-start">
              {l.photos?.[0] ? (
                <img src={l.photos[0]} alt="" loading="lazy" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-muted flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">{l.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{l.description}</p>
              </div>
              <ConfirmDelete onConfirm={() => deleteListing(l.id)} label="listing">
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </ConfirmDelete>
            </article>
          )) : <p className="text-center text-sm text-muted-foreground py-8">No listings yet.</p>
        )}

        {!loading && tab === "posts" && (
          allPosts.length ? allPosts.map((p) => (
            <article key={p.id} className="bg-card rounded-2xl border border-border shadow-card p-3 flex gap-3 items-start">
              {p.photo_url ? (
                <img src={p.photo_url} alt="" loading="lazy" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-muted flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs line-clamp-3">{p.body}</p>
              </div>
              <ConfirmDelete onConfirm={() => deletePost(p.id)} label="post">
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </ConfirmDelete>
            </article>
          )) : <p className="text-center text-sm text-muted-foreground py-8">No posts yet.</p>
        )}
      </section>

      <Footer />
    </div>
  );
}
