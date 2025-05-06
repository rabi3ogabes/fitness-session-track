
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
    try {
      setIsCreating(true);
      console.log("Creating trainer with data:", trainerData);
      
      // Verify authentication
      const isAuth = await checkAuthenticationStatus();
      if (!isAuth) {
        setIsCreating(false);
        return { success: false };
      }
      
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
      
      // Attempt insertion with detailed logging
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

  // Create test trainers with improved error handling and feedback
  const createTestTrainer = async () => {
    setIsCreating(true);
    try {
      console.log("Starting test trainer creation");
      const isAuth = await checkAuthenticationStatus();
      if (!isAuth) {
        console.error("Authentication check failed for test trainer creation");
        setIsCreating(false);
        return false;
      }
      
      const testTrainers = [
        {
          name: "John Fitness",
          email: "john@example.com",
          phone: "123-456-7890",
          specialization: "Weight Training",
          status: "Active",
          gender: "Male"
        },
        {
          name: "Sarah Yoga",
          email: "sarah@example.com",
          phone: "987-654-3210",
          specialization: "Yoga",
          status: "Active",
          gender: "Female"
        },
        {
          name: "Mike Running",
          email: "mike@example.com",
          phone: "555-123-4567",
          specialization: "Cardio",
          status: "Active",
          gender: "Male"
        }
      ];
      
      console.log("Creating test trainers:", testTrainers);
      
      // Insert multiple trainers
      const { data, error } = await supabase
        .from("trainers")
        .insert(testTrainers)
        .select();
        
      if (error) {
        console.error("Error creating test trainers:", error);
        toast({
          title: "Failed to create test trainers",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }
      
      console.log("Test trainers created successfully:", data);
      toast({
        title: "Test trainers created",
        description: `${testTrainers.length} test trainers have been added`,
      });
      
      return true;
    } catch (error: any) {
      console.error("Error in createTestTrainer function:", error);
      toast({
        title: "Failed to create test trainers",
        description: error.message || "There was an error creating test trainers",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createTrainer,
    createTestTrainer,
    isCreating
  };
};
