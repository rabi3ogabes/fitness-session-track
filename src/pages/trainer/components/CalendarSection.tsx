
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Clock } from "lucide-react";
import { format, isSameDay, addMonths, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { mockClasses, isDayWithClass, getClassesForDate } from "../mockData";

interface CalendarSectionProps {
  selectedDate: Date;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
  bookings: any[];
  handleViewClassDetails: (classId: number) => void;
}

export const CalendarSection = ({ 
  selectedDate, 
  setSelectedDate,
  handleViewClassDetails
}: CalendarSectionProps) => {
  const [calendarDate, setCalendarDate] = useState<Date>(selectedDate);
  
  const classesForView = getClassesForDate(selectedDate);
  
  const handlePreviousMonth = () => {
    setCalendarDate(prev => subMonths(prev, 1));
  };
  
  const handleNextMonth = () => {
    setCalendarDate(prev => addMonths(prev, 1));
  };
  
  return (
    <div className="grid grid-cols-1 gap-6">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5 text-gym-blue" />
              Class Schedule
            </div>
            <div className="text-sm font-normal text-gray-500">
              {format(selectedDate, "MMM d, yyyy")}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousMonth}
                className="text-gray-500"
              >
                &lt;
              </Button>
              <h3 className="font-medium text-center">
                {format(calendarDate, "MMMM yyyy")}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextMonth}
                className="text-gray-500"
              >
                &gt;
              </Button>
            </div>
            
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day, i) => (
                <div key={i} className="h-8 flex items-center justify-center">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar component without the Popover wrapper */}
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              month={calendarDate}
              onMonthChange={setCalendarDate}
              className="pointer-events-auto w-full bg-white"
              modifiers={{
                hasClass: isDayWithClass
              }}
              modifiersClassNames={{
                hasClass: "bg-gym-light text-gym-blue font-bold"
              }}
              classNames={{
                day: cn(
                  "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                  "hover:bg-gym-light hover:text-gym-blue rounded-full"
                ),
                day_selected: "bg-gym-blue text-white hover:bg-gym-dark-blue hover:text-white rounded-full",
                day_today: "border border-gym-blue text-gym-blue font-bold rounded-full",
              }}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <h3 className="font-medium mb-2 col-span-full">
              Classes on {format(selectedDate, "MMMM d, yyyy")}
            </h3>
            
            {classesForView.length > 0 ? (
              classesForView.map(cls => (
                <div key={cls.id} className="bg-gray-50 p-3 rounded-md border-l-4 border-gym-blue">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <p className="font-medium">{cls.name}</p>
                      <p className="text-xs text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {cls.time}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-white">
                      {cls.enrolled}/{cls.capacity}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-center py-5 bg-gray-50 rounded-md border border-dashed border-gray-300 col-span-full">
                <p>No classes scheduled</p>
                <p className="text-xs mt-1">Select another date</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
