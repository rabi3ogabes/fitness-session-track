
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";

interface DateNavigatorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export const DateNavigator = ({ selectedDate, onDateChange }: DateNavigatorProps) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const goToPreviousDay = () => {
    onDateChange(subDays(selectedDate, 1));
  };
  
  const goToNextDay = () => {
    onDateChange(addDays(selectedDate, 1));
  };
  
  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(date);
      setIsCalendarOpen(false);
    }
  };
  
  return (
    <div className="flex items-center space-x-2">
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2 bg-white">
            <CalendarIcon className="h-4 w-4 text-gym-blue" />
            <span className="font-medium hidden sm:inline">
              {format(selectedDate, "yyyy-MM-dd")}
            </span>
            <span className="font-medium sm:hidden">
              {format(selectedDate, "MMM d")}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleCalendarSelect}
            initialFocus
            className="p-3 pointer-events-auto bg-white"
          />
        </PopoverContent>
      </Popover>
      
      <div className="flex gap-1">
        <Button variant="outline" size="icon" onClick={goToPreviousDay} className="bg-white">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={goToNextDay} className="bg-white">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
