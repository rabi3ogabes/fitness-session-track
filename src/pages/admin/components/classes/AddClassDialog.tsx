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
  
  // Added console logs to debug trainers data
  useEffect(() => {
    if (isOpen) {
      console.log("AddClassDialog opened with trainers:", trainers);
    }
  }, [isOpen, trainers]);
  
  const initialFormState: ClassFormState = {
    name: "",
    gender: "All",
    trainers: [],
    capacity: 10,
    schedule: format(today, "yyyy-MM-dd"),
    isRecurring: false,
    recurringFrequency: "Weekly",
    selectedDays: [format(today, "EEEE")],
    start_time: "17:00", // Changed from startTime
    end_time: "18:00",   // Changed from endTime
    endDate: undefined,
    description: "",
    location: "",
    difficulty: "Beginner",
    color: "#7dd3fc"
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
  }, [isOpen, initialFormState, today]); // Added initialFormState to dependencies

  // Update schedule when date changes
  useEffect(() => {
    if (selectedDate) {
      setFormState(prev => ({
        ...prev,
        schedule: format(selectedDate, "yyyy-MM-dd")
      }));
    }
  }, [selectedDate]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log(`Input change - field: ${name}, value: ${value}`);
    
    let updatedValue: string | number = value;
    if (name === "capacity") {
      updatedValue = parseInt(value) || 0;
    }
  
    setFormState(prev => ({ 
      ...prev, 
      [name]: updatedValue 
    }));
    
    if (name === "start_time" || name === "end_time") {
      validateTimes(
        name === "start_time" ? value : formState.start_time, 
        name === "end_time" ? value : formState.end_time
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
    setFormState(prev => ({
      ...prev,
      trainers: isChecked ? [...prev.trainers, trainer] : prev.trainers.filter(t => t !== trainer)
    }));
  };

  const handleDaySelection = (day: string, isChecked: boolean) => {
    setFormState(prev => ({
      ...prev,
      selectedDays: isChecked ? [...prev.selectedDays, day] : prev.selectedDays.filter(d => d !== day)
    }));
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

  const validateTimes = (start_time: string | undefined, end_time: string | undefined) => { // Changed parameters
    if (!start_time || !end_time) {
      setTimeError("Start and end times are required");
      return false;
    }
    
    if (start_time >= end_time) {
      setTimeError("End time must be after start time");
      return false;
    }
    
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
    if (formState.trainers.length === 0) return null;

    const { start_time, end_time, schedule } = formState; // Changed from startTime, endTime

    for (const existingClass of existingClasses) {
      if (!existingClass.start_time || !existingClass.end_time) continue; // Changed from startTime, endTime
      if (schedule !== existingClass.schedule) continue;
      
      const existingTrainers = existingClass.trainers || [existingClass.trainer].filter(Boolean) as string[];
      const hasCommonTrainer = formState.trainers.some(trainer => 
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

  const handleAddClass = async () => {
    console.log("Submit button clicked. Validating form...");
    
    if (!validateTimes(formState.start_time, formState.end_time)) { // Changed properties
      console.error("Time validation failed:", timeError);
      return;
    }
    
    // Remove trainer validation check - trainer field is now optional
    // Keeping other validations
    if (!formState.name) {
      console.error("Validation failed: Missing class name");
      toast({
        title: "Class name required",
        description: "Please enter a name for the class",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedDate && !formState.isRecurring) { // Only require selectedDate if not recurring
      console.error("Validation failed: Missing date for non-recurring class");
      toast({
        title: "Date required",
        description: "Please select a date for the class",
        variant: "destructive",
      });
      return;
    }
    
    if (formState.isRecurring && !formState.endDate) {
      console.error("Validation failed: Missing end date for recurring class");
      toast({
        title: "End date required",
        description: "Please select an end date for recurring classes",
        variant: "destructive",
      });
      return;
    }
    
    if (formState.isRecurring && formState.recurringFrequency === "Weekly" && formState.selectedDays.length === 0) {
      console.error("Validation failed: No days selected for weekly recurring class");
      toast({
        title: "Days required",
        description: "Please select at least one day of the week",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Form validation passed. Preparing class data...");
    
    try {
      setIsSubmitting(true);
      
      // Add trainers to the class
      const classToAdd: ClassModel = {
        id: 0, // This will be assigned by the database
        name: formState.name,
        trainer: formState.trainers[0] || "", // Might be empty now
        trainers: formState.trainers,
        schedule: formState.schedule,
        capacity: formState.capacity,
        enrolled: 0,
        status: "Active",
        gender: formState.gender,
        start_time: formState.start_time,
        end_time: formState.end_time,
        difficulty: formState.difficulty,
        location: formState.location,
        description: formState.description,
        color: formState.color,
      };
      
      console.log("Class data prepared:", classToAdd);
      
      let recurringPattern: RecurringPattern | undefined;
      
      if (formState.isRecurring && formState.endDate) {
        recurringPattern = {
          frequency: formState.recurringFrequency,
          daysOfWeek: formState.selectedDays,
          repeatUntil: format(formState.endDate, "yyyy-MM-dd")
        };
        console.log("Created recurring pattern:", recurringPattern);
      }
      
      console.log("Submitting class data to parent component");
      // Submit to parent component
      await onAddClass(classToAdd, recurringPattern);
      
      // Clear form
      setFormState(initialFormState);
      
      console.log("Class submission completed successfully");
      toast({
        title: "Class created successfully",
        description: formState.isRecurring 
          ? "Recurring classes have been scheduled" 
          : "The class has been added to the schedule",
      });
    } catch (error) {
      console.error("Error in handleAddClass:", error);
      toast({
        title: "Error adding class",
        description: (error as Error).message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      // We'll leave the dialog open/close to be handled by the onAddClass function
      // to ensure the dialog only closes after successful submission
    }
  };

  const handleTimeChange = (field: "start_time" | "end_time", value: string) => { // field type updated
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
    
    validateTimes(
      field === "start_time" ? value : formState.start_time,
      field === "end_time" ? value : formState.end_time
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
                  <Label className="text-right pt-2">Trainers</Label>
                  <div className="col-span-3 grid grid-cols-2 gap-2">
                    {trainers && trainers.length > 0 ? (
                      trainers.map((trainer) => (
                        <div key={trainer} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`trainer-${trainer}`} 
                            checked={formState.trainers.includes(trainer)}
                            onCheckedChange={(checked) => handleTrainerSelection(trainer, checked === true)}
                          />
                          <Label htmlFor={`trainer-${trainer}`} className="text-sm">{trainer}</Label>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-muted-foreground italic">
                        No trainers available. Please add trainers first.
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
                    value={String(formState.capacity)} // Ensure value is string for Input
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
                      value={formState.start_time} // Changed from startTime
                      onValueChange={(value) => handleTimeChange("start_time", value)} // Changed to start_time
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
                      value={formState.end_time} // Changed from endTime
                      onValueChange={(value) => handleTimeChange("end_time", value)} // Changed to end_time
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
              (!selectedDate && !formState.isRecurring) || 
              !formState.start_time || // Changed from startTime
              !formState.end_time ||   // Changed from endTime
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
