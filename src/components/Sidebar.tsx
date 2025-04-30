import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import {
  Home,
  User,
  UsersRound,
  Dumbbell,
  CalendarDays,
  CreditCard,
  Settings,
  CalendarCheck,
  BadgeCheck,
  BarChart3,
  LogOut,
  Calendar,
  ExternalLink,
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isTrainer, logout, user } = useAuth();
  const isMobile = useIsMobile();
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    // Load logo from local storage
    const savedLogo = localStorage.getItem("gymLogo");
    if (savedLogo) {
      setLogo(savedLogo);
    }
    
    // Listen for storage changes (in case logo is updated in settings)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "gymLogo") {
        setLogo(e.newValue);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminNavItems = [
    { name: "Dashboard", path: "/admin", icon: <Home className="h-5 w-5" /> },
    { name: "Members", path: "/admin/members", icon: <UsersRound className="h-5 w-5" /> },
    { name: "Trainers", path: "/admin/trainers", icon: <User className="h-5 w-5" /> },
    { name: "Classes", path: "/admin/classes", icon: <Dumbbell className="h-5 w-5" /> },
    { name: "Bookings", path: "/admin/bookings", icon: <CalendarDays className="h-5 w-5" /> },
    { name: "Memberships", path: "/admin/memberships", icon: <BadgeCheck className="h-5 w-5" /> },
    { name: "Payments", path: "/admin/payments", icon: <CreditCard className="h-5 w-5" /> },
    { name: "Reports", path: "/admin/reports", icon: <BarChart3 className="h-5 w-5" /> },
    { name: "Settings", path: "/admin/settings", icon: <Settings className="h-5 w-5" /> },
  ];

  const userNavItems = [
    { name: "Dashboard", path: "/dashboard", icon: <Home className="h-5 w-5" /> },
    { name: "Calendar", path: "/user/calendar", icon: <Calendar className="h-5 w-5" /> },
    { name: "Class Schedule", path: "/user/schedule", icon: <CalendarCheck className="h-5 w-5" /> },
    { name: "Membership", path: "/user/membership", icon: <BadgeCheck className="h-5 w-5" /> },
  ];
  
  const trainerNavItems = [
    { name: "Dashboard", path: "/trainer", icon: <Home className="h-5 w-5" /> },
    { name: "Attendees", path: "/admin/bookings", icon: <CalendarDays className="h-5 w-5" /> },
    { name: "Class Schedule", path: "/user/schedule", icon: <CalendarCheck className="h-5 w-5" /> },
    { name: "Members", path: "/admin/members", icon: <UsersRound className="h-5 w-5" /> },
  ];

  let navItems = userNavItems;
  let userRole = "Member";
  
  if (isAdmin) {
    navItems = adminNavItems;
    userRole = "Admin";
  } else if (isTrainer) {
    navItems = trainerNavItems;
    userRole = "Trainer";
  }

  // Mock user name - in a real app, this would come from the auth context
  const userName = user?.name || "John Doe";

  return (
    <div className={cn(
      "bg-white shadow-md min-h-screen z-10 flex flex-col justify-between relative",
      isMobile ? "w-16" : "w-64"
    )}>
      <div>
        {/* Logo Section with black background */}
        <div className="bg-black p-4 flex flex-col items-center justify-center border-b">
          {logo ? (
            <div className={cn(
              "flex justify-center",
              isMobile ? "w-10 h-10" : "w-full h-12"
            )}>
              <img 
                src={logo} 
                alt="Gym Logo" 
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <h2 className={cn(
              "text-gym-blue font-bold",
              isMobile ? "text-xl" : "text-2xl"
            )}>
              {isMobile ? "GM" : "GYM SYSTEM"}
            </h2>
          )}
          
          {/* User info below the logo */}
          {!isMobile && (
            <div className="mt-2 text-center text-white">
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-gray-300">{userRole}</p>
            </div>
          )}
        </div>
        
        <nav className="mt-6">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center px-4 py-3 text-gray-700 hover:bg-gym-light hover:text-gym-blue transition-colors",
                    location.pathname === item.path && "bg-gym-light text-gym-blue font-medium"
                  )}
                >
                  <span className="mr-3">{item.icon}</span>
                  {!isMobile && <span>{item.name}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      
      {/* Fixed footer with profile, main page and logout icons */}
      <div className="mt-auto border-t border-gray-200">
        <div className="flex justify-around items-center py-3">
          <Link
            to="/user/profile"
            className="flex flex-col items-center text-gray-700 hover:text-gym-blue transition-colors"
            title="Profile"
          >
            <User className="h-6 w-6" />
            {!isMobile && <span className="text-xs mt-1">Profile</span>}
          </Link>
          
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center text-gray-700 hover:text-gym-blue transition-colors"
            title="Main Page"
          >
            <ExternalLink className="h-6 w-6" />
            {!isMobile && <span className="text-xs mt-1">Main Page</span>}
          </a>
          
          <button
            onClick={handleLogout}
            className="flex flex-col items-center text-gray-700 hover:text-gym-blue transition-colors"
            title="Logout"
          >
            <LogOut className="h-6 w-6" />
            {!isMobile && <span className="text-xs mt-1">Logout</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
