import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Send, ImagePlus, Video as VideoIcon, X, BadgeCheck, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/Avatar";
import { timeAgo } from "@/lib/constants";
import { toast } from "sonner";

type Post = {
  id: string;
  user_id: string;
  body: string;
  photo_url: string | null;
  video_url: string | null;
  related_listing_id: string | null;
  created_at: string;
};
type Profile = { user_id: string; name: string | null; is_verified_seller: boolean; avatar_url: string | null };
type Comment = { id: string; post_id: string; user_id: string; body: string; created_at: string };

const MAX_PHOTO_MB = 3;
const MAX_VIDEO_MB = 8;

export const CommunityFeed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [likes, setLikes] = useState<Map<string, { count: number; mine: boolean }>>(new Map());
  const [comments, setComments] = useState<Map<string, Comment[]>>(new Map());
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data: ps } = await supabase
      .from("community_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    const list = (ps ?? []) as Post[];
    setPosts(list);

    if (list.length) {
      const userIds = Array.from(new Set(list.map((p) => p.user_id)));
      const postIds = list.map((p) => p.id);
      const [{ data: profs }, { data: lks }, { data: cmts }] = await Promise.all([
        supabase.from("profiles").select("user_id,name,is_verified_seller,avatar_url").in("user_id", userIds),
        supabase.from("post_likes").select("post_id,user_id").in("post_id", postIds),
        supabase.from("post_comments").select("*").in("post_id", postIds).order("created_at"),
      ]);
      setProfiles(new Map((profs ?? []).map((p) => [p.user_id, p as Profile])));
      const lkMap = new Map<string, { count: number; mine: boolean }>();
      (lks ?? []).forEach((l) => {
        const cur = lkMap.get(l.post_id) ?? { count: 0, mine: false };
        cur.count++;
        if (user && l.user_id === user.id) cur.mine = true;
        lkMap.set(l.post_id, cur);
      });
      setLikes(lkMap);
      const cmtMap = new Map<string, Comment[]>();
      (cmts ?? []).forEach((c) => {
        const arr = cmtMap.get(c.post_id) ?? [];
        arr.push(c as Comment);
        cmtMap.set(c.post_id, arr);
      });
      setComments(cmtMap);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("feed-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "community_posts" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const uploadFile = async (file: File, kind: "photo" | "video") => {
    if (!user) return null;
    const ext = file.name.split(".").pop() ?? (kind === "photo" ? "jpg" : "mp4");
    const path = `${user.id}/${Date.now()}-${kind}.${ext}`;
    const { error } = await supabase.storage.from("community-media").upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) { toast.error(error.message); return null; }
    return supabase.storage.from("community-media").getPublicUrl(path).data.publicUrl;
  };

  const checkVideoDuration = (file: File) =>
    new Promise<number>((resolve) => {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => { URL.revokeObjectURL(v.src); resolve(v.duration || 0); };
      v.src = URL.createObjectURL(file);
    });

  const onPickVideo = async (f: File) => {
    if (f.size > MAX_VIDEO_MB * 1024 * 1024) return toast.error(`Video must be under ${MAX_VIDEO_MB}MB`);
    const dur = await checkVideoDuration(f);
    if (dur > 30) return toast.error("Keep videos under 30 seconds to save data.");
    setVideoFile(f);
    setPhotoFile(null);
  };

  const onPickPhoto = (f: File) => {
    if (f.size > MAX_PHOTO_MB * 1024 * 1024) return toast.error(`Photo must be under ${MAX_PHOTO_MB}MB`);
    setPhotoFile(f);
    setVideoFile(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Sign in to post");
    const body = draft.trim();
    if (!body) return;
    setPosting(true);
    let photo_url: string | null = null;
    let video_url: string | null = null;
    if (photoFile) photo_url = await uploadFile(photoFile, "photo");
    if (videoFile) video_url = await uploadFile(videoFile, "video");
    const { error } = await supabase.from("community_posts").insert({ user_id: user.id, body, photo_url, video_url });
    setPosting(false);
    if (error) return toast.error(error.message);
    setDraft(""); setPhotoFile(null); setVideoFile(null);
    toast.success("Posted to the community feed");
    load();
  };

  const toggleLike = async (postId: string) => {
    if (!user) return toast.error("Sign in to like");
    const cur = likes.get(postId) ?? { count: 0, mine: false };
    const next = new Map(likes);
    next.set(postId, { count: cur.count + (cur.mine ? -1 : 1), mine: !cur.mine });
    setLikes(next);
    if (cur.mine) {
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
    } else {
      await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
    }
  };

  const toggleCommentsOpen = (postId: string) => {
    const next = new Set(openComments);
    next.has(postId) ? next.delete(postId) : next.add(postId);
    setOpenComments(next);
  };

  const addComment = async (postId: string, body: string) => {
    if (!user) return toast.error("Sign in to comment");
    const trimmed = body.trim();
    if (!trimmed) return;
    const { data, error } = await supabase.from("post_comments").insert({ post_id: postId, user_id: user.id, body: trimmed }).select().single();
    if (error) return toast.error(error.message);
    const next = new Map(comments);
    const arr = next.get(postId) ?? [];
    arr.push(data as Comment);
    next.set(postId, arr);
    setComments(next);
  };

  return (
    <div className="space-y-4">
      {/* Composer */}
      {user ? (
        <form onSubmit={submit} className="bg-card rounded-2xl border border-border shadow-card p-3 space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Share an update, promote a listing, or post a tip…"
            maxLength={1000}
            className="resize-none min-h-[64px] border-0 focus-visible:ring-0 px-0 text-sm"
          />
          {photoFile && (
            <div className="relative">
              <img src={URL.createObjectURL(photoFile)} alt="" className="w-full max-h-60 object-cover rounded-xl" />
              <button type="button" onClick={() => setPhotoFile(null)} className="absolute top-2 right-2 w-7 h-7 bg-foreground/70 text-background rounded-full flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}
          {videoFile && (
            <div className="relative">
              <video src={URL.createObjectURL(videoFile)} muted controls className="w-full max-h-60 object-cover rounded-xl" />
              <button type="button" onClick={() => setVideoFile(null)} className="absolute top-2 right-2 w-7 h-7 bg-foreground/70 text-background rounded-full flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}
          <div className="flex items-center justify-between pt-1 border-t border-border">
            <div className="flex gap-1">
              <input ref={photoRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onPickPhoto(e.target.files[0])} />
              <input ref={videoRef} type="file" accept="video/*" hidden onChange={(e) => e.target.files?.[0] && onPickVideo(e.target.files[0])} />
              <Button type="button" variant="ghost" size="sm" onClick={() => photoRef.current?.click()}><ImagePlus className="w-4 h-4" />Photo</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => videoRef.current?.click()}><VideoIcon className="w-4 h-4" />Video</Button>
            </div>
            <Button type="submit" size="sm" variant="hero" disabled={!draft.trim() || posting}>
              {posting ? "Posting…" : "Post"}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">Photos ≤{MAX_PHOTO_MB}MB · videos ≤{MAX_VIDEO_MB}MB & 30s. We compress for low data use.</p>
        </form>
      ) : (
        <div className="bg-card rounded-2xl border border-border shadow-soft p-4 text-center text-sm text-muted-foreground">
          <Link to="/auth" className="text-primary font-semibold">Sign in</Link> to post and engage with the community.
        </div>
      )}

      {/* Feed */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => <div key={i} className="h-40 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : posts.length ? posts.map((p) => {
        const prof = profiles.get(p.user_id);
        const lk = likes.get(p.id) ?? { count: 0, mine: false };
        const cmts = comments.get(p.id) ?? [];
        const open = openComments.has(p.id);
        return (
          <article key={p.id} className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
            <header className="flex items-center gap-2.5 p-3">
              <Link to={`/seller/${p.user_id}`} className="flex-shrink-0">
                <Avatar name={prof?.name} url={prof?.avatar_url ?? null} size="sm" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/seller/${p.user_id}`} className="font-semibold text-sm flex items-center gap-1">
                  {prof?.name ?? "MUST Student"}
                  {prof?.is_verified_seller && <BadgeCheck className="w-3.5 h-3.5 text-primary" />}
                </Link>
                <p className="text-[11px] text-muted-foreground">{timeAgo(p.created_at)}</p>
              </div>
            </header>
            <p className="px-3 pb-3 text-sm whitespace-pre-wrap leading-relaxed">{p.body}</p>
            {p.photo_url && <img src={p.photo_url} alt="" loading="lazy" className="w-full max-h-96 object-cover" />}
            {p.video_url && <video src={p.video_url} controls playsInline preload="metadata" className="w-full max-h-96 bg-foreground" />}
            <div className="flex items-center gap-1 px-2 py-1.5 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => toggleLike(p.id)} className={lk.mine ? "text-destructive" : ""}>
                <Heart className={`w-4 h-4 ${lk.mine ? "fill-current" : ""}`} /> {lk.count || ""}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => toggleCommentsOpen(p.id)}>
                <MessageCircle className="w-4 h-4" /> {cmts.length || ""}
              </Button>
            </div>
            {open && (
              <div className="border-t border-border bg-muted/30 px-3 py-2 space-y-1.5">
                {cmts.length === 0 && <p className="text-[11px] text-muted-foreground py-1">Be the first to comment</p>}
                {cmts.map((c) => {
                  const cp = profiles.get(c.user_id);
                  return (
                    <div key={c.id} className="text-xs">
                      <Link to={`/seller/${c.user_id}`} className="font-semibold">{cp?.name ?? "Student"}</Link>{" "}
                      <span className="text-foreground/90">{c.body}</span>
                    </div>
                  );
                })}
                <CommentInput onSubmit={(b) => addComment(p.id, b)} disabled={!user} />
              </div>
            )}
          </article>
        );
      }) : (
        <div className="bg-card rounded-2xl border border-border shadow-soft p-6 text-center">
          <Megaphone className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No posts yet. Be the first to share!</p>
        </div>
      )}
    </div>
  );
};

const CommentInput = ({ onSubmit, disabled }: { onSubmit: (body: string) => void; disabled?: boolean }) => {
  const [v, setV] = useState("");
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (v.trim()) { onSubmit(v); setV(""); } }}
      className="flex items-center gap-2 pt-1"
    >
      <Input value={v} onChange={(e) => setV(e.target.value)} placeholder="Add a comment…" maxLength={280} disabled={disabled} className="h-8 text-xs rounded-full" />
      <Button type="submit" size="icon" variant="ghost" disabled={!v.trim() || disabled} className="h-8 w-8 flex-shrink-0">
        <Send className="w-3.5 h-3.5" />
      </Button>
    </form>
  );
};
