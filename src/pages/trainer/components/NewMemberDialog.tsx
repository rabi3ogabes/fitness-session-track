
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    additionalSessions: "0"
  });
  
  const handleNewMemberInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewMember(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRegisterMember = () => {
    // Validate form
    if (!newMember.name || !newMember.email || !newMember.phone) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
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
      additionalSessions: "0"
    });
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
            <Input
              id="member-phone"
              name="phone"
              value={newMember.phone}
              onChange={handleNewMemberInputChange}
              className="col-span-3"
            />
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
