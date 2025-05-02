
export interface ClassModel {
  id: number;
  name: string;
  trainer: string;
  schedule: string;
  capacity: number;
  enrolled: number;
  status: string;
  gender?: "Male" | "Female" | "All" | string;
  trainers?: string[];
  recurrence?: string;
  startTime?: string;
  endTime?: string;
  // Add properties that come from Supabase
  created_at?: string;
  start_time?: string;
  end_time?: string;
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
  gender?: "Male" | "Female";
}

// New interfaces to simplify our UI
export interface ScheduleDay {
  label: string;
  value: string;
  isSelected: boolean;
}

export interface TimeOption {
  label: string;
  value: string;
}

export interface ClassFormState {
  name: string;
  gender: "Male" | "Female" | "All";
  trainers: string[];
  capacity: number;
  schedule: string;
  isRecurring: boolean;
  recurringFrequency: "Daily" | "Weekly" | "Monthly";
  selectedDays: string[];
  startTime: string;
  endTime: string;
  endDate?: Date;
}
