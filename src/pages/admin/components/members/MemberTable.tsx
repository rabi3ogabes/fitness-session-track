import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PencilIcon, PowerIcon, UserMinusIcon, Lock, Trash2, User, UserRound } from "lucide-react";
import { Member } from "./types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MemberTableProps {
  members: Member[];
  filteredMembers: Member[];
  toggleMemberStatus: (id: number) => void;
  toggleTrainerEditAccess: (id: number) => void;
  openEditDialog: (member: Member) => void;
  resetPassword: (id: number) => void;
  deleteMember: (id: number) => void;
  isLoading?: boolean;
  showDeleteIcon?: boolean;
}

const MemberTable = ({
  members,
  filteredMembers,
  toggleMemberStatus,
  toggleTrainerEditAccess,
  openEditDialog,
  resetPassword,
  deleteMember,
  isLoading = false,
  showDeleteIcon = true
}: MemberTableProps) => {

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-8 text-center">
          <p className="text-gray-500">Loading members...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <ScrollArea className="h-[calc(100vh-250px)]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="hidden lg:table-cell">Sessions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                    {members.length === 0 ? "No members found in the database." : "No members matching your search criteria."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {member.gender === "Male" && (
                          <User className="h-4 w-4 text-blue-600" />
                        )}
                        {member.gender === "Female" && (
                          <UserRound className="h-4 w-4 text-pink-600" />
                        )}
                        <span>{member.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell className="hidden md:table-cell">{member.phone}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {member.remainingSessions}/{member.sessions}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          member.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {member.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <div className="flex justify-end gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(member)}
                                className="text-gym-blue hover:text-gym-dark-blue hover:bg-blue-50"
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
                                className={member.status === "Active" 
                                  ? "text-red-600 hover:text-red-800 hover:bg-red-50" 
                                  : "text-green-600 hover:text-green-800 hover:bg-green-50"}
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
                                className="text-orange-600 hover:text-orange-800 hover:bg-orange-50"
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
                                className="text-purple-600 hover:text-purple-800 hover:bg-purple-50"
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
                                     if (window.confirm(`Are you sure you want to delete ${member.name}? This action cannot be undone.`)) {
                                       deleteMember(member.id);
                                     }
                                   }}
                                   className="text-red-600 hover:text-red-800 hover:bg-red-50"
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </div>
  );
};

export default MemberTable;
