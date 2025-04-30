
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

// Mock data
const initialMembers = [
  { id: 1, name: "Sarah Johnson", email: "sarah@example.com", phone: "(555) 123-4567", membership: "Premium", sessions: 12, status: "Active" },
  { id: 2, name: "Michael Brown", email: "michael@example.com", phone: "(555) 234-5678", membership: "Basic", sessions: 4, status: "Active" },
  { id: 3, name: "Emma Wilson", email: "emma@example.com", phone: "(555) 345-6789", membership: "Standard", sessions: 8, status: "Active" },
  { id: 4, name: "James Martinez", email: "james@example.com", phone: "(555) 456-7890", membership: "Premium", sessions: 12, status: "Inactive" },
  { id: 5, name: "Olivia Taylor", email: "olivia@example.com", phone: "(555) 567-8901", membership: "Basic", sessions: 4, status: "Active" },
  { id: 6, name: "William Anderson", email: "william@example.com", phone: "(555) 678-9012", membership: "Standard", sessions: 8, status: "Active" },
  { id: 7, name: "Sophia Thomas", email: "sophia@example.com", phone: "(555) 789-0123", membership: "Premium", sessions: 12, status: "Active" },
  { id: 8, name: "Alexander Hernandez", email: "alexander@example.com", phone: "(555) 890-1234", membership: "Basic", sessions: 4, status: "Inactive" },
];

const Members = () => {
  const [members, setMembers] = useState(initialMembers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    phone: "",
    membership: "Basic",
    sessions: 4,
    status: "Active"
  });
  const { toast } = useToast();

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
      membership: "Basic",
      sessions: 4,
      status: "Active"
    });

    toast({
      title: "Member added successfully",
      description: `${newMember.name} has been added as a member`,
    });
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
                  Membership
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sessions
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
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {member.membership}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {member.sessions}
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
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No members found matching your search criteria.
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
                Membership
              </label>
              <select
                value={newMember.membership}
                onChange={(e) => {
                  const membership = e.target.value;
                  let sessions = 4;
                  if (membership === "Standard") sessions = 8;
                  if (membership === "Premium") sessions = 12;
                  setNewMember({ ...newMember, membership, sessions });
                }}
                className="col-span-3 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-gym-blue focus:border-transparent"
              >
                <option value="Basic">Basic (4 sessions)</option>
                <option value="Standard">Standard (8 sessions)</option>
                <option value="Premium">Premium (12 sessions)</option>
              </select>
            </div>
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
    </DashboardLayout>
  );
};

export default Members;
