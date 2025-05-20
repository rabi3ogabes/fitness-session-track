import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
export interface MembershipType {
  id: number;
  name: string;
  sessions: number;
  price: number;
  active: boolean;
  description: string;
}
// Initial membership types data
const initialMembershipTypes = [
  { id: 1, name: "Basic", sessions: 12, price: 250, active: true, description: "Perfect for trying out our gym facilities and classes" },
  { id: 2, name: "Standard", sessions: 4, price: 95, active: true, description: "Ideal for occasional gym-goers" },
  { id: 3, name: "Premium", sessions: 20, price: 350, active: true, description: "Best value for regular attendees" },
  { id: 4, name: "Ultimate", sessions: 30, price: 500, active: true, description: "For dedicated gym enthusiasts" },
];

// Define the context value type
interface MembershipContextType {
  membershipTypes: MembershipType[];
  setMembershipTypes: React.Dispatch<React.SetStateAction<MembershipType[]>>;
  updateMembershipType: (updatedType: MembershipType) => void;
  addMembershipType: (newType: Omit<MembershipType, "id">) => void;
  toggleMembershipstatus: (id: number) => void;
}



// Create the context
const MembershipContext = createContext<MembershipContextType | undefined>(undefined);

// Provider component
export const MembershipProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);

  // Load membership types from localStorage on component mount
  useEffect(() => {
    const storedTypes = localStorage.getItem("membershipTypes");
    if (storedTypes) {
      setMembershipTypes(JSON.parse(storedTypes));
    } else {
      setMembershipTypes(initialMembershipTypes);
      // Initialize localStorage with mock data if empty
      localStorage.setItem("membershipTypes", JSON.stringify(initialMembershipTypes));
    }
  }, []);

  // Update localStorage whenever membership types change
  useEffect(() => {
    if (membershipTypes.length > 0) {
      localStorage.setItem("membershipTypes", JSON.stringify(membershipTypes));
    }
  }, [membershipTypes]);

  // Function to update a membership type
  const updateMembershipType = (updatedType: MembershipType) => {
    const updatedTypes = membershipTypes.map((m) =>
      m.id === updatedType.id ? updatedType : m
    );
    
    setMembershipTypes(updatedTypes);
  };

  // Function to add a new membership type
  const addMembershipType = (newType: Omit<MembershipType, "id">) => {
    const id = membershipTypes.length > 0 
      ? Math.max(...membershipTypes.map((m) => m.id)) + 1 
      : 1;
    
    const updatedTypes = [...membershipTypes, { ...newType, id }];
    setMembershipTypes(updatedTypes);
  };

  // Function to toggle membership status
  const toggleMembershipstatus = (id: number) => {
    const updatedTypes = membershipTypes.map((m) =>
      m.id === id ? { ...m, active: !m.active } : m
    );
    
    setMembershipTypes(updatedTypes);
  };

  return (
    <MembershipContext.Provider 
      value={{ 
        membershipTypes, 
        setMembershipTypes, 
        updateMembershipType, 
        addMembershipType,
        toggleMembershipstatus
      }}
    >
      {children}
    </MembershipContext.Provider>
  );
};

// Custom hook to use the membership context
export const useMembership = () => {
  const context = useContext(MembershipContext);
  if (context === undefined) {
    throw new Error("useMembership must be used within a MembershipProvider");
  }
  return context;
};