
import { supabase } from "@/integrations/supabase/client";
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
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  // Function to check authentication before any operations
  const checkAuthenticationStatus = async () => {
    console.log("Checking authentication status, isAuthenticated:", isAuthenticated);
    
    if (!isAuthenticated) {
      console.error("Not authenticated");
      toast({
        title: "Authentication required",
        description: "You need to be logged in to manage trainers.",
        variant: "destructive",
      });
      navigate("/login");
      return false;
    }
    
    if (!isAdmin) {
      console.error("Not admin");
      toast({
        title: "Admin access required",
        description: "You need admin access to manage trainers.",
        variant: "destructive",
      });
      return false;
    }
    
    console.log("Authentication confirmed for trainer operations");
    
    // Check with Supabase for active session
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
    
    return true;
  };

  // Create a new trainer
  const createTrainer = async (trainerData: TrainerData) => {
    setIsCreating(true);
    console.log("Creating trainer with data:", trainerData);
    
    try {
      // Verify authentication
      const isAuth = await checkAuthenticationStatus();
      if (!isAuth) return { success: false };
      
      console.log("Authentication confirmed, proceeding with trainer creation");
      
      // Ensure all data is properly formatted before insertion
      const formattedData = {
        name: trainerData.name.trim(),
        email: trainerData.email.trim(),
        phone: trainerData.phone?.trim() || null,
        specialization: trainerData.specialization?.trim() || null,
        status: trainerData.status || "Active",
        gender: trainerData.gender || null
      };
      
      console.log("Formatted data for insertion:", formattedData);
      
      // Attempt direct insertion with detailed logging
      console.log("Calling supabase.from('trainers').insert()...");
      const { data, error } = await supabase
        .from("trainers")
        .insert([formattedData])
        .select();
      console.log("Supabase insert operation completed");

      if (error) {
        console.error("Error creating trainer in Supabase:", error);
        throw error;
      }

      console.log("Trainer created successfully in Supabase:", data);
      toast({
        title: "Trainer created",
        description: `${trainerData.name} has been added as a trainer`,
      });
      
      return { success: true, data };
    } catch (error: any) {
      console.error("Error in createTrainer function:", error);
      
      // Additional error logging to help diagnose issues
      if (error.message?.includes('permission denied')) {
        console.error("This appears to be a permissions issue. Check RLS policies for the trainers table.");
      }
      
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

  // Create test trainers directly in Supabase
  const createTestTrainer = async () => {
    try {
      // Verify authentication
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
      
      console.log("No trainers found, creating test trainers");
      
      // Create multiple test trainers
      const testTrainers = [
        {
          name: "John Doe",
          email: "john.doe@example.com",
          status: "Active",
          gender: "Male",
          specialization: "General Fitness"
        },
        {
          name: "Jane Smith",
          email: "jane.smith@example.com",
          status: "Active",
          gender: "Female",
          specialization: "Yoga"
        },
        {
          name: "Mike Johnson",
          email: "mike.johnson@example.com",
          status: "Active",
          gender: "Male",
          specialization: "CrossFit"
        }
      ];
      
      // Insert all test trainers
      const { error: insertError } = await supabase
        .from("trainers")
        .insert(testTrainers);
        
      if (insertError) {
        console.error("Error creating test trainers:", insertError);
        return false;
      }
      
      console.log("Test trainers created successfully");
      return true;
    } catch (error) {
      console.error("Unexpected error creating test trainers:", error);
      return false;
    }
  };

  return {
    createTrainer,
    createTestTrainer,
    isCreating
  };
};
