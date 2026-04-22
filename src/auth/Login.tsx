import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { consumeIntendedPath } from "@/auth/redirect";
import { clearFailedAttempts, isRateLimited, trackFailedAttempt } from "@/auth/security";
import { emailSchema, passwordSchema } from "@/auth/validators";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const blocked = useMemo(() => isRateLimited(email), [email]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (blocked) {
      toast.error("Too many failed attempts. Please wait 15 minutes and try again.");
      return;
    }

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (error) {
      const message = error instanceof z.ZodError ? error.errors[0]?.message : "Invalid credentials";
      toast.error(message);
      return;
    }

    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    setLoading(false);

    if (error) {
      await trackFailedAttempt(normalizedEmail, error.message);
      console.warn("Failed login attempt", { email: normalizedEmail, reason: error.message });
      toast.error(error.message);
      return;
    }

    clearFailedAttempts(normalizedEmail);
    const destination = consumeIntendedPath();
    toast.success("Welcome back!");
    navigate(destination, { replace: true });
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border rounded-2xl p-6 shadow-card">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <h1 className="text-2xl font-bold mb-1">Log in</h1>
        <p className="text-sm text-muted-foreground mb-5">
          Use your MUST student account to continue.
        </p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@students.must.ac.ke"
              required
            />
          </div>
          <div>
            <div className="flex justify-between items-center">
              <Label htmlFor="password">Password</Label>
              <Link to="/auth/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
            />
          </div>
          <Button className="w-full" type="submit" size="xl" disabled={loading || blocked}>
            {loading ? "Signing in..." : blocked ? "Temporarily blocked" : "Sign in"}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-4">
          No account yet?{" "}
          <Link to="/auth/signup" className="text-primary hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
