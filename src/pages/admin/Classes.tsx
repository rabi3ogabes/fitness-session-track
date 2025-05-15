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
import { CalendarIcon } from "lucide-react";
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
  const [isScheduleConflict, setIsScheduleConflict] = useState(false);
  const [conflictMessage, setConflictMessage] = useState<string>('');

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
    start_time: z.string(),
    end_time: z.string(),
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
      start_time: "09:00",
      end_time: "10:00",
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
            .select('*');

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
            start_time: classData.start_time || "09:00",
            end_time: classData.end_time || "10:00",
            description: classData.description || "",
            location: classData.location || "",
            difficulty: classData.difficulty || "Beginner",
            color: classData.color || '#7dd3fc',
            created_at: classData.created_at,
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
        const trainerOptions = trainers.map(trainer => ({
          name: trainer.name || '',
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
          start_time: values.start_time,
          end_time: values.end_time,
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
            trainer: values.trainers.join(', '),
            trainers: values.trainers,
            schedule: values.schedule,
            capacity: values.capacity,
            status: "Active",
            gender: values.gender,
            start_time: values.start_time,
            end_time: values.end_time,
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
        const { data } = await supabase.from('classes').select('*');
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
            start_time: classData.start_time || "09:00",
            end_time: classData.end_time || "10:00",
            description: classData.description || "",
            location: classData.location || "",
            difficulty: classData.difficulty || "Beginner",
            color: classData.color || '#7dd3fc',
            created_at: classData.created_at,
          }));
          setClasses(formattedClasses);
        }

        // Reset form
        form.reset();
        setIsDrawerOpen(false);
      });
    } catch (err) {
      console.error("Error in handleCreateClass:", err);
      toast({
        title: "Failed to create class",
        description: "An unexpected error occurred",
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
          start_time: editedClass.start_time,
          end_time: editedClass.end_time,
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
            start_time: editedClass.start_time,
            end_time: editedClass.end_time,
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
    } catch (err) {
      console.error("Error updating class:", err);
      toast({
        title: "Failed to update class",
        description: "An unexpected error occurred",
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
    } catch (err) {
      console.error("Error deleting class:", err);
      toast({
        title: "Failed to delete class",
        description: "An unexpected error occurred",
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
    } catch (err) {
      console.error("Error toggling class status:", err);
      toast({
        title: "Failed to update status",
        description: "An unexpected error occurred",
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
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Trainer</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Enrolled</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : classes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">No classes found.</TableCell>
                </TableRow>
              ) : (
                classes.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell>{cls.name}</TableCell>
                    <TableCell>{Array.isArray(cls.trainers) ? cls.trainers.join(', ') : cls.trainer}</TableCell>
                    <TableCell>{cls.schedule}</TableCell>
                    <TableCell>{formatClassTime(cls.start_time || "00:00", cls.end_time || "00:00")}</TableCell>
                    <TableCell>{cls.capacity}</TableCell>
                    <TableCell>{cls.enrolled}</TableCell>
                    <TableCell>{cls.status}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="secondary" size="sm" onClick={() => openEditDialog(cls)}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(cls.id)}>
                        Delete
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toggleClassStatus(cls.id)}>
                        {cls.status === "Active" ? "Deactivate" : "Activate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={8}>
                  <DrawerTrigger asChild>
                    <Button onClick={() => { form.reset(); setIsDrawerOpen(true); }}>Add Class</Button>
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
                <Label htmlFor="edit-name" className="text-right">Name</Label>
                <Input id="edit-name" value={currentClass.name} className="col-span-3" onChange={(e) => setCurrentClass(prev => prev ? {...prev, name: e.target.value} : null)} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-trainer" className="text-right">Trainer</Label>
                <Select 
                  value={currentClass.trainer} 
                  onValueChange={(value) => setCurrentClass(prev => prev ? {...prev, trainer: value, trainers: [value]} : null)}
                >
                  <SelectTrigger className="col-span-3"><SelectValue placeholder="Select trainer" /></SelectTrigger>
                  <SelectContent>
                    {availableTrainers.map(t => <SelectItem key={t.email} value={t.name}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-schedule" className="text-right">Schedule</Label>
                <Input type="date" id="edit-schedule" value={currentClass.schedule} className="col-span-3" onChange={(e) => setCurrentClass(prev => prev ? {...prev, schedule: e.target.value} : null)} />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-start_time" className="text-right">Start Time</Label>
                <Input type="time" id="edit-start_time" value={currentClass.start_time} className="col-span-3" onChange={(e) => setCurrentClass(prev => prev ? {...prev, start_time: e.target.value} : null)} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-end_time" className="text-right">End Time</Label>
                <Input type="time" id="edit-end_time" value={currentClass.end_time} className="col-span-3" onChange={(e) => setCurrentClass(prev => prev ? {...prev, end_time: e.target.value} : null)} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-capacity" className="text-right">Capacity</Label>
                <Input type="number" id="edit-capacity" value={String(currentClass.capacity)} className="col-span-3" onChange={(e) => setCurrentClass(prev => prev ? {...prev, capacity: Number(e.target.value)} : null)} />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-status" className="text-right">Status</Label>
                <Select 
                  value={currentClass.status} 
                  onValueChange={(value) => setCurrentClass(prev => prev ? {...prev, status: value} : null)}
                >
                  <SelectTrigger className="col-span-3"><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-gender" className="text-right">Gender</Label>
                 <Select value={currentClass.gender} onValueChange={(value) => setCurrentClass(prev => prev ? {...prev, gender: value} : null)}>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All</SelectItem>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              {/* Add other fields like description, location, difficulty, color as needed */}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" onClick={() => setIsEditDialogOpen(false)}>
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
                            <SelectItem key={trainer.email} value={trainer.name}>
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
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
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
                            onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
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
                  name="start_time"
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
                  name="end_time"
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
                {/* ... FormFields for description, location, difficulty, color ... */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the class..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
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
                        <Input placeholder="e.g. Studio A" {...field} />
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


              <DrawerFooter>
                <Button type="submit" className="bg-gym-blue hover:bg-gym-dark-blue" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Creating..." : "Create Class"}
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
                </DrawerClose>
              </DrawerFooter>
            </form>
          </Form>
        </DrawerContent>
      </Drawer>
    </DashboardLayout>
  );
};

export default Classes;
