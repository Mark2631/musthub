import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Mail, Phone, GraduationCap, Save, BadgeCheck, HelpCircle, ListChecks, MessageCircle, Upload, Camera, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar } from "@/components/Avatar";
import { PhoneInput, isValidKEMobile } from "@/components/PhoneInput";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HELP_CONTACT } from "@/lib/constants";
import { toast } from "sonner";

export default function Profile() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [verified, setVerified] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      setName(data?.name ?? "");
      setPhone(data?.phone ?? "");
      setEmail(data?.email ?? user.email ?? "");
      setVerified(!!data?.is_verified_seller);
      setAvatarUrl(data?.avatar_url ?? null);
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    if (phone && !isValidKEMobile(phone)) {
      return toast.error("Enter a valid Kenyan mobile (7XXXXXXXX or 1XXXXXXXX)");
    }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ name: name.trim(), phone: phone.trim() }).eq("user_id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    setEditing(false);
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) return toast.error("Image must be under 3 MB");
    setUploadingAvatar(true);
    try {
      const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, cacheControl: "3600" });
      if (upErr) throw upErr;
      const url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      const { error: updErr } = await supabase.from("profiles").update({ avatar_url: url }).eq("user_id", user.id);
      if (updErr) throw updErr;
      setAvatarUrl(url);
      toast.success("Profile picture updated 📸");
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const uploadSchoolId = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5 MB");
    setUploadingId(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/school-id.${ext}`;
      const { error: upErr } = await supabase.storage.from("school-ids").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ school_id_path: path, is_verified_seller: true })
        .eq("user_id", user.id);
      if (updErr) throw updErr;
      setVerified(true);
      toast.success("Verified Seller badge unlocked! ✅");
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploadingId(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    nav("/", { replace: true });
  };

  return (
    <div>
      <header className="px-4 pt-5 pb-3 bg-card border-b border-border flex items-center justify-between">
        <Logo compact />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="text-xs font-semibold text-muted-foreground">Profile</span>
        </div>
      </header>

      <section className="p-5">
        <div className="bg-card rounded-3xl p-6 shadow-card text-center border border-border">
          <div className="relative w-24 h-24 mx-auto">
            <Avatar name={name || email} url={avatarUrl} size="xl" className="w-24 h-24 text-3xl shadow-floating border-4 border-card" />
            <label className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-card cursor-pointer border-2 border-card hover:scale-105 transition-transform">
              <input type="file" accept="image/*" hidden onChange={uploadAvatar} disabled={uploadingAvatar} />
              {uploadingAvatar ? (
                <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </label>
          </div>
          <h2 className="font-bold text-lg mt-3 flex items-center justify-center gap-1.5">
            {name || "MUST Student"}
            {verified && <BadgeCheck className="w-5 h-5 text-primary" fill="currentColor" stroke="hsl(var(--primary-foreground))" />}
          </h2>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
            <GraduationCap className="w-3 h-3" /> Meru University of Science & Tech
          </p>
        </div>

        <div className="mt-5 bg-card rounded-2xl p-5 shadow-soft border border-border space-y-4">
          <div>
            <Label htmlFor="n">Name</Label>
            <Input id="n" value={name} disabled={!editing} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="p" className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> Phone</Label>
            <PhoneInput id="p" value={phone} disabled={!editing} onChange={setPhone} />
          </div>
          <div>
            <Label htmlFor="e" className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> Email</Label>
            <Input id="e" value={email} disabled />
          </div>

          {editing ? (
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setEditing(false)}>Cancel</Button>
              <Button variant="hero" className="flex-1" onClick={save} disabled={saving}>
                <Save className="w-4 h-4" />{saving ? "Saving..." : "Save"}
              </Button>
            </div>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setEditing(true)}>Edit profile</Button>
          )}
        </div>

        {/* Verification card */}
        <div className="mt-5 bg-card rounded-2xl p-5 shadow-soft border border-border">
          <div className="flex items-start gap-3">
            <BadgeCheck className={`w-6 h-6 flex-shrink-0 ${verified ? "text-primary" : "text-muted-foreground"}`} />
            <div className="flex-1">
              <h3 className="font-bold text-sm">Verified Seller</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {verified
                  ? "You're verified — buyers see a badge on your listings."
                  : "Upload your MUST student ID to earn a Verified Seller badge."}
              </p>
            </div>
          </div>

          {!verified && (
            <>
              <div className="mt-4 rounded-xl bg-muted/40 border border-border p-4 text-xs leading-relaxed space-y-2">
                <p className="font-semibold text-foreground text-sm">
                  Upload a valid MUST Students' Smart Card (Student ID) to become a Verified Seller.
                </p>
                <div>
                  <p className="font-medium text-foreground">It must clearly show:</p>
                  <ul className="mt-1 space-y-0.5 text-muted-foreground">
                    <li>• Your photo</li>
                    <li>• Full name</li>
                    <li>• Student registration number</li>
                    <li>• Meru University of Science and Technology (MUST) name or logo</li>
                  </ul>
                </div>
              </div>

              <label className="mt-3 block">
                <input type="file" accept="image/*" className="hidden" onChange={uploadSchoolId} disabled={uploadingId} />
                <span className={`flex items-center justify-center gap-2 w-full h-10 rounded-md border border-input text-sm font-medium cursor-pointer hover:bg-muted/50 transition-colors ${uploadingId ? "opacity-50" : ""}`}>
                  <Upload className="w-4 h-4" />
                  {uploadingId ? "Uploading..." : "Upload School ID"}
                </span>
              </label>
            </>
          )}
        </div>

        {/* Quick links */}
        <div className="mt-5 bg-card rounded-2xl shadow-soft border border-border overflow-hidden divide-y divide-border">
          <button onClick={() => nav("/my-listings")} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm hover:bg-muted/50 transition-colors text-left">
            <ListChecks className="w-4 h-4 text-primary" />
            <span className="font-medium flex-1">My Listings</span>
          </button>
          {isAdmin && (
            <button onClick={() => nav("/admin")} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm hover:bg-muted/50 transition-colors text-left">
              <Shield className="w-4 h-4 text-primary" />
              <span className="font-medium flex-1">Admin Dashboard</span>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">ADMIN</span>
            </button>
          )}
          <Dialog>
            <DialogTrigger asChild>
              <button className="w-full flex items-center gap-3 px-4 py-3.5 text-sm hover:bg-muted/50 transition-colors text-left">
                <HelpCircle className="w-4 h-4 text-primary" />
                <span className="font-medium flex-1">Help & Support</span>
              </button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader><DialogTitle>Need help?</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground">Reach out to the creator anytime.</p>
              <div className="space-y-2 mt-2">
                <Button asChild variant="hero" className="w-full">
                  <a href={`https://wa.me/${HELP_CONTACT.whatsapp.replace(/[^\d]/g, "")}?text=${encodeURIComponent("Hi, I need help with MeruCampusHub")}`} target="_blank" rel="noreferrer">
                    <MessageCircle className="w-4 h-4" /> WhatsApp us
                  </a>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <a href={`tel:${HELP_CONTACT.phone}`}><Phone className="w-4 h-4" /> Call us</a>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <a href={`mailto:${HELP_CONTACT.email}?subject=MeruCampusHub support`}><Mail className="w-4 h-4" /> Email us</a>
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {!isAdmin && <AdminClaim onClaimed={() => window.location.reload()} />}

        <Button variant="ghost" className="w-full mt-5 text-destructive hover:text-destructive" onClick={handleSignOut}>
          <LogOut className="w-4 h-4" />Log out
        </Button>
      </section>
      <Footer />
    </div>
  );
}

const AdminClaim = ({ onClaimed }: { onClaimed: () => void }) => {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    const { data, error } = await supabase.rpc("claim_admin", { _code: code.trim() });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    if (data === true) {
      toast.success("Admin access granted ✅");
      onClaimed();
    } else {
      toast.error("Invalid code");
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="w-full mt-3 text-[10px] text-muted-foreground/60 hover:text-muted-foreground py-1 transition-colors">
        Have an admin code?
      </button>
    );
  }
  return (
    <div className="mt-3 bg-card rounded-2xl p-3 shadow-soft border border-border flex gap-2">
      <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter admin code" className="flex-1" type="password" />
      <Button onClick={submit} variant="hero" size="sm" disabled={!code.trim() || submitting}>
        {submitting ? "..." : "Unlock"}
      </Button>
    </div>
  );
};
