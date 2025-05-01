
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { format, isSameDay, addMonths, subMonths, parseISO } from "date-fns";
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
  
  // Get all dates with classes in the current month
  const datesWithClass = mockClasses.reduce((dates, cls) => {
    const classDate = typeof cls.date === 'string' ? parseISO(cls.date) : cls.date;
    const key = format(classDate, 'yyyy-MM-dd');
    
    if (!dates[key]) {
      dates[key] = 0;
    }
    dates[key] += 1;
    
    return dates;
  }, {} as Record<string, number>);
  
  // Custom day rendering for the calendar
  const renderDay = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const classCount = datesWithClass[dateKey] || 0;
    const isSelected = isSameDay(day, selectedDate);
    
    return (
      <div className="relative flex flex-col items-center justify-center w-full h-full">
        <div className={cn(
          "flex items-center justify-center rounded-full w-8 h-8",
          isSelected ? "bg-gym-blue text-white" : ""
        )}>
          {format(day, 'd')}
        </div>
        
        {classCount > 0 && (
          <div className="flex gap-1 mt-1">
            {[...Array(Math.min(classCount, 3))].map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "w-1.5 h-1.5 rounded-full", 
                  isSelected ? "bg-white" : "bg-gym-blue"
                )}
              ></div>
            ))}
          </div>
        )}
      </div>
    );
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
            
            {/* Custom calendar implementation */}
            <CustomCalendar 
              month={calendarDate}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              renderDay={renderDay}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <h3 className="font-medium mb-2 col-span-full">
              Classes on {format(selectedDate, "MMMM d, yyyy")}
            </h3>
            
            {classesForView.length > 0 ? (
              classesForView.map(cls => (
                <div 
                  key={cls.id} 
                  className="bg-gray-50 p-3 rounded-md border-l-4 border-gym-blue cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleViewClassDetails(cls.id)}
                >
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

// Custom calendar component implementation
interface CustomCalendarProps {
  month: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  renderDay?: (day: Date) => React.ReactNode;
}

const CustomCalendar = ({ month, selectedDate, onSelectDate, renderDay }: CustomCalendarProps) => {
  // Get the first day of the month
  const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  // Get the last day of the month
  const lastDayOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  
  // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
  const firstDayOfWeek = firstDayOfMonth.getDay();
  
  // Calculate how many days we need from the previous month to fill the first row
  const daysFromPrevMonth = firstDayOfWeek;
  
  // Calculate the total number of days in the current month
  const daysInMonth = lastDayOfMonth.getDate();
  
  // Calculate the total number of rows needed (including days from prev/next months)
  const totalDays = daysFromPrevMonth + daysInMonth;
  const rows = Math.ceil(totalDays / 7);
  
  // Generate calendar days array
  const calendarDays: Date[] = [];
  
  // Add days from previous month if needed
  const prevMonth = new Date(month.getFullYear(), month.getMonth(), 0);
  const daysInPrevMonth = prevMonth.getDate();
  
  for (let i = daysInPrevMonth - daysFromPrevMonth + 1; i <= daysInPrevMonth; i++) {
    calendarDays.push(new Date(prevMonth.getFullYear(), prevMonth.getMonth(), i));
  }
  
  // Add days from current month
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(new Date(month.getFullYear(), month.getMonth(), i));
  }
  
  // Add days from next month if needed
  const remainingCells = rows * 7 - calendarDays.length;
  const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  
  for (let i = 1; i <= remainingCells; i++) {
    calendarDays.push(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), i));
  }
  
  return (
    <div className="grid grid-cols-7 gap-1">
      {calendarDays.map((day, index) => {
        const isCurrentMonth = day.getMonth() === month.getMonth();
        const isToday = isSameDay(day, new Date());
        const isSelected = isSameDay(day, selectedDate);
        
        return (
          <div
            key={index}
            className={cn(
              "h-14 p-0.5 cursor-pointer flex flex-col items-center justify-center relative",
              isCurrentMonth ? "text-gray-900" : "text-gray-400",
              isToday && !isSelected && "border border-gym-blue rounded-md",
              isSelected && "bg-gym-blue/10 rounded-md"
            )}
            onClick={() => onSelectDate(day)}
          >
            {renderDay ? renderDay(day) : (
              <div className="text-center">{format(day, 'd')}</div>
            )}
          </div>
        );
      })}
    </div>
  );
};
