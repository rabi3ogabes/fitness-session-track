import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, addWeeks, addMonths, parse } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ClassModel } from "./ClassTypes";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/DashboardLayout";

const timeOptions = [
  "05:00", "05:30", "06:00", "06:30", "07:00", "07:30", "08:00", "08:30",
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
  "21:00", "21:30", "22:00"
];

const weekdays = [
  { id: "Monday", label: "Monday" },
  { id: "Tuesday", label: "Tuesday" },
  { id: "Wednesday", label: "Wednesday" },
  { id: "Thursday", label: "Thursday" },
  { id: "Friday", label: "Friday" },
  { id: "Saturday", label: "Saturday" },
  { id: "Sunday", label: "Sunday" },
];

const formSchema = z.object({
  name: z.string().min(2, "Class name must be at least 2 characters"),
  trainer: z.string().min(1, "Trainer is required"),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  gender: z.enum(["All", "Male", "Female"]),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.enum(["Weekly", "Monthly"]).optional(),
  selectedDays: z.array(z.string()).min(1, "Select at least one day").optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]).optional(),
  endDate: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const ClassSchedulePage = () => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [trainers, setTrainers] = useState<{ id: number; name: string }[]>([]);
  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [classToDelete, setClassToDelete] = useState<number | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      trainer: "",
      capacity: 10,
      gender: "All",
      startTime: "17:00",
      endTime: "18:00",
      isRecurring: false,
      recurringFrequency: "Weekly",
      selectedDays: [],
      description: "",
      location: "",
      difficulty: "Beginner",
    },
  });

  useEffect(() => {
    fetchTrainers();
    fetchClasses();
  }, []);

  const fetchTrainers = async () => {
    try {
      console.log("Fetching trainers...");
      const { data, error } = await supabase
        .from("trainers")
        .select("id, name")
        .eq("status", "Active");

      if (error) {
        console.error("Error fetching trainers:", error);
        throw error;
      }
      
      console.log("Trainers fetched:", data);
      setTrainers(data || []);
    } catch (error) {
      console.error("Error fetching trainers:", error);
      toast({
        title: "Failed to load trainers",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const fetchClasses = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
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
      }));
      
      setClasses(formattedClasses);
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast({
        title: "Failed to load classes",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = () => {
    form.reset();
    setIsOpen(true);
  };

  const generateRecurringDates = (
    startDate: Date, 
    endDate: Date, 
    frequency: "Weekly" | "Monthly", 
    days: string[]
  ) => {
    const dates: Date[] = [];
    const daysMap: Record<string, number> = {
      "Sunday": 0,
      "Monday": 1,
      "Tuesday": 2,
      "Wednesday": 3,
      "Thursday": 4,
      "Friday": 5,
      "Saturday": 6
    };
    
    if (frequency === "Weekly") {
      let currentWeek = new Date(startDate);
      
      while (currentWeek <= endDate) {
        for (const day of days) {
          const dayNumber = daysMap[day];
          const classDate = new Date(currentWeek);
          classDate.setDate(classDate.getDate() - classDate.getDay() + dayNumber);
          
          if (classDate >= startDate && classDate <= endDate) {
            dates.push(new Date(classDate));
          }
        }
        
        currentWeek = addWeeks(currentWeek, 1);
      }
    } else if (frequency === "Monthly") {
      let currentMonth = new Date(startDate);
      const dayOfMonth = startDate.getDate();
      
      while (currentMonth <= endDate) {
        dates.push(new Date(currentMonth));
        currentMonth = addMonths(currentMonth, 1);
      }
    }
    
    return dates;
  };

  const onSubmit = async (values: FormValues) => {
    try {
      console.log("Form values:", values);
      // Validate times
      if (values.startTime >= values.endTime) {
        toast({
          title: "Invalid time range",
          description: "End time must be after start time",
          variant: "destructive",
        });
        return;
      }
      
      // For recurring classes, generate all dates
      if (values.isRecurring && values.endDate) {
        const today = new Date();
        const dates = generateRecurringDates(
          today,
          values.endDate,
          values.recurringFrequency || "Weekly",
          values.selectedDays || []
        );
        
        if (dates.length === 0) {
          toast({
            title: "No dates generated",
            description: "Please check your recurring settings",
            variant: "destructive",
          });
          return;
        }
        
        // Create multiple class entries
        const classesToCreate = dates.map(date => ({
          name: values.name,
          trainer: values.trainer,
          trainers: [values.trainer],
          capacity: values.capacity,
          gender: values.gender,
          start_time: values.startTime,
          end_time: values.endTime,
          schedule: format(date, "MM/dd/yyyy"),
          status: "Active",
          enrolled: 0,
          description: values.description || null,
          location: values.location || null,
          difficulty: values.difficulty || "Beginner",
        }));
        
        const { error } = await supabase
          .from("classes")
          .insert(classesToCreate);
          
        if (error) throw error;
        
        toast({
          title: "Classes created",
          description: `Created ${dates.length} recurring classes`,
        });
      } else {
        // Create a single class
        const { error } = await supabase
          .from("classes")
          .insert({
            name: values.name,
            trainer: values.trainer,
            trainers: [values.trainer],
            capacity: values.capacity,
            gender: values.gender,
            start_time: values.startTime,
            end_time: values.endTime,
            schedule: format(new Date(), "MM/dd/yyyy"),
            status: "Active",
            enrolled: 0,
            description: values.description || null,
            location: values.location || null,
            difficulty: values.difficulty || "Beginner",
          });
          
        if (error) throw error;
        
        toast({
          title: "Class created",
          description: "New class has been created successfully",
        });
      }
      
      // Refresh classes
      fetchClasses();
      setIsOpen(false);
    } catch (error) {
      console.error("Error creating class:", error);
      toast({
        title: "Failed to create class",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClass = (id: number) => {
    setClassToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!classToDelete) return;
    
    try {
      const { error } = await supabase
        .from("classes")
        .delete()
        .eq("id", classToDelete);
        
      if (error) throw error;
      
      toast({
        title: "Class deleted",
        description: "Class has been removed successfully",
      });
      
      fetchClasses();
    } catch (error) {
      console.error("Error deleting class:", error);
      toast({
        title: "Failed to delete class",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setShowDeleteConfirm(false);
      setClassToDelete(null);
    }
  };

  const toggleClassStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    
    try {
      const { error } = await supabase
        .from("classes")
        .update({ status: newStatus })
        .eq("id", id);
        
      if (error) throw error;
      
      toast({
        title: "Status updated",
        description: `Class is now ${newStatus}`,
      });
      
      fetchClasses();
    } catch (error) {
      console.error("Error updating class status:", error);
      toast({
        title: "Failed to update status",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const formatTime = (time: string): string => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  };

  return (
    <DashboardLayout title="Class Schedule">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Class Schedule Management</h2>
          <p className="text-gray-500">Create and manage recurring class schedules</p>
        </div>
        <Button 
          className="bg-gym-blue hover:bg-gym-dark-blue" 
          onClick={handleOpen}
        >
          Create New Class
        </Button>
      </div>

      {/* Class Creation Form Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Class</DialogTitle>
            <DialogDescription>
              Fill in the details to schedule a new class
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Yoga Class" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="trainer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trainer*</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select trainer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {trainers.length === 0 && (
                            <SelectItem value="no-trainers" disabled>No trainers available</SelectItem>
                          )}
                          {trainers.map((trainer) => (
                            <SelectItem key={trainer.id} value={trainer.name}>
                              {trainer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity*</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))} 
                          min={1}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="All">All</SelectItem>
                          <SelectItem value="Male">Male Only</SelectItem>
                          <SelectItem value="Female">Female Only</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time*</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timeOptions.map(time => (
                            <SelectItem key={time} value={time}>
                              {formatTime(time)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time*</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timeOptions.map(time => (
                            <SelectItem key={time} value={time}>
                              {formatTime(time)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">This is a recurring class</FormLabel>
                  </FormItem>
                )}
              />
              
              {form.watch("isRecurring") && (
                <div className="space-y-4 border p-4 rounded-lg">
                  <FormField
                    control={form.control}
                    name="recurringFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequency</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Weekly">Weekly</SelectItem>
                            <SelectItem value="Monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("recurringFrequency") === "Weekly" && (
                    <FormField
                      control={form.control}
                      name="selectedDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Days of the Week</FormLabel>
                          <div className="grid grid-cols-2 gap-2">
                            {weekdays.map((day) => (
                              <div key={day.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={day.id}
                                  checked={field.value?.includes(day.id)}
                                  onCheckedChange={(checked) => {
                                    const currentDays = [...(field.value || [])];
                                    if (checked) {
                                      field.onChange([...currentDays, day.id]);
                                    } else {
                                      field.onChange(
                                        currentDays.filter((value) => value !== day.id)
                                      );
                                    }
                                  }}
                                />
                                <label htmlFor={day.id}>{day.label}</label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Beginner">Beginner</SelectItem>
                          <SelectItem value="Intermediate">Intermediate</SelectItem>
                          <SelectItem value="Advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Main Studio" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <textarea
                        className="w-full border rounded-md p-2 min-h-[80px]"
                        placeholder="Class description..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" className="bg-gym-blue hover:bg-gym-dark-blue">
                  Create Class
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Class</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this class? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Classes List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">Loading classes...</div>
        ) : classes.length === 0 ? (
          <div className="p-8 text-center">
            No classes found. Create your first class to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trainer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Schedule
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {classes.map((cls) => (
                  <tr key={cls.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{cls.name}</div>
                      {cls.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {cls.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{cls.trainer}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{cls.schedule}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatTime(cls.startTime || "")} - {formatTime(cls.endTime || "")}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {cls.enrolled || 0}/{cls.capacity}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        cls.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {cls.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleClassStatus(cls.id, cls.status || "Active")}
                          className={cls.status === "Active" ? "text-amber-600" : "text-green-600"}
                        >
                          {cls.status === "Active" ? "Deactivate" : "Activate"}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteClass(cls.id)}
                          className="text-red-600"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClassSchedulePage;
