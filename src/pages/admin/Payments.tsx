import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import SearchBar from "@/components/payments/SearchBar";
import PaymentTable from "@/components/payments/PaymentTable";
import AddPaymentDialog from "@/components/payments/AddPaymentDialog";
import {
  membershipPricing,
  PaymentFormData,
} from "@/components/payments/paymentUtils";
import { supabase, requireAuth } from "@/integrations/supabase/client";
import LoadingIndicator from "@/components/LoadingIndicator";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [members, setMembers] = useState([]);

  // Load payments from Supabase on component mount
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("payments")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching payments:", error);
          toast({
            title: "Failed to load payments",
            description: error.message,
            variant: "destructive",
          });
          return;
        }
        if (data && data.length > 0) {
          setPayments(data);
        }
      } catch (err) {
        console.error("Error in fetchPayments:", err);
        toast({
          title: "Failed to load payments",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    const fetchMembers = async () => {
      try {
        const { data, error } = await supabase
          .from("members")
          .select("id, name")
          .eq("status", "Active");

        if (error) {
          return;
        }

        if (data) {
          setMembers(data);
        }
      } catch (err) {
        console.error("Error fetching members:", err);
      }
    };

    fetchPayments();
    fetchMembers();
  }, [toast]);

  const filteredPayments = payments.filter(
    (payment) =>
      payment.member?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.membership?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddPayment = async (paymentData: PaymentFormData) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const amount =
        membershipPricing[
          paymentData.membership as keyof typeof membershipPricing
        ];

      await requireAuth(async () => {
        const { data, error: paymentError } = await supabase
          .from("payments")
          .insert({
            member: paymentData.member,
            amount,
            date: today,
            membership: paymentData.membership,
            status: "Completed",
          })
          .select();

        if (paymentError) {
          throw paymentError;
        }

        if (paymentData.isSessionPayment && paymentData.sessionCount) {
          const { data: memberData, error: memberError } = await supabase
            .from("members")
            .select("*")
            .eq("name", paymentData.member)
            .single();
          if (memberError) {
            throw memberError;
          }
          if (memberData) {
            const newSessions =
              (memberData.sessions || 0) + paymentData.sessionCount;
            const newRemainingSessions =
              (memberData.remaining_sessions || 0) + paymentData.sessionCount;
            const { error: updateError } = await supabase
              .from("members")
              .update({
                sessions: newSessions,
                remaining_sessions: newRemainingSessions,
              })
              .eq("id", memberData.id);
            if (updateError) {
              throw updateError;
            }
          }
        }
        if (data && data.length > 0) {
          setPayments((prev) => [data[0], ...prev]);
        }
      });
      toast({
        title: "Payment recorded successfully",
        description: `Payment of QAR ${amount} recorded for ${
          paymentData.member
        }${
          paymentData.isSessionPayment
            ? ` with ${paymentData.sessionCount} sessions added`
            : ""
        }`,
      });
      const { data } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) {
        setPayments(data);
      }
    } catch (error: unknown) {
      console.error("Error in handleAddPayment:", error);
      toast({
        title: "Failed to record payment",
        description:
          error && typeof error === "object" && "message" in error
            ? (error as { message?: string }).message
            : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const updatePaymentStatus = async (id: number, newStatus: string) => {
    try {
      // Find payment in local state
      const payment = payments.find((p) => p.id === id);
      if (!payment) return;

      // Try to update payment status in Supabase
      await requireAuth(async () => {
        const { error } = await supabase
          .from("payments")
          .update({ status: newStatus })
          .eq("id", id);

        if (error) {
          console.error("Error updating payment status in Supabase:", error);
          throw error;
        }

        // Update local state
        setPayments((prevPayments) =>
          prevPayments.map((p) =>
            p.id === id ? { ...p, status: newStatus } : p
          )
        );
      });

      toast({
        title: "Payment status updated",
        description: `The payment status has been updated to ${newStatus}`,
      });
    } catch (error: unknown) {
      console.error("Error updating payment status:", error);
      toast({
        title: "Failed to update payment status",
        description:
          error && typeof error === "object" && "message" in error
            ? (error as { message?: string }).message
            : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const cancelPayment = async (id: number) => {
    try {
      const payment = payments.find((p) => p.id === id);
      if (!payment) {
        toast({
          title: "Error",
          description: "Payment not found",
          variant: "destructive",
        });
        return;
      }

      const isSessionPayment = [
        "Basic",
        "Standard",
        "Premium",
        "Ultimate",
      ].includes(payment.membership);

      await requireAuth(async () => {
        if (isSessionPayment) {
          let sessionsToDeduct = 0;
          switch (payment.membership) {
            case "Basic":
              sessionsToDeduct = 12;
              break;
            case "Standard":
              sessionsToDeduct = 4;
              break;
            case "Premium":
              sessionsToDeduct = 20;
              break;
            case "Ultimate":
              sessionsToDeduct = 30;
              break;
            default:
              sessionsToDeduct = 0;
          }

          if (sessionsToDeduct > 0) {
            const { data: membersByName, error: nameError } = await supabase
              .from("members")
              .select("*")
              .ilike("name", payment.member);

            let memberData = null;

            if (membersByName && membersByName.length > 0) {
              memberData = membersByName[0];
            } else {
              const { data: membersByEmail, error: emailError } = await supabase
                .from("members")
                .select("*")
                .ilike("email", payment.member);

              if (membersByEmail && membersByEmail.length > 0) {
                memberData = membersByEmail[0];
              } else {
                const { data: fuzzyMembers } = await supabase
                  .from("members")
                  .select("*");

                if (fuzzyMembers && fuzzyMembers.length > 0) {
                  const possibleMatch = fuzzyMembers.find(
                    (m) =>
                      m.name
                        .toLowerCase()
                        .includes(payment.member.toLowerCase()) ||
                      payment.member
                        .toLowerCase()
                        .includes(m.name.toLowerCase())
                  );

                  if (possibleMatch) {
                    memberData = possibleMatch;
                  }
                }
              }
            }

            if (memberData) {
              const newRemainingSessions = Math.max(
                0,
                (parseInt(memberData.remaining_sessions) || 0) -
                  sessionsToDeduct
              );
              const newTotalSessions = Math.max(
                0,
                (parseInt(memberData.total_sessions) || 0) - sessionsToDeduct
              );
              const newSessions = Math.max(
                0,
                (parseInt(memberData.sessions) || 0) - sessionsToDeduct
              );
              const { error: updateError } = await supabase
                .from("members")
                .update({
                  remaining_sessions: newRemainingSessions,
                  total_sessions: newTotalSessions,
                  sessions: newSessions,
                })
                .eq("id", memberData.id);

              if (updateError) {
                console.error("Error updating member sessions:", updateError);
                throw updateError;
              }
              const { data: verifyData, error: verifyError } = await supabase
                .from("members")
                .select("*")
                .eq("id", memberData.id)
                .single();

              if (verifyError) {
                console.error("Error verifying update:", verifyError);
              }
            } else {
              toast({
                title: "Warning",
                description:
                  "Payment cancelled but could not find member to adjust sessions",
                variant: "default",
              });
            }
          }
        }
        const { error } = await supabase
          .from("payments")
          .update({ status: "Cancelled" })
          .eq("id", id);
        if (error) {
          throw error;
        }
        setPayments((prevPayments) =>
          prevPayments.map((p) =>
            p.id === id ? { ...p, status: "Cancelled" } : p
          )
        );
      });
      toast({
        title: "Payment cancelled",
        description: `The payment has been cancelled${
          isSessionPayment ? " and member sessions have been adjusted" : ""
        }`,
      });
    } catch (error: unknown) {
      toast({
        title: "Failed to cancel payment",
        description:
          error && typeof error === "object" && "message" in error
            ? (error as { message?: string }).message
            : "An unexpected error occurred",
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

      {isLoading ? (
        <div className="mt-8">
          <LoadingIndicator message="Loading payments..." size="small" />
        </div>
      ) : (
        <PaymentTable
          payments={filteredPayments}
          updatePaymentStatus={updatePaymentStatus}
          cancelPayment={cancelPayment}
        />
      )}

      <AddPaymentDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAddPayment={handleAddPayment}
        members={members}
      />
    </DashboardLayout>
  );
};

export default Payments;
