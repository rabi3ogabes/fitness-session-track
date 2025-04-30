
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Bell } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Mock user data
const userData = {
  name: "John Doe",
  remainingSessions: 3,
  totalSessions: 12,
};

// Mock class data - this would come from an API in a real app
const mockClasses = [
  {
    id: 1,
    name: "Morning Yoga",
    date: new Date(2025, 4, 1), // May 1, 2025
    time: "08:00 - 09:00",
    trainer: "Jane Doe",
    capacity: 15,
    enrolled: 8,
  },
  {
    id: 2,
    name: "HIIT Workout",
    date: new Date(2025, 4, 1), // May 1, 2025
    time: "18:00 - 19:00",
    trainer: "John Smith",
    capacity: 12,
    enrolled: 10,
  },
  {
    id: 3,
    name: "Pilates",
    date: new Date(2025, 4, 2), // May 2, 2025
    time: "09:00 - 10:00",
    trainer: "Sarah Williams",
    capacity: 10,
    enrolled: 5,
  },
  {
    id: 4,
    name: "Strength Training",
    date: new Date(2025, 4, 3), // May 3, 2025
    time: "17:00 - 18:00",
    trainer: "Alex Johnson",
    capacity: 8,
    enrolled: 6,
  },
  {
    id: 5,
    name: "Boxing",
    date: new Date(2025, 4, 4), // May 4, 2025
    time: "18:00 - 19:00",
    trainer: "Mike Tyson",
    capacity: 8,
    enrolled: 7,
  },
  {
    id: 6,
    name: "Zumba",
    date: new Date(2025, 4, 5), // May 5, 2025
    time: "16:00 - 17:00",
    trainer: "Maria Garcia",
    capacity: 20,
    enrolled: 12,
  },
];

const ClassCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Calculate if sessions are low (25% or less)
  const sessionsLow = userData.remainingSessions <= (userData.totalSessions * 0.25);
  
  // Get classes for the selected date
  const classesForSelectedDate = selectedDate 
    ? mockClasses.filter(cls => 
        cls.date.getDate() === selectedDate.getDate() &&
        cls.date.getMonth() === selectedDate.getMonth() &&
        cls.date.getFullYear() === selectedDate.getFullYear()
      )
    : [];
  
  // Function to highlight dates with classes
  const isDayWithClass = (date: Date) => {
    return mockClasses.some(cls => 
      cls.date.getDate() === date.getDate() &&
      cls.date.getMonth() === date.getMonth() &&
      cls.date.getFullYear() === date.getFullYear()
    );
  };

  const handleBookClass = (classId: number) => {
    if (userData.remainingSessions <= 0) {
      toast({
        title: "No sessions remaining",
        description: "Please purchase a membership to book more sessions.",
        variant: "destructive"
      });
      return;
    }

    setSelectedClass(classId);
    toast({
      title: "Class booked successfully!",
      description: "Your session has been booked.",
    });
  };

  return (
    <DashboardLayout title="Book a Class">
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <div>
              <h2 className="text-xl font-bold">Class Schedule</h2>
              <p className="text-gray-500">Select a date to view available classes</p>
            </div>
            <div className="mt-3 md:mt-0">
              <div className="flex items-center">
                <CalendarDays className="mr-2 h-5 w-5 text-gym-blue" />
                <span>
                  Sessions remaining: <span className={cn("font-bold", sessionsLow ? "text-red-500" : "text-gym-blue")}>
                    {userData.remainingSessions}
                  </span>
                </span>
              </div>
              {sessionsLow && (
                <div className="flex items-center mt-2 text-sm text-red-500">
                  <Bell className="mr-2 h-4 w-4" />
                  <span>Your sessions are running low. Consider renewing your membership.</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <Calendar 
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="pointer-events-auto"
                  modifiers={{
                    hasClass: isDayWithClass
                  }}
                  modifiersClassNames={{
                    hasClass: "bg-gym-light text-gym-blue font-bold"
                  }}
                />
              </div>
            </div>
            
            <div className="md:col-span-2">
              {selectedDate && (
                <div>
                  <h3 className="text-lg font-medium mb-4">
                    Classes for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Selected date'}
                  </h3>
                  
                  {classesForSelectedDate.length > 0 ? (
                    <div className="space-y-4">
                      {classesForSelectedDate.map((cls) => (
                        <Card key={cls.id} className={cn(
                          "transition-all hover:shadow",
                          selectedClass === cls.id ? "border-2 border-gym-blue" : ""
                        )}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle>{cls.name}</CardTitle>
                                <CardDescription>{cls.time}</CardDescription>
                              </div>
                              <Badge variant={cls.enrolled >= cls.capacity ? "destructive" : "outline"}>
                                {cls.enrolled >= cls.capacity ? "Full" : `${cls.enrolled}/${cls.capacity}`}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <p className="text-sm">Trainer: {cls.trainer}</p>
                          </CardContent>
                          <CardFooter>
                            <Button 
                              onClick={() => handleBookClass(cls.id)}
                              className="w-full bg-gym-blue hover:bg-gym-dark-blue"
                              disabled={cls.enrolled >= cls.capacity || userData.remainingSessions <= 0 || selectedClass === cls.id}
                            >
                              {selectedClass === cls.id ? "Booked" : 
                               cls.enrolled >= cls.capacity ? "Class Full" : 
                               userData.remainingSessions <= 0 ? "No Sessions Left" : 
                               "Book Class"}
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CalendarDays className="mx-auto h-12 w-12 opacity-30 mb-2" />
                      <h4 className="text-lg font-medium">No classes scheduled</h4>
                      <p>There are no classes available on this date.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClassCalendar;
