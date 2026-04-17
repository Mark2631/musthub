import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ArrowRight, ShoppingBag, Wrench, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { INTERESTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Role = "buyer" | "seller" | "both";
const ROLE_OPTIONS: { value: Role; label: string; desc: string; icon: typeof ShoppingBag }[] = [
  { value: "buyer", label: "Buyer only", desc: "I just want to browse & buy", icon: ShoppingBag },
  { value: "seller", label: "Seller", desc: "I want to sell items or services", icon: Wrench },
  { value: "both", label: "Both", desc: "Buy and sell — most flexible", icon: GraduationCap },
];

export default function Onboarding() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [interests, setInterests] = useState<string[]>([]);
  const [role, setRole] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleInterest = (id: string) =>
    setInterests((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const finish = async (chosenRole: Role) => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ interests, user_role: chosenRole, onboarded: true })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome to MeruCampusHub! 🎉");
    nav("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="px-5 pt-8 pb-4">
        <Logo />
        <p className="text-xs text-muted-foreground mt-2">Quick setup ({step}/2)</p>
      </header>

      <div className="px-5 pb-10">
        {step === 1 && (
          <>
            <h1 className="text-2xl font-extrabold tracking-tight">What are you interested in?</h1>
            <p className="text-sm text-muted-foreground mt-1">Pick all that apply.</p>
            <div className="space-y-2.5 mt-5">
              {INTERESTS.map((opt) => {
                const active = interests.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleInterest(opt.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-2xl bg-card shadow-soft text-left transition-all border-2",
                      active ? "border-primary" : "border-transparent"
                    )}
                  >
                    <span className="font-semibold">{opt.label}</span>
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                        active ? "bg-primary border-primary" : "border-border"
                      )}
                    >
                      {active && <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
            <Button
              variant="hero"
              size="xl"
              className="w-full mt-6"
              disabled={interests.length === 0}
              onClick={() => setStep(2)}
            >
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-2xl font-extrabold tracking-tight">What do you want to do?</h1>
            <p className="text-sm text-muted-foreground mt-1">You can change this later.</p>
            <div className="space-y-2.5 mt-5">
              {ROLE_OPTIONS.map(({ value, label, desc, icon: Icon }) => {
                const active = role === value;
                return (
                  <button
                    key={value}
                    onClick={() => setRole(value)}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-2xl bg-card shadow-soft text-left transition-all border-2",
                      active ? "border-primary" : "border-transparent"
                    )}
                  >
                    <div className="w-11 h-11 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{label}</div>
                      <div className="text-xs text-muted-foreground">{desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)} disabled={saving}>
                Back
              </Button>
              <Button
                variant="hero"
                className="flex-1"
                disabled={!role || saving}
                onClick={() => role && finish(role)}
              >
                {saving ? "Saving..." : "Finish"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
