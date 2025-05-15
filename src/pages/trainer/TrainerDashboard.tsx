
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
import { Tables } from "@/integrations/supabase/types";

// Define an interface for the expected parameter type
interface NewMember {
  name: string;
  // Add other properties that might exist in the newMember object
  email?: string;
  phone?: string;
}

const TrainerDashboard = () => {
  const { isTrainer, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [bookings, setBookings] = useState<any[]>(mockBookings); // Using any[] to avoid type issues for now
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  
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
  
  // Handler for viewing class details to ensure dialog opens
  const handleViewClassDetails = (classId: number) => {
    setSelectedClass(classId);
    setIsClassDetailsOpen(true);
  };
  
  const handleRegisterMember = (newMember: NewMember) => {
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
    
    // Show confirmation toast
    toast({
      title: "Member registered",
      description: `${newMember.name} has been successfully registered.`,
      variant: "default"
    });
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
        onMemberAdded={handleRegisterMember}
      />
    </DashboardLayout>
  );
};

export default TrainerDashboard;
