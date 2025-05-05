
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { PencilIcon, PowerIcon, LockReset, Loader2 } from "lucide-react";
import { Trainer } from "./types";

interface TrainerListProps {
  trainers: Trainer[];
  isLoading: boolean;
  searchTerm: string;
  onEdit: (trainer: Trainer) => void;
  onToggleStatus: (id: number) => void;
  onResetPassword: (trainer: Trainer) => void;
}

const TrainerList = ({
  trainers,
  isLoading,
  searchTerm,
  onEdit,
  onToggleStatus,
  onResetPassword,
}: TrainerListProps) => {
  // Filter trainers based on search term
  const filteredTrainers = trainers.filter(
    (trainer) =>
      trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trainer.specialization && trainer.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Specialization</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-gym-blue" />
                    <span className="ml-2">Loading trainers...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredTrainers.length > 0 ? (
              filteredTrainers.map((trainer) => (
                <TableRow key={trainer.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="font-medium text-gray-900">{trainer.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-gray-500">{trainer.email}</div>
                    <div className="text-gray-500">{trainer.phone}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-gray-500">{trainer.gender || "Not specified"}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-gray-500">{trainer.specialization || "Not specified"}</div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        trainer.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {trainer.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            onClick={() => onEdit(trainer)} 
                            variant="ghost" 
                            size="icon"
                            className="text-gym-blue hover:text-gym-dark-blue hover:bg-gray-100"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            onClick={() => onToggleStatus(trainer.id)} 
                            variant="ghost" 
                            size="icon" 
                            className={trainer.status === "Active" 
                              ? "text-red-600 hover:text-red-800 hover:bg-red-50" 
                              : "text-green-600 hover:text-green-800 hover:bg-green-50"}
                          >
                            <PowerIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{trainer.status === "Active" ? "Deactivate" : "Activate"}</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            onClick={() => onResetPassword(trainer)} 
                            variant="ghost" 
                            size="icon" 
                            className="text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                          >
                            <LockReset className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Reset Password</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500">
                  No trainers found matching your search criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TrainerList;
