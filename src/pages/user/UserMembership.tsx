import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMembership } from "@/context/membership";
import { format, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
interface MemberShip {
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  sessions: number;
  sessionsRemaining: number;
  price: number;
  automatic: boolean;
}
const UserMembership = () => {
  const { toast } = useToast();
  const { membershipTypes } = useMembership();
  const [dbMembershipTypes, setDbMembershipTypes] = useState([]);
  const [currentUser, setCurrentUser] = useState({
    name: "Current User",
    email: "user@example.com",
  });
  const [currentMembership, setCurrentMembership] = useState<MemberShip>({
    name: "",
    type: "",
    startDate: "",
    endDate: "",
    sessions: 0,
    sessionsRemaining: 0,
    price: 0,
    automatic: false,
  });
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to format date/time in Qatar timezone
  const formatQatarDateTime = (dateString: string) => {
    try {
      // If it's a simple date string like "2025-09-09", treat it as a date
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Add time component and parse as UTC, then convert to Qatar time
        const dateWithTime = new Date(`${dateString}T12:00:00Z`);
        return formatInTimeZone(dateWithTime, 'Asia/Qatar', 'MMM dd, yyyy h:mm a');
      }
      
      // If it's already a datetime string, parse and convert
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Return original if can't parse
      }
      
      return formatInTimeZone(date, 'Asia/Qatar', 'MMM dd, yyyy h:mm a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Return original if error
    }
  };

  // Fetch membership types from database
  const fetchMembershipTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('membership_types')
        .select('*')
        .eq('active', true)
        .order('id');
      
      if (error) throw error;
      
      if (data) {
        setDbMembershipTypes(data);
      }
    } catch (error) {
      console.error('Error fetching membership types:', error);
      // Fallback to context data
      setDbMembershipTypes(membershipTypes.filter(type => type.active));
    }
  };

  const fetchAllData = async (user) => {
    setLoading(true);

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", user.id)
        .single();

      if (profile && profile.name) {
        setCurrentUser({
          name: profile.name,
          email: profile.email || user.email || "user@example.com",
        });
      } else {
        setCurrentUser({
          name: user.email?.split("@")[0] || "Current User",
          email: user.email || "user@example.com",
        });
      }

      // Get membership data
      const { data: memberData } = await supabase
        .from("members")
        .select("membership, sessions, remaining_sessions")
        .eq("email", user.email)
        .single();
      if (memberData) {
        const today = new Date();
        const oneMonthLater = new Date();
        oneMonthLater.setMonth(today.getMonth() + 1);

        setCurrentMembership({
          name: memberData.membership || "Basic",
          type: "Monthly",
          startDate: today.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
          endDate: oneMonthLater.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
          sessions: memberData.sessions || 12,
          sessionsRemaining: memberData.remaining_sessions || 0,
          price:
            dbMembershipTypes.find((p) => p.name === memberData.membership)
              ?.price || membershipTypes.find((p) => p.name === memberData.membership)
              ?.price || 250,
          automatic: true,
        });
      }

      // Collect payment history data
      let allPayments = [];

      // First get membership requests (pending payments)
      const { data: requestsData } = await supabase
        .from("membership_requests")
        .select("*")
        .eq("email", user.email)
        .order("date", { ascending: false });
      // Process membership requests
      if (requestsData && requestsData.length > 0) {
        const pendingPayments = requestsData.map((request) => {
          const plan = dbMembershipTypes.find((p) => p.name === request.type) ||
                      membershipTypes.find((p) => p.name === request.type);
          return {
            id: `request-${request.id}`,
            type: request.type,
            date: request.date,
            amount: plan?.price || 0,
            status: request.status,
            isRequest: true,
          };
        });
        allPayments = [...pendingPayments];
      }

      // Get confirmed payments
      const { data: paymentsData } = await supabase
        .from("payments")
        .select("*")
        .eq(
          "member",
          profile?.name || user.email?.split("@")[0] || "Current User"
        )
        .order("date", { ascending: false });
      // Process confirmed payments
      if (paymentsData && paymentsData.length > 0) {
        allPayments = [...allPayments, ...paymentsData];
      }
      try {
        const localRequests = localStorage.getItem("localMembershipRequests");
        if (localRequests) {
          const parsedRequests = JSON.parse(localRequests);
          const userRequests = parsedRequests.filter(
            (req) => req.email === user.email
          );

          if (userRequests.length > 0) {
            const localPayments = userRequests.map((req) => ({
              id: `local-${req.id}`,
              type: req.type,
              date: req.date,
              amount:
                dbMembershipTypes.find((p) => p.name === req.type)?.price ||
                membershipTypes.find((p) => p.name === req.type)?.price || 0,
              status: "Pending",
              isRequest: true,
              local: true, 
            }));

            allPayments = [...localPayments, ...allPayments];
          }
        }
      } catch (localErr) {
        console.error("Error processing local requests:", localErr);
      }

      // Update payment history state
      if (allPayments.length > 0) {
        setPaymentHistory(allPayments);
      }
    } finally {
      setLoading(false);
    }
  };
  // Fetch user information and payment history when component mounts
  useEffect(() => {
    const initializeData = async () => {
      // First fetch membership types
      await fetchMembershipTypes();
      
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await fetchAllData(user);
      } else {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Refresh membership types when membershipTypes context changes
  useEffect(() => {
    fetchMembershipTypes();
  }, [membershipTypes]);

  const handleBookPlan = async (planName) => {
    // Get the plan details from database first, then fallback to context
    const plan = dbMembershipTypes.find((p) => p.name === planName) ||
                 membershipTypes.find((p) => p.name === planName);
    if (!plan) return;

    // Show toast
    toast({
      title: "Membership request sent",
      description: `Your request for the ${planName} plan has been submitted. A staff member will review it shortly.`,
    });

    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0]; // YYYY-MM-DD format for database

    // Format date for display consistency with other dates in payment history
    const displayDate = today.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    // Create a request object
    const requestId = Date.now();
    const newRequest = {
      id: requestId,
      member: currentUser.name,
      email: currentUser.email,
      type: planName,
      sessions: plan.sessions, // Store the actual session count at request time
      date: formattedDate,
      status: "Pending",
    };

    // Create a payment history object
    const newPayment = {
      id: `local-${requestId}`,
      type: planName,
      date: displayDate,
      amount: plan.price,
      status: "Pending",
      isRequest: true,
      local: true,
    };

    // Update UI immediately
    setPaymentHistory((prevHistory) => [newPayment, ...prevHistory]);

    try {
      // Check if user already has 2 pending requests
      const { data: existingRequests, error: checkError } = await supabase
        .from("membership_requests")
        .select("*")
        .eq("email", currentUser.email)
        .eq("status", "Pending"); // Only count pending requests

      if (checkError) {
        console.error("Error checking existing requests:", checkError);
        throw checkError;
      }

      if (existingRequests && existingRequests.length >= 2) {
        // Remove the payment from UI since request was rejected
        setPaymentHistory((prevHistory) => 
          prevHistory.filter(payment => payment.id !== newPayment.id)
        );
        
        toast({
          title: "Request Limit Reached",
          description: "Maximum 2 pending membership requests allowed per user. Please wait for current requests to be processed.",
          variant: "destructive",
        });
        return;
      }

      // Try to add to Supabase
      const { error } = await supabase.from("membership_requests").insert([
        {
          member: currentUser.name,
          email: currentUser.email,
          type: planName,
          sessions: plan.sessions, // Store the actual session count
          date: formattedDate,
          status: "Pending",
        },
      ]);

      // Send email notification if enabled and successful
      if (!error) {
        try {
          const { data: adminSettings } = await supabase
            .from('admin_notification_settings')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (adminSettings && adminSettings.session_request_notifications && adminSettings.email_provider === 'resend') {
            console.log("Sending session request notification email...");
            await supabase.functions.invoke('send-email-notification', {
              body: {
                userEmail: currentUser.email,
                userName: currentUser.name,
                notificationEmail: adminSettings.notification_email,
                fromEmail: adminSettings.from_email,
                fromName: adminSettings.from_name,
                sessionRequestDetails: {
                  planName: planName,
                  sessions: plan.sessions,
                  requestDate: formattedDate
                }
              }
            });
            console.log("Session request notification sent successfully");
          }
        } catch (emailError) {
          console.error("Failed to send session request email notification:", emailError);
          // Don't fail the request if email fails
        }

        // Send WhatsApp notification if enabled
        try {
          const whatsappSettings = localStorage.getItem("whatsappSettings");
          if (whatsappSettings) {
            const settings = JSON.parse(whatsappSettings);
            if (settings.enabled && settings.session_request_notifications && 
                settings.instance_id && settings.api_token && settings.phone_numbers) {
              
              const phoneNumbers = settings.phone_numbers.split(',').map(num => num.trim());
              let sessionMessage = settings.templates?.session_request || 
                '📋 Session balance request!\n\nMember: {userName}\nRequested Sessions: {requestedSessions}\nSession Type: {sessionType}\n\nPlease review and approve. 💪';
              
              // Replace template variables
              sessionMessage = sessionMessage
                .replace(/{userName}/g, currentUser.name)
                .replace(/{requestedSessions}/g, plan.sessions.toString())
                .replace(/{sessionType}/g, planName);
              
              console.log('Sending session request WhatsApp notification...');
              await supabase.functions.invoke('send-whatsapp-notification', {
                body: {
                  userName: currentUser.name,
                  userEmail: currentUser.email,
                  phoneNumbers: phoneNumbers,
                  apiToken: settings.api_token,
                  instanceId: settings.instance_id,
                  customMessage: sessionMessage
                }
              });
            }
          }
        } catch (whatsappError) {
          console.error("Failed to send session request WhatsApp notification:", whatsappError);
          // Don't fail the request if WhatsApp fails
        }
      }

      if (error) {
        storeRequestLocally(newRequest);
      }
    } catch (err) {
      console.error("Exception when submitting request:", err);
      // Store locally on exception
      storeRequestLocally(newRequest);
    }
  };

  const storeRequestLocally = (request) => {
    // Store the request in localStorage with a dedicated key
    try {
      const existingRequests = localStorage.getItem("localMembershipRequests");

      if (existingRequests) {
        const parsedRequests = JSON.parse(existingRequests);
        localStorage.setItem(
          "localMembershipRequests",
          JSON.stringify([...parsedRequests, request])
        );
      } else {
        localStorage.setItem(
          "localMembershipRequests",
          JSON.stringify([request])
        );
      }
    } catch (err) {
      console.error("Error storing request locally:", err);
    }

    // Also store in the original location for backward compatibility
    try {
      const existingRequests = localStorage.getItem("membershipRequests");

      if (existingRequests) {
        const parsedRequests = JSON.parse(existingRequests);
        localStorage.setItem(
          "membershipRequests",
          JSON.stringify([...parsedRequests, request])
        );
      } else {
        localStorage.setItem("membershipRequests", JSON.stringify([request]));
      }
    } catch (err) {
      console.error("Error storing request in membershipRequests:", err);
    }
  };

  return (
    <DashboardLayout title="Membership">
      <div className="space-y-8">
        {/* Current Membership */}
        <Card>
          <CardHeader>
            <CardTitle>Current Membership</CardTitle>
            <CardDescription>
              Your current membership details and usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                {currentMembership.name === "null" ? (
                  <p className=" font-medium text-lg mt-1">
                    you not have a Membership yet
                  </p>
                ) : (
                  <>
                    <h3 className="font-medium text-lg">
                      {currentMembership.name} Membership
                      {currentMembership.type}
                    </h3>
                    <p className="text-gray-500 mt-1">
                      From {currentMembership.startDate} to{" "}
                      {currentMembership.endDate}
                    </p>
                  </>
                )}
                {currentMembership.name === "null" ? null : (
                  <>
                    <p className="mt-4">
                      <span className="font-medium">Sessions:</span>{" "}
                      {currentMembership.sessionsRemaining} remaining out of{" "}
                      {currentMembership.sessions} total
                    </p>
                    <div className="mt-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gym-blue h-2"
                        style={{
                          width: `${
                            (currentMembership.sessionsRemaining /
                              currentMembership.sessions) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </>
                )}
              </div>
              <div className="border-l-0 md:border-l border-gray-200 pl-0 md:pl-4 mt-4 md:mt-0"></div>
            </div>
          </CardContent>
        </Card>

        {/* Available Plans - read only */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Available Plans</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dbMembershipTypes.map((plan) => (
              <Card
                key={plan.id}
                className={`${
                  plan.name === "Premium" ? "border-2 border-gym-blue relative" : ""
                } flex flex-col h-full`}
              >
                {plan.name === "Premium" && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gym-blue text-white px-3 py-1 rounded-full text-xs font-medium">
                    Recommended
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="mt-1 mb-4">
                    <p className="text-3xl font-bold">QAR {plan.price}</p>
                    <p className="text-sm text-gray-600 mt-2">
                      {plan.sessions} Sessions
                    </p>
                    {plan.description && (
                      <p className="text-sm text-gray-500 mt-2">
                        {plan.description}
                      </p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="mt-auto">
                  <Button
                    onClick={() => handleBookPlan(plan.name)}
                    className="w-full bg-gym-blue hover:bg-gym-dark-blue"
                  >
                    Get This Plan
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>
              Your recent membership payments and requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading payment history...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistory && paymentHistory.length > 0 ? (
                    paymentHistory.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{formatQatarDateTime(payment.date)}</TableCell>
                        <TableCell className="font-medium">
                          {(() => {
                            // Get sessions from payment data or lookup from membership types
                            if (payment.sessions) {
                              return payment.sessions;
                            }
                            const membershipType = dbMembershipTypes.find(m => m.name === (payment.type || payment.membership)) ||
                                                   membershipTypes.find(m => m.name === (payment.type || payment.membership));
                            return membershipType ? membershipType.sessions : 'N/A';
                          })()}
                        </TableCell>
                        <TableCell className="font-medium">
                          {payment.type || payment.membership}
                        </TableCell>
                        <TableCell>QAR {payment.amount}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              payment.status === "Successful" ||
                              payment.status === "Approved"
                                ? "bg-green-100 text-green-800"
                                : payment.status === "Pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {payment.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        No payment history available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UserMembership;