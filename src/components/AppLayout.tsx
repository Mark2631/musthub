import { ReactNode, useEffect, useState } from "react";
import { BottomNav } from "./BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) { setOnboarded(null); return; }
    supabase.from("profiles").select("onboarded").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      setOnboarded(data?.onboarded ?? false);
    });
  }, [user]);

  if (loading || (user && onboarded === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (onboarded === false && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="min-h-screen bg-muted/30 max-w-screen-sm mx-auto">
      <main className="safe-bottom">{children}</main>
      <BottomNav />
    </div>
  );
};
