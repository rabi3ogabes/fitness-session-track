
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Edit, X, RotateCw, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTrainerCreation } from "./components/classes/CreateTrainer";

interface Trainer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  status: string;
  gender?: string;
}

const Trainers = () => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [newTrainer, setNewTrainer] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "",
    status: "Active",
    gender: "Female",
  });
  const [editTrainer, setEditTrainer] = useState<Trainer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const { createTrainer, createTestTrainer, isCreating } = useTrainerCreation();

  // Check authentication when component mounts
  useEffect(() => {
    console.log("Trainer component mounted, auth state:", isAuthenticated);
    if (!loading && !isAuthenticated) {
      console.log("Not authenticated, redirecting to login from Trainers component");
      toast({
        title: "Authentication required",
        description: "You need to be logged in to access trainer data.",
        variant: "destructive",
      });
      navigate("/login");
    } else if (!loading && isAuthenticated) {
      console.log("User is authenticated, fetching trainers");
      fetchTrainers();
    }
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
          fetchTrainers(); // Refresh trainers list if a test trainer was created
        }
      } catch (error) {
        console.error("Error initializing test trainer:", error);
      }
    };

    if (isAuthenticated && !loading) {
      initializeTrainers();
    }
  }, [isAuthenticated, loading, createTestTrainer]);

  const fetchTrainers = async () => {
    if (loading) return;
    if (!isAuthenticated) {
      console.log("Not authenticated, skipping trainer fetch");
      return;
    }
    
    console.log("Fetching trainers");
    setIsLoading(true);
    try {
      // Check if we have an authenticated session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
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

  const filteredTrainers = trainers.filter(
    (trainer) =>
      trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trainer.specialization && trainer.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddTrainer = async () => {
    console.log("Add trainer button clicked, auth state:", isAuthenticated);
    
    if (!newTrainer.name || !newTrainer.email) {
      console.log("Required fields missing, showing error toast");
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await createTrainer(newTrainer);
      
      if (result.success) {
        // Refresh the trainers list
        await fetchTrainers();
        
        setIsAddDialogOpen(false);
        setNewTrainer({
          name: "",
          email: "",
          phone: "",
          specialization: "",
          status: "Active",
          gender: "Female",
        });

        toast({
          title: "Trainer added successfully",
          description: `${newTrainer.name} has been added as a trainer`,
        });
      }
    } catch (error) {
      console.error("Error in handleAddTrainer:", error);
    }
  };

  const handleEditTrainer = async () => {
    if (!editTrainer || !editTrainer.name || !editTrainer.email) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if we have an authenticated session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
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
          name: editTrainer.name,
          email: editTrainer.email,
          phone: editTrainer.phone || null,
          specialization: editTrainer.specialization || null,
          status: editTrainer.status,
          gender: editTrainer.gender || null,
        })
        .eq("id", editTrainer.id);

      if (error) {
        throw error;
      }

      // Refresh the trainers list
      await fetchTrainers();
      
      setIsEditDialogOpen(false);
      setEditTrainer(null);

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

  const toggleTrainerStatus = async (id: number) => {
    try {
      // Check if we have an authenticated session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
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
        description: "The trainer's status has been updated successfully",
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

  const openResetPasswordDialog = (trainer: Trainer) => {
    setSelectedTrainer(trainer);
    setIsResetPasswordDialogOpen(true);
  };

  const handleResetPassword = async () => {
    if (!selectedTrainer) return;
    
    try {
      // In a real implementation with authentication, this would call an API to reset the password
      // For now, we'll just show a toast notification
      
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

  // If still loading auth state, show a spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gym-blue mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render anything
  if (!isAuthenticated) {
    return null;
  }

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
        <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto bg-gym-blue hover:bg-gym-dark-blue">
          Add New Trainer
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin text-gym-blue" />
                      <span className="ml-2">Loading trainers...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredTrainers.length > 0 ? (
                filteredTrainers.map((trainer) => (
                  <TableRow key={trainer.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="font-medium text-gray-900">{trainer.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-gray-500">{trainer.email}</div>
                      <div className="text-gray-500">{trainer.phone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-gray-500">{trainer.gender || "Not specified"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-gray-500">{trainer.specialization || "Not specified"}</div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          trainer.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {trainer.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              onClick={() => {
                                setEditTrainer(trainer);
                                setIsEditDialogOpen(true);
                              }} 
                              variant="ghost" 
                              size="icon"
                              className="text-gym-blue hover:text-gym-dark-blue hover:bg-gray-100"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              onClick={() => toggleTrainerStatus(trainer.id)} 
                              variant="ghost" 
                              size="icon" 
                              className={trainer.status === "Active" 
                                ? "text-red-600 hover:text-red-800 hover:bg-red-50" 
                                : "text-green-600 hover:text-green-800 hover:bg-green-50"}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{trainer.status === "Active" ? "Deactivate" : "Activate"}</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              onClick={() => openResetPasswordDialog(trainer)} 
                              variant="ghost" 
                              size="icon" 
                              className="text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                            >
                              <RotateCw className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Reset Password</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    No trainers found matching your search criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Trainer Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Trainer</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium col-span-1">
                Name*
              </label>
              <Input
                id="name"
                value={newTrainer.name}
                onChange={(e) => setNewTrainer({ ...newTrainer, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium col-span-1">
                Email*
              </label>
              <Input
                id="email"
                type="email"
                value={newTrainer.email}
                onChange={(e) => setNewTrainer({ ...newTrainer, email: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium col-span-1">
                Phone
              </label>
              <Input
                id="phone"
                value={newTrainer.phone}
                onChange={(e) => setNewTrainer({ ...newTrainer, phone: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium col-span-1">
                Gender
              </label>
              <Select
                value={newTrainer.gender}
                onValueChange={(value) => setNewTrainer({ ...newTrainer, gender: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium col-span-1">
                Specialization
              </label>
              <Input
                id="specialization"
                placeholder="e.g. Yoga, Pilates, HIIT"
                value={newTrainer.specialization}
                onChange={(e) => setNewTrainer({ ...newTrainer, specialization: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddTrainer} 
              className="bg-gym-blue hover:bg-gym-dark-blue"
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Add Trainer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Trainer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Trainer</DialogTitle>
          </DialogHeader>
          {editTrainer && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium col-span-1">
                  Name*
                </label>
                <Input
                  id="edit-name"
                  value={editTrainer.name}
                  onChange={(e) => setEditTrainer({ ...editTrainer, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium col-span-1">
                  Email*
                </label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editTrainer.email}
                  onChange={(e) => setEditTrainer({ ...editTrainer, email: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium col-span-1">
                  Phone
                </label>
                <Input
                  id="edit-phone"
                  value={editTrainer.phone || ""}
                  onChange={(e) => setEditTrainer({ ...editTrainer, phone: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium col-span-1">
                  Gender
                </label>
                <Select
                  value={editTrainer.gender || ""}
                  onValueChange={(value) => setEditTrainer({ ...editTrainer, gender: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium col-span-1">
                  Specialization
                </label>
                <Input
                  id="edit-specialization"
                  value={editTrainer.specialization || ""}
                  onChange={(e) => setEditTrainer({ ...editTrainer, specialization: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium col-span-1">
                  Status
                </label>
                <Select
                  value={editTrainer.status}
                  onValueChange={(value) => setEditTrainer({ ...editTrainer, status: value as "Active" | "Inactive" })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTrainer} className="bg-gym-blue hover:bg-gym-dark-blue">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Confirmation Dialog */}
      <AlertDialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedTrainer && (
                <>
                  Are you sure you want to reset the password for <strong>{selectedTrainer.name}</strong>?
                  A password reset email will be sent to <strong>{selectedTrainer.email}</strong>.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsResetPasswordDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPassword} className="bg-gym-blue hover:bg-gym-dark-blue">
              Reset Password
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Trainers;
