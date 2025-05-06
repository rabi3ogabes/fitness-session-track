
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useState, useEffect } from "react";

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

// LoadingSpinner component for better UX during loading states
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="flex flex-col items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gym-blue mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Protected route component to handle redirections based on role
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isTrainer, loading } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  // If we're offline, allow access to certain routes for better UX
  if (!isAuthenticated && !isOnline) {
    // Store the current location so we can redirect after login
    const location = useLocation();
    localStorage.setItem('redirectAfterLogin', location.pathname);
    return <Navigate to="/login" state={{ from: location, offlineMode: true }} />;
  }
  
  if (!isAuthenticated) {
    // Store the current location so we can redirect after login
    const location = useLocation();
    localStorage.setItem('redirectAfterLogin', location.pathname);
    return <Navigate to="/login" state={{ from: location }} />;
  }
  
  return children;
};

// Admin protected route
const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  // If we're offline and trying to access admin routes with a stored admin role,
  // allow access for better offline UX
  const storedRole = localStorage.getItem('userRole');
  if (!isAuthenticated && !isOnline && storedRole === 'admin') {
    return children;
  }
  
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Trainer home redirect component
const TrainerHomeRedirect = () => {
  const { isAuthenticated, isTrainer, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (isAuthenticated && isTrainer) {
    return <Navigate to="/trainer" />;
  }
  
  return <Index />;
};

// User dashboard component with role-based redirection
const UserDashboardRedirect = () => {
  const { isAuthenticated, isAdmin, isTrainer, loading } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  // If offline, use stored role for routing
  if (!isAuthenticated && !isOnline) {
    const storedRole = localStorage.getItem('userRole');
    if (storedRole === 'admin') {
      return <Navigate to="/admin" />;
    } else if (storedRole === 'trainer') {
      return <Navigate to="/trainer" />;
    } else if (storedRole === 'user') {
      return <Dashboard />;
    } else {
      return <Navigate to="/login" />;
    }
  }
  
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
