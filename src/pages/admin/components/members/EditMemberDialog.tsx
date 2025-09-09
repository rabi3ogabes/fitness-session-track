import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Member, PaymentHistoryData, PaymentHistoryItem } from "./types";
import { CardContent } from "@/components/ui/card";
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
interface EditMemberDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  currentMember: Member | null;
  onEditMember: (member: Member) => void;
  paymentHistoryData?: PaymentHistoryData;
}

const EditMemberDialog = ({
  isOpen,
  onOpenChange,
  currentMember,
  onEditMember,
}: EditMemberDialogProps) => {
  const { isAdmin, isTrainer } = useAuth();
  const [paymentHistoryData, setPaymentHistory] = useState([]);
  const [selectedTab, setSelectedTab] = useState("personal");
  const [editedMember, setEditedMember] = useState<Member | null>(
    currentMember
  );
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  console.log(paymentHistoryData, "paymentHistoryData");
  // Update edited member when currentMember changes

  const fetchAllData = async (currentMember) => {
    let allPayments = [];
    console.log(allPayments, "aa");
    
    // First, get membership types to map names to prices
    const { data: membershipTypesData } = await supabase
      .from("membership_types")
      .select("*");
    
    const { data: requestsData } = await supabase
      .from("membership_requests")
      .select("*")
      .eq("email", currentMember.email)
      .order("date", { ascending: false });
      
    if (requestsData && requestsData.length > 0) {
      const pendingPayments = requestsData.map((request) => {
        // Use the price from membership_types if available, otherwise fall back to availablePlans
        const membershipType = membershipTypesData?.find((mt) => mt.name === request.type);
        const fallbackPlan = availablePlans.find((p) => p.name === request.type);
        return {
          id: `request-${request.id}`,
          type: request.type,
          date: request.date,
          amount: membershipType?.price || fallbackPlan?.price || 0,
          status: request.status,
          isRequest: true,
        };
      });
      allPayments = [...pendingPayments];
    }
    
    const { data: paymentsData } = await supabase
      .from("payments")
      .select("*")
      .eq(
        "member",
        currentMember?.name ||
          currentMember.email?.split("@")[0] ||
          "Current User"
      )
      .order("date", { ascending: false });
      
    // Process confirmed payments - use actual amount from payments table
    if (paymentsData && paymentsData.length > 0) {
      const confirmedPayments = paymentsData.map((payment) => ({
        id: payment.id,
        type: payment.membership,
        date: payment.date,
        amount: payment.amount, // Use actual amount from payments table
        status: payment.status,
        isRequest: false,
      }));
      allPayments = [...allPayments, ...confirmedPayments];
    }
    
    try {
      const localRequests = localStorage.getItem("localMembershipRequests");
      if (localRequests) {
        const parsedRequests = JSON.parse(localRequests);
        const userRequests = parsedRequests.filter(
          (req) => req.email === currentMember.email
        );

        if (userRequests.length > 0) {
          const localPayments = userRequests.map((req) => {
            const membershipType = membershipTypesData?.find((mt) => mt.name === req.type);
            const fallbackPlan = availablePlans.find((p) => p.name === req.type);
            return {
              id: `local-${req.id}`,
              type: req.type,
              date: req.date,
              amount: membershipType?.price || fallbackPlan?.price || 0,
              status: "Pending",
              isRequest: true,
              local: true,
            };
          });

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
  };

  useEffect(() => {
    if (currentMember) {
      setEditedMember({ ...currentMember });
      setFormErrors({});
      fetchAllData(currentMember);
    }
  }, [currentMember]);

  if (!editedMember) return null;

  const handleMembershipChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const membership = e.target.value;
    let sessions = 4;
    if (membership === "Standard") sessions = 8;
    if (membership === "Premium") sessions = 12;
    setEditedMember({ ...editedMember, membership, sessions });
  };

  const validatePhone = (phone: string) => {
    // Updated validation - exactly 8 digits
    const phoneRegex = /^\d{8}$/;
    if (!phone) return "Phone number is required";
    if (!phoneRegex.test(phone.replace(/[\s-]/g, ""))) {
      return "Please enter a valid phone number (exactly 8 digits)";
    }
    return null;
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!editedMember.name.trim()) {
      errors.name = "Name is required";
    }

    if (!editedMember.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedMember.email)) {
      errors.email = "Please enter a valid email address";
    }

    const phoneError = validatePhone(editedMember.phone);
    if (phoneError) {
      errors.phone = phoneError;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFieldChange = (field: string, value: string | number) => {
    setEditedMember({ ...editedMember, [field]: value });

    // Clear error when field changes
    if (formErrors[field]) {
      const { [field]: _, ...rest } = formErrors;
      setFormErrors(rest);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value;
    setEditedMember({ ...editedMember, phone });

    // Clear error when user types
    if (formErrors.phone) {
      const { phone, ...rest } = formErrors;
      setFormErrors(rest);
    }
  };

  const handleSaveChanges = async () => {
    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      console.log("Saving member changes:", editedMember);
      onEditMember(editedMember);
    } catch (error) {
      console.error("Error saving member changes:", error);
    } finally {
      setIsLoading(false);
    }
  };
  console.log(editedMember, "editedMember");
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 max-h-[90vh]">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Edit Member</DialogTitle>
          <DialogDescription>Update member information</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-150px)]">
          <div className="px-6 space-y-4">
            <Tabs
              value={selectedTab}
              onValueChange={setSelectedTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal">Personal Info</TabsTrigger>
                <TabsTrigger value="membership">Membership</TabsTrigger>
                {(isAdmin || isTrainer) && (
                  <TabsTrigger value="payments">Payment History</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="personal" className="mt-4">
                <div className="grid gap-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-sm font-medium col-span-1">
                      Name*
                    </label>
                    <div className="col-span-3 space-y-1">
                      <Input
                        id="edit-name"
                        value={editedMember.name}
                        onChange={(e) =>
                          handleFieldChange("name", e.target.value)
                        }
                        className={`${formErrors.name ? "border-red-500" : ""}`}
                      />
                      {formErrors.name && (
                        <p className="text-sm text-red-500">
                          {formErrors.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-sm font-medium col-span-1">
                      Email*
                    </label>
                    <div className="col-span-3 space-y-1">
                      <Input
                        id="edit-email"
                        type="email"
                        value={editedMember.email}
                        onChange={(e) =>
                          handleFieldChange("email", e.target.value)
                        }
                        className={`${
                          formErrors.email ? "border-red-500" : ""
                        }`}
                      />
                      {formErrors.email && (
                        <p className="text-sm text-red-500">
                          {formErrors.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-sm font-medium col-span-1">
                      Phone*
                    </label>
                    <div className="col-span-3 space-y-1">
                      <Input
                        id="edit-phone"
                        value={editedMember.phone}
                        onChange={handlePhoneChange}
                        className={`${
                          formErrors.phone ? "border-red-500" : ""
                        }`}
                        placeholder="8-digit phone number"
                      />
                      {formErrors.phone && (
                        <p className="text-sm text-red-500">
                          {formErrors.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-sm font-medium col-span-1">
                      Gender*
                    </label>
                    <div className="col-span-3 flex items-center space-x-4">
                      <RadioGroup
                        defaultValue={editedMember.gender || "Male"}
                        value={editedMember.gender || "Male"}
                        onValueChange={(value: "Male" | "Female") =>
                          setEditedMember({ ...editedMember, gender: value })
                        }
                        className="flex items-center gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Male" id="edit-male" />
                          <Label htmlFor="edit-male">Male</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Female" id="edit-female" />
                          <Label htmlFor="edit-female">Female</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-sm font-medium col-span-1">
                      Birthday
                    </label>
                    <Input
                      id="edit-birthday"
                      type="date"
                      value={editedMember.birthday}
                      onChange={(e) =>
                        handleFieldChange("birthday", e.target.value)
                      }
                      className="col-span-3"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="membership" className="mt-4">
                <div className="grid gap-4">
                  {/* <div className="grid grid-cols-4 items-center gap-4"> */}
                  {/* <label className="text-right text-sm font-medium col-span-1">
                      Membership
                    </label> */}
                  {/* <select
                      value={editedMember.membership}
                      onChange={handleMembershipChange}
                      className="col-span-3 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-gym-blue focus:border-transparent"
                    > */}
                  {/* <span className="col-span-3 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-gym-blue focus:border-transparent">
                      Basic (4 sessions)
                    </span> */}

                  {/* <option value="Basic">Basic (4 sessions)</option>
                      <option value="Standard">Standard (8 sessions)</option>
                      <option value="Premium">Premium (12 sessions)</option> */}
                  {/* </select> */}
                  {/* </div> */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-sm font-medium col-span-1">
                      Remaining Sessions
                    </label>
                    <Input
                      id="edit-remaining-sessions"
                      type="number"
                      min="0"
                      value={editedMember.remainingSessions}
                      onChange={(e) =>
                        setEditedMember({
                          ...editedMember,
                          remainingSessions: Math.max(
                            0,
                            parseInt(e.target.value) || 0
                          ),
                        })
                      }
                      className="col-span-3"
                      placeholder="Enter number of remaining sessions"
                    />
                  </div>
                  {isAdmin && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label className="text-right text-sm font-medium col-span-1">
                        Status
                      </label>
                      <select
                        value={editedMember.status}
                        onChange={(e) =>
                          handleFieldChange("status", e.target.value)
                        }
                        className="col-span-3 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-gym-blue focus:border-transparent"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  )}
                  {isAdmin && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label className="text-right text-sm font-medium col-span-1">
                        Trainer Edit
                      </label>
                      <div className="col-span-3 flex items-center">
                        <Switch
                          checked={editedMember.canBeEditedByTrainers}
                          onCheckedChange={() =>
                            setEditedMember({
                              ...editedMember,
                              canBeEditedByTrainers:
                                !editedMember.canBeEditedByTrainers,
                            })
                          }
                        />
                        <span className="ml-2 text-sm text-gray-500">
                          Allow trainers to edit this member
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {(isAdmin || isTrainer) && (
                <TabsContent value="payments" className="mt-4">
                  <div className="rounded-md border">
                    <CardContent>
                      {isLoading ? (
                        <div className="text-center py-4">
                          Loading payment history...
                        </div>
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
                            {paymentHistoryData &&
                            paymentHistoryData.length > 0 ? (
                              paymentHistoryData.map((payment) => (
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
                                <TableCell
                                  colSpan={4}
                                  className="text-center py-4"
                                >
                                  No payment history available
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveChanges}
            className="bg-gym-blue hover:bg-gym-dark-blue"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditMemberDialog;
