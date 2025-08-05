import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Trash2 } from "lucide-react";

const initialMembershipTypes = [
  { id: 1, name: "Basic", sessions: 12, price: 250, active: true, description: "Perfect for trying out our gym facilities and classes" },
  { id: 2, name: "Standard", sessions: 4, price: 95, active: true, description: "Ideal for occasional gym-goers" },
  { id: 3, name: "Premium", sessions: 20, price: 350, active: true, description: "Best value for regular attendees" },
];

const initialMembershipRequests = [
  { id: 1, member: "Sarah Johnson", email: "sarah@example.com", type: "Premium", date: "2025-04-28", status: "Pending" },
  { id: 2, member: "Michael Brown", email: "michael@example.com", type: "Basic", date: "2025-04-27", status: "Pending" },
];

const Memberships = () => {
  const [membershipTypes, setMembershipTypes] = useState<typeof initialMembershipTypes>([]);
  const [membershipRequests, setMembershipRequests] = useState<typeof initialMembershipRequests>([]);
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
  const {isAdmin} =useAuth()
  useEffect(() => {
    const storedTypes = localStorage.getItem("membershipTypes");
    if (storedTypes) {
      setMembershipTypes(JSON.parse(storedTypes));
    } else {
      setMembershipTypes(initialMembershipTypes);
      // Initialize localStorage with mock data if empty
      localStorage.setItem("membershipTypes", JSON.stringify(initialMembershipTypes));
    }

    // Load membership requests
    const loadMembershipRequests = async () => {
      // Try to load from Supabase first
      try {
        const { data, error } = await supabase
          .from('membership_requests')
          .select('*');
        if (data && data.length > 0) {
          console.log("Loaded membership requests from Supabase:", data);
          setMembershipRequests(data);
          return;
        } else if (error) {
          console.error("Error loading from Supabase:", error);
        }
      } catch (err) {
        console.error("Exception when loading from Supabase:", err);
      }
      
      // Fall back to localStorage
      const storedRequests = localStorage.getItem("membershipRequests");
      if (storedRequests) {
        try {
          setMembershipRequests(JSON.parse(storedRequests));
        } catch (error) {
          console.error("Error parsing membership requests:", error);
          setMembershipRequests(initialMembershipRequests);
          localStorage.setItem("membershipRequests", JSON.stringify(initialMembershipRequests));
        }
      } else {
        setMembershipRequests(initialMembershipRequests);
        localStorage.setItem("membershipRequests", JSON.stringify(initialMembershipRequests));
      }
    };
    
    loadMembershipRequests();
  }, []);

  // Check for new membership requests in localStorage whenever the component renders
  useEffect(() => {
    const storedRequests = localStorage.getItem("membershipRequests");
    if (storedRequests) {
      try {
        const parsedRequests = JSON.parse(storedRequests);
        // Add any new requests to the existing ones
        const updatedRequests = [...membershipRequests];
        let hasNewRequests = false;
        
        parsedRequests.forEach((newRequest) => {
          const existingRequestIndex = updatedRequests.findIndex(r => 
            r.member === newRequest.member && 
            r.email === newRequest.email &&
            r.type === newRequest.type &&
            r.date === newRequest.date
          );
          
          if (existingRequestIndex === -1) {
            // Generate a new ID for the request
            const newId = updatedRequests.length > 0 
              ? Math.max(...updatedRequests.map(r => r.id)) + 1 
              : 1;
            
            updatedRequests.push({
              ...newRequest,
              id: newId,
              status: "Pending"
            });
            hasNewRequests = true;
          }
        });
        
        if (hasNewRequests) {
          setMembershipRequests(updatedRequests);
          localStorage.setItem("membershipRequests", JSON.stringify(updatedRequests));
          
          toast({
            title: "New membership requests",
            description: "You have new membership requests to review",
          });
        }
      } catch (error) {
        console.error("Error parsing pending membership requests:", error);
      }
    }
  }, [membershipRequests, toast]);

  // Update localStorage whenever membership types or requests change
  useEffect(() => {
    if (membershipTypes.length > 0) {
      localStorage.setItem("membershipTypes", JSON.stringify(membershipTypes));
    }
  }, [membershipTypes]);

  useEffect(() => {
    if (membershipRequests.length > 0) {
      localStorage.setItem("membershipRequests", JSON.stringify(membershipRequests));
    }
  }, [membershipRequests]);

  const handleAddMembership = () => {
    if (!newMembership.name || newMembership.sessions <= 0 || newMembership.price <= 0) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields with valid values",
        variant: "destructive",
      });
      return;
    }

    const id = membershipTypes.length > 0 ? Math.max(...membershipTypes.map((m) => m.id)) + 1 : 1;
    const updatedTypes = [...membershipTypes, { ...newMembership, id }];
    
    setMembershipTypes(updatedTypes);
    localStorage.setItem("membershipTypes", JSON.stringify(updatedTypes));
    
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

    const updatedTypes = membershipTypes.map((m) =>
      m.id === editMembership.id ? editMembership : m
    );
    
    setMembershipTypes(updatedTypes);
    localStorage.setItem("membershipTypes", JSON.stringify(updatedTypes));
    
    setIsEditDialogOpen(false);
    setEditMembership(null);

    toast({
      title: "Membership type updated",
      description: "The membership type has been updated successfully",
    });
  };

  const toggleMembershipStatus = (id: number) => {
    const updatedTypes = membershipTypes.map((m) =>
      m.id === id ? { ...m, active: !m.active } : m
    );
    
    setMembershipTypes(updatedTypes);
    localStorage.setItem("membershipTypes", JSON.stringify(updatedTypes));

    toast({
      title: "Membership status updated",
      description: "The membership type's status has been updated successfully",
    });
  };

  const handleDeleteMembership = (id: number) => {
    const membershipToDelete = membershipTypes.find(m => m.id === id);
    if (!membershipToDelete) return;

    if (window.confirm(`Are you sure you want to delete the "${membershipToDelete.name}" membership type? This action cannot be undone.`)) {
      const updatedTypes = membershipTypes.filter(m => m.id !== id);
      
      setMembershipTypes(updatedTypes);
      localStorage.setItem("membershipTypes", JSON.stringify(updatedTypes));

      toast({
        title: "Membership type deleted",
        description: `The "${membershipToDelete.name}" membership type has been deleted successfully`,
      });
    }
  };

const handleApproveRequest = async (id: number) => {
  const request = membershipRequests.find(r => r.id === id);
  if (!request) return;
  
  const membershipType = membershipTypes.find(m => m.name === request.type);
  if (!membershipType) {
    toast({
      title: "Error",
      description: `Couldn't find membership type ${request.type}`,
      variant: "destructive"
    });
    return;
  }
  const updatedRequests = membershipRequests.map((r) =>
    r.id === id ? { ...r, status: "Approved" } : r
  );
  
  setMembershipRequests(updatedRequests);
  localStorage.setItem("membershipRequests", JSON.stringify(updatedRequests));
  
  try {
    await supabase
      .from('membership_requests')
      .update({ status: "Approved" })
      .eq('id', id);
  } catch (err) {
    console.error("Error updating request in Supabase:", err);
  }
  
  try {
    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('email', request.email)
      .single();
      
    if (memberData) {
      // Member exists, update their sessions
      const currentSessions = memberData.remaining_sessions || 0;
      const newSessions = currentSessions + membershipType.sessions;
      
      // Calculate total sessions - either use existing total or start fresh
      const currentTotalSessions = memberData.total_sessions || 0;
      const newTotalSessions = currentTotalSessions + membershipType.sessions;
      await supabase
        .from('members')
        .update({ 
          remaining_sessions: newSessions,
          membership: request.type,
          total_sessions: newTotalSessions,  
          sessions: newTotalSessions       
        })
        .eq('id', memberData.id);
        
      console.log(`Added ${membershipType.sessions} sessions to user ${request.member}`);
    } else if (memberError) {
      console.error("Error finding member:", memberError);
    }
  } catch (err) {
    console.error("Error updating member sessions in Supabase:", err);
  }
  
  const today = new Date().toISOString().split('T')[0];
  try {
    await supabase
      .from('payments')
      .insert([{
        member: request.member,
        date: today,
        amount: membershipType.price,
        membership: request.type,
        status: "Successful"
      }]);
  } catch (err) {
    console.error("Error creating payment record:", err);
  }

  toast({
    title: "Request approved",
    description: `The membership request has been approved successfully. ${membershipType.sessions} sessions have been added to ${request.member}'s account.`,
  });
};

  const handleRejectRequest = async (id: number) => {
    const updatedRequests = membershipRequests.map((r) =>
      r.id === id ? { ...r, status: "Rejected" } : r
    );
    
    setMembershipRequests(updatedRequests);
    localStorage.setItem("membershipRequests", JSON.stringify(updatedRequests));
    
    // Try to update in Supabase if possible
    try {
      await supabase
        .from('membership_requests')
        .update({ status: "Rejected" })
        .eq('id', id);
    } catch (err) {
      console.error("Error updating request in Supabase:", err);
    }

    toast({
      title: "Request rejected",
      description: "The membership request has been rejected",
    });
  };
  return (
    <DashboardLayout title="Membership Management">
      <div className="space-y-8">
        {isAdmin && <div>
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
                        QAR {type.price}
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
                          className={`mr-4 ${
                            type.active ? "text-red-600 hover:text-red-800" : "text-green-600 hover:text-green-800"
                          }`}
                        >
                          {type.active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDeleteMembership(type.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete membership type"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>}
       

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
                      Sessions
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
                  {membershipRequests.map((request) => {
                    const membershipType = membershipTypes.find(m => m.name === request.type);
                    const sessionCount = membershipType ? membershipType.sessions : 'N/A';
                    
                    return (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{request.member}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {request.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {sessionCount}
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
                    );
                  })}

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
