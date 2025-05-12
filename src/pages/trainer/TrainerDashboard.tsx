import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { CalendarSection } from "./components/CalendarSection";
import { ClassDetailsDialog } from "./components/ClassDetailsDialog";
import NewMemberDialog from "./components/NewMemberDialog";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ClassesSection } from "./components/ClassesSection";

const TrainerDashboard = () => {
  const { isTrainer, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"today" | "tomorrow" | "all">("today");
  
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
  
  // Fetch bookings data from Supabase
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      
      try {
        setIsDataLoading(true);
        
        // Get all bookings for classes where this trainer is assigned
        const { data: trainerData, error: trainerError } = await supabase
          .from('trainers')
          .select('id')
          .eq('email', user.email)
          .single();
          
        if (trainerError) {
          console.error('Error fetching trainer data:', trainerError);
          toast({
            title: "Error",
            description: "Failed to verify trainer information.",
            variant: "destructive"
          });
          setIsDataLoading(false);
          return;
        }
        
        if (!trainerData) {
          console.warn('No trainer record found for this user');
          setBookings([]);
          setIsDataLoading(false);
          return;
        }
        
        // Separate queries instead of relationship that's causing errors
        // First get classes for this trainer
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select('*')
          .eq('trainer_id', trainerData.id);
          
        if (classesError) {
          console.error('Error fetching classes:', classesError);
          toast({
            title: "Error",
            description: "Failed to load your classes. Please try again.",
            variant: "destructive"
          });
          setIsDataLoading(false);
          return;
        }
        
        // Then get bookings for these classes
        if (classesData && classesData.length > 0) {
          const classIds = classesData.map(cls => cls.id);
          
          const { data: bookingsData, error: bookingsError } = await supabase
            .from('bookings')
            .select('*, user:user_id(name, email)')
            .in('class_id', classIds);
            
          if (bookingsError) {
            console.error('Error fetching bookings:', bookingsError);
            toast({
              title: "Error",
              description: "Failed to load booking information. Please try again.",
              variant: "destructive"
            });
            setIsDataLoading(false);
            return;
          }
          
          // Process bookings and add class information
          const processedBookings = bookingsData ? bookingsData.map(booking => {
            const relatedClass = classesData.find(c => c.id === booking.class_id);
            return {
              ...booking,
              class: relatedClass?.name || "Unknown class",
              date: relatedClass?.schedule || format(new Date(), "yyyy-MM-dd"),
              time: relatedClass?.start_time || "Unknown time"
            };
          }) : [];
          
          console.log('Fetched bookings:', processedBookings);
          setBookings(processedBookings);
        } else {
          console.log('No classes found for this trainer');
          setBookings([]);
        }
      } catch (error) {
        console.error('Error fetching trainer bookings:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred while loading data.",
          variant: "destructive"
        });
      } finally {
        setIsDataLoading(false);
      }
    };
    
    if (isAuthenticated && isTrainer && user) {
      fetchBookings();
    }
  }, [isAuthenticated, isTrainer, user, toast]);
  
  // Handler for viewing class details to ensure dialog opens
  const handleViewClassDetails = (classId: number) => {
    setSelectedClass(classId);
    setIsClassDetailsOpen(true);
  };
  
  const handleRegisterMember = async (newMember: any) => {
    try {
      // Generate a UUID for the new profile
      const { data: newUUID, error: uuidError } = await supabase.rpc('generate_uuid');
      
      if (uuidError) {
        console.error("Error generating UUID:", uuidError);
        toast({
          title: "Registration Failed",
          description: "Could not create member profile.",
          variant: "destructive"
        });
        return;
      }
      
      // Create a new profile in the database with the generated UUID
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: newUUID,
          email: newMember.email,
          name: newMember.name,
          phone_number: newMember.phone || ''
        })
        .select();
        
      if (profileError) {
        console.error("Error creating profile:", profileError);
        toast({
          title: "Registration Failed",
          description: "Could not create member profile.",
          variant: "destructive"
        });
        return;
      }
      
      // Also add to members table for admin view
      await supabase
        .from('members')
        .insert({
          name: newMember.name,
          email: newMember.email,
          phone: newMember.phone || '',
          birthday: newMember.dob || null,
          membership: "Basic",
          sessions: 4,
          remaining_sessions: 4,
          status: "Active",
          gender: newMember.gender || "Not specified"
        });
      
      toast({
        title: "Member Registered",
        description: `${newMember.name} has been successfully registered.`,
      });
      
      setIsNewMemberDialogOpen(false);
    } catch (error) {
      console.error("Error registering member:", error);
      toast({
        title: "Registration Failed",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    }
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
      
      <div className="grid grid-cols-1 gap-6">
        <CalendarSection 
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          bookings={bookings}
          handleViewClassDetails={handleViewClassDetails}
        />
        
        <ClassesSection
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          viewMode={viewMode}
          setViewMode={setViewMode}
          handleViewClassDetails={handleViewClassDetails}
        />
      </div>
      
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
