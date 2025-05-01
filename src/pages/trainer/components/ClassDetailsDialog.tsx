
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
import { mockClasses, getBookingsForClass } from "../mockData";
import { BulkAttendanceManager } from "./BulkAttendanceManager";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
        // Fix type issue by using '.eq()' with string values
        const { count, error } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('class_id', String(selectedClass));
          
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
      <DialogContent className="sm:max-w-[600px]">
        {cls ? (
          <>
            <DialogHeader>
              <DialogTitle>{cls.name}</DialogTitle>
              <DialogDescription>
                {format(cls.date, "EEEE, MMMM d, yyyy")} • {cls.time} • {bookings}/{cls.capacity} enrolled
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
