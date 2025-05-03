import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock } from "lucide-react";
import { ClassModel } from "./ClassTypes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditClassDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateClass: (updatedClass: ClassModel) => void;
  currentClass: ClassModel | null;
  trainers: string[];
  existingClasses: ClassModel[];
}

// Time options for easier selection
const timeOptions = [
  { label: "5:00 AM", value: "05:00" },
  { label: "6:00 AM", value: "06:00" },
  { label: "7:00 AM", value: "07:00" },
  { label: "8:00 AM", value: "08:00" },
  { label: "9:00 AM", value: "09:00" },
  { label: "10:00 AM", value: "10:00" },
  { label: "11:00 AM", value: "11:00" },
  { label: "12:00 PM", value: "12:00" },
  { label: "1:00 PM", value: "13:00" },
  { label: "2:00 PM", value: "14:00" },
  { label: "3:00 PM", value: "15:00" },
  { label: "4:00 PM", value: "16:00" },
  { label: "5:00 PM", value: "17:00" },
  { label: "6:00 PM", value: "18:00" },
  { label: "7:00 PM", value: "19:00" },
  { label: "8:00 PM", value: "20:00" },
  { label: "9:00 PM", value: "21:00" },
  { label: "10:00 PM", value: "22:00" },
];

const EditClassDialog: React.FC<EditClassDialogProps> = ({
  isOpen,
  onOpenChange,
  onUpdateClass,
  currentClass,
  trainers,
  existingClasses,
}) => {
  const [editClass, setEditClass] = useState<ClassModel>({
    id: 0,
    name: "",
    trainer: "",
    trainers: [],
    schedule: "",
    capacity: 0,
    enrolled: 0,
    status: "Active",
    gender: "All",
    startTime: "09:00",
    endTime: "10:00"
  });
  
  const [selectedTrainers, setSelectedTrainers] = useState<string[]>([]);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [mainTrainer, setMainTrainer] = useState<string>("");

  useEffect(() => {
    if (currentClass) {
      setEditClass(currentClass);
      setSelectedTrainers(currentClass.trainers || [currentClass.trainer]);
      setMainTrainer(currentClass.trainer || "");
      setTimeError(null);
    }
  }, [currentClass]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log(`Edit input change - field: ${name}, value: ${value}`);
    
    if (name === "capacity") {
      setEditClass(prev => ({ 
        ...prev, 
        [name]: parseInt(value) || 0 
      }));
    } else {
      setEditClass(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear time error when times change
    if (name === "startTime" || name === "endTime") {
      validateTimes(name === "startTime" ? value : editClass.startTime, 
                   name === "endTime" ? value : editClass.endTime);
    }
  };

  const validateTimes = (startTime: string | undefined, endTime: string | undefined) => {
    if (!startTime || !endTime) {
      setTimeError("Start and end times are required");
      return false;
    }
    
    if (startTime >= endTime) {
      setTimeError("End time must be after start time");
      return false;
    }
    
    setTimeError(null);
    return true;
  };

  const checkForScheduleConflicts = () => {
    // Only check if trainers are selected and we have a current class
    if (selectedTrainers.length === 0 || !currentClass) return null;

    const { startTime, endTime, schedule } = editClass;

    // Check for conflicts with existing classes
    for (const existingClass of existingClasses) {
      // Skip the current class being edited
      if (existingClass.id === currentClass.id) continue;
      
      // Skip classes that don't have time data yet
      if (!existingClass.startTime || !existingClass.endTime) continue;
      
      // Skip classes on different dates
      // This is a simplified check - in a real app you'd need more sophisticated date comparison
      if (schedule !== existingClass.schedule) continue;
      
      // Skip classes with no overlapping trainers
      const existingTrainers = existingClass.trainers || [existingClass.trainer];
      const hasCommonTrainer = selectedTrainers.some(trainer => 
        existingTrainers.includes(trainer)
      );
      
      if (!hasCommonTrainer) continue;

      // Check for time overlap
      if ((startTime! >= existingClass.startTime! && startTime! < existingClass.endTime!) ||
          (endTime! > existingClass.startTime! && endTime! <= existingClass.endTime!) ||
          (startTime! <= existingClass.startTime! && endTime! >= existingClass.endTime!)) {
        return `Schedule conflict with ${existingClass.name} (${existingClass.schedule} ${existingClass.startTime}-${existingClass.endTime})`;
      }
    }
    
    return null;
  };

  const handleGenderChange = (value: string) => {
    setEditClass(prev => ({ ...prev, gender: value as "Male" | "Female" | "All" }));
  };

  const handleTrainerSelection = (trainer: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedTrainers(prev => [...prev, trainer]);
      // If this is the first trainer selected or no main trainer set, make it the main trainer
      if (selectedTrainers.length === 0 || !mainTrainer) {
        setMainTrainer(trainer);
      }
    } else {
      setSelectedTrainers(prev => prev.filter(t => t !== trainer));
      // If removing the main trainer, select a new one or clear it
      if (mainTrainer === trainer) {
        const newTrainers = selectedTrainers.filter(t => t !== trainer);
        setMainTrainer(newTrainers.length > 0 ? newTrainers[0] : "");
      }
    }
    
    // Check for conflicts each time a trainer is selected/deselected
    setTimeError(null);
  };

  // Handler for changing the main trainer
  const handleMainTrainerChange = (value: string) => {
    setMainTrainer(value);
    // Make sure this trainer is also in selectedTrainers
    if (!selectedTrainers.includes(value)) {
      setSelectedTrainers(prev => [...prev, value]);
    }
  };

  const renderTimeSelect = (id: string, label: string, value: string | undefined, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void) => (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor={id} className="text-right">{label}*</Label>
      <div className="col-span-3">
        <div className="flex items-center">
          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
          <select
            id={id}
            name={id}
            value={value || "09:00"}
            onChange={onChange}
            className="w-full border border-input h-10 rounded-md px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            required
          >
            {timeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
  
  const handleUpdateClass = () => {
    // Validate times
    if (!validateTimes(editClass.startTime, editClass.endTime)) {
      return;
    }
    
    // Check for schedule conflicts
    const conflict = checkForScheduleConflicts();
    if (conflict) {
      setTimeError(conflict);
      return;
    }
    
    const updatedClass = {
      ...editClass,
      trainers: selectedTrainers,
      // For backward compatibility, keep the first trainer in the trainer field
      trainer: mainTrainer || selectedTrainers[0] || editClass.trainer
    };
    
    onUpdateClass(updatedClass);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 max-h-[90vh]">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Edit Class</DialogTitle>
          <DialogDescription>
            Update class information.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-130px)] overflow-y-auto px-6">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Class Name*
              </Label>
              <Input
                id="edit-name"
                name="name"
                value={editClass.name}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            
            {/* Main Trainer Selection */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="main-trainer" className="text-right">Main Trainer*</Label>
              <div className="col-span-3">
                <Select
                  value={mainTrainer}
                  onValueChange={handleMainTrainerChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select main trainer" />
                  </SelectTrigger>
                  <SelectContent>
                    {trainers.map((trainer) => (
                      <SelectItem key={trainer} value={trainer}>
                        {trainer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Gender</Label>
              <RadioGroup 
                value={editClass.gender || "All"} 
                onValueChange={handleGenderChange}
                className="col-span-3 flex flex-wrap space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="All" id="edit-all" />
                  <Label htmlFor="edit-all">All</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Male" id="edit-male" />
                  <Label htmlFor="edit-male">Male Only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Female" id="edit-female" />
                  <Label htmlFor="edit-female">Female Only</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Additional Trainers</Label>
              <div className="col-span-3 grid grid-cols-2 gap-2">
                {trainers.map((trainer) => (
                  <div key={trainer} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`edit-trainer-${trainer}`} 
                      checked={selectedTrainers.includes(trainer)}
                      onCheckedChange={(checked) => handleTrainerSelection(trainer, checked === true)}
                    />
                    <Label htmlFor={`edit-trainer-${trainer}`} className="text-sm">{trainer}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-schedule" className="text-right">
                Schedule
              </Label>
              <Input
                id="edit-schedule"
                name="schedule"
                value={editClass.schedule}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            
            {renderTimeSelect("startTime", "Start Time", editClass.startTime, handleInputChange)}
            {renderTimeSelect("endTime", "End Time", editClass.endTime, handleInputChange)}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-capacity" className="text-right">
                Capacity*
              </Label>
              <Input
                id="edit-capacity"
                name="capacity"
                type="number"
                value={editClass.capacity || ""}
                onChange={handleInputChange}
                className="col-span-3"
                required
                min="1"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-enrolled" className="text-right">
                Enrolled
              </Label>
              <Input
                id="edit-enrolled"
                name="enrolled"
                type="number"
                value={editClass.enrolled || ""}
                onChange={handleInputChange}
                className="col-span-3"
                min="0"
              />
            </div>
            
            {timeError && (
              <div className="col-span-4 text-destructive text-sm">
                {timeError}
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-6 pt-2 flex justify-end border-t">
          <Button 
            onClick={handleUpdateClass} 
            className="bg-gym-blue hover:bg-gym-dark-blue"
            disabled={
              !editClass.name || 
              !mainTrainer ||
              selectedTrainers.length === 0 || 
              editClass.capacity <= 0 ||
              !editClass.startTime ||
              !editClass.endTime ||
              !!timeError
            }
          >
            Update Class
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditClassDialog;
