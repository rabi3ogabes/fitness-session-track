import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Check, Save, X, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client"; // Import Supabase client

interface AttendanceDataItem {
  id: string; // Booking ID (UUID)
  member: string;
  status: string; // Derived from isPresent or booking status
  isPresent: boolean;
}

interface BulkAttendanceProps {
  classId: number | null;
  selectedDate: Date;
  onClose?: () => void;
}

export const BulkAttendanceManager = ({ classId, selectedDate, onClose }: BulkAttendanceProps) => {
  const { toast } = useToast();
  const [attendanceData, setAttendanceData] = useState<AttendanceDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectAll, setSelectAll] = useState(true);

  useEffect(() => {
    if (!classId) {
      setAttendanceData([]);
      return;
    }
    
    setIsLoading(true);
    console.log("Loading attendance data for class:", classId, "date:", format(selectedDate, "yyyy-MM-dd"));
    
    const fetchAttendanceForClass = async () => {
      try {
        const dateStart = new Date(selectedDate);
        dateStart.setHours(0, 0, 0, 0);
        const dateEnd = new Date(selectedDate);
        dateEnd.setHours(23, 59, 59, 999);

        const { data: classBookings, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            id,
            attendance,
            status,
            user_id,
            profiles ( name ) 
          `)
          .eq('class_id', classId)
          .gte('booking_date', dateStart.toISOString())
          .lte('booking_date', dateEnd.toISOString());

        if (bookingsError) throw bookingsError;

        if (classBookings) {
          const mappedAttendance: AttendanceDataItem[] = classBookings.map(booking => ({
            id: booking.id,
            // Use optional chaining here. If types.ts is correct, booking.profiles will be typed.
            // If types.ts is not correct, this ?. won't fix the compile error but is good practice.
            member: booking.profiles?.name || `User ${booking.user_id?.substring(0, 6) || 'Unknown'}`, 
            status: booking.attendance === true ? "Present" : booking.attendance === false ? "Absent" : booking.status || "Booked", 
            isPresent: booking.attendance === null ? true : booking.attendance,
          }));
          
          console.log("Setting initial attendance data from Supabase:", mappedAttendance);
          setAttendanceData(mappedAttendance);
          setSelectAll(mappedAttendance.length > 0 && mappedAttendance.every(item => item.isPresent));
        } else {
          setAttendanceData([]);
          setSelectAll(true); 
        }
      } catch (err) {
        console.error("Error fetching attendance data from Supabase:", err);
        toast({ title: "Error fetching attendance", description: (err as Error).message, variant: "destructive" });
        setAttendanceData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendanceForClass();
  }, [classId, selectedDate, toast]);

  // Handle toggle all attendances
  const handleToggleAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    
    setAttendanceData(prev => 
      prev.map(item => ({
        ...item,
        isPresent: newSelectAll,
        status: newSelectAll ? "Present" : "Absent" // Update status accordingly
      }))
    );
  };

  // Handle individual toggle
  const handleToggleAttendance = (id: string, value: boolean) => { // id is string (UUID)
    setAttendanceData(prev => {
      const newData = prev.map(item => 
        item.id === id ? { ...item, isPresent: value, status: value ? "Present" : "Absent" } : item
      );
      // Update selectAll state based on all items after this change
      const allSelected = newData.every(item => item.isPresent);
      setSelectAll(allSelected);
      return newData;
    });
  };

  // Save all attendance changes
  const handleSaveAttendance = async () => {
    if (!classId || attendanceData.length === 0) return;
    
    setIsSaving(true);
    
    try {
      const updatePromises = attendanceData.map(item =>
        supabase
          .from('bookings')
          .update({ 
            attendance: item.isPresent, 
            // Optionally update status based on attendance. 
            // Example: if marked present, status becomes 'Attended'. If absent, 'Absent - No Show'.
            // This depends on desired workflow. For now, just updating attendance.
            // status: item.isPresent ? 'Attended' : 'Absent - No Show' 
          })
          .eq('id', item.id) 
      );

      const results = await Promise.all(updatePromises);
      
      let hasError = false;
      results.forEach(result => {
        if (result.error) {
          console.error("Error updating attendance for a booking:", result.error);
          hasError = true;
        }
      });

      if (hasError) {
        toast({
          title: "Error saving attendance",
          description: "Some attendance records could not be updated.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Attendance saved",
          description: `Updated attendance for ${attendanceData.length} members.`,
        });
        // Optionally, re-fetch data to confirm, or update local status text
        setAttendanceData(prev => prev.map(item => ({
          ...item,
          status: item.isPresent ? "Present" : "Absent" // Reflect save in status text
        })));
      }
      
      if (onClose) onClose();
    } catch (error) {
      console.error("Error saving attendance to Supabase:", error);
      toast({
        title: "Error saving attendance",
        description: "There was a problem saving the attendance data to the database.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-gym-blue border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (attendanceData.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No bookings found for this class on this date.</p>
        {onClose && (
          <Button variant="outline" onClick={onClose}>Close</Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-gym-blue" />
          <h3 className="text-lg font-medium">
            Bulk Attendance Management
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {attendanceData.filter(a => a.isPresent).length} / {attendanceData.length} present
          </span>
        </div>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <div className="flex items-center">
                  <Checkbox 
                    checked={selectAll} 
                    onCheckedChange={handleToggleAll}
                    id="select-all" 
                  />
                  <label 
                    htmlFor="select-all" 
                    className="ml-2 text-xs font-medium cursor-pointer"
                  >
                    All
                  </label>
                </div>
              </TableHead>
              <TableHead>Member</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead className="w-24 text-right">Present</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendanceData.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Checkbox 
                    checked={item.isPresent} 
                    onCheckedChange={(checked) => handleToggleAttendance(item.id, !!checked)}
                  />
                </TableCell>
                <TableCell className="font-medium">{item.member}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    item.isPresent // Use isPresent for coloring after interaction
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {item.isPresent ? "Present" : "Absent"} {/* Display based on current isPresent state */}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {item.isPresent ? (
                    <Check className="h-5 w-5 text-green-600 ml-auto" />
                  ) : (
                    <X className="h-5 w-5 text-red-600 ml-auto" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex justify-end space-x-2 mt-4">
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button 
          onClick={handleSaveAttendance} 
          disabled={isSaving || attendanceData.length === 0} // Disable if no data
          className="bg-gym-blue hover:bg-gym-dark-blue"
        >
          {isSaving ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Saving
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> 
              Save Attendance
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
