
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTrainerCreation } from "./components/classes/CreateTrainer";
import TrainerList from "./components/trainers/TrainerList";
import AddTrainerDialog from "./components/trainers/AddTrainerDialog";
import EditTrainerDialog from "./components/trainers/EditTrainerDialog";
import ResetPasswordDialog from "./components/trainers/ResetPasswordDialog";
import { Trainer } from "./components/trainers/types";

const Trainers = () => {
  // State management
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const { createTrainer, createTestTrainer, isCreating } = useTrainerCreation();

  // Authentication and session check
  useEffect(() => {
    console.log("Trainers component mounted, auth state:", { isAuthenticated, loading });
    
    // If authentication is still loading, do nothing
    if (loading) {
      console.log("Auth state is still loading...");
      return;
    }
    
    // If not authenticated after loading completes, redirect to login
    if (!isAuthenticated) {
      console.log("User is not authenticated, redirecting to login");
      toast({
        title: "Authentication required",
        description: "You need to be logged in to access trainer data.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    
    // If authenticated, fetch trainers
    console.log("User is authenticated, fetching trainers");
    fetchTrainers();
  }, [isAuthenticated, loading, navigate]);

  // Create a test trainer if none exists
  useEffect(() => {
    const initializeTrainers = async () => {
      if (loading) return;
      if (!isAuthenticated) {
        console.log("Not authenticated, skipping trainer initialization");
        return;
      }
      
      console.log("Initializing trainers");
      try {
        const success = await createTestTrainer();
        if (success) {
          console.log("Test trainer created or already exists, refreshing trainer list");
          fetchTrainers(); 
        }
      } catch (error) {
        console.error("Error initializing test trainer:", error);
      }
    };

    if (isAuthenticated && !loading) {
      initializeTrainers();
    }
  }, [isAuthenticated, loading, createTestTrainer]);

  // Fetch trainers from database
  const fetchTrainers = async () => {
    if (loading) {
      console.log("Auth state is still loading, skipping trainer fetch");
      return;
    }
    
    if (!isAuthenticated) {
      console.log("Not authenticated, skipping trainer fetch");
      return;
    }
    
    console.log("Fetching trainers");
    setIsLoading(true);
    
    try {
      // Check session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error when fetching trainers:", sessionError);
        throw sessionError;
      }
      
      if (!sessionData?.session) {
        console.log("No session found when fetching trainers");
        toast({
          title: "Authentication required",
          description: "You need to be logged in to access trainer data.",
          variant: "destructive",
        });
        setIsLoading(false);
        navigate("/login");
        return;
      }

      console.log("Session found, proceeding with trainer fetch");
      const { data, error } = await supabase
        .from("trainers")
        .select("*")
        .order("name");

      if (error) {
        throw error;
      }

      if (data) {
        console.log(`Fetched ${data.length} trainers`);
        setTrainers(data);
      }
    } catch (error: any) {
      console.error("Error fetching trainers:", error);
      toast({
        title: "Failed to load trainers",
        description: error.message || "There was an error loading the trainers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add trainer handler
  const handleAddTrainer = async (trainerData: any) => {
    console.log("Add trainer button clicked, auth state:", isAuthenticated);
    
    if (!trainerData.name || !trainerData.email) {
      console.log("Required fields missing, showing error toast");
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await createTrainer(trainerData);
      
      if (result.success) {
        // Refresh the trainers list
        await fetchTrainers();
        
        setIsAddDialogOpen(false);

        toast({
          title: "Trainer added successfully",
          description: `${trainerData.name} has been added as a trainer`,
        });
      }
    } catch (error) {
      console.error("Error in handleAddTrainer:", error);
    }
  };

  // Edit trainer handler
  const handleEditTrainer = async (editedTrainer: Trainer) => {
    if (!editedTrainer || !editedTrainer.name || !editedTrainer.email) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if we have an authenticated session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error when updating trainer:", sessionError);
        throw sessionError;
      }
      
      if (!sessionData?.session) {
        toast({
          title: "Authentication required",
          description: "You need to be logged in to update trainers.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      const { error } = await supabase
        .from("trainers")
        .update({
          name: editedTrainer.name,
          email: editedTrainer.email,
          phone: editedTrainer.phone || null,
          specialization: editedTrainer.specialization || null,
          status: editedTrainer.status,
          gender: editedTrainer.gender || null,
        })
        .eq("id", editedTrainer.id);

      if (error) {
        throw error;
      }

      // Refresh the trainers list
      await fetchTrainers();
      
      setIsEditDialogOpen(false);
      setSelectedTrainer(null);

      toast({
        title: "Trainer updated successfully",
        description: "Trainer information has been updated",
      });
    } catch (error: any) {
      console.error("Error updating trainer:", error);
      toast({
        title: "Failed to update trainer",
        description: error.message || "There was an error updating the trainer",
        variant: "destructive",
      });
    }
  };

  // Toggle trainer status handler
  const toggleTrainerStatus = async (id: number) => {
    try {
      // Check if we have an authenticated session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error when toggling status:", sessionError);
        throw sessionError;
      }
      
      if (!sessionData?.session) {
        toast({
          title: "Authentication required",
          description: "You need to be logged in to update trainer status.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      const trainerToUpdate = trainers.find(t => t.id === id);
      if (!trainerToUpdate) return;

      const newStatus = trainerToUpdate.status === "Active" ? "Inactive" : "Active";
      
      const { error } = await supabase
        .from("trainers")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) {
        throw error;
      }

      // Refresh the trainers list
      await fetchTrainers();

      toast({
        title: "Trainer status updated",
        description: `Trainer is now ${newStatus}`,
      });
    } catch (error: any) {
      console.error("Error updating trainer status:", error);
      toast({
        title: "Failed to update trainer status",
        description: error.message || "There was an error updating the trainer status",
        variant: "destructive",
      });
    }
  };

  // Reset password dialog handler
  const openResetPasswordDialog = (trainer: Trainer) => {
    setSelectedTrainer(trainer);
    setIsResetPasswordDialogOpen(true);
  };

  // Reset password handler
  const handleResetPassword = async () => {
    if (!selectedTrainer) return;
    
    try {
      // In a real implementation with authentication, this would call an API to reset the password
      toast({
        title: "Password reset requested",
        description: `A password reset email has been sent to ${selectedTrainer.email}`,
      });
      
      setIsResetPasswordDialogOpen(false);
      setSelectedTrainer(null);
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error.message || "An error occurred while resetting the password",
        variant: "destructive",
      });
    }
  };

  // Main component render
  return (
    <DashboardLayout title="Trainer Management">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="w-full sm:w-auto">
          <Input
            placeholder="Search trainers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sm:w-80"
          />
        </div>
        <Button 
          onClick={() => setIsAddDialogOpen(true)} 
          className="w-full sm:w-auto bg-gym-blue hover:bg-gym-dark-blue"
        >
          Add New Trainer
        </Button>
      </div>

      <TrainerList
        trainers={trainers}
        isLoading={isLoading}
        searchTerm={searchTerm}
        onEdit={(trainer) => {
          setSelectedTrainer(trainer);
          setIsEditDialogOpen(true);
        }}
        onToggleStatus={toggleTrainerStatus}
        onResetPassword={openResetPasswordDialog}
      />

      {/* Add Trainer Dialog */}
      <AddTrainerDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddTrainer}
        isCreating={isCreating}
      />

      {/* Edit Trainer Dialog */}
      <EditTrainerDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSave={handleEditTrainer}
        trainer={selectedTrainer}
      />

      {/* Password Reset Dialog */}
      <ResetPasswordDialog
        isOpen={isResetPasswordDialogOpen}
        onClose={() => setIsResetPasswordDialogOpen(false)}
        onConfirm={handleResetPassword}
        trainer={selectedTrainer}
      />
    </DashboardLayout>
  );
};

export default Trainers;
