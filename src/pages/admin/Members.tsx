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
import { supabase } from "@/integrations/supabase/client";
import { requireAuth } from "@/integrations/supabase/helpers";

// Components
import MemberSearch from "./components/members/MemberSearch";
import MemberTable from "./components/members/MemberTable";
import AddMemberDialog from "./components/members/AddMemberDialog";
import EditMemberDialog from "./components/members/EditMemberDialog";
import MemberDetailsDialog from "./components/members/MemberDetailsDialog";

// Types
import { Member, PaymentHistoryData } from "./components/members/types";
import { useAuth } from "@/context/AuthContext";

const Members = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [showDeleteIcon, setShowDeleteIcon] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'box' | 'grid'>('box');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
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
          const { data, error } = await supabase.from("members").select("*").is("deleted_at", null).not("email", "in", "(admin@gym.com,trainer@gym.com)").order("created_at", { ascending: false });

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
            countCredit: member.count_credit !== false,
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
          count_credit: editedMember.countCredit !== false,
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

  const handleMemberClick = (member: Member) => {
    setSelectedMember(member);
    setIsDetailsDialogOpen(true);
  };

  const adjustSessions = async (id: number, delta: number) => {
    try {
      const member = members.find((m) => m.id === id);
      if (!member) return;
      const newSessions = Math.max(0, (member.remainingSessions || 0) + delta);
      if (newSessions === member.remainingSessions) return;

      await requireAuth(async () => {
        const previousSessions = member.remainingSessions || 0;
        const { error } = await supabase
          .from("members")
          .update({ remaining_sessions: newSessions })
          .eq("id", id);
        if (error) throw error;

        // Log the change in session_history (best-effort; don't block UI on failure)
        const { data: authData } = await supabase.auth.getUser();
        const changedByUserId = authData?.user?.id ?? null;
        const changedByName =
          (authData?.user?.user_metadata as any)?.name ||
          authData?.user?.email ||
          null;

        const { error: historyError } = await supabase
          .from("session_history")
          .insert({
            member_id: id,
            member_name: member.name,
            delta,
            previous_sessions: previousSessions,
            new_sessions: newSessions,
            reason: delta > 0 ? "Admin added session" : "Admin removed session",
            changed_by_user_id: changedByUserId,
            changed_by_name: changedByName,
          });
        if (historyError) {
          console.error("Failed to log session history:", historyError);
        }

        setMembers((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, remainingSessions: newSessions } : m
          )
        );

        toast({
          title: delta > 0 ? "Session added" : "Session removed",
          description: `${member.name} now has ${newSessions} session${newSessions === 1 ? "" : "s"}`,
        });
      });
    } catch (err: any) {
      console.error("Error adjusting sessions:", err);
      toast({
        title: "Failed to update sessions",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
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

  const toggleCountCredit = async (id: number) => {
    try {
      const member = members.find((m) => m.id === id);
      if (!member) return;
      const newValue = !(member.countCredit !== false);

      await requireAuth(async () => {
        const { error } = await supabase
          .from("members")
          .update({ count_credit: newValue })
          .eq("id", id);
        if (error) throw error;

        setMembers((prev) =>
          prev.map((m) => (m.id === id ? { ...m, countCredit: newValue } : m))
        );

        toast({
          title: "Credit tracking updated",
          description: `${member.name}: credit counting is now ${newValue ? "ON" : "OFF"}`,
        });
      });
    } catch (err: any) {
      console.error("Error toggling count_credit:", err);
      toast({
        title: "Failed to update credit tracking",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const openResetPasswordDialog = (id: number) => {
    setSelectedMemberId(id);
    setIsResetPasswordDialogOpen(true);
  };

  const confirmResetPassword = async () => {
    if (selectedMemberId === null) return;

    const member = members.find((m) => m.id === selectedMemberId);
    if (!member) return;

    if (!member.phone) {
      toast({
        title: "Error",
        description: "This member has no phone number set. Cannot reset password.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('reset-member-password', {
        body: { email: member.email, newPassword: member.phone },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Password reset successfully",
        description: `${member.name}'s password has been reset to their phone number`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to reset password",
        description: error.message || "An error occurred while resetting the password",
        variant: "destructive",
      });
    } finally {
      setIsResetPasswordDialogOpen(false);
      setSelectedMemberId(null);
    }
  };

  const deleteMember = async (id: number) => {
    try {
      await requireAuth(async () => {
        // Soft-delete: hide the member but keep the record so it can be restored
        const { error: softDeleteError } = await supabase
          .from("members")
          .update({ deleted_at: new Date().toISOString() } as any)
          .eq("id", id);

        if (softDeleteError) {
          console.error("Error soft-deleting member:", softDeleteError);
          throw softDeleteError;
        }

        // Update local state by removing the member from the visible list
        setMembers((prevMembers) =>
          prevMembers.filter((member) => member.id !== id)
        );

        toast({
          title: "Member hidden successfully",
          description: "The member has been hidden. You can restore them anytime from Settings → Deleted Members.",
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
        viewMode={viewMode}
        onViewModeChange={setViewMode}
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
        onMemberClick={handleMemberClick}
        viewMode={viewMode}
        adjustSessions={adjustSessions}
        toggleCountCredit={toggleCountCredit}
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

      <MemberDetailsDialog
        member={selectedMember}
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
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
