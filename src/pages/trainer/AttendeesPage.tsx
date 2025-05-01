
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { format } from "date-fns";
import { BulkAttendanceDialog } from "./components/BulkAttendanceDialog";
import { DateNavigator } from "./components/attendees/DateNavigator";
import { UpcomingClassesList } from "./components/attendees/UpcomingClassesList";
import { SelectedClassDetails } from "./components/attendees/SelectedClassDetails";
import { getUpcomingClasses } from "./components/attendees/attendeesUtils";
import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockClasses } from "./mockData";

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
          
          {/* Upcoming Classes Box Grid */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-3">Upcoming Classes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {upcomingClasses.flatMap(dayClasses => 
                dayClasses.classes.map(cls => (
                  <Card 
                    key={`${cls.id}-${format(dayClasses.date, 'yyyy-MM-dd')}`}
                    className={`cursor-pointer transition-all border-2 ${
                      cls.id === selectedClassForAttendees ? 
                      "border-gym-blue bg-gym-light" : 
                      "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => handleClassSelect(cls.id, dayClasses.date)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{cls.name}</h4>
                        <Badge>{cls.enrolled} members</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{format(dayClasses.date, "MMM d")}, {cls.time}</p>
                      <p className="text-xs text-gray-500">Trainer: {cls.trainer}</p>
                      
                      <div className="mt-3 w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            cls.enrolled / cls.capacity >= 0.9 ? "bg-red-500" : 
                            cls.enrolled / cls.capacity >= 0.7 ? "bg-amber-500" : 
                            "bg-green-500"
                          }`}
                          style={{ width: `${(cls.enrolled / cls.capacity) * 100}%` }}
                        ></div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
              
              {upcomingClasses.flatMap(day => day.classes).length === 0 && (
                <div className="col-span-full text-center py-8 border rounded-md">
                  <p className="text-gray-500">No upcoming classes scheduled</p>
                </div>
              )}
            </div>
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
    </DashboardLayout>
  );
};

export default AttendeesPage;
