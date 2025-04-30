
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Save, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Mock data - in a real app, this would come from your data store
const mockClassAttendees = [
  { id: 101, member: "John Smith", email: "john@example.com", phone: "555-1234", status: "Confirmed", isPresent: false },
  { id: 102, member: "Mary Johnson", email: "mary@example.com", phone: "555-2345", status: "Confirmed", isPresent: false },
  { id: 103, member: "Robert Williams", email: "robert@example.com", phone: "555-3456", status: "Present", isPresent: true },
  { id: 104, member: "Jennifer Brown", email: "jennifer@example.com", phone: "555-4567", status: "Confirmed", isPresent: false },
  { id: 105, member: "Michael Davis", email: "michael@example.com", phone: "555-5678", status: "Absent", isPresent: false },
];

interface AdminBulkAttendanceProps {
  className?: string;
  classId?: number;
  date?: Date;
}

export const AdminBulkAttendance = ({ className, classId, date = new Date() }: AdminBulkAttendanceProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [attendees, setAttendees] = useState(mockClassAttendees);
  const [selectAll, setSelectAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize data when dialog opens
  useEffect(() => {
    if (isOpen) {
      // In a real app, you would fetch data for the specific class and date
      setIsLoading(true);
      
      // Simulate API call delay
      setTimeout(() => {
        // Check if any attendees are already marked present
        const hasPresent = mockClassAttendees.some(a => a.isPresent);
        setSelectAll(hasPresent && mockClassAttendees.every(a => a.isPresent));
        setAttendees(mockClassAttendees);
        setIsLoading(false);
      }, 500);
    }
  }, [isOpen]);

  const handleToggleAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    
    setAttendees(prev => 
      prev.map(item => ({
        ...item,
        isPresent: newSelectAll
      }))
    );
  };

  const handleToggleAttendee = (id: number, value: boolean) => {
    setAttendees(prev => 
      prev.map(item => 
        item.id === id ? { ...item, isPresent: value } : item
      )
    );
    
    // Update selectAll state based on all items
    const updatedAttendees = attendees.map(item => 
      item.id === id ? { ...item, isPresent: value } : item
    );
    
    setSelectAll(updatedAttendees.every(item => item.isPresent));
  };

  const handleSaveAttendance = () => {
    setIsLoading(true);
    
    // In a real app, this would be an API call
    setTimeout(() => {
      setIsLoading(false);
      setIsOpen(false);
      
      const presentCount = attendees.filter(a => a.isPresent).length;
      const absentCount = attendees.length - presentCount;
      
      toast({
        title: "Attendance updated",
        description: `Marked ${presentCount} attendees present and ${absentCount} absent.`,
      });
    }, 600);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className={`bg-gym-blue hover:bg-gym-dark-blue ${className}`}
          onClick={() => setIsOpen(true)}
        >
          <Users className="h-4 w-4 mr-2" /> Bulk Attendance
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Class Attendance</DialogTitle>
          <DialogDescription>
            {classId ? `Class #${classId}` : "Selected Class"} • {date ? format(date, "MMMM d, yyyy") : "Today"}
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-gym-blue border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="space-y-4">
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
                    <TableHead className="hidden md:table-cell">Contact</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendees.map((attendee) => (
                    <TableRow key={attendee.id}>
                      <TableCell>
                        <Checkbox 
                          checked={attendee.isPresent} 
                          onCheckedChange={(checked) => handleToggleAttendee(attendee.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{attendee.member}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-sm text-gray-500">{attendee.email}</div>
                        <div className="text-xs text-gray-400">{attendee.phone}</div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          attendee.status === "Present" 
                            ? "bg-green-100 text-green-800" 
                            : attendee.status === "Absent" 
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {attendee.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {attendees.filter(a => a.isPresent).length} of {attendees.length} members marked present
              </div>
              <Button 
                onClick={handleSaveAttendance} 
                disabled={isLoading}
                className="bg-gym-blue hover:bg-gym-dark-blue"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Saving
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> 
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
