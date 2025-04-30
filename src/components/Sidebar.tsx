
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
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
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  const { isAdmin, isTrainer, logout } = useAuth();
  const isMobile = useIsMobile();

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
  if (isAdmin) {
    navItems = adminNavItems;
  } else if (isTrainer) {
    navItems = trainerNavItems;
  }

  return (
    <div className={cn(
      "bg-white shadow-md min-h-screen z-10 flex flex-col justify-between relative",
      isMobile ? "w-16" : "w-64"
    )}>
      <div>
        <div className="p-4 flex items-center justify-center">
          <h2 className={cn(
            "text-gym-dark font-bold",
            isMobile ? "text-xl" : "text-2xl"
          )}>
            {isMobile ? "GM" : "GYM SYSTEM"}
          </h2>
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
      
      {/* Fixed footer with profile and logout icons */}
      <div className="fixed bottom-0 left-0 w-16 sm:w-64 bg-gym-blue text-white z-20">
        <div className="flex justify-around items-center py-3">
          <Link
            to="/user/profile"
            className="flex flex-col items-center text-white hover:text-gym-light transition-colors"
            title="Profile"
          >
            <User className="h-6 w-6" />
            {!isMobile && <span className="text-xs mt-1">Profile</span>}
          </Link>
          
          <button
            onClick={logout}
            className="flex flex-col items-center text-white hover:text-gym-light transition-colors"
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
