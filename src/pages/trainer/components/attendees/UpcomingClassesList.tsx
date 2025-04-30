
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format, isToday } from "date-fns";
import { Users } from "lucide-react";

interface UpcomingClass {
  id: number;
  name: string;
  time: string;
  date: Date;
  trainer: string;
  enrolled: number;
  capacity: number;
}

interface DayClasses {
  date: Date;
  classes: UpcomingClass[];
}

interface UpcomingClassesListProps {
  upcomingClasses: DayClasses[];
  selectedClassForAttendees: number | null;
  selectedDateForAttendees: Date;
  onClassSelect: (classId: number, date: Date) => void;
}

export const UpcomingClassesList = ({
  upcomingClasses,
  selectedClassForAttendees,
  selectedDateForAttendees,
  onClassSelect
}: UpcomingClassesListProps) => {
  // Function to determine if a date is today
  const isDateToday = (date: Date) => {
    return isToday(date);
  };
  
  // Helper function to check if two dates are the same day
  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };
  
  return (
    <div className="space-y-6">
      {upcomingClasses.map((dayClasses) => (
        <div key={format(dayClasses.date, 'yyyy-MM-dd')} className="space-y-3">
          <h4 className={cn(
            "text-base font-medium flex items-center",
            isDateToday(dayClasses.date) ? "text-gym-blue" : ""
          )}>
            {isDateToday(dayClasses.date) ? (
              <Badge variant="outline" className="mr-2 bg-gym-light text-gym-blue">Today</Badge>
            ) : null}
            {format(dayClasses.date, "EEEE, MMMM d")}
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {dayClasses.classes.map(cls => {
              const isSelected = cls.id === selectedClassForAttendees && 
                                isSameDay(dayClasses.date, selectedDateForAttendees);
              const percentFull = (cls.enrolled / cls.capacity) * 100;
              
              return (
                <Card 
                  key={cls.id} 
                  className={cn(
                    "cursor-pointer transition-all border-2",
                    isSelected ? "border-gym-blue bg-gym-light" : "border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => onClassSelect(cls.id, dayClasses.date)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-base">{cls.name}</h4>
                      <Badge 
                        className={cn(
                          percentFull >= 90 ? "bg-red-100 text-red-800" : 
                          percentFull >= 70 ? "bg-amber-100 text-amber-800" : 
                          "bg-green-100 text-green-800"
                        )}
                      >
                        {cls.enrolled}/{cls.capacity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-gray-500">{cls.time}</p>
                    <p className="text-xs text-gray-500">Trainer: {cls.trainer}</p>
                    
                    <div className="mt-3 w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full",
                          percentFull >= 90 ? "bg-red-500" : 
                          percentFull >= 70 ? "bg-amber-500" : 
                          "bg-green-500"
                        )}
                        style={{ width: `${percentFull}%` }}
                      ></div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
      
      {upcomingClasses.length === 0 && (
        <div className="text-center py-8 border rounded-md">
          <p className="text-gray-500">No upcoming classes scheduled</p>
        </div>
      )}
    </div>
  );
};
