import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AppLayout } from "@/components/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "@/auth/Login";
import Signup from "@/auth/Signup";
import ForgotPassword from "@/auth/ForgotPassword";
import AuthCallback from "@/auth/AuthCallback";
import NotFound from "./pages/NotFound";

const Onboarding = lazy(() => import("./pages/Onboarding"));
const Home = lazy(() => import("./pages/Home"));
const Browse = lazy(() => import("./pages/Browse"));
const PostListing = lazy(() => import("./pages/PostListing"));
const ListingDetail = lazy(() => import("./pages/ListingDetail"));
const MyListings = lazy(() => import("./pages/MyListings"));
const MySchool = lazy(() => import("./pages/MySchool"));
const Messages = lazy(() => import("./pages/Messages"));
const Conversation = lazy(() => import("./pages/Conversation"));
const Profile = lazy(() => import("./pages/Profile"));
const SellerProfile = lazy(() => import("./pages/SellerProfile"));
const Admin = lazy(() => import("./pages/Admin"));

const queryClient = new QueryClient();
const RouteLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" />
        <BrowserRouter>
          <AuthProvider>
            <ErrorBoundary>
              <Suspense fallback={<RouteLoader />}>
                <Routes>
                  <Route path="/auth" element={<Navigate to="/auth/login" replace />} />
                  <Route path="/auth/login" element={<Login />} />
                  <Route path="/auth/signup" element={<Signup />} />
                  <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />

                  <Route
                    path="/onboarding"
                    element={<ProtectedRoute><AppLayout><Onboarding /></AppLayout></ProtectedRoute>}
                  />
                  <Route path="/" element={<ProtectedRoute><AppLayout><Home /></AppLayout></ProtectedRoute>} />
                  <Route path="/browse" element={<ProtectedRoute><AppLayout><Browse /></AppLayout></ProtectedRoute>} />
                  <Route path="/post" element={<ProtectedRoute><AppLayout><PostListing /></AppLayout></ProtectedRoute>} />
                  <Route path="/edit/:id" element={<ProtectedRoute><AppLayout><PostListing /></AppLayout></ProtectedRoute>} />
                  <Route path="/listing/:id" element={<ProtectedRoute><AppLayout><ListingDetail /></AppLayout></ProtectedRoute>} />
                  <Route path="/my-listings" element={<ProtectedRoute><AppLayout><MyListings /></AppLayout></ProtectedRoute>} />
                  <Route path="/my-school" element={<ProtectedRoute><AppLayout><MySchool /></AppLayout></ProtectedRoute>} />
                  <Route path="/messages" element={<ProtectedRoute><AppLayout><Messages /></AppLayout></ProtectedRoute>} />
                  <Route path="/messages/:id" element={<ProtectedRoute><AppLayout><Conversation /></AppLayout></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>} />
                  <Route path="/seller/:userId" element={<ProtectedRoute><AppLayout><SellerProfile /></AppLayout></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute><AppLayout><Admin /></AppLayout></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
