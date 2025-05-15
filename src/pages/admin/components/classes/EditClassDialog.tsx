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
    start_time: "09:00",
    end_time: "10:00"
  });
  
  const [selectedTrainers, setSelectedTrainers] = useState<string[]>([]);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [mainTrainer, setMainTrainer] = useState<string>("");

  useEffect(() => {
    if (currentClass) {
      // Ensure currentClass has start_time and end_time or provide defaults
      const classToEdit = {
        ...currentClass,
        start_time: currentClass.start_time || "09:00",
        end_time: currentClass.end_time || "10:00",
      };
      setEditClass(classToEdit);
      setSelectedTrainers(currentClass.trainers || [currentClass.trainer].filter(Boolean) as string[]);
      setMainTrainer(currentClass.trainer || "");
      setTimeError(null);
    }
  }, [currentClass]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log(`Edit input change - field: ${name}, value: ${value}`);
    
    let updatedValue: string | number = value;
    if (name === "capacity" || name === "enrolled") {
      updatedValue = parseInt(value) || 0;
    }
  
    setEditClass(prev => ({ 
      ...prev, 
      [name]: updatedValue
    }));
    
    if (name === "start_time" || name === "end_time") {
      validateTimes(name === "start_time" ? value : editClass.start_time, 
                   name === "end_time" ? value : editClass.end_time);
    }
  };

  const validateTimes = (start_time: string | undefined, end_time: string | undefined) => { // Changed parameters
    if (!start_time || !end_time) {
      setTimeError("Start and end times are required");
      return false;
    }
    
    if (start_time >= end_time) {
      setTimeError("End time must be after start time");
      return false;
    }
    
    setTimeError(null);
    return true;
  };

  const checkForScheduleConflicts = () => {
    if (selectedTrainers.length === 0 || !currentClass) return null;

    const { start_time, end_time, schedule } = editClass; // Changed from startTime, endTime

    for (const existingClass of existingClasses) {
      if (existingClass.id === currentClass.id) continue;
      if (!existingClass.start_time || !existingClass.end_time) continue; // Changed from startTime, endTime
      if (schedule !== existingClass.schedule) continue;
      
      const existingTrainers = existingClass.trainers || [existingClass.trainer].filter(Boolean) as string[];
      const hasCommonTrainer = selectedTrainers.some(trainer => 
        existingTrainers.includes(trainer)
      );
      
      if (!hasCommonTrainer) continue;

      if ((start_time! >= existingClass.start_time! && start_time! < existingClass.end_time!) ||
          (end_time! > existingClass.start_time! && end_time! <= existingClass.end_time!) ||
          (start_time! <= existingClass.start_time! && end_time! >= existingClass.end_time!)) {
        return `Schedule conflict with ${existingClass.name} (${existingClass.schedule} ${existingClass.start_time}-${existingClass.end_time})`; // Changed properties
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

  const renderTimeSelect = (id: "start_time" | "end_time", label: string, value: string | undefined, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void) => ( // id type updated
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor={id} className="text-right">{label}*</Label>
      <div className="col-span-3">
        <div className="flex items-center">
          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
          <select
            id={id}
            name={id} // name should match state property
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
    if (!validateTimes(editClass.start_time, editClass.end_time)) { // Changed properties
      return;
    }
    
    const conflict = checkForScheduleConflicts();
    if (conflict) {
      setTimeError(conflict);
      return;
    }
    
    const updatedClass: ClassModel = {
      ...editClass,
      trainers: selectedTrainers,
      trainer: mainTrainer || (selectedTrainers.length > 0 ? selectedTrainers[0] : ""),
      start_time: editClass.start_time || "09:00", // fallback if undefined
      end_time: editClass.end_time || "10:00",   // fallback if undefined
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
            
            {/* Main Trainer Selection - Change label to not have asterisk */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="main-trainer" className="text-right">Main Trainer</Label>
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
            
            {renderTimeSelect("start_time", "Start Time", editClass.start_time, handleInputChange)}
            {renderTimeSelect("end_time", "End Time", editClass.end_time, handleInputChange)}
            
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
              editClass.capacity <= 0 ||
              !editClass.start_time || // Changed from startTime
              !editClass.end_time ||   // Changed from endTime
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
