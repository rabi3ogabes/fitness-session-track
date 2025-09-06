import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
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

  // Load membership types from database on component mount
  useEffect(() => {
    const fetchMembershipTypes = async () => {
      try {
        const { data, error } = await supabase
          .from('membership_types')
          .select('*')
          .order('id');
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setMembershipTypes(data);
        }
      } catch (error) {
        console.error('Error fetching membership types:', error);
        // Fallback to localStorage if database fails
        const storedTypes = localStorage.getItem("membershipTypes");
        if (storedTypes) {
          setMembershipTypes(JSON.parse(storedTypes));
        } else {
          setMembershipTypes(initialMembershipTypes);
        }
      }
    };

    fetchMembershipTypes();
  }, []);

  // Function to update a membership type
  const updateMembershipType = async (updatedType: MembershipType) => {
    try {
      const { error } = await supabase
        .from('membership_types')
        .update({
          name: updatedType.name,
          sessions: updatedType.sessions,
          price: updatedType.price,
          description: updatedType.description,
          active: updatedType.active
        })
        .eq('id', updatedType.id);

      if (error) throw error;

      const updatedTypes = membershipTypes.map((m) =>
        m.id === updatedType.id ? updatedType : m
      );
      
      setMembershipTypes(updatedTypes);
    } catch (error) {
      console.error('Error updating membership type:', error);
      // Fallback to local update
      const updatedTypes = membershipTypes.map((m) =>
        m.id === updatedType.id ? updatedType : m
      );
      setMembershipTypes(updatedTypes);
    }
  };

  // Function to add a new membership type
  const addMembershipType = async (newType: Omit<MembershipType, "id">) => {
    try {
      const { data, error } = await supabase
        .from('membership_types')
        .insert([{
          name: newType.name,
          sessions: newType.sessions,
          price: newType.price,
          description: newType.description,
          active: newType.active
        }])
        .select()
        .single();

      if (error) throw error;

      const updatedTypes = [...membershipTypes, data];
      setMembershipTypes(updatedTypes);
    } catch (error) {
      console.error('Error adding membership type:', error);
      // Fallback to local addition
      const id = membershipTypes.length > 0 
        ? Math.max(...membershipTypes.map((m) => m.id)) + 1 
        : 1;
      
      const updatedTypes = [...membershipTypes, { ...newType, id }];
      setMembershipTypes(updatedTypes);
    }
  };

  // Function to toggle membership status
  const toggleMembershipstatus = async (id: number) => {
    try {
      const currentType = membershipTypes.find(m => m.id === id);
      if (!currentType) return;

      const { error } = await supabase
        .from('membership_types')
        .update({ active: !currentType.active })
        .eq('id', id);

      if (error) throw error;

      const updatedTypes = membershipTypes.map((m) =>
        m.id === id ? { ...m, active: !m.active } : m
      );
      
      setMembershipTypes(updatedTypes);
    } catch (error) {
      console.error('Error toggling membership status:', error);
      // Fallback to local update
      const updatedTypes = membershipTypes.map((m) =>
        m.id === id ? { ...m, active: !m.active } : m
      );
      setMembershipTypes(updatedTypes);
    }
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