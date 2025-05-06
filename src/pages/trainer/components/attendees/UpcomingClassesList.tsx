
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format, isToday } from "date-fns";
import { Users, AlertCircle, RefreshCw } from "lucide-react";
import { getBookingsForClass } from "../../mockData";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

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
  
  // Get actual enrollment numbers for a class
  const getActualEnrollment = (classId: number) => {
    try {
      const bookings = getBookingsForClass(classId);
      return bookings.length;
    } catch (err) {
      console.error("Error fetching bookings for class", classId, err);
      setError("Failed to load some class enrollment data.");
      return 0;
    }
  };

  const handleRetry = () => {
    setRetrying(true);
    setError(null);
    setTimeout(() => {
      setRetrying(false);
    }, 1000);
  };
  
  if (upcomingClasses.length === 0) {
    return (
      <div className="text-center py-8 border rounded-md">
        <p className="text-gray-500">No upcoming classes scheduled</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex justify-between items-center">
            <span>{error}</span>
            <Button 
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="ml-4"
              disabled={retrying}
            >
              <RefreshCw className={cn("h-3 w-3 mr-1", retrying && "animate-spin")} />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}
    
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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
            {dayClasses.classes.map(cls => {
              const isSelected = cls.id === selectedClassForAttendees && 
                                isSameDay(dayClasses.date, selectedDateForAttendees);
              
              // Get actual number of enrolled members
              const actualEnrolled = getActualEnrollment(cls.id);
              const percentFull = (actualEnrolled / cls.capacity) * 100;
              
              return (
                <Card 
                  key={cls.id} 
                  className={cn(
                    "cursor-pointer transition-all overflow-hidden",
                    isSelected ? "border-gym-blue ring-2 ring-gym-blue/20" : "hover:border-gray-300"
                  )}
                  onClick={() => onClassSelect(cls.id, dayClasses.date)}
                >
                  <div 
                    className={cn(
                      "h-2",
                      percentFull >= 90 ? "bg-red-500" : 
                      percentFull >= 70 ? "bg-amber-500" : 
                      "bg-green-500"
                    )}
                  ></div>
                  
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
                        {actualEnrolled}/{cls.capacity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <p className="text-sm text-gray-500">{format(dayClasses.date, "EEEE, MMMM d")}</p>
                    <p className="text-sm text-gray-500">{cls.time}</p>
                    <p className="text-xs text-gray-500 mb-3">Trainer: {cls.trainer}</p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="h-4 w-4 mr-1 text-gym-blue" />
                        <span>{actualEnrolled} enrolled</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
