import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passwordSchema = z.string().min(6, "Min 6 characters").max(72);
const nameSchema = z.string().trim().min(2, "Enter your name").max(80);
const phoneSchema = z.string().trim().min(7, "Enter a valid phone").max(20);

export default function Auth() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("login");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPwd, setLoginPwd] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPwd, setSignupPwd] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPwd);
    } catch (err: any) {
      toast.error(err.errors?.[0]?.message ?? "Invalid input");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPwd });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    nav("/", { replace: true });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      nameSchema.parse(name);
      phoneSchema.parse(phone);
      emailSchema.parse(signupEmail);
      passwordSchema.parse(signupPwd);
    } catch (err: any) {
      toast.error(err.errors?.[0]?.message ?? "Invalid input");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPwd,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { name, phone },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created! You're in.");
    nav("/", { replace: true });
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/` });
    if (result.error) {
      setLoading(false);
      toast.error(result.error.message ?? "Google sign-in failed");
      return;
    }
    if (!result.redirected) {
      setLoading(false);
      nav("/", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-5 max-w-screen-sm mx-auto">
      <div className="w-full">
        <div className="flex justify-center mb-6"><Logo /></div>

        <div className="bg-card rounded-3xl shadow-card p-6">
          <h1 className="text-2xl font-extrabold text-center mb-1">Welcome to MUST</h1>
          <p className="text-sm text-center text-muted-foreground mb-5">Buy, sell, rent & find services on campus</p>

          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-5">
              <TabsTrigger value="login">Log in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <Label htmlFor="le">Email</Label>
                  <Input id="le" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="you@students.must.ac.ke" />
                </div>
                <div>
                  <Label htmlFor="lp">Password</Label>
                  <Input id="lp" type="password" value={loginPwd} onChange={(e) => setLoginPwd(e.target.value)} placeholder="••••••" />
                </div>
                <Button type="submit" disabled={loading} variant="hero" size="xl" className="w-full">
                  {loading ? "Logging in..." : "Log in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-3">
                <div>
                  <Label htmlFor="n">Full name</Label>
                  <Input id="n" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Wanjiru" />
                </div>
                <div>
                  <Label htmlFor="p">Phone (WhatsApp)</Label>
                  <Input id="p" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254 7XX XXX XXX" />
                </div>
                <div>
                  <Label htmlFor="se">Email</Label>
                  <Input id="se" type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder="you@students.must.ac.ke" />
                </div>
                <div>
                  <Label htmlFor="sp">Password</Label>
                  <Input id="sp" type="password" value={signupPwd} onChange={(e) => setSignupPwd(e.target.value)} placeholder="At least 6 characters" />
                </div>
                <Button type="submit" disabled={loading} variant="hero" size="xl" className="w-full">
                  {loading ? "Creating..." : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or</span></div>
          </div>

          <Button onClick={handleGoogle} disabled={loading} variant="outline" size="xl" className="w-full">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-5">
          Built for MUST students • Free & simple
        </p>
      </div>
    </div>
  );
}
