
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Check, X, UserPlus, Calendar as CalendarIcon, Clock, UsersRound, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// Mock data
const mockBookings = [
  { id: 1, member: "Sarah Johnson", class: "Morning Yoga", date: "2025-05-01", time: "7:00 AM", status: "Confirmed" },
  { id: 2, member: "Michael Brown", class: "HIIT Workout", date: "2025-05-01", time: "6:00 PM", status: "Confirmed" },
  { id: 3, member: "Emma Wilson", class: "Strength Training", date: "2025-05-02", time: "5:00 PM", status: "Confirmed" },
  { id: 4, member: "James Martinez", class: "Pilates", date: "2025-05-02", time: "9:00 AM", status: "Confirmed" },
  { id: 5, member: "William Harris", class: "HIIT Workout", date: "2025-04-30", time: "6:00 PM", status: "Completed" },
  { id: 6, member: "Linda Rodriguez", class: "Morning Yoga", date: "2025-05-01", time: "7:00 AM", status: "Confirmed" },
  { id: 7, member: "Thomas Wilson", class: "HIIT Workout", date: "2025-05-01", time: "6:00 PM", status: "Confirmed" },
  { id: 8, member: "Olivia Smith", class: "Strength Training", date: "2025-05-02", time: "5:00 PM", status: "Confirmed" },
];

const mockClasses = [
  { id: 1, name: "Morning Yoga", date: new Date(2025, 4, 1), time: "7:00 AM - 8:00 AM", capacity: 15, enrolled: 8, trainer: "Jane Smith" },
  { id: 2, name: "HIIT Workout", date: new Date(2025, 4, 1), time: "6:00 PM - 7:00 PM", capacity: 12, enrolled: 10, trainer: "Mike Johnson" },
  { id: 3, name: "Strength Training", date: new Date(2025, 4, 2), time: "5:00 PM - 6:00 PM", capacity: 10, enrolled: 5, trainer: "Sarah Davis" },
  { id: 4, name: "Pilates", date: new Date(2025, 4, 2), time: "9:00 AM - 10:00 AM", capacity: 8, enrolled: 6, trainer: "Emma Wilson" },
  { id: 5, name: "Boxing", date: new Date(2025, 4, 4), time: "6:00 PM - 7:00 PM", capacity: 8, enrolled: 7, trainer: "Mike Tyson" },
];

const TrainerDashboard = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [todaysBookings, setTodaysBookings] = useState<typeof mockBookings>([]);
  const [bookings, setBookings] = useState(mockBookings);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newBooking, setNewBooking] = useState({
    member: "",
    class: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: ""
  });
  
  useEffect(() => {
    // Filter bookings for today
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    const filtered = bookings.filter(booking => booking.date === formattedDate);
    setTodaysBookings(filtered);
  }, [selectedDate, bookings]);
  
  // Find classes for the selected date
  const classesForSelectedDate = mockClasses.filter(cls => 
    cls.date.getDate() === selectedDate.getDate() &&
    cls.date.getMonth() === selectedDate.getMonth() &&
    cls.date.getFullYear() === selectedDate.getFullYear()
  );
  
  // Function to highlight dates with classes
  const isDayWithClass = (date: Date) => {
    return mockClasses.some(cls => 
      cls.date.getDate() === date.getDate() &&
      cls.date.getMonth() === date.getMonth() &&
      cls.date.getFullYear() === date.getFullYear()
    );
  };
  
  const attendanceStats = {
    total: todaysBookings.length,
    pending: todaysBookings.filter(b => b.status === "Confirmed").length
  };
  
  const markAttendance = (bookingId: number, present: boolean) => {
    // In a real app, this would call an API
    const newStatus = present ? "Present" : "Absent";
    
    // Update the local state for UI feedback
    setBookings(prev => 
      prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: newStatus } 
          : booking
      )
    );
    
    const booking = todaysBookings.find(b => b.id === bookingId);
    
    toast({
      title: `Attendance marked: ${newStatus}`,
      description: `${booking?.member} has been marked as ${newStatus.toLowerCase()} for ${booking?.class}`,
    });
  };

  const handleAddBooking = () => {
    const newId = Math.max(...bookings.map(b => b.id)) + 1;
    const bookingToAdd = {
      id: newId,
      member: newBooking.member,
      class: newBooking.class,
      date: newBooking.date,
      time: newBooking.time,
      status: "Confirmed",
      trainer: "Current Trainer" // In a real app, this would be the logged-in trainer
    };
    
    setBookings([...bookings, bookingToAdd]);
    setIsAddDialogOpen(false);
    
    // Reset form
    setNewBooking({
      member: "",
      class: "",
      date: format(new Date(), "yyyy-MM-dd"),
      time: ""
    });
    
    toast({
      title: "Booking added",
      description: "The new booking has been successfully added."
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewBooking(prev => ({ ...prev, [name]: value }));
  };
  
  // Custom day content renderer for the calendar
  const DayContent = (props: any) => {
    const { date, ...otherProps } = props;
    
    // Check if there are classes on this day
    const hasClasses = mockClasses.some(cls => 
      cls.date.getDate() === date.getDate() &&
      cls.date.getMonth() === date.getMonth() &&
      cls.date.getFullYear() === date.getFullYear()
    );
    
    return (
      <div className="flex flex-col items-center">
        <div {...otherProps} />
        {hasClasses && (
          <div className="w-1 h-1 bg-gym-blue rounded-full mt-0.5" />
        )}
      </div>
    );
  };
  
  return (
    <DashboardLayout title="Trainer Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5 text-gym-blue" />
              Class Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Calendar 
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="pointer-events-auto w-full"
              modifiers={{
                hasClass: isDayWithClass
              }}
              modifiersClassNames={{
                hasClass: "bg-gym-light text-gym-blue font-bold"
              }}
              components={{
                DayContent: DayContent,
              }}
            />
            
            <div className="mt-4">
              <h3 className="font-medium mb-2">
                Classes on {format(selectedDate, "MMMM d, yyyy")}
              </h3>
              
              {classesForSelectedDate.length > 0 ? (
                <div className="space-y-2">
                  {classesForSelectedDate.map(cls => (
                    <div key={cls.id} className="bg-gray-50 p-3 rounded-md">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">{cls.name}</p>
                          <p className="text-xs text-gray-500">{cls.time}</p>
                        </div>
                        <Badge variant="outline">
                          {cls.enrolled}/{cls.capacity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-2">No classes scheduled</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center">
                <UsersRound className="mr-2 h-5 w-5 text-gym-blue" />
                Attendance Management
              </CardTitle>
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <span className="font-medium">{attendanceStats.total}</span> Bookings | 
                  <span className="text-yellow-600 font-medium ml-1">{attendanceStats.pending}</span> Pending
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-gym-blue hover:bg-gym-dark-blue">
                      <Plus className="h-4 w-4 mr-1" /> Add Booking
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add New Booking</DialogTitle>
                      <DialogDescription>
                        Create a new booking for a member.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="member" className="text-right">
                          Member
                        </Label>
                        <Input
                          id="member"
                          name="member"
                          value={newBooking.member}
                          onChange={handleInputChange}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="class" className="text-right">
                          Class
                        </Label>
                        <Input
                          id="class"
                          name="class"
                          value={newBooking.class}
                          onChange={handleInputChange}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">
                          Date
                        </Label>
                        <Input
                          id="date"
                          name="date"
                          type="date"
                          value={newBooking.date}
                          onChange={handleInputChange}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="time" className="text-right">
                          Time
                        </Label>
                        <Input
                          id="time"
                          name="time"
                          value={newBooking.time}
                          onChange={handleInputChange}
                          placeholder="e.g., 3:00 PM"
                          className="col-span-3"
                        />
                      </div>
                      <div className="flex justify-end mt-4">
                        <Button 
                          onClick={handleAddBooking}
                          className="bg-gym-blue hover:bg-gym-dark-blue"
                        >
                          Add Booking
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {todaysBookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Class
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attendance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {todaysBookings.map(booking => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{booking.member}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-500">{booking.class}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-500">{booking.time}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {booking.status === "Completed" || booking.status === "Present" ? (
                            <Badge className="bg-green-100 text-green-800">Present</Badge>
                          ) : booking.status === "Absent" ? (
                            <Badge className="bg-red-100 text-red-800">Absent</Badge>
                          ) : (
                            <div className="flex justify-center space-x-1">
                              <Button 
                                size="sm" 
                                className="h-8 bg-green-500 hover:bg-green-600"
                                variant="default"
                                onClick={() => markAttendance(booking.id, true)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                className="h-8 bg-red-500 hover:bg-red-600"
                                variant="default"
                                onClick={() => markAttendance(booking.id, false)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <p className="mb-2">No bookings for {format(selectedDate, "MMMM d, yyyy")}</p>
                <Button onClick={() => setSelectedDate(new Date())} variant="outline">
                  View Today's Bookings
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Clock className="mr-2 h-5 w-5 text-gym-blue" />
              Upcoming Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mockClasses.filter(cls => cls.date > new Date()).slice(0, 3).map(cls => (
                <div key={cls.id} className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <h3 className="font-medium text-lg">{cls.name}</h3>
                  <p className="text-sm text-gray-500">{format(cls.date, "MMMM d, yyyy")}</p>
                  <p className="text-sm text-gray-500">{cls.time}</p>
                  <div className="mt-3 flex justify-between items-center">
                    <Badge variant="outline" className="bg-white">
                      {cls.enrolled}/{cls.capacity} enrolled
                    </Badge>
                    <Button size="sm" className="bg-gym-blue hover:bg-gym-dark-blue">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TrainerDashboard;
