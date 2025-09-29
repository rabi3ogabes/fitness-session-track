import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, UserRound, Mail, Phone, Calendar, CreditCard, Activity, Clock, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Member } from "./types";

interface Booking {
  id: string;
  booking_date: string;
  status: string;
  attendance: boolean | null;
  class: {
    name: string;
    schedule: string;
    start_time: string;
    end_time: string;
    location: string;
    trainer: string;
  } | null;
}

interface MemberDetailsDialogProps {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MemberDetailsDialog = ({ member, open, onOpenChange }: MemberDetailsDialogProps) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (member && open) {
      fetchMemberBookings();
    }
  }, [member, open]);

  const fetchMemberBookings = async () => {
    if (!member) return;

    setLoading(true);
    try {
      // First get bookings for this member
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select(`
          id,
          booking_date,
          status,
          attendance,
          class_id
        `)
        .or(`member_id.eq.${member.id},user_name.eq.${member.name}`)
        .order('booking_date', { ascending: false });

      if (bookingsError) throw bookingsError;

      if (!bookingsData || bookingsData.length === 0) {
        setBookings([]);
        return;
      }

      // Get class details for each booking
      const bookingsWithClasses = await Promise.all(
        bookingsData.map(async (booking) => {
          if (!booking.class_id) {
            return {
              ...booking,
              class: null
            };
          }

          const { data: classData } = await supabase
            .from("classes")
            .select("name, schedule, start_time, end_time, location, trainer")
            .eq("id", booking.class_id)
            .single();

          return {
            ...booking,
            class: classData || null
          };
        })
      );

      setBookings(bookingsWithClasses);
    } catch (error) {
      console.error("Error fetching member bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!member) return null;

  const now = new Date();
  const upcomingBookings = bookings.filter(booking => 
    booking.class && new Date(booking.class.schedule) >= now && booking.status === 'confirmed'
  );
  const previousBookings = bookings.filter(booking => 
    booking.class && new Date(booking.class.schedule) < now
  );

  const getGenderIcon = (gender?: string) => {
    if (gender === "Male") {
      return <User className="h-5 w-5 text-blue-600" />;
    }
    if (gender === "Female") {
      return <UserRound className="h-5 w-5 text-pink-600" />;
    }
    return <User className="h-5 w-5 text-gray-600" />;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      confirmed: "default",
      cancelled: "destructive",
      pending: "secondary"
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getAttendanceBadge = (attendance: boolean | null) => {
    if (attendance === true) return <Badge className="bg-green-100 text-green-800">Present</Badge>;
    if (attendance === false) return <Badge className="bg-red-100 text-red-800">Absent</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getGenderIcon(member.gender)}
            Member Details - {member.name}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-6">
          <div className="space-y-6">
            {/* Member Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="font-medium">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Phone:</span>
                    <span className="font-medium">{member.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Birthday:</span>
                    <span className="font-medium">{member.birthday || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Membership:</span>
                    <span className="font-medium">{member.membership || 'None'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Remaining Sessions:</span>
                    <Badge className={member.remainingSessions <= 2 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                      {member.remainingSessions}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge variant={member.status === "Active" ? "default" : "destructive"}>
                      {member.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bookings Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Booking History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">Loading bookings...</div>
                ) : (
                  <Tabs defaultValue="upcoming" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="upcoming">
                        Upcoming ({upcomingBookings.length})
                      </TabsTrigger>
                      <TabsTrigger value="previous">
                        Previous ({previousBookings.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="upcoming" className="mt-4">
                      {upcomingBookings.length === 0 ? (
                        <div className="text-center py-6 text-gray-500">
                          No upcoming bookings
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {upcomingBookings.map((booking) => (
                            <Card key={booking.id} className="border-l-4 border-l-blue-500">
                              <CardContent className="pt-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-semibold">{booking.class?.name}</h4>
                                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {booking.class?.schedule ? format(new Date(booking.class.schedule), 'MMM d, yyyy') : 'TBD'}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {booking.class?.start_time} - {booking.class?.end_time}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {booking.class?.location}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                      Trainer: {booking.class?.trainer}
                                    </p>
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    {getStatusBadge(booking.status)}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="previous" className="mt-4">
                      {previousBookings.length === 0 ? (
                        <div className="text-center py-6 text-gray-500">
                          No previous bookings
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Class</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Attendance</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {previousBookings.map((booking) => (
                              <TableRow key={booking.id}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{booking.class?.name}</p>
                                    <p className="text-sm text-gray-600">{booking.class?.trainer}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {booking.class?.schedule ? format(new Date(booking.class.schedule), 'MMM d, yyyy') : 'TBD'}
                                </TableCell>
                                <TableCell>
                                  {booking.class?.start_time} - {booking.class?.end_time}
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(booking.status)}
                                </TableCell>
                                <TableCell>
                                  {getAttendanceBadge(booking.attendance)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default MemberDetailsDialog;