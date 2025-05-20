import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase, requireAuth } from "@/integrations/supabase/client";

interface AddMemberDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddMember: (member: any) => void;
}

const AddMemberDialog = ({
  isOpen,
  onOpenChange,
  onAddMember,
}: AddMemberDialogProps) => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    phone: "",
    birthday: "",
    membership: "Basic",
    sessions: 4,
    remainingSessions: 4,
    status: "Active",
    canBeEditedByTrainers: true,
    gender: "Male", // Default gender
  });
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value;
    setNewMember({ ...newMember, phone });

    // Clear error when user types
    if (phoneError) setPhoneError(null);
    if (formErrors.phone) {
      const { phone, ...rest } = formErrors;
      setFormErrors(rest);
    }
  };

  const validatePhone = (phone: string) => {
    // Updated validation - exactly 8 digits
    const phoneRegex = /^\d{8}$/;
    if (!phone) return "Phone number is required";
    if (!phoneRegex.test(phone.replace(/[\s-]/g, ""))) {
      return "Please enter a valid phone number (exactly 8 digits)";
    }
    return null;
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!newMember.name.trim()) {
      errors.name = "Name is required";
    }

    if (!newMember.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newMember.email)) {
      errors.email = "Please enter a valid email address";
    }

    const phoneError = validatePhone(newMember.phone);
    if (phoneError) {
      errors.phone = phoneError;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleMembershipChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const membership = e.target.value;
    let sessions = 4;
    if (membership === "Standard") sessions = 8;
    if (membership === "Premium") sessions = 12;
    setNewMember({
      ...newMember,
      membership,
      sessions,
      remainingSessions: sessions,
    });
  };

  const handleFieldChange = (field: string, value: string) => {
    setNewMember({ ...newMember, [field]: value });

    // Clear error when field changes
    if (formErrors[field]) {
      const { [field]: _, ...rest } = formErrors;
      setFormErrors(rest);
    }
  };

  const handleSubmit = async () => {
    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      console.log("Submitting member data:", newMember);

      // First check if a member with this email already exists
      const { data: existingMember, error: checkError } = await supabase
        .from("members")
        .select("email")
        .eq("email", newMember.email)
        .single();

      if (existingMember) {
        toast({
          title: "Email already in use",
          description: "A member with this email already exists. Please use a different email.",
          variant: "destructive",
        });
        setFormErrors({
          ...formErrors,
          email: "A member with this email already exists"
        });
        setIsLoading(false);
        return;
      }

      // Use the enhanced requireAuth function to ensure authentication with bypass for demo users
      const result = await requireAuth(async () => {
        console.log(
          "Inside requireAuth callback - attempting database insertion"
        );

        // Insert the new member into Supabase
        const { data, error } = await supabase
          .from("members")
          .insert([
            {
              name: newMember.name,
              email: newMember.email,
              phone: newMember.phone,
              birthday: newMember.birthday,
              membership: newMember.membership,
              sessions: newMember.sessions,
              remaining_sessions: newMember.remainingSessions,
              status: newMember.status,
              can_be_edited_by_trainers: newMember.canBeEditedByTrainers,
              gender: newMember.gender,
              // Removed password field as it doesn't exist in the database schema
            },
          ])
          .select();

        if (error) {
          console.error("Error adding member:", error);
          if (error.code === "23505" && error.message.includes("members_email_key")) {
            throw new Error("A member with this email already exists.");
          }
          throw error;
        }

        console.log("Member added successfully:", data);
        return data;
      });

      if (result && result[0]) {
        // After adding to members table, try to register the user in auth
        try {
          // Register the user with Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: newMember.email,
            password: newMember.phone, // Use phone as password for auth
          });

          if (authError) {
            console.warn("Note: User auth registration had an issue:", authError);
            // We don't want to stop the flow if auth fails, just log a warning
          } else {
            console.log("User registered in auth system:", authData);
          }
        } catch (authRegError) {
          console.warn("Auth registration error (continuing anyway):", authRegError);
        }

        // Map the Supabase response back to our application's format
        const addedMember = {
          id: result[0].id,
          name: result[0].name,
          email: result[0].email,
          phone: result[0].phone || "",
          // No password field in DB, but we'll set it to phone for the UI
          password: result[0].phone || "", 
          membership: result[0].membership || "Basic",
          sessions: result[0].sessions || 0,
          remainingSessions: result[0].remaining_sessions || 0,
          status: result[0].status || "Active",
          birthday: result[0].birthday || "",
          canBeEditedByTrainers: result[0].can_be_edited_by_trainers || false,
          gender: result[0].gender || "Male",
        };

        // Submit to parent component to update UI
        onAddMember(addedMember);

        toast({
          title: "Member added successfully",
          description: `${newMember.name} has been added as a member. They can sign in using their email and phone number as password.`,
        });

        // Reset form
        setNewMember({
          name: "",
          email: "",
          phone: "",
          birthday: "",
          membership: "Basic",
          sessions: 4,
          remainingSessions: 4,
          status: "Active",
          canBeEditedByTrainers: true,
          gender: "Male",
        });
        setFormErrors({});

        // Close dialog
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("Error adding member:", error);
      toast({
        title: "Failed to add member",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register New Member</DialogTitle>
          <DialogDescription>
            Fill in the required information to add a new member.
            The member's phone number will be used as their password.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium col-span-1">
              Name*
            </label>
            <div className="col-span-3 space-y-1">
              <Input
                id="name"
                value={newMember.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                className={`${formErrors.name ? "border-red-500" : ""}`}
              />
              {formErrors.name && (
                <p className="text-sm text-red-500">{formErrors.name}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium col-span-1">
              Email*
            </label>
            <div className="col-span-3 space-y-1">
              <Input
                id="email"
                type="email"
                value={newMember.email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                className={`${formErrors.email ? "border-red-500" : ""}`}
              />
              {formErrors.email && (
                <p className="text-sm text-red-500">{formErrors.email}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium col-span-1">
              Phone*
            </label>
            <div className="col-span-3 space-y-1">
              <Input
                id="phone"
                value={newMember.phone}
                onChange={handlePhoneChange}
                className={`${formErrors.phone ? "border-red-500" : ""}`}
                placeholder="8-digit phone number (will be used as password)"
              />
              {formErrors.phone && (
                <p className="text-sm text-red-500">{formErrors.phone}</p>
              )}
              <p className="text-xs text-gray-500">
                This phone number will also be used as the member's password
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium col-span-1">
              Gender*
            </label>
            <div className="col-span-3 flex items-center space-x-4">
              <RadioGroup
                defaultValue={newMember.gender}
                value={newMember.gender}
                onValueChange={(value) =>
                  setNewMember({ ...newMember, gender: value })
                }
                className="flex items-center gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Male" id="male" />
                  <Label htmlFor="male">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Female" id="female" />
                  <Label htmlFor="female">Female</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium col-span-1">
              Birthday
            </label>
            <Input
              id="birthday"
              type="date"
              value={newMember.birthday}
              onChange={(e) => handleFieldChange("birthday", e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium col-span-1">
              Membership
            </label>
            <select
              value={newMember.membership}
              onChange={handleMembershipChange}
              className="col-span-3 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-gym-blue focus:border-transparent"
            >
              <option value="Basic">Basic (4 sessions)</option>
              <option value="Standard">Standard (8 sessions)</option>
              <option value="Premium">Premium (12 sessions)</option>
            </select>
          </div>
          {isAdmin && (
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium col-span-1">
                Trainer Edit
              </label>
              <div className="col-span-3 flex items-center">
                <Switch
                  checked={newMember.canBeEditedByTrainers}
                  onCheckedChange={() =>
                    setNewMember({
                      ...newMember,
                      canBeEditedByTrainers: !newMember.canBeEditedByTrainers,
                    })
                  }
                />
                <span className="ml-2 text-sm text-gray-500">
                  Allow trainers to edit this member
                </span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-gym-blue hover:bg-gym-dark-blue"
            disabled={isLoading}
          >
            {isLoading ? "Adding..." : "Add Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddMemberDialog;