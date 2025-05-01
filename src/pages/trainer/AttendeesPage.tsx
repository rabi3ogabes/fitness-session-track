
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { BulkAttendanceDialog } from "./components/BulkAttendanceDialog";
import { DateNavigator } from "./components/attendees/DateNavigator";
import { UpcomingClassesList } from "./components/attendees/UpcomingClassesList";
import { getUpcomingClasses } from "./components/attendees/attendeesUtils";
import { Users } from "lucide-react";

const AttendeesPage = () => {
  const { isTrainer, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [selectedDateForAttendees, setSelectedDateForAttendees] = useState<Date>(new Date());
  const [selectedClassForAttendees, setSelectedClassForAttendees] = useState<number | null>(null);
  const [isBulkAttendanceOpen, setIsBulkAttendanceOpen] = useState(false);
  
  // Check authentication and redirect if necessary
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    
    if (isAuthenticated && !isTrainer) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, isTrainer, navigate]);
  
  const upcomingClasses = getUpcomingClasses(selectedDateForAttendees);
  
  const handleClassSelect = (classId: number, date: Date) => {
    setSelectedClassForAttendees(classId);
    setSelectedDateForAttendees(date);
    // Immediately open the attendance management popup when a class is selected
    setIsBulkAttendanceOpen(true);
  };
  
  // If still checking authentication, don't render anything yet
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <DashboardLayout title="Attendees Management">
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-xl font-bold">Class Attendees</h2>
            <DateNavigator 
              selectedDate={selectedDateForAttendees}
              onDateChange={setSelectedDateForAttendees}
            />
          </div>
          
          {/* Upcoming Classes Section - Calendar view */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-3">Class Calendar</h3>
            <UpcomingClassesList 
              upcomingClasses={upcomingClasses}
              selectedClassForAttendees={selectedClassForAttendees}
              selectedDateForAttendees={selectedDateForAttendees}
              onClassSelect={handleClassSelect}
            />
          </div>
        </div>
        
        {/* Bulk Attendance Dialog */}
        <BulkAttendanceDialog
          isOpen={isBulkAttendanceOpen}
          onOpenChange={setIsBulkAttendanceOpen}
          selectedClass={selectedClassForAttendees}
          selectedDate={selectedDateForAttendees}
        />
      </div>
    </DashboardLayout>
  );
};

export default AttendeesPage;
