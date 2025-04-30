
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Mock membership data
const membershipData = {
  current: {
    type: "Basic",
    sessions: {
      total: 4,
      used: 1,
      remaining: 3,
    },
    startDate: "2025-04-01",
    expiryDate: "2025-05-01",
  },
  options: [
    {
      id: 1,
      name: "Basic",
      sessions: 1,
      price: 25,
      description: "Perfect for trying out our gym facilities and classes",
    },
    {
      id: 2,
      name: "Standard",
      sessions: 4,
      price: 80,
      description: "Ideal for occasional gym-goers",
      popular: true,
    },
    {
      id: 3,
      name: "Premium",
      sessions: 12,
      price: 180,
      description: "Best value for regular attendees",
    },
  ],
  history: [
    {
      id: 1,
      type: "Premium",
      sessions: 12,
      startDate: "2025-03-01",
      expiryDate: "2025-04-01",
      status: "Expired",
    },
    {
      id: 2,
      type: "Standard",
      sessions: 8,
      startDate: "2025-02-01",
      expiryDate: "2025-03-01",
      status: "Expired",
    },
  ],
};

const UserMembership = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<null | typeof membershipData.options[0]>(null);
  const { toast } = useToast();

  const handlePurchase = () => {
    if (!selectedMembership) return;
    
    toast({
      title: "Purchase request submitted",
      description: `Your request to purchase the ${selectedMembership.name} membership has been submitted for admin approval.`,
    });
    
    setIsDialogOpen(false);
    setSelectedMembership(null);
  };

  return (
    <DashboardLayout title="My Membership">
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Current Membership</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border border-gray-200 rounded-md">
              <p className="text-sm text-gray-500">Membership Type</p>
              <p className="text-xl font-bold text-gym-blue">{membershipData.current.type}</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-md">
              <p className="text-sm text-gray-500">Sessions</p>
              <p className="text-xl font-bold text-gym-blue">
                {membershipData.current.sessions.remaining}/{membershipData.current.sessions.total}
              </p>
              <p className="text-xs text-gray-500">
                {membershipData.current.sessions.used} used
              </p>
            </div>
            <div className="p-4 border border-gray-200 rounded-md">
              <p className="text-sm text-gray-500">Valid Until</p>
              <p className="text-xl font-bold text-gym-blue">{membershipData.current.expiryDate}</p>
              <p className="text-xs text-gray-500">
                Started on {membershipData.current.startDate}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-6">Membership Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {membershipData.options.map((option) => (
              <div
                key={option.id}
                className={`border rounded-lg overflow-hidden flex flex-col ${
                  option.popular ? "border-gym-blue" : "border-gray-200"
                }`}
              >
                {option.popular && (
                  <div className="bg-gym-blue text-white py-1 px-3 text-center text-sm">
                    Most Popular
                  </div>
                )}
                <div className="p-6 flex-1">
                  <h3 className="text-xl font-bold mb-2">{option.name}</h3>
                  <p className="text-3xl font-bold text-gym-blue mb-2">
                    ${option.price}
                  </p>
                  <p className="text-gray-600 mb-4">{option.sessions} sessions</p>
                  <p className="text-sm text-gray-500 mb-6">
                    {option.description}
                  </p>
                  <Button
                    onClick={() => {
                      setSelectedMembership(option);
                      setIsDialogOpen(true);
                    }}
                    className={`w-full ${
                      option.popular
                        ? "bg-gym-blue hover:bg-gym-dark-blue text-white"
                        : "bg-white text-gym-blue border border-gym-blue hover:bg-gym-light"
                    }`}
                    variant={option.popular ? "default" : "outline"}
                  >
                    Purchase
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-4">
            * All memberships have a validity of 30 days from the date of purchase.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Membership History</h2>
          {membershipData.history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sessions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiry Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {membershipData.history.map((membership) => (
                    <tr key={membership.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{membership.type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {membership.sessions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {membership.startDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {membership.expiryDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                          {membership.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No membership history available.</p>
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Membership Purchase</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {selectedMembership && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Membership Type</p>
                  <p className="font-medium">{selectedMembership.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Sessions</p>
                  <p className="font-medium">{selectedMembership.sessions}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="font-medium">${selectedMembership.price}</p>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm">
                    Please pay at the gym reception. Your membership will be activated after payment confirmation.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePurchase} className="bg-gym-blue hover:bg-gym-dark-blue">
              Confirm Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default UserMembership;
