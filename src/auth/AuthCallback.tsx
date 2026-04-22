import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { consumeIntendedPath } from "@/auth/redirect";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handle = async () => {
      const mode = searchParams.get("mode");
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        toast.error("Authentication failed. Please try again.");
        navigate("/auth/login", { replace: true });
        return;
      }

      if (mode === "reset") {
        navigate("/auth/forgot-password?mode=reset", { replace: true });
        return;
      }

      if (data.session) {
        toast.success("Email confirmed successfully.");
        navigate(consumeIntendedPath(), { replace: true });
        return;
      }

      navigate("/auth/login", { replace: true });
    };

    handle();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
