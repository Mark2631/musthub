import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { emailSchema, passwordSchema } from "@/auth/validators";
import { supabase } from "@/lib/supabase";

const nameSchema = z.string().trim().min(2, "Enter your full name").max(80);

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      nameSchema.parse(name);
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (error) {
      const message = error instanceof z.ZodError ? error.errors[0]?.message : "Invalid input";
      toast.error(message);
      return;
    }

    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { name: name.trim() },
      },
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Account created. Check your email to confirm before logging in.");
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border rounded-2xl p-6 shadow-card">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <h1 className="text-2xl font-bold mb-1">Create account</h1>
        <p className="text-sm text-muted-foreground mb-5">MUST students only.</p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
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
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              required
            />
          </div>
          <Button className="w-full" type="submit" size="xl" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-4">
          Already registered?{" "}
          <Link to="/auth/login" className="text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
