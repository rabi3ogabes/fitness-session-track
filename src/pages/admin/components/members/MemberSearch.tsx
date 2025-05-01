
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

interface MemberSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onAddClick: () => void;
}

const MemberSearch = ({ searchTerm, onSearchChange, onAddClick }: MemberSearchProps) => {
  return (
    <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="w-full sm:w-auto">
        <Input
          placeholder="Search members..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="sm:w-80"
        />
      </div>
      <Button onClick={onAddClick} className="w-full sm:w-auto bg-gym-blue hover:bg-gym-dark-blue">
        <UserPlus className="h-4 w-4 mr-1" /> Register Walk-in Member
      </Button>
    </div>
  );
};

export default MemberSearch;
