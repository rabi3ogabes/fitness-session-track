
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

// Mock data
const initialTrainers = [
  { id: 1, name: "Jane Doe", email: "jane@example.com", phone: "(555) 123-4567", specialization: "Yoga, Pilates", status: "Active" },
  { id: 2, name: "John Smith", email: "john@example.com", phone: "(555) 234-5678", specialization: "HIIT, Strength Training", status: "Active" },
  { id: 3, name: "Alex Johnson", email: "alex@example.com", phone: "(555) 345-6789", specialization: "Strength Training, Boxing", status: "Active" },
  { id: 4, name: "Sarah Williams", email: "sarah@example.com", phone: "(555) 456-7890", specialization: "Pilates, Yoga", status: "Inactive" },
  { id: 5, name: "Mike Tyson", email: "mike@example.com", phone: "(555) 567-8901", specialization: "Boxing, Martial Arts", status: "Active" },
  { id: 6, name: "Maria Garcia", email: "maria@example.com", phone: "(555) 678-9012", specialization: "Zumba, Dance Fitness", status: "Active" },
];

const Trainers = () => {
  const [trainers, setTrainers] = useState(initialTrainers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newTrainer, setNewTrainer] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "",
    status: "Active",
  });
  const [editTrainer, setEditTrainer] = useState<typeof trainers[0] | null>(null);
  const { toast } = useToast();

  const filteredTrainers = trainers.filter(
    (trainer) =>
      trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddTrainer = () => {
    if (!newTrainer.name || !newTrainer.email) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const id = Math.max(...trainers.map((t) => t.id)) + 1;
    setTrainers([...trainers, { ...newTrainer, id }]);
    setIsAddDialogOpen(false);
    setNewTrainer({
      name: "",
      email: "",
      phone: "",
      specialization: "",
      status: "Active",
    });

    toast({
      title: "Trainer added successfully",
      description: `${newTrainer.name} has been added as a trainer`,
    });
  };

  const handleEditTrainer = () => {
    if (!editTrainer || !editTrainer.name || !editTrainer.email) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setTrainers(
      trainers.map((t) => (t.id === editTrainer.id ? editTrainer : t))
    );
    setIsEditDialogOpen(false);
    setEditTrainer(null);

    toast({
      title: "Trainer updated successfully",
      description: `Trainer information has been updated`,
    });
  };

  const toggleTrainerStatus = (id: number) => {
    setTrainers(
      trainers.map((trainer) =>
        trainer.id === id
          ? {
              ...trainer,
              status: trainer.status === "Active" ? "Inactive" : "Active",
            }
          : trainer
      )
    );

    toast({
      title: "Trainer status updated",
      description: "The trainer's status has been updated successfully",
    });
  };

  return (
    <DashboardLayout title="Trainer Management">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="w-full sm:w-auto">
          <Input
            placeholder="Search trainers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sm:w-80"
          />
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto bg-gym-blue hover:bg-gym-dark-blue">
          Add New Trainer
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specialization
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
              {filteredTrainers.map((trainer) => (
                <tr key={trainer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{trainer.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-500">{trainer.email}</div>
                    <div className="text-gray-500">{trainer.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-500">{trainer.specialization}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        trainer.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {trainer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setEditTrainer(trainer);
                        setIsEditDialogOpen(true);
                      }}
                      className="text-gym-blue hover:text-gym-dark-blue mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleTrainerStatus(trainer.id)}
                      className={`${
                        trainer.status === "Active" ? "text-red-600 hover:text-red-800" : "text-green-600 hover:text-green-800"
                      }`}
                    >
                      {trainer.status === "Active" ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}

              {filteredTrainers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No trainers found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Trainer Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Trainer</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium col-span-1">
                Name*
              </label>
              <Input
                id="name"
                value={newTrainer.name}
                onChange={(e) => setNewTrainer({ ...newTrainer, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium col-span-1">
                Email*
              </label>
              <Input
                id="email"
                type="email"
                value={newTrainer.email}
                onChange={(e) => setNewTrainer({ ...newTrainer, email: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium col-span-1">
                Phone
              </label>
              <Input
                id="phone"
                value={newTrainer.phone}
                onChange={(e) => setNewTrainer({ ...newTrainer, phone: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium col-span-1">
                Specialization
              </label>
              <Input
                id="specialization"
                placeholder="e.g. Yoga, Pilates, HIIT"
                value={newTrainer.specialization}
                onChange={(e) => setNewTrainer({ ...newTrainer, specialization: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTrainer} className="bg-gym-blue hover:bg-gym-dark-blue">
              Add Trainer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Trainer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Trainer</DialogTitle>
          </DialogHeader>
          {editTrainer && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium col-span-1">
                  Name*
                </label>
                <Input
                  id="edit-name"
                  value={editTrainer.name}
                  onChange={(e) => setEditTrainer({ ...editTrainer, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium col-span-1">
                  Email*
                </label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editTrainer.email}
                  onChange={(e) => setEditTrainer({ ...editTrainer, email: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium col-span-1">
                  Phone
                </label>
                <Input
                  id="edit-phone"
                  value={editTrainer.phone}
                  onChange={(e) => setEditTrainer({ ...editTrainer, phone: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium col-span-1">
                  Specialization
                </label>
                <Input
                  id="edit-specialization"
                  value={editTrainer.specialization}
                  onChange={(e) => setEditTrainer({ ...editTrainer, specialization: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTrainer} className="bg-gym-blue hover:bg-gym-dark-blue">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Trainers;
