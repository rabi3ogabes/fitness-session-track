
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
import { mockClasses, getBookingsForClass } from "../mockData";
import { BulkAttendanceManager } from "./BulkAttendanceManager";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const { toast } = useToast();
  const [bookings, setBookings] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Helper function to get class data
  const getClassData = () => {
    if (!selectedClass) return null;
    return mockClasses.find(c => c.id === selectedClass);
  };

  // Fetch bookings count for this class
  useEffect(() => {
    const fetchBookingCount = async () => {
      if (!selectedClass || !isOpen) return;
      
      setIsLoading(true);
      
      try {
        // Pass selectedClass directly as a number since class_id is a number type
        const { count, error } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('class_id', selectedClass);
          
        if (error) throw error;
        
        setBookings(count || 0);
      } catch (error) {
        console.error("Error fetching booking count:", error);
        toast({
          title: "Error loading data",
          description: "Could not load booking information.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    // For now, since we're using mock data, we'll set a mock booking count
    // In a real implementation with Supabase, you'd use the fetchBookingCount function
    if (isOpen && selectedClass) {
      const mockBookingCounts: Record<number, number> = {
        1: 8,  // Morning Yoga: 8 bookings
        2: 10, // HIIT Workout: 10 bookings
        3: 5,  // Strength Training: 5 bookings
        4: 6,  // Pilates: 6 bookings
        5: 7   // Boxing: 7 bookings
      };
      
      setBookings(mockBookingCounts[selectedClass] || 0);
    }
  }, [selectedClass, isOpen, toast]);

  const cls = getClassData();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-xl mx-auto p-0 max-h-[90vh]">
        {cls ? (
          <>
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="text-xl">{cls.name}</DialogTitle>
              <DialogDescription className="text-sm">
                {format(cls.date, "EEEE, MMMM d, yyyy")} • {cls.time} • {bookings}/{cls.capacity} enrolled
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="max-h-[calc(90vh-130px)] overflow-y-auto px-6">
              <BulkAttendanceManager 
                classId={selectedClass}
                selectedDate={cls.date}
                onClose={() => onOpenChange(false)}
              />
            </ScrollArea>
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
