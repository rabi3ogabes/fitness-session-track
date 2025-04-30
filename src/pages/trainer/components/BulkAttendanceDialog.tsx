
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { BulkAttendanceManager } from "./BulkAttendanceManager";

interface BulkAttendanceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedClass: number | null;
  selectedDate: Date;
}

export const BulkAttendanceDialog = ({
  isOpen,
  onOpenChange,
  selectedClass,
  selectedDate,
}: BulkAttendanceDialogProps) => {
  // Get class name for the title
  const getClassName = () => {
    if (!selectedClass) return "";
    
    // This is a simplification - in a real app you would look this up from your data
    return selectedClass === 1 ? "Morning Yoga" : 
           selectedClass === 2 ? "HIIT Workout" : 
           selectedClass === 3 ? "Strength Training" : 
           selectedClass === 4 ? "Pilates" : "Selected Class";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Attendance</DialogTitle>
          <DialogDescription>
            {getClassName()} • {format(selectedDate, "MMMM d, yyyy")}
          </DialogDescription>
        </DialogHeader>
        
        <BulkAttendanceManager 
          classId={selectedClass}
          selectedDate={selectedDate}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
