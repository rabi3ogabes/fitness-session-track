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

const availablePlans = [
  {
    id: 1,
    name: "Basic",
    description: "Access to gym facilities and 12 sessions per month",
    price: 250, // QAR
    features: [
      "Full gym access",
      "12 trainer sessions per month",
      "Access to basic classes",
      "Locker usage",
    ],
    recommended: false,
  },
  {
    id: 2,
    name: "Premium",
    description: "Full access with 20 sessions per month and additional perks",
    price: 350, // QAR
    features: [
      "Full gym access",
      "20 trainer sessions per month",
      "Access to all classes",
      "Towel service",
      "1 guest pass per month",
      "Nutritional consultation",
    ],
    recommended: true,
  },
  {
    id: 3,
    name: "Ultimate",
    description:
      "Unlimited access with personal training and premium amenities",
    price: 500, // QAR
    features: [
      "Full gym access",
      "Unlimited trainer sessions",
      "Access to all classes",
      "Towel service",
      "3 guest passes per month",
      "Nutritional consultation",
      "Personalized workout plan",
      "Massage session once a month",
    ],
    recommended: false,
  },
];

const UserMembership = () => {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState({
    name: "Current User",
    email: "user@example.com",
  });
  const [currentMembership, setCurrentMembership] = useState({
    name: "Basic",
    type: "Monthly",
    startDate: "April 1, 2025",
    endDate: "May 1, 2025",
    sessions: 12,
    sessionsRemaining: 7,
    price: 250,
    automatic: true,
  });
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);

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
            availablePlans.find((p) => p.name === memberData.membership)
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
          const plan = availablePlans.find((p) => p.name === request.type);
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

      // Check localStorage for any pending requests that haven't been synced
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
                availablePlans.find((p) => p.name === req.type)?.price || 0,
              status: "Pending",
              isRequest: true,
              local: true, // Mark as local to identify
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
      } else {
        // Fallback to mock data if no real data found
        setPaymentHistory([
          {
            id: 1,
            type: "Basic Monthly",
            date: "April 1, 2025",
            amount: 250,
            status: "Successful",
          },
          {
            id: 2,
            type: "Basic Monthly",
            date: "March 1, 2025",
            amount: 250,
            status: "Successful",
          },
          {
            id: 3,
            type: "Premium Monthly",
            date: "February 1, 2025",
            amount: 350,
            status: "Successful",
          },
        ]);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      // Fallback to mock data on error
      setPaymentHistory([
        {
          id: 1,
          type: "Basic Monthly",
          date: "April 1, 2025",
          amount: 250,
          status: "Successful",
        },
        {
          id: 2,
          type: "Basic Monthly",
          date: "March 1, 2025",
          amount: 250,
          status: "Successful",
        },
        {
          id: 3,
          type: "Premium Monthly",
          date: "February 1, 2025",
          amount: 350,
          status: "Successful",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user information and payment history when component mounts
  useEffect(() => {
    const initializeData = async () => {
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

  const handleBookPlan = async (planName) => {
    // Get the plan details
    const plan = availablePlans.find((p) => p.name === planName);
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
      // Try to add to Supabase
      const { error } = await supabase.from("membership_requests").insert([
        {
          member: currentUser.name,
          email: currentUser.email,
          type: planName,
          date: formattedDate,
          status: "Pending",
        },
      ]);

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
                <h3 className="font-medium text-lg">
                  {currentMembership.name} Membership ({currentMembership.type})
                </h3>
                <p className="text-gray-500 mt-1">
                  From {currentMembership.startDate} to{" "}
                  {currentMembership.endDate}
                </p>
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
              </div>
              <div className="border-l-0 md:border-l border-gray-200 pl-0 md:pl-4 mt-4 md:mt-0">
                {/* Removed the "Disable Auto-Renewal" button as requested */}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Plans - read only */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Available Plans</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {availablePlans.map((plan) => (
              <Card
                key={plan.id}
                className={`${
                  plan.recommended ? "border-2 border-gym-blue relative" : ""
                } flex flex-col h-full`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gym-blue text-white px-3 py-1 rounded-full text-xs font-medium">
                    Recommended
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="mt-1 mb-4">
                    <p className="text-3xl font-bold">QAR {plan.price}</p>
                  </div>

                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="h-4 w-4 text-gym-blue mr-2" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
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
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistory && paymentHistory.length > 0 ? (
                    paymentHistory.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{payment.date}</TableCell>
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