
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface Member {
  id: number;
  name: string;
  email: string;
  phone: string;
  membership: string;
  sessions: number;
  remainingSessions: number;
  status: string;
  birthday: string;
  canBeEditedByTrainers: boolean;
  gender?: "Male" | "Female";
}

interface PaymentHistoryItem {
  id: number;
  date: string;
  amount: number;
  description: string;
  status: string;
}

interface PaymentHistoryData {
  [key: number]: PaymentHistoryItem[];
}

interface EditMemberDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  currentMember: Member | null;
  onEditMember: (member: Member) => void;
  paymentHistoryData: PaymentHistoryData;
}

const EditMemberDialog = ({ 
  isOpen, 
  onOpenChange, 
  currentMember, 
  onEditMember,
  paymentHistoryData
}: EditMemberDialogProps) => {
  const { isAdmin, isTrainer } = useAuth();
  const [selectedTab, setSelectedTab] = useState("personal");
  const [editedMember, setEditedMember] = useState<Member | null>(currentMember);

  // Update edited member when currentMember changes
  if (currentMember && (!editedMember || editedMember.id !== currentMember.id)) {
    setEditedMember({...currentMember});
  }

  if (!editedMember) return null;

  const handleMembershipChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const membership = e.target.value;
    let sessions = 4;
    if (membership === "Standard") sessions = 8;
    if (membership === "Premium") sessions = 12;
    setEditedMember({ ...editedMember, membership, sessions });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Member</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
                  <Input
                    id="edit-name"
                    value={editedMember.name}
                    onChange={(e) => setEditedMember({ ...editedMember, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium col-span-1">
                    Email*
                  </label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editedMember.email}
                    onChange={(e) => setEditedMember({ ...editedMember, email: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium col-span-1">
                    Phone*
                  </label>
                  <Input
                    id="edit-phone"
                    value={editedMember.phone}
                    onChange={(e) => setEditedMember({ ...editedMember, phone: e.target.value })}
                    className="col-span-3"
                  />
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
                        setEditedMember({ ...editedMember, gender: value })}
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
                    onChange={(e) => setEditedMember({ ...editedMember, birthday: e.target.value })}
                    className="col-span-3"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="membership" className="mt-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium col-span-1">
                    Membership
                  </label>
                  <select
                    value={editedMember.membership}
                    onChange={handleMembershipChange}
                    className="col-span-3 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-gym-blue focus:border-transparent"
                  >
                    <option value="Basic">Basic (4 sessions)</option>
                    <option value="Standard">Standard (8 sessions)</option>
                    <option value="Premium">Premium (12 sessions)</option>
                  </select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium col-span-1">
                    Remaining Sessions
                  </label>
                  <Input
                    id="edit-remaining-sessions"
                    type="number"
                    min="0"
                    max={editedMember.sessions}
                    value={editedMember.remainingSessions}
                    onChange={(e) => setEditedMember({ 
                      ...editedMember, 
                      remainingSessions: Math.max(0, Math.min(editedMember.sessions, parseInt(e.target.value) || 0)) 
                    })}
                    className="col-span-3"
                  />
                </div>
                {isAdmin && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-sm font-medium col-span-1">
                      Status
                    </label>
                    <select
                      value={editedMember.status}
                      onChange={(e) => setEditedMember({ ...editedMember, status: e.target.value })}
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
                        onCheckedChange={() => setEditedMember({ ...editedMember, canBeEditedByTrainers: !editedMember.canBeEditedByTrainers })}
                      />
                      <span className="ml-2 text-sm text-gray-500">Allow trainers to edit this member</span>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {(isAdmin || isTrainer) && (
              <TabsContent value="payments" className="mt-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(paymentHistoryData[editedMember.id] || []).map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.date}</TableCell>
                          <TableCell>{payment.description}</TableCell>
                          <TableCell>QAR {payment.amount}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                                payment.status === "Paid"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}>
                              {payment.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!paymentHistoryData[editedMember.id] || paymentHistoryData[editedMember.id].length === 0) && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                            No payment history available.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            )}
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => onEditMember(editedMember)} className="bg-gym-blue hover:bg-gym-dark-blue">
              Save Changes
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditMemberDialog;
