import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Mail, Phone, GraduationCap, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";

export default function Profile() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      setName(data?.name ?? "");
      setPhone(data?.phone ?? "");
      setEmail(data?.email ?? user.email ?? "");
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ name: name.trim(), phone: phone.trim() }).eq("user_id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    setEditing(false);
  };

  const handleSignOut = async () => {
    await signOut();
    nav("/auth", { replace: true });
  };

  return (
    <div>
      <header className="px-4 pt-5 pb-3 bg-card border-b border-border flex items-center justify-between">
        <Logo compact />
        <span className="text-xs font-semibold text-muted-foreground">Profile</span>
      </header>

      <section className="p-5">
        <div className="bg-card rounded-3xl p-6 shadow-card text-center">
          <div className="w-20 h-20 rounded-full gradient-primary mx-auto flex items-center justify-center text-primary-foreground text-3xl font-extrabold shadow-floating">
            {(name || email || "M")[0].toUpperCase()}
          </div>
          <h2 className="font-bold text-lg mt-3">{name || "MUST Student"}</h2>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
            <GraduationCap className="w-3 h-3" /> Meru University of Science & Tech
          </p>
        </div>

        <div className="mt-5 bg-card rounded-2xl p-5 shadow-soft space-y-4">
          <div>
            <Label htmlFor="n">Name</Label>
            <Input id="n" value={name} disabled={!editing} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="p" className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> Phone</Label>
            <Input id="p" type="tel" value={phone} disabled={!editing} onChange={(e) => setPhone(e.target.value)} />
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

        <Button variant="ghost" className="w-full mt-5 text-destructive hover:text-destructive" onClick={handleSignOut}>
          <LogOut className="w-4 h-4" />Log out
        </Button>
      </section>
      <Footer />
    </div>
  );
}
