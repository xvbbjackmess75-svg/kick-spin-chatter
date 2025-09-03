import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/auth/AuthProvider";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Giveaways from "./pages/Giveaways";
import Commands from "./pages/Commands";
import ChatMonitor from "./pages/ChatMonitor";
import BotSettings from "./pages/BotSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/landing" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
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
              path="/commands"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Commands />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat-monitor"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ChatMonitor />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/bot-settings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <BotSettings />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;