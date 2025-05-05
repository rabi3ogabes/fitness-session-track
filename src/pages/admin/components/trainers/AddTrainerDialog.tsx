
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { TrainerFormData } from "../trainers/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface AddTrainerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (trainer: TrainerFormData) => Promise<void>;
  isCreating: boolean;
}

const AddTrainerDialog = ({ isOpen, onClose, onAdd, isCreating }: AddTrainerDialogProps) => {
  const { isAuthenticated, isAdmin } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState<TrainerFormData>({
    name: "",
    email: "",
    phone: "",
    specialization: "",
    status: "Active",
    gender: "Female",
  });

  const handleChange = (field: keyof TrainerFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      // Check if we're in demo mode first (using the pattern established in other components)
      const mockRole = localStorage.getItem('userRole');
      const isDemoMode = !!mockRole;
      
      // Verify authentication - different paths for demo vs. real auth
      if (!isDemoMode) {
        // For real authentication, verify with Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.error("Session error or no session found:", sessionError);
          toast({
            title: "Authentication required",
            description: "You need to be logged in to add trainers.",
            variant: "destructive",
          });
          return;
        }
      } else {
        // For demo mode, check the auth context
        if (!isAuthenticated || !isAdmin) {
          console.error("Not authenticated or not admin in demo mode");
          toast({
            title: "Authentication required",
            description: "You need to be logged in as an admin to add trainers.",
            variant: "destructive",
          });
          return;
        }
        console.log("Demo mode authentication confirmed for trainer creation");
      }
      
      // Validate required fields
      if (!formData.name || !formData.email) {
        toast({
          title: "Required fields missing",
          description: "Name and email are required fields.",
          variant: "destructive",
        });
        return;
      }

      // Make a clean copy of the data to ensure proper format
      const submissionData: TrainerFormData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || "",
        specialization: formData.specialization?.trim() || "",
        status: formData.status || "Active",
        gender: formData.gender || "Female",
      };
      
      // Send data to parent component for processing
      await onAdd(submissionData);
      
      // Reset form after successful submission
      setFormData({
        name: "",
        email: "",
        phone: "",
        specialization: "",
        status: "Active",
        gender: "Female",
      });
    } catch (error) {
      console.error("Error in form submission:", error);
      toast({
        title: "Failed to add trainer",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
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
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium col-span-1">
              Phone
            </label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium col-span-1">
              Gender
            </label>
            <Select
              value={formData.gender}
              onValueChange={(value) => handleChange("gender", value)}
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
              Status
            </label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange("status", value)}
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
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium col-span-1">
              Specialization
            </label>
            <Input
              id="specialization"
              placeholder="e.g. Yoga, Pilates, HIIT"
              value={formData.specialization}
              onChange={(e) => handleChange("specialization", e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="bg-gym-blue hover:bg-gym-dark-blue"
            disabled={isCreating || !formData.name || !formData.email}
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
  );
};

export default AddTrainerDialog;
