
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

// Mock data
const initialBookings = [
  { id: 1, member: "Sarah Johnson", class: "Morning Yoga", trainer: "Jane Smith", date: "2025-05-01", time: "7:00 AM", status: "Confirmed" },
  { id: 2, member: "Michael Brown", class: "HIIT Workout", trainer: "Mike Johnson", date: "2025-05-01", time: "6:00 PM", status: "Confirmed" },
  { id: 3, member: "Emma Wilson", class: "Strength Training", trainer: "Sarah Davis", date: "2025-05-02", time: "5:00 PM", status: "Pending" },
  { id: 4, member: "James Martinez", class: "Pilates", trainer: "Emma Wilson", date: "2025-05-02", time: "9:00 AM", status: "Confirmed" },
  { id: 5, member: "Olivia Taylor", class: "Morning Yoga", trainer: "Jane Smith", date: "2025-05-03", time: "7:00 AM", status: "Cancelled" },
];

const Bookings = () => {
  const [bookings, setBookings] = useState(initialBookings);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const filteredBookings = bookings.filter(
    (booking) =>
      booking.member.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.trainer.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <DashboardLayout title="Booking Management">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="w-full sm:w-auto">
          <Input
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sm:w-80"
          />
        </div>
        <Button className="w-full sm:w-auto bg-gym-blue hover:bg-gym-dark-blue">
          Add New Booking
        </Button>
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
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
                      className={`px-2 py-1 text-xs rounded-full ${
                        booking.status === "Confirmed"
                          ? "bg-green-100 text-green-800"
                          : booking.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {booking.status}
                    </span>
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
                    {booking.status !== "Cancelled" && (
                      <button
                        onClick={() => updateBookingStatus(booking.id, "Cancelled")}
                        className="text-red-600 hover:text-red-800"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
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
