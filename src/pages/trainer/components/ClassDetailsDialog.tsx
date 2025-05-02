
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
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
  const [classData, setClassData] = useState<any>(null);
  const [bookings, setBookings] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch class data when selected class changes
  useEffect(() => {
    const fetchClassData = async () => {
      if (!selectedClass || !isOpen) return;
      
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('classes')
          .select('*')
          .eq('id', selectedClass)
          .single();
          
        if (error) {
          console.error("Error fetching class:", error);
          toast({
            title: "Error loading class",
            description: "Could not load class information.",
            variant: "destructive"
          });
          return;
        }
        
        if (data) {
          // Format date string if needed
          setClassData({
            ...data,
            date: new Date(), // This will be replaced with proper date parsing in a real app
            time: `${data.start_time || '00:00'} - ${data.end_time || '00:00'}`
          });
        }
      } catch (error) {
        console.error("Error fetching class data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClassData();
  }, [selectedClass, isOpen, toast]);

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
          
        if (error) {
          console.error("Error fetching booking count:", error);
          toast({
            title: "Error loading data",
            description: "Could not load booking information.",
            variant: "destructive"
          });
          return;
        }
        
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
    
    if (isOpen && selectedClass) {
      fetchBookingCount();
    }
  }, [selectedClass, isOpen, toast]);

  if (isLoading || !classData) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="w-full max-w-xl mx-auto">
          <div className="py-8 text-center">
            <p>{isLoading ? "Loading class data..." : "Class data not found"}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-xl mx-auto p-0 max-h-[90vh]">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl">{classData.name}</DialogTitle>
          <DialogDescription className="text-sm">
            {classData.schedule} • {classData.time} • {bookings}/{classData.capacity} enrolled
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-130px)] overflow-y-auto px-6">
          <BulkAttendanceManager 
            classId={selectedClass}
            selectedDate={classData.date}
            onClose={() => onOpenChange(false)}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
