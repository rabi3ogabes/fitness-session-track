
import { getClassesForDate } from "../../mockData";

export const getUpcomingClasses = () => {
  const result = [];
  const today = new Date();
  
  // Get classes for today and the next 6 days (week view)
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
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
