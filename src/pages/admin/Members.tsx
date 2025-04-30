
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

// Mock data
const initialMembers = [
  { id: 1, name: "Sarah Johnson", email: "sarah@example.com", phone: "(555) 123-4567", membership: "Premium", sessions: 12, remainingSessions: 8, status: "Active", birthday: "1990-05-15", canBeEditedByTrainers: false },
  { id: 2, name: "Michael Brown", email: "michael@example.com", phone: "(555) 234-5678", membership: "Basic", sessions: 4, remainingSessions: 2, status: "Active", birthday: "1985-07-22", canBeEditedByTrainers: true },
  { id: 3, name: "Emma Wilson", email: "emma@example.com", phone: "(555) 345-6789", membership: "Standard", sessions: 8, remainingSessions: 5, status: "Active", birthday: "1992-03-10", canBeEditedByTrainers: false },
  { id: 4, name: "James Martinez", email: "james@example.com", phone: "(555) 456-7890", membership: "Premium", sessions: 12, remainingSessions: 9, status: "Inactive", birthday: "1988-11-05", canBeEditedByTrainers: true },
  { id: 5, name: "Olivia Taylor", email: "olivia@example.com", phone: "(555) 567-8901", membership: "Basic", sessions: 4, remainingSessions: 0, status: "Active", birthday: "1995-01-30", canBeEditedByTrainers: false },
  { id: 6, name: "William Anderson", email: "william@example.com", phone: "(555) 678-9012", membership: "Standard", sessions: 8, remainingSessions: 6, status: "Active", birthday: "1987-09-17", canBeEditedByTrainers: true },
  { id: 7, name: "Sophia Thomas", email: "sophia@example.com", phone: "(555) 789-0123", membership: "Premium", sessions: 12, remainingSessions: 10, status: "Active", birthday: "1993-12-25", canBeEditedByTrainers: false },
  { id: 8, name: "Alexander Hernandez", email: "alexander@example.com", phone: "(555) 890-1234", membership: "Basic", sessions: 4, remainingSessions: 1, status: "Inactive", canBeEditedByTrainers: true },
];

// Mock payment history data
const paymentHistoryData = {
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
  const [members, setMembers] = useState(initialMembers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState("personal");
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    phone: "",
    birthday: "",
    membership: "Basic",
    sessions: 4,
    remainingSessions: 4,
    status: "Active",
    canBeEditedByTrainers: true
  });
  const { toast } = useToast();
  const { isAdmin, isTrainer } = useAuth();

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddMember = () => {
    if (!newMember.name || !newMember.email) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const id = Math.max(...members.map((m) => m.id)) + 1;
    setMembers([...members, { ...newMember, id }]);
    setIsAddDialogOpen(false);
    setNewMember({
      name: "",
      email: "",
      phone: "",
      birthday: "",
      membership: "Basic",
      sessions: 4,
      remainingSessions: 4,
      status: "Active",
      canBeEditedByTrainers: false
    });

    toast({
      title: "Member added successfully",
      description: `${newMember.name} has been added as a member`,
    });
  };

  const handleEditMember = () => {
    if (!currentMember.name || !currentMember.email) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setMembers(
      members.map((member) =>
        member.id === currentMember.id ? currentMember : member
      )
    );
    setIsEditDialogOpen(false);
    
    toast({
      title: "Member updated successfully",
      description: `${currentMember.name}'s information has been updated`,
    });
  };

  const openEditDialog = (member: any) => {
    setCurrentMember({...member});
    setIsEditDialogOpen(true);
    setSelectedTab("personal");
  };

  const toggleMemberStatus = (id: number) => {
    setMembers(
      members.map((member) =>
        member.id === id
          ? {
              ...member,
              status: member.status === "Active" ? "Inactive" : "Active",
            }
          : member
      )
    );

    toast({
      title: "Member status updated",
      description: "The member's status has been updated successfully",
    });
  };

  const toggleTrainerEditAccess = (id: number) => {
    setMembers(
      members.map((member) =>
        member.id === id
          ? {
              ...member,
              canBeEditedByTrainers: !member.canBeEditedByTrainers,
            }
          : member
      )
    );

    const memberName = members.find(m => m.id === id)?.name;
    const newStatus = !members.find(m => m.id === id)?.canBeEditedByTrainers;

    toast({
      title: "Trainer access updated",
      description: `${memberName} can ${newStatus ? 'now' : 'no longer'} be edited by trainers`,
    });
  };

  // Check if user has edit permissions for this member
  const canEditMember = (member: any) => {
    return isAdmin || (isTrainer && member.canBeEditedByTrainers);
  };

  return (
    <DashboardLayout title="Member Management">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="w-full sm:w-auto">
          <Input
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sm:w-80"
          />
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto bg-gym-blue hover:bg-gym-dark-blue">
          Add New Member
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sessions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trainer Edit
                  </th>
                )}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{member.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-500">{member.email}</div>
                    <div className="text-gray-500">{member.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {member.remainingSessions}/{member.sessions}
                    </div>
                    <div className="text-xs text-gray-500">
                      {member.membership} Plan
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        member.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {member.status}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Switch 
                        checked={member.canBeEditedByTrainers}
                        onCheckedChange={() => toggleTrainerEditAccess(member.id)}
                      />
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    {canEditMember(member) && (
                      <button
                        onClick={() => openEditDialog(member)}
                        className="text-gym-blue hover:text-gym-dark-blue mr-2"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => toggleMemberStatus(member.id)}
                      className="text-gym-blue hover:text-gym-dark-blue"
                    >
                      {member.status === "Active" ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-4 text-center text-gray-500">
                    No members found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium col-span-1">
                Name*
              </label>
              <Input
                id="name"
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium col-span-1">
                Email*
              </label>
              <Input
                id="email"
                type="email"
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium col-span-1">
                Phone
              </label>
              <Input
                id="phone"
                value={newMember.phone}
                onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium col-span-1">
                Birthday
              </label>
              <Input
                id="birthday"
                type="date"
                value={newMember.birthday}
                onChange={(e) => setNewMember({ ...newMember, birthday: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium col-span-1">
                Membership
              </label>
              <select
                value={newMember.membership}
                onChange={(e) => {
                  const membership = e.target.value;
                  let sessions = 4;
                  if (membership === "Standard") sessions = 8;
                  if (membership === "Premium") sessions = 12;
                  setNewMember({ ...newMember, membership, sessions, remainingSessions: sessions });
                }}
                className="col-span-3 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-gym-blue focus:border-transparent"
              >
                <option value="Basic">Basic (4 sessions)</option>
                <option value="Standard">Standard (8 sessions)</option>
                <option value="Premium">Premium (12 sessions)</option>
              </select>
            </div>
            {isAdmin && (
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium col-span-1">
                  Trainer Edit
                </label>
                <div className="col-span-3 flex items-center">
                  <Switch 
                    checked={newMember.canBeEditedByTrainers}
                    onCheckedChange={() => setNewMember({ ...newMember, canBeEditedByTrainers: !newMember.canBeEditedByTrainers })}
                  />
                  <span className="ml-2 text-sm text-gray-500">Allow trainers to edit this member</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMember} className="bg-gym-blue hover:bg-gym-dark-blue">
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
          </DialogHeader>
          {currentMember && (
            <div className="space-y-4">
              <Tabs 
                value={selectedTab} 
                onValueChange={setSelectedTab} 
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="personal">Personal Info</TabsTrigger>
                  <TabsTrigger value="membership">Membership</TabsTrigger>
                  {(isAdmin || isTrainer) && (
                    <TabsTrigger value="payments">Payment History</TabsTrigger>
                  )}
                </TabsList>
                
                <TabsContent value="personal" className="mt-4">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label className="text-right text-sm font-medium col-span-1">
                        Name*
                      </label>
                      <Input
                        id="edit-name"
                        value={currentMember.name}
                        onChange={(e) => setCurrentMember({ ...currentMember, name: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label className="text-right text-sm font-medium col-span-1">
                        Email*
                      </label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={currentMember.email}
                        onChange={(e) => setCurrentMember({ ...currentMember, email: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label className="text-right text-sm font-medium col-span-1">
                        Phone
                      </label>
                      <Input
                        id="edit-phone"
                        value={currentMember.phone}
                        onChange={(e) => setCurrentMember({ ...currentMember, phone: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label className="text-right text-sm font-medium col-span-1">
                        Birthday
                      </label>
                      <Input
                        id="edit-birthday"
                        type="date"
                        value={currentMember.birthday}
                        onChange={(e) => setCurrentMember({ ...currentMember, birthday: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="membership" className="mt-4">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label className="text-right text-sm font-medium col-span-1">
                        Membership
                      </label>
                      <select
                        value={currentMember.membership}
                        onChange={(e) => {
                          const membership = e.target.value;
                          let sessions = 4;
                          if (membership === "Standard") sessions = 8;
                          if (membership === "Premium") sessions = 12;
                          setCurrentMember({ ...currentMember, membership, sessions });
                        }}
                        className="col-span-3 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-gym-blue focus:border-transparent"
                      >
                        <option value="Basic">Basic (4 sessions)</option>
                        <option value="Standard">Standard (8 sessions)</option>
                        <option value="Premium">Premium (12 sessions)</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label className="text-right text-sm font-medium col-span-1">
                        Remaining Sessions
                      </label>
                      <Input
                        id="edit-remaining-sessions"
                        type="number"
                        min="0"
                        max={currentMember.sessions}
                        value={currentMember.remainingSessions}
                        onChange={(e) => setCurrentMember({ 
                          ...currentMember, 
                          remainingSessions: Math.max(0, Math.min(currentMember.sessions, parseInt(e.target.value) || 0)) 
                        })}
                        className="col-span-3"
                      />
                    </div>
                    {isAdmin && (
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label className="text-right text-sm font-medium col-span-1">
                          Status
                        </label>
                        <select
                          value={currentMember.status}
                          onChange={(e) => setCurrentMember({ ...currentMember, status: e.target.value })}
                          className="col-span-3 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-gym-blue focus:border-transparent"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    )}
                    {isAdmin && (
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label className="text-right text-sm font-medium col-span-1">
                          Trainer Edit
                        </label>
                        <div className="col-span-3 flex items-center">
                          <Switch 
                            checked={currentMember.canBeEditedByTrainers}
                            onCheckedChange={() => setCurrentMember({ ...currentMember, canBeEditedByTrainers: !currentMember.canBeEditedByTrainers })}
                          />
                          <span className="ml-2 text-sm text-gray-500">Allow trainers to edit this member</span>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                {(isAdmin || isTrainer) && (
                  <TabsContent value="payments" className="mt-4">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(paymentHistoryData[currentMember.id] || []).map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell>{payment.date}</TableCell>
                              <TableCell>{payment.description}</TableCell>
                              <TableCell>${payment.amount}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                    payment.status === "Paid"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}>
                                  {payment.status}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                          {(!paymentHistoryData[currentMember.id] || paymentHistoryData[currentMember.id].length === 0) && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                                No payment history available.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditMember} className="bg-gym-blue hover:bg-gym-dark-blue">
                  Save Changes
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Members;
