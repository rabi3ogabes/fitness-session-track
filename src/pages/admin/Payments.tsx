
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import SearchBar from "@/components/payments/SearchBar";
import PaymentTable from "@/components/payments/PaymentTable";
import AddPaymentDialog from "@/components/payments/AddPaymentDialog";
import { initialPayments, registeredMembers, membershipPricing, PaymentFormData } from "@/components/payments/paymentUtils";
import { supabase, requireAuth } from "@/integrations/supabase/client";

const Payments = () => {
  const [payments, setPayments] = useState<typeof initialPayments>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  // Load payments from localStorage or Supabase on component mount
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const { data, error } = await supabase
          .from('payments')
          .select('*');
          
        if (error) {
          console.error("Error fetching payments:", error);
          // Use local storage as fallback
          const storedPayments = localStorage.getItem("payments");
          if (storedPayments) {
            setPayments(JSON.parse(storedPayments));
          } else {
            setPayments(initialPayments);
            // Initialize localStorage with mock data if empty
            localStorage.setItem("payments", JSON.stringify(initialPayments));
          }
          return;
        }
        
        if (data && data.length > 0) {
          setPayments(data);
        } else {
          setPayments(initialPayments);
        }
      } catch (err) {
        console.error("Error in fetchPayments:", err);
        // Fallback to localStorage
        const storedPayments = localStorage.getItem("payments");
        if (storedPayments) {
          setPayments(JSON.parse(storedPayments));
        } else {
          setPayments(initialPayments);
          localStorage.setItem("payments", JSON.stringify(initialPayments));
        }
      }
    };
    
    fetchPayments();
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

  const handleAddPayment = async (paymentData: PaymentFormData) => {
    try {
      const id = payments.length > 0 ? Math.max(...payments.map((p) => p.id)) + 1 : 1;
      const today = new Date().toISOString().split("T")[0];
      const amount = membershipPricing[paymentData.membership as keyof typeof membershipPricing];
      
      // Create the payment record
      const newPayment = { 
        id, 
        member: paymentData.member, 
        amount, 
        date: today, 
        membership: paymentData.membership, 
        status: "Completed" 
      };
      
      // Try to save payment to Supabase
      await requireAuth(async () => {
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            member: paymentData.member,
            amount,
            date: today,
            membership: paymentData.membership,
            status: "Completed"
          });
          
        if (paymentError) {
          console.error("Error saving payment to Supabase:", paymentError);
          throw paymentError;
        }
        
        // If this is a session payment, update the member's sessions
        if (paymentData.isSessionPayment && paymentData.sessionCount) {
          console.log(`Adding ${paymentData.sessionCount} sessions to ${paymentData.member}`);
          
          // First, get the member by name
          const { data: memberData, error: memberError } = await supabase
            .from('members')
            .select('*')
            .eq('name', paymentData.member)
            .single();
            
          if (memberError) {
            console.error("Error fetching member data:", memberError);
            throw memberError;
          }
          
          if (memberData) {
            // Calculate new session values
            const newSessions = (memberData.sessions || 0) + paymentData.sessionCount;
            const newRemainingSessions = (memberData.remaining_sessions || 0) + paymentData.sessionCount;
            
            // Update the member record
            const { error: updateError } = await supabase
              .from('members')
              .update({
                sessions: newSessions,
                remaining_sessions: newRemainingSessions
              })
              .eq('id', memberData.id);
              
            if (updateError) {
              console.error("Error updating member sessions:", updateError);
              throw updateError;
            }
            
            console.log(`Updated sessions for ${paymentData.member} to ${newSessions} (${newRemainingSessions} remaining)`);
          }
        }
      });
      
      // Update local state
      const updatedPayments = [...payments, newPayment];
      setPayments(updatedPayments);
      localStorage.setItem("payments", JSON.stringify(updatedPayments));
  
      toast({
        title: "Payment recorded successfully",
        description: `Payment of QAR ${amount} recorded for ${paymentData.member}${
          paymentData.isSessionPayment ? ` with ${paymentData.sessionCount} sessions added` : ''
        }`,
      });
    } catch (error: any) {
      console.error("Error in handleAddPayment:", error);
      toast({
        title: "Failed to record payment",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const updatePaymentStatus = async (id: number, newStatus: string) => {
    try {
      // Find payment in local state
      const payment = payments.find(p => p.id === id);
      if (!payment) return;
      
      // Try to update payment status in Supabase
      await requireAuth(async () => {
        const { error } = await supabase
          .from('payments')
          .update({ status: newStatus })
          .eq('id', id);
          
        if (error) {
          console.error("Error updating payment status in Supabase:", error);
          throw error;
        }
      });
      
      // Update local state
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
    } catch (error: any) {
      console.error("Error updating payment status:", error);
      toast({
        title: "Failed to update payment status",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
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
