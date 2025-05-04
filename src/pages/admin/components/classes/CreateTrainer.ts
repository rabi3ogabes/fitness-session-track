
import { supabase, requireAuth } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

interface TrainerData {
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  status: string;
  gender?: string;
}

export const useTrainerCreation = () => {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  // Function to check authentication before any operations
  const checkAuthenticationStatus = async () => {
    console.log("Checking authentication status, isAuthenticated:", isAuthenticated);
    
    // Double-check with Supabase to confirm session is active
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Session check error:", error);
      toast({
        title: "Authentication error",
        description: "There was a problem verifying your authentication status.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!session) {
      console.error("Not authenticated in useTrainerCreation hook");
      toast({
        title: "Authentication required",
        description: "You need to be logged in to manage trainers.",
        variant: "destructive",
      });
      navigate("/login");
      return false;
    }
    
    return true;
  };

  // Create a new trainer
  const createTrainer = async (trainerData: TrainerData) => {
    setIsCreating(true);
    console.log("Creating trainer with data:", trainerData);
    
    try {
      // Verify authentication with Supabase directly
      const isAuth = await checkAuthenticationStatus();
      if (!isAuth) return { success: false };
      
      console.log("Authentication confirmed, proceeding with trainer creation");
      
      const { data, error } = await supabase
        .from("trainers")
        .insert([
          {
            name: trainerData.name,
            email: trainerData.email,
            phone: trainerData.phone || null,
            specialization: trainerData.specialization || null,
            status: trainerData.status,
            gender: trainerData.gender,
          },
        ])
        .select();

      if (error) {
        console.error("Error creating trainer:", error);
        throw error;
      }

      console.log("Trainer created successfully:", data);
      toast({
        title: "Trainer created",
        description: `${trainerData.name} has been added as a trainer`,
      });
      
      return { success: true, data };
    } catch (error: any) {
      console.error("Error in createTrainer function:", error);
      toast({
        title: "Failed to create trainer",
        description: error.message || "There was an error creating the trainer",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsCreating(false);
    }
  };

  // Create a test trainer for demo purposes
  const createTestTrainer = async () => {
    try {
      // Verify authentication with Supabase directly
      const isAuth = await checkAuthenticationStatus();
      if (!isAuth) return false;
      
      console.log("Authentication confirmed, proceeding with test trainer check/creation");
      
      // Check if we already have trainers
      const { data: existingTrainers, error: checkError } = await supabase
        .from("trainers")
        .select("id")
        .limit(1);
        
      if (checkError) {
        console.error("Error checking trainers:", checkError);
        return false;
      }
      
      // If we already have trainers, no need to create test ones
      if (existingTrainers && existingTrainers.length > 0) {
        console.log("Trainers already exist, not creating test trainer");
        return true;
      }
      
      console.log("No trainers found, creating test trainer");
      
      // Create a test trainer if none exist
      const { error: insertError } = await supabase
        .from("trainers")
        .insert({
          name: "John Doe",
          email: "john.doe@example.com",
          status: "Active",
          gender: "Male",
          specialization: "General Fitness"
        });
        
      if (insertError) {
        console.error("Error creating test trainer:", insertError);
        return false;
      }
      
      console.log("Test trainer created successfully");
      return true;
    } catch (error) {
      console.error("Unexpected error creating test trainer:", error);
      return false;
    }
  };

  return {
    createTrainer,
    createTestTrainer,
    isCreating
  };
};
