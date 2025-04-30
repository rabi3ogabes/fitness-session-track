
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { format } from "date-fns";
import { CalendarSection } from "./components/CalendarSection";
import { ClassesSection } from "./components/ClassesSection";
import { AttendeesSection } from "./components/AttendeesSection";
import { ClassDetailsDialog } from "./components/ClassDetailsDialog";
import { NewMemberDialog, NewMemberButton } from "./components/NewMemberDialog";
import { mockBookings } from "./mockData";

const TrainerDashboard = () => {
  const { isTrainer, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [bookings, setBookings] = useState(mockBookings);
  const [viewMode, setViewMode] = useState<"today" | "tomorrow" | "all">("today");
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  
  // New member registration dialog
  const [isNewMemberDialogOpen, setIsNewMemberDialogOpen] = useState(false);
  const [isClassDetailsOpen, setIsClassDetailsOpen] = useState(false);
  
  // State for attendees view
  const [selectedClassForAttendees, setSelectedClassForAttendees] = useState<number | null>(null);
  const [selectedDateForAttendees, setSelectedDateForAttendees] = useState<Date>(new Date());
  
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
    console.log("Opening dialog for class:", classId, "Dialog state:", isClassDetailsOpen);
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
  
  // If still checking authentication, don't render anything yet
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <DashboardLayout title="Trainer Dashboard">
      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="classes">Classes & Bookings</TabsTrigger>
          <TabsTrigger value="attendees">Attendees</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar">
          <div className="flex justify-end mb-4">
            <NewMemberButton onClick={() => setIsNewMemberDialogOpen(true)} />
          </div>
          <CalendarSection 
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            bookings={bookings}
            handleViewClassDetails={handleViewClassDetails}
          />
        </TabsContent>
        
        <TabsContent value="classes">
          <ClassesSection 
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            viewMode={viewMode}
            setViewMode={setViewMode}
            handleViewClassDetails={handleViewClassDetails}
          />
        </TabsContent>
        
        <TabsContent value="attendees">
          <AttendeesSection 
            selectedDateForAttendees={selectedDateForAttendees}
            setSelectedDateForAttendees={setSelectedDateForAttendees}
            selectedClassForAttendees={selectedClassForAttendees}
            setSelectedClassForAttendees={setSelectedClassForAttendees}
          />
        </TabsContent>
      </Tabs>
      
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
        onRegister={handleRegisterMember}
      />
    </DashboardLayout>
  );
};

export default TrainerDashboard;
