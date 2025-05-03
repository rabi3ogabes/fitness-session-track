
import { supabase } from "@/integrations/supabase/client";

export const createTestTrainer = async () => {
  try {
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
      return true;
    }
    
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
    
    return true;
  } catch (error) {
    console.error("Unexpected error creating test trainer:", error);
    return false;
  }
};
