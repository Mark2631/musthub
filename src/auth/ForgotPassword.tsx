import { FormEvent, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { emailSchema } from "@/auth/validators";
import { supabase } from "@/lib/supabase";

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
});

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState<"request" | "reset">(
    searchParams.get("mode") === "reset" ? "reset" : "request",
  );
  const [loading, setLoading] = useState(false);

  const requestReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      emailSchema.parse(email);
    } catch (error) {
      const message = error instanceof z.ZodError ? error.errors[0]?.message : "Invalid email";
      toast.error(message);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/auth/callback?mode=reset`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password reset link sent. Check your inbox.");
  };

  const updatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validated = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!validated.success) return toast.error(validated.error.errors[0]?.message ?? "Invalid password");
    if (password !== confirmPassword) return toast.error("Passwords do not match");

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated. You can now sign in.");
    window.location.assign("/auth/login");
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border rounded-2xl p-6 shadow-card">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <h1 className="text-2xl font-bold mb-1">Reset password</h1>
        <p className="text-sm text-muted-foreground mb-5">
          {mode === "request"
            ? "We will email a reset link to your student account."
            : "Set your new password."}
        </p>
        {mode === "request" ? (
          <form className="space-y-4" onSubmit={requestReset}>
            <div>
              <Label htmlFor="email">Student email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@students.must.ac.ke"
                required
              />
            </div>
            <Button className="w-full" type="submit" size="xl" disabled={loading}>
              {loading ? "Sending link..." : "Send reset link"}
            </Button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={updatePassword}>
            <div>
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button className="w-full" type="submit" size="xl" disabled={loading}>
              {loading ? "Updating..." : "Update password"}
            </Button>
          </form>
        )}
        <div className="text-xs text-muted-foreground mt-4 flex justify-between">
          <Link to="/auth/login" className="text-primary hover:underline">
            Back to login
          </Link>
          {mode === "request" ? (
            <button type="button" className="text-primary hover:underline" onClick={() => setMode("reset")}>
              I already opened reset link
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
