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
    console.log("Creating trainer with data (client-side auth):", trainerData);

    if (!trainerData.phone || trainerData.phone.trim() === "") {
      toast({
        title: "Phone number required for password",
        description: "The trainer's phone number is required to set their initial password.",
        variant: "destructive",
      });
      setIsCreating(false);
      return { success: false, error: new Error("Phone number required for password") };
    }

    try {
      // No need to call checkAuthenticationStatus as supabase.auth.signUp handles auth context
      // and provides email confirmation flow. Admin rights for this action
      // should be checked at the page/component level before calling createTrainer.

      console.log("Proceeding with trainer creation via supabase.auth.signUp");

      const trainerEmail = trainerData.email.trim();
      // Password is the phone number
      const trainerPassword = trainerData.phone.trim(); 
      const trainerName = trainerData.name.trim();

      // Step 1: Create Auth user using supabase.auth.signUp
      // This will send a confirmation email to the user.
      console.log(`Attempting to sign up auth user for ${trainerEmail}`);
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: trainerEmail,
        password: trainerPassword,
        options: {
          data: { // This becomes user_metadata which is accessible client-side after login
            role: 'trainer',
            name: trainerName,
            // You can add other metadata here if needed, e.g., initial_setup_complete: false
          }
        }
      });

      if (signUpError) {
        console.error("Error creating trainer auth user via signUp:", signUpError);
        toast({
          title: "Failed to create trainer login",
          description: signUpError.message || "Could not create authentication account.",
          variant: "destructive",
        });
        return { success: false, error: signUpError };
      }

      if (!authData.user) {
        // This case should ideally be covered by signUpError, but as a safeguard:
        console.error("No user data returned from signUp despite no error. This is unexpected.");
        toast({
          title: "Trainer login creation issue",
          description: "Authentication account creation did not return user data as expected. The user might not have been created.",
          variant: "destructive",
        });
        return { success: false, error: new Error("Auth user creation failed unexpectedly.") };
      }
      
      // Log specific details about the auth user created.
      // authData.session will be null until email is confirmed.
      console.log(`Auth user created successfully for ${trainerEmail}, ID: ${authData.user.id}. Awaiting email confirmation.`);
      
      // Step 2: Insert into 'trainers' table using the auth user's ID as the primary key (if 'id' in trainers table is UUID and FK to auth.users.id)
      // Or, if 'id' is an auto-incrementing integer, you might not need to link it directly here,
      // but it's good practice to have a user_id (UUID) column in 'trainers' that references auth.users.id.
      // For this example, assuming 'trainers' table has columns: name, email, phone, specialization, status, gender, and importantly user_id (uuid referencing auth.users.id)
      
      const formattedDataForDb = {
        // id: authData.user.id, // If your 'trainers.id' is the auth UUID and primary key
        user_id: authData.user.id, // If you have a separate user_id FK column
        name: trainerName,
        email: trainerEmail, // ensure email is unique in trainers table if it's not the PK
        phone: trainerData.phone?.trim() || null,
        specialization: trainerData.specialization?.trim() || null,
        status: trainerData.status || "Active", // Or perhaps "PendingConfirmation" until email is verified
        gender: trainerData.gender || "Female", // Or "Other" / Not Specified
      };

      console.log("Formatted data for insertion into 'trainers' table:", formattedDataForDb);

      // Insert into 'trainers' table
      const { data: dbRecord, error: dbError } = await supabase
        .from("trainers")
        .insert([formattedDataForDb])
        .select()
        .single(); // Use single() if you expect one record and want it directly, or just .select() for an array

      if (dbError) {
        console.error("Error creating trainer in Supabase 'trainers' table:", dbError);
        // If DB insert fails, the auth user still exists and needs to confirm their email.
        // This is a partial failure. The admin might need to manually add trainer details later
        // or there should be a retry mechanism.
        toast({
          title: "Trainer Login Created, but Details Save Failed",
          description: `Login for ${trainerName} created, but saving their details failed: ${dbError.message}. Please manually check/add details in the trainers list. The trainer needs to confirm their email.`,
          variant: "default", // Changed from "warning" to "default"
          duration: 10000,
        });
        // Consider this a partial success with warning, as auth user was made.
        // The 'data' returned would be null for the DB record part.
        return { success: true, data: null, warning: `Trainer details save failed: ${dbError.message}. Auth user ID: ${authData.user.id}` };
      }

      console.log("Trainer record created successfully in 'trainers' table:", dbRecord);

      toast({
        title: "Trainer Account Initiated",
        description: `${trainerName} has been set up. They will receive an email to confirm their account. Their password is their phone number: ${trainerPassword}.`,
        duration: 10000, // Longer duration for important info
      });
      return { success: true, data: dbRecord };

    } catch (error: any) { // General catch for unexpected errors during the process
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
