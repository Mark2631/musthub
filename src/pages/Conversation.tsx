import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ChevronLeft, Send, BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/Avatar";
import { toast } from "sonner";

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read: boolean;
  created_at: string;
};

type Conv = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
};

export default function Conversation() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const nav = useNavigate();
  const [conv, setConv] = useState<Conv | null>(null);
  const [otherName, setOtherName] = useState("");
  const [otherVerified, setOtherVerified] = useState(false);
  const [otherAvatar, setOtherAvatar] = useState<string | null>(null);
  const [otherId, setOtherId] = useState<string>("");
  const [listingTitle, setListingTitle] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || !user) return;
    let mounted = true;

    (async () => {
      const { data: c } = await supabase.from("conversations").select("*").eq("id", id).maybeSingle();
      if (!c || !mounted) return;
      setConv(c as Conv);
      const other = c.buyer_id === user.id ? c.seller_id : c.buyer_id;
      setOtherId(other);

      const [{ data: prof }, { data: l }, { data: msgs }] = await Promise.all([
        supabase.from("profiles").select("name,is_verified_seller,avatar_url").eq("user_id", other).maybeSingle(),
        supabase.from("listings").select("title").eq("id", c.listing_id).maybeSingle(),
        supabase.from("messages").select("*").eq("conversation_id", id).order("created_at"),
      ]);
      if (!mounted) return;
      setOtherName(prof?.name ?? "MUST Student");
      setOtherVerified(!!prof?.is_verified_seller);
      setOtherAvatar(prof?.avatar_url ?? null);
      setListingTitle(l?.title ?? "Listing");
      setMessages((msgs ?? []) as Message[]);

      // mark inbound as read
      await supabase.from("messages").update({ read: true }).eq("conversation_id", id).neq("sender_id", user.id).eq("read", false);
    })();

    const ch = supabase
      .channel(`conv-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` }, (payload) => {
        const m = payload.new as Message;
        setMessages((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
        if (m.sender_id !== user.id) {
          supabase.from("messages").update({ read: true }).eq("id", m.id);
        }
      })
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [id, user]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !conv || !user) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      conversation_id: conv.id,
      sender_id: user.id,
      body,
    });
    setSending(false);
    if (error) return toast.error(error.message);
    setDraft("");
  };

  if (!user) return <div className="p-10 text-center text-sm text-muted-foreground">Sign in to view this conversation.</div>;

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <header className="sticky top-0 z-30 bg-card border-b border-border px-3 py-3 flex items-center gap-2 shadow-soft">
        <button onClick={() => nav(-1)} className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <Link to={otherId ? `/seller/${otherId}` : "#"} className="flex items-center gap-2 flex-1 min-w-0">
          <Avatar name={otherName} url={otherAvatar} size="sm" />
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate flex items-center gap-1">
              {otherName}
              {otherVerified && <BadgeCheck className="w-3.5 h-3.5 text-primary" />}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">Re: {listingTitle}</p>
          </div>
        </Link>
        {conv && (
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link to={`/listing/${conv.listing_id}`}>View</Link>
          </Button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2 bg-muted/30">
        {messages.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground mt-10">Send the first message to start chatting.</p>
        ) : messages.map((m) => {
          const mine = m.sender_id === user.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-sm shadow-soft border ${
                  mine
                    ? "bg-primary text-primary-foreground border-primary rounded-br-md"
                    : "bg-card text-foreground border-border rounded-bl-md"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={`text-[9px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="sticky bottom-0 bg-card border-t border-border p-2.5 flex items-center gap-2 shadow-[0_-4px_12px_-6px_hsl(220_13%_18%_/_0.1)] pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          maxLength={2000}
          className="flex-1 rounded-full"
          disabled={sending}
        />
        <Button type="submit" size="icon" variant="hero" disabled={!draft.trim() || sending} className="rounded-full flex-shrink-0">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
