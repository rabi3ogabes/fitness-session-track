import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { mockBookings } from "../mockData";
import { format } from "date-fns";
import { Check, Save, X, Users } from "lucide-react";
import { saveAttendanceData, getAttendanceData } from "./attendees/attendeesUtils";

interface BulkAttendanceProps {
  classId: number | null;
  selectedDate: Date;
  onClose?: () => void;
}

export const BulkAttendanceManager = ({ classId, selectedDate, onClose }: BulkAttendanceProps) => {
  const { toast } = useToast();
  const [attendanceData, setAttendanceData] = useState<{ id: number; member: string; status: string; isPresent: boolean }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  // Fetch bookings for the selected class and date
  useEffect(() => {
    if (!classId) return;
    
    setIsLoading(true);
    console.log("Loading attendance data for class:", classId, "date:", format(selectedDate, "yyyy-MM-dd"));
    
    // Format date for storage and lookup
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    
    // Check if we have saved data first
    const savedAttendance = getAttendanceData(classId, formattedDate);
    
    if (savedAttendance) {
      console.log("Using saved attendance data:", savedAttendance);
      // Use saved data if available
      setAttendanceData(savedAttendance);
      setSelectAll(savedAttendance.length > 0 && savedAttendance.every(item => item.isPresent));
      setIsLoading(false);
      return;
    }
    
    // Otherwise use mock data and filter it
    console.log("No saved data found, using mock data");
    // Get bookings for this class and date
    const filteredBookings = mockBookings.filter(booking => 
      booking.date === formattedDate && 
      booking.class === (classId === 1 ? "Morning Yoga" : 
                        classId === 2 ? "HIIT Workout" : 
                        classId === 3 ? "Strength Training" : 
                        classId === 4 ? "Pilates" : "")
    );
    
    const mappedAttendance = filteredBookings.map(booking => ({
      id: booking.id,
      member: booking.member,
      status: booking.status,
      isPresent: booking.status === "Present" || booking.status === "Completed"
    }));
    
    setAttendanceData(mappedAttendance);
    
    // Check if all are present to set selectAll initial state
    const allPresent = mappedAttendance.length > 0 && 
      mappedAttendance.every(item => item.isPresent);
    setSelectAll(allPresent);
    
    setIsLoading(false);
  }, [classId, selectedDate]);

  // Handle toggle all attendances
  const handleToggleAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    
    setAttendanceData(prev => 
      prev.map(item => ({
        ...item,
        isPresent: newSelectAll
      }))
    );
  };

  // Handle individual toggle
  const handleToggleAttendance = (id: number, value: boolean) => {
    setAttendanceData(prev => 
      prev.map(item => 
        item.id === id ? { ...item, isPresent: value } : item
      )
    );
    
    // Update selectAll state based on all items
    const allSelected = attendanceData
      .map(item => item.id === id ? value : item.isPresent)
      .every(Boolean);
    
    setSelectAll(allSelected);
  };

  // Save all attendance changes
  const handleSaveAttendance = () => {
    if (!classId) return;
    
    setIsSaving(true);
    
    // Format date for storage
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    
    // Save attendance data to localStorage for persistence
    const saved = saveAttendanceData(classId, formattedDate, attendanceData);
    
    // In a real app, this would be an API call to update all records
    // For now we'll simulate a delay
    setTimeout(() => {
      // Update would happen here
      setIsSaving(false);
      
      if (saved) {
        toast({
          title: "Attendance saved",
          description: `Updated attendance for ${attendanceData.length} members`,
        });
      } else {
        toast({
          title: "Error saving attendance",
          description: "There was a problem saving the attendance data",
          variant: "destructive"
        });
      }
      
      if (onClose) onClose();
    }, 600);
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
        <p className="text-gray-500 mb-4">No bookings found for this class</p>
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
                    item.status === "Present" || item.status === "Completed" 
                      ? "bg-green-100 text-green-800" 
                      : item.status === "Absent" 
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {item.status}
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
          disabled={isSaving}
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
