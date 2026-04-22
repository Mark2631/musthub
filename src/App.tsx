import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AppLayout } from "@/components/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
                  <Route
                    path="/onboarding"
                    element={<AppLayout><Onboarding /></AppLayout>}
                  />
                  <Route path="/" element={<AppLayout><Home /></AppLayout>} />
                  <Route path="/browse" element={<AppLayout><Browse /></AppLayout>} />
                  <Route path="/post" element={<AppLayout><PostListing /></AppLayout>} />
                  <Route path="/edit/:id" element={<AppLayout><PostListing /></AppLayout>} />
                  <Route path="/listing/:id" element={<AppLayout><ListingDetail /></AppLayout>} />
                  <Route path="/my-listings" element={<AppLayout><MyListings /></AppLayout>} />
                  <Route path="/my-school" element={<AppLayout><MySchool /></AppLayout>} />
                  <Route path="/messages" element={<AppLayout><Messages /></AppLayout>} />
                  <Route path="/messages/:id" element={<AppLayout><Conversation /></AppLayout>} />
                  <Route path="/profile" element={<AppLayout><Profile /></AppLayout>} />
                  <Route path="/seller/:userId" element={<AppLayout><SellerProfile /></AppLayout>} />
                  <Route path="/admin" element={<AppLayout><Admin /></AppLayout>} />
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
