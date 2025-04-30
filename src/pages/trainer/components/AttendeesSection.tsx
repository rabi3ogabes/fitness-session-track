
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAttendanceManager } from "../utils/attendanceUtils";
import { mockBookings, mockClasses } from "../mockData";
import { BulkAttendanceDialog } from "./BulkAttendanceDialog";
import { DateNavigator } from "./attendees/DateNavigator";
import { UpcomingClassesList } from "./attendees/UpcomingClassesList";
import { SelectedClassDetails } from "./attendees/SelectedClassDetails";
import { getUpcomingClasses } from "./attendees/attendeesUtils";
import { Users } from "lucide-react";

interface AttendeesSectionProps {
  selectedDateForAttendees: Date;
  setSelectedDateForAttendees: React.Dispatch<React.SetStateAction<Date>>;
  selectedClassForAttendees: number | null;
  setSelectedClassForAttendees: React.Dispatch<React.SetStateAction<number | null>>;
}

export const AttendeesSection = ({ 
  selectedDateForAttendees, 
  setSelectedDateForAttendees,
  selectedClassForAttendees,
  setSelectedClassForAttendees
}: AttendeesSectionProps) => {
  const [bookings, setBookings] = useState(mockBookings);
  const { markAttendance } = useAttendanceManager();
  const [isBulkAttendanceOpen, setIsBulkAttendanceOpen] = useState(false);
  
  const upcomingClasses = getUpcomingClasses();
  
  const handleOpenBulkAttendance = () => {
    if (selectedClassForAttendees) {
      setIsBulkAttendanceOpen(true);
    }
  };
  
  const handleClassSelect = (classId: number, date: Date) => {
    setSelectedClassForAttendees(classId);
    setSelectedDateForAttendees(date);
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-xl font-bold">Class Attendees</h2>
          <DateNavigator 
            selectedDate={selectedDateForAttendees}
            onDateChange={setSelectedDateForAttendees}
          />
        </div>
        
        {/* Upcoming Classes Section */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Upcoming Classes</h3>
          <UpcomingClassesList 
            upcomingClasses={upcomingClasses}
            selectedClassForAttendees={selectedClassForAttendees}
            selectedDateForAttendees={selectedDateForAttendees}
            onClassSelect={handleClassSelect}
          />
        </div>
        
        {/* Selected class details */}
        {selectedClassForAttendees && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium">
                Selected Class
                {(() => {
                  const cls = mockClasses.find(c => c.id === selectedClassForAttendees);
                  return cls ? ` - ${cls.name} (${cls.time})` : '';
                })()}
              </h3>
              <Button 
                onClick={handleOpenBulkAttendance}
                className="bg-gym-blue hover:bg-gym-dark-blue"
                size="sm"
              >
                <Users className="h-4 w-4 mr-2" /> Manage Attendance
              </Button>
            </div>
            
            <SelectedClassDetails 
              selectedClassId={selectedClassForAttendees}
              selectedDate={selectedDateForAttendees}
              onManageAttendance={handleOpenBulkAttendance}
            />
          </div>
        )}
        
        {!selectedClassForAttendees && (
          <div className="border rounded-md text-center py-8 text-gray-500">
            <p>Select a class to view attendees</p>
          </div>
        )}
      </div>
      
      {/* Bulk Attendance Dialog */}
      <BulkAttendanceDialog
        isOpen={isBulkAttendanceOpen}
        onOpenChange={setIsBulkAttendanceOpen}
        selectedClass={selectedClassForAttendees}
        selectedDate={selectedDateForAttendees}
      />
    </div>
  );
};
