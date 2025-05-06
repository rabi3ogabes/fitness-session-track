import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Clock, AlertCircle, RefreshCw, WifiOff } from "lucide-react";
import { format, addDays, addWeeks, addMonths, parse, isBefore } from "date-fns";
import AddClassDialog from "./components/classes/AddClassDialog";
import EditClassDialog from "./components/classes/EditClassDialog";
import { ClassModel, RecurringPattern } from "./components/classes/ClassTypes";
import { supabase, requireAuth, isOffline } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useTrainerCreation } from "./components/classes/CreateTrainer";

const Classes = () => {
  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [trainersList, setTrainersList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isNetworkConnected, setIsNetworkConnected] = useState(true);
  const { toast } = useToast();
  const { createTestTrainer } = useTrainerCreation();

  // Network status event listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsNetworkConnected(true);
      // Auto retry fetch on reconnect
      fetchClasses();
    };
    
    const handleOffline = () => {
      setIsNetworkConnected(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial network status
    setIsNetworkConnected(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch classes from Supabase
  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    if (!isNetworkConnected) {
      console.log("Cannot fetch classes - offline");
      setError("You are currently offline. Reconnect to load data.");
      setIsLoading(false);
      return;
    }
    
    try {
      const data = await requireAuth(async () => {
        console.log("Fetching classes from database...");
        const { data, error } = await supabase
          .from('classes')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Database error when fetching classes:", error);
          throw error;
        }

        console.log("Classes fetch successful, received:", data?.length, "records");
        return data || [];
      }, []);

      if (Array.isArray(data)) {
        const formattedClasses: ClassModel[] = data.map(cls => ({
          id: cls.id,
          name: cls.name,
          trainer: cls.trainer || "",
          trainers: cls.trainers || [],
          schedule: cls.schedule,
          capacity: cls.capacity,
          enrolled: cls.enrolled || 0,
          status: cls.status || "Active",
          gender: cls.gender || "All",
          startTime: cls.start_time || "",
          endTime: cls.end_time || "",
          description: cls.description,
          location: cls.location,
          difficulty: cls.difficulty,
        }));
        
        setClasses(formattedClasses);
        console.log("Successfully loaded", formattedClasses.length, "classes from database");
      } else {
        console.error("Unexpected response format:", data);
        throw new Error("Invalid data format received from server");
      }
    } catch (err: any) {
      console.error("Error fetching classes:", err);
      setError("Failed to load classes from database. Please check your connection and try again.");
      // Keep any previously loaded classes to provide some functionality
    } finally {
      setIsLoading(false);
    }
  }, [toast, isNetworkConnected]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses, retryCount]);

  // Load trainers from database with improved error handling
  const fetchTrainers = useCallback(async () => {
    try {
      if (!isNetworkConnected) {
        console.log("Cannot fetch trainers - offline");
        loadTrainersFromLocalStorage();
        return;
      }
      
      await requireAuth(async () => {
        console.log("Fetching trainers from database...");
        const { data, error } = await supabase
          .from('trainers')
          .select('name')
          .eq('status', 'Active');

        if (error) {
          console.error("Database error when fetching trainers:", error);
          throw error;
        }

        if (data && data.length > 0) {
          const trainerNames = data.map(trainer => trainer.name);
          setTrainersList(trainerNames);
          console.log("Successfully loaded trainers from database:", trainerNames);
          
          // Also cache trainers in localStorage for offline use
          try {
            localStorage.setItem("cached_trainers", JSON.stringify(trainerNames));
            console.log("Cached trainers in localStorage");
          } catch (e) {
            console.warn("Failed to cache trainers in localStorage:", e);
          }
        } else {
          console.log("No trainers found in database, creating test trainers");
          // If no trainers exist, create some test trainers
          const created = await createTestTrainer();
          console.log("Test trainers creation result:", created ? "success" : "failed");
          
          // Then try to fetch them again
          const { data: refreshedData, error: refreshError } = await supabase
            .from('trainers')
            .select('name')
            .eq('status', 'Active');
            
          if (refreshError) {
            console.error("Error fetching trainers after creation:", refreshError);
            loadTrainersFromLocalStorage();
            return;
          }
          
          if (refreshedData && refreshedData.length > 0) {
            const trainerNames = refreshedData.map(trainer => trainer.name);
            setTrainersList(trainerNames);
            console.log("Successfully loaded newly created trainers:", trainerNames);
            
            // Cache in localStorage
            try {
              localStorage.setItem("cached_trainers", JSON.stringify(trainerNames));
            } catch (e) {
              console.warn("Failed to cache trainers in localStorage:", e);
            }
          } else {
            console.log("No trainers found after creation attempt, using fallback");
            // Fallback to localStorage if still no trainers
            loadTrainersFromLocalStorage();
          }
        }
      });
    } catch (err) {
      console.error("Error loading trainers:", err);
      // Fallback to localStorage trainers
      loadTrainersFromLocalStorage();
    }
  }, [isNetworkConnected, createTestTrainer]);

  useEffect(() => {
    fetchTrainers();
  }, [fetchTrainers]);

  const loadTrainersFromLocalStorage = () => {
    try {
      // First try to use cached trainers
      const cachedTrainers = localStorage.getItem("cached_trainers");
      if (cachedTrainers) {
        try {
          const parsedTrainers = JSON.parse(cachedTrainers);
          if (Array.isArray(parsedTrainers) && parsedTrainers.length > 0) {
            setTrainersList(parsedTrainers);
            return;
          }
        } catch (e) {
          console.warn("Error parsing cached trainers:", e);
        }
      }
      
      // Fall back to trainers objects if cached trainers not available
      const storedTrainers = localStorage.getItem("trainers");
      if (storedTrainers) {
        const parsedTrainers = JSON.parse(storedTrainers);
        // Extract just the trainer names from the trainer objects
        const activeTrainerNames = parsedTrainers
          .filter((trainer: any) => trainer.status === "Active")
          .map((trainer: any) => trainer.name);
        
        if (activeTrainerNames.length > 0) {
          setTrainersList(activeTrainerNames);
          return;
        }
      }
      // Use fallback trainers if nothing else works
      const fallbackTrainers = [
        "Jane Smith",
        "Mike Johnson",
        "Sarah Davis",
        "Emma Wilson",
        "Robert Brown",
        "David Miller",
        "Lisa Garcia",
      ];
      console.log("Using fallback trainer names:", fallbackTrainers);
      setTrainersList(fallbackTrainers);
    } catch (error) {
      console.error("Error loading trainers from localStorage:", error);
      // Keep the fallback trainers if there's an error
      setTrainersList([
        "Jane Smith",
        "Mike Johnson",
        "Sarah Davis",
        "Emma Wilson",
        "Robert Brown",
        "David Miller",
        "Lisa Garcia",
      ]);
    }
  };

  const handleRetry = () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    setTimeout(() => {
      setIsRetrying(false);
    }, 1500);
  };

  const filteredClasses = classes.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cls.trainer && cls.trainer.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cls.trainers && cls.trainers.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const currentClass = selectedClassId ? classes.find(c => c.id === selectedClassId) || null : null;

  const toggleClassStatus = async (id: number) => {
    if (!isNetworkConnected) {
      toast({
        title: "You're offline",
        description: "Please connect to the internet to update class status",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await requireAuth(async () => {
        const classToUpdate = classes.find(c => c.id === id);
        if (!classToUpdate) return;

        const newStatus = classToUpdate.status === "Active" ? "Inactive" : "Active";
        
        const { error } = await supabase
          .from('classes')
          .update({ status: newStatus })
          .eq('id', id);

        if (error) {
          throw error;
        }

        // Update local state
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
      });
    } catch (err) {
      console.error("Error updating class status:", err);
      toast({
        title: "Failed to update class status",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Generate classes based on recurring pattern
  const generateRecurringClasses = (baseClass: ClassModel, pattern: RecurringPattern): ClassModel[] => {
    const generatedClasses: ClassModel[] = [];
    let currentId = Math.max(...classes.map(c => c.id), 0) + 1;
    
    // Parse the base date from the schedule
    const baseDate = pattern.frequency === "Daily" ? 
      new Date() : 
      parse(baseClass.schedule, "yyyy-MM-dd", new Date());
    
    const endDate = new Date(pattern.repeatUntil);
    
    if (pattern.frequency === "Daily") {
      // Generate daily classes
      let currentDate = new Date(baseDate);
      
      while (isBefore(currentDate, endDate)) {
        generatedClasses.push({
          ...baseClass,
          id: currentId++,
          schedule: format(currentDate, "yyyy-MM-dd"),
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
              id: currentId++,
              schedule: format(classDate, "yyyy-MM-dd"),
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
          id: currentId++,
          schedule: format(currentMonth, "yyyy-MM-dd"),
        });
        
        currentMonth = addMonths(currentMonth, 1);
      }
    }
    
    return generatedClasses;
  };

  const handleAddClass = async (newClass: ClassModel, recurringPattern?: RecurringPattern) => {
    try {
      await requireAuth(async () => {
        console.log("=== Starting class creation process ===");
        
        const classToAdd = {
          name: newClass.name,
          trainer: newClass.trainer || "", // Allow empty trainer field
          trainers: newClass.trainers || [],
          schedule: newClass.schedule,
          capacity: parseInt(newClass.capacity?.toString() || "0"),
          enrolled: parseInt(newClass.enrolled?.toString() || "0"),
          status: newClass.status || "Active",
          gender: newClass.gender || "All",
          start_time: newClass.startTime,
          end_time: newClass.endTime,
          description: newClass.description,
          location: newClass.location,
          difficulty: newClass.difficulty
        };
        
        console.log("Class data to be added:", JSON.stringify(classToAdd));
        
        if (recurringPattern && recurringPattern.daysOfWeek.length > 0) {
          // Generate recurring classes
          console.log("Creating recurring classes with pattern:", JSON.stringify(recurringPattern));
          const generatedClasses = generateRecurringClasses(newClass, recurringPattern);
          console.log(`Generated ${generatedClasses.length} recurring classes`);
          
          // Insert all classes
          const classesToInsert = generatedClasses.map(cls => ({
            name: cls.name,
            trainer: cls.trainer,
            trainers: cls.trainers || [],
            schedule: cls.schedule,
            capacity: parseInt(cls.capacity?.toString() || "0"),
            enrolled: parseInt(cls.enrolled?.toString() || "0"),
            status: cls.status || "Active",
            gender: cls.gender || "All",
            start_time: cls.startTime,
            end_time: cls.endTime,
            description: cls.description,
            location: cls.location,
            difficulty: cls.difficulty
          }));
          
          console.log("Inserting recurring classes:", JSON.stringify(classesToInsert));
          
          try {
            const { data, error } = await supabase
              .from('classes')
              .insert(classesToInsert)
              .select();
            
            console.log("Supabase response received");
            
            if (error) {
              console.error("Error inserting recurring classes:", error);
              throw error;
            }
            
            console.log("Classes inserted successfully:", data);
            
            if (data) {
              const formattedClasses: ClassModel[] = data.map(cls => ({
                id: cls.id,
                name: cls.name,
                trainer: cls.trainer || "",
                trainers: cls.trainers || [],
                schedule: cls.schedule,
                capacity: cls.capacity,
                enrolled: cls.enrolled || 0,
                status: cls.status || "Active",
                gender: cls.gender || "All",
                startTime: cls.start_time || "",
                endTime: cls.end_time || "",
                description: cls.description,
                location: cls.location,
                difficulty: cls.difficulty
              }));
              
              setClasses(prevClasses => [...prevClasses, ...formattedClasses]);
            }
            
            toast({
              title: "Classes added",
              description: `${generatedClasses.length} recurring classes have been added successfully.`,
            });
          } catch (insertError) {
            console.error("Error during insert operation:", insertError);
            throw insertError;
          }
        } else {
          // Add a single class
          console.log("Inserting single class:", JSON.stringify(classToAdd));
          
          try {
            const { data, error } = await supabase
              .from('classes')
              .insert([classToAdd])
              .select();
            
            console.log("Supabase response received for single class insert");
              
            if (error) {
              console.error("Supabase error:", error);
              throw error;
            }
            
            console.log("Class inserted successfully:", data);
            
            if (data && data[0]) {
              console.log("Created class:", data[0]);
              
              const formattedClass: ClassModel = {
                id: data[0].id,
                name: data[0].name,
                trainer: data[0].trainer || "",
                trainers: data[0].trainers || [],
                schedule: data[0].schedule,
                capacity: data[0].capacity,
                enrolled: data[0].enrolled || 0,
                status: data[0].status || "Active",
                gender: data[0].gender || "All",
                startTime: data[0].start_time || "",
                endTime: data[0].end_time || "",
                description: data[0].description,
                location: data[0].location,
                difficulty: data[0].difficulty
              };
              
              setClasses(prevClasses => [...prevClasses, formattedClass]);
              
              toast({
                title: "Class added",
                description: "The new class has been successfully added.",
              });
              
              // Refresh class list after adding
              fetchClasses();
            } else {
              console.warn("No data returned after insertion");
              toast({
                title: "Class might not be added",
                description: "No confirmation received from the server. Please check if the class was added.",
                variant: "destructive",
              });
            }
          } catch (insertError) {
            console.error("Error during single class insert operation:", insertError);
            throw insertError;
          }
        }
        
        console.log("=== Class creation process completed ===");
      });
    } catch (err: any) {
      console.error("Error adding class:", err);
      console.error("Error details:", err.message, err.stack);
      
      // More detailed error message
      let errorMsg = "An unexpected error occurred";
      if (err.message) {
        errorMsg = err.message;
        if (err.message.includes('permission denied')) {
          errorMsg = "Permission denied. Please check if you have the right access to create classes.";
        } else if (err.message.includes('violates foreign key constraint')) {
          errorMsg = "Invalid trainer reference. Please select valid trainers.";
        }
      }
      
      toast({
        title: "Failed to add class",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsAddDialogOpen(false);
    }
  };

  const handleEditClick = (id: number) => {
    setSelectedClassId(id);
    setIsEditDialogOpen(true);
  };

  const handleUpdateClass = async (updatedClass: ClassModel) => {
    try {
      await requireAuth(async () => {
        // Prepare data for Supabase (column names differ)
        const classData = {
          name: updatedClass.name,
          trainer: updatedClass.trainer || "", // Allow empty trainer field
          trainers: updatedClass.trainers || [],
          schedule: updatedClass.schedule,
          capacity: updatedClass.capacity,
          enrolled: updatedClass.enrolled,
          status: updatedClass.status,
          gender: updatedClass.gender,
          start_time: updatedClass.startTime,
          end_time: updatedClass.endTime,
          description: updatedClass.description,
          location: updatedClass.location,
          difficulty: updatedClass.difficulty
        };
        
        console.log("Updating class:", classData);
        
        const { error } = await supabase
          .from('classes')
          .update(classData)
          .eq('id', updatedClass.id);
          
        if (error) {
          console.error("Supabase update error:", error);
          throw error;
        }
        
        // Update local state
        setClasses(
          classes.map((cls) =>
            cls.id === updatedClass.id ? updatedClass : cls
          )
        );
        
        toast({
          title: "Class updated",
          description: "The class has been successfully updated.",
        });
      });
    } catch (err) {
      console.error("Error updating class:", err);
      toast({
        title: "Failed to update class",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsEditDialogOpen(false);
      setSelectedClassId(null);
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
        <Button 
          className="w-full sm:w-auto bg-gym-blue hover:bg-gym-dark-blue"
          onClick={() => setIsAddDialogOpen(true)}
          disabled={!isNetworkConnected}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Class
        </Button>
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

      {error && (
        <Alert variant="destructive" className="mb-6">
          {!isNetworkConnected ? (
            <WifiOff className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>{!isNetworkConnected ? "You're offline" : "Error"}</AlertTitle>
          <AlertDescription className="flex justify-between items-center">
            <span>{error}</span>
            <Button 
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="ml-4"
              disabled={isRetrying || !isNetworkConnected}
            >
              <RefreshCw className={cn("h-3 w-3 mr-1", isRetrying && "animate-spin")} />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <ScrollArea className="h-[calc(100vh-250px)]">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gym-blue"></div>
              <span className="ml-2 text-gray-500">Loading classes...</span>
            </div>
          ) : classes.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 mb-4">No classes found. Create your first class to get started.</p>
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-gym-blue hover:bg-gym-dark-blue"
                disabled={!isNetworkConnected}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Class
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class Name
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trainer(s)
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Schedule
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Time
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Capacity
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Gender
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClasses.map((cls) => (
                    <tr key={cls.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{cls.name}</div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="text-gray-500">
                          {cls.trainers && cls.trainers.length > 0 ? cls.trainers.join(", ") : cls.trainer}
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap hidden md:table-cell">
                        <div className="text-gray-500">{cls.schedule}</div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap hidden sm:table-cell">
                        <div className="text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {cls.startTime && cls.endTime 
                            ? `${cls.startTime} - ${cls.endTime}`
                            : "Not set"
                          }
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap hidden sm:table-cell">
                        <div className="text-gray-500">
                          {cls.enrolled} / {cls.capacity}
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap hidden md:table-cell">
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
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            cls.status === "Active"
                              ? "bg-green-100 text-green-800"
                              : cls.status === "Full"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {cls.status}
                        </span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex flex-col sm:flex-row justify-end gap-2">
                          <button
                            onClick={() => toggleClassStatus(cls.id)}
                            className="text-gym-blue hover:text-gym-dark-blue text-xs sm:text-sm"
                            disabled={!isNetworkConnected}
                          >
                            {cls.status === "Active" ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => handleEditClick(cls.id)}
                            className="text-gym-blue hover:text-gym-dark-blue text-xs sm:text-sm flex items-center justify-center sm:justify-start"
                            disabled={!isNetworkConnected}
                          >
                            <Pencil className="h-3 w-3 sm:h-4 sm:w-4 inline-block" />
                            <span className="ml-1">Edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ScrollArea>
      </div>
    </DashboardLayout>
  );
};

export default Classes;
