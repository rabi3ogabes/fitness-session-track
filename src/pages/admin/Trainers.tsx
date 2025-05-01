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
import { Edit, X, RotateCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Mock data
const initialTrainers = [
  { id: 1, name: "Jane Doe", email: "jane@example.com", phone: "(555) 123-4567", specialization: "Yoga, Pilates", status: "Active", gender: "Female" },
  { id: 2, name: "John Smith", email: "john@example.com", phone: "(555) 234-5678", specialization: "HIIT, Strength Training", status: "Active", gender: "Male" },
  { id: 3, name: "Alex Johnson", email: "alex@example.com", phone: "(555) 345-6789", specialization: "Strength Training, Boxing", status: "Active", gender: "Male" },
  { id: 4, name: "Sarah Williams", email: "sarah@example.com", phone: "(555) 456-7890", specialization: "Pilates, Yoga", status: "Inactive", gender: "Female" },
  { id: 5, name: "Mike Tyson", email: "mike@example.com", phone: "(555) 567-8901", specialization: "Boxing, Martial Arts", status: "Active", gender: "Male" },
  { id: 6, name: "Maria Garcia", email: "maria@example.com", phone: "(555) 678-9012", specialization: "Zumba, Dance Fitness", status: "Active", gender: "Female" },
  { id: 7, name: "Lisa Garcia", email: "lisa@example.com", phone: "(555) 789-0123", specialization: "Yoga, Meditation", status: "Active", gender: "Female" },
];

const Trainers = () => {
  const [trainers, setTrainers] = useState<typeof initialTrainers>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<typeof initialTrainers[0] | null>(null);
  const [newTrainer, setNewTrainer] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "",
    status: "Active",
    gender: "Female",
  });
  const [editTrainer, setEditTrainer] = useState<typeof trainers[0] | null>(null);
  const { toast } = useToast();

  // Load trainers from localStorage on component mount
  useEffect(() => {
    const storedTrainers = localStorage.getItem("trainers");
    if (storedTrainers) {
      setTrainers(JSON.parse(storedTrainers));
    } else {
      setTrainers(initialTrainers);
      // Initialize localStorage with mock data if empty
      localStorage.setItem("trainers", JSON.stringify(initialTrainers));
    }
  }, []);

  // Update localStorage whenever trainers change
  useEffect(() => {
    if (trainers.length > 0) {
      localStorage.setItem("trainers", JSON.stringify(trainers));
    }
  }, [trainers]);

  const filteredTrainers = trainers.filter(
    (trainer) =>
      trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddTrainer = () => {
    if (!newTrainer.name || !newTrainer.email) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const id = trainers.length > 0 ? Math.max(...trainers.map((t) => t.id)) + 1 : 1;
    const updatedTrainers = [...trainers, { ...newTrainer, id }];
    
    setTrainers(updatedTrainers);
    localStorage.setItem("trainers", JSON.stringify(updatedTrainers));
    
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
  };

  const handleEditTrainer = () => {
    if (!editTrainer || !editTrainer.name || !editTrainer.email) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const updatedTrainers = trainers.map((t) => (t.id === editTrainer.id ? editTrainer : t));
    
    setTrainers(updatedTrainers);
    localStorage.setItem("trainers", JSON.stringify(updatedTrainers));
    
    setIsEditDialogOpen(false);
    setEditTrainer(null);

    toast({
      title: "Trainer updated successfully",
      description: `Trainer information has been updated`,
    });
  };

  const toggleTrainerStatus = (id: number) => {
    const updatedTrainers = trainers.map((trainer) =>
      trainer.id === id
        ? {
            ...trainer,
            status: trainer.status === "Active" ? "Inactive" : "Active",
          }
        : trainer
    );
    
    setTrainers(updatedTrainers);
    localStorage.setItem("trainers", JSON.stringify(updatedTrainers));

    toast({
      title: "Trainer status updated",
      description: "The trainer's status has been updated successfully",
    });
  };

  const openResetPasswordDialog = (trainer: typeof trainers[0]) => {
    setSelectedTrainer(trainer);
    setIsResetPasswordDialogOpen(true);
  };

  const handleResetPassword = async () => {
    if (!selectedTrainer) return;
    
    try {
      // In a real implementation, this would call Supabase to reset the password
      // For now, we'll just show a toast notification
      
      toast({
        title: "Password reset successfully",
        description: `${selectedTrainer.name}'s password has been reset to their phone number`,
      });
      
      setIsResetPasswordDialogOpen(false);
      setSelectedTrainer(null);
    } catch (error) {
      toast({
        title: "Password reset failed",
        description: "An error occurred while resetting the password",
        variant: "destructive",
      });
    }
  };

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
              {filteredTrainers.map((trainer) => (
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
                    <div className="text-gray-500">{trainer.specialization}</div>
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
              ))}

              {filteredTrainers.length === 0 && (
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
            <Button onClick={handleAddTrainer} className="bg-gym-blue hover:bg-gym-dark-blue">
              Add Trainer
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
                  value={editTrainer.phone}
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
                  value={editTrainer.specialization}
                  onChange={(e) => setEditTrainer({ ...editTrainer, specialization: e.target.value })}
                  className="col-span-3"
                />
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
                  The new password will be their phone number: <strong>{selectedTrainer.phone}</strong>
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
