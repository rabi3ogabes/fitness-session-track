
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check } from "lucide-react";

// Mock data
const initialPayments = [
  { id: 1, member: "Sarah Johnson", amount: 120, date: "2025-04-28", membership: "Premium", status: "Completed" },
  { id: 2, member: "Michael Brown", amount: 80, date: "2025-04-27", membership: "Basic", status: "Completed" },
  { id: 3, member: "Emma Wilson", amount: 95, date: "2025-04-25", membership: "Standard", status: "Completed" },
  { id: 4, member: "James Martinez", amount: 120, date: "2025-04-24", membership: "Premium", status: "Pending" },
  { id: 5, member: "Olivia Taylor", amount: 80, date: "2025-04-23", membership: "Basic", status: "Completed" },
];

// Mock registered members
const registeredMembers = [
  { id: 1, name: "Sarah Johnson" },
  { id: 2, name: "Michael Brown" },
  { id: 3, name: "Emma Wilson" },
  { id: 4, name: "James Martinez" },
  { id: 5, name: "Olivia Taylor" },
  { id: 6, name: "William Davis" },
  { id: 7, name: "Sophia Miller" },
  { id: 8, name: "Alexander Garcia" },
];

// Membership pricing in QAR
const membershipPricing = {
  "Basic": 80,
  "Standard": 95,
  "Premium": 120
};

const Payments = () => {
  const [payments, setPayments] = useState(initialPayments);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({
    member: "",
    membership: "Basic",
    isSessionPayment: false,
  });
  const [confirmationStep, setConfirmationStep] = useState(false);
  const { toast } = useToast();

  const filteredPayments = payments.filter(
    (payment) =>
      payment.member.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.membership.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddPayment = () => {
    if (!newPayment.member) {
      toast({
        title: "Required fields missing",
        description: "Please select a member",
        variant: "destructive",
      });
      return;
    }

    if (!confirmationStep) {
      setConfirmationStep(true);
      return;
    }

    const id = Math.max(...payments.map((p) => p.id)) + 1;
    const today = new Date().toISOString().split("T")[0];
    const amount = membershipPricing[newPayment.membership as keyof typeof membershipPricing];
    
    setPayments([
      ...payments, 
      { 
        id, 
        member: newPayment.member, 
        amount, 
        date: today, 
        membership: newPayment.membership, 
        status: "Completed" 
      }
    ]);
    
    setIsAddDialogOpen(false);
    setConfirmationStep(false);
    setNewPayment({
      member: "",
      membership: "Basic",
      isSessionPayment: false,
    });

    toast({
      title: "Payment recorded successfully",
      description: `Payment of QAR ${amount} recorded for ${newPayment.member}`,
    });
  };

  const handleMemberSelect = (value: string) => {
    // Find selected member from registered members
    const selectedMember = registeredMembers.find(member => member.name === value);
    if (selectedMember) {
      setNewPayment({ ...newPayment, member: selectedMember.name });
    }
  };

  const handleDialogClose = () => {
    setIsAddDialogOpen(false);
    setConfirmationStep(false);
    setNewPayment({
      member: "",
      membership: "Basic",
      isSessionPayment: false,
    });
  };

  const updatePaymentStatus = (id: number, newStatus: string) => {
    setPayments(
      payments.map((payment) =>
        payment.id === id
          ? {
              ...payment,
              status: newStatus,
            }
          : payment
      )
    );

    toast({
      title: "Payment status updated",
      description: `The payment status has been updated to ${newStatus}`,
    });
  };

  return (
    <DashboardLayout title="Payment Management">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="w-full sm:w-auto">
          <Input
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sm:w-80"
          />
        </div>
        <Button 
          onClick={() => setIsAddDialogOpen(true)} 
          className="w-full sm:w-auto bg-gym-blue hover:bg-gym-dark-blue"
        >
          Record New Payment
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Membership
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{payment.member}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-500">QAR {payment.amount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-500">{payment.date}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {payment.membership}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        payment.status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {payment.status === "Pending" && (
                      <button
                        onClick={() => updatePaymentStatus(payment.id, "Completed")}
                        className="text-gym-blue hover:text-gym-dark-blue"
                      >
                        Mark Completed
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No payments found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={handleDialogClose}>
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
                        {registeredMembers.map((member) => (
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
                  <span className="font-medium">{newPayment.isSessionPayment ? 'Session Payment' : 'Regular Payment'}</span>
                  
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
                <Button onClick={handleAddPayment} className="bg-gym-blue hover:bg-gym-dark-blue">
                  Confirm Payment
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button onClick={handleAddPayment} className="bg-gym-blue hover:bg-gym-dark-blue">
                  Continue
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Payments;
