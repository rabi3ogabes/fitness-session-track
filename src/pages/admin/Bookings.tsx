import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { 
  Calendar, 
  Check, 
  X, 
  Filter, 
  ChevronDown,
  Calendar as CalendarIcon,
  Plus
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { AdminBulkAttendance } from "./components/AdminBulkAttendance";

// Mock data
const initialBookings = [
  { id: 1, member: "Sarah Johnson", class: "Morning Yoga", trainer: "Jane Smith", date: "2025-05-01", time: "7:00 AM", status: "Confirmed", attendance: null },
  { id: 2, member: "Michael Brown", class: "HIIT Workout", trainer: "Mike Johnson", date: "2025-05-01", time: "6:00 PM", status: "Confirmed", attendance: null },
  { id: 3, member: "Emma Wilson", class: "Strength Training", trainer: "Sarah Davis", date: "2025-05-02", time: "5:00 PM", status: "Pending", attendance: null },
  { id: 4, member: "James Martinez", class: "Pilates", trainer: "Emma Wilson", date: "2025-05-02", time: "9:00 AM", status: "Confirmed", attendance: null },
  { id: 5, member: "Olivia Taylor", class: "Morning Yoga", trainer: "Jane Smith", date: "2025-05-03", time: "7:00 AM", status: "Cancelled", attendance: null },
  { id: 6, member: "William Harris", class: "HIIT Workout", trainer: "Mike Johnson", date: "2025-04-30", time: "6:00 PM", status: "Completed", attendance: true },
  { id: 7, member: "Sophia Lee", class: "Morning Yoga", trainer: "Jane Smith", date: "2025-04-30", time: "7:00 AM", status: "Completed", attendance: true },
  { id: 8, member: "Ethan Clark", class: "Strength Training", trainer: "Sarah Davis", date: "2025-04-30", time: "5:00 PM", status: "Completed", attendance: false },
];

// Today's date for mock data filtering
const today = new Date();
const todayString = format(today, "yyyy-MM-dd");

const Bookings = () => {
  const [bookings, setBookings] = useState(initialBookings);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false); 
  const [newBooking, setNewBooking] = useState({
    member: "",
    class: "",
    trainer: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "",
    status: "Pending"
  });
  const { toast } = useToast();

  // Filter bookings based on search term, status, and date
  const filterBookings = () => {
    return bookings.filter(
      (booking) => {
        // Search filter
        const matchesSearch = 
          booking.member.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.trainer.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Status filter
        const matchesStatus = 
          statusFilter === "all" || 
          booking.status.toLowerCase() === statusFilter.toLowerCase();
        
        // Date filter
        const matchesDate = !selectedDate || booking.date === format(selectedDate, "yyyy-MM-dd");
        
        return matchesSearch && matchesStatus && matchesDate;
      }
    );
  };

  const filteredBookings = filterBookings();

  // Handle updating booking status
  const updateBookingStatus = (id: number, newStatus: string) => {
    setBookings(
      bookings.map((booking) =>
        booking.id === id
          ? {
              ...booking,
              status: newStatus,
            }
          : booking
      )
    );

    toast({
      title: "Booking status updated",
      description: `The booking has been ${newStatus.toLowerCase()}`,
    });
  };
  
  // Mark attendance for a booking
  const updateAttendance = (id: number, attended: boolean) => {
    setBookings(
      bookings.map((booking) =>
        booking.id === id
          ? {
              ...booking,
              attendance: attended,
              status: "Completed"
            }
          : booking
      )
    );

    toast({
      title: "Attendance updated",
      description: `Member has been marked as ${attended ? "present" : "absent"}`,
    });
  };
  
  // Get today's bookings for stats
  const getTodaysBookings = () => {
    return bookings.filter(booking => booking.date === todayString && booking.status !== "Cancelled");
  };
  
  // Calculate attendance stats
  const attendanceStats = {
    total: getTodaysBookings().length,
    present: getTodaysBookings().filter(b => b.attendance === true).length,
    absent: getTodaysBookings().filter(b => b.attendance === false).length,
    pending: getTodaysBookings().filter(b => b.attendance === null).length
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSelectedDate(undefined);
    setIsFilterOpen(false);
  };

  // Handle adding a new booking
  const handleAddBooking = () => {
    const newId = Math.max(...bookings.map(b => b.id)) + 1;
    const bookingToAdd = {
      id: newId,
      member: newBooking.member,
      class: newBooking.class,
      trainer: newBooking.trainer,
      date: newBooking.date,
      time: newBooking.time,
      status: "Pending",
      attendance: null
    };
    
    setBookings([...bookings, bookingToAdd]);
    setIsAddDialogOpen(false);
    
    // Reset form
    setNewBooking({
      member: "",
      class: "",
      trainer: "",
      date: format(new Date(), "yyyy-MM-dd"),
      time: "",
      status: "Pending"
    });
    
    toast({
      title: "Booking added",
      description: "The new booking has been successfully added."
    });
  };

  // Update form field values
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewBooking(prev => ({ ...prev, [name]: value }));
  };

  // Auto-mark attendance for sessions that weren't canceled
  const checkSessionTime = (booking: typeof bookings[0]) => {
    // If it's a confirmed booking from the past and wasn't marked, mark as present
    const bookingDate = new Date(booking.date);
    if (bookingDate < today && booking.status === "Confirmed" && booking.attendance === null) {
      // Auto-mark as present since they didn't cancel
      return true;
    }
    return booking.attendance;
  };

  return (
    <DashboardLayout title="Booking Management">
      <div className="mb-6 space-y-6">
        {/* Today's attendance summary */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-medium flex items-center mb-3">
            <Calendar className="mr-2 h-5 w-5 text-gym-blue" />
            Today's Attendance Summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-500">Total Bookings</p>
              <p className="text-2xl font-bold">{attendanceStats.total}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-md">
              <p className="text-sm text-green-600">Present</p>
              <p className="text-2xl font-bold text-green-700">{attendanceStats.present}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-md">
              <p className="text-sm text-red-600">Absent</p>
              <p className="text-2xl font-bold text-red-700">{attendanceStats.absent}</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-md">
              <p className="text-sm text-yellow-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-700">{attendanceStats.pending}</p>
            </div>
          </div>
        </div>
        
        {/* Search and Filter controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="w-full sm:w-auto">
            <Input
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sm:w-80"
            />
          </div>
          
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {selectedDate && (
              <Button 
                variant="outline" 
                onClick={() => setSelectedDate(undefined)}
                className="text-xs"
              >
                View All Sessions
              </Button>
            )}
            
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4">
                <div className="space-y-4">
                  <h3 className="font-medium">Filter Bookings</h3>
                  
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? (
                            format(selectedDate, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="flex justify-between pt-2">
                    <Button variant="outline" size="sm" onClick={resetFilters}>
                      Reset Filters
                    </Button>
                    <Button size="sm" onClick={() => setIsFilterOpen(false)}>
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <AdminBulkAttendance date={selectedDate} />
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gym-blue hover:bg-gym-dark-blue">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Booking
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
                    <Label htmlFor="trainer" className="text-right">
                      Trainer
                    </Label>
                    <Input
                      id="trainer"
                      name="trainer"
                      value={newBooking.trainer}
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
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                  Trainer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{booking.member}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{booking.class}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{booking.trainer}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">
                        {booking.date} at {booking.time}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={cn(
                          "px-2 py-1 text-xs rounded-full",
                          {
                            "bg-green-100 text-green-800": booking.status === "Confirmed",
                            "bg-yellow-100 text-yellow-800": booking.status === "Pending",
                            "bg-red-100 text-red-800": booking.status === "Cancelled",
                            "bg-blue-100 text-blue-800": booking.status === "Completed",
                          }
                        )}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {booking.status === "Completed" ? (
                        booking.attendance === true ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Present</Badge>
                        ) : booking.attendance === false ? (
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Absent</Badge>
                        ) : (
                          <span className="text-gray-400">Not recorded</span>
                        )
                      ) : booking.status === "Confirmed" ? (
                        <div className="flex space-x-1">
                          <Button 
                            onClick={() => updateAttendance(booking.id, true)}
                            size="sm" 
                            className="h-8 bg-green-500 hover:bg-green-600"
                            variant="default"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            onClick={() => updateAttendance(booking.id, false)}
                            size="sm" 
                            className="h-8 bg-red-500 hover:bg-red-600"
                            variant="default"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {booking.status === "Pending" && (
                        <button
                          onClick={() => updateBookingStatus(booking.id, "Confirmed")}
                          className="text-gym-blue hover:text-gym-dark-blue mr-3"
                        >
                          Confirm
                        </button>
                      )}
                      {(booking.status === "Confirmed" || booking.status === "Pending") && (
                        <button
                          onClick={() => updateBookingStatus(booking.id, "Cancelled")}
                          className="text-red-600 hover:text-red-800"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No bookings found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Bookings;
