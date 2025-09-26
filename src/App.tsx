import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/auth/AuthProvider";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { SupportChat } from "./components/SupportChat";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import StreamerAuth from "./pages/StreamerAuth";
import AuthCallback from "./pages/AuthCallback";
import DiscordCallback from "./pages/DiscordCallback";
import NotFound from "./pages/NotFound";
import Giveaways from "./pages/Giveaways";
import SlotsCalls from "./pages/SlotsCalls";
import BonusHunt from "./pages/BonusHunt";
import SlotsOverlayPage from "./pages/SlotsOverlayPage";
import BonusHuntOverlayPage from "./pages/BonusHuntOverlayPage";
import Account from "./pages/Account";
import KickOnboarding from "./pages/KickOnboarding";
import Admin from "./pages/Admin";
import ViewerBenefits from "./pages/ViewerBenefits";
import ViewerRegistration from "./pages/ViewerRegistration";
import ViewerVerification from "./pages/ViewerVerification";
import UpgradeToStreamer from "./pages/UpgradeToStreamer";
import StreamerUpgradeRequest from "./pages/StreamerUpgradeRequest";

import TestSlotsOverlay from "./pages/admin/TestSlotsOverlay";
import TestBonusHuntOverlay from "./pages/admin/TestBonusHuntOverlay";

// Create QueryClient at module level with minimal configuration
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/streamer-auth" element={<StreamerAuth />} />
            <Route path="/viewer-benefits" element={<ViewerBenefits />} />
            <Route path="/viewer-registration" element={<ViewerRegistration />} />
            <Route path="/viewer-verification" element={<ViewerVerification />} />
            <Route path="/upgrade-to-streamer" element={<UpgradeToStreamer />} />
            <Route path="/streamer-upgrade-request" element={<StreamerUpgradeRequest />} />
            <Route path="/kick-onboarding" element={<KickOnboarding />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/discord/callback" element={<DiscordCallback />} />
            <Route path="/overlay/slots" element={<SlotsOverlayPage />} />
            <Route path="/bonus-hunt-overlay" element={<BonusHuntOverlayPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/giveaways"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Giveaways />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <Layout>
                    <History />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/slots-calls"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SlotsCalls />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/bonus-hunt"
              element={
                <ProtectedRoute>
                  <Layout>
                    <BonusHunt />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Admin />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/test-overlay/slots"
              element={<TestSlotsOverlay />}
            />
            <Route
              path="/test-overlay/bonus-hunt"
              element={<TestBonusHuntOverlay />}
            />
            <Route
              path="/upgrade-to-streamer"
              element={
                <ProtectedRoute>
                  <UpgradeToStreamer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <SupportChat />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;