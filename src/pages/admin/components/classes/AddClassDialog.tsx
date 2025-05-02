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
import { CalendarIcon, Clock } from "lucide-react";
import { ClassModel, RecurringPattern } from "./ClassTypes";
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

  const [newClass, setNewClass] = useState<ClassModel>({
    id: 0,
    name: "",
    trainer: "",
    trainers: [],
    schedule: format(today, "MM/dd/yyyy"),
    capacity: 10,
    enrolled: 0,
    status: "Active",
    gender: "All",
    startTime: "09:00",
    endTime: "10:00"
  });

  const [selectedTab, setSelectedTab] = useState<string>("basic");
  const [selectedTrainers, setSelectedTrainers] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);

  // Recurring state
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurringFrequency, setRecurringFrequency] = useState<string>("Weekly");
  const [selectedDays, setSelectedDays] = useState<string[]>([format(today, "EEEE")]);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [timeError, setTimeError] = useState<string | null>(null);

  // Reset form when dialog is opened or closed
  useEffect(() => {
    if (isOpen) {
      // Reset form
      setNewClass({
        id: 0,
        name: "",
        trainer: "",
        trainers: [],
        schedule: format(today, "MM/dd/yyyy"),
        capacity: 10,
        enrolled: 0,
        status: "Active",
        gender: "All",
        startTime: "09:00",
        endTime: "10:00"
      });
      setSelectedTrainers([]);
      setSelectedDate(today);
      setIsRecurring(false);
      setRecurringFrequency("Weekly");
      setSelectedDays([format(today, "EEEE")]);
      setEndDate(undefined);
      setTimeError(null);
      setSelectedTab("basic");
    }
  }, [isOpen, today]);

  // Update schedule when date changes
  useEffect(() => {
    if (selectedDate) {
      setNewClass(prev => ({
        ...prev,
        schedule: format(selectedDate, "MM/dd/yyyy")
      }));
    }
  }, [selectedDate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    console.log(`Input change - field: ${name}, value: ${value}`);
    
    // For capacity, ensure it's a number
    if (name === "capacity") {
      setNewClass(prev => ({ 
        ...prev, 
        [name]: parseInt(value) || 0 
      }));
    } else {
      setNewClass(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear time error when times change
    if (name === "startTime" || name === "endTime") {
      validateTimes(
        name === "startTime" ? value : newClass.startTime, 
        name === "endTime" ? value : newClass.endTime
      );
    }
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
  };

  const handleDaySelection = (day: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedDays(prev => [...prev, day]);
    } else {
      setSelectedDays(prev => prev.filter(d => d !== day));
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
    
    // Check for conflicts only if we're not adding a recurring class
    if (!isRecurring) {
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
    if (selectedTrainers.length === 0) return null;

    const { startTime, endTime, schedule } = newClass;

    // Check for conflicts with existing classes
    for (const existingClass of existingClasses) {
      // Skip classes that don't have time data yet
      if (!existingClass.startTime || !existingClass.endTime) continue;
      
      // Skip classes on different dates
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

  const handleAddClass = async () => {
    if (!validateTimes(newClass.startTime, newClass.endTime)) {
      return;
    }
    
    if (selectedTrainers.length === 0) {
      toast({
        title: "Trainer required",
        description: "Please select at least one trainer for the class",
        variant: "destructive",
      });
      return;
    }
    
    if (!newClass.name) {
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
    
    if (isRecurring && !endDate) {
      toast({
        title: "End date required",
        description: "Please select an end date for recurring classes",
        variant: "destructive",
      });
      return;
    }
    
    if (isRecurring && recurringFrequency === "Weekly" && selectedDays.length === 0) {
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
        ...newClass,
        trainers: selectedTrainers,
        // For backward compatibility, keep the first trainer in the trainer field
        trainer: selectedTrainers[0] || ""
      };
      
      let recurringPattern: RecurringPattern | undefined;
      
      if (isRecurring && endDate) {
        recurringPattern = {
          frequency: recurringFrequency as "Daily" | "Weekly" | "Monthly",
          daysOfWeek: selectedDays,
          repeatUntil: format(endDate, "yyyy-MM-dd")
        };
      }
      
      // Submit to parent component
      await onAddClass(classToAdd, recurringPattern);
      
      // Clear form
      setNewClass({
        id: 0,
        name: "",
        trainer: "",
        trainers: [],
        schedule: format(today, "MM/dd/yyyy"),
        capacity: 10,
        enrolled: 0,
        status: "Active",
        gender: "All",
        startTime: "09:00",
        endTime: "10:00"
      });
      setSelectedTrainers([]);
    } catch (error) {
      console.error("Error adding class:", error);
      toast({
        title: "Error adding class",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
                    value={newClass.name}
                    onChange={handleInputChange}
                    className="col-span-3"
                    placeholder="e.g. Morning Yoga"
                    required
                    autoFocus
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Gender</Label>
                  <RadioGroup 
                    value={newClass.gender} 
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
                
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right pt-2">Trainers*</Label>
                  <div className="col-span-3 grid grid-cols-2 gap-2">
                    {trainers.map((trainer) => (
                      <div key={trainer} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`trainer-${trainer}`} 
                          checked={selectedTrainers.includes(trainer)}
                          onCheckedChange={(checked) => handleTrainerSelection(trainer, checked === true)}
                        />
                        <Label htmlFor={`trainer-${trainer}`} className="text-sm">{trainer}</Label>
                      </div>
                    ))}
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
              </div>
            </TabsContent>
          
            <TabsContent value="schedule" className="space-y-4 mt-4">
              <div className="space-y-4">
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
                        value={newClass.startTime || ""}
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
                        value={newClass.endTime || ""}
                        onChange={handleInputChange}
                        className="w-full"
                        required
                      />
                    </div>
                  </div>
                </div>
              
                <div className="grid grid-cols-4 items-start gap-4">
                  <div className="text-right pt-0.5">
                    <Label htmlFor="isRecurring">Recurring</Label>
                  </div>
                  <div className="col-span-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="isRecurring" 
                        checked={isRecurring}
                        onCheckedChange={(checked) => setIsRecurring(checked === true)}
                      />
                      <Label htmlFor="isRecurring">This is a recurring class</Label>
                    </div>
                    
                    {isRecurring && (
                      <div className="mt-4 space-y-4 border rounded-md p-4 bg-gray-50">
                        <div className="grid grid-cols-3 gap-4">
                          <Label className="pt-2">Frequency</Label>
                          <div className="col-span-2">
                            <select
                              value={recurringFrequency}
                              onChange={(e) => setRecurringFrequency(e.target.value)}
                              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-gym-blue focus:border-transparent"
                            >
                              <option value="Daily">Daily</option>
                              <option value="Weekly">Weekly</option>
                              <option value="Monthly">Monthly</option>
                            </select>
                          </div>
                        </div>
                        
                        {recurringFrequency === "Weekly" && (
                          <div className="grid grid-cols-3 gap-4 items-start">
                            <Label className="pt-2">Days</Label>
                            <div className="col-span-2 grid grid-cols-2 gap-2">
                              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                                <div key={day} className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`day-${day}`} 
                                    checked={selectedDays.includes(day)}
                                    onCheckedChange={(checked) => handleDaySelection(day, checked === true)}
                                  />
                                  <Label htmlFor={`day-${day}`} className="text-sm">{day}</Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-3 gap-4">
                          <Label className="pt-2">Until</Label>
                          <div className="col-span-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !endDate && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {endDate ? format(endDate, "PPP") : "Select end date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 z-50" align="start">
                                <Calendar
                                  mode="single"
                                  selected={endDate}
                                  onSelect={setEndDate}
                                  initialFocus
                                  disabled={(date) => date < today}
                                  className="pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {timeError && (
                  <div className="col-span-4 text-destructive text-sm">
                    {timeError}
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
              !newClass.name || 
              selectedTrainers.length === 0 || 
              !selectedDate || 
              !newClass.startTime ||
              !newClass.endTime ||
              newClass.capacity <= 0 ||
              !!timeError ||
              (isRecurring && !endDate) ||
              (isRecurring && recurringFrequency === "Weekly" && selectedDays.length === 0)
            }
          >
            {isSubmitting ? "Adding..." : isRecurring ? "Add Recurring Classes" : "Add Class"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddClassDialog;
