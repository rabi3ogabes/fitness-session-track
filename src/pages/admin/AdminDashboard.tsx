
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import StatsCard from "@/components/StatsCard";
import { Users, User, Calendar, CreditCard, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";

// Mock admin data
const adminData = {
  stats: {
    members: 124,
    trainers: 8,
    classes: 46,
    payments: 156,
  },
  recentMembers: [
    { id: 1, name: "Sarah Johnson", email: "sarah@example.com", date: "2025-04-28", membership: "Premium" },
    { id: 2, name: "Michael Brown", email: "michael@example.com", date: "2025-04-27", membership: "Basic" },
    { id: 3, name: "Emma Wilson", email: "emma@example.com", date: "2025-04-26", membership: "Standard" },
  ],
  recentPayments: [
    { id: 1, member: "Sarah Johnson", amount: 120, date: "2025-04-28", status: "Completed" },
    { id: 2, member: "David Lee", amount: 80, date: "2025-04-27", status: "Completed" },
    { id: 3, member: "Emma Wilson", amount: 95, date: "2025-04-25", status: "Completed" },
  ],
  alerts: [
    { id: 1, message: "5 members have memberships expiring this week", type: "warning" },
    { id: 2, message: "3 new member registrations require approval", type: "info" },
    { id: 3, message: "Morning Yoga class is fully booked", type: "success" },
  ],
  classSchedule: [
    { id: 1, name: "Morning Yoga", date: new Date(2025, 4, 1), time: "7:00 AM - 8:00 AM", trainer: "Jane Smith" },
    { id: 2, name: "HIIT Workout", date: new Date(2025, 4, 2), time: "6:00 PM - 7:00 PM", trainer: "Mike Johnson" },
    { id: 3, name: "Strength Training", date: new Date(2025, 4, 3), time: "5:00 PM - 6:00 PM", trainer: "Sarah Davis" },
    { id: 4, name: "Pilates", date: new Date(2025, 4, 4), time: "9:00 AM - 10:00 AM", trainer: "Emma Wilson" },
  ]
};

const AdminDashboard = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Filter classes for the selected date
  const classesForSelectedDate = adminData.classSchedule.filter(cls => 
    cls.date.getDate() === selectedDate.getDate() &&
    cls.date.getMonth() === selectedDate.getMonth() &&
    cls.date.getFullYear() === selectedDate.getFullYear()
  );

  // Function to highlight dates with classes
  const isDayWithClass = (date: Date) => {
    return adminData.classSchedule.some(cls => 
      cls.date.getDate() === date.getDate() &&
      cls.date.getMonth() === date.getMonth() &&
      cls.date.getFullYear() === date.getFullYear()
    );
  };

  // Custom day content renderer for the calendar
  const DayContent = (props: any) => {
    const { date, ...otherProps } = props;
    
    // Check if there are classes on this day
    const hasClasses = adminData.classSchedule.some(cls => 
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
  
  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, isAdmin, navigate]);

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            title="Total Members"
            value={adminData.stats.members}
            icon={<Users className="h-6 w-6 text-gym-blue" />}
            change="12"
            positive={true}
          />
          <StatsCard
            title="Trainers"
            value={adminData.stats.trainers}
            icon={<User className="h-6 w-6 text-gym-blue" />}
            change="1"
            positive={true}
          />
          <StatsCard
            title="Active Classes"
            value={adminData.stats.classes}
            icon={<Calendar className="h-6 w-6 text-gym-blue" />}
            change="3"
            positive={true}
          />
          <StatsCard
            title="Monthly Payments"
            value={`QAR ${adminData.stats.payments * 85}`}
            icon={<CreditCard className="h-6 w-6 text-gym-blue" />}
            change="15%"
            positive={true}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Recent Members</h2>
                <a href="/admin/members" className="text-sm text-gym-blue hover:underline">
                  View All
                </a>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Membership
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {adminData.recentMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{member.name}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {member.email}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {member.date}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            {member.membership}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Class Schedule</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CalendarComponent
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
                  components={{
                    DayContent: DayContent
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
                          <div>
                            <p className="font-medium">{cls.name}</p>
                            <p className="text-xs text-gray-500">{cls.time}</p>
                            <p className="text-xs text-gray-500">Trainer: {cls.trainer}</p>
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

            <div className="mt-6 bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Recent Payments</h2>
                <a href="/admin/payments" className="text-sm text-gym-blue hover:underline">
                  View All
                </a>
              </div>
              <div className="space-y-3">
                {adminData.recentPayments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-md">
                    <div>
                      <p className="font-medium">{payment.member}</p>
                      <p className="text-xs text-gray-500">{payment.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">QAR {payment.amount}</p>
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
