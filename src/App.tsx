import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { initializeDefaultData } from "./services/storage";
import Dashboard from "./pages/Dashboard";
import EventsList from "./pages/EventsList";
import TicketSales from "./pages/TicketSales";
import ScannerPage from "./pages/ScannerPage";
import Artists from "./pages/Artists";
import ArtistProfile from "./pages/ArtistProfile";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    initializeDefaultData();
  }, []);

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/events" element={<Layout><EventsList /></Layout>} />
          <Route path="/tickets" element={<Layout><TicketSales /></Layout>} />
          <Route path="/scanner" element={<Layout><ScannerPage /></Layout>} />
          <Route path="/artists" element={<Layout><Artists /></Layout>} />
          <Route path="/artists/:id" element={<Layout><ArtistProfile /></Layout>} />
          <Route path="/reports" element={<Layout><Reports /></Layout>} />
          <Route path="/settings" element={<Layout><Settings /></Layout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export default App;
