
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { UsersRound } from "lucide-react";
import { getFilteredClasses } from "../mockData";

interface ClassesSectionProps {
  selectedDate: Date;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
  viewMode: "today" | "tomorrow" | "all";
  setViewMode: React.Dispatch<React.SetStateAction<"today" | "tomorrow" | "all">>;
  handleViewClassDetails: (classId: number) => void;
}

export const ClassesSection = ({ 
  selectedDate, 
  setSelectedDate,
  viewMode,
  setViewMode,
  handleViewClassDetails
}: ClassesSectionProps) => {
  const classesForView = getFilteredClasses(viewMode, selectedDate);
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <h2 className="text-xl font-bold">Class Schedule & Bookings</h2>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Button 
              variant={viewMode === "today" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("today")}
              className={cn(
                "flex-1 md:flex-none",
                viewMode === "today" ? "bg-gym-blue hover:bg-gym-dark-blue" : ""
              )}
            >
              Today
            </Button>
            <Button 
              variant={viewMode === "tomorrow" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("tomorrow")}
              className={cn(
                "flex-1 md:flex-none",
                viewMode === "tomorrow" ? "bg-gym-blue hover:bg-gym-dark-blue" : ""
              )}
            >
              Tomorrow
            </Button>
            <Button 
              variant={viewMode === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("all")}
              className={cn(
                "flex-1 md:flex-none",
                viewMode === "all" ? "bg-gym-blue hover:bg-gym-dark-blue" : ""
              )}
            >
              Custom Date
            </Button>
          </div>
        </div>
        
        {viewMode === "all" && (
          <div className="flex items-center justify-center mb-4">
            <Button variant="outline" size="icon" onClick={() => setSelectedDate(prev => addDays(prev, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="mx-4 font-medium">
              {format(selectedDate, "MMMM d, yyyy")}
            </div>
            <Button variant="outline" size="icon" onClick={() => setSelectedDate(prev => addDays(prev, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {classesForView.length > 0 ? (
            classesForView.map(cls => {
              // Calculate booking count and percentage for this class
              const percentFull = (cls.enrolled / cls.capacity) * 100;
              
              return (
                <Card key={cls.id} className="overflow-hidden">
                  <div 
                    className={cn(
                      "h-2",
                      percentFull >= 90 ? "bg-red-500" : 
                      percentFull >= 70 ? "bg-amber-500" : 
                      "bg-green-500"
                    )}
                    style={{ width: `${percentFull}%` }}
                  ></div>
                  <div className="p-4 sm:p-6">
                    <h3 className="text-lg font-semibold mb-2">{cls.name}</h3>
                    <p className="text-sm text-gray-500">{format(cls.date, "EEEE, MMMM d")}</p>
                    <p className="text-sm text-gray-500">{cls.time}</p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center">
                        <UsersRound className="h-4 w-4 text-gray-500 mr-1" />
                        <span className={cn(
                          "text-sm font-medium",
                          percentFull >= 90 ? "text-red-600" : 
                          percentFull >= 70 ? "text-amber-600" : 
                          "text-green-600"
                        )}>
                          {cls.enrolled}/{cls.capacity} enrolled
                        </span>
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full sm:w-auto bg-gym-blue hover:bg-gym-dark-blue"
                        onClick={() => handleViewClassDetails(cls.id)}
                      >
                        View Attendees
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">
              <p className="mb-2">No classes scheduled for this day</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
