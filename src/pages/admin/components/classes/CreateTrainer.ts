
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
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  // Function to check authentication before any operations
  const checkAuthenticationStatus = async () => {
    console.log("Checking authentication status, isAuthenticated:", isAuthenticated);
    
    // Check if we're in demo mode first
    const mockRole = localStorage.getItem('userRole');
    if (mockRole) {
      console.log("Using demo mode with role:", mockRole);
      // If in demo mode, check if user is authenticated and admin in the context
      if (!isAuthenticated) {
        console.error("Not authenticated in demo mode");
        toast({
          title: "Authentication required",
          description: "You need to be logged in to manage trainers.",
          variant: "destructive",
        });
        navigate("/login");
        return false;
      }
      
      if (!isAdmin) {
        console.error("Not admin in demo mode");
        toast({
          title: "Admin access required",
          description: "You need admin access to manage trainers.",
          variant: "destructive",
        });
        return false;
      }
      
      console.log("Demo mode authentication confirmed for trainer operations");
      return true;
    }
    
    // If not in demo mode, check with Supabase
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
      console.error("Not authenticated with Supabase");
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
      // Verify authentication
      const isAuth = await checkAuthenticationStatus();
      if (!isAuth) return { success: false };
      
      console.log("Authentication confirmed, proceeding with trainer creation");
      
      // Check if we're in demo mode to handle the creation properly
      const mockRole = localStorage.getItem('userRole');
      if (mockRole) {
        console.log("Creating trainer in demo mode");
        
        // For demo mode, simulate a successful creation by generating an ID
        const demoId = Math.floor(Math.random() * 1000) + 10; // Random ID between 10 and 1010
        const createdTrainer = {
          id: demoId,
          name: trainerData.name,
          email: trainerData.email,
          phone: trainerData.phone || null,
          specialization: trainerData.specialization || null,
          status: trainerData.status,
          gender: trainerData.gender || null,
          created_at: new Date().toISOString()
        };
        
        toast({
          title: "Trainer created",
          description: `${trainerData.name} has been added as a trainer (demo mode)`,
        });
        
        return { success: true, data: [createdTrainer] };
      }
      
      // For actual Supabase mode, proceed with the real database operation
      const { data, error } = await supabase
        .from("trainers")
        .insert([
          {
            name: trainerData.name,
            email: trainerData.email,
            phone: trainerData.phone || null,
            specialization: trainerData.specialization || null,
            status: trainerData.status,
            gender: trainerData.gender || null,
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

  // Create test trainers for demo purposes
  const createTestTrainer = async () => {
    try {
      // Verify authentication
      const isAuth = await checkAuthenticationStatus();
      if (!isAuth) return false;
      
      // Handle differently based on mode
      const mockRole = localStorage.getItem('userRole');
      if (mockRole) {
        console.log("Creating test trainers in demo mode");
        // No need to check database in demo mode, we'll just create some trainers locally
        
        // Return true to indicate success
        return true;
      }
      
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
          name: "John Smith",
          email: "john.smith@example.com",
          status: "Active",
          gender: "Male",
          specialization: "General Fitness"
        },
        {
          name: "Sarah Wilson",
          email: "sarah.wilson@example.com",
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
