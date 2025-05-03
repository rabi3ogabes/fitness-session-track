
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Members from "./pages/admin/Members";
import Trainers from "./pages/admin/Trainers";
import Classes from "./pages/admin/Classes";
import ClassSchedulePage from "./pages/admin/components/classes/ClassSchedulePage";
import Memberships from "./pages/admin/Memberships";
import Bookings from "./pages/admin/Bookings";
import Payments from "./pages/admin/Payments";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";
import UserProfile from "./pages/user/UserProfile";
import UserMembership from "./pages/user/UserMembership";
import UserBooking from "./pages/user/UserBooking";
import UserSchedule from "./pages/user/UserSchedule";
import ClassCalendar from "./pages/user/ClassCalendar";
import TrainerDashboard from "./pages/trainer/TrainerDashboard";
import AttendeesPage from "./pages/trainer/AttendeesPage";

// Context
import { AuthProvider } from "./context/AuthContext";

const queryClient = new QueryClient();

// Protected route component to handle redirections based on role
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isTrainer } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Admin protected route
const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Trainer home redirect component
const TrainerHomeRedirect = () => {
  const { isAuthenticated, isTrainer } = useAuth();
  
  if (isAuthenticated && isTrainer) {
    return <Navigate to="/trainer" />;
  }
  
  return <Index />;
};

// User dashboard component with role-based redirection
const UserDashboardRedirect = () => {
  const { isAuthenticated, isAdmin, isTrainer } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (isAdmin) {
    return <Navigate to="/admin" />;
  }
  
  if (isTrainer) {
    return <Navigate to="/trainer" />;
  }
  
  return <Dashboard />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<TrainerHomeRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<UserDashboardRedirect />} />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            } />
            <Route path="/admin/members" element={
              <AdminProtectedRoute>
                <Members />
              </AdminProtectedRoute>
            } />
            <Route path="/admin/trainers" element={
              <AdminProtectedRoute>
                <Trainers />
              </AdminProtectedRoute>
            } />
            <Route path="/admin/classes" element={
              <AdminProtectedRoute>
                <ClassSchedulePage />
              </AdminProtectedRoute>
            } />
            <Route path="/admin/memberships" element={
              <AdminProtectedRoute>
                <Memberships />
              </AdminProtectedRoute>
            } />
            <Route path="/admin/bookings" element={
              <AdminProtectedRoute>
                <Bookings />
              </AdminProtectedRoute>
            } />
            <Route path="/admin/payments" element={
              <AdminProtectedRoute>
                <Payments />
              </AdminProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <AdminProtectedRoute>
                <Reports />
              </AdminProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <AdminProtectedRoute>
                <Settings />
              </AdminProtectedRoute>
            } />

            {/* User Routes */}
            <Route path="/user/profile" element={<UserProfile />} />
            <Route path="/user/membership" element={<UserMembership />} />
            <Route path="/user/booking" element={<UserBooking />} />
            <Route path="/user/schedule" element={<UserSchedule />} />
            <Route path="/user/calendar" element={<ClassCalendar />} />
            
            {/* Trainer Routes */}
            <Route path="/trainer" element={
              <ProtectedRoute>
                <TrainerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/trainer/attendees" element={
              <ProtectedRoute>
                <AttendeesPage />
              </ProtectedRoute>
            } />

            {/* 404 Page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
