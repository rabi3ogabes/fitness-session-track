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
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [bookings, setBookings] = useState(mockBookings);
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
  
  const handleRegisterMember = () => { // CHANGED: Removed newMember parameter
    // The original logic that depended on `newMember` argument:
    // const newId = Math.max(...bookings.map(b => b.id)) + 1;
    // const bookingToAdd = {
    //   id: newId,
    //   member: newMember.name, // This would cause an error now
    //   class: "First Session",
    //   date: format(new Date(), "yyyy-MM-dd"),
    //   time: format(new Date(), "h:mm a"),
    //   status: "Present", 
    // };
    // setBookings([...bookings, bookingToAdd]);

    console.warn("handleRegisterMember called, but new member data is not available from NewMemberDialog's onMemberAdded prop. Booking list will not be updated locally with a new 'First Session'.");
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
        onMemberAdded={handleRegisterMember} // This now matches the expected type () => void
      />
    </DashboardLayout>
  );
};

export default TrainerDashboard;
