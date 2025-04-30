
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Check, X, UserPlus, Calendar as CalendarIcon, Clock, UsersRound, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

// Mock membership plans for new member registration
const membershipPlans = [
  { id: 1, name: "Basic", price: 250, sessions: 12 },
  { id: 2, name: "Premium", price: 350, sessions: 20 },
  { id: 3, name: "Ultimate", price: 500, sessions: 30 }
];

const TrainerDashboard = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [todaysBookings, setTodaysBookings] = useState<typeof mockBookings>([]);
  const [bookings, setBookings] = useState(mockBookings);
  
  // New member registration dialog
  const [isNewMemberDialogOpen, setIsNewMemberDialogOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    phone: "",
    birthday: format(new Date(), "yyyy-MM-dd"),
    membershipPlan: "1",
    additionalSessions: "0"
  });
  
  const { toast } = useToast();
  
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

  const handleNewMemberInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewMember(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRegisterMember = () => {
    // Validate form
    if (!newMember.name || !newMember.email) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    // In a real app, this would create a new account, process payment, etc.
    const selectedPlan = membershipPlans.find(plan => plan.id === parseInt(newMember.membershipPlan));
    
    toast({
      title: "New member registered",
      description: `${newMember.name} has been registered with the ${selectedPlan?.name} plan.`,
    });
    
    // Add a new booking for this member to today's date
    const newId = Math.max(...bookings.map(b => b.id)) + 1;
    const bookingToAdd = {
      id: newId,
      member: newMember.name,
      class: "First Session",
      date: format(new Date(), "yyyy-MM-dd"),
      time: format(new Date(), "h:mm a"),
      status: "Present", // Auto-mark as present
    };
    
    setBookings([...bookings, bookingToAdd]);
    setIsNewMemberDialogOpen(false);
    
    // Reset form
    setNewMember({
      name: "",
      email: "",
      phone: "",
      birthday: format(new Date(), "yyyy-MM-dd"),
      membershipPlan: "1",
      additionalSessions: "0"
    });
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
              className="pointer-events-auto w-full bg-white"
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
                <div>
                  <Dialog open={isNewMemberDialogOpen} onOpenChange={setIsNewMemberDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-gym-blue hover:bg-gym-dark-blue">
                        <UserPlus className="h-4 w-4 mr-1" /> Register Walk-in Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Register New Member</DialogTitle>
                        <DialogDescription>
                          Create a new account and membership for a walk-in member.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="member-name" className="text-right">
                            Name*
                          </Label>
                          <Input
                            id="member-name"
                            name="name"
                            value={newMember.name}
                            onChange={handleNewMemberInputChange}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="member-email" className="text-right">
                            Email*
                          </Label>
                          <Input
                            id="member-email"
                            name="email"
                            type="email"
                            value={newMember.email}
                            onChange={handleNewMemberInputChange}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="member-phone" className="text-right">
                            Phone
                          </Label>
                          <Input
                            id="member-phone"
                            name="phone"
                            value={newMember.phone}
                            onChange={handleNewMemberInputChange}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="member-birthday" className="text-right">
                            Birthday
                          </Label>
                          <Input
                            id="member-birthday"
                            name="birthday"
                            type="date"
                            value={newMember.birthday}
                            onChange={handleNewMemberInputChange}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="membership-plan" className="text-right">
                            Membership Plan
                          </Label>
                          <Select 
                            name="membershipPlan" 
                            value={newMember.membershipPlan}
                            onValueChange={(value) => handleNewMemberInputChange({
                              target: { name: "membershipPlan", value }
                            } as React.ChangeEvent<HTMLSelectElement>)}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select a plan" />
                            </SelectTrigger>
                            <SelectContent>
                              {membershipPlans.map(plan => (
                                <SelectItem key={plan.id} value={plan.id.toString()}>
                                  {plan.name} - QR {plan.price} ({plan.sessions} sessions)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="additional-sessions" className="text-right">
                            Extra Sessions
                          </Label>
                          <Input
                            id="additional-sessions"
                            name="additionalSessions"
                            type="number"
                            min="0"
                            value={newMember.additionalSessions}
                            onChange={handleNewMemberInputChange}
                            className="col-span-3"
                          />
                        </div>
                        <div className="flex justify-end mt-4">
                          <Button 
                            onClick={handleRegisterMember} 
                            className="bg-gym-blue hover:bg-gym-dark-blue"
                          >
                            Register & Mark Present
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
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
