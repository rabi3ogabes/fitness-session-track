
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Clock } from "lucide-react";
import { ClassModel, RecurringPattern, ClassFormState } from "./ClassTypes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface AddClassDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddClass: (newClass: ClassModel, recurringPattern?: RecurringPattern) => void;
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

const weekdays = [
  { label: "Monday", value: "Monday" },
  { label: "Tuesday", value: "Tuesday" },
  { label: "Wednesday", value: "Wednesday" },
  { label: "Thursday", value: "Thursday" },
  { label: "Friday", value: "Friday" },
  { label: "Saturday", value: "Saturday" },
  { label: "Sunday", value: "Sunday" },
];

const AddClassDialog: React.FC<AddClassDialogProps> = ({
  isOpen,
  onOpenChange,
  onAddClass,
  trainers,
  existingClasses,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const today = new Date();
  
  // Enhanced console logs to debug trainers data
  useEffect(() => {
    if (isOpen) {
      console.log("AddClassDialog opened with trainers:", trainers);
      // Check if the trainers array is empty or undefined
      if (!trainers || trainers.length === 0) {
        console.warn("No trainers available in AddClassDialog. This might be a data loading issue.");
      }
    }
  }, [isOpen, trainers]);
  
  const initialFormState: ClassFormState = {
    name: "",
    gender: "All",
    trainers: [],
    capacity: 10,
    schedule: format(today, "MM/dd/yyyy"),
    isRecurring: false,
    recurringFrequency: "Weekly",
    selectedDays: [format(today, "EEEE")],
    startTime: "17:00", // Default to 5:00 PM
    endTime: "18:00",   // Default to 6:00 PM
    endDate: undefined
  };
  
  const [formState, setFormState] = useState<ClassFormState>(initialFormState);
  const [selectedTab, setSelectedTab] = useState<string>("basic");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);
  const [timeError, setTimeError] = useState<string | null>(null);

  // Reset form when dialog is opened or closed
  useEffect(() => {
    if (isOpen) {
      console.log("Dialog opened, resetting form");
      setFormState(initialFormState);
      setSelectedDate(today);
      setTimeError(null);
      setSelectedTab("basic");
    }
  }, [isOpen, today]);

  // Update schedule when date changes
  useEffect(() => {
    if (selectedDate) {
      setFormState(prev => ({
        ...prev,
        schedule: format(selectedDate, "MM/dd/yyyy")
      }));
    }
  }, [selectedDate]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log(`Input change - field: ${name}, value: ${value}`);
    
    if (name === "capacity") {
      setFormState(prev => ({ 
        ...prev, 
        [name]: parseInt(value) || 0 
      }));
    } else {
      setFormState(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear time error when times change
    if (name === "startTime" || name === "endTime") {
      validateTimes(
        name === "startTime" ? value : formState.startTime, 
        name === "endTime" ? value : formState.endTime
      );
    }
  };

  const handleGenderChange = (value: string) => {
    setFormState(prev => ({ 
      ...prev, 
      gender: value as "Male" | "Female" | "All" 
    }));
  };

  const handleTrainerSelection = (trainer: string, isChecked: boolean) => {
    if (isChecked) {
      setFormState(prev => ({
        ...prev,
        trainers: [...prev.trainers, trainer]
      }));
    } else {
      setFormState(prev => ({
        ...prev,
        trainers: prev.trainers.filter(t => t !== trainer)
      }));
    }
  };

  const handleDaySelection = (day: string, isChecked: boolean) => {
    if (isChecked) {
      setFormState(prev => ({
        ...prev,
        selectedDays: [...prev.selectedDays, day]
      }));
    } else {
      setFormState(prev => ({
        ...prev,
        selectedDays: prev.selectedDays.filter(d => d !== day)
      }));
    }
  };
  
  const handleRecurringChange = (isChecked: boolean) => {
    setFormState(prev => ({
      ...prev,
      isRecurring: isChecked
    }));
  };
  
  const handleFrequencyChange = (frequency: string) => {
    setFormState(prev => ({
      ...prev,
      recurringFrequency: frequency as "Daily" | "Weekly" | "Monthly"
    }));
  };
  
  const handleEndDateChange = (date: Date | undefined) => {
    setFormState(prev => ({
      ...prev,
      endDate: date
    }));
  };

  const handleDifficultyChange = (difficulty: string) => {
    setFormState(prev => ({
      ...prev,
      difficulty: difficulty as "Beginner" | "Intermediate" | "Advanced"
    }));
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
    
    // Check for conflicts only if we're not adding a recurring class
    if (!formState.isRecurring) {
      const conflict = checkForScheduleConflicts();
      if (conflict) {
        setTimeError(conflict);
        return false;
      }
    }
    
    setTimeError(null);
    return true;
  };

  const checkForScheduleConflicts = () => {
    // Only check if trainers are selected
    if (formState.trainers.length === 0) return null;

    const { startTime, endTime, schedule } = formState;

    // Check for conflicts with existing classes
    for (const existingClass of existingClasses) {
      // Skip classes that don't have time data yet
      if (!existingClass.startTime || !existingClass.endTime) continue;
      
      // Skip classes on different dates
      if (schedule !== existingClass.schedule) continue;
      
      // Skip classes with no overlapping trainers
      const existingTrainers = existingClass.trainers || [existingClass.trainer];
      const hasCommonTrainer = formState.trainers.some(trainer => 
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

  const handleAddClass = async () => {
    if (!validateTimes(formState.startTime, formState.endTime)) {
      return;
    }
    
    if (formState.trainers.length === 0) {
      toast({
        title: "Trainer required",
        description: "Please select at least one trainer for the class",
        variant: "destructive",
      });
      return;
    }
    
    if (!formState.name) {
      toast({
        title: "Class name required",
        description: "Please enter a name for the class",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedDate) {
      toast({
        title: "Date required",
        description: "Please select a date for the class",
        variant: "destructive",
      });
      return;
    }
    
    if (formState.isRecurring && !formState.endDate) {
      toast({
        title: "End date required",
        description: "Please select an end date for recurring classes",
        variant: "destructive",
      });
      return;
    }
    
    if (formState.isRecurring && formState.recurringFrequency === "Weekly" && formState.selectedDays.length === 0) {
      toast({
        title: "Days required",
        description: "Please select at least one day of the week",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Add trainers to the class
      const classToAdd: ClassModel = {
        id: 0,
        name: formState.name,
        trainer: formState.trainers[0] || "",
        trainers: formState.trainers,
        schedule: formState.schedule,
        capacity: formState.capacity,
        enrolled: 0,
        status: "Active",
        gender: formState.gender,
        startTime: formState.startTime,
        endTime: formState.endTime,
        difficulty: formState.difficulty,
        location: formState.location,
        description: formState.description,
        color: formState.color
      };
      
      let recurringPattern: RecurringPattern | undefined;
      
      if (formState.isRecurring && formState.endDate) {
        recurringPattern = {
          frequency: formState.recurringFrequency,
          daysOfWeek: formState.selectedDays,
          repeatUntil: format(formState.endDate, "yyyy-MM-dd")
        };
      }
      
      // Submit to parent component
      await onAddClass(classToAdd, recurringPattern);
      
      // Clear form
      setFormState(initialFormState);
      
      toast({
        title: "Class created successfully",
        description: formState.isRecurring 
          ? "Recurring classes have been scheduled" 
          : "The class has been added to the schedule",
      });
    } catch (error) {
      console.error("Error adding class:", error);
      toast({
        title: "Error adding class",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      onOpenChange(false);
    }
  };

  const handleTimeChange = (field: string, value: string) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
    
    validateTimes(
      field === "startTime" ? value : formState.startTime,
      field === "endTime" ? value : formState.endTime
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 max-h-[90vh]">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Add New Class</DialogTitle>
          <DialogDescription>
            Create a new class for your schedule.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-130px)] overflow-y-auto px-6">
          <Tabs defaultValue="basic" value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
            </TabsList>
          
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Class Name*
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formState.name}
                    onChange={handleInputChange}
                    className="col-span-3"
                    placeholder="e.g. Upper Work"
                    required
                    autoFocus
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Gender</Label>
                  <RadioGroup 
                    value={formState.gender} 
                    onValueChange={handleGenderChange}
                    className="col-span-3 flex flex-wrap space-x-4"
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
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="difficulty" className="text-right">
                    Difficulty
                  </Label>
                  <Select 
                    value={formState.difficulty} 
                    onValueChange={handleDifficultyChange}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right">
                    Location
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    value={formState.location || ""}
                    onChange={handleInputChange}
                    className="col-span-3"
                    placeholder="e.g. Main Studio"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="description" className="text-right pt-2">
                    Description
                  </Label>
                  <textarea
                    id="description"
                    name="description"
                    value={formState.description || ""}
                    onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
                    className="col-span-3 h-24 border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    placeholder="Describe the class content"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right pt-2">Trainers*</Label>
                  <div className="col-span-3">
                    {trainers && trainers.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {trainers.map((trainer) => (
                          <div key={trainer} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`trainer-${trainer}`} 
                              checked={formState.trainers.includes(trainer)}
                              onCheckedChange={(checked) => handleTrainerSelection(trainer, checked === true)}
                            />
                            <Label htmlFor={`trainer-${trainer}`} className="text-sm">{trainer}</Label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-amber-600 border border-amber-300 bg-amber-50 p-2 rounded">
                        No trainers available. Please add trainers in the Trainers section before creating classes.
                      </div>
                    )}
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
                    value={formState.capacity}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                    min="1"
                  />
                </div>
              </div>
            </TabsContent>
          
            <TabsContent value="schedule" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="text-right pt-0.5">
                    <Label htmlFor="isRecurring">Recurring</Label>
                  </div>
                  <div className="col-span-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="isRecurring" 
                        checked={formState.isRecurring}
                        onCheckedChange={(checked) => handleRecurringChange(checked === true)}
                      />
                      <Label htmlFor="isRecurring">This is a recurring class</Label>
                    </div>
                  </div>
                </div>

                {formState.isRecurring ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                      <Label className="text-right pt-2">Frequency</Label>
                      <div className="col-span-3">
                        <Select 
                          value={formState.recurringFrequency} 
                          onValueChange={handleFrequencyChange}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Daily">Daily</SelectItem>
                            <SelectItem value="Weekly">Weekly</SelectItem>
                            <SelectItem value="Monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {formState.recurringFrequency === "Weekly" && (
                      <div className="grid grid-cols-4 gap-4 items-start">
                        <Label className="text-right pt-2">Days*</Label>
                        <div className="col-span-3 grid grid-cols-2 gap-2">
                          {weekdays.map((day) => (
                            <div key={day.value} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`day-${day.value}`} 
                                checked={formState.selectedDays.includes(day.value)}
                                onCheckedChange={(checked) => handleDaySelection(day.value, checked === true)}
                              />
                              <Label htmlFor={`day-${day.value}`} className="text-sm">{day.label}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-4 gap-4">
                      <Label className="text-right pt-2">Until*</Label>
                      <div className="col-span-3">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !formState.endDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formState.endDate ? format(formState.endDate, "PPP") : "Select end date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 z-50" align="start">
                            <Calendar
                              mode="single"
                              selected={formState.endDate}
                              onSelect={handleEndDateChange}
                              initialFocus
                              disabled={(date) => date < today}
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">Date*</Label>
                    <div className="col-span-3">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !selectedDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-50" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Start Time*</Label>
                  <div className="col-span-3">
                    <Select
                      value={formState.startTime}
                      onValueChange={(value) => handleTimeChange("startTime", value)}
                    >
                      <SelectTrigger className="w-full">
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {timeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">End Time*</Label>
                  <div className="col-span-3">
                    <Select
                      value={formState.endTime}
                      onValueChange={(value) => handleTimeChange("endTime", value)}
                    >
                      <SelectTrigger className="w-full">
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {timeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {timeError && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <div className="col-span-4 text-destructive text-sm">
                      {timeError}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>
        
        <div className="p-6 pt-2 flex justify-end border-t">
          <Button 
            onClick={handleAddClass} 
            className="bg-gym-blue hover:bg-gym-dark-blue"
            disabled={
              isSubmitting ||
              !formState.name || 
              formState.trainers.length === 0 || 
              !selectedDate || 
              !formState.startTime ||
              !formState.endTime ||
              formState.capacity <= 0 ||
              !!timeError ||
              (formState.isRecurring && !formState.endDate) ||
              (formState.isRecurring && formState.recurringFrequency === "Weekly" && formState.selectedDays.length === 0)
            }
          >
            {isSubmitting ? "Adding..." : formState.isRecurring ? "Add Recurring Classes" : "Add Class"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddClassDialog;
