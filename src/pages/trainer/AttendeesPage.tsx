import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { BulkAttendanceDialog } from "./components/BulkAttendanceDialog";
import { DateNavigator } from "./components/attendees/DateNavigator";
import { UpcomingClassesList } from "./components/attendees/UpcomingClassesList";
import { Users, Calendar, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, isSameDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const AttendeesPage = () => {
  const { isTrainer, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [classes, setClasses] = useState([]);
  const [classesForSelectedDate, setClassesForSelectedDate] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState(null);
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

  // Fetch all classes for the trainer
  useEffect(() => {
    const fetchAllClasses = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from("classes")
          .select("*")
          .eq("status", "Active")
          .order("schedule", { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          // Filter classes for this trainer
          const filteredClasses = data.filter(
            (cls) =>
              cls.trainer === user.email ||
              cls.trainer === user.name ||
              (cls.trainers &&
                Array.isArray(cls.trainers) &&
                cls.trainers.includes(user.id))
          );

          setClasses(filteredClasses);
        } else {
          setClasses([]);
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
        toast({
          title: "Error",
          description: "Failed to load classes. Please try again.",
          variant: "destructive",
        });
        setClasses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllClasses();
  }, [user]);

  // Filter classes for the selected date
  useEffect(() => {
    if (classes.length > 0) {
      const filteredClasses = classes.filter((cls) => {
        const classDate = new Date(cls.schedule);
        return isSameDay(classDate, selectedDate);
      });

      setClassesForSelectedDate(filteredClasses);
    } else {
      setClassesForSelectedDate([]);
    }
  }, [selectedDate, classes]);

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
  };

  const handleClassSelect = (classId) => {
    setSelectedClassId(classId);
    setIsBulkAttendanceOpen(true);
  };

  // If still checking authentication, don't render anything yet
  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout title="Attendees Management">
      <div className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center">
                <Users className="mr-2 h-5 w-5 text-purple-500" />
                Class Attendees
              </div>
              <div className="text-sm font-normal text-gray-500">
                {format(selectedDate, "MMM d, yyyy")}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h3 className="font-medium">Select Date</h3>
              <DateNavigator
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
              />
            </div>

            {/* Class list for selected date */}
            <div className="mt-6">
              <h3 className="font-medium mb-3 flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                {isLoading
                  ? "Loading classes..."
                  : `Classes on ${format(selectedDate, "MMMM d, yyyy")}`}
              </h3>

              <div className="space-y-3">
                {isLoading ? (
                  Array(3)
                    .fill(0)
                    .map((_, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-md border-l-4 border-gray-200"
                      >
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <div className="flex gap-2">
                          <Skeleton className="h-4 w-1/4" />
                          <Skeleton className="h-4 w-1/4" />
                        </div>
                      </div>
                    ))
                ) : classesForSelectedDate.length > 0 ? (
                  classesForSelectedDate.map((cls) => {
                    const classDate = new Date(cls.schedule);
                    const timeDisplay =
                      cls.start_time && cls.end_time
                        ? `${cls.start_time} - ${cls.end_time}`
                        : cls.time || "No time specified";

                    return (
                      <div
                        key={cls.id}
                        className="bg-gray-50 p-3 rounded-md border-l-4 border-purple-500 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleClassSelect(cls.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{cls.name}</p>
                            <div className="flex flex-col xs:flex-row text-xs text-gray-500">
                              <span className="flex items-center mr-2">
                                <Calendar className="h-3 w-3 mr-1" />
                                {format(classDate, "MMM d, yyyy")}
                              </span>
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {timeDisplay}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-white">
                              {cls.enrolled || 0}/{cls.capacity || 10}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-gray-500 text-center py-6 bg-gray-50 rounded-md border border-dashed border-gray-300">
                    <p>No classes scheduled for this date</p>
                    <p className="text-xs mt-1">Select another date</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Attendance Dialog */}
        <BulkAttendanceDialog
          isOpen={isBulkAttendanceOpen}
          onOpenChange={setIsBulkAttendanceOpen}
          selectedClass={selectedClassId}
          selectedDate={selectedDate}
        />
      </div>
    </DashboardLayout>
  );
};

export default AttendeesPage;
