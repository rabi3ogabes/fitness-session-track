
export interface ClassModel {
  id: number;
  name: string;
  trainer: string;
  schedule: string;
  capacity: number;
  enrolled?: number;
  status?: string; // Made optional
  gender?: "Male" | "Female" | "All" | string;
  trainers?: string[];
  recurrence?: string;
  created_at?: string;
  start_time?: string; // Changed from startTime
  end_time?: string;   // Changed from endTime
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
  start_time: string; // Changed from startTime
  end_time: string;   // Changed from endTime
  endDate?: Date;
  description?: string;
  location?: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  color?: string;
}

export const formatClassTime = (start_time: string, end_time: string): string => { // Changed parameters
  if (!start_time || !end_time) return "Time not set";
  
  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };
  
  return `${formatTime(start_time)} - ${formatTime(end_time)}`;
};

export const checkScheduleConflict = (
  classA: Pick<ClassModel, 'schedule' | 'start_time' | 'end_time' | 'trainers'>,
  classB: Pick<ClassModel, 'schedule' | 'start_time' | 'end_time' | 'trainers'>
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

