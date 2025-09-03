import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Commands from "./pages/Commands";
import Giveaways from "./pages/Giveaways";
import ChatMonitor from "./pages/ChatMonitor";
import BotSettings from "./pages/BotSettings";
import KickIntegration from "./pages/KickIntegration";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import KickCallback from "./pages/KickCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<KickCallback />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/commands" element={
            <ProtectedRoute>
              <Layout>
                <Commands />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/giveaways" element={
            <ProtectedRoute>
              <Layout>
                <Giveaways />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute>
              <Layout>
                <ChatMonitor />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/bot-settings" element={
            <ProtectedRoute>
              <Layout>
                <BotSettings />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/kick-integration" element={
            <ProtectedRoute>
              <Layout>
                <KickIntegration />
              </Layout>
            </ProtectedRoute>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;