
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
import { mockClasses, getBookingsForClass } from "../mockData";
import { BulkAttendanceManager } from "./BulkAttendanceManager";

interface ClassDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedClass: number | null;
}

export const ClassDetailsDialog = ({ 
  isOpen, 
  onOpenChange, 
  selectedClass 
}: ClassDetailsDialogProps) => {
  // Helper function to get class data
  const getClassData = () => {
    if (!selectedClass) return null;
    return mockClasses.find(c => c.id === selectedClass);
  };

  const cls = getClassData();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        {cls ? (
          <>
            <DialogHeader>
              <DialogTitle>{cls.name}</DialogTitle>
              <DialogDescription>
                {format(cls.date, "EEEE, MMMM d, yyyy")} • {cls.time} • {cls.enrolled}/{cls.capacity} enrolled
              </DialogDescription>
            </DialogHeader>
            
            <BulkAttendanceManager 
              classId={selectedClass}
              selectedDate={cls.date}
              onClose={() => onOpenChange(false)}
            />
          </>
        ) : (
          <div className="py-8 text-center">
            <p>Class data not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
