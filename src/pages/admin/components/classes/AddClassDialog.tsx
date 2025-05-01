
import { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock } from "lucide-react";
import { ClassModel, RecurringPattern } from "./ClassTypes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface AddClassDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddClass: (newClass: ClassModel, recurring?: RecurringPattern) => void;
  trainers: string[];
  existingClasses: ClassModel[];
}

const AddClassDialog: React.FC<AddClassDialogProps> = ({
  isOpen,
  onOpenChange,
  onAddClass,
  trainers,
  existingClasses,
}) => {
  const [newClass, setNewClass] = useState<ClassModel>({
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

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState<RecurringPattern>({
    frequency: "Weekly",
    daysOfWeek: [],
    repeatUntil: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"), // Default 30 days from now
  });
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [selectedTrainers, setSelectedTrainers] = useState<string[]>([]);
  const [timeError, setTimeError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewClass(prev => ({ ...prev, [name]: value }));
    
    // Clear time error when times change
    if (name === "startTime" || name === "endTime") {
      validateTimes(name === "startTime" ? value : newClass.startTime, 
                   name === "endTime" ? value : newClass.endTime);
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
    // Only check if trainers are selected
    if (selectedTrainers.length === 0) return null;

    // Format for scheduled date
    const scheduleDate = format(startDate, "MM/dd/yyyy");
    const { startTime, endTime } = newClass;

    // Check for conflicts with existing classes
    for (const existingClass of existingClasses) {
      // Skip classes that don't have time data yet
      if (!existingClass.startTime || !existingClass.endTime) continue;
      
      // Skip classes on different dates
      if (!existingClass.schedule.includes(scheduleDate)) continue;
      
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
    setNewClass(prev => ({ ...prev, gender: value as "Male" | "Female" | "All" }));
  };

  const handleTrainerSelection = (trainer: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedTrainers(prev => [...prev, trainer]);
    } else {
      setSelectedTrainers(prev => prev.filter(t => t !== trainer));
    }
    
    // Check for conflicts each time a trainer is selected/deselected
    setTimeError(null);
  };

  const handleDaySelection = (day: string, isChecked: boolean) => {
    if (isChecked) {
      setRecurringPattern({
        ...recurringPattern,
        daysOfWeek: [...recurringPattern.daysOfWeek, day]
      });
    } else {
      setRecurringPattern({
        ...recurringPattern,
        daysOfWeek: recurringPattern.daysOfWeek.filter(d => d !== day)
      });
    }
  };

  const handleFrequencyChange = (frequency: "Daily" | "Weekly" | "Monthly") => {
    setRecurringPattern({
      ...recurringPattern,
      frequency
    });
  };

  const handleAddClass = () => {
    // Validate times
    if (!validateTimes(newClass.startTime, newClass.endTime)) {
      return;
    }
    
    // Check for schedule conflicts
    const conflict = checkForScheduleConflicts();
    if (conflict) {
      setTimeError(conflict);
      return;
    }
    
    // Update the class with selected trainers
    const classToAdd = {
      ...newClass,
      trainers: selectedTrainers,
      schedule: isRecurring 
        ? `${format(startDate, "MM/dd/yyyy")} (${recurringPattern.frequency})`
        : format(startDate, "MM/dd/yyyy")
    };
    
    onAddClass(classToAdd, isRecurring ? recurringPattern : undefined);
    
    // Reset form
    setNewClass({
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
    setIsRecurring(false);
    setRecurringPattern({
      frequency: "Weekly",
      daysOfWeek: [],
      repeatUntil: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd")
    });
    setSelectedTrainers([]);
    setTimeError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Class</DialogTitle>
          <DialogDescription>
            Create a new fitness class with optional recurring schedule.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Class Name*
            </Label>
            <Input
              id="name"
              name="name"
              value={newClass.name}
              onChange={handleInputChange}
              className="col-span-3"
              required
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Gender</Label>
            <RadioGroup 
              value={newClass.gender} 
              onValueChange={handleGenderChange}
              className="col-span-3 flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="All" id="all" />
                <Label htmlFor="all">All</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Male" id="male" />
                <Label htmlFor="male">Male Only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Female" id="female" />
                <Label htmlFor="female">Female Only</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Trainers*</Label>
            <div className="col-span-3 space-y-2">
              {trainers.map((trainer) => (
                <div key={trainer} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`trainer-${trainer}`} 
                    checked={selectedTrainers.includes(trainer)}
                    onCheckedChange={(checked) => handleTrainerSelection(trainer, checked === true)}
                  />
                  <Label htmlFor={`trainer-${trainer}`}>{trainer}</Label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Start Date*</Label>
            <div className="col-span-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startTime" className="text-right">
              Start Time*
            </Label>
            <div className="col-span-3">
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="startTime"
                  name="startTime"
                  type="time"
                  value={newClass.startTime}
                  onChange={handleInputChange}
                  className="w-full"
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endTime" className="text-right">
              End Time*
            </Label>
            <div className="col-span-3">
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="endTime"
                  name="endTime"
                  type="time"
                  value={newClass.endTime}
                  onChange={handleInputChange}
                  className="w-full"
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="capacity" className="text-right">
              Capacity*
            </Label>
            <Input
              id="capacity"
              name="capacity"
              type="number"
              value={newClass.capacity || ""}
              onChange={handleInputChange}
              className="col-span-3"
              required
              min="1"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="text-right">
              <Checkbox 
                id="recurring" 
                checked={isRecurring}
                onCheckedChange={(checked) => setIsRecurring(checked === true)}
              />
            </div>
            <Label htmlFor="recurring" className="col-span-3">
              Set up recurring schedule
            </Label>
          </div>
          
          {isRecurring && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Frequency</Label>
                <RadioGroup 
                  value={recurringPattern.frequency} 
                  onValueChange={(v) => handleFrequencyChange(v as "Daily" | "Weekly" | "Monthly")}
                  className="col-span-3 flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Daily" id="daily" />
                    <Label htmlFor="daily">Daily</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Weekly" id="weekly" />
                    <Label htmlFor="weekly">Weekly</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Monthly" id="monthly" />
                    <Label htmlFor="monthly">Monthly</Label>
                  </div>
                </RadioGroup>
              </div>
              
              {recurringPattern.frequency === "Weekly" && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right pt-2">Days of Week</Label>
                  <div className="col-span-3 grid grid-cols-4 gap-2">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`day-${day}`} 
                          checked={recurringPattern.daysOfWeek.includes(day)}
                          onCheckedChange={(checked) => handleDaySelection(day, checked === true)}
                        />
                        <Label htmlFor={`day-${day}`}>{day.substring(0, 3)}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Repeat Until</Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {recurringPattern.repeatUntil ? recurringPattern.repeatUntil : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={new Date(recurringPattern.repeatUntil)}
                        onSelect={(date) => date && setRecurringPattern({
                          ...recurringPattern,
                          repeatUntil: format(date, "yyyy-MM-dd")
                        })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </>
          )}
          
          {timeError && (
            <div className="col-span-4 text-destructive text-sm">
              {timeError}
            </div>
          )}
          
          <div className="flex justify-end mt-4">
            <Button 
              onClick={handleAddClass} 
              className="bg-gym-blue hover:bg-gym-dark-blue"
              disabled={
                !newClass.name || 
                !selectedTrainers.length || 
                newClass.capacity <= 0 || 
                (isRecurring && recurringPattern.daysOfWeek.length === 0) ||
                !newClass.startTime ||
                !newClass.endTime ||
                !!timeError
              }
            >
              Add Class
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddClassDialog;
