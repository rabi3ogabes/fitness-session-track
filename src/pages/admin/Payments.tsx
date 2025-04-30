
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import SearchBar from "@/components/payments/SearchBar";
import PaymentTable from "@/components/payments/PaymentTable";
import AddPaymentDialog from "@/components/payments/AddPaymentDialog";
import { initialPayments, registeredMembers, membershipPricing, PaymentFormData } from "@/components/payments/paymentUtils";

const Payments = () => {
  const [payments, setPayments] = useState<typeof initialPayments>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  // Load payments from localStorage on component mount
  useEffect(() => {
    const storedPayments = localStorage.getItem("payments");
    if (storedPayments) {
      setPayments(JSON.parse(storedPayments));
    } else {
      setPayments(initialPayments);
      // Initialize localStorage with mock data if empty
      localStorage.setItem("payments", JSON.stringify(initialPayments));
    }
  }, []);

  // Update localStorage whenever payments change
  useEffect(() => {
    if (payments.length > 0) {
      localStorage.setItem("payments", JSON.stringify(payments));
    }
  }, [payments]);

  const filteredPayments = payments.filter(
    (payment) =>
      payment.member.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.membership.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddPayment = (paymentData: PaymentFormData) => {
    const id = payments.length > 0 ? Math.max(...payments.map((p) => p.id)) + 1 : 1;
    const today = new Date().toISOString().split("T")[0];
    const amount = membershipPricing[paymentData.membership as keyof typeof membershipPricing];
    
    const updatedPayments = [
      ...payments, 
      { 
        id, 
        member: paymentData.member, 
        amount, 
        date: today, 
        membership: paymentData.membership, 
        status: "Completed" 
      }
    ];
    
    setPayments(updatedPayments);
    localStorage.setItem("payments", JSON.stringify(updatedPayments));

    toast({
      title: "Payment recorded successfully",
      description: `Payment of QAR ${amount} recorded for ${paymentData.member}`,
    });
  };

  const updatePaymentStatus = (id: number, newStatus: string) => {
    const updatedPayments = payments.map((payment) =>
      payment.id === id
        ? {
            ...payment,
            status: newStatus,
          }
        : payment
    );
    
    setPayments(updatedPayments);
    localStorage.setItem("payments", JSON.stringify(updatedPayments));

    toast({
      title: "Payment status updated",
      description: `The payment status has been updated to ${newStatus}`,
    });
  };

  return (
    <DashboardLayout title="Payment Management">
      <SearchBar 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddClick={() => setIsAddDialogOpen(true)}
      />
      
      <PaymentTable 
        payments={filteredPayments} 
        updatePaymentStatus={updatePaymentStatus} 
      />
      
      <AddPaymentDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAddPayment={handleAddPayment}
        members={registeredMembers}
      />
    </DashboardLayout>
  );
};

export default Payments;
