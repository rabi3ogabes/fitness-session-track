
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { 
  LayoutDashboard, 
  Users, 
  User, 
  Calendar, 
  CreditCard, 
  BookOpen, 
  ChartBar, 
  Settings 
} from "lucide-react";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { isAdmin, user } = useAuth();

  const adminLinks = [
    { to: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { to: "/admin/members", label: "Members", icon: <Users className="h-5 w-5" /> },
    { to: "/admin/trainers", label: "Trainers", icon: <User className="h-5 w-5" /> },
    { to: "/admin/classes", label: "Classes", icon: <Calendar className="h-5 w-5" /> },
    { to: "/admin/memberships", label: "Memberships", icon: <BookOpen className="h-5 w-5" /> },
    { to: "/admin/bookings", label: "Bookings", icon: <Calendar className="h-5 w-5" /> },
    { to: "/admin/payments", label: "Payments", icon: <CreditCard className="h-5 w-5" /> },
    { to: "/admin/reports", label: "Reports", icon: <ChartBar className="h-5 w-5" /> },
  ];

  const userLinks = [
    { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { to: "/user/profile", label: "Profile", icon: <User className="h-5 w-5" /> },
    { to: "/user/membership", label: "Membership", icon: <BookOpen className="h-5 w-5" /> },
    { to: "/user/booking", label: "Book Session", icon: <Calendar className="h-5 w-5" /> },
    { to: "/user/schedule", label: "Schedule", icon: <Calendar className="h-5 w-5" /> },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  return (
    <div className={`${collapsed ? "w-20" : "w-64"} min-h-screen bg-white shadow-md transition-all duration-300`}>
      <div className="p-4 border-b border-gray-200">
        <div className={`flex ${collapsed ? "justify-center" : "justify-between"} items-center`}>
          {!collapsed && (
            <h1 className="text-xl font-bold text-gym-blue">FitTrack Pro</h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-500 hover:text-gym-blue"
          >
            {collapsed ? "→" : "←"}
          </button>
        </div>
      </div>

      <nav className="mt-6">
        <ul className="space-y-2 px-2">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center p-3 rounded-md transition-colors ${
                    isActive
                      ? "bg-gym-blue text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`
                }
              >
                {link.icon}
                {!collapsed && <span className="ml-3">{link.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="absolute bottom-4 left-0 right-0 p-4">
        {!collapsed && (
          <div className="text-center text-sm text-gray-500">
            <p>Logged in as</p>
            <p className="font-semibold">{user?.name}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
