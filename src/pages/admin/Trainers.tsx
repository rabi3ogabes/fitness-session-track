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
import { Trainer, TrainerFormData } from "./components/trainers/types";

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
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { createTrainer, createTestTrainer, isCreating } = useTrainerCreation();

  // Fetch trainers from Supabase
  const fetchTrainers = async () => {
    setIsLoading(true);
    
    try {
      console.log("Fetching trainers from Supabase...");
      const { data, error } = await supabase
        .from("trainers")
        .select("*")
        .order("name");

      if (error) {
        console.error("Supabase error fetching trainers:", error);
        throw error;
      }

      if (data) {
        console.log(`Fetched ${data.length} trainers from Supabase:`, data);
        setTrainers(data);
      } else {
        console.log("No trainers found in database");
        setTrainers([]);
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

  // Check authentication and load trainers
  useEffect(() => {
    console.log("Trainers component mounted, auth state:", { isAuthenticated, loading, isAdmin });
    
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
  }, [isAuthenticated, loading, navigate, toast]);

  // Add trainer handler
  const handleAddTrainer = async (trainerData: TrainerFormData) => {
    if (!trainerData.name || !trainerData.email) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Adding new trainer with data:", trainerData);
      
      // Use the createTrainer function from our hook instead of direct Supabase calls
      const result = await createTrainer(trainerData);
      console.log("Create trainer result:", result);
      
      if (result.success) {
        console.log("Trainer creation reported success");
        setIsAddDialogOpen(false);
        
        toast({
          title: "Trainer added successfully",
          description: `${trainerData.name} has been added as a trainer`,
        });
        
        // Refresh trainers list to ensure we have the latest data
        fetchTrainers();
      } else {
        // Handle the case where success is false
        console.error("Failed to create trainer:", result.error);
        toast({
          title: "Something went wrong",
          description: result.error?.message || "Trainer may not have been created properly",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error in handleAddTrainer:", error);
      toast({
        title: "Failed to add trainer",
        description: error.message || "There was an error adding the trainer",
        variant: "destructive",
      });
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
      const { error } = await supabase
        .from("trainers")
        .update({
          name: editedTrainer.name,
          email: editedTrainer.email,
          phone: editedTrainer.phone,
          specialization: editedTrainer.specialization,
          status: editedTrainer.status,
          gender: editedTrainer.gender
        })
        .eq("id", editedTrainer.id);
      
      if (error) {
        throw error;
      }

      // Update local state
      const updatedTrainers = trainers.map(trainer => 
        trainer.id === editedTrainer.id ? editedTrainer : trainer
      );
      
      setTrainers(updatedTrainers);
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
      // Get current trainer status
      const trainer = trainers.find(t => t.id === id);
      if (!trainer) return;
      
      const newStatus = trainer.status === "Active" ? "Inactive" : "Active";
      
      const { error } = await supabase
        .from("trainers")
        .update({ status: newStatus })
        .eq("id", id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      const updatedTrainers = trainers.map(trainer => {
        if (trainer.id === id) {
          return { ...trainer, status: newStatus };
        }
        return trainer;
      });
      
      setTrainers(updatedTrainers);
      
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
      // Get list of users and find by email
      const { data: userList, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        throw listError;
      }
      
      // If listError is null, userList is { users: User[]; ... }, so userList.users is User[]
      // Removed unnecessary optional chaining from userList?.users?
      const userAccount = userList.users.find(user => user.email === selectedTrainer.email);
      
      if (!userAccount) {
        throw new Error(`Could not find user account for ${selectedTrainer.name}`);
      }
      
      // Generate a temporary password using their phone number (or a default if no phone number)
      const tempPassword = selectedTrainer.phone ? selectedTrainer.phone.replace(/[^0-9]/g, '') : 'Trainer123!';
      
      // Reset the user's password
      const { error: resetError } = await supabase.auth.admin.updateUserById(
        userAccount.id, 
        { password: tempPassword }
      );
      
      if (resetError) {
        throw resetError;
      }
      
      toast({
        title: "Password reset successfully",
        description: `A temporary password has been set for ${selectedTrainer.name}: ${tempPassword}. They should change it upon next login.`,
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
