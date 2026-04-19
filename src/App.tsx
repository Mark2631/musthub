import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AppLayout } from "@/components/AppLayout";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import PostListing from "./pages/PostListing";
import ListingDetail from "./pages/ListingDetail";
import MyListings from "./pages/MyListings";
import MySchool from "./pages/MySchool";
import Messages from "./pages/Messages";
import Conversation from "./pages/Conversation";
import Profile from "./pages/Profile";
import SellerProfile from "./pages/SellerProfile";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<AppLayout><Onboarding /></AppLayout>} />
              <Route path="/" element={<AppLayout><Home /></AppLayout>} />
              <Route path="/browse" element={<AppLayout><Browse /></AppLayout>} />
              <Route path="/post" element={<AppLayout><PostListing /></AppLayout>} />
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
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
