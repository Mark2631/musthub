import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { saveIntendedPath } from "@/auth/redirect";

type Props = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    const intended = `${location.pathname}${location.search}${location.hash}`;
    saveIntendedPath(intended);
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}
