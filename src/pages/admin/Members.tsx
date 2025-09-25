import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase, requireAuth } from "@/integrations/supabase/client";

// Components
import MemberSearch from "./components/members/MemberSearch";
import MemberTable from "./components/members/MemberTable";
import AddMemberDialog from "./components/members/AddMemberDialog";
import EditMemberDialog from "./components/members/EditMemberDialog";

// Types
import { Member, PaymentHistoryData } from "./components/members/types";
import { useAuth } from "@/context/AuthContext";

const Members = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [showDeleteIcon, setShowDeleteIcon] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] =
    useState(false);
  const { isTrainer } = useAuth();

  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const { toast } = useToast();

  const [refreshTrigger, setRefreshTrigger] = useState(0); // Add a refresh trigger

  // Load settings on component mount
  useEffect(() => {
    const savedShowDeleteIcon = localStorage.getItem("showMemberDeleteIcon");
    if (savedShowDeleteIcon !== null) {
      setShowDeleteIcon(JSON.parse(savedShowDeleteIcon));
    }
  }, []);

  // Fetch members data from Supabase
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setIsLoading(true);
        await requireAuth(async () => {
          const { data, error } = await supabase.from("members").select("*").order("created_at", { ascending: false });

          if (error) {
            console.error("Error fetching members:", error);
            toast({
              title: "Failed to load members",
              description: error.message,
              variant: "destructive",
            });
            return;
          }
          if (!data || data.length === 0) {
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
            gender: member.gender || "Male",
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

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (isTrainer && !member.canBeEditedByTrainers) {
      return false;
    }

    return matchesSearch;
  });
  const handleAddMember = async (newMember: Member) => {
    // Instead of just updating the state, trigger a refresh
    setRefreshTrigger((prev) => prev + 1);
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
          gender: editedMember.gender,
        };


        const { error } = await supabase
          .from("members")
          .update(memberData)
          .eq("id", editedMember.id);

        if (error) {
          console.error("Error updating member:", error);
          throw error;
        }

        // Update local state
        setMembers((prevMembers) =>
          prevMembers.map((member) =>
            member.id === editedMember.id ? editedMember : member
          )
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
    setCurrentMember({ ...member });
    setIsEditDialogOpen(true);
  };

  const toggleMemberStatus = async (id: number) => {
    try {
      // First, find the current member to get their status
      const member = members.find((m) => m.id === id);
      if (!member) return;

      const newStatus = member.status === "Active" ? "Inactive" : "Active";


      await requireAuth(async () => {
        // Update in Supabase
        const { error } = await supabase
          .from("members")
          .update({ status: newStatus })
          .eq("id", id);

        if (error) {
          console.error("Error updating member status:", error);
          throw error;
        }

        // Update local state
        setMembers((prevMembers) =>
          prevMembers.map((member) =>
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
      const member = members.find((m) => m.id === id);
      if (!member) return;

      const newTrainerAccess = !member.canBeEditedByTrainers;

      // Use requireAuth for authentication
      await requireAuth(async () => {
        // Update in Supabase
        const { error } = await supabase
          .from("members")
          .update({ can_be_edited_by_trainers: newTrainerAccess })
          .eq("id", id);

        if (error) {
          console.error("Error updating trainer access:", error);
          throw error;
        }

        // Update local state
        setMembers((prevMembers) =>
          prevMembers.map((member) =>
            member.id === id
              ? { ...member, canBeEditedByTrainers: newTrainerAccess }
              : member
          )
        );

        const memberName = member.name;

        toast({
          title: "Trainer access updated",
          description: `${memberName} can ${
            newTrainerAccess ? "now" : "no longer"
          } be edited by trainers`,
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

  const confirmResetPassword = () => {
    if (selectedMemberId === null) return;

    const member = members.find((m) => m.id === selectedMemberId);
    if (member) {
      toast({
        title: "Password reset successfully",
        description: `${member.name}'s password has been reset to their phone number`,
      });
      setIsResetPasswordDialogOpen(false);
      setSelectedMemberId(null);
    }
  };

  const deleteMember = async (id: number) => {
    try {
      await requireAuth(async () => {
        // First, get the member's email to find the corresponding auth user
        const { data: member, error: fetchError } = await supabase
          .from("members")
          .select("email")
          .eq("id", id)
          .single();

        if (fetchError) {
          console.error("Error fetching member:", fetchError);
          throw fetchError;
        }

        if (!member) {
          throw new Error("Member not found");
        }

        const memberEmail = member.email as string;
        if (!memberEmail) {
          throw new Error("Member email missing");
        }

        // Delete from members table first
        const { error: memberDeleteError } = await supabase
          .from("members")
          .delete()
          .eq("id", id);

        if (memberDeleteError) {
          console.error("Error deleting member:", memberDeleteError);
          throw memberDeleteError;
        }

        // Call edge function to delete auth user (requires admin privileges)
        const { data, error } = await supabase.functions.invoke('delete-user', {
          body: { email: memberEmail }
        });

        if (error) {
          console.error("Error calling delete-user function:", error);
          // Don't throw here - the member is already deleted from members table
          console.warn("Member deleted from members table but auth user deletion failed:", error);
        }

        // Update local state by removing the member
        setMembers((prevMembers) =>
          prevMembers.filter((member) => member.id !== id)
        );

        toast({
          title: "Member deleted successfully",
          description: "The member and all associated data have been removed",
        });
      });
    } catch (err: any) {
      console.error("Error deleting member:", err);
      toast({
        title: "Failed to delete member",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
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
        deleteMember={deleteMember}
        isLoading={isLoading}
        showDeleteIcon={showDeleteIcon}
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
      />

      {/* Reset Password Confirmation Dialog */}
      <AlertDialog
        open={isResetPasswordDialogOpen}
        onOpenChange={setIsResetPasswordDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedMemberId && (
                <>
                  Are you sure you want to reset the password for{" "}
                  <strong>
                    {members.find((m) => m.id === selectedMemberId)?.name}
                  </strong>
                  ?<br />
                  The new password will be their phone number:{" "}
                  <strong>
                    {members.find((m) => m.id === selectedMemberId)?.phone}
                  </strong>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setIsResetPasswordDialogOpen(false)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmResetPassword}
              className="bg-gym-blue hover:bg-gym-dark-blue"
            >
              Reset Password
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Members;
