import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Clock, CheckCircle, XCircle, Check, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";

interface BalanceRequest {
  id: number;
  member: string;
  email: string;
  sessions: number;
  type: string;
  status: string;
  created_at: string;
  date: string;
  member_name?: string;
  member_phone?: string;
  member_gender?: string;
}

const BalanceRequestsWidget: React.FC = () => {
  const [balanceRequests, setBalanceRequests] = useState<BalanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    const fetchBalanceRequests = async () => {
      try {
        let query = supabase
          .from('membership_requests')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        // Non-admin users can only see their own requests
        if (!isAdmin && user?.email) {
          query = query.eq('email', user.email);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Enrich with member data
        const enrichedRequests = await Promise.all(
          (data || []).map(async (request) => {
            const { data: memberData } = await supabase
              .from('members')
              .select('name, phone, gender')
              .eq('email', request.email)
              .single();

            return {
              ...request,
              member_name: memberData?.name || request.member,
              member_phone: memberData?.phone,
              member_gender: memberData?.gender
            };
          })
        );

        setBalanceRequests(enrichedRequests);
      } catch (error) {
        console.error('Error fetching balance requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBalanceRequests();

    // Set up real-time subscription
    const channel = supabase
      .channel('membership_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'membership_requests'
        },
        () => {
          fetchBalanceRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.email, isAdmin]);

  const getGenderIconColor = (gender: string | undefined) => {
    switch (gender?.toLowerCase()) {
      case 'male':
        return 'text-blue-600';
      case 'female':
        return 'text-pink-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "approved":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>;
      case "rejected":
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleApproveRequest = async (requestId: number, memberEmail: string, requestedSessions: number, memberName: string) => {
    try {
      // Update local state immediately to show the change
      setBalanceRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: "Approved" }
            : req
        )
      );

      // Update the request status to "Approved" in the database
      const { error: updateError } = await supabase
        .from('membership_requests')
        .update({ status: 'Approved' })
        .eq('id', requestId);

      if (updateError) {
        console.error('Error updating request status:', updateError);
        throw updateError;
      }

      // Get member data to update sessions
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('email', memberEmail)
        .single();

      if (memberData) {
        // Calculate new balance
        const currentSessions = memberData.remaining_sessions || 0;
        const newBalance = currentSessions + requestedSessions;

        // Update member's remaining sessions
        const { error: memberUpdateError } = await supabase
          .from('members')
          .update({ 
            remaining_sessions: newBalance,
            total_sessions: (memberData.total_sessions || 0) + requestedSessions
          })
          .eq('id', memberData.id);

        if (memberUpdateError) {
          console.error('Error updating member sessions:', memberUpdateError);
          throw memberUpdateError;
        }

        console.log(`Updated ${memberName}'s balance: ${currentSessions} → ${newBalance} sessions`);

        // Send email notification
        try {
          await supabase.from('notification_logs').insert({
            notification_type: 'balance_approval',
            recipient_email: memberEmail,
            user_email: memberEmail,
            user_name: memberName,
            subject: 'Session Balance Request Approved',
            status: 'pending'
          });
          console.log('Email notification queued for balance approval');
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
        }

        // Update user's profile with the phone number from member data  
        if (memberData?.phone) {
          // Find the user by email to get their user ID
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', memberEmail)
            .single();

          if (!userError && userData) {
            const { error: profileUpdateError } = await supabase
              .from('profiles')
              .update({
                phone_number: memberData.phone,
                name: memberName,
              })
              .eq('id', userData.id);

            if (profileUpdateError) {
              console.error("Error updating profile:", profileUpdateError);
            } else {
              console.log("Profile updated successfully");
            }
          }
        }

        toast({
          title: "Success",
          description: `Request approved! ${requestedSessions} sessions added to ${memberName}'s account.`,
        });
      } else if (memberError) {
        console.error('Error finding member:', memberError);
        throw memberError;
      }
    } catch (error) {
      console.error("Error approving request:", error);
      toast({
        title: "Error",
        description: "Failed to approve request. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Session Balance Requests</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Session Balance Requests
        </h2>
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          {balanceRequests.filter(req => req.status.toLowerCase() === "pending").length} Pending
        </Badge>
      </div>

      {balanceRequests.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>No balance requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {balanceRequests.map((request) => (
            <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(request.status)}
                    <Users className={`h-4 w-4 ${getGenderIconColor(request.member_gender)}`} />
                  </div>
                  
                  <div>
                    <div className="font-medium text-gray-900">
                      {request.member}
                    </div>
                    <div className="text-sm text-gray-600">
                      {request.email}
                    </div>
                    <div className="text-sm text-gray-500">
                      Requesting {request.sessions} sessions
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {getStatusBadge(request.status)}
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-400">
                  Requested: {format(new Date(request.created_at), 'MMM d, yyyy HH:mm')}
                </div>
                
                {/* Only admins can approve requests */}
                {isAdmin && request.status.toLowerCase() === "pending" && (
                  <Button
                    size="sm"
                    onClick={() => handleApproveRequest(request.id, request.email, request.sessions, request.member)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Approve
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {balanceRequests.length > 0 && (
        <div className="mt-4 text-center">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.href = '/admin/memberships'}
          >
            View More
          </Button>
        </div>
      )}
    </div>
  );
};

export default BalanceRequestsWidget;