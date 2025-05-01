import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { ClassModel } from "./ClassTypes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface EditClassDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateClass: (updatedClass: ClassModel) => void;
  currentClass: ClassModel | null;
  trainers: string[];
}

const EditClassDialog: React.FC<EditClassDialogProps> = ({
  isOpen,
  onOpenChange,
  onUpdateClass,
  currentClass,
  trainers,
}) => {
  const [editClass, setEditClass] = useState<ClassModel>({
    id: 0,
    name: "",
    trainer: "",
    trainers: [],
    schedule: "",
    capacity: 0,
    enrolled: 0,
    status: "Active",
    gender: "All"
  });
  
  const [selectedTrainers, setSelectedTrainers] = useState<string[]>([]);

  useEffect(() => {
    if (currentClass) {
      setEditClass(currentClass);
      setSelectedTrainers(currentClass.trainers || [currentClass.trainer]);
    }
  }, [currentClass]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditClass(prev => ({ ...prev, [name]: value }));
  };

  const handleGenderChange = (value: string) => {
    setEditClass(prev => ({ ...prev, gender: value as "Male" | "Female" | "All" }));
  };

  const handleTrainerSelection = (trainer: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedTrainers(prev => [...prev, trainer]);
    } else {
      setSelectedTrainers(prev => prev.filter(t => t !== trainer));
    }
  };

  const handleUpdateClass = () => {
    const updatedClass = {
      ...editClass,
      trainers: selectedTrainers,
      // For backward compatibility, keep the first trainer in the trainer field
      trainer: selectedTrainers[0] || editClass.trainer
    };
    
    onUpdateClass(updatedClass);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Class</DialogTitle>
          <DialogDescription>
            Update class information.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-name" className="text-right">
              Class Name*
            </Label>
            <Input
              id="edit-name"
              name="name"
              value={editClass.name}
              onChange={handleInputChange}
              className="col-span-3"
              required
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Gender</Label>
            <RadioGroup 
              value={editClass.gender || "All"} 
              onValueChange={handleGenderChange}
              className="col-span-3 flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="All" id="edit-all" />
                <Label htmlFor="edit-all">All</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Male" id="edit-male" />
                <Label htmlFor="edit-male">Male Only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Female" id="edit-female" />
                <Label htmlFor="edit-female">Female Only</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Trainers*</Label>
            <div className="col-span-3 space-y-2">
              {trainers.map((trainer) => (
                <div key={trainer} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`edit-trainer-${trainer}`} 
                    checked={selectedTrainers.includes(trainer)}
                    onCheckedChange={(checked) => handleTrainerSelection(trainer, checked === true)}
                  />
                  <Label htmlFor={`edit-trainer-${trainer}`}>{trainer}</Label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-schedule" className="text-right">
              Schedule
            </Label>
            <Input
              id="edit-schedule"
              name="schedule"
              value={editClass.schedule}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-capacity" className="text-right">
              Capacity*
            </Label>
            <Input
              id="edit-capacity"
              name="capacity"
              type="number"
              value={editClass.capacity || ""}
              onChange={handleInputChange}
              className="col-span-3"
              required
              min="1"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-enrolled" className="text-right">
              Enrolled
            </Label>
            <Input
              id="edit-enrolled"
              name="enrolled"
              type="number"
              value={editClass.enrolled || ""}
              onChange={handleInputChange}
              className="col-span-3"
              min="0"
            />
          </div>
          
          <div className="flex justify-end mt-4">
            <Button 
              onClick={handleUpdateClass} 
              className="bg-gym-blue hover:bg-gym-dark-blue"
              disabled={!editClass.name || selectedTrainers.length === 0 || editClass.capacity <= 0}
            >
              Update Class
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditClassDialog;
