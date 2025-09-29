import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PencilIcon, PowerIcon, UserMinusIcon, Lock, Trash2, User, UserRound, Mail, Phone, CreditCard, Activity, CheckCircle, XCircle } from "lucide-react";
import { Member } from "./types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MemberGridProps {
  members: Member[];
  filteredMembers: Member[];
  toggleMemberStatus: (id: number) => void;
  toggleTrainerEditAccess: (id: number) => void;
  openEditDialog: (member: Member) => void;
  resetPassword: (id: number) => void;
  deleteMember: (id: number) => void;
  isLoading?: boolean;
  showDeleteIcon?: boolean;
  onMemberClick?: (member: Member) => void;
}

const MemberGrid = ({
  members,
  filteredMembers,
  toggleMemberStatus,
  toggleTrainerEditAccess,
  openEditDialog,
  resetPassword,
  deleteMember,
  isLoading = false,
  showDeleteIcon = true,
  onMemberClick
}: MemberGridProps) => {

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="flex justify-between items-center">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="flex gap-1">
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (filteredMembers.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <User className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {members.length === 0 ? "No members found" : "No matching members"}
        </h3>
        <p className="text-gray-500">
          {members.length === 0 
            ? "Start by adding your first member to the gym." 
            : "Try adjusting your search criteria."}
        </p>
      </div>
    );
  }

  const getGenderIcon = (gender?: string) => {
    if (gender === "Male") {
      return <User className="h-5 w-5 text-blue-600" />;
    }
    if (gender === "Female") {
      return <UserRound className="h-5 w-5 text-pink-600" />;
    }
    return <User className="h-5 w-5 text-gray-600" />;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredMembers.map((member) => (
        <Card key={member.id} className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            {/* Header with name, gender icon, and status */}
            <div className="flex items-start justify-between mb-4">
              <div 
                className="flex items-center gap-3 cursor-pointer hover:bg-blue-50 p-2 rounded transition-colors -m-2 flex-1"
                onClick={() => onMemberClick?.(member)}
              >
                {getGenderIcon(member.gender)}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                    {member.name}
                  </h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {member.email}
                  </p>
                </div>
              </div>
              
              {/* Status Icon */}
              {member.status === "Active" ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
            </div>

            {/* Member details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{member.phone || 'Not provided'}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{member.membership || 'Basic'}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Sessions:</span>
                </div>
                <Badge className={member.remainingSessions <= 2 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                  {member.remainingSessions}
                </Badge>
              </div>
            </div>

            {/* Footer with action buttons */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <TooltipProvider>
                <div className="flex gap-1 justify-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(member)}
                        className="h-8 w-8 text-gym-blue hover:text-gym-dark-blue hover:bg-blue-50"
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
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleMemberStatus(member.id)}
                        className={`h-8 w-8 ${member.status === "Active" 
                          ? "text-red-600 hover:text-red-800 hover:bg-red-50" 
                          : "text-green-600 hover:text-green-800 hover:bg-green-50"}`}
                      >
                        <PowerIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{member.status === "Active" ? "Deactivate" : "Activate"}</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleTrainerEditAccess(member.id)}
                        className="h-8 w-8 text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                      >
                        <UserMinusIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{member.canBeEditedByTrainers ? "Remove Trainer Access" : "Allow Trainer Access"}</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => resetPassword(member.id)}
                        className="h-8 w-8 text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                      >
                        <Lock className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reset Password</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  {showDeleteIcon && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete ${member.name}?\n\nThis will permanently remove:\n• Member account\n• Authentication access\n• All bookings\n• All session requests\n\nThis action cannot be undone.`)) {
                              deleteMember(member.id);
                            }
                          }}
                          className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete Member</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MemberGrid;