import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

interface MembershipRequest {
  id: number;
  member: string;
  email: string;
  type: string;
  date: string;
  status: string;
  sessions?: number; // Optional to maintain compatibility with existing requests
  created_at?: string; // Database timestamp field
}

const initialMembershipRequests: MembershipRequest[] = [
  { id: 1, member: "Sarah Johnson", email: "sarah@example.com", type: "Premium", date: "2025-04-28", status: "Pending" },
  { id: 2, member: "Michael Brown", email: "michael@example.com", type: "Basic", date: "2025-04-27", status: "Pending" },
];

const Memberships = () => {
  const [membershipTypes, setMembershipTypes] = useState<typeof initialMembershipTypes>([]);
  const [membershipRequests, setMembershipRequests] = useState<MembershipRequest[]>([]);
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
    // Load membership types from database
    const loadMembershipTypes = async () => {
      try {
        const { data, error } = await supabase
          .from('membership_types')
          .select('*')
          .order('id', { ascending: true });
        
        if (error) {
          console.error("Error loading membership types:", error);
          return;
        }
        
        setMembershipTypes(data || []);
      } catch (err) {
        console.error("Exception when loading membership types:", err);
      }
    };

    // Load membership requests from database only
    const loadMembershipRequests = async () => {
      try {
        const { data, error } = await supabase
          .from('membership_requests')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error("Error loading from Supabase:", error);
          setMembershipRequests([]);
          return;
        }
        
        console.log("Loaded membership requests from Supabase:", data);
        setMembershipRequests(data || []);
      } catch (err) {
        console.error("Exception when loading from Supabase:", err);
        setMembershipRequests([]);
      }
    };
    
    loadMembershipTypes();
    loadMembershipRequests();

    // Set up real-time subscription for membership requests
    const channel = supabase
      .channel('membership_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'membership_requests'
        },
        (payload) => {
          console.log('Real-time change detected:', payload);
          
          if (payload.eventType === 'INSERT') {
            setMembershipRequests(prev => [payload.new as any, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setMembershipRequests(prev => 
              prev.map(request => 
                request.id === payload.new.id ? payload.new as any : request
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setMembershipRequests(prev => 
              prev.filter(request => request.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, []);


  const handleAddMembership = async () => {
    if (!newMembership.name || newMembership.sessions <= 0 || newMembership.price <= 0) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields with valid values",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('membership_types')
        .insert([{
          name: newMembership.name,
          sessions: newMembership.sessions,
          price: newMembership.price,
          active: newMembership.active,
          description: newMembership.description
        }])
        .select()
        .single();

      if (error) {
        console.error("Error adding membership type:", error);
        toast({
          title: "Error",
          description: "Failed to add membership type",
          variant: "destructive",
        });
        return;
      }

      setMembershipTypes(prev => [...prev, data]);
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
    } catch (err) {
      console.error("Exception when adding membership type:", err);
      toast({
        title: "Error",
        description: "Failed to add membership type",
        variant: "destructive",
      });
    }
  };

  const handleEditMembership = async () => {
    if (!editMembership) return;

    try {
      const { data, error } = await supabase
        .from('membership_types')
        .update({
          name: editMembership.name,
          sessions: editMembership.sessions,
          price: editMembership.price,
          active: editMembership.active,
          description: editMembership.description
        })
        .eq('id', editMembership.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating membership type:", error);
        toast({
          title: "Error",
          description: "Failed to update membership type",
          variant: "destructive",
        });
        return;
      }

      setMembershipTypes(prev => prev.map(m => m.id === editMembership.id ? data : m));
      setIsEditDialogOpen(false);
      setEditMembership(null);

      toast({
        title: "Membership type updated",
        description: "The membership type has been updated successfully",
      });
    } catch (err) {
      console.error("Exception when updating membership type:", err);
      toast({
        title: "Error",
        description: "Failed to update membership type",
        variant: "destructive",
      });
    }
  };

  const toggleMembershipStatus = async (id: number) => {
    const membership = membershipTypes.find(m => m.id === id);
    if (!membership) return;

    try {
      const { data, error } = await supabase
        .from('membership_types')
        .update({ active: !membership.active })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error("Error updating membership status:", error);
        toast({
          title: "Error",
          description: "Failed to update membership status",
          variant: "destructive",
        });
        return;
      }

      setMembershipTypes(prev => prev.map(m => m.id === id ? data : m));

      toast({
        title: "Membership status updated",
        description: "The membership type's status has been updated successfully",
      });
    } catch (err) {
      console.error("Exception when updating membership status:", err);
      toast({
        title: "Error",
        description: "Failed to update membership status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMembership = async (id: number) => {
    const membershipToDelete = membershipTypes.find(m => m.id === id);
    if (!membershipToDelete) return;

    if (window.confirm(`Are you sure you want to delete the "${membershipToDelete.name}" membership type? This action cannot be undone.`)) {
      try {
        const { error } = await supabase
          .from('membership_types')
          .delete()
          .eq('id', id);

        if (error) {
          console.error("Error deleting membership type:", error);
          toast({
            title: "Error",
            description: "Failed to delete membership type",
            variant: "destructive",
          });
          return;
        }

        setMembershipTypes(prev => prev.filter(m => m.id !== id));

        toast({
          title: "Membership type deleted",
          description: `The "${membershipToDelete.name}" membership type has been deleted successfully`,
        });
      } catch (err) {
        console.error("Exception when deleting membership type:", err);
        toast({
          title: "Error",
          description: "Failed to delete membership type",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteRequest = async (id: number) => {
    const requestToDelete = membershipRequests.find(r => r.id === id);
    if (!requestToDelete) {
      toast({
        title: "Error",
        description: "Request not found",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete the membership request from "${requestToDelete.member}"? This action cannot be undone.`)) {
      try {
        console.log('Deleting request with ID:', id);
        const { error } = await supabase
          .from('membership_requests')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Supabase delete error:', error);
          throw error;
        }

        // Remove from local state
        setMembershipRequests(prev => prev.filter(r => r.id !== id));

        toast({
          title: "Request deleted",
          description: `The membership request from "${requestToDelete.member}" has been deleted successfully`,
        });
      } catch (error) {
        console.error('Error deleting request:', error);
        toast({
          title: "Error",
          description: "Failed to delete the membership request. Please try again.",
          variant: "destructive",
        });
      }
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
  
  try {
    // Update status in database first
    const { error } = await supabase
      .from('membership_requests')
      .update({ status: "Approved" })
      .eq('id', id);
      
    if (error) throw error;
    
    // Update local state
    setMembershipRequests(prev => prev.map((r) =>
      r.id === id ? { ...r, status: "Approved" } : r
    ));
  } catch (err) {
    console.error("Error updating request in Supabase:", err);
    toast({
      title: "Error",
      description: "Failed to approve the request. Please try again.",
      variant: "destructive",
    });
    return;
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
    try {
      // Update status in database first
      const { error } = await supabase
        .from('membership_requests')
        .update({ status: "Rejected" })
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      setMembershipRequests(prev => prev.map((r) =>
        r.id === id ? { ...r, status: "Rejected" } : r
      ));

      toast({
        title: "Request rejected",
        description: "The membership request has been rejected",
      });
    } catch (err) {
      console.error("Error updating request in Supabase:", err);
      toast({
        title: "Error",
        description: "Failed to reject the request. Please try again.",
        variant: "destructive",
      });
    }
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
                  {membershipRequests
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((request) => {
                    // Use sessions from request if available, otherwise fallback to membership type lookup
                    const sessionCount = request.sessions || (() => {
                      const membershipType = membershipTypes.find(m => m.name === request.type);
                      return membershipType ? membershipType.sessions : 'N/A';
                    })();
                    
                    // Count only pending requests for this user
                    const pendingRequestsCount = membershipRequests.filter(r => 
                      r.email === request.email && r.status === 'Pending'
                    ).length;
                    
                    // Count total requests (all statuses) for display
                    const totalRequestsCount = membershipRequests.filter(r => 
                      r.email === request.email
                    ).length;
                    
                    return (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{request.member}</div>
                          <div className={`text-xs ${pendingRequestsCount >= 2 ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
                            {pendingRequestsCount}/2 pending requests
                            {pendingRequestsCount >= 2 && (
                              <span className="ml-1 text-orange-500">⚠️ Max reached</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">
                            {totalRequestsCount} total requests
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {request.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {sessionCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          <div>{request.date}</div>
                          <div className="text-xs text-gray-400">
                            {request.created_at ? new Date(request.created_at).toLocaleTimeString() : ""}
                          </div>
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
                                 className="text-red-600 hover:text-red-800 mr-4"
                               >
                                 Reject
                               </button>
                             </>
                           )}
                           <button
                             onClick={() => handleDeleteRequest(request.id)}
                             className="text-red-600 hover:text-red-800"
                             title="Delete request"
                           >
                             <Trash2 size={16} />
                           </button>
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
              <Textarea
                id="description"
                value={newMembership.description}
                onChange={(e) => setNewMembership({ ...newMembership, description: e.target.value })}
                className="col-span-3"
                rows={3}
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
                <Textarea
                  id="edit-description"
                  value={editMembership.description}
                  onChange={(e) =>
                    setEditMembership({ ...editMembership, description: e.target.value })
                  }
                  className="col-span-3"
                  rows={3}
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
