import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase, requireAuth } from "@/integrations/supabase/client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface MembershipPlan {
  name: string;
  sessions: number;
}

interface NewMemberDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onMemberAdded: () => void;
}

const NewMemberDialog = ({ isOpen, onOpenChange, onMemberAdded }: NewMemberDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([
    { name: "Basic", sessions: 4 },
    { name: "Standard", sessions: 8 },
    { name: "Premium", sessions: 12 }
  ]);
  
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(membershipPlans[0]);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    phone: "",
    birthday: "",
    membership: selectedPlan?.name || "Basic",
    sessions: selectedPlan?.sessions || 4,
    additionalSessions: "0",
    gender: "Male"
  });
  
  useEffect(() => {
    if (selectedPlan) {
      setNewMember(prev => ({ 
        ...prev, 
        membership: selectedPlan.name,
        sessions: selectedPlan.sessions
      }));
    }
  }, [selectedPlan]);

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
    if (!phoneRegex.test(phone.replace(/[\s-]/g, ''))) {
      return "Please enter a valid phone number (exactly 8 digits)";
    }
    return null;
  };

  const handleInputChange = (field: string, value: string) => {
    setNewMember({ ...newMember, [field]: value });
    
    // Clear error when field changes
    if (formErrors[field]) {
      const { [field]: _, ...rest } = formErrors;
      setFormErrors(rest);
    }
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
    
    const phoneValidationError = validatePhone(newMember.phone);
    if (phoneValidationError) {
      errors.phone = phoneValidationError;
    }
    
    const additionalSessions = parseInt(newMember.additionalSessions);
    if (isNaN(additionalSessions) || additionalSessions < 0) {
      errors.additionalSessions = "Please enter a valid number (0 or greater)";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const sessions = selectedPlan ? selectedPlan.sessions : 4;
      const additionalSessions = parseInt(newMember.additionalSessions) || 0;
      const totalSessions = sessions + additionalSessions;
      
      console.log("Attempting to insert new member into database...");
      
      // Use requireAuth to ensure authentication
      const data = await requireAuth(async () => {
        // Insert into Supabase
        const { data, error } = await supabase
          .from('members')
          .insert([
            {
              name: newMember.name,
              email: newMember.email,
              phone: newMember.phone,
              birthday: newMember.birthday,
              membership: newMember.membership,
              sessions: totalSessions,
              remaining_sessions: totalSessions,
              status: "Active",
              can_be_edited_by_trainers: true,
              gender: newMember.gender
            }
          ])
          .select();

        if (error) {
          console.error("Error adding member:", error);
          throw error;
        }
        
        return data;
      });
      
      console.log("Member registration successful, received data:", data);

      toast({
        title: "New member registered",
        description: `${newMember.name} has been successfully registered`,
      });

      // Reset form
      setNewMember({
        name: "",
        email: "",
        phone: "",
        birthday: "",
        membership: membershipPlans[0].name,
        sessions: membershipPlans[0].sessions,
        additionalSessions: "0",
        gender: "Male"
      });
      
      setSelectedPlan(membershipPlans[0]);
      
      // Notify parent component
      onMemberAdded();
      
      setFormErrors({});
      setPhoneError(null);
      
      // Close dialog
      onOpenChange(false);
    } catch (err: any) {
      console.error("Error registering member:", err);
      toast({
        title: "Failed to register member",
        description: err.message || "An unexpected error occurred",
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
          <DialogTitle>Register New Walk-In Member</DialogTitle>
          <DialogDescription>Enter member details to register them in the system</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium col-span-1">
              Name*
            </label>
            <div className="col-span-3 space-y-1">
              <Input
                id="name"
                value={newMember.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
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
                onChange={(e) => handleInputChange('email', e.target.value)}
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
                placeholder="8-digit phone number"
              />
              {formErrors.phone && (
                <p className="text-sm text-red-500">{formErrors.phone}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium col-span-1">
              Gender
            </label>
            <div className="col-span-3 flex items-center space-x-4">
              <RadioGroup
                defaultValue="Male"
                value={newMember.gender}
                onValueChange={(value) => handleInputChange('gender', value)}
                className="flex items-center gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Male" id="gender-male" />
                  <Label htmlFor="gender-male">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Female" id="gender-female" />
                  <Label htmlFor="gender-female">Female</Label>
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
              onChange={(e) => handleInputChange('birthday', e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium col-span-1">
              Membership
            </label>
            <div className="col-span-3 grid grid-cols-3 gap-2">
              {membershipPlans.map((plan) => (
                <Button
                  key={plan.name}
                  type="button"
                  variant={selectedPlan?.name === plan.name ? "default" : "outline"}
                  className={selectedPlan?.name === plan.name ? "bg-gym-blue hover:bg-gym-dark-blue" : ""}
                  onClick={() => setSelectedPlan(plan)}
                >
                  {plan.name}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium col-span-1">
              Base Sessions
            </label>
            <div className="col-span-3 flex items-center">
              <span className="text-sm font-medium bg-gray-100 px-3 py-2 rounded-md">
                {selectedPlan ? selectedPlan.sessions : 4} sessions
              </span>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium col-span-1">
              Additional
            </label>
            <div className="col-span-3 space-y-1">
              <Input
                id="additional-sessions"
                type="number"
                min="0"
                value={newMember.additionalSessions}
                onChange={(e) => handleInputChange('additionalSessions', e.target.value)}
                className={`${formErrors.additionalSessions ? "border-red-500" : ""}`}
              />
              {formErrors.additionalSessions && (
                <p className="text-sm text-red-500">{formErrors.additionalSessions}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium col-span-1">
              Total
            </label>
            <div className="col-span-3 flex items-center">
              <span className="text-sm font-medium bg-gray-100 px-3 py-2 rounded-md">
                {selectedPlan ? selectedPlan.sessions + (parseInt(newMember.additionalSessions) || 0) : 4} sessions
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-gym-blue hover:bg-gym-dark-blue"
              disabled={isLoading}
            >
              {isLoading ? "Registering..." : "Register Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewMemberDialog;
