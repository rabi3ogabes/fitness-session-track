import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { CreditCard, Clock, User, CheckCircle, XCircle, Check, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface BalanceRequest {
  id: number;
  member: string;
  email: string;
  sessions: number;
  type: string;
  status: string;
  created_at: string;
  member_gender?: string;
  member_phone?: string;
}

const BalanceRequestsWidget = () => {
  const [balanceRequests, setBalanceRequests] = useState<BalanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const getGenderIconColor = (gender?: string) => {
    if (gender === "Male") return "text-blue-600";
    if (gender === "Female") return "text-pink-600";
    return "text-gray-600"; // default color for unknown gender
  };

  useEffect(() => {
    const fetchBalanceRequests = async () => {
      if (!isAdmin && !user?.email) return;
      
      try {
        let query = supabase
          .from("membership_requests")
          .select("*");
        
        // If not admin, filter by user email
        if (!isAdmin && user?.email) {
          query = query.eq("email", user.email);
        }
        
        const { data, error } = await query
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) throw error;
        
        // Get member gender and phone separately to avoid filtering out requests
        const requestsWithMemberData = await Promise.all(
          (data || []).map(async (request) => {
            const { data: memberData } = await supabase
              .from("members")
              .select("gender, phone")
              .eq("email", request.email)
              .single();
            
            return {
              ...request,
              member_gender: memberData?.gender,
              member_phone: memberData?.phone
            };
          })
        );
        
        setBalanceRequests(requestsWithMemberData);
      } catch (error) {
        console.error("Error fetching balance requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBalanceRequests();

    if (!isAdmin && !user?.email) return;

    // Set up real-time subscription for new requests
    const channel = supabase
      .channel("balance-requests")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "membership_requests",
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

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
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
      // Update the request status to approved
      const { error: updateError } = await supabase
        .from("membership_requests")
        .update({ status: "Approved" })
        .eq("id", requestId);

      if (updateError) throw updateError;

      // Update the member's session balance
      // First get the current balance and phone number
      const { data: memberData, error: fetchError } = await supabase
        .from("members")
        .select("remaining_sessions, phone")
        .eq("email", memberEmail)
        .single();

      if (fetchError) throw fetchError;

      if (memberData) {
        const newBalance = (memberData.remaining_sessions || 0) + requestedSessions;
        const { error: updateMemberError } = await supabase
          .from("members")
          .update({ remaining_sessions: newBalance })
          .eq("email", memberEmail);

        if (updateMemberError) throw updateMemberError;

        // Send WhatsApp notification to admin about approval
        try {
          const whatsappSettings = localStorage.getItem("whatsappSettings");
          if (whatsappSettings) {
            const settings = JSON.parse(whatsappSettings);
            if (settings.enabled && settings.balance_approval_notifications && 
                settings.instance_id && settings.api_token && settings.phone_numbers) {
              
              const phoneNumbers = settings.phone_numbers.split(',').map(num => num.trim());
              
              const message = `✅ Session balance approved!

Member: ${memberName}
Email: ${memberEmail}
Sessions Added: ${requestedSessions}
New Balance: ${newBalance} sessions

Balance request has been approved and sessions added to member's account.`;

              console.log('Sending balance approval WhatsApp notification...');
              await supabase.functions.invoke('send-whatsapp-notification', {
                body: {
                  userName: memberName,
                  userEmail: memberEmail,
                  phoneNumbers: phoneNumbers,
                  apiToken: settings.api_token,
                  instanceId: settings.instance_id,
                  customMessage: message
                }
              });
            }

            // Send WhatsApp notification to the member about their approved request
            if (settings.enabled && settings.instance_id && settings.api_token && memberData.phone) {
              // Format phone number for WhatsApp (add +971 prefix for UAE numbers)
              const formattedPhone = memberData.phone.startsWith('+971') 
                ? memberData.phone 
                : `+971${memberData.phone}`;
              
              const memberMessage = `🎉 Great news! Your session balance request has been approved!

✅ ${requestedSessions} sessions have been added to your account
💪 Your new balance: ${newBalance} sessions

You can now book your classes. Thank you for choosing our gym!`;

              console.log('Sending approval notification to member...');
              await supabase.functions.invoke('send-whatsapp-notification', {
                body: {
                  userName: memberName,
                  userEmail: memberEmail,
                  phoneNumbers: [formattedPhone],
                  apiToken: settings.api_token,
                  instanceId: settings.instance_id,
                  customMessage: memberMessage
                }
              });
            }
          }
        } catch (whatsappError) {
          console.error("Failed to send approval WhatsApp notification:", whatsappError);
          // Don't fail the approval if WhatsApp fails
        }
      }

      toast({
        title: "Request approved",
        description: `${requestedSessions} sessions added to member's balance`,
      });

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
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-purple-600" />
          {isAdmin ? "Session Balance Requests" : "My Session Balance Requests"}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/admin/memberships")}
          className="flex items-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          View More
        </Button>
      </div>
      {balanceRequests.length > 0 ? (
        <div className="space-y-3">
          {balanceRequests.map((request) => (
            <div
              key={request.id}
              className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <User className={`h-4 w-4 ${getGenderIconColor(request.member_gender)}`} />
                  <h3 className="font-semibold text-gray-900">{request.member}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(request.status)}
                  {getStatusBadge(request.status)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-2">
                <div>
                  <strong>Sessions Requested:</strong> {request.sessions}
                </div>
                <div>
                  <strong>Type:</strong> {request.type}
                </div>
              </div>
              
              <div className="text-sm text-gray-500 mb-2">
                <strong>Phone:</strong> {request.member_phone || 'Not provided'}
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
      ) : (
        <div className="text-center py-8 text-gray-500">
          <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No balance requests</p>
        </div>
      )}
    </div>
  );
};

export default BalanceRequestsWidget;