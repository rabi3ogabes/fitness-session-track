import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock, User, CheckCircle, XCircle } from "lucide-react";
import {
  format,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
} from "date-fns";
import { cn } from "@/lib/utils";
import { mockClasses, isDayWithClass, getClassesForDate } from "../mockData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cancelClassBooking, supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface CalendarSectionProps {
  selectedDate: Date;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
  bookings: any[];
  handleViewClassDetails: (classId: number) => void;
}
// System settings - get from localStorage with fallback
const getSystemSettings = () => {
  const saved = localStorage.getItem('systemSettings');
  if (saved) {
    return JSON.parse(saved);
  }
  return {
    cancellationTimeLimit: 4, // hours before class starts
  };
};

const systemSettings = getSystemSettings();
interface UserData {
  name: string;
  remainingSessions: number;
  totalSessions: number;
}
export const CalendarSection = ({
  selectedDate,
  setSelectedDate,
  bookings,
  handleViewClassDetails,
}: CalendarSectionProps) => {
  const [calendarDate, setCalendarDate] = useState<Date>(
    new Date(selectedDate)
  );
  const [attendeesDialogOpen, setAttendeesDialogOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedClassDetails, setSelectedClassDetails] = useState<any>(null);
  const [classAttendees, setClassAttendees] = useState<any[]>([]);
  const [isLoadingAttendees, setIsLoadingAttendees] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [trainerClasses, setTrainerClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [classesForSelectedDate, setClassesForSelectedDate] = useState<any[]>(
    []
  );
  const [userData, setUserData] = useState<UserData>({
    name: "User",
    remainingSessions: 0,
    totalSessions: 0,
  });
  const [bookedClasses, setBookedClasses] = useState<number[]>([]);
  const userIds = classAttendees.map((id) => id.user_id);
  const dataInfo = classesForSelectedDate.map((item) => ({
    id: item.id,
    start_item: item.start_time,
    name: item.name,
  }));

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
          const filteredClasses = data.filter(
            (cls) =>
              cls.trainer === user.email ||
              cls.trainer === user.name ||
              (cls.trainers &&
                Array.isArray(cls.trainers) &&
                cls.trainers.includes(user.id))
          );

          setTrainerClasses(filteredClasses);
          const id = filteredClasses.map((item) => item.id);
          setAllClasses(id);
        } else {
          setTrainerClasses([]);
        }
      } catch (error) {
        setTrainerClasses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllClasses();
  }, [user]);

  const userNames = classAttendees.map((id) => id.user_name);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("members")
        .select("email, name, total_sessions, remaining_sessions, sessions");
      console.log(data, "data");

      const matchedUsers = data.filter((item) => userNames.includes(item.name));

      console.log(matchedUsers, "matched users");

      // Check if we have any matched users
      if (matchedUsers.length > 0) {
        // Option 1: Use the first matched user
        const firstUser = matchedUsers[0];
        setUserData({
          name: firstUser.name || "User",
          remainingSessions: firstUser.remaining_sessions || 0,
          totalSessions: firstUser.sessions || 20,
        });

        // Option 2: If you need to work with all matched users, store them in state
        // setMatchedUsersList(matchedUsers);
      } else {
        // No matched users found
        setUserData({
          name: "User",
          remainingSessions: 0,
          totalSessions: 20,
        });
      }
    };

    fetchData();
  }, [JSON.stringify(userNames)]);
  useEffect(() => {
    if (trainerClasses.length > 0) {
      const filteredClasses = trainerClasses.filter((cls) => {
        const classDate = new Date(cls.schedule);
        return isSameDay(classDate, selectedDate);
      });

      setClassesForSelectedDate(filteredClasses);
    } else {
      setClassesForSelectedDate([]);
    }
  }, [selectedDate, trainerClasses]);

  const handlePreviousMonth = () => {
    setCalendarDate((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate((prev) => addMonths(prev, 1));
  };

  const daysWithClasses =
    trainerClasses.length > 0
      ? trainerClasses.reduce((acc, cls) => {
          const classDate = new Date(cls.schedule);
          const dateKey = format(classDate, "yyyy-MM-dd");

          if (!acc[dateKey]) {
            acc[dateKey] = [];
          }

          acc[dateKey].push(cls);
          return acc;
        }, {} as Record<string, any[]>)
      : mockClasses.reduce((acc, cls) => {
          const classDate =
            typeof cls.date === "string" ? parseISO(cls.date) : cls.date;
          const dateKey = format(classDate, "yyyy-MM-dd");

          if (!acc[dateKey]) {
            acc[dateKey] = [];
          }

          acc[dateKey].push(cls);
          return acc;
        }, {} as Record<string, any[]>);

  // Generate calendar data
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(calendarDate);
    const monthEnd = endOfMonth(calendarDate);
    const startDate = monthStart;
    const endDate = monthEnd;

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const startDay = getDay(monthStart);

    // Add empty cells for days before the start of month
    const prevMonthDays = Array(startDay).fill(null);

    // Calculate days needed to complete the last row
    const daysAfter = (7 - ((days.length + startDay) % 7)) % 7;
    const nextMonthDays = Array(daysAfter).fill(null);

    return { prevMonthDays, currentMonthDays: days, nextMonthDays };
  };

  const { prevMonthDays, currentMonthDays, nextMonthDays } =
    generateCalendarDays();

  const handleClassClick = async (classId: number, classDetails: any) => {
    setSelectedClassId(classId);
    setSelectedClassDetails(classDetails);
    setIsLoadingAttendees(true);
    setAttendeesDialogOpen(true);

    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("class_id", classId)
        .in("status", ["confirmed", "Confirmed", "Active"]);
      console.log(data, "data");
      if (error) throw error;

      // console.log("Class attendees:", data);

      if (data && data.length > 0) {
        setClassAttendees(data);
      } else {
        setClassAttendees([]);
      }
    } catch (error) {
      console.error("Error fetching class attendees:", error);
      toast({
        title: "Error",
        description: "Failed to load class attendees. Please try again.",
        variant: "destructive",
      });
      setClassAttendees([]);
    } finally {
      setIsLoadingAttendees(false);
    }
  };

  useEffect(() => {
    const fetchBookings = async () => {
      if (!userIds || userIds.length === 0) return;
      const { data, error } = await supabase
        .from("bookings")
        .select("class_id")
        .in("user_id", userIds)
        .eq("status", "confirmed");

      if (error) {
        console.error("Error fetching bookings:", error.message);
        return;
      }

      const bookedClassIds = data?.map((booking) => booking.class_id) || [];
      setBookedClasses((prev) => {
        const areEqual =
          prev.length === bookedClassIds.length &&
          prev.every((id) => bookedClassIds.includes(id));
        return areEqual ? prev : bookedClassIds;
      });
    };

    fetchBookings();
  }, [userIds]);

  const handleCancelBooking = async (
    classId: number,
    classTime: string,
    userName: string,
    user_id: string,
    user_name: string
  ) => {
    console.log(classId, classTime, userName, user_id, user_name, "userData");

    if (!classId) return;

    try {
      const classHour = parseInt(classTime.split(":")[0]);
      const classMinute = parseInt(classTime.split(":")[1] || "0");
      const now = new Date();

      const classToCancel = trainerClasses.find((cls) => cls.id === classId);
      if (!classToCancel) {
        toast({
          title: "Error",
          description: "Could not find class details",
          variant: "destructive",
        });
        return;
      }
      const classDate = new Date(classToCancel.schedule);
      classDate.setHours(classHour, classMinute, 0, 0);

      const hoursDifference =
        (classDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursDifference < systemSettings.cancellationTimeLimit) {
        toast({
          title: "Cannot cancel class",
          description: `You can only cancel classes ${systemSettings.cancellationTimeLimit} hours or more before they start.`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Processing cancellation...",
        description: `Cancelling ${user_name}'s class booking.`,
      });

      // Cancel the booking using the proper function that includes notification logic
      const success = await cancelClassBooking(user_id, classId);
      
      if (!success) {
        toast({
          title: "Failed to cancel booking",
          description: "There was an error cancelling the booking. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Remove the user from the attendees list in the UI
      setClassAttendees((prevAttendees) =>
        prevAttendees.filter((attendee) => attendee.user_id !== user_id)
      );

      // Update the enrolled count in classes array
      setTrainerClasses((prevClasses) =>
        prevClasses.map((cls) => ({
          ...cls,
          enrolled:
            cls.id === classId && cls.enrolled
              ? cls.enrolled - 1
              : cls.enrolled,
        }))
      );

      // Update local state for UI
      const updatedBooked = [...bookedClasses.filter((id) => id !== classId)];
      setBookedClasses(updatedBooked);

      toast({
        title: "Class cancelled",
        description: `You've successfully cancelled ${user_name}'s class booking.`,
      });
    } catch (err) {
      console.error("Error in handleCancelBooking:", err);
      toast({
        title: "Failed to cancel booking",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };
  const handleMarkAttendance = async (bookingId: string, attended: boolean) => {
    try {
      console.log(
        `Marking attendance for booking ${bookingId}: ${
          attended ? "attended" : "no show"
        }`
      );

      // Update the booking attendance status
      const { data, error } = await supabase
        .from("bookings")
        .update({ attendance: attended })
        .eq("id", bookingId)
        .select();
      console.log(data, "data");

      if (error) {
        throw error;
      }
      setClassAttendees((prev) =>
        prev.map((attendee) =>
          attendee.id === bookingId
            ? { ...attendee, attendance: attended }
            : attendee
        )
      );

      toast({
        title: "Attendance updated",
        description: `Attendance ${
          attended ? "marked" : "unmarked"
        } successfully.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating attendance:", error);
      toast({
        title: "Error",
        description: "Failed to update attendance. Please try again.",
        variant: "destructive",
      });
    }
  };
  return (
    <div className="w-full">
      <Card className="w-full shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5 text-purple-500" />
              Class Schedule
            </div>
            <div className="text-sm font-normal text-gray-500">
              {format(selectedDate, "MMM d, yyyy")}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="bg-white rounded-lg border p-4 mb-4">
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

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day, i) => (
                <div
                  key={i}
                  className="text-xs font-medium text-gray-500 h-8 flex items-center justify-center"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {prevMonthDays.map((_, index) => (
                <div
                  key={`prev-${index}`}
                  className="h-10 p-1 text-center text-gray-300"
                >
                  <div className="w-full h-full rounded-md flex items-center justify-center">
                    {/* Empty cell */}
                  </div>
                </div>
              ))}

              {currentMonthDays.map((day, index) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const hasClasses = daysWithClasses[dateKey];
                const classCount = hasClasses ? hasClasses.length : 0;
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);

                return (
                  <div
                    key={dateKey}
                    className={cn(
                      "h-10 p-0.5 cursor-pointer",
                      isToday && "font-bold",
                      isSelected && "bg-purple-50 rounded-md",
                      hasClasses && "bg-purple-50/30"
                    )}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className="flex items-center justify-center h-full">
                      <div
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center",
                          isSelected ? "bg-purple-500 text-white" : "",
                          isToday && !isSelected
                            ? "border border-purple-500"
                            : "",
                          hasClasses && !isSelected
                            ? "border-b-2 border-purple-300"
                            : ""
                        )}
                      >
                        {format(day, "d")}
                      </div>
                    </div>
                  </div>
                );
              })}

              {nextMonthDays.map((_, index) => (
                <div
                  key={`next-${index}`}
                  className="h-10 p-1 text-center text-gray-300"
                >
                  <div className="w-full h-full rounded-md flex items-center justify-center">
                    {/* Empty cell */}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-medium mb-3 flex items-center">
              <Clock className="h-4 w-4 mr-2 text-purple-500" />
              {isLoading
                ? "Loading classes..."
                : `Classes on ${format(selectedDate, "MMMM d, yyyy")}`}
            </h3>

            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Loading classes...</p>
                </div>
              ) : classesForSelectedDate.length > 0 ? (
                classesForSelectedDate.map((cls) => {
                  const isBooked = bookings.some(
                    (booking) => booking.class_id === cls.id
                  );

                  // Handle both API data and mock data formats
                  const classDate = cls.schedule
                    ? new Date(cls.schedule)
                    : typeof cls.date === "string"
                    ? parseISO(cls.date)
                    : cls.date;

                  const timeDisplay =
                    cls.start_time && cls.end_time
                      ? `${cls.start_time} - ${cls.end_time}`
                      : cls.time;

                  return (
                    <div
                      key={cls.id}
                      className="bg-gray-50 p-3 rounded-md border-l-4 border-purple-500 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleClassClick(cls.id, cls)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{cls.name}</p>
                          <div className="flex flex-col xs:flex-row text-xs text-gray-500">
                            <span className="flex items-center mr-2">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              {format(classDate, "MMM d, yyyy")}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {timeDisplay}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isBooked && (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-300"
                            >
                              Booked
                            </Badge>
                          )}
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

          {/* Class Attendees Dialog */}
          <Dialog
            open={attendeesDialogOpen}
            onOpenChange={setAttendeesDialogOpen}
          >
            <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Class Attendees</DialogTitle>
                <DialogDescription>
                  {selectedClassDetails && (
                    <div className="mt-2">
                      <div className="flex items-center text-sm mb-1">
                        <span className="font-medium">
                          {selectedClassDetails.name}
                        </span>
                      </div>
                      <div className="flex flex-col xs:flex-row text-xs text-gray-500 gap-2">
                        <span className="flex items-center">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {format(
                            selectedClassDetails.schedule
                              ? new Date(selectedClassDetails.schedule)
                              : selectedDate,
                            "MMMM d, yyyy"
                          )}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {selectedClassDetails.start_time &&
                          selectedClassDetails.end_time
                            ? `${selectedClassDetails.start_time} - ${selectedClassDetails.end_time}`
                            : selectedClassDetails.time || "No time specified"}
                        </span>
                      </div>
                    </div>
                  )}
                </DialogDescription>
              </DialogHeader>

              {isLoadingAttendees ? (
                <div className="text-center py-6">
                  <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Loading attendees...</p>
                </div>
              ) : classAttendees.length > 0 ? (
                <div className="space-y-4 mt-4">
                  <div className="text-sm font-medium">
                    {classAttendees.length}{" "}
                    {classAttendees.length === 1 ? "Attendee" : "Attendees"}
                  </div>

                  {classAttendees.map((attendee) => {
                    const classInfo = dataInfo.find(
                      (item) => item.id === attendee.class_id
                    );
                    console.log(classAttendees, "classAttendees");
                    if (!classInfo) return null;
                    return (
                      <div key={attendee.id} className="border rounded-md p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-gray-400" />
                            <div>
                              <div className="font-medium">
                                {attendee.user_name || "Unknown User"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {attendee.user_email || "No email"}
                              </div>
                            </div>
                          </div>
                          <div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleCancelBooking(
                                  classInfo.id as number,
                                  classInfo.start_item as string,
                                  classInfo.name as string,
                                  attendee.user_id as string,
                                  attendee.user_name as string
                                )
                              }
                              className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 mt-3">
                          <Button
                            variant={
                              attendee.attendance === true
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              handleMarkAttendance(attendee.id, true)
                            }
                            className={cn(
                              "h-8",
                              attendee.attendance === true
                                ? "bg-green-600 hover:bg-green-700"
                                : ""
                            )}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Attended
                          </Button>

                          <Button
                            variant={
                              attendee.attendance === false
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              handleMarkAttendance(attendee.id, false)
                            }
                            className={cn(
                              "h-8",
                              attendee.attendance === false
                                ? "bg-amber-600 hover:bg-amber-700"
                                : ""
                            )}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            No Show
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">
                    No attendees found for this class
                  </p>
                </div>
              )}

              <DialogFooter className="sm:justify-start">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAttendeesDialogOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};
