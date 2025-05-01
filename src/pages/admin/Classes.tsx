
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Clock } from "lucide-react";
import { format, addDays, addWeeks, addMonths, parse, isBefore } from "date-fns";
import AddClassDialog from "./components/classes/AddClassDialog";
import EditClassDialog from "./components/classes/EditClassDialog";
import { ClassModel, RecurringPattern } from "./components/classes/ClassTypes";

// Mock trainer data
const trainersList = [
  "Jane Smith",
  "Mike Johnson",
  "Sarah Davis",
  "Emma Wilson",
  "Robert Brown",
  "David Miller",
  "Lisa Garcia",
];

// Mock data
const initialClasses: ClassModel[] = [
  { id: 1, name: "Morning Yoga", trainer: "Jane Smith", schedule: "Mon, Wed, Fri - 7:00 AM", capacity: 15, enrolled: 12, status: "Active", gender: "All", startTime: "07:00", endTime: "08:00" },
  { id: 2, name: "HIIT Workout", trainer: "Mike Johnson", schedule: "Tue, Thu - 6:00 PM", capacity: 20, enrolled: 15, status: "Active", gender: "All", startTime: "18:00", endTime: "19:00" },
  { id: 3, name: "Strength Training", trainer: "Sarah Davis", schedule: "Mon, Wed, Fri - 5:00 PM", capacity: 12, enrolled: 10, status: "Active", gender: "All", startTime: "17:00", endTime: "18:00" },
  { id: 4, name: "Pilates", trainer: "Emma Wilson", schedule: "Tue, Thu - 9:00 AM", capacity: 15, enrolled: 7, status: "Active", gender: "Female", startTime: "09:00", endTime: "10:00" },
  { id: 5, name: "Spinning", trainer: "Robert Brown", schedule: "Mon, Wed - 6:00 PM", capacity: 18, enrolled: 18, status: "Full", gender: "All", startTime: "18:00", endTime: "19:00" },
];

const Classes = () => {
  const [classes, setClasses] = useState<ClassModel[]>(initialClasses);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const { toast } = useToast();

  const filteredClasses = classes.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cls.trainer && cls.trainer.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cls.trainers && cls.trainers.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const currentClass = selectedClassId ? classes.find(c => c.id === selectedClassId) || null : null;

  const toggleClassStatus = (id: number) => {
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
      title: "Class status updated",
      description: "The class status has been updated successfully",
    });
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

  const handleAddClass = (newClass: ClassModel, recurringPattern?: RecurringPattern) => {
    const newId = Math.max(...classes.map(c => c.id)) + 1;
    const classToAdd = {
      ...newClass,
      id: newId,
      enrolled: parseInt(newClass.enrolled?.toString() || "0"),
      capacity: parseInt(newClass.capacity?.toString() || "0"),
      status: newClass.status || "Active",
    };
    
    if (recurringPattern && recurringPattern.daysOfWeek.length > 0) {
      // Generate recurring classes
      const generatedClasses = generateRecurringClasses(classToAdd, recurringPattern);
      setClasses([...classes, ...generatedClasses]);
      
      toast({
        title: "Classes added",
        description: `${generatedClasses.length} recurring classes have been added successfully.`,
      });
    } else {
      // Add a single class
      setClasses([...classes, classToAdd]);
      
      toast({
        title: "Class added",
        description: "The new class has been successfully added.",
      });
    }
    
    setIsAddDialogOpen(false);
  };

  const handleEditClick = (id: number) => {
    setSelectedClassId(id);
    setIsEditDialogOpen(true);
  };

  const handleUpdateClass = (updatedClass: ClassModel) => {
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
              {filteredClasses.map((cls) => (
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
              ))}
              {filteredClasses.length === 0 && (
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
