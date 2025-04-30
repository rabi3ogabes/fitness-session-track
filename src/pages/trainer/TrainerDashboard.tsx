
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Check, X, UserPlus, Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Mock data
const mockMembers = [
  { id: 1, name: "Sarah Johnson", joinDate: "2025-04-25", membershipType: "Basic" },
  { id: 2, name: "Michael Brown", joinDate: "2025-04-26", membershipType: "Premium" },
  { id: 3, name: "Emma Wilson", joinDate: "2025-04-28", membershipType: "Basic" },
];

const mockBookings = [
  { id: 1, member: "Sarah Johnson", class: "Morning Yoga", date: "2025-05-01", time: "7:00 AM", status: "Confirmed" },
  { id: 2, member: "Michael Brown", class: "HIIT Workout", date: "2025-05-01", time: "6:00 PM", status: "Confirmed" },
  { id: 3, member: "Emma Wilson", class: "Strength Training", date: "2025-05-02", time: "5:00 PM", status: "Confirmed" },
  { id: 4, member: "James Martinez", class: "Pilates", date: "2025-05-02", time: "9:00 AM", status: "Confirmed" },
  { id: 5, member: "William Harris", class: "HIIT Workout", date: "2025-04-30", time: "6:00 PM", status: "Completed" },
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
  const [showNewMembers, setShowNewMembers] = useState(true);
  
  useEffect(() => {
    // Filter bookings for today
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    const filtered = mockBookings.filter(booking => booking.date === formattedDate);
    setTodaysBookings(filtered);
  }, [selectedDate]);
  
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
  
  // Get new members from the last 7 days
  const getRecentMembers = () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return mockMembers.filter(member => {
      const joinDate = new Date(member.joinDate);
      return joinDate >= sevenDaysAgo;
    });
  };
  
  const recentMembers = getRecentMembers();
  
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
              className="pointer-events-auto"
              modifiers={{
                hasClass: isDayWithClass
              }}
              modifiersClassNames={{
                hasClass: "bg-gym-light text-gym-blue font-bold"
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
                <Clock className="mr-2 h-5 w-5 text-gym-blue" />
                Today's Attendance
              </CardTitle>
              <div className="text-sm">
                <span className="font-medium">{attendanceStats.total}</span> Bookings | 
                <span className="text-yellow-600 font-medium ml-1">{attendanceStats.pending}</span> Pending
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
                          {booking.status === "Completed" ? (
                            <Badge className="bg-green-100 text-green-800">Present</Badge>
                          ) : (
                            <div className="flex justify-center space-x-1">
                              <Button 
                                size="sm" 
                                className="h-8 bg-green-500 hover:bg-green-600"
                                variant="default"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                className="h-8 bg-red-500 hover:bg-red-600"
                                variant="default"
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
        
        {showNewMembers && recentMembers.length > 0 && (
          <Card className="md:col-span-3">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center">
                  <UserPlus className="mr-2 h-5 w-5 text-gym-blue" />
                  New Members
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowNewMembers(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentMembers.map(member => (
                  <div key={member.id} className="bg-gray-50 p-3 rounded-md">
                    <p className="font-medium">{member.name}</p>
                    <p className="text-xs text-gray-500">
                      Joined on {format(new Date(member.joinDate), "MMM d, yyyy")}
                    </p>
                    <Badge variant="outline" className="mt-2">
                      {member.membershipType}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TrainerDashboard;
