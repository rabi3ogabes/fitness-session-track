
import { Button } from "@/components/ui/button";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays } from "date-fns";

interface DateNavigatorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export const DateNavigator = ({ selectedDate, onDateChange }: DateNavigatorProps) => {
  return (
    <div className="flex items-center space-x-2">
      <CalendarIcon className="h-5 w-5 text-gray-500" />
      <Button variant="outline" size="icon" onClick={() => onDateChange(addDays(selectedDate, -1))}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="font-medium">
        {format(selectedDate, "MMMM d, yyyy")}
      </div>
      <Button variant="outline" size="icon" onClick={() => onDateChange(addDays(selectedDate, 1))}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
