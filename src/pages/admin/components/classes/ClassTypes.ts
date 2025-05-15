export interface ClassModel {
  id: number;
  name: string;
  trainer: string;
  schedule: string;
  capacity: number;
  enrolled?: number; // Made optional to match FullClassInfo usage
  status: string;
  gender?: "Male" | "Female" | "All" | string;
  trainers?: string[];
  recurrence?: string;
  created_at?: string;
  start_time?: string;
  end_time?: string;
  description?: string;
  location?: string;
  color?: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced" | string;
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
  description?: string;
  location?: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  color?: string;
}

export const formatClassTime = (startTime: string, endTime: string): string => {
  if (!startTime || !endTime) return "Time not set";
  
  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };
  
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
};

export const checkScheduleConflict = (
  classA: Pick<ClassModel, 'schedule' | 'start_time' | 'end_time' | 'trainers'>, // Changed to start_time and end_time
  classB: Pick<ClassModel, 'schedule' | 'start_time' | 'end_time' | 'trainers'>  // Changed to start_time and end_time
): boolean => {
  if (classA.schedule !== classB.schedule || 
      !classA.start_time || !classA.end_time || 
      !classB.start_time || !classB.end_time) {
    return false;
  }
  
  const hasCommonTrainer = (classA.trainers || []).some(trainerA => 
    (classB.trainers || []).includes(trainerA)
  );
  
  if (!hasCommonTrainer) return false;
  
  return (
    (classA.start_time >= classB.start_time && classA.start_time < classB.end_time) ||
    (classA.end_time > classB.start_time && classA.end_time <= classB.end_time) ||
    (classA.start_time <= classB.start_time && classA.end_time >= classB.end_time)
  );
};
