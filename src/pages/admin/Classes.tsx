import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Clock, CalendarIcon, Filter, Users, ArrowUpDown } from "lucide-react";
import { format, addDays, addWeeks, addMonths, parse, isBefore } from "date-fns";
import AddClassDialog from "./components/classes/AddClassDialog";
import EditClassDialog from "./components/classes/EditClassDialog";
import { ClassModel, RecurringPattern } from "./components/classes/ClassTypes";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Classes = () => {
  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [trainersList, setTrainersList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const { toast } = useToast();

  // Fetch classes from Supabase
  useEffect(() => {
    const fetchClasses = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching classes from Supabase...");
        const { data, error } = await supabase
          .from('classes')
          .select('*');

        if (error) {
          console.error("Error fetching classes:", error);
          toast({
            title: "Failed to load classes",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        if (data) {
          console.log("Classes data retrieved:", data);
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
            description: cls.description || "",
            location: cls.location || "",
            difficulty: cls.difficulty || "",
            color: cls.color || ""
          }));
          
          setClasses(formattedClasses);
        }
      } catch (err) {
        console.error("Error fetching classes:", err);
        toast({
          title: "Failed to load classes",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  }, [toast]);

  // Load trainers from database
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const { data, error } = await supabase
          .from('trainers')
          .select('name')
          .eq('status', 'Active');

        if (error) {
          console.error("Error loading trainers:", error);
          // Fallback to localStorage trainers
          loadTrainersFromLocalStorage();
          return;
        }

        if (data && data.length > 0) {
          const trainerNames = data.map(trainer => trainer.name);
          console.log("Trainers loaded from database:", trainerNames);
          setTrainersList(trainerNames);
        } else {
          console.log("No trainers found in database, using fallback");
          // Fallback to localStorage trainers
          loadTrainersFromLocalStorage();
        }
      } catch (err) {
        console.error("Error loading trainers:", err);
        // Fallback to localStorage trainers
        loadTrainersFromLocalStorage();
      }
    };

    const loadTrainersFromLocalStorage = () => {
      try {
        const storedTrainers = localStorage.getItem("trainers");
        if (storedTrainers) {
          const parsedTrainers = JSON.parse(storedTrainers);
          // Extract just the trainer names from the trainer objects
          const activeTrainerNames = parsedTrainers
            .filter((trainer: any) => trainer.status === "Active")
            .map((trainer: any) => trainer.name);
          
          if (activeTrainerNames.length > 0) {
            console.log("Trainers loaded from localStorage:", activeTrainerNames);
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
        console.log("Using fallback trainers:", fallbackTrainers);
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

    fetchTrainers();
  }, []);

  // Filter and sort classes
  const getFilteredAndSortedClasses = () => {
    let filtered = classes.filter(
      (cls) =>
        (cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cls.trainer && cls.trainer.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cls.trainers && cls.trainers.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        (cls.location && cls.location.toLowerCase().includes(searchTerm.toLowerCase())))
        && 
        (filterStatus === null || cls.status === filterStatus)
    );

    // Sort the filtered classes
    filtered.sort((a, b) => {
      let valueA, valueB;

      switch (sortBy) {
        case "name":
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case "capacity":
          valueA = a.capacity;
          valueB = b.capacity;
          break;
        case "enrolled":
          valueA = a.enrolled || 0;
          valueB = b.enrolled || 0;
          break;
        case "schedule":
          try {
            const dateA = parse(a.schedule, "MM/dd/yyyy", new Date());
            const dateB = parse(b.schedule, "MM/dd/yyyy", new Date());
            valueA = dateA.getTime();
            valueB = dateB.getTime();
          } catch {
            valueA = a.schedule;
            valueB = b.schedule;
          }
          break;
        default:
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
      }

      const compareResult = valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      return sortDirection === "asc" ? compareResult : -compareResult;
    });

    return filtered;
  };

  const filteredClasses = getFilteredAndSortedClasses();

  const currentClass = selectedClassId ? classes.find(c => c.id === selectedClassId) || null : null;

  const toggleClassStatus = async (id: number) => {
    try {
      const classToUpdate = classes.find(c => c.id === id);
      if (!classToUpdate) return;

      const newStatus = classToUpdate.status === "Active" ? "Inactive" : "Active";
      
      const { error } = await supabase
        .from('classes')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) {
        console.error("Error updating class status:", error);
        toast({
          title: "Failed to update class status",
          description: error.message,
          variant: "destructive",
        });
        return;
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
    let currentId = Math.max(...classes.map(c => c.id)) + 1;
    
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
          id: currentId++,
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
              id: currentId++,
              schedule: `${format(classDate, "MM/dd/yyyy")} (${day})`,
            });
          }
        }
        
        currentWeek = addWeeks(currentWeek, 1);
      }
    } else if (pattern.frequency === "Monthly") {
      // Generate monthly classes
      let currentMonth = new Date(baseDate);
      const dayOfMonth = currentMonth.getDate();
      
      while (isBefore(currentMonth, endDate)) {
        generatedClasses.push({
          ...baseClass,
          id: currentId++,
          schedule: format(currentMonth, "MM/dd/yyyy"),
        });
        
        currentMonth = addMonths(currentMonth, 1);
      }
    }
    
    return generatedClasses;
  };

  const handleAddClass = async (newClass: ClassModel, recurringPattern?: RecurringPattern) => {
    try {
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
        end_time: newClass.endTime,
        description: newClass.description,
        location: newClass.location,
        difficulty: newClass.difficulty,
        color: newClass.color
      };
      
      console.log("Adding class with data:", classToAdd);
      
      if (recurringPattern && recurringPattern.daysOfWeek.length > 0) {
        // Generate recurring classes
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
          description: cls.description || null,
          location: cls.location || null, 
          difficulty: cls.difficulty || null,
          color: cls.color || null
        }));
        
        const { data, error } = await supabase
          .from('classes')
          .insert(classesToInsert)
          .select();
          
        if (error) {
          console.error("Error adding recurring classes:", error);
          toast({
            title: "Failed to add recurring classes",
            description: error.message,
            variant: "destructive",
          });
          return;
        }
        
        if (data) {
          console.log("Inserted recurring classes:", data);
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
            color: cls.color
          }));
          
          setClasses(prevClasses => [...prevClasses, ...formattedClasses]);
        }
        
        toast({
          title: "Classes added",
          description: `${generatedClasses.length} recurring classes have been added successfully.`,
        });
      } else {
        // Add a single class
        const { data, error } = await supabase
          .from('classes')
          .insert([classToAdd])
          .select();
          
        if (error) {
          console.error("Error adding class:", error);
          toast({
            title: "Failed to add class",
            description: error.message,
            variant: "destructive",
          });
          return;
        }
        
        if (data && data[0]) {
          console.log("Inserted class:", data[0]);
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
            difficulty: data[0].difficulty,
            color: data[0].color
          };
          
          setClasses(prevClasses => [...prevClasses, formattedClass]);
        }
        
        toast({
          title: "Class added",
          description: "The new class has been successfully added.",
        });
      }
    } catch (err) {
      console.error("Error adding class:", err);
      toast({
        title: "Failed to add class",
        description: "An unexpected error occurred",
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
      // Prepare data for Supabase (column names differ)
      const classData = {
        name: updatedClass.name,
        trainer: updatedClass.trainer,
        trainers: updatedClass.trainers,
        schedule: updatedClass.schedule,
        capacity: updatedClass.capacity,
        enrolled: updatedClass.enrolled,
        status: updatedClass.status,
        gender: updatedClass.gender,
        start_time: updatedClass.startTime,
        end_time: updatedClass.endTime,
        description: updatedClass.description,
        location: updatedClass.location,
        difficulty: updatedClass.difficulty,
        color: updatedClass.color
      };
      
      console.log("Updating class with data:", classData);
      
      const { error } = await supabase
        .from('classes')
        .update(classData)
        .eq('id', updatedClass.id);
        
      if (error) {
        console.error("Error updating class:", error);
        toast({
          title: "Failed to update class",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      // Update local state
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
    } catch (err) {
      console.error("Error updating class:", err);
      toast({
        title: "Failed to update class",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };

  return (
    <DashboardLayout title="Class Management">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="w-full sm:w-auto flex items-center gap-2">
          <Input
            placeholder="Search classes, trainers, locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sm:w-80"
          />
          
          <DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Filter by status</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterStatus(null)} className={!filterStatus ? "bg-gray-100" : ""}>
                All Statuses
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("Active")} className={filterStatus === "Active" ? "bg-gray-100" : ""}>
                Active Only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("Inactive")} className={filterStatus === "Inactive" ? "bg-gray-100" : ""}>
                Inactive Only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("Full")} className={filterStatus === "Full" ? "bg-gray-100" : ""}>
                Full Classes Only
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Button 
          className="w-full sm:w-auto bg-gym-blue hover:bg-gym-dark-blue"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Class
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

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <ScrollArea className="h-[calc(100vh-250px)]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center">
                      Class Name
                      {sortBy === "name" && (
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      )}
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trainer(s)
                  </th>
                  <th 
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell cursor-pointer"
                    onClick={() => handleSort("schedule")}
                  >
                    <div className="flex items-center">
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      Schedule
                      {sortBy === "schedule" && (
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      )}
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    <div className="flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      Time
                    </div>
                  </th>
                  <th 
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell cursor-pointer"
                    onClick={() => handleSort("capacity")}
                  >
                    <div className="flex items-center">
                      <Users className="mr-1 h-3 w-3" />
                      Capacity
                      {sortBy === "capacity" && (
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      )}
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Level
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
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-4 text-center text-gray-500">
                      Loading classes...
                    </td>
                  </tr>
                ) : filteredClasses.length > 0 ? (
                  filteredClasses.map((cls) => (
                    <tr key={cls.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {cls.color && (
                            <div 
                              className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                              style={{ backgroundColor: cls.color }}
                            />
                          )}
                          <div className="font-medium text-gray-900">{cls.name}</div>
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="text-gray-500">
                          {cls.trainers && cls.trainers.length > 0
                            ? cls.trainers.join(", ")
                            : cls.trainer || "No trainer assigned"}
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
                            cls.difficulty === "Beginner"
                              ? "bg-green-100 text-green-800"
                              : cls.difficulty === "Intermediate"
                              ? "bg-yellow-100 text-yellow-800"
                              : cls.difficulty === "Advanced"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {cls.difficulty || "All Levels"}
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
                          >
                            {cls.status === "Active" ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => handleEditClick(cls.id)}
                            className="text-gym-blue hover:text-gym-dark-blue text-xs sm:text-sm flex items-center justify-center sm:justify-start"
                          >
                            <Pencil className="h-3 w-3 sm:h-4 sm:w-4 inline-block" />
                            <span className="ml-1">Edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-3 py-4 text-center text-gray-500">
                      No classes found matching your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </ScrollArea>
      </div>
    </DashboardLayout>
  );
};

export default Classes;
