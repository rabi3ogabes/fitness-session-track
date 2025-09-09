import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Eye, EyeOff, Power } from "lucide-react";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  PopoverAnchor,
} from "@radix-ui/react-popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

// Types and Utilities
import {
  ClassModel,
  Trainer,
  ScheduleDay,
  TimeOption,
  ClassFormState,
  formatClassTime,
  checkScheduleConflict
} from "./components/classes/ClassTypes";
import { supabase, requireAuth } from "@/integrations/supabase/client";

const Classes = () => {
  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [availableTrainers, setAvailableTrainers] = useState<{ name: string; email: string; }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentClass, setCurrentClass] = useState<ClassModel | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<number | null>(null);
  const { toast } = useToast();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedColor, setSelectedColor] = useState<string>('#7dd3fc'); // Default color
  const [isScheduleConflict, setIsScheduleConflict] = useState(false);
  const [conflictMessage, setConflictMessage] = useState<string>('');
  const [showDeleteButtons, setShowDeleteButtons] = useState(false);
  const [isBookedMembersDialogOpen, setIsBookedMembersDialogOpen] = useState(false);
  const [selectedClassBookings, setSelectedClassBookings] = useState<any[]>([]);

  // Form schema using Zod
  const formSchema = z.object({
    name: z.string().min(2, {
      message: "Class name must be at least 2 characters.",
    }),
    gender: z.enum(["Male", "Female", "All"]),
    trainers: z.string().array().nonempty({
      message: "At least one trainer must be selected.",
    }),
    capacity: z.number().min(1, {
      message: "Capacity must be at least 1.",
    }),
    schedule: z.string(),
    isRecurring: z.boolean().default(false),
    recurringFrequency: z.enum(["Daily", "Weekly", "Monthly"]).default("Weekly"),
    selectedDays: z.string().array().default([]),
    startTime: z.string(),
    endTime: z.string(),
    endDate: z.date().optional(),
    description: z.string().optional(),
    location: z.string().optional(),
    difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]).optional(),
    color: z.string().optional(),
  });

  // React Hook Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      gender: "All",
      trainers: [],
      capacity: 10,
      schedule: format(new Date(), 'yyyy-MM-dd'),
      isRecurring: false,
      recurringFrequency: "Weekly",
      selectedDays: [],
      startTime: "09:00",
      endTime: "10:00",
      description: "",
      location: "",
      difficulty: "Beginner",
      color: '#7dd3fc',
    },
  });

  // Schedule Days
  const days: ScheduleDay[] = [
    { label: "Sun", value: "Sun", isSelected: false },
    { label: "Mon", value: "Mon", isSelected: false },
    { label: "Tue", value: "Tue", isSelected: false },
    { label: "Wed", value: "Wed", isSelected: false },
    { label: "Thu", value: "Thu", isSelected: false },
    { label: "Fri", value: "Fri", isSelected: false },
    { label: "Sat", value: "Sat", isSelected: false },
  ];

  // Time Options
  const timeOptions: TimeOption[] = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, "0");
    return { label: `${hour}:00`, value: `${hour}:00` };
  });

  // Fetch classes data from Supabase
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching classes data...");

        await requireAuth(async () => {
          const { data, error } = await supabase
            .from('classes')
            .select('*')
            .order('schedule', { ascending: true })
            .order('start_time', { ascending: true });

          if (error) {
            console.error("Error fetching classes:", error);
            toast({
              title: "Failed to load classes",
              description: error.message,
              variant: "destructive",
            });
            return;
          }

          console.log("Classes data received:", data);

          if (!data || data.length === 0) {
            console.log("No classes found in the database");
            setClasses([]);
            return;
          }

          // Transform data to match our ClassModel interface
          const formattedClasses: ClassModel[] = data.map((classData: any) => ({
            id: classData.id,
            name: classData.name,
            trainer: classData.trainer || "N/A",
            schedule: classData.schedule,
            capacity: classData.capacity,
            enrolled: classData.enrolled || 0,
            status: classData.status || "Active",
            gender: classData.gender || "All",
            trainers: classData.trainers || [],
            startTime: classData.start_time || "09:00",
            endTime: classData.end_time || "10:00",
            description: classData.description || "",
            location: classData.location || "",
            difficulty: classData.difficulty || "Beginner",
            color: classData.color || '#7dd3fc',
            created_at: classData.created_at,
            start_time: classData.start_time,
            end_time: classData.end_time,
          }));

          setClasses(formattedClasses);
        });
      } catch (err) {
        console.error("Error fetching classes:", err);
        toast({
          title: "Failed to load classes",
          description: "An error occurred while loading classes",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  }, [toast]);

  // Fetch trainers data from Supabase
  const fetchTrainers = async () => {
    try {
      const { data: trainers, error } = await supabase
        .from('trainers')
        .select('*')
        .eq('status', 'Active' as string);
        
      if (error) throw error;
      
      if (trainers) {
        console.log("Trainers loaded:", trainers);
        // Process trainers into the format expected by the form
        const trainerOptions = trainers.map(trainer => ({
          name: trainer.name || '', // Add null check to avoid runtime errors
          email: trainer.email || ''
        }));
        setAvailableTrainers(trainerOptions);
      }
    } catch (error) {
      console.error("Error fetching trainers:", error);
      toast({
        title: "Failed to load trainers",
        description: "An error occurred while fetching trainers",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, [toast]);

  // Function to handle class creation
  const handleCreateClass = async (values: z.infer<typeof formSchema>) => {
    try {
      console.log("Creating class with values:", values);

      // Validate schedule conflicts
      const conflict = classes.some(existingClass => {
        const newClass = {
          schedule: values.schedule,
          startTime: values.startTime,
          endTime: values.endTime,
          trainers: values.trainers,
        };
        return checkScheduleConflict(existingClass, newClass);
      });

      if (conflict) {
        setIsScheduleConflict(true);
        setConflictMessage('This class schedule conflicts with an existing class.');
        return;
      } else {
        setIsScheduleConflict(false);
        setConflictMessage('');
      }

      // Prepare trainers array
      const trainerEmails = values.trainers;

      // Use requireAuth for authentication
      await requireAuth(async () => {
        // Insert into Supabase
        const { error } = await supabase
          .from('classes')
          .insert({
            name: values.name,
            trainer: values.trainers.join(', '), // Store trainer emails as a comma-separated string
            trainers: values.trainers, // Store trainer emails as an array
            schedule: values.schedule,
            capacity: values.capacity,
            status: "Active",
            gender: values.gender,
            start_time: values.startTime,
            end_time: values.endTime,
            description: values.description,
            location: values.location,
            difficulty: values.difficulty,
            color: values.color,
          });

        if (error) {
          console.error("Error creating class:", error);
          throw error;
        }

        toast({
          title: "Class created successfully",
          description: `${values.name} has been created`,
        });

        // Refresh classes
        const { data } = await supabase.from('classes').select('*').order('schedule', { ascending: true }).order('start_time', { ascending: true });
        if (data) {
          const formattedClasses: ClassModel[] = data.map((classData: any) => ({
            id: classData.id,
            name: classData.name,
            trainer: classData.trainer || "N/A",
            schedule: classData.schedule,
            capacity: classData.capacity,
            enrolled: classData.enrolled || 0,
            status: classData.status || "Active",
            gender: classData.gender || "All",
            trainers: classData.trainers || [],
            startTime: classData.start_time || "09:00",
            endTime: classData.end_time || "10:00",
            description: classData.description || "",
            location: classData.location || "",
            difficulty: classData.difficulty || "Beginner",
            color: classData.color || '#7dd3fc',
            created_at: classData.created_at,
            start_time: classData.start_time,
            end_time: classData.end_time,
          }));
          setClasses(formattedClasses);
        }

        // Reset form
        form.reset();
        setIsDrawerOpen(false);
      });
    } catch (err: any) {
      console.error("Error creating class:", err);
      toast({
        title: "Failed to create class",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Function to handle class editing
  const handleEditClass = async (editedClass: ClassModel) => {
    try {
      // Validate schedule conflicts
      const conflict = classes.some(existingClass => {
        if (existingClass.id === editedClass.id) return false; // Skip self
        const newClass = {
          schedule: editedClass.schedule,
          startTime: editedClass.startTime,
          endTime: editedClass.endTime,
          trainers: editedClass.trainers,
        };
        return checkScheduleConflict(existingClass, newClass);
      });

      if (conflict) {
        setIsScheduleConflict(true);
        setConflictMessage('This class schedule conflicts with an existing class.');
        return;
      } else {
        setIsScheduleConflict(false);
        setConflictMessage('');
      }

      // Use requireAuth for authentication
      await requireAuth(async () => {
        // Update in Supabase
        const { error } = await supabase
          .from('classes')
          .update({
            name: editedClass.name,
            trainer: editedClass.trainer,
            trainers: editedClass.trainers,
            schedule: editedClass.schedule,
            capacity: editedClass.capacity,
            status: editedClass.status,
            gender: editedClass.gender,
            start_time: editedClass.startTime,
            end_time: editedClass.endTime,
            description: editedClass.description,
            location: editedClass.location,
            difficulty: editedClass.difficulty,
            color: editedClass.color,
          })
          .eq('id', editedClass.id);

        if (error) {
          console.error("Error updating class:", error);
          throw error;
        }

        // Update local state
        setClasses(prevClasses =>
          prevClasses.map(cls => cls.id === editedClass.id ? editedClass : cls)
        );

        setIsEditDialogOpen(false);

        toast({
          title: "Class updated successfully",
          description: `${editedClass.name} has been updated`,
        });
      });
    } catch (err: any) {
      console.error("Error updating class:", err);
      toast({
        title: "Failed to update class",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Function to handle class deletion
  const handleDeleteClass = async (id: number) => {
    try {
      // Use requireAuth for authentication
      await requireAuth(async () => {
        // Delete from Supabase
        const { error } = await supabase
          .from('classes')
          .delete()
          .eq('id', id);

        if (error) {
          console.error("Error deleting class:", error);
          throw error;
        }

        // Update local state
        setClasses(prevClasses => prevClasses.filter(cls => cls.id !== id));

        toast({
          title: "Class deleted successfully",
          description: "The class has been deleted",
        });
      });
    } catch (err: any) {
      console.error("Error deleting class:", err);
      toast({
        title: "Failed to delete class",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setClassToDelete(null);
    }
  };

  // Handlers for opening dialogs
  const openEditDialog = (cls: ClassModel) => {
    setCurrentClass({ ...cls });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (id: number) => {
    setClassToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  // Function to toggle class status
  const toggleClassStatus = async (id: number) => {
    try {
      // First, find the current class to get its status
      const cls = classes.find(c => c.id === id);
      if (!cls) return;

      const newStatus = cls.status === "Active" ? "Inactive" : "Active";

      // Use requireAuth for authentication
      await requireAuth(async () => {
        // Update in Supabase
        const { error } = await supabase
          .from('classes')
          .update({ status: newStatus })
          .eq('id', id);

        if (error) {
          console.error("Error updating class status:", error);
          throw error;
        }

        // Update local state
        setClasses(prevClasses =>
          prevClasses.map(cls =>
            cls.id === id ? { ...cls, status: newStatus } : cls
          )
        );

        toast({
          title: "Class status updated",
          description: "The class's status has been updated successfully",
        });
      });
    } catch (err: any) {
      console.error("Error toggling class status:", err);
      toast({
        title: "Failed to update status",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Function to handle day selection
  const handleDaySelect = (dayValue: string) => {
    setSelectedDays(prev => {
      if (prev.includes(dayValue)) {
        return prev.filter(day => day !== dayValue);
      } else {
        return [...prev, dayValue];
      }
    });
  };

  // Function to fetch booked members for a class
  const fetchBookedMembers = async (classId: number) => {
    try {
      const selectedClass = classes.find(cls => cls.id === classId);
      if (!selectedClass) return;

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('class_id', classId);

      if (error) {
        console.error("Error fetching bookings:", error);
        toast({
          title: "Failed to load bookings",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setSelectedClassBookings(data || []);
      setCurrentClass(selectedClass);
      setIsBookedMembersDialogOpen(true);
    } catch (err: any) {
      console.error("Error fetching bookings:", err);
      toast({
        title: "Failed to load bookings",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout title="Class Management">
      <Card>
        <CardHeader>
          <CardTitle>Classes</CardTitle>
          <CardDescription>Manage your gym's classes here.</CardDescription>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteButtons(!showDeleteButtons)}
            >
              {showDeleteButtons ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showDeleteButtons ? "Hide" : "Show"} Delete Buttons
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Trainer</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Enrolled</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : classes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">No classes found.</TableCell>
                </TableRow>
              ) : (
                classes.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell 
                      className="cursor-pointer hover:bg-muted/50 hover:underline font-medium text-primary"
                      onClick={() => fetchBookedMembers(cls.id)}
                      title="Click to view registered members"
                    >
                      {cls.name}
                    </TableCell>
                    <TableCell>{cls.trainer}</TableCell>
                    <TableCell>{cls.schedule} ({formatClassTime(cls.startTime || "09:00", cls.endTime || "10:00")})</TableCell>
                    <TableCell>{cls.capacity}</TableCell>
                    <TableCell>{cls.enrolled}</TableCell>
                    <TableCell>{cls.status}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button variant="secondary" size="sm" onClick={() => openEditDialog(cls)}>
                          Edit
                        </Button>
                        {showDeleteButtons && (
                          <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(cls.id)}>
                            Delete
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => toggleClassStatus(cls.id)}
                          title={cls.status === "Active" ? "Deactivate class" : "Activate class"}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={7}>
                  <DrawerTrigger asChild>
                    <Button>Add Class</Button>
                  </DrawerTrigger>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Class Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>
              Make changes to your class here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          {currentClass && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  defaultValue={currentClass.name}
                  className="col-span-3"
                  onChange={(e) => setCurrentClass({ ...currentClass, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="trainer" className="text-right">
                  Trainer
                </Label>
                <Input
                  id="trainer"
                  defaultValue={currentClass.trainer}
                  className="col-span-3"
                  onChange={(e) => setCurrentClass({ ...currentClass, trainer: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="schedule" className="text-right">
                  Schedule
                </Label>
                <Input
                  id="schedule"
                  defaultValue={currentClass.schedule}
                  className="col-span-3"
                  onChange={(e) => setCurrentClass({ ...currentClass, schedule: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="capacity" className="text-right">
                  Capacity
                </Label>
                <Input
                  id="capacity"
                  defaultValue={String(currentClass.capacity)}
                  className="col-span-3"
                  onChange={(e) => setCurrentClass({ ...currentClass, capacity: Number(e.target.value) })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select
                  defaultValue={currentClass.status}
                  onValueChange={(value) => setCurrentClass({ ...currentClass, status: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="gender" className="text-right">
                  Gender
                </Label>
                <Select
                  defaultValue={currentClass.gender}
                  onValueChange={(value) => setCurrentClass({ ...currentClass, gender: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="All">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" onClick={() => handleEditClass(currentClass)} className="bg-gym-blue hover:bg-gym-dark-blue">
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Class Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the class
              from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDeleteClass(classToDelete)} className="bg-red-500 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Drawer for Adding a New Class */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Create a New Class</DrawerTitle>
            <DrawerDescription>
              Fill out the form below to create a new class.
            </DrawerDescription>
          </DrawerHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateClass)} className="space-y-8">
              <div className="grid gap-4 py-4 px-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Class Name" {...field} />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="All">All</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="trainers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trainers</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange([value])}
                        defaultValue={field.value[0]}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a trainer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableTrainers.map((trainer) => (
                            <SelectItem key={trainer.email} value={trainer.email}>
                              {trainer.name}
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
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Capacity" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="schedule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Schedule</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className="w-[240px] pl-3 text-left font-normal"
                          >
                            {field.value ? (
                              format(new Date(field.value), "yyyy-MM-dd")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(format(date!, "yyyy-MM-dd"))}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timeOptions.map((time) => (
                            <SelectItem key={time.value} value={time.value}>
                              {time.label}
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
                      <FormLabel>End Time</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timeOptions.map((time) => (
                            <SelectItem key={time.value} value={time.value}>
                              {time.label}
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Description"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Write a few words about the class.
                      </FormDescription>
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
                        <Input placeholder="Location" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select difficulty" />
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
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <Input type="color" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {isScheduleConflict && (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700">
                  {conflictMessage}
                </div>
              )}
              <DrawerFooter>
                <Button type="submit" className="bg-gym-blue hover:bg-gym-dark-blue">Create Class</Button>
              </DrawerFooter>
            </form>
          </Form>
        </DrawerContent>
      </Drawer>

      {/* Booked Members Dialog */}
      <Dialog open={isBookedMembersDialogOpen} onOpenChange={setIsBookedMembersDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Class Registration Details</DialogTitle>
            <DialogDescription>
              {currentClass && (
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <div className="font-semibold text-foreground">{currentClass.name}</div>
                  <div className="text-sm">
                    <span className="font-medium">Schedule:</span> {currentClass.schedule} at {formatClassTime(currentClass.startTime || "09:00", currentClass.endTime || "10:00")}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Trainer:</span> {currentClass.trainer}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Capacity:</span> {selectedClassBookings.length}/{currentClass.capacity}
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {selectedClassBookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-lg font-medium mb-2">No registrations yet</div>
                <div className="text-sm">No members have registered for this class session.</div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member Name</TableHead>
                    <TableHead>Registration Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedClassBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.user_name || "Unknown Member"}</TableCell>
                      <TableCell>{new Date(booking.booking_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          booking.attendance === true ? 'bg-green-100 text-green-800' :
                          booking.attendance === false ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.attendance === null ? "Not marked" : 
                           booking.attendance ? "Present" : "Absent"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{booking.notes || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsBookedMembersDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Classes;