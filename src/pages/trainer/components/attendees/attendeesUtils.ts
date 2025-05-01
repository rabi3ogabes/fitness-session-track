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

// Improved function to save attendance data to localStorage with error handling
export const saveAttendanceData = (classId: number, date: string, attendanceData: any[]) => {
  try {
    // Create a unique key for this class and date
    const storageKey = `attendance_${classId}_${date}`;
    
    // Save the data to localStorage with stringification
    localStorage.setItem(storageKey, JSON.stringify(attendanceData));
    
    // For debugging purposes
    console.log(`Attendance data saved for ${storageKey}:`, attendanceData);
    return true;
  } catch (error) {
    console.error("Failed to save attendance data:", error);
    return false;
  }
};

// Improved function to get attendance data from localStorage with error handling
export const getAttendanceData = (classId: number, date: string) => {
  try {
    // Create the same unique key
    const storageKey = `attendance_${classId}_${date}`;
    
    // Try to get the data from localStorage
    const savedData = localStorage.getItem(storageKey);
    
    // For debugging purposes
    console.log(`Retrieved attendance data for ${storageKey}:`, savedData);
    
    // Return the parsed data if it exists, otherwise null
    return savedData ? JSON.parse(savedData) : null;
  } catch (error) {
    console.error("Failed to retrieve attendance data:", error);
    return null;
  }
};

// Add a helper function to clear attendance data if needed for testing
export const clearAttendanceData = (classId: number, date: string) => {
  try {
    const storageKey = `attendance_${classId}_${date}`;
    localStorage.removeItem(storageKey);
    console.log(`Cleared attendance data for ${storageKey}`);
    return true;
  } catch (error) {
    console.error("Failed to clear attendance data:", error);
    return false;
  }
};
