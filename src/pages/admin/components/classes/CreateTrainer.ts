
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
    
    if (!session) {
      console.error("No active session found");
      toast({
        title: "Session expired",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  // Create a new trainer with improved error handling
  const createTrainer = async (trainerData: TrainerData) => {
    try {
      setIsCreating(true);
      console.log("Creating trainer with data:", trainerData);
      
      // Verify authentication
      const isAuth = await checkAuthenticationStatus();
      if (!isAuth) {
        console.error("Authentication check failed for trainer creation");
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
      
      try {
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
      } catch (dbError: any) {
        console.error("Database operation error:", dbError);
        
        // Check for specific error types
        if (dbError.message?.includes('duplicate key')) {
          toast({
            title: "Trainer already exists",
            description: "A trainer with this email already exists in the system",
            variant: "destructive",
          });
        } else {
          throw dbError; // Re-throw for general error handling
        }
        
        return { success: false, error: dbError };
      }
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
      
      try {
        // Insert multiple trainers
        const { data, error } = await supabase
          .from("trainers")
          .insert(testTrainers)
          .select();
          
        if (error) {
          console.error("Error creating test trainers:", error);
          
          // Check if it's a duplicate key error, which might not be a problem
          if (error.message?.includes('duplicate key')) {
            console.log("Some trainers may already exist, attempting to fetch existing trainers");
            
            // Try to fetch trainers to see if we already have some
            const { data: existingTrainers, error: fetchError } = await supabase
              .from("trainers")
              .select("*")
              .limit(10);
              
            if (!fetchError && existingTrainers && existingTrainers.length > 0) {
              console.log("Found existing trainers:", existingTrainers);
              toast({
                title: "Using existing trainers",
                description: `Found ${existingTrainers.length} existing trainers in the system`,
              });
              return true;
            } else {
              throw error; // Re-throw if we couldn't find existing trainers
            }
          } else {
            throw error;
          }
        }
        
        console.log("Test trainers created successfully:", data);
        toast({
          title: "Test trainers created",
          description: `${testTrainers.length} test trainers have been added`,
        });
        
        return true;
      } catch (dbError) {
        console.error("Database operation error for test trainers:", dbError);
        throw dbError;
      }
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
