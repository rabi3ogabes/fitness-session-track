
import { useState } from "react";
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
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

// Mock membership data
const membershipData = {
  current: {
    name: "Basic",
    type: "Monthly",
    startDate: "April 1, 2025",
    endDate: "May 1, 2025",
    sessions: 12,
    sessionsRemaining: 7,
    price: 250, // QAR
    automatic: true,
  },
  history: [
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
  ],
};

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState("user@example.com");
  const [userName, setUserName] = useState("Current User");
  const { user } = useAuth();
  
  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (user && user.email) {
        try {
          setUserEmail(user.email);
          
          // Try to get user's name from profiles
          const { data, error } = await supabase
            .from('profiles')
            .select('name')
            .eq('email', user.email)
            .single();
            
          if (data && data.name) {
            setUserName(data.name);
          } else {
            // Fallback to getting name from members table
            const { data: memberData, error: memberError } = await supabase
              .from('members')
              .select('name')
              .eq('email', user.email)
              .single();
              
            if (memberData && memberData.name) {
              setUserName(memberData.name);
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };
    
    fetchUserData();
  }, [user]);
  
  const handleBookPlan = async (planName: string) => {
    setIsSubmitting(true);
    
    try {
      console.log(`Booking ${planName} plan for user: ${userEmail}`);
      
      // Create a membership request in the database
      const newRequest = {
        member: userName,
        email: userEmail,
        type: planName,
        date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
        status: "Pending"
      };
      
      const { data, error } = await supabase
        .from('membership_requests')
        .insert([newRequest])
        .select();
        
      if (error) {
        console.error("Error submitting membership request:", error);
        throw error;
      }
      
      console.log("Membership request created successfully:", data);
      
      toast({
        title: "Membership request sent",
        description: `Your request for the ${planName} plan has been submitted. A staff member will review it shortly.`,
      });
    } catch (error: any) {
      console.error("Error creating membership request:", error);
      toast({
        title: "Submission failed",
        description: `There was an error submitting your request. Please try again. ${error.message || ''}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
                <h3 className="font-medium text-lg">{membershipData.current.name} Membership ({membershipData.current.type})</h3>
                <p className="text-gray-500 mt-1">
                  From {membershipData.current.startDate} to {membershipData.current.endDate}
                </p>
                <p className="mt-4">
                  <span className="font-medium">Sessions:</span>{" "}
                  {membershipData.current.sessionsRemaining} remaining out of{" "}
                  {membershipData.current.sessions} total
                </p>
                <div className="mt-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gym-blue h-2"
                    style={{
                      width: `${(membershipData.current.sessionsRemaining / membershipData.current.sessions) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div className="border-l-0 md:border-l border-gray-200 pl-0 md:pl-4 mt-4 md:mt-0">
                <div className="mt-4 flex space-x-2">
                  <Button variant="outline" size="sm">
                    Disable Auto-Renewal
                  </Button>
                </div>
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
                  {membershipData.current.name === plan.name ? (
                    <p className="text-sm text-gray-500 w-full text-center">
                      Current Plan
                    </p>
                  ) : (
                    <Button 
                      onClick={() => handleBookPlan(plan.name)} 
                      className="w-full bg-gym-blue hover:bg-gym-dark-blue"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Processing..." : "Book Now"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Your recent membership payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {membershipData.history.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payment.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        QAR {payment.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            payment.status === "Successful"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UserMembership;
