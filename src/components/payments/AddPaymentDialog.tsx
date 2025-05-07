
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

// Types
type Member = {
  id: number;
  name: string;
};

type PaymentData = {
  member: string;
  membership: string;
  isSessionPayment: boolean;
  sessionCount: number;
};

// Membership pricing in QAR
const membershipPricing = {
  "Basic": 80,
  "Standard": 95,
  "Premium": 120
};

interface AddPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPayment: (payment: PaymentData) => void;
  members: Member[];
}

const AddPaymentDialog = ({ 
  isOpen, 
  onClose, 
  onAddPayment, 
  members 
}: AddPaymentDialogProps) => {
  const [newPayment, setNewPayment] = useState<PaymentData>({
    member: "",
    membership: "Basic",
    isSessionPayment: false,
    sessionCount: 4
  });
  const [confirmationStep, setConfirmationStep] = useState(false);
  const { toast } = useToast();

  const handleMemberSelect = (value: string) => {
    // Find selected member from registered members
    const selectedMember = members.find(member => member.name === value);
    if (selectedMember) {
      setNewPayment({ ...newPayment, member: selectedMember.name });
    }
  };

  const handleDialogClose = () => {
    onClose();
    setConfirmationStep(false);
    setNewPayment({
      member: "",
      membership: "Basic",
      isSessionPayment: false,
      sessionCount: 4
    });
  };

  const handleContinue = () => {
    if (!newPayment.member) {
      toast({
        title: "Required fields missing",
        description: "Please select a member",
        variant: "destructive",
      });
      return;
    }

    setConfirmationStep(true);
  };

  const handleConfirm = () => {
    onAddPayment(newPayment);
    handleDialogClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {confirmationStep ? "Confirm Payment Details" : "Record New Payment"}
          </DialogTitle>
        </DialogHeader>
        
        {!confirmationStep ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium col-span-1">
                Member*
              </label>
              <div className="col-span-3">
                <Select onValueChange={handleMemberSelect}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.name}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium col-span-1">
                Membership
              </label>
              <select
                value={newPayment.membership}
                onChange={(e) => setNewPayment({ ...newPayment, membership: e.target.value })}
                className="col-span-3 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-gym-blue focus:border-transparent"
              >
                <option value="Basic">Basic (QAR 80)</option>
                <option value="Standard">Standard (QAR 95)</option>
                <option value="Premium">Premium (QAR 120)</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium col-span-1">
                Type
              </label>
              <div className="col-span-3 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="sessionPayment"
                  checked={newPayment.isSessionPayment}
                  onChange={(e) => setNewPayment({ ...newPayment, isSessionPayment: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="sessionPayment">Session Payment</label>
              </div>
            </div>
            {newPayment.isSessionPayment && (
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium col-span-1">
                  Session Count
                </label>
                <div className="col-span-3">
                  <Input
                    type="number"
                    min="1"
                    value={newPayment.sessionCount}
                    onChange={(e) => setNewPayment({ 
                      ...newPayment, 
                      sessionCount: Math.max(1, parseInt(e.target.value) || 1)
                    })}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-4">
            <div className="bg-gray-50 p-4 rounded-md mb-4">
              <h3 className="font-medium text-gray-900 mb-2">Payment Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-500">Member:</span>
                <span className="font-medium">{newPayment.member}</span>
                
                <span className="text-gray-500">Amount:</span>
                <span className="font-medium">QAR {membershipPricing[newPayment.membership as keyof typeof membershipPricing]}</span>
                
                <span className="text-gray-500">Membership Type:</span>
                <span className="font-medium">{newPayment.membership}</span>
                
                <span className="text-gray-500">Payment Type:</span>
                <span className="font-medium">
                  {newPayment.isSessionPayment ? 'Session Payment' : 'Regular Payment'}
                </span>
                
                {newPayment.isSessionPayment && (
                  <>
                    <span className="text-gray-500">Sessions to Add:</span>
                    <span className="font-medium">{newPayment.sessionCount}</span>
                  </>
                )}
                
                <span className="text-gray-500">Date:</span>
                <span className="font-medium">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-2 p-2 bg-blue-50 rounded-md">
              <Check className="h-5 w-5 text-blue-500" />
              <p className="text-sm text-blue-700">Please confirm the payment details above</p>
            </div>
          </div>
        )}
        
        <DialogFooter>
          {confirmationStep ? (
            <>
              <Button variant="outline" onClick={() => setConfirmationStep(false)}>
                Back
              </Button>
              <Button onClick={handleConfirm} className="bg-gym-blue hover:bg-gym-dark-blue">
                Confirm Payment
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleDialogClose}>
                Cancel
              </Button>
              <Button onClick={handleContinue} className="bg-gym-blue hover:bg-gym-dark-blue">
                Continue
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddPaymentDialog;
