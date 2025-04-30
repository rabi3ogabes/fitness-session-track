import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [logo, setLogo] = useState<string | null>(null);
  const [headerColor, setHeaderColor] = useState<string | null>(null);
  
  useEffect(() => {
    // Load logo and header color from local storage
    const savedLogo = localStorage.getItem("gymLogo");
    const savedHeaderColor = localStorage.getItem("headerBackgroundColor");
    
    if (savedLogo) {
      setLogo(savedLogo);
    }
    
    if (savedHeaderColor) {
      setHeaderColor(savedHeaderColor);
    }
  }, []);
  
  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      if (isAdmin) {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    }
  }, [isAuthenticated, isAdmin, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gym-light to-white">
      <header 
        className="container mx-auto py-6 px-4 flex justify-between items-center"
        style={headerColor ? { backgroundColor: headerColor } : {}}
      >
        <div className="flex items-center">
          {logo ? (
            <div className="h-10">
              <img 
                src={logo} 
                alt="FitTrack Pro Logo" 
                className="h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <span className="text-2xl font-bold text-gym-blue">FitTrack Pro</span>
          )}
        </div>
        <div>
          <Link to="/login" className="px-6 py-2 bg-gym-blue hover:bg-gym-dark-blue text-white rounded-md transition-colors">
            Login
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="max-w-xl animate-fade-in">
            <h1 className="text-5xl font-bold mb-6 text-gym-dark">
              Streamlined Gym Management System
            </h1>
            <p className="text-lg mb-8 text-gray-600">
              A complete solution for gym owners and members. Manage memberships, book sessions, track attendance, and more.
            </p>
            <div className="flex gap-4">
              <Link
                to="/login"
                className="px-8 py-3 bg-gym-blue hover:bg-gym-dark-blue text-white rounded-md transition-colors text-lg font-medium"
              >
                Get Started
              </Link>
              <a
                href="#features"
                className="px-8 py-3 border border-gym-blue text-gym-blue hover:bg-gym-light rounded-md transition-colors text-lg font-medium"
              >
                Learn More
              </a>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <img
              src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Gym workout"
              className="rounded-lg shadow-xl max-w-full md:max-w-md h-auto"
            />
          </div>
        </div>

        <section id="features" className="py-16">
          <h2 className="text-3xl font-bold mb-12 text-center">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="bg-gym-light w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gym-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">User Roles</h3>
              <p className="text-gray-600">Separate dashboards for administrators and members with role-specific functionality.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="bg-gym-light w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gym-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Session Booking</h3>
              <p className="text-gray-600">Effortless class booking with membership session tracking and management.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="bg-gym-light w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gym-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Membership Management</h3>
              <p className="text-gray-600">Easily manage different membership packages with automated session tracking.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gym-dark text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              {logo ? (
                <div className="h-10">
                  <img 
                    src={logo} 
                    alt="FitTrack Pro Logo" 
                    className="h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <span className="text-xl font-bold">FitTrack Pro</span>
              )}
            </div>
            <div className="text-sm">
              &copy; 2025 FitTrack Pro. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
