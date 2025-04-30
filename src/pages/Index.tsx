
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-20 flex flex-col items-center text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          <span className="text-gym-blue">FitTrack</span> Pro
        </h1>
        <p className="text-xl md:text-2xl max-w-3xl mb-10">
          The ultimate gym management system for trainers, members, and administrators.
          Track your fitness journey, manage classes, and achieve your goals.
        </p>
        
        {isAuthenticated ? (
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/dashboard"
              className="px-6 py-3 bg-gym-blue hover:bg-gym-dark-blue rounded-md font-medium transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/login"
              className="px-6 py-3 bg-gym-blue hover:bg-gym-dark-blue rounded-md font-medium transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 border border-white hover:bg-white hover:text-black rounded-md font-medium transition-colors"
            >
              Sign Up
            </Link>
          </div>
        )}
      </header>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Our Features</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4 text-gym-blue">Class Booking</h3>
            <p>Book and manage your fitness classes with ease. Never miss a session with our reminder system.</p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4 text-gym-blue">Progress Tracking</h3>
            <p>Track your fitness journey with detailed statistics and visualizations to keep you motivated.</p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4 text-gym-blue">Membership Management</h3>
            <p>Manage your membership, payments, and subscriptions all in one place.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-bold text-gym-blue">FitTrack Pro</h2>
              <p className="text-gray-400">© 2025 All rights reserved</p>
            </div>
            
            <div className="flex gap-6">
              <Link to="/login" className="text-gray-300 hover:text-white">Login</Link>
              <a href="#" className="text-gray-300 hover:text-white">About</a>
              <a href="#" className="text-gray-300 hover:text-white">Contact</a>
              <a href="#" className="text-gray-300 hover:text-white">Privacy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
