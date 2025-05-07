
// Mock data
export const initialPayments = [
  { id: 1, member: "Sarah Johnson", amount: 120, date: "2025-04-28", membership: "Premium", status: "Completed" },
  { id: 2, member: "Michael Brown", amount: 80, date: "2025-04-27", membership: "Basic", status: "Completed" },
  { id: 3, member: "Emma Wilson", amount: 95, date: "2025-04-25", membership: "Standard", status: "Completed" },
  { id: 4, member: "James Martinez", amount: 120, date: "2025-04-24", membership: "Premium", status: "Pending" },
  { id: 5, member: "Olivia Taylor", amount: 80, date: "2025-04-23", membership: "Basic", status: "Completed" },
];

// Mock registered members
export const registeredMembers = [
  { id: 1, name: "Sarah Johnson" },
  { id: 2, name: "Michael Brown" },
  { id: 3, name: "Emma Wilson" },
  { id: 4, name: "James Martinez" },
  { id: 5, name: "Olivia Taylor" },
  { id: 6, name: "William Davis" },
  { id: 7, name: "Sophia Miller" },
  { id: 8, name: "Alexander Garcia" },
];

// Membership pricing in QAR
export const membershipPricing = {
  "Basic": 80,
  "Standard": 95,
  "Premium": 120
};

export type Payment = {
  id: number;
  member: string;
  amount: number;
  date: string;
  membership: string;
  status: string;
};

export type PaymentFormData = {
  member: string;
  membership: string;
  isSessionPayment: boolean;
  sessionCount?: number;
};
