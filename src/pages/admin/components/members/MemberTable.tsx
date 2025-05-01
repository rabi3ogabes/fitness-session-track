
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/AuthContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Edit, X, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Member {
  id: number;
  name: string;
  email: string;
  phone: string;
  membership: string;
  sessions: number;
  remainingSessions: number;
  status: string;
  birthday: string;
  canBeEditedByTrainers: boolean;
  gender?: "Male" | "Female";
}

interface MemberTableProps {
  members: Member[];
  filteredMembers: Member[];
  toggleMemberStatus: (id: number) => void;
  toggleTrainerEditAccess: (id: number) => void;
  openEditDialog: (member: Member) => void;
  resetPassword: (id: number) => void;
}

const MemberTable = ({
  filteredMembers,
  toggleMemberStatus,
  toggleTrainerEditAccess,
  openEditDialog,
  resetPassword
}: MemberTableProps) => {
  const { isAdmin, isTrainer } = useAuth();

  // Check if user has edit permissions for this member
  const canEditMember = (member: Member) => {
    return isAdmin || (isTrainer && member.canBeEditedByTrainers);
  };

  return (
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
                Gender
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sessions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              {isAdmin && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trainer Edit
                </th>
              )}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMembers.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{member.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-gray-500">{member.email}</div>
                  <div className="text-gray-500">{member.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-gray-500">{member.gender || "Not specified"}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">
                    {member.remainingSessions}/{member.sessions}
                  </div>
                  <div className="text-xs text-gray-500">
                    {member.membership} Plan
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      member.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {member.status}
                  </span>
                </td>
                {isAdmin && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Switch 
                      checked={member.canBeEditedByTrainers}
                      onCheckedChange={() => toggleTrainerEditAccess(member.id)}
                    />
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                  <TooltipProvider>
                    {canEditMember(member) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            onClick={() => openEditDialog(member)} 
                            variant="ghost" 
                            size="icon"
                            className="text-gym-blue hover:text-gym-dark-blue hover:bg-gray-100"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          onClick={() => toggleMemberStatus(member.id)} 
                          variant="ghost" 
                          size="icon" 
                          className={member.status === "Active" 
                            ? "text-red-600 hover:text-red-800 hover:bg-red-50" 
                            : "text-green-600 hover:text-green-800 hover:bg-green-50"}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{member.status === "Active" ? "Deactivate" : "Activate"}</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    {isAdmin && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            onClick={() => resetPassword(member.id)} 
                            variant="ghost" 
                            size="icon" 
                            className="text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                          >
                            <RotateCw className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Reset Password</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TooltipProvider>
                </td>
              </tr>
            ))}
            {filteredMembers.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="px-6 py-4 text-center text-gray-500">
                  No members found matching your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MemberTable;
