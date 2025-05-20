import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock, User, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const BulkAttendanceDialog = ({
  isOpen,
  onOpenChange,
  selectedClass,
  selectedDate,
}) => {
  const { toast } = useToast();
  const [classDetails, setClassDetails] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch class details and attendees when dialog opens and class is selected
  useEffect(() => {
    const fetchClassDetailsAndAttendees = async () => {
      if (!isOpen || !selectedClass) return;

      setIsLoading(true);

      try {
        // Fetch class details
        const { data: classData, error: classError } = await supabase
          .from("classes")
          .select("*")
          .eq("id", selectedClass)
          .single();

        if (classError) throw classError;
        setClassDetails(classData);

        // Fetch attendees for this class
        const { data: attendeesData, error: attendeesError } = await supabase
          .from("bookings")
          .select("*")
          .eq("class_id", selectedClass)
          .in("status", ["confirmed", "Confirmed", "Active"]);

        if (attendeesError) throw attendeesError;
        setAttendees(attendeesData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load class details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassDetailsAndAttendees();
  }, [isOpen, selectedClass]);

  const handleMarkAttendance = async (bookingId, attended) => {
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

      if (error) throw error;

      // Update local state to reflect change
      setAttendees((prev) =>
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

  const handleCancelBooking = async (bookingDetails) => {
    if (!classDetails || !bookingDetails) return;

    try {
      const classHour = parseInt(classDetails.start_time?.split(":")[0] || "0");
      const classMinute = parseInt(
        classDetails.start_time?.split(":")[1] || "0"
      );
      const now = new Date();

      const classDate = new Date(classDetails.schedule);
      classDate.setHours(classHour, classMinute, 0, 0);

      const hoursDifference =
        (classDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Assuming cancellationTimeLimit is defined elsewhere, if not, use a default
      const cancellationTimeLimit = 4; // 24 hours before class

      if (hoursDifference < cancellationTimeLimit) {
        toast({
          title: "Cannot cancel class",
          description: `You can only cancel classes ${cancellationTimeLimit} hours or more before they start.`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Processing cancellation...",
        description: `Cancelling ${bookingDetails.user_name}'s class booking.`,
      });

      // Update booking status to cancelled
      const { error: updateError } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingDetails.id);

      if (updateError) throw updateError;

      // Update class enrollment count
      const { error: classUpdateError } = await supabase
        .from("classes")
        .update({
          enrolled: classDetails.enrolled > 0 ? classDetails.enrolled - 1 : 0,
        })
        .eq("id", classDetails.id);

      if (classUpdateError) {
        console.error("Error updating class enrollment:", classUpdateError);
      }

      // Update the member's remaining sessions
      try {
        const { data: memberData, error: memberError } = await supabase
          .from("members")
          .select("email, name, remaining_sessions")
          .eq("name", bookingDetails.user_name)
          .single();

        if (memberError) {
          console.error("Error fetching member data:", memberError);
        } else if (memberData) {
          // Increment the remaining sessions by 1
          const newRemainingSession = (memberData.remaining_sessions || 0) + 1;

          const { error: updateError } = await supabase
            .from("members")
            .update({ remaining_sessions: newRemainingSession })
            .eq("email", memberData.email);

          if (updateError) {
            console.error("Error updating member sessions:", updateError);
          }
        }
      } catch (err) {
        console.error("Error updating member sessions:", err);
      }

      // Update attendees list in UI by removing the cancelled booking
      setAttendees((prevAttendees) =>
        prevAttendees.filter((attendee) => attendee.id !== bookingDetails.id)
      );

      toast({
        title: "Class cancelled",
        description: `You've successfully cancelled ${bookingDetails.user_name}'s class booking.`,
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Class Attendees</DialogTitle>
          <DialogDescription>
            {classDetails && (
              <div className="mt-2">
                <div className="flex items-center text-sm mb-1">
                  <span className="font-medium">{classDetails.name}</span>
                </div>
                <div className="flex flex-col xs:flex-row text-xs text-gray-500 gap-2">
                  <span className="flex items-center">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {format(
                      classDetails.schedule
                        ? new Date(classDetails.schedule)
                        : selectedDate,
                      "MMMM d, yyyy"
                    )}
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {classDetails.start_time && classDetails.end_time
                      ? `${classDetails.start_time} - ${classDetails.end_time}`
                      : classDetails.time || "No time specified"}
                  </span>
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-6">
            <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Loading attendees...</p>
          </div>
        ) : attendees.length > 0 ? (
          <div className="space-y-4 mt-4">
            <div className="text-sm font-medium">
              {attendees.length}{" "}
              {attendees.length === 1 ? "Attendee" : "Attendees"}
            </div>

            {attendees.map((attendee) => (
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
                      onClick={() => handleCancelBooking(attendee)}
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
                      attendee.attendance === true ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleMarkAttendance(attendee.id, true)}
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
                      attendee.attendance === false ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleMarkAttendance(attendee.id, false)}
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
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500">No attendees found for this class</p>
          </div>
        )}

        <DialogFooter className="sm:justify-start">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
