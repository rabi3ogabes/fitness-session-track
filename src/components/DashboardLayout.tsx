
import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
  const { isAuthenticated, logout, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated after loading is complete
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      console.log("Not authenticated, redirecting to login from DashboardLayout");
      navigate("/login");
    }
  }, [isAuthenticated, loading, navigate]);

  // Show loading or nothing while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gym-blue mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
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
