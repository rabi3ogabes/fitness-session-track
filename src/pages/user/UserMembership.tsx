
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, CreditCard } from "lucide-react";

// Mock membership data
const membershipData = {
  current: {
    name: "Basic",
    type: "Monthly",
    startDate: "April 1, 2025",
    endDate: "May 1, 2025",
    sessions: 12,
    sessionsRemaining: 7,
    price: 250, // QR
    automatic: true,
  },
  history: [
    {
      id: 1,
      type: "Basic Monthly",
      date: "April 1, 2025",
      amount: 250, // QR
      status: "Successful",
    },
    {
      id: 2,
      type: "Basic Monthly",
      date: "March 1, 2025",
      amount: 250, // QR
      status: "Successful",
    },
    {
      id: 3,
      type: "Premium Monthly",
      date: "February 1, 2025",
      amount: 350, // QR
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
    monthlyPrice: 250, // QR
    yearlyPrice: 2500, // QR
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
    monthlyPrice: 350, // QR
    yearlyPrice: 3500, // QR
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
    monthlyPrice: 500, // QR
    yearlyPrice: 5000, // QR
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
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("credit-card");
  
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
                <p className="font-medium">Payment</p>
                <p className="text-2xl font-bold mt-1">
                  QR {membershipData.current.price}<span className="text-sm font-normal">/month</span>
                </p>
                <p className="text-gray-500 mt-1">
                  {membershipData.current.automatic
                    ? "Automatic renewal enabled"
                    : "Automatic renewal disabled"}
                </p>
                <div className="mt-4 flex space-x-2">
                  <Button variant="outline" size="sm">
                    Disable Auto-Renewal
                  </Button>
                  <Button size="sm" className="bg-gym-blue hover:bg-gym-dark-blue">
                    Upgrade Plan
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Plans */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Available Plans</h2>
            <div className="bg-gray-100 rounded-md p-1">
              <button
                className={`px-4 py-1 rounded-md transition ${
                  billingCycle === "monthly"
                    ? "bg-white shadow-sm"
                    : "text-gray-500"
                }`}
                onClick={() => setBillingCycle("monthly")}
              >
                Monthly
              </button>
              <button
                className={`px-4 py-1 rounded-md transition ${
                  billingCycle === "yearly"
                    ? "bg-white shadow-sm"
                    : "text-gray-500"
                }`}
                onClick={() => setBillingCycle("yearly")}
              >
                Yearly (save 10%)
              </button>
            </div>
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
                      QR{" "}
                      {billingCycle === "monthly"
                        ? plan.monthlyPrice
                        : plan.yearlyPrice}
                      <span className="text-sm font-normal">
                        /{billingCycle === "monthly" ? "month" : "year"}
                      </span>
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
                    className={`w-full ${
                      plan.recommended
                        ? "bg-gym-blue hover:bg-gym-dark-blue"
                        : ""
                    }`}
                  >
                    {membershipData.current.name === plan.name
                      ? "Current Plan"
                      : "Select Plan"}
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
                        QR {payment.amount}
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

        {/* Update Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>Update your payment details</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="credit-card">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger
                  value="credit-card"
                  onClick={() => setSelectedPaymentMethod("credit-card")}
                >
                  Credit Card
                </TabsTrigger>
                <TabsTrigger
                  value="paypal"
                  onClick={() => setSelectedPaymentMethod("paypal")}
                >
                  PayPal
                </TabsTrigger>
              </TabsList>

              <TabsContent value="credit-card">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="cardName">Cardholder Name</Label>
                      <Input
                        id="cardName"
                        placeholder="John Doe"
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        placeholder="**** **** **** ****"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="expiry">Expiry Date</Label>
                      <Input
                        id="expiry"
                        placeholder="MM/YY"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvc">CVC</Label>
                      <Input id="cvc" placeholder="***" className="mt-1" />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="paypal">
                <div className="text-center py-6">
                  <p className="mb-4">
                    You will be redirected to PayPal to complete the setup.
                  </p>
                  <Button className="bg-[#0070ba] hover:bg-[#005ea6]">
                    Connect with PayPal
                  </Button>
                </div>
              </TabsContent>

              <div className="mt-6 flex justify-end">
                <Button
                  className="bg-gym-blue hover:bg-gym-dark-blue"
                  disabled={!selectedPaymentMethod}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Save Payment Method
                </Button>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UserMembership;
