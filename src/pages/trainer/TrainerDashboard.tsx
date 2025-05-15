import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { CalendarSection } from "./components/CalendarSection";
import { ClassDetailsDialog } from "./components/ClassDetailsDialog";
import NewMemberDialog from "./components/NewMemberDialog";
import { mockBookings } from "./mockData";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const TrainerDashboard = () => {
  const { isTrainer, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [bookings, setBookings] = useState(mockBookings);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // New member registration dialog
  const [isNewMemberDialogOpen, setIsNewMemberDialogOpen] = useState(false);
  const [isClassDetailsOpen, setIsClassDetailsOpen] = useState(false);
  
  // Check authentication and redirect if necessary
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    
    if (isAuthenticated && !isTrainer) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, isTrainer, navigate]);

  // Fetch real bookings from Supabase when authenticated
  useEffect(() => {
    const fetchBookings = async () => {
      if (!isAuthenticated || !user) return;
      
      try {
        setIsLoading(true);
        
        // Get trainer's classes
        const { data: trainerClasses, error: classesError } = await supabase
          .from('classes')
          .select('*')
          .eq('trainer_id', user.id);
          
        if (classesError) {
          console.error("Error fetching trainer classes:", classesError);
          toast({
            title: "Error loading classes",
            description: "Could not load your assigned classes",
            variant: "destructive"
          });
          // Fall back to mock data if there's an error
          return;
        }
        
        if (!trainerClasses || trainerClasses.length === 0) {
          console.log("No classes found for this trainer");
          // If no classes found, we'll use the mock data
          return;
        }
        
        // Get the class IDs
        const classIds = trainerClasses.map(cls => cls.id);
        
        // Get bookings for these classes
        const { data: classBookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .in('class_id', classIds);
          
        if (bookingsError) {
          console.error("Error fetching bookings:", bookingsError);
          // Fall back to mock data if there's an error
          return;
        }
        
        if (classBookings && classBookings.length > 0) {
          setBookings(classBookings);
        } else {
          console.log("No bookings found for trainer classes, using mock data");
          // Keep using mock data if no real bookings
        }
      } catch (error) {
        console.error("Error in fetchBookings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBookings();
  }, [isAuthenticated, user, toast]);
  
  // Handler for viewing class details to ensure dialog opens
  const handleViewClassDetails = (classId: number) => {
    setSelectedClass(classId);
    setIsClassDetailsOpen(true);
  };
  
  const handleRegisterMember = (newMember: any) => {
    // Add a new booking for this member to today's date
    const newId = Math.max(...bookings.map(b => b.id)) + 1;
    const bookingToAdd = {
      id: newId,
      member: newMember.name,
      class: "First Session",
      date: format(new Date(), "yyyy-MM-dd"),
      time: format(new Date(), "h:mm a"),
      status: "Present", // Auto-mark as present
    };
    
    setBookings([...bookings, bookingToAdd]);
    setIsNewMemberDialogOpen(false);
  };

  // Custom NewMemberButton component
  const NewMemberButton = ({ onClick }: { onClick: () => void }) => (
    <Button 
      onClick={onClick}
      className="bg-gym-blue hover:bg-gym-dark-blue flex items-center gap-2"
    >
      <Plus size={16} />
      <span>New Member</span>
    </Button>
  );
  
  // If still checking authentication, don't render anything yet
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <DashboardLayout title="Trainer Dashboard">
      <div className="flex justify-end mb-4">
        <NewMemberButton onClick={() => setIsNewMemberDialogOpen(true)} />
      </div>
      <CalendarSection 
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        bookings={bookings}
        handleViewClassDetails={handleViewClassDetails}
      />
      
      {/* Class details dialog - moved outside tabs to ensure it renders properly */}
      <ClassDetailsDialog 
        isOpen={isClassDetailsOpen}
        onOpenChange={setIsClassDetailsOpen}
        selectedClass={selectedClass}
      />
      
      {/* New member registration dialog */}
      <NewMemberDialog 
        isOpen={isNewMemberDialogOpen}
        onOpenChange={setIsNewMemberDialogOpen}
        onMemberAdded={() => {
          // After member is added, you might want to refresh the list
          // This is a placeholder for any refresh action
          console.log("Member added successfully");
        }}
      />
    </DashboardLayout>
  );
};

export default TrainerDashboard;
