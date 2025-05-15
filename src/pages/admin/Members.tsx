import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase, requireAuth } from "@/integrations/supabase/client";
import PasswordResetDialog from "@/components/shared/PasswordResetDialog";

// Components
import MemberSearch from "./components/members/MemberSearch";
import MemberTable from "./components/members/MemberTable";
import AddMemberDialog from "./components/members/AddMemberDialog";
import EditMemberDialog from "./components/members/EditMemberDialog";

// Types
import { Member, PaymentHistoryData } from "./components/members/types";

const Members = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const { toast } = useToast();
  const [paymentHistoryData, setPaymentHistoryData] = useState<PaymentHistoryData>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch members data from Supabase
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching members data...");
        
        await requireAuth(async () => {
          const { data, error } = await supabase
            .from('members')
            .select('*');
            
          if (error) {
            console.error("Error fetching members:", error);
            toast({
              title: "Failed to load members",
              description: error.message,
              variant: "destructive",
            });
            return;
          }
          
          console.log("Members data received:", data);
          
          if (!data || data.length === 0) {
            console.log("No members found in the database");
            setMembers([]);
            return;
          }
          
          // Transform data to match our Member interface
          const formattedMembers: Member[] = data.map((member: any) => ({
            id: member.id,
            name: member.name,
            email: member.email,
            phone: member.phone || "",
            membership: member.membership || "Basic",
            sessions: member.sessions || 0,
            remainingSessions: member.remaining_sessions || 0,
            status: member.status || "Active",
            birthday: member.birthday || "",
            canBeEditedByTrainers: member.can_be_edited_by_trainers || false,
            gender: member.gender || "Male"
          }));
          
          setMembers(formattedMembers);
        });
      } catch (err) {
        console.error("Error fetching members:", err);
        toast({
          title: "Failed to load members",
          description: "An error occurred while loading members",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [toast, refreshTrigger]);

  // Fetch payment history data
  useEffect(() => {
    const fetchPaymentHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('payments')
          .select('*');
          
        if (error) {
          console.error("Error fetching payments:", error);
          return;
        }
        
        // Create a mapping of member names to payment histories
        const paymentHistory: PaymentHistoryData = {};
        
        // First, map members to IDs
        const memberNameToId: Record<string, number> = {};
        members.forEach(member => {
          memberNameToId[member.name] = member.id;
        });
        
        // Then organize payment data by member ID
        data.forEach((payment: any) => {
          const memberId = memberNameToId[payment.member];
          if (!memberId) return;
          
          if (!paymentHistory[memberId]) {
            paymentHistory[memberId] = [];
          }
          
          paymentHistory[memberId].push({
            id: payment.id,
            date: payment.date,
            amount: payment.amount,
            description: `${payment.membership} Membership`,
            status: payment.status
          });
        });
        
        setPaymentHistoryData(paymentHistory);
      } catch (err) {
        console.error("Error fetching payment history:", err);
      }
    };

    if (members.length > 0) {
      fetchPaymentHistory();
    }
  }, [members]);

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddMember = async (newMember: Member) => {
    console.log("Adding new member to state:", newMember);
    // Instead of just updating the state, trigger a refresh
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEditMember = async (editedMember: Member) => {
    if (!editedMember.name || !editedMember.email || !editedMember.phone) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await requireAuth(async () => {
        // Prepare the data for Supabase (column names differ)
        const memberData = {
          name: editedMember.name,
          email: editedMember.email,
          phone: editedMember.phone,
          membership: editedMember.membership,
          sessions: editedMember.sessions,
          remaining_sessions: editedMember.remainingSessions,
          status: editedMember.status,
          birthday: editedMember.birthday,
          can_be_edited_by_trainers: editedMember.canBeEditedByTrainers,
          gender: editedMember.gender
        };
        
        console.log("Updating member with ID:", editedMember.id, memberData);
        
        const { error } = await supabase
          .from('members')
          .update(memberData)
          .eq('id', editedMember.id);
          
        if (error) {
          console.error("Error updating member:", error);
          throw error;
        }
        
        // Update local state
        setMembers(prevMembers => 
          prevMembers.map(member => member.id === editedMember.id ? editedMember : member)
        );
        
        setIsEditDialogOpen(false);
        
        toast({
          title: "Member updated successfully",
          description: `${editedMember.name}'s information has been updated`,
        });
      });
    } catch (err: any) {
      console.error("Error updating member:", err);
      toast({
        title: "Failed to update member",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (member: Member) => {
    setCurrentMember({...member});
    setIsEditDialogOpen(true);
  };

  const toggleMemberStatus = async (id: number) => {
    try {
      // First, find the current member to get their status
      const member = members.find(m => m.id === id);
      if (!member) return;
      
      const newStatus = member.status === "Active" ? "Inactive" : "Active";
      
      console.log("Toggling status for member:", id, "to", newStatus);
      
      await requireAuth(async () => {
        // Update in Supabase
        const { error } = await supabase
          .from('members')
          .update({ status: newStatus })
          .eq('id', id);
          
        if (error) {
          console.error("Error updating member status:", error);
          throw error;
        }
        
        // Update local state
        setMembers(prevMembers => 
          prevMembers.map(member => 
            member.id === id ? { ...member, status: newStatus } : member
          )
        );

        toast({
          title: "Member status updated",
          description: "The member's status has been updated successfully",
        });
      });
    } catch (err: any) {
      console.error("Error toggling member status:", err);
      toast({
        title: "Failed to update status",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const toggleTrainerEditAccess = async (id: number) => {
    try {
      // First, find the current member
      const member = members.find(m => m.id === id);
      if (!member) return;
      
      const newTrainerAccess = !member.canBeEditedByTrainers;
      
      // Use requireAuth for authentication
      await requireAuth(async () => {
        // Update in Supabase
        const { error } = await supabase
          .from('members')
          .update({ can_be_edited_by_trainers: newTrainerAccess })
          .eq('id', id);
          
        if (error) {
          console.error("Error updating trainer access:", error);
          throw error;
        }
        
        // Update local state
        setMembers(prevMembers => 
          prevMembers.map(member => 
            member.id === id ? { ...member, canBeEditedByTrainers: newTrainerAccess } : member
          )
        );

        const memberName = member.name;
        
        toast({
          title: "Trainer access updated",
          description: `${memberName} can ${newTrainerAccess ? 'now' : 'no longer'} be edited by trainers`,
        });
      });
    } catch (err: any) {
      console.error("Error toggling trainer edit access:", err);
      toast({
        title: "Failed to update trainer access",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };
  
  const openResetPasswordDialog = (id: number) => {
    setSelectedMemberId(id);
    setIsResetPasswordDialogOpen(true);
  };
  
  const confirmResetPassword = async (newPassword: string) => {
    if (selectedMemberId === null) return;
    
    try {
      const member = members.find(m => m.id === selectedMemberId);
      if (!member) return;
      
      await requireAuth(async () => {
        // Get list of users and find by email
        const { data: userList, error: listError } = await supabase.auth.admin.listUsers();
        
        if (listError) {
          toast({
            title: "Error listing user accounts",
            description: listError.message,
            variant: "destructive",
          });
          throw listError;
        }

        if (!userList) {
          toast({
            title: "Error listing user accounts",
            description: "No data returned for user accounts.",
            variant: "destructive",
          });
          throw new Error("User list data is null");
        }
        
        const userAccount = userList.users.find(user => user.email === member.email);
        
        if (!userAccount) {
          toast({
            title: "User account not found",
            description: `Could not find user account for ${member.name}. Their password cannot be reset at this time.`,
            variant: "warning",
          });
          // Similar to Trainers.tsx, we'll return instead of throwing for a better UX.
          return;
        }
        
        // Use the custom password provided
        const { error: resetError } = await supabase.auth.admin.updateUserById(
          userAccount.id, 
          { password: newPassword }
        );
        
        if (resetError) {
          throw resetError;
        }
        
        toast({
          title: "Password reset successfully",
          description: `${member.name}'s password has been updated successfully`,
        });
        setIsResetPasswordDialogOpen(false);
        setSelectedMemberId(null);
      });
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast({
        title: "Failed to reset password",
        description: error.message || "There was an error resetting the password",
        variant: "destructive"
      });
    }
  };

  return (
    <DashboardLayout title="Member Management">
      <MemberSearch 
        searchTerm={searchTerm} 
        onSearchChange={setSearchTerm}
        onAddClick={() => setIsAddDialogOpen(true)}
      />

      <MemberTable 
        members={members}
        filteredMembers={filteredMembers}
        toggleMemberStatus={toggleMemberStatus}
        toggleTrainerEditAccess={toggleTrainerEditAccess}
        openEditDialog={openEditDialog}
        resetPassword={(id) => openResetPasswordDialog(id)}
        isLoading={isLoading}
      />

      <AddMemberDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddMember={handleAddMember}
      />

      <EditMemberDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        currentMember={currentMember}
        onEditMember={handleEditMember}
        paymentHistoryData={paymentHistoryData}
      />
      
      {/* Custom Password Reset Dialog */}
      {selectedMemberId !== null && (
        <PasswordResetDialog
          isOpen={isResetPasswordDialogOpen}
          onClose={() => setIsResetPasswordDialogOpen(false)}
          onConfirm={confirmResetPassword}
          entityName={members.find(m => m.id === selectedMemberId)?.name || "Member"}
          entityType="member"
        />
      )}
    </DashboardLayout>
  );
};

export default Members;
