
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// Mock data
const initialPayments = [
  { id: 1, member: "Sarah Johnson", amount: 120, date: "2025-04-28", membership: "Premium", status: "Completed" },
  { id: 2, member: "Michael Brown", amount: 80, date: "2025-04-27", membership: "Basic", status: "Completed" },
  { id: 3, member: "Emma Wilson", amount: 95, date: "2025-04-25", membership: "Standard", status: "Completed" },
  { id: 4, member: "James Martinez", amount: 120, date: "2025-04-24", membership: "Premium", status: "Pending" },
  { id: 5, member: "Olivia Taylor", amount: 80, date: "2025-04-23", membership: "Basic", status: "Completed" },
];

const Payments = () => {
  const [payments, setPayments] = useState(initialPayments);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({
    member: "",
    amount: 0,
    membership: "Basic",
  });
  const { toast } = useToast();

  const filteredPayments = payments.filter(
    (payment) =>
      payment.member.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.membership.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddPayment = () => {
    if (!newPayment.member || newPayment.amount <= 0) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const id = Math.max(...payments.map((p) => p.id)) + 1;
    const today = new Date().toISOString().split("T")[0];
    
    setPayments([
      ...payments, 
      { 
        id, 
        member: newPayment.member, 
        amount: newPayment.amount, 
        date: today, 
        membership: newPayment.membership, 
        status: "Completed" 
      }
    ]);
    
    setIsAddDialogOpen(false);
    setNewPayment({
      member: "",
      amount: 0,
      membership: "Basic",
    });

    toast({
      title: "Payment recorded successfully",
      description: `Payment of $${newPayment.amount} recorded for ${newPayment.member}`,
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
                    <div className="text-gray-500">${payment.amount}</div>
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

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record New Payment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium col-span-1">
                Member*
              </label>
              <Input
                id="member"
                value={newPayment.member}
                onChange={(e) => setNewPayment({ ...newPayment, member: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium col-span-1">
                Amount*
              </label>
              <Input
                id="amount"
                type="number"
                value={newPayment.amount || ""}
                onChange={(e) => setNewPayment({ ...newPayment, amount: parseFloat(e.target.value) })}
                className="col-span-3"
              />
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
                <option value="Basic">Basic ($80)</option>
                <option value="Standard">Standard ($95)</option>
                <option value="Premium">Premium ($120)</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPayment} className="bg-gym-blue hover:bg-gym-dark-blue">
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Payments;
