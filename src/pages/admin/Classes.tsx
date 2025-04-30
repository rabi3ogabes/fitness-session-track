
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

// Mock data
const initialClasses = [
  { id: 1, name: "Morning Yoga", trainer: "Jane Smith", schedule: "Mon, Wed, Fri - 7:00 AM", capacity: 15, enrolled: 12, status: "Active" },
  { id: 2, name: "HIIT Workout", trainer: "Mike Johnson", schedule: "Tue, Thu - 6:00 PM", capacity: 20, enrolled: 15, status: "Active" },
  { id: 3, name: "Strength Training", trainer: "Sarah Davis", schedule: "Mon, Wed, Fri - 5:00 PM", capacity: 12, enrolled: 10, status: "Active" },
  { id: 4, name: "Pilates", trainer: "Emma Wilson", schedule: "Tue, Thu - 9:00 AM", capacity: 15, enrolled: 7, status: "Active" },
  { id: 5, name: "Spinning", trainer: "Robert Brown", schedule: "Mon, Wed - 6:00 PM", capacity: 18, enrolled: 18, status: "Full" },
];

const Classes = () => {
  const [classes, setClasses] = useState(initialClasses);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const filteredClasses = classes.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.trainer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleClassStatus = (id: number) => {
    setClasses(
      classes.map((cls) =>
        cls.id === id
          ? {
              ...cls,
              status: cls.status === "Active" ? "Inactive" : "Active",
            }
          : cls
      )
    );

    toast({
      title: "Class status updated",
      description: "The class status has been updated successfully",
    });
  };

  return (
    <DashboardLayout title="Class Management">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="w-full sm:w-auto">
          <Input
            placeholder="Search classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sm:w-80"
          />
        </div>
        <Button className="w-full sm:w-auto bg-gym-blue hover:bg-gym-dark-blue">
          Add New Class
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trainer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacity
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
              {filteredClasses.map((cls) => (
                <tr key={cls.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{cls.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-500">{cls.trainer}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-500">{cls.schedule}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-500">
                      {cls.enrolled} / {cls.capacity}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        cls.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : cls.status === "Full"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {cls.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => toggleClassStatus(cls.id)}
                      className="text-gym-blue hover:text-gym-dark-blue mr-3"
                    >
                      {cls.status === "Active" ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      className="text-gym-blue hover:text-gym-dark-blue"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filteredClasses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No classes found matching your search criteria.
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

export default Classes;
