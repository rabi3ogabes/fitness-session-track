
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
