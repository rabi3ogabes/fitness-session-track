
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format } from "date-fns";
import { UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { membershipPlans } from "../mockData";

interface NewMemberDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRegister: (member: any) => void;
}

export const NewMemberDialog = ({ isOpen, onOpenChange, onRegister }: NewMemberDialogProps) => {
  const { toast } = useToast();
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    phone: "",
    birthday: format(new Date(), "yyyy-MM-dd"),
    membershipPlan: "1",
    additionalSessions: "0",
    gender: "Male"
  });
  
  const [phoneError, setPhoneError] = useState<string | null>(null);
  
  const handleNewMemberInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === "phone") {
      setPhoneError(null); // Clear error when user types in phone field
    }
    
    setNewMember(prev => ({ ...prev, [name]: value }));
  };

  const handleGenderChange = (value: string) => {
    setNewMember(prev => ({ ...prev, gender: value }));
  };
  
  const validatePhone = (phone: string) => {
    // Basic phone number validation
    // Requires at least 10 digits
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phone) return "Phone number is required";
    if (!phoneRegex.test(phone.replace(/[\s-]/g, ''))) {
      return "Please enter a valid phone number (at least 10 digits)";
    }
    return null;
  };
  
  const handleRegisterMember = () => {
    // Validate form
    if (!newMember.name || !newMember.email) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    // Validate phone
    const phoneValidationError = validatePhone(newMember.phone);
    if (phoneValidationError) {
      setPhoneError(phoneValidationError);
      return;
    }
    
    // In a real app, this would create a new account, process payment, etc.
    const selectedPlan = membershipPlans.find(plan => plan.id === parseInt(newMember.membershipPlan));
    
    toast({
      title: "New member registered",
      description: `${newMember.name} has been registered with the ${selectedPlan?.name} plan.`,
    });
    
    onRegister(newMember);
    
    // Reset form
    setNewMember({
      name: "",
      email: "",
      phone: "",
      birthday: format(new Date(), "yyyy-MM-dd"),
      membershipPlan: "1",
      additionalSessions: "0",
      gender: "Male"
    });
    
    setPhoneError(null);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Register New Member</DialogTitle>
          <DialogDescription>
            Create a new account and membership for a walk-in member.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="member-name" className="text-right">
              Name*
            </Label>
            <Input
              id="member-name"
              name="name"
              value={newMember.name}
              onChange={handleNewMemberInputChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="member-email" className="text-right">
              Email*
            </Label>
            <Input
              id="member-email"
              name="email"
              type="email"
              value={newMember.email}
              onChange={handleNewMemberInputChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="member-phone" className="text-right">
              Phone*
            </Label>
            <div className="col-span-3 space-y-1">
              <Input
                id="member-phone"
                name="phone"
                value={newMember.phone}
                onChange={handleNewMemberInputChange}
                className={phoneError ? "border-red-500" : ""}
              />
              {phoneError && (
                <p className="text-sm text-red-500">{phoneError}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="member-gender" className="text-right">
              Gender*
            </Label>
            <div className="col-span-3 flex items-center space-x-4">
              <RadioGroup
                defaultValue={newMember.gender}
                value={newMember.gender}
                onValueChange={handleGenderChange}
                className="flex items-center gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Male" id="trainer-male" />
                  <Label htmlFor="trainer-male">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Female" id="trainer-female" />
                  <Label htmlFor="trainer-female">Female</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="member-birthday" className="text-right">
              Birthday
            </Label>
            <Input
              id="member-birthday"
              name="birthday"
              type="date"
              value={newMember.birthday}
              onChange={handleNewMemberInputChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="membership-plan" className="text-right">
              Membership Plan
            </Label>
            <Select 
              name="membershipPlan" 
              value={newMember.membershipPlan}
              onValueChange={(value) => handleNewMemberInputChange({
                target: { name: "membershipPlan", value }
              } as React.ChangeEvent<HTMLSelectElement>)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                {membershipPlans.map(plan => (
                  <SelectItem key={plan.id} value={plan.id.toString()}>
                    {plan.name} - QAR {plan.price} ({plan.sessions} sessions)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="additional-sessions" className="text-right">
              Extra Sessions
            </Label>
            <Input
              id="additional-sessions"
              name="additionalSessions"
              type="number"
              min="0"
              value={newMember.additionalSessions}
              onChange={handleNewMemberInputChange}
              className="col-span-3"
            />
          </div>
          <div className="flex justify-end mt-4">
            <Button 
              onClick={handleRegisterMember} 
              className="bg-gym-blue hover:bg-gym-dark-blue"
            >
              Register & Mark Present
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const NewMemberButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <Button size="sm" className="bg-gym-blue hover:bg-gym-dark-blue" onClick={onClick}>
      <UserPlus className="h-4 w-4 mr-1" /> Register Walk-in Member
    </Button>
  );
};
