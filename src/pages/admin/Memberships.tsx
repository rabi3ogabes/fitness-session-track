
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

// Mock data
const initialMembershipTypes = [
  { id: 1, name: "Basic", sessions: 1, price: 25, active: true, description: "Perfect for trying out our gym facilities and classes" },
  { id: 2, name: "Standard", sessions: 4, price: 80, active: true, description: "Ideal for occasional gym-goers" },
  { id: 3, name: "Premium", sessions: 12, price: 180, active: true, description: "Best value for regular attendees" },
];

const initialMembershipRequests = [
  { id: 1, member: "Sarah Johnson", email: "sarah@example.com", type: "Premium", date: "2025-04-28", status: "Pending" },
  { id: 2, member: "Michael Brown", email: "michael@example.com", type: "Basic", date: "2025-04-27", status: "Pending" },
];

const Memberships = () => {
  const [membershipTypes, setMembershipTypes] = useState(initialMembershipTypes);
  const [membershipRequests, setMembershipRequests] = useState(initialMembershipRequests);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newMembership, setNewMembership] = useState({
    name: "",
    sessions: 0,
    price: 0,
    active: true,
    description: "",
  });
  const [editMembership, setEditMembership] = useState<typeof membershipTypes[0] | null>(null);
  const { toast } = useToast();

  const handleAddMembership = () => {
    if (!newMembership.name || newMembership.sessions <= 0 || newMembership.price <= 0) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields with valid values",
        variant: "destructive",
      });
      return;
    }

    const id = Math.max(...membershipTypes.map((m) => m.id)) + 1;
    setMembershipTypes([...membershipTypes, { ...newMembership, id }]);
    setIsAddDialogOpen(false);
    setNewMembership({
      name: "",
      sessions: 0,
      price: 0,
      active: true,
      description: "",
    });

    toast({
      title: "Membership type added",
      description: `${newMembership.name} membership type has been added successfully`,
    });
  };

  const handleEditMembership = () => {
    if (!editMembership) return;

    setMembershipTypes(
      membershipTypes.map((m) =>
        m.id === editMembership.id ? editMembership : m
      )
    );
    setIsEditDialogOpen(false);
    setEditMembership(null);

    toast({
      title: "Membership type updated",
      description: "The membership type has been updated successfully",
    });
  };

  const toggleMembershipStatus = (id: number) => {
    setMembershipTypes(
      membershipTypes.map((m) =>
        m.id === id ? { ...m, active: !m.active } : m
      )
    );

    toast({
      title: "Membership status updated",
      description: "The membership type's status has been updated successfully",
    });
  };

  const handleApproveRequest = (id: number) => {
    setMembershipRequests(
      membershipRequests.map((r) =>
        r.id === id ? { ...r, status: "Approved" } : r
      )
    );

    toast({
      title: "Request approved",
      description: "The membership request has been approved successfully",
    });
  };

  const handleRejectRequest = (id: number) => {
    setMembershipRequests(
      membershipRequests.map((r) =>
        r.id === id ? { ...r, status: "Rejected" } : r
      )
    );

    toast({
      title: "Request rejected",
      description: "The membership request has been rejected",
    });
  };

  return (
    <DashboardLayout title="Membership Management">
      <div className="space-y-8">
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Membership Types</h2>
            <Button onClick={() => setIsAddDialogOpen(true)} className="bg-gym-blue hover:bg-gym-dark-blue">
              Add New Type
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
                      Sessions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
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
                  {membershipTypes.map((type) => (
                    <tr key={type.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{type.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {type.sessions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        ${type.price}
                      </td>
                      <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                        {type.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            type.active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {type.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setEditMembership(type);
                            setIsEditDialogOpen(true);
                          }}
                          className="text-gym-blue hover:text-gym-dark-blue mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleMembershipStatus(type.id)}
                          className={`${
                            type.active ? "text-red-600 hover:text-red-800" : "text-green-600 hover:text-green-800"
                          }`}
                        >
                          {type.active ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-6">Membership Requests</h2>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Request Date
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
                  {membershipRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{request.member}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {request.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {request.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {request.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            request.status === "Approved"
                              ? "bg-green-100 text-green-800"
                              : request.status === "Rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {request.status === "Pending" && (
                          <>
                            <button
                              onClick={() => handleApproveRequest(request.id)}
                              className="text-green-600 hover:text-green-800 mr-4"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectRequest(request.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}

                  {membershipRequests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No membership requests pending.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Membership Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Membership Type</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium col-span-1">
                Name*
              </label>
              <Input
                id="name"
                value={newMembership.name}
                onChange={(e) => setNewMembership({ ...newMembership, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium col-span-1">
                Sessions*
              </label>
              <Input
                id="sessions"
                type="number"
                value={newMembership.sessions || ""}
                onChange={(e) => setNewMembership({ ...newMembership, sessions: Number(e.target.value) })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium col-span-1">
                Price*
              </label>
              <Input
                id="price"
                type="number"
                value={newMembership.price || ""}
                onChange={(e) => setNewMembership({ ...newMembership, price: Number(e.target.value) })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium col-span-1">
                Description
              </label>
              <Input
                id="description"
                value={newMembership.description}
                onChange={(e) => setNewMembership({ ...newMembership, description: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMembership} className="bg-gym-blue hover:bg-gym-dark-blue">
              Add Membership
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Membership Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Membership Type</DialogTitle>
          </DialogHeader>
          {editMembership && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium col-span-1">
                  Name*
                </label>
                <Input
                  id="edit-name"
                  value={editMembership.name}
                  onChange={(e) =>
                    setEditMembership({ ...editMembership, name: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium col-span-1">
                  Sessions*
                </label>
                <Input
                  id="edit-sessions"
                  type="number"
                  value={editMembership.sessions}
                  onChange={(e) =>
                    setEditMembership({ ...editMembership, sessions: Number(e.target.value) })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium col-span-1">
                  Price*
                </label>
                <Input
                  id="edit-price"
                  type="number"
                  value={editMembership.price}
                  onChange={(e) =>
                    setEditMembership({ ...editMembership, price: Number(e.target.value) })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium col-span-1">
                  Description
                </label>
                <Input
                  id="edit-description"
                  value={editMembership.description}
                  onChange={(e) =>
                    setEditMembership({ ...editMembership, description: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditMembership} className="bg-gym-blue hover:bg-gym-dark-blue">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Memberships;
