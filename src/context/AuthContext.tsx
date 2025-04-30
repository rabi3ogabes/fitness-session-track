
import { createContext, useContext, useState, ReactNode, useEffect } from "react";

// Define user types
export type UserRole = "admin" | "user" | "trainer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isTrainer: boolean;
  isUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Sample users for demo
const MOCK_USERS = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@gym.com",
    password: "admin123",
    role: "admin" as UserRole
  },
  {
    id: "2", 
    name: "Regular User",
    email: "user@gym.com",
    password: "user123",
    role: "user" as UserRole
  },
  {
    id: "3",
    name: "Trainer",
    email: "trainer@gym.com",
    password: "trainer123",
    role: "trainer" as UserRole
  }
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // Check for stored user on load
  useEffect(() => {
    const storedUser = localStorage.getItem("gymUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // In a real app, this would be an API call
    const foundUser = MOCK_USERS.find(
      (u) => u.email === email && u.password === password
    );

    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem("gymUser", JSON.stringify(userWithoutPassword));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("gymUser");
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isTrainer: user?.role === "trainer",
    isUser: user?.role === "user",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
