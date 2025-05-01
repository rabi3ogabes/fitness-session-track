import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Clock } from "lucide-react";
import { format, addDays, addWeeks, addMonths, parse, isBefore } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import AddClassDialog from "./components/classes/AddClassDialog";
import EditClassDialog from "./components/classes/EditClassDialog";
import { ClassModel, RecurringPattern } from "./components/classes/ClassTypes";

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
  const [trainersList, setTrainersList] = useState<string[]>(fallbackTrainers);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch classes from Supabase on component mount
  useEffect(() => {
    fetchClasses();
    fetchTrainers();
  }, []);

  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('classes')
        .select('*');
      
      if (error) {
        throw error;
      }

      if (data) {
        // Map Supabase fields to match our ClassModel structure
        const formattedClasses: ClassModel[] = data.map(cls => ({
          id: cls.id,
          name: cls.name,
          trainer: cls.trainer || '',
          trainers: cls.trainers || [],
          schedule: cls.schedule,
          capacity: cls.capacity,
          enrolled: cls.enrolled || 0,
          status: cls.status || 'Active',
          gender: cls.gender || 'All',
          startTime: cls.start_time,
          endTime: cls.end_time
        }));
        setClasses(formattedClasses);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast({
        title: "Error",
        description: "Failed to fetch classes. Using default data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTrainers = async () => {
    try {
      const { data, error } = await supabase
        .from('trainers')
        .select('name')
        .eq('status', 'Active');
      
      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const trainerNames = data.map(trainer => trainer.name);
        setTrainersList(trainerNames);
      }
    } catch (error) {
      console.error("Error fetching trainers:", error);
      // Keep using the fallback trainers list if there's an error
    }
  };

  const filteredClasses = classes.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cls.trainer && cls.trainer.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cls.trainers && cls.trainers.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const currentClass = selectedClassId ? classes.find(c => c.id === selectedClassId) || null : null;

  const toggleClassStatus = async (id: number) => {
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
            gender: cls.gender as "Male" | "Female" | "All" | string,
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
            gender: data[0].gender as "Male" | "Female" | "All" | string,
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
        <Button 
          className="w-full sm:w-auto bg-gym-blue hover:bg-gym-dark-blue"
          onClick={() => setIsAddDialogOpen(true)}
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
                    Loading classes...
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
                        {cls.trainers ? cls.trainers.join(", ") : cls.trainer}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{cls.schedule}</div>
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
                        {cls.status}
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
                    No classes found matching your search criteria.
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
