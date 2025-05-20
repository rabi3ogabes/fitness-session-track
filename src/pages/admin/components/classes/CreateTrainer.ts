import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { TrainerFormData } from "../trainers/types";

interface TrainerCreationData
  extends Omit<TrainerFormData, "id" | "created_at"> {
  // No 'id' or 'created_at' when creating
}

export const useTrainerCreation = () => {
  const { toast } = useToast();
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  // Function to check authentication before any operations
  const checkAuthenticationStatus = async () => {
    console.log(
      "Checking authentication status, isAuthenticated:",
      isAuthenticated
    );

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
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Session check error:", error);
      toast({
        title: "Authentication error",
        description:
          "There was a problem verifying your authentication status.",
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

  // Create a new trainer with improved error handling - FIXED FOR CLIENT-SIDE USE
  const createTrainer = async (trainerData: TrainerCreationData) => {
    setIsCreating(true);
    console.log("Creating trainer with data:", trainerData);

    if (!trainerData.phone || trainerData.phone.trim() === "") {
      toast({
        title: "Phone number required for password",
        description:
          "The trainer's phone number is required to set their initial password.",
        variant: "destructive",
      });
      setIsCreating(false);
      return {
        success: false,
        error: new Error("Phone number required for password"),
      };
    }

    try {
      // Check if admin is authenticated
      const isAuth = await checkAuthenticationStatus();
      if (!isAuth) {
        console.error("Authentication check failed for trainer creation");
        setIsCreating(false);
        return { success: false, error: new Error("Authentication failed") };
      }

      const trainerEmail = trainerData.email.trim();
      const trainerPassword = trainerData.phone.trim(); // Password is the phone number
      const trainerName = trainerData.name.trim();

      // SOLUTION: Use a two-step approach:
      // 1. First create the trainer record in the database
      // 2. Then use signUp to create the auth user

      // Step 1: Create the trainer record first
      console.log("Creating trainer record in database:", trainerData);

      const { data: trainerRecord, error: dbError } = await supabase
        .from("trainers")
        .insert([
          {
            name: trainerName,
            email: trainerEmail,
            phone: trainerData.phone.trim(),
            specialization: trainerData.specialization?.trim() || null,
            status: "Active", // Special status until auth is confirmed
            gender: trainerData.gender || null,
          },
        ])
        .select()
        .single();

      if (dbError) {
        console.error("Error creating trainer record:", dbError);
        toast({
          title: "Failed to create trainer",
          description:
            dbError.message || "Could not save trainer details in database.",
          variant: "destructive",
        });
        return { success: false, error: dbError };
      }

      // Step 2: Now create the auth user with signUp
      console.log(
        `Creating auth user for ${trainerEmail} with password=${trainerPassword}`
      );

      // Use standard signUp which is allowed on client side
      const { data: authData, error: signUpError } = await supabase.auth.signUp(
        {
          email: trainerEmail,
          password: trainerPassword,
          options: {
            data: {
              role: "trainer",
              name: trainerName,
              trainer_id: trainerRecord.id,
            },
          },
        }
      );

      if (signUpError) {
        console.error("Error creating trainer auth user:", signUpError);

        // Clean up the trainer record since auth failed
        await supabase.from("trainers").delete().eq("id", trainerRecord.id);

        toast({
          title: "Failed to create trainer login",
          description:
            signUpError.message || "Could not create authentication account.",
          variant: "destructive",
        });
        return { success: false, error: signUpError };
      }

      if (!authData.user) {
        console.error("No user data returned from signUp despite no error.");

        // Clean up the trainer record
        await supabase.from("trainers").delete().eq("id", trainerRecord.id);

        toast({
          title: "Trainer login creation issue",
          description:
            "Authentication account creation did not return user data as expected.",
          variant: "destructive",
        });
        return {
          success: false,
          error: new Error("Auth user creation failed unexpectedly."),
        };
      }

      // Step 3: Update the trainer record with the auth_id
      const { error: updateError } = await supabase
        .from("trainers")
        .update({
          auth_id: authData.user.id,
          status: authData.session ? "Active" : "PendingEmailConfirmation",
        })
        .eq("id", trainerRecord.id);

      if (updateError) {
        console.error("Failed to update trainer with auth ID:", updateError);
        // We won't delete anything here as both entities were created successfully
      }

      console.log("Trainer created successfully:", {
        trainer: trainerRecord,
        auth: authData.user.id,
        session: !!authData.session,
      });

      // Determine if email confirmation is needed
      const confirmationNeeded = !authData.session;

      toast({
        title: "Trainer account created",
        description: confirmationNeeded
          ? `${trainerName} was created. They need to confirm their email before logging in. Their password is their phone number: ${trainerPassword}.`
          : `${trainerName} can now log in with their email and phone number as password.`,
        duration: 6000,
      });

      return {
        success: true,
        data: trainerRecord,
        confirmationNeeded,
      };
    } catch (error: any) {
      console.error("Unexpected error in createTrainer function:", error);
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

  // Create test trainers (unchanged from your original implementation)
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
          gender: "Male",
        },
        {
          name: "Sarah Yoga",
          email: "sarah@example.com",
          phone: "987-654-3210",
          specialization: "Yoga",
          status: "Active",
          gender: "Female",
        },
        {
          name: "Mike Running",
          email: "mike@example.com",
          phone: "555-123-4567",
          specialization: "Cardio",
          status: "Active",
          gender: "Male",
        },
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
          if (error.message?.includes("duplicate key")) {
            console.log(
              "Some trainers may already exist, attempting to fetch existing trainers"
            );

            // Try to fetch trainers to see if we already have some
            const { data: existingTrainers, error: fetchError } = await supabase
              .from("trainers")
              .select("*")
              .limit(10);

            if (
              !fetchError &&
              existingTrainers &&
              existingTrainers.length > 0
            ) {
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
        description:
          error.message || "There was an error creating test trainers",
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
    isCreating,
  };
};
