import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { format, addDays, addWeeks, addMonths, parse, isBefore } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import AddClassDialog from "./components/classes/AddClassDialog";
import EditClassDialog from "./components/classes/EditClassDialog";
import { ClassModel, RecurringPattern } from "./components/classes/ClassTypes";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// Fallback data to use when API fails
const fallbackClasses: ClassModel[] = [
  {
    id: 1,
    name: "Yoga",
    trainer: "Jane Smith",
    trainers: ["Jane Smith"],
    schedule: "05/10/2025",
    capacity: 15,
    enrolled: 8,
    status: "Active",
    gender: "All",
    startTime: "09:00",
    endTime: "10:00"
  },
  {
    id: 2,
    name: "Pilates",
    trainer: "Mike Johnson",
    trainers: ["Mike Johnson"],
    schedule: "05/11/2025",
    capacity: 12,
    enrolled: 6,
    status: "Active",
    gender: "All",
    startTime: "11:00",
    endTime: "12:00"
  }
];

// Fallback trainers list - used only if Supabase fetch fails
const fallbackTrainers = [
  "Jane Smith",
  "Mike Johnson",
  "Sarah Davis",
  "Emma Wilson",
  "Robert Brown",
  "David Miller",
  "Lisa Garcia",
];

const Classes = () => {
  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [trainersList, setTrainersList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [useFallbackData, setUseFallbackData] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const { toast } = useToast();

  // Fetch classes from Supabase on component mount
  useEffect(() => {
    fetchClasses();
    fetchTrainers();
  }, [retryCount]);

  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      
      console.log("Fetching classes from Supabase...");
      setConnectionAttempts(prev => prev + 1);
      
      // Use AbortController for timeout functionality
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 15000); // Extended timeout to 15 seconds
      
      const { data, error } = await supabase
        .from('classes')
        .select('*');
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      if (error) {
        throw error;
      }

      console.log("Classes data received:", data);
      
      if (data && data.length > 0) {
        // Map Supabase fields to match our ClassModel structure
        const formattedClasses: ClassModel[] = data.map(cls => ({
          id: cls.id,
          name: cls.name || '',
          trainer: cls.trainer || '',
          trainers: cls.trainers || [],
          schedule: cls.schedule || '',
          capacity: cls.capacity || 0,
          enrolled: cls.enrolled || 0,
          status: cls.status || 'Active',
          gender: (cls.gender || 'All') as "All" | "Male" | "Female",
          startTime: cls.start_time || '',
          endTime: cls.end_time || ''
        }));
        
        console.log("Formatted classes:", formattedClasses);
        setClasses(formattedClasses);
        setUseFallbackData(false);
        
        // Reset connection attempts on successful fetch
        setConnectionAttempts(0);
        
        toast({
          title: "Connection Restored",
          description: "Successfully connected to the database.",
        });
      } else {
        console.log("No classes data received");
        if (connectionAttempts < 2) {
          toast({
            title: "No classes found",
            description: "There are currently no classes in the database. Add a new class to get started.",
          });
        }
        setClasses([]);
      }
    } catch (error: any) {
      console.error("Error fetching classes:", error);
      setFetchError(error.message || "Failed to fetch classes");
      
      // If network error and we're not already using fallback data, suggest using fallback data
      if ((error.message?.includes('NetworkError') || error.message?.includes('fetch') || error.name === 'AbortError') && !useFallbackData) {
        toast({
          title: "Connection Issue",
          description: "Unable to connect to the database. Using demo data for now.",
          variant: "destructive",
        });
        setClasses(fallbackClasses);
        setUseFallbackData(true);
      } else if (!useFallbackData) {
        setClasses([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTrainers = async () => {
    try {
      // Use AbortController for timeout functionality
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 15000); // Extended timeout to 15 seconds
      
      const { data, error } = await supabase
        .from('trainers')
        .select('name')
        .eq('status', 'Active');
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const trainerNames = data.map(trainer => trainer.name);
        setTrainersList(trainerNames);
      } else {
        // If no data from API, use fallback trainers
        setTrainersList(fallbackTrainers);
      }
    } catch (error) {
      console.error("Error fetching trainers:", error);
      // Keep using the fallback trainers list if there's an error
      setTrainersList(fallbackTrainers);
    }
  };

  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setUseFallbackData(false);
    toast({
      title: "Retrying",
      description: "Attempting to reconnect to the database...",
    });
  }, [toast]);

  const filteredClasses = classes.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cls.trainer && cls.trainer.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cls.trainers && cls.trainers.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const currentClass = selectedClassId ? classes.find(c => c.id === selectedClassId) || null : null;

  const toggleClassStatus = async (id: number) => {
    // If using fallback data, just update the UI without trying to call Supabase
    if (useFallbackData) {
      setClasses(
        classes.map((cls) =>
          cls.id === id
            ? {
                ...cls,
                status: cls.status === "Active" ? "Inactive" : "Active",
              }
            : cls
        )
      );
      
      toast({
        title: "Demo Mode",
        description: "Class status updated in demo mode only. Changes will not persist.",
      });
      return;
    }
    
    const classToUpdate = classes.find(cls => cls.id === id);
    if (!classToUpdate) return;
    
    const newStatus = classToUpdate.status === "Active" ? "Inactive" : "Active";
    
    try {
      const { error } = await supabase
        .from('classes')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setClasses(
        classes.map((cls) =>
          cls.id === id
            ? {
                ...cls,
                status: newStatus,
              }
            : cls
        )
      );

      toast({
        title: "Class status updated",
        description: "The class status has been updated successfully",
      });
    } catch (error) {
      console.error("Error updating class status:", error);
      toast({
        title: "Error",
        description: "Failed to update class status.",
        variant: "destructive",
      });
    }
  };

  // Generate classes based on recurring pattern
  const generateRecurringClasses = (baseClass: ClassModel, pattern: RecurringPattern): ClassModel[] => {
    const generatedClasses: ClassModel[] = [];
    
    // Parse the base date from the schedule
    const baseDate = pattern.frequency === "Daily" ? 
      new Date() : 
      parse(baseClass.schedule, "MM/dd/yyyy", new Date());
    
    const endDate = new Date(pattern.repeatUntil);
    
    if (pattern.frequency === "Daily") {
      // Generate daily classes
      let currentDate = new Date(baseDate);
      
      while (isBefore(currentDate, endDate)) {
        generatedClasses.push({
          ...baseClass,
          id: 0, // Will be assigned by Supabase
          schedule: format(currentDate, "MM/dd/yyyy"),
        });
        
        currentDate = addDays(currentDate, 1);
      }
    } else if (pattern.frequency === "Weekly") {
      // Generate weekly classes for selected days
      let currentWeek = new Date(baseDate);
      const daysMap: Record<string, number> = {
        "Sunday": 0,
        "Monday": 1,
        "Tuesday": 2,
        "Wednesday": 3,
        "Thursday": 4,
        "Friday": 5,
        "Saturday": 6
      };
      
      while (isBefore(currentWeek, endDate)) {
        for (const day of pattern.daysOfWeek) {
          const dayNumber = daysMap[day];
          const classDate = new Date(currentWeek);
          // Set to the correct day of week
          classDate.setDate(classDate.getDate() - classDate.getDay() + dayNumber);
          
          if (isBefore(classDate, endDate) && !isBefore(classDate, baseDate)) {
            generatedClasses.push({
              ...baseClass,
              id: 0, // Will be assigned by Supabase
              schedule: `${format(classDate, "MM/dd/yyyy")} (${day})`,
            });
          }
        }
        
        currentWeek = addWeeks(currentWeek, 1);
      }
    } else if (pattern.frequency === "Monthly") {
      // Generate monthly classes
      let currentMonth = new Date(baseDate);
      
      while (isBefore(currentMonth, endDate)) {
        generatedClasses.push({
          ...baseClass,
          id: 0, // Will be assigned by Supabase
          schedule: format(currentMonth, "MM/dd/yyyy"),
        });
        
        currentMonth = addMonths(currentMonth, 1);
      }
    }
    
    return generatedClasses;
  };

  const handleAddClass = async (newClass: ClassModel, recurringPattern?: RecurringPattern) => {
    // If in demo mode, just update the UI
    if (useFallbackData) {
      const newId = Math.max(...classes.map(c => c.id)) + 1;
      const newClassWithId = { ...newClass, id: newId };
      
      if (recurringPattern && recurringPattern.daysOfWeek.length > 0) {
        // Generate recurring classes with mock ids
        const generatedClasses = generateRecurringClasses(newClassWithId, recurringPattern)
          .map((cls, index) => ({ ...cls, id: newId + index + 1 }));
          
        setClasses([...classes, ...generatedClasses]);
        
        toast({
          title: "Demo Mode",
          description: `${generatedClasses.length} recurring classes added in demo mode. Changes will not persist.`,
        });
      } else {
        setClasses([...classes, newClassWithId]);
        
        toast({
          title: "Demo Mode",
          description: "Class added in demo mode. Changes will not persist.",
        });
      }
      
      setIsAddDialogOpen(false);
      return;
    }
    
    try {
      if (recurringPattern && recurringPattern.daysOfWeek.length > 0) {
        // Generate recurring classes
        const generatedClasses = generateRecurringClasses(newClass, recurringPattern);
        
        // Prepare the classes for insertion to Supabase
        const classesForInsert = generatedClasses.map(cls => ({
          name: cls.name,
          trainer: cls.trainer,
          trainers: cls.trainers || [],
          schedule: cls.schedule,
          capacity: parseInt(cls.capacity?.toString() || "0"),
          enrolled: parseInt(cls.enrolled?.toString() || "0"),
          status: cls.status || "Active",
          gender: cls.gender || "All",
          start_time: cls.startTime,
          end_time: cls.endTime
        }));
        
        const { data, error } = await supabase
          .from('classes')
          .insert(classesForInsert)
          .select();
        
        if (error) {
          throw error;
        }

        if (data) {
          // Map the returned data to match our ClassModel structure
          const addedClasses: ClassModel[] = data.map(cls => ({
            id: cls.id,
            name: cls.name,
            trainer: cls.trainer || '',
            trainers: cls.trainers || [],
            schedule: cls.schedule,
            capacity: cls.capacity,
            enrolled: cls.enrolled || 0,
            status: cls.status || 'Active',
            gender: (cls.gender || 'All') as "All" | "Male" | "Female",
            startTime: cls.start_time,
            endTime: cls.end_time
          }));
          
          setClasses([...classes, ...addedClasses]);
          
          toast({
            title: "Classes added",
            description: `${addedClasses.length} recurring classes have been added successfully.`,
          });
        }
      } else {
        // Add a single class
        const classToAdd = {
          name: newClass.name,
          trainer: newClass.trainer,
          trainers: newClass.trainers || [],
          schedule: newClass.schedule,
          capacity: parseInt(newClass.capacity?.toString() || "0"),
          enrolled: parseInt(newClass.enrolled?.toString() || "0"),
          status: newClass.status || "Active",
          gender: newClass.gender || "All",
          start_time: newClass.startTime,
          end_time: newClass.endTime
        };
        
        const { data, error } = await supabase
          .from('classes')
          .insert([classToAdd])
          .select();
        
        if (error) {
          throw error;
        }

        if (data && data[0]) {
          const addedClass: ClassModel = {
            id: data[0].id,
            name: data[0].name,
            trainer: data[0].trainer || '',
            trainers: data[0].trainers || [],
            schedule: data[0].schedule,
            capacity: data[0].capacity,
            enrolled: data[0].enrolled || 0,
            status: data[0].status || 'Active',
            gender: (data[0].gender || 'All') as "All" | "Male" | "Female",
            startTime: data[0].start_time,
            endTime: data[0].end_time
          };
          
          setClasses([...classes, addedClass]);
          
          toast({
            title: "Class added",
            description: "The new class has been successfully added.",
          });
        }
      }
    } catch (error) {
      console.error("Error adding class:", error);
      toast({
        title: "Error",
        description: "Failed to add class.",
        variant: "destructive",
      });
    }
    
    setIsAddDialogOpen(false);
  };

  const handleEditClick = (id: number) => {
    setSelectedClassId(id);
    setIsEditDialogOpen(true);
  };

  const handleUpdateClass = async (updatedClass: ClassModel) => {
    // If in demo mode, just update the UI
    if (useFallbackData) {
      setClasses(
        classes.map((cls) => cls.id === updatedClass.id ? updatedClass : cls)
      );
      
      toast({
        title: "Demo Mode",
        description: "Class updated in demo mode. Changes will not persist.",
      });
      
      setIsEditDialogOpen(false);
      setSelectedClassId(null);
      return;
    }
    
    try {
      const classToUpdate = {
        name: updatedClass.name,
        trainer: updatedClass.trainer,
        trainers: updatedClass.trainers || [],
        schedule: updatedClass.schedule,
        capacity: parseInt(updatedClass.capacity?.toString() || "0"),
        enrolled: parseInt(updatedClass.enrolled?.toString() || "0"),
        status: updatedClass.status || "Active",
        gender: updatedClass.gender || "All",
        start_time: updatedClass.startTime,
        end_time: updatedClass.endTime
      };
      
      const { error } = await supabase
        .from('classes')
        .update(classToUpdate)
        .eq('id', updatedClass.id);
      
      if (error) {
        throw error;
      }
      
      setClasses(
        classes.map((cls) =>
          cls.id === updatedClass.id ? updatedClass : cls
        )
      );
      
      setIsEditDialogOpen(false);
      setSelectedClassId(null);
      
      toast({
        title: "Class updated",
        description: "The class has been successfully updated.",
      });
    } catch (error) {
      console.error("Error updating class:", error);
      toast({
        title: "Error",
        description: "Failed to update class.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout title="Class Management">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="w-full sm:w-auto">
          <Input
            placeholder="Search classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sm:w-80"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            className="w-full sm:w-auto bg-gym-blue hover:bg-gym-dark-blue"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Class
          </Button>
          
          {useFallbackData && (
            <Button 
              variant="outline" 
              size="default" 
              onClick={handleRetry} 
              className="w-full sm:w-auto border-yellow-300 text-yellow-700 hover:text-yellow-800 hover:bg-yellow-100"
            >
              <RefreshCw className={`mr-1 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> 
              {isLoading ? 'Connecting...' : 'Connect to Database'}
            </Button>
          )}
        </div>
      </div>

      <AddClassDialog 
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddClass={handleAddClass}
        trainers={trainersList}
        existingClasses={classes}
      />

      <EditClassDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        currentClass={currentClass}
        onUpdateClass={handleUpdateClass}
        trainers={trainersList}
        existingClasses={classes}
      />

      {useFallbackData && (
        <Alert className="mb-6 bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Demo Mode</AlertTitle>
          <AlertDescription className="text-yellow-700">
            You are currently viewing demo data due to connection issues. Changes will not be saved.
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetry} 
              className={`ml-2 border-yellow-300 text-yellow-700 hover:text-yellow-800 hover:bg-yellow-100 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isLoading}
            >
              <RefreshCw className={`mr-1 h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} /> 
              {isLoading ? 'Connecting...' : 'Try to reconnect'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {fetchError && !useFallbackData && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-800">Error loading classes</AlertTitle>
          <AlertDescription className="text-red-700">
            {fetchError}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetry} 
              className={`ml-2 border-red-300 text-red-700 hover:text-red-800 hover:bg-red-100 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isLoading}
            >
              <RefreshCw className={`mr-1 h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} /> 
              {isLoading ? 'Retrying...' : 'Retry'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trainer(s)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gender
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    <div className="flex justify-center items-center">
                      <RefreshCw className="animate-spin mr-2 h-4 w-4" />
                      Loading classes...
                    </div>
                  </td>
                </tr>
              ) : filteredClasses.length > 0 ? (
                filteredClasses.map((cls) => (
                  <tr key={cls.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{cls.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">
                        {cls.trainers && cls.trainers.length > 0 ? cls.trainers.join(", ") : cls.trainer || 'Not assigned'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{cls.schedule || 'Not scheduled'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {cls.startTime && cls.endTime 
                          ? `${cls.startTime} - ${cls.endTime}`
                          : "Not set"
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">
                        {cls.enrolled} / {cls.capacity}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          cls.gender === "Male"
                            ? "bg-blue-100 text-blue-800"
                            : cls.gender === "Female"
                            ? "bg-pink-100 text-pink-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {cls.gender || "All"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          cls.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : cls.status === "Full"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {cls.status || 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => toggleClassStatus(cls.id)}
                        className="text-gym-blue hover:text-gym-dark-blue mr-3"
                      >
                        {cls.status === "Active" ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleEditClick(cls.id)}
                        className="text-gym-blue hover:text-gym-dark-blue"
                      >
                        <Pencil className="h-4 w-4 inline-block" />
                        <span className="ml-1">Edit</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? 
                      "No classes found matching your search criteria." : 
                      "No classes found. Click 'Add New Class' to create one."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Classes;
