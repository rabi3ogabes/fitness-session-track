
import { getClassesForDate } from "../../mockData";
import { addDays, subDays } from "date-fns";

export const getUpcomingClasses = (referenceDate: Date = new Date()) => {
  const result = [];
  
  // Get classes for the reference date and the next 6 days (week view)
  for (let i = -1; i < 6; i++) {
    let date;
    if (i < 0) {
      // For previous day
      date = subDays(referenceDate, Math.abs(i));
    } else {
      // For current day and next days
      date = addDays(referenceDate, i);
    }
    
    const classesForDay = getClassesForDate(date);
    if (classesForDay.length > 0) {
      result.push({
        date,
        classes: classesForDay
      });
    }
  }
  
  return result;
};

// Function to save attendance data to localStorage
export const saveAttendanceData = (classId: number, date: string, attendanceData: any[]) => {
  // Create a unique key for this class and date
  const storageKey = `attendance_${classId}_${date}`;
  
  // Save the data to localStorage
  localStorage.setItem(storageKey, JSON.stringify(attendanceData));
};

// Function to get attendance data from localStorage
export const getAttendanceData = (classId: number, date: string) => {
  // Create the same unique key
  const storageKey = `attendance_${classId}_${date}`;
  
  // Try to get the data from localStorage
  const savedData = localStorage.getItem(storageKey);
  
  // Return the parsed data if it exists, otherwise null
  return savedData ? JSON.parse(savedData) : null;
};
