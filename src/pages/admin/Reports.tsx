
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from "date-fns";
import { CalendarIcon, Users, UserPlus, UserX, Clock, TrendingUp, TrendingDown } from "lucide-react";

interface DailyReport {
  date: string;
  registrations: any[];
  cancellations: any[];
  attendance: any[];
}

interface MemberActivity {
  id: number;
  name: string;
  email: string;
  joinDate: string;
  lastAttendance: string | null;
  totalSessions: number;
  isNew: boolean;
  isInactive: boolean;
}

const Reports = () => {
  const { toast } = useToast();
  const [reportType, setReportType] = useState("daily");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [memberActivity, setMemberActivity] = useState<MemberActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (reportType === "daily") {
      fetchDailyReports();
    } else if (reportType === "members") {
      fetchMemberActivity();
    }
  }, [reportType, selectedDate]);

  const fetchDailyReports = async () => {
    setIsLoading(true);
    try {
      const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
      
      // Fetch registrations for the selected date
      const { data: registrations } = await supabase
        .from("bookings")
        .select(`
          *,
          members!member_id (name, email),
          classes!class_id (name, schedule)
        `)
        .gte("booking_date", selectedDateStr)
        .lt("booking_date", format(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000), "yyyy-MM-dd"))
        .eq("status", "confirmed");

      // Fetch cancellations for the selected date
      const { data: cancellations } = await supabase
        .from("bookings")
        .select(`
          *,
          members!member_id (name, email),
          classes!class_id (name, schedule)
        `)
        .gte("booking_date", selectedDateStr)
        .lt("booking_date", format(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000), "yyyy-MM-dd"))
        .eq("status", "cancelled");

      // Fetch attendance for the selected date
      const { data: attendance } = await supabase
        .from("bookings")
        .select(`
          *,
          members!member_id (name, email),
          classes!class_id (name, schedule)
        `)
        .gte("booking_date", selectedDateStr)
        .lt("booking_date", format(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000), "yyyy-MM-dd"))
        .eq("attendance", true);

      setDailyReports([{
        date: selectedDateStr,
        registrations: registrations || [],
        cancellations: cancellations || [],
        attendance: attendance || []
      }]);

    } catch (error) {
      console.error("Error fetching daily reports:", error);
      toast({
        title: "Error",
        description: "Failed to fetch daily reports",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMemberActivity = async () => {
    setIsLoading(true);
    try {
      const currentDate = new Date();
      const oneWeekAgo = subWeeks(currentDate, 1);
      const oneMonthAgo = subMonths(currentDate, 1);
      
      // Fetch all members
      const { data: members } = await supabase
        .from("members")
        .select("*")
        .eq("status", "Active");

      if (!members) return;

      // Get booking data for activity analysis
      const { data: recentBookings } = await supabase
        .from("bookings")
        .select("member_id, booking_date, attendance")
        .gte("booking_date", format(oneMonthAgo, "yyyy-MM-dd"))
        .eq("status", "confirmed");

      const memberActivityData: MemberActivity[] = members.map(member => {
        const memberBookings = recentBookings?.filter(b => b.member_id === member.id) || [];
        const attendedSessions = memberBookings.filter(b => b.attendance === true);
        
        const lastAttendance = attendedSessions.length > 0 
          ? Math.max(...attendedSessions.map(b => new Date(b.booking_date).getTime()))
          : null;

        const joinDate = new Date(member.created_at);
        const isNew = joinDate > oneWeekAgo;
        const isInactive = !lastAttendance || lastAttendance < oneWeekAgo.getTime();

        return {
          id: member.id,
          name: member.name,
          email: member.email,
          joinDate: format(joinDate, "yyyy-MM-dd"),
          lastAttendance: lastAttendance ? format(new Date(lastAttendance), "yyyy-MM-dd") : null,
          totalSessions: attendedSessions.length,
          isNew,
          isInactive
        };
      });

      setMemberActivity(memberActivityData);

    } catch (error) {
      console.error("Error fetching member activity:", error);
      toast({
        title: "Error",
        description: "Failed to fetch member activity",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout title="Reports & Analytics">
      <div className="mb-6 flex space-x-2">
        <Button
          onClick={() => setReportType("daily")}
          variant={reportType === "daily" ? "default" : "outline"}
          className={reportType === "daily" ? "bg-primary hover:bg-primary/90" : ""}
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          Daily Reports
        </Button>
        <Button
          onClick={() => setReportType("members")}
          variant={reportType === "members" ? "default" : "outline"}
          className={reportType === "members" ? "bg-primary hover:bg-primary/90" : ""}
        >
          <Users className="h-4 w-4 mr-2" />
          Member Activity
        </Button>
      </div>

      {reportType === "daily" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Select Date for Daily Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2">Loading daily report...</p>
            </div>
          ) : (
            dailyReports.map((report) => (
              <div key={report.date} className="space-y-6">
                <h2 className="text-2xl font-bold">Daily Report - {format(selectedDate, "MMMM d, yyyy")}</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">New Registrations</CardTitle>
                      <UserPlus className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{report.registrations.length}</div>
                      <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                        {report.registrations.map((reg, index) => (
                          <div key={index} className="text-sm p-2 bg-green-50 rounded">
                            <div className="font-medium">{reg.members?.name || reg.user_name}</div>
                            <div className="text-gray-600">{reg.classes?.name}</div>
                          </div>
                        ))}
                        {report.registrations.length === 0 && (
                          <p className="text-gray-500 text-sm">No new registrations</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Cancellations</CardTitle>
                      <UserX className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">{report.cancellations.length}</div>
                      <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                        {report.cancellations.map((cancel, index) => (
                          <div key={index} className="text-sm p-2 bg-red-50 rounded">
                            <div className="font-medium">{cancel.members?.name || cancel.user_name}</div>
                            <div className="text-gray-600">{cancel.classes?.name}</div>
                          </div>
                        ))}
                        {report.cancellations.length === 0 && (
                          <p className="text-gray-500 text-sm">No cancellations</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Attendance</CardTitle>
                      <Clock className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">{report.attendance.length}</div>
                      <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                        {report.attendance.map((attend, index) => (
                          <div key={index} className="text-sm p-2 bg-blue-50 rounded">
                            <div className="font-medium">{attend.members?.name || attend.user_name}</div>
                            <div className="text-gray-600">{attend.classes?.name}</div>
                          </div>
                        ))}
                        {report.attendance.length === 0 && (
                          <p className="text-gray-500 text-sm">No attendance recorded</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {reportType === "members" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Member Activity Report</h2>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2">Loading member activity...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">New Members (This Week)</CardTitle>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {memberActivity.filter(m => m.isNew).map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-gray-600">{member.email}</div>
                          <div className="text-xs text-gray-500">Joined: {member.joinDate}</div>
                        </div>
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          New
                        </Badge>
                      </div>
                    ))}
                    {memberActivity.filter(m => m.isNew).length === 0 && (
                      <p className="text-gray-500">No new members this week</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">Inactive Members (No Classes This Week)</CardTitle>
                  <TrendingDown className="h-5 w-5 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {memberActivity.filter(m => m.isInactive && !m.isNew).map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-gray-600">{member.email}</div>
                          <div className="text-xs text-gray-500">
                            Last attendance: {member.lastAttendance || "Never"}
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-orange-100 text-orange-800">
                          Inactive
                        </Badge>
                      </div>
                    ))}
                    {memberActivity.filter(m => m.isInactive && !m.isNew).length === 0 && (
                      <p className="text-gray-500">All members are active!</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>All Members Activity Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{memberActivity.length}</div>
                      <div className="text-sm text-gray-600">Total Members</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{memberActivity.filter(m => m.isNew).length}</div>
                      <div className="text-sm text-gray-600">New This Week</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{memberActivity.filter(m => m.isInactive).length}</div>
                      <div className="text-sm text-gray-600">Inactive</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.round(memberActivity.reduce((sum, m) => sum + m.totalSessions, 0) / memberActivity.length) || 0}
                      </div>
                      <div className="text-sm text-gray-600">Avg Sessions</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {memberActivity.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex-1">
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-gray-600">
                            {member.totalSessions} sessions | Last: {member.lastAttendance || "Never"}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {member.isNew && (
                            <Badge variant="outline" className="bg-green-100 text-green-800">New</Badge>
                          )}
                          {member.isInactive && (
                            <Badge variant="outline" className="bg-orange-100 text-orange-800">Inactive</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Reports;
