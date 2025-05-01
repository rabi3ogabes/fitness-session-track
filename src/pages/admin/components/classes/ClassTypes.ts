
export interface ClassModel {
  id: number;
  name: string;
  trainer: string;
  schedule: string;
  capacity: number;
  enrolled: number;
  status: string;
  gender: "Male" | "Female" | "All" | string;
  trainers?: string[];
  recurrence?: string;
  startTime?: string;
  endTime?: string;
}

export interface RecurringPattern {
  frequency: "Daily" | "Weekly" | "Monthly";
  daysOfWeek: string[];
  repeatUntil: string;
}

export interface Trainer {
  id: number;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  status: string;
  gender?: "Male" | "Female" | string;
}
