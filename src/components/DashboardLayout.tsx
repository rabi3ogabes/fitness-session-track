
import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "./Sidebar";
import LoadingIndicator from "./LoadingIndicator";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
  const { isAuthenticated, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [localLoading, setLocalLoading] = useState(true);

  // Redirect if not authenticated after loading is complete
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      // Only show loading briefly to improve perceived performance
      if (!authLoading) {
        // Set a short timeout to reduce flickering between states
        setTimeout(() => {
          if (isMounted) {
            if (!isAuthenticated) {
              navigate("/login");
            } else {
              setLocalLoading(false);
            }
          }
        }, 100); // Short timeout improves perceived performance
      }
    };

    checkAuth();
    
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, authLoading, navigate]);

  // Show loading while checking authentication or in local loading state
  // Use a smaller loading indicator that doesn't take the full screen
  if (authLoading || localLoading) {
    return <LoadingIndicator message={`Loading ${title.toLowerCase()}...`} size="small" />;
  }

  // Don't render content if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <header className="bg-white shadow-sm p-4 flex flex-wrap justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">{title}</h1>
          <div className="mt-2 md:mt-0">
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gym-blue hover:bg-gym-dark-blue text-white rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="p-4 md:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
