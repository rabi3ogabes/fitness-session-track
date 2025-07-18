import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  supabase,
  requireAuth,
  isOffline,
  cacheDataForOffline,
} from "@/integrations/supabase/client";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ClassModel } from "./ClassTypes";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  Clock,
  AlertCircle,
  RefreshCw,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/DashboardLayout";

const timeOptions = [
  "05:00",
  "05:15",
  "05:30",
  "05:45",
  "06:00",
  "06:15",
  "06:30",
  "06:45",
  "07:00",
  "07:15",
  "07:30",
  "07:45",
  "08:00",
  "08:15",
  "08:30",
  "08:45",
  "09:00",
  "09:15",
  "09:30",
  "09:45",
  "10:00",
  "10:15",
  "10:30",
  "10:45",
  "11:00",
  "11:15",
  "11:30",
  "11:45",
  "12:00",
  "12:15",
  "12:30",
  "12:45",
  "13:00",
  "13:15",
  "13:30",
  "13:45",
  "14:00",
  "14:15",
  "14:30",
  "14:45",
  "15:00",
  "15:15",
  "15:30",
  "15:45",
  "16:00",
  "16:15",
  "16:30",
  "16:45",
  "17:00",
  "17:15",
  "17:30",
  "17:45",
  "18:00",
  "18:15",
  "18:30",
  "18:45",
  "19:00",
  "19:15",
  "19:30",
  "19:45",
  "20:00",
  "20:15",
  "20:30",
  "20:45",
  "21:00",
  "21:15",
  "21:30",
  "21:45",
  "22:00",
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
  selectedDays: z
    .array(z.string())
    .min(1, "Select at least one day")
    .optional(),
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
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isNetworkConnected, setIsNetworkConnected] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [classToDelete, setClassToDelete] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Network status event listeners with better handling
  useEffect(() => {
    const handleOnline = () => {
      setIsNetworkConnected(true);
      toast({
        title: "You're back online!",
        description: "Refreshing data from server...",
      });
      // Auto retry fetch on reconnect
      fetchClasses();
      fetchTrainers();
    };

    const handleOffline = () => {
      setIsNetworkConnected(false);
      toast({
        title: "You're offline",
        description: "Using cached data. Some features may be limited.",
        variant: "destructive",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Set initial network status
    setIsNetworkConnected(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const fetchTrainers = useCallback(async () => {
    setError(null);

    if (!isNetworkConnected) {
      console.log("Cannot fetch trainers - offline");
      loadTrainersFromLocalStorage();
      return;
    }

    try {
      console.log("Fetching trainers...");
      // Use requireAuth with fallback data for better offline experience
      const defaultTrainers = [
        { id: 1, name: "John Smith" },
        { id: 2, name: "Sarah Johnson" },
        { id: 3, name: "Mike Wilson" },
        { id: 4, name: "Lisa Brown" },
      ];

      const data = await requireAuth(async () => {
        const { data, error } = await supabase
          .from("trainers")
          .select("id, name")
          .eq("status", "Active");

        if (error) {
          console.error("Error fetching trainers:", error);
          throw error;
        }

        console.log("Trainers fetched from database:", data);

        // If no trainers found, create some test trainers
        if (!data || data.length === 0) {
          console.log("No trainers found, creating test trainers");
          await createTestTrainers();

          // Fetch trainers again after creating test trainers
          const { data: refreshedData, error: refreshError } = await supabase
            .from("trainers")
            .select("id, name")
            .eq("status", "Active");

          if (refreshError) {
            console.error(
              "Error fetching trainers after creation:",
              refreshError
            );
            return defaultTrainers;
          }

          return refreshedData || defaultTrainers;
        }

        // Cache successful data for offline use
        if (data && data.length > 0) {
          cacheDataForOffline("trainers", data);
        }

        return data || [];
      }, defaultTrainers);

      console.log("Trainers fetched:", data);
      setTrainers(data || defaultTrainers);
    } catch (error: any) {
      console.error("Error fetching trainers:", error);
      // Don't show toast for network errors - we'll display in the UI
      if (!error.message?.includes("Network error")) {
        toast({
          title: "Failed to load trainers",
          description: "Please try again later",
          variant: "destructive",
        });
      }
      setError(error.message || "Failed to fetch trainers");
      // Try to load from local storage as a fallback
      loadTrainersFromLocalStorage();
    }
  }, [toast, isNetworkConnected]);

  // Create test trainers function
  const createTestTrainers = async () => {
    try {
      console.log("Creating test trainers...");

      const testTrainers = [
        {
          name: "John Fitness",
          email: "john@example.com",
          phone: "123-456-7890",
          specialization: "Weight Training",
          status: "Active",
          gender: "Male",
        },
        {
          name: "Sarah Yoga",
          email: "sarah@example.com",
          phone: "987-654-3210",
          specialization: "Yoga",
          status: "Active",
          gender: "Female",
        },
        {
          name: "Mike Running",
          email: "mike@example.com",
          phone: "555-123-4567",
          specialization: "Cardio",
          status: "Active",
          gender: "Male",
        },
      ];

      const { data, error } = await supabase
        .from("trainers")
        .insert(testTrainers)
        .select();

      if (error) {
        console.error("Error creating test trainers:", error);
        return false;
      }

      console.log("Test trainers created successfully:", data);
      return true;
    } catch (err) {
      console.error("Error in createTestTrainers:", err);
      return false;
    }
  };

  const loadTrainersFromLocalStorage = () => {
    try {
      // First try to use cached trainers from our new caching system
      const cachedTrainers = localStorage.getItem("cached_trainers");
      if (cachedTrainers) {
        try {
          const parsedTrainers = JSON.parse(cachedTrainers);
          if (Array.isArray(parsedTrainers) && parsedTrainers.length > 0) {
            console.log("Using cached trainers data:", parsedTrainers);
            setTrainers(parsedTrainers);
            return;
          }
        } catch (e) {
          console.warn("Error parsing cached trainers:", e);
        }
      }

      // Fall back to older storage methods
      const legacyTrainers = [
        { id: 1, name: "John Smith" },
        { id: 2, name: "Sarah Johnson" },
        { id: 3, name: "Mike Wilson" },
        { id: 4, name: "Lisa Brown" },
      ];

      // Use fallback trainers if nothing else works
      const fallbackTrainers = [
        { id: 1, name: "John Smith" },
        { id: 2, name: "Sarah Johnson" },
        { id: 3, name: "Mike Wilson" },
        { id: 4, name: "Lisa Brown" },
        { id: 5, name: "Emma Wilson" },
        { id: 6, name: "Robert Brown" },
        { id: 7, name: "David Miller" },
      ];
      console.log("Using fallback trainer names:", fallbackTrainers);
      setTrainers(fallbackTrainers);
    } catch (error) {
      console.error("Error loading trainers from localStorage:", error);
      // Keep the fallback trainers if there's an error
      const fallbackTrainers = [
        { id: 1, name: "John Smith" },
        { id: 2, name: "Sarah Johnson" },
        { id: 3, name: "Mike Wilson" },
        { id: 4, name: "Lisa Brown" },
      ];
      setTrainers(fallbackTrainers);
    }
  };

  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!isNetworkConnected) {
      console.log("Cannot fetch classes - offline");
      setError("You are currently offline. Reconnect to load data.");
      setIsLoading(false);
      return;
    }

    try {
      // Use requireAuth with empty array fallback data for offline scenarios
      const data = await requireAuth(async () => {
        const { data, error } = await supabase
          .from("classes")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data;
      }, []);

      const formattedClasses: ClassModel[] = data.map((cls: any) => ({
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
      console.log("Successfully loaded classes:", formattedClasses.length);
    } catch (error: any) {
      console.error("Error fetching classes:", error);
      setError(
        error.message || "Failed to load classes. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  }, [isNetworkConnected]);

  useEffect(() => {
    fetchTrainers();
    fetchClasses();
  }, [fetchTrainers, fetchClasses]);

  const handleRetry = () => {
    setIsRetrying(true);
    setError(null);

    Promise.all([fetchTrainers(), fetchClasses()]).finally(() => {
      setTimeout(() => {
        setIsRetrying(false);
      }, 1000);
    });
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
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };

    if (frequency === "Weekly") {
      let currentWeek = new Date(startDate);

      while (currentWeek <= endDate) {
        for (const day of days) {
          const dayNumber = daysMap[day];
          const classDate = new Date(currentWeek);
          classDate.setDate(
            classDate.getDate() - classDate.getDay() + dayNumber
          );

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
    if (!isNetworkConnected) {
      toast({
        title: "You're offline",
        description: "Please connect to the internet to create classes",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("Form values:", values);
      // Validate times
      if (values.startTime >= values.endTime) {
        toast({
          title: "Invalid time range",
          description: "End time must be after start time",
          variant: "destructive",
        });
        setIsSubmitting(false);
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
          setIsSubmitting(false);
          return;
        }

        // Create multiple class entries
        const classesToCreate = dates.map((date) => ({
          name: values.name,
          trainer: values.trainer,
          trainers: [values.trainer],
          capacity: values.capacity,
          gender: values.gender,
          start_time: values.startTime,
          end_time: values.endTime,
          schedule: format(date, "yyyy-MM-dd"),
          status: "Active",
          enrolled: 0,
          description: values.description || null,
          location: values.location || null,
          difficulty: values.difficulty || "Beginner",
        }));

        console.log("Creating multiple classes:", classesToCreate);

        const { data, error } = await supabase
          .from("classes")
          .insert(classesToCreate)
          .select();

        if (error) {
          console.error("Error creating classes:", error);
          throw error;
        }

        console.log("Classes created successfully:", data);

        toast({
          title: "Classes created",
          description: `Created ${dates.length} recurring classes`,
        });

        // Refresh classes
        fetchClasses();
      } else {
        // Create a single class
        console.log("Creating a single class with trainer:", values.trainer);

        const classData = {
          name: values.name,
          trainer: values.trainer,
          trainers: [values.trainer],
          capacity: values.capacity,
          gender: values.gender,
          start_time: values.startTime,
          end_time: values.endTime,
          schedule: format(new Date(), "yyyy-MM-dd"),
          status: "Active",
          enrolled: 0,
          description: values.description || null,
          location: values.location || null,
          difficulty: values.difficulty || "Beginner",
        };

        console.log("Class data to insert:", classData);

        const { data, error } = await supabase
          .from("classes")
          .insert(classData)
          .select();

        if (error) {
          console.error("Error creating class:", error);
          throw error;
        }

        console.log("Class created successfully:", data);

        toast({
          title: "Class created",
          description: "New class has been created successfully",
        });

        // Refresh classes
        fetchClasses();
      }

      setIsOpen(false); // Close form early for better UX
      form.reset(); // Reset form after successful submission
    } catch (error: any) {
      console.error("Error creating class:", error);
      toast({
        title: "Failed to create class",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
          <p className="text-gray-500">
            Create and manage recurring class schedules
          </p>
        </div>
        <Button
          className="bg-gym-blue hover:bg-gym-dark-blue"
          onClick={handleOpen}
          disabled={!isNetworkConnected}
        >
          Create New Class
        </Button>
      </div>

      {error && (
        <Alert
          variant={!isNetworkConnected ? "default" : "destructive"}
          className="mb-4"
        >
          {!isNetworkConnected ? (
            <WifiOff className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {!isNetworkConnected ? "You're offline" : "Error"}
          </AlertTitle>
          <AlertDescription className="flex justify-between items-center">
            <span>
              {!isNetworkConnected
                ? "You're currently offline. Limited functionality is available. Some data is cached for offline use."
                : error}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="ml-4"
              disabled={isRetrying || !isNetworkConnected}
            >
              <RefreshCw
                className={cn("h-3 w-3 mr-1", isRetrying && "animate-spin")}
              />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Show an offline banner if we're offline but there's no other error */}
      {!isNetworkConnected && !error && (
        <Alert
          variant="default"
          className="mb-4 bg-yellow-50 border-yellow-200"
        >
          <WifiOff className="h-4 w-4" />
          <AlertTitle>You're offline</AlertTitle>
          <AlertDescription>
            You're currently working in offline mode. Some features will be
            limited.
          </AlertDescription>
        </Alert>
      )}

      {/* Class Creation Form Dialog */}
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!isSubmitting) {
            setIsOpen(open);
          }
        }}
      >
        <DialogContent className="max-w-md overflow-y-auto max-h-[80vh]">
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
                          {trainers.length === 0 ? (
                            <SelectItem value="no-trainers" disabled>
                              No trainers available
                            </SelectItem>
                          ) : (
                            trainers.map((trainer) => (
                              <SelectItem key={trainer.id} value={trainer.name}>
                                {trainer.name}
                              </SelectItem>
                            ))
                          )}
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
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
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
                          {timeOptions.map((time) => (
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
                          {timeOptions.map((time) => (
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
                    <FormLabel className="!mt-0">
                      This is a recurring class
                    </FormLabel>
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
                              <div
                                key={day.id}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={day.id}
                                  checked={field.value?.includes(day.id)}
                                  onCheckedChange={(checked) => {
                                    const currentDays = [
                                      ...(field.value || []),
                                    ];
                                    if (checked) {
                                      field.onChange([...currentDays, day.id]);
                                    } else {
                                      field.onChange(
                                        currentDays.filter(
                                          (value) => value !== day.id
                                        )
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
                          <SelectItem value="Intermediate">
                            Intermediate
                          </SelectItem>
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
                <Button
                  type="submit"
                  className="bg-gym-blue hover:bg-gym-dark-blue"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Class"
                  )}
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
              Are you sure you want to delete this class? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Classes List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gym-blue mb-2"></div>
            <p>Loading classes...</p>
          </div>
        ) : classes.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 mb-4">
              No classes found. Create your first class to get started.
            </p>
            <Button
              onClick={handleOpen}
              className="bg-gym-blue hover:bg-gym-dark-blue"
              disabled={!isNetworkConnected}
            >
              Create New Class
            </Button>
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
                      <div className="font-medium text-gray-900">
                        {cls.name}
                      </div>
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
                      <div className="text-sm text-gray-900">
                        {cls.schedule}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatTime(cls.startTime || "")} -{" "}
                        {formatTime(cls.endTime || "")}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {cls.enrolled || 0}/{cls.capacity}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          cls.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {cls.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toggleClassStatus(cls.id, cls.status || "Active")
                          }
                          className={
                            cls.status === "Active"
                              ? "text-amber-600"
                              : "text-green-600"
                          }
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
