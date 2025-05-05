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
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Clock, Plus } from "lucide-react";
import { ClassModel, RecurringPattern, ClassFormState } from "./ClassTypes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";

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

// Difficulty options
const difficultyOptions = [
  { label: "Beginner", value: "Beginner" },
  { label: "Intermediate", value: "Intermediate" },
  { label: "Advanced", value: "Advanced" },
];

// Color options for visual categorization
const colorOptions = [
  { label: "Blue", value: "#3b82f6" },
  { label: "Red", value: "#ef4444" },
  { label: "Green", value: "#10b981" },
  { label: "Purple", value: "#8b5cf6" },
  { label: "Orange", value: "#f97316" },
  { label: "Pink", value: "#ec4899" },
  { label: "Teal", value: "#14b8a6" },
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
  const [isDirectDbInsert, setIsDirectDbInsert] = useState(false);
  const today = new Date();
  
  // Enhanced console logs to debug trainers data
  useEffect(() => {
    if (isOpen) {
      console.log("AddClassDialog opened with trainers:", trainers);
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
    endDate: undefined,
    description: "",
    location: "",
    difficulty: "Beginner",
    color: "#3b82f6", // Default blue
    equipment: "",
    caloriesBurned: 0
  };
  
  const [formState, setFormState] = useState<ClassFormState>(initialFormState);
  const [selectedTab, setSelectedTab] = useState<string>("basic");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [dbInsertResult, setDbInsertResult] = useState<string | null>(null);

  // Reset form when dialog is opened or closed
  useEffect(() => {
    if (isOpen) {
      console.log("Dialog opened, resetting form");
      setFormState(initialFormState);
      setSelectedDate(today);
      setTimeError(null);
      setSelectedTab("basic");
      setDbInsertResult(null);
      setIsDirectDbInsert(false);
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
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    console.log(`Input change - field: ${name}, value: ${value}`);
    
    if (name === "capacity" || name === "caloriesBurned") {
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

  const handleColorChange = (color: string) => {
    setFormState(prev => ({
      ...prev,
      color: color
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

  const insertDirectlyToDatabase = async () => {
    try {
      setIsSubmitting(true);
      setDbInsertResult(null);
      
      // Create class object for database insertion
      const classToInsert = {
        name: formState.name,
        trainer: formState.trainers[0] || "",
        trainers: formState.trainers,
        schedule: formState.schedule,
        capacity: formState.capacity,
        enrolled: 0,
        status: "Active",
        gender: formState.gender,
        start_time: formState.startTime,
        end_time: formState.endTime,
        description: formState.description,
        location: formState.location,
        difficulty: formState.difficulty,
        color: formState.color,
      };
      
      // Insert to Supabase
      const { data, error } = await supabase
        .from('classes')
        .insert([classToInsert])
        .select();
        
      if (error) {
        console.error("Database insertion error:", error);
        setDbInsertResult(`Error: ${error.message}`);
        toast({
          title: "Database insertion failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      if (data) {
        console.log("Database insertion successful:", data);
        setDbInsertResult(`Success! Class "${formState.name}" inserted with ID: ${data[0].id}`);
        toast({
          title: "Class created successfully",
          description: `Class "${formState.name}" has been added to the database.`,
        });
        
        // Reset form after successful insertion
        setFormState(initialFormState);
        setTimeout(() => {
          onOpenChange(false);
        }, 2000);
      }
    } catch (err) {
      console.error("Error in direct database insertion:", err);
      setDbInsertResult(`Unexpected error: ${err}`);
      toast({
        title: "Database insertion failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
    
    // Direct database insertion if option is selected
    if (isDirectDbInsert) {
      await insertDirectlyToDatabase();
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
        color: formState.color,
        equipment: formState.equipment,
        caloriesBurned: formState.caloriesBurned
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
      <DialogContent className="sm:max-w-[650px] p-0 max-h-[90vh]">
        <DialogHeader className="p-6 pb-2 bg-gradient-to-br from-gym-blue to-gym-dark-blue text-white rounded-t-lg">
          <DialogTitle className="text-2xl font-bold">Create New Class</DialogTitle>
          <p className="text-gray-100 mt-2">
            Add a new fitness class to your schedule
          </p>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-130px)] overflow-y-auto px-6 pt-4">
          <Tabs defaultValue="basic" value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="basic" className="text-sm">Basic Info</TabsTrigger>
              <TabsTrigger value="schedule" className="text-sm">Schedule</TabsTrigger>
              <TabsTrigger value="details" className="text-sm">Details</TabsTrigger>
            </TabsList>
          
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right font-medium">
                    Class Name*
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formState.name}
                    onChange={handleInputChange}
                    className="col-span-3"
                    placeholder="e.g. Upper Body Workout"
                    required
                    autoFocus
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-medium">Gender</Label>
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
                  <Label htmlFor="difficulty" className="text-right font-medium">
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
                      {difficultyOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right font-medium">
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
                  <Label htmlFor="description" className="text-right pt-2 font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formState.description || ""}
                    onChange={handleInputChange}
                    className="col-span-3 h-24 min-h-[100px]"
                    placeholder="Describe the class content, benefits, and what to expect"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right pt-2 font-medium">Trainers*</Label>
                  <div className="col-span-3">
                    {trainers && trainers.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {trainers.map((trainer) => (
                          <div key={trainer} className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50">
                            <Checkbox 
                              id={`trainer-${trainer}`} 
                              checked={formState.trainers.includes(trainer)}
                              onCheckedChange={(checked) => handleTrainerSelection(trainer, checked === true)}
                            />
                            <Label htmlFor={`trainer-${trainer}`} className="text-sm cursor-pointer">{trainer}</Label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-amber-600 border border-amber-300 bg-amber-50 p-3 rounded-md">
                        No trainers available. Please add trainers in the Trainers section before creating classes.
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="capacity" className="text-right font-medium">
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
                    <Label htmlFor="isRecurring" className="font-medium">Recurring</Label>
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
                      <Label className="text-right pt-2 font-medium">Frequency</Label>
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
                        <Label className="text-right pt-2 font-medium">Days*</Label>
                        <div className="col-span-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {weekdays.map((day) => (
                            <div key={day.value} className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50">
                              <Checkbox 
                                id={`day-${day.value}`} 
                                checked={formState.selectedDays.includes(day.value)}
                                onCheckedChange={(checked) => handleDaySelection(day.value, checked === true)}
                              />
                              <Label htmlFor={`day-${day.value}`} className="text-sm cursor-pointer">{day.label}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-4 gap-4">
                      <Label className="text-right pt-2 font-medium">Until*</Label>
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
                    <Label className="text-right pt-2 font-medium">Date*</Label>
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
                  <Label className="text-right font-medium">Start Time*</Label>
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
                  <Label className="text-right font-medium">End Time*</Label>
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
                    <div className="col-span-4 text-destructive text-sm p-2 bg-red-50 border border-red-200 rounded-md">
                      {timeError}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="color" className="text-right font-medium">
                    Color Tag
                  </Label>
                  <div className="col-span-3">
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((color) => (
                        <div
                          key={color.value}
                          className={`w-8 h-8 rounded-full cursor-pointer transition-all ${
                            formState.color === color.value ? 
                            'ring-2 ring-offset-2 ring-black scale-110' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => handleColorChange(color.value)}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="equipment" className="text-right font-medium">
                    Equipment
                  </Label>
                  <Input
                    id="equipment"
                    name="equipment"
                    value={formState.equipment || ""}
                    onChange={handleInputChange}
                    className="col-span-3"
                    placeholder="e.g. Dumbbells, Yoga mat"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="caloriesBurned" className="text-right font-medium">
                    Est. Calories
                  </Label>
                  <Input
                    id="caloriesBurned"
                    name="caloriesBurned"
                    type="number"
                    value={formState.caloriesBurned || ""}
                    onChange={handleInputChange}
                    className="col-span-3"
                    placeholder="Estimated calories burned"
                    min="0"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="text-right pt-0.5">
                    <Label htmlFor="directInsert" className="font-medium">Database</Label>
                  </div>
                  <div className="col-span-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="directInsert" 
                        checked={isDirectDbInsert}
                        onCheckedChange={(checked) => setIsDirectDbInsert(checked === true)}
                      />
                      <Label htmlFor="directInsert">Insert directly to database (verify operation)</Label>
                    </div>
                  </div>
                </div>
                
                {dbInsertResult && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <div className="col-span-4 p-3 rounded-md border text-sm" 
                      className={`${dbInsertResult.startsWith("Success") ? 
                        "bg-green-50 border-green-200 text-green-800" : 
                        "bg-red-50 border-red-200 text-red-800"}`}>
                      {dbInsertResult}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>
        
        <div className="p-6 flex justify-between border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
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
            {isSubmitting ? "Creating..." : isDirectDbInsert ? "Insert to Database" : 
              formState.isRecurring ? "Add Recurring Classes" : "Add Class"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddClassDialog;
