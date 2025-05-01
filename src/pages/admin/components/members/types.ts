
export interface Member {
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
}

export interface PaymentHistoryItem {
  id: number;
  date: string;
  amount: number;
  description: string;
  status: string;
}

export interface PaymentHistoryData {
  [key: number]: PaymentHistoryItem[];
}

