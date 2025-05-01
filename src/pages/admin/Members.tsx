
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";

// Components
import MemberSearch from "./components/members/MemberSearch";
import MemberTable from "./components/members/MemberTable";
import AddMemberDialog from "./components/members/AddMemberDialog";
import EditMemberDialog from "./components/members/EditMemberDialog";

// Types
import { Member, PaymentHistoryData } from "./components/members/types";

// Mock data
const initialMembers: Member[] = [
  { id: 1, name: "Sarah Johnson", email: "sarah@example.com", phone: "(555) 123-4567", membership: "Premium", sessions: 12, remainingSessions: 8, status: "Active", birthday: "1990-05-15", canBeEditedByTrainers: false, gender: "Female" },
  { id: 2, name: "Michael Brown", email: "michael@example.com", phone: "(555) 234-5678", membership: "Basic", sessions: 4, remainingSessions: 2, status: "Active", birthday: "1985-07-22", canBeEditedByTrainers: true, gender: "Male" },
  { id: 3, name: "Emma Wilson", email: "emma@example.com", phone: "(555) 345-6789", membership: "Standard", sessions: 8, remainingSessions: 5, status: "Active", birthday: "1992-03-10", canBeEditedByTrainers: false, gender: "Female" },
  { id: 4, name: "James Martinez", email: "james@example.com", phone: "(555) 456-7890", membership: "Premium", sessions: 12, remainingSessions: 9, status: "Inactive", birthday: "1988-11-05", canBeEditedByTrainers: true, gender: "Male" },
  { id: 5, name: "Olivia Taylor", email: "olivia@example.com", phone: "(555) 567-8901", membership: "Basic", sessions: 4, remainingSessions: 0, status: "Active", birthday: "1995-01-30", canBeEditedByTrainers: false, gender: "Female" },
  { id: 6, name: "William Anderson", email: "william@example.com", phone: "(555) 678-9012", membership: "Standard", sessions: 8, remainingSessions: 6, status: "Active", birthday: "1987-09-17", canBeEditedByTrainers: true, gender: "Male" },
  { id: 7, name: "Sophia Thomas", email: "sophia@example.com", phone: "(555) 789-0123", membership: "Premium", sessions: 12, remainingSessions: 10, status: "Active", birthday: "1993-12-25", canBeEditedByTrainers: false, gender: "Female" },
  { id: 8, name: "Alexander Hernandez", email: "alexander@example.com", phone: "(555) 890-1234", membership: "Basic", sessions: 4, remainingSessions: 1, status: "Inactive", birthday: "1991-08-12", canBeEditedByTrainers: true, gender: "Male" },
];

// Mock payment history data
const paymentHistoryData: PaymentHistoryData = {
  1: [
    { id: 1, date: "2025-04-15", amount: 180, description: "Premium Membership - Monthly", status: "Paid" },
    { id: 2, date: "2025-03-15", amount: 180, description: "Premium Membership - Monthly", status: "Paid" },
    { id: 3, date: "2025-02-15", amount: 180, description: "Premium Membership - Monthly", status: "Paid" },
  ],
  2: [
    { id: 1, date: "2025-04-10", amount: 25, description: "Basic Membership - Monthly", status: "Paid" },
    { id: 2, date: "2025-03-10", amount: 25, description: "Basic Membership - Monthly", status: "Paid" },
  ],
  3: [
    { id: 1, date: "2025-04-05", amount: 80, description: "Standard Membership - Monthly", status: "Paid" },
    { id: 2, date: "2025-03-05", amount: 80, description: "Standard Membership - Monthly", status: "Paid" },
    { id: 3, date: "2025-02-05", amount: 80, description: "Standard Membership - Monthly", status: "Paid" },
  ]
};

const Members = () => {
  // Use localStorage to persist members data across page refreshes
  const savedMembers = localStorage.getItem("gymMembers");
  const [members, setMembers] = useState<Member[]>(
    savedMembers ? JSON.parse(savedMembers) : initialMembers
  );
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const { toast } = useToast();

  // Update localStorage whenever members change
  const updateMembers = (updatedMembers: Member[]) => {
    setMembers(updatedMembers);
    localStorage.setItem("gymMembers", JSON.stringify(updatedMembers));
  };

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddMember = (newMember: Member) => {
    if (!newMember.name || !newMember.email || !newMember.phone) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const id = Math.max(...members.map((m) => m.id), 0) + 1;
    const updatedMembers = [...members, { ...newMember, id }];
    updateMembers(updatedMembers);
    setIsAddDialogOpen(false);

    toast({
      title: "Member added successfully",
      description: `${newMember.name} has been added as a member`,
    });
  };

  const handleEditMember = (editedMember: Member) => {
    if (!editedMember.name || !editedMember.email || !editedMember.phone) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const updatedMembers = members.map((member) =>
      member.id === editedMember.id ? editedMember : member
    );
    updateMembers(updatedMembers);
    setIsEditDialogOpen(false);
    
    toast({
      title: "Member updated successfully",
      description: `${editedMember.name}'s information has been updated`,
    });
  };

  const openEditDialog = (member: Member) => {
    setCurrentMember({...member});
    setIsEditDialogOpen(true);
  };

  const toggleMemberStatus = (id: number) => {
    const updatedMembers = members.map((member) =>
      member.id === id
        ? {
            ...member,
            status: member.status === "Active" ? "Inactive" : "Active",
          }
        : member
    );
    updateMembers(updatedMembers);

    toast({
      title: "Member status updated",
      description: "The member's status has been updated successfully",
    });
  };

  const toggleTrainerEditAccess = (id: number) => {
    const updatedMembers = members.map((member) =>
      member.id === id
        ? {
            ...member,
            canBeEditedByTrainers: !member.canBeEditedByTrainers,
          }
        : member
    );
    updateMembers(updatedMembers);

    const memberName = members.find(m => m.id === id)?.name;
    const newStatus = !members.find(m => m.id === id)?.canBeEditedByTrainers;

    toast({
      title: "Trainer access updated",
      description: `${memberName} can ${newStatus ? 'now' : 'no longer'} be edited by trainers`,
    });
  };
  
  const resetMemberPassword = (id: number) => {
    // In a real application, this would call an API to reset the password
    const member = members.find(m => m.id === id);
    if (member) {
      toast({
        title: "Password reset successfully",
        description: `${member.name}'s password has been reset to their phone number`,
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
        resetPassword={resetMemberPassword}
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
    </DashboardLayout>
  );
};

export default Members;
