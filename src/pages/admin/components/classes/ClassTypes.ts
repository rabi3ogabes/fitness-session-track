
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
  // Add a description field for better class information
  description?: string;
  // Add a location field to specify where the class is held
  location?: string;
  // Add a color field for visual identification in calendars
  color?: string;
  // Add a difficulty level
  difficulty?: "Beginner" | "Intermediate" | "Advanced" | string;
  // Add an image URL for class thumbnails
  imageUrl?: string;
  // Add equipment needed for the class
  equipment?: string;
  // Add max calories burned estimate
  caloriesBurned?: number;
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
  // Add new fields
  description?: string;
  location?: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  color?: string;
  equipment?: string;
  caloriesBurned?: number;
  imageUrl?: string;
}

// Add a utility function to format class times
export const formatClassTime = (startTime: string, endTime: string): string => {
  if (!startTime || !endTime) return "Time not set";
  
  // Convert 24h format to 12h format with AM/PM
  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };
  
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
};

// Add a utility function to check for schedule conflicts
export const checkScheduleConflict = (
  classA: Pick<ClassModel, 'schedule' | 'startTime' | 'endTime' | 'trainers'>,
  classB: Pick<ClassModel, 'schedule' | 'startTime' | 'endTime' | 'trainers'>
): boolean => {
  // Skip if different dates or missing time data
  if (classA.schedule !== classB.schedule || 
      !classA.startTime || !classA.endTime || 
      !classB.startTime || !classB.endTime) {
    return false;
  }
  
  // Check for trainer overlap
  const hasCommonTrainer = (classA.trainers || []).some(trainerA => 
    (classB.trainers || []).includes(trainerA)
  );
  
  if (!hasCommonTrainer) return false;
  
  // Check for time overlap
  return (
    (classA.startTime >= classB.startTime && classA.startTime < classB.endTime) ||
    (classA.endTime > classB.startTime && classA.endTime <= classB.endTime) ||
    (classA.startTime <= classB.startTime && classA.endTime >= classB.endTime)
  );
};
