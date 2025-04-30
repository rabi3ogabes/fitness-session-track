
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Members from "./pages/admin/Members";
import Trainers from "./pages/admin/Trainers";
import Classes from "./pages/admin/Classes";
import Memberships from "./pages/admin/Memberships";
import Bookings from "./pages/admin/Bookings";
import Payments from "./pages/admin/Payments";
import Reports from "./pages/admin/Reports";
import UserProfile from "./pages/user/UserProfile";
import UserMembership from "./pages/user/UserMembership";
import UserBooking from "./pages/user/UserBooking";
import UserSchedule from "./pages/user/UserSchedule";

// Context
import { AuthProvider } from "./context/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/members" element={<Members />} />
            <Route path="/admin/trainers" element={<Trainers />} />
            <Route path="/admin/classes" element={<Classes />} />
            <Route path="/admin/memberships" element={<Memberships />} />
            <Route path="/admin/bookings" element={<Bookings />} />
            <Route path="/admin/payments" element={<Payments />} />
            <Route path="/admin/reports" element={<Reports />} />
            
            {/* User Routes */}
            <Route path="/user/profile" element={<UserProfile />} />
            <Route path="/user/membership" element={<UserMembership />} />
            <Route path="/user/booking" element={<UserBooking />} />
            <Route path="/user/schedule" element={<UserSchedule />} />
            
            {/* Catch all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
