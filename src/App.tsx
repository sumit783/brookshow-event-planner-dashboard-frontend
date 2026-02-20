import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { initializeDefaultData } from "./services/storage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyOtp from "./pages/VerifyOtp";
import Dashboard from "./pages/Dashboard";
import EventsList from "./pages/EventsList";
import CreateEvent from "./pages/CreateEvent";
import EventDetails from "./pages/EventDetails";
import TicketSales from "./pages/TicketSales";
import ScannerPage from "./pages/ScannerPage";
import Artists from "./pages/Artists";
import ArtistProfile from "./pages/ArtistProfile";
import PlannerProfile from "./pages/PlannerProfile";
import Employees from "./pages/Employees";
import Reports from "./pages/Reports";
import Wallet from "./pages/Wallet";
import Settings from "./pages/Settings";
import CompleteProfile from "./pages/CompleteProfile";
import UpdateEvent from "./pages/UpdateEvent";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    initializeDefaultData();
  }, []);

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route
              path="/complete-profile"
              element={
                <ProtectedRoute>
                  <CompleteProfile />
                </ProtectedRoute>
              }
            />

            {/* Protected routes */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/events" element={<EventsList />} />
              <Route path="/events/create" element={<CreateEvent />} />
              <Route path="/events/edit/:id" element={<UpdateEvent />} />
              <Route path="/events/:id" element={<EventDetails />} />
              <Route path="/tickets" element={<TicketSales />} />
              <Route path="/scanner" element={<ScannerPage />} />
              <Route path="/artists" element={<Artists />} />
              <Route path="/artists/:id" element={<ArtistProfile />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/profile" element={<PlannerProfile />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Catch all - redirect to login if not authenticated, otherwise 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export default App;
