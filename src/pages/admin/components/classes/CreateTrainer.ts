import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { TrainerFormData } from "../trainers/types"; // Ensure this type is suitable or adjust as needed

// The TrainerData interface might be slightly different from TrainerFormData
// For this hook, let's align with TrainerFormData or a compatible subset.
// If TrainerFormData is Omit<Trainer, 'id' | 'created_at'>, it should work.
interface TrainerCreationData extends Omit<TrainerFormData, 'id' | 'created_at'> {
  // No 'id' or 'created_at' when creating
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
  const createTrainer = async (trainerData: TrainerCreationData) => {
    setIsCreating(true);
    console.log("Creating trainer with data:", trainerData);

    try {
      const isAuth = await checkAuthenticationStatus();
      if (!isAuth) {
        console.error("Authentication check failed for trainer creation");
        setIsCreating(false);
        return { success: false, error: new Error("Authentication failed") };
      }

      console.log("Authentication confirmed, proceeding with trainer creation");

      const formattedData = {
        name: trainerData.name.trim(),
        email: trainerData.email.trim(),
        phone: trainerData.phone?.trim() || null,
        specialization: trainerData.specialization?.trim() || null,
        status: trainerData.status || "Active",
        gender: trainerData.gender || "Female", // Ensure default matches form if applicable
      };

      console.log("Formatted data for insertion into 'trainers' table:", formattedData);

      // Step 1: Insert into 'trainers' table
      const { data: dbRecord, error: dbError } = await supabase
        .from("trainers")
        .insert([formattedData])
        .select()
        .single(); // Assuming you expect a single record back

      if (dbError) {
        console.error("Error creating trainer in Supabase 'trainers' table:", dbError);
        // Check for specific error types like duplicate email if your DB has unique constraints
        if (dbError.message?.includes('duplicate key') && dbError.message?.includes('email')) {
           toast({
            title: "Trainer email already exists",
            description: "A trainer with this email already exists in the trainers list.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Failed to add trainer to list",
            description: dbError.message || "Could not save trainer details.",
            variant: "destructive",
          });
        }
        return { success: false, error: dbError };
      }

      console.log("Trainer record created successfully in 'trainers' table:", dbRecord);

      // Step 2: If phone is provided, attempt to create Auth user via Edge Function
      if (trainerData.phone && trainerData.phone.trim() !== "") {
        try {
          console.log(`Attempting to create auth user for ${trainerData.email} with phone as password.`);
          const { data: authFuncResponse, error: authFuncError } = await supabase.functions.invoke('create-trainer-user', {
            body: { email: trainerData.email.trim(), password: trainerData.phone.trim() },
          });

          if (authFuncError) {
            // Network error or function invocation error
            console.error("Error invoking create-trainer-user Edge Function:", authFuncError);
            throw new Error(authFuncError.message || "Failed to call auth user creation service.");
          }

          // Edge function invoked, check its response
          if (authFuncResponse?.error) {
            console.error("Edge Function returned an error:", authFuncResponse.error);
            throw new Error(authFuncResponse.error || "Auth user creation failed within edge function.");
          }
          
          console.log("Auth user creation successful:", authFuncResponse);
          toast({
            title: "Trainer & Login Account Created",
            description: `${trainerData.name} has been added. Their login account is set up with their phone number as the password.`,
          });
          return { success: true, data: dbRecord };

        } catch (authCreationError: any) {
          console.error("Error during auth user creation process:", authCreationError);
          // Trainer record was inserted, but Auth user creation failed.
          toast({
            title: "Trainer Added, Login Setup Failed",
            description: `${trainerData.name}'s details were saved, but login account creation failed: ${authCreationError.message}. Please try setting up their login manually.`,
            variant: "default",
            duration: 7000,
          });
          // Still return success as the primary operation (DB insert) succeeded.
          // Include a warning for the calling function to potentially act upon.
          return { success: true, data: dbRecord, warning: `Auth account creation failed: ${authCreationError.message}` };
        }
      } else {
        // Phone not provided, so only trainer record is created.
        toast({
          title: "Trainer Added (No Login Account)",
          description: `${trainerData.name} has been added to the list. No phone number was provided, so a login account was not created.`,
          variant: "default",
          duration: 7000,
        });
        return { success: true, data: dbRecord };
      }

    } catch (error: any) { // General catch for unexpected errors in createTrainer
      console.error("Outer error in createTrainer function:", error);
      toast({
        title: "Failed to create trainer",
        description: error.message || "An unexpected error occurred.",
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
