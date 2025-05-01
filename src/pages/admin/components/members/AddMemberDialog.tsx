
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface AddMemberDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddMember: (member: any) => void;
}

const AddMemberDialog = ({ isOpen, onOpenChange, onAddMember }: AddMemberDialogProps) => {
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
    gender: "Male" // Default gender
  });

  const [phoneError, setPhoneError] = useState<string | null>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value;
    setNewMember({ ...newMember, phone });
    
    // Clear error when user types
    if (phoneError) setPhoneError(null);
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

  const handleMembershipChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const membership = e.target.value;
    let sessions = 4;
    if (membership === "Standard") sessions = 8;
    if (membership === "Premium") sessions = 12;
    setNewMember({ ...newMember, membership, sessions, remainingSessions: sessions });
  };

  const handleSubmit = () => {
    // Validate phone
    const phoneValidationError = validatePhone(newMember.phone);
    if (phoneValidationError) {
      setPhoneError(phoneValidationError);
      return;
    }
    
    // Submit if no errors
    onAddMember(newMember);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register New Member</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium col-span-1">
              Name*
            </label>
            <Input
              id="name"
              value={newMember.name}
              onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
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
              value={newMember.email}
              onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
              className="col-span-3"
            />
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
                className={`${phoneError ? "border-red-500" : ""}`}
              />
              {phoneError && (
                <p className="text-sm text-red-500">{phoneError}</p>
              )}
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
                onValueChange={(value) => setNewMember({ ...newMember, gender: value })}
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
              onChange={(e) => setNewMember({ ...newMember, birthday: e.target.value })}
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
                  onCheckedChange={() => setNewMember({ ...newMember, canBeEditedByTrainers: !newMember.canBeEditedByTrainers })}
                />
                <span className="ml-2 text-sm text-gray-500">Allow trainers to edit this member</span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-gym-blue hover:bg-gym-dark-blue">
            Add Member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddMemberDialog;
