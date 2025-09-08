import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { BondSearchProvider } from "@/contexts/BondSearchContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Index from "./pages/Index";
import SearchPage from "./pages/SearchPage";
import BondDetail from "./pages/BondDetail";
import CardEditor from "./pages/CardEditor";
import DMPage from "./pages/DMPage";
import TokenTestPage from "./pages/TokenTestPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <BondSearchProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/search" element={
                <ProtectedRoute>
                  <SearchPage />
                </ProtectedRoute>
              } />
              <Route path="/bond/:isin" element={
                <ProtectedRoute>
                  <BondDetail />
                </ProtectedRoute>
              } />
              <Route path="/card-editor/:isin" element={
                <ProtectedRoute>
                  <CardEditor />
                </ProtectedRoute>
              } />
              <Route path="/dm/:isin" element={
                <ProtectedRoute>
                  <DMPage />
                </ProtectedRoute>
              } />
              <Route path="/token-test" element={
                <ProtectedRoute>
                  <TokenTestPage />
                </ProtectedRoute>
              } />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </BondSearchProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
