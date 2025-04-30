
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { mockClasses, getBookingsForClass } from "../../mockData";

interface SelectedClassDetailsProps {
  selectedClassId: number;
  selectedDate: Date;
  onManageAttendance: () => void;
}

export const SelectedClassDetails = ({
  selectedClassId,
  selectedDate,
  onManageAttendance
}: SelectedClassDetailsProps) => {
  const classBookings = getBookingsForClass(selectedClassId);
  const cls = mockClasses.find(c => c.id === selectedClassId);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-medium">{cls?.name}</h4>
            <p className="text-sm text-gray-500">{format(selectedDate, "EEEE, MMMM d")} at {cls?.time}</p>
          </div>
          <Badge>{classBookings.length} Members</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {classBookings.map(booking => (
            <div 
              key={booking.id} 
              className="p-2 border rounded-md flex justify-between items-center"
            >
              <span className="font-medium">{booking.member}</span>
              <span
                className={cn(
                  "px-2 py-1 text-xs rounded-full",
                  {
                    "bg-green-100 text-green-800": booking.status === "Confirmed" || booking.status === "Present",
                    "bg-red-100 text-red-800": booking.status === "Absent",
                    "bg-yellow-100 text-yellow-800": booking.status === "Pending",
                  }
                )}
              >
                {booking.status}
              </span>
            </div>
          ))}
          
          {classBookings.length === 0 && (
            <div className="col-span-2 text-center py-4 text-gray-500">
              No members enrolled in this class
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={onManageAttendance} 
          className="w-full bg-gym-blue hover:bg-gym-dark-blue"
        >
          <Users className="h-4 w-4 mr-2" /> Manage Attendance
        </Button>
      </CardFooter>
    </Card>
  );
};
