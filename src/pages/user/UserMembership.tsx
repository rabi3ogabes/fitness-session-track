
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

// Mock available plans
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
    description: "Unlimited access with personal training and premium amenities",
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
  const [currentUser, setCurrentUser] = useState({ name: "Current User", email: "user@example.com" });
  const [currentMembership, setCurrentMembership] = useState({
    name: "Basic",
    type: "Monthly",
    startDate: "April 1, 2025",
    endDate: "May 1, 2025",
    sessions: 12,
    sessionsRemaining: 7,
    price: 250, // QAR
    automatic: true,
  });
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch user information and payment history when component mounts
  useEffect(() => {
    const fetchUserInfo = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Try to get user's name from profiles table or user metadata
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', user.id)
          .single();
        
        if (profile && profile.name) {
          setCurrentUser({
            name: profile.name,
            email: profile.email || user.email || "user@example.com"
          });
        } else {
          // Fallback to the user's email
          setCurrentUser({
            name: user.email?.split('@')[0] || "Current User",
            email: user.email || "user@example.com"
          });
        }
        
        // Try to get user's membership and sessions
        const { data: memberData } = await supabase
          .from('members')
          .select('membership, sessions, remaining_sessions')
          .eq('email', user.email)
          .single();
          
        if (memberData) {
          // If member data exists, update the current membership
          const today = new Date();
          const oneMonthLater = new Date();
          oneMonthLater.setMonth(today.getMonth() + 1);
          
          setCurrentMembership({
            name: memberData.membership || "Basic",
            type: "Monthly",
            startDate: today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            endDate: oneMonthLater.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            sessions: memberData.sessions || 12,
            sessionsRemaining: memberData.remaining_sessions || 0,
            price: availablePlans.find(plan => plan.name === memberData.membership)?.price || 250,
            automatic: true,
          });
        }
        
        // Fetch payment history
        const fetchPayments = async () => {
          try {
            // First try to get from Supabase
            const { data: paymentsData, error } = await supabase
              .from('payments')
              .select('*')
              .eq('member', profile?.name || user.email?.split('@')[0] || "Current User")
              .order('date', { ascending: false });
              
            if (paymentsData && paymentsData.length > 0) {
              console.log("Fetched payments:", paymentsData);
              setPaymentHistory(paymentsData);
            } else {
              console.log("No payment data found or error:", error);
              // Use mock data if no real data
              setPaymentHistory([
                {
                  id: 1,
                  type: "Basic Monthly",
                  date: "April 1, 2025",
                  amount: 250, // QAR
                  status: "Successful",
                },
                {
                  id: 2,
                  type: "Basic Monthly",
                  date: "March 1, 2025",
                  amount: 250, // QAR
                  status: "Successful",
                },
                {
                  id: 3,
                  type: "Premium Monthly",
                  date: "February 1, 2025",
                  amount: 350, // QAR
                  status: "Successful",
                },
              ]);
            }
          } catch (err) {
            console.error("Error fetching payments:", err);
            // Use mock data as fallback
            setPaymentHistory([
              {
                id: 1,
                type: "Basic Monthly",
                date: "April 1, 2025",
                amount: 250, // QAR
                status: "Successful",
              },
              {
                id: 2,
                type: "Basic Monthly",
                date: "March 1, 2025",
                amount: 250, // QAR
                status: "Successful",
              },
              {
                id: 3,
                type: "Premium Monthly",
                date: "February 1, 2025",
                amount: 350, // QAR
                status: "Successful",
              },
            ]);
          } finally {
            setLoading(false);
          }
        };
        
        // Also fetch membership requests to show pending payments
        const fetchMembershipRequests = async () => {
          try {
            const { data: requestsData, error } = await supabase
              .from('membership_requests')
              .select('*')
              .eq('email', user.email)
              .order('date', { ascending: false });
              
            if (requestsData && requestsData.length > 0) {
              console.log("Fetched membership requests:", requestsData);
              
              // Transform requests into payment history format
              const pendingPayments = requestsData.map(request => {
                const plan = availablePlans.find(p => p.name === request.type);
                return {
                  id: `request-${request.id}`,
                  type: request.type,
                  date: request.date,
                  amount: plan?.price || 0,
                  status: request.status, // Will be "Pending", "Approved", or "Rejected"
                  isRequest: true
                };
              });
              
              // Combine with existing payments
              fetchPayments();
              setPaymentHistory(prevPayments => [...pendingPayments, ...prevPayments]);
            } else {
              fetchPayments();
            }
          } catch (err) {
            console.error("Error fetching membership requests:", err);
            fetchPayments();
          }
        };
        
        fetchMembershipRequests();
      }
    };
    
    fetchUserInfo();
  }, []);
  
  const handleBookPlan = async (planName: string) => {
    // Get the plan details
    const plan = availablePlans.find(p => p.name === planName);
    if (!plan) return;
    
    // Create a membership request
    toast({
      title: "Membership request sent",
      description: `Your request for the ${planName} plan has been submitted. A staff member will review it shortly.`,
    });
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    try {
      // First, try to add directly to Supabase if connected
      const { error } = await supabase
        .from('membership_requests')
        .insert([{
          member: currentUser.name,
          email: currentUser.email,
          type: planName,
          date: today,
          status: "Pending"
        }]);
      
      if (error) {
        console.error("Error submitting to Supabase:", error);
        // Fall back to localStorage
        storeMembershipRequestLocally(planName, today);
      } else {
        // Add to the payment history display
        setPaymentHistory(prev => [{
          id: `request-${Date.now()}`,
          type: planName,
          date: today,
          amount: plan.price,
          status: "Pending",
          isRequest: true
        }, ...prev]);
      }
    } catch (err) {
      console.error("Exception when submitting request:", err);
      // Fall back to localStorage
      storeMembershipRequestLocally(planName, today);
    }
  };
  
  const storeMembershipRequestLocally = (planName: string, date: string) => {
    // Store the request in localStorage so the admin page can see it
    const existingRequests = localStorage.getItem("membershipRequests");
    const newRequest = {
      id: Date.now(), // Use timestamp as unique ID
      member: currentUser.name,
      email: currentUser.email,
      type: planName,
      date: date,
      status: "Pending"
    };
    
    if (existingRequests) {
      const parsedRequests = JSON.parse(existingRequests);
      localStorage.setItem("membershipRequests", JSON.stringify([...parsedRequests, newRequest]));
    } else {
      localStorage.setItem("membershipRequests", JSON.stringify([newRequest]));
    }
    
    // Also add to the payment history display
    const plan = availablePlans.find(p => p.name === planName);
    setPaymentHistory(prev => [{
      id: `request-${newRequest.id}`,
      type: planName,
      date,
      amount: plan?.price || 0,
      status: "Pending",
      isRequest: true
    }, ...prev]);
  };
  
  return (
    <DashboardLayout title="Membership">
      <div className="space-y-8">
        {/* Current Membership */}
        <Card>
          <CardHeader>
            <CardTitle>Current Membership</CardTitle>
            <CardDescription>Your current membership details and usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-lg">{currentMembership.name} Membership ({currentMembership.type})</h3>
                <p className="text-gray-500 mt-1">
                  From {currentMembership.startDate} to {currentMembership.endDate}
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
                      width: `${(currentMembership.sessionsRemaining / currentMembership.sessions) * 100}%`,
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
                  plan.recommended
                    ? "border-2 border-gym-blue relative"
                    : ""
                }`}
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
                <CardContent>
                  <div className="mt-1 mb-4">
                    <p className="text-3xl font-bold">
                      QAR {plan.price}
                    </p>
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
                <CardFooter>
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
            <CardDescription>Your recent membership payments and requests</CardDescription>
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
                    paymentHistory.map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell>{payment.date}</TableCell>
                        <TableCell className="font-medium">
                          {payment.type || payment.membership}
                        </TableCell>
                        <TableCell>QAR {payment.amount}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              payment.status === "Successful" || payment.status === "Approved"
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
