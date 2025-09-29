
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus, LayoutGrid, LayoutList } from "lucide-react";

interface MemberSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onAddClick: () => void;
  viewMode: 'box' | 'grid';
  onViewModeChange: (mode: 'box' | 'grid') => void;
}

const MemberSearch = ({ searchTerm, onSearchChange, onAddClick, viewMode, onViewModeChange }: MemberSearchProps) => {
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
      
      <div className="flex items-center gap-2">
        {/* View Mode Toggle */}
        <div className="flex items-center border rounded-lg p-1 bg-gray-50">
          <Button
            variant={viewMode === 'box' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('box')}
            className={`px-3 py-1 ${
              viewMode === 'box' 
                ? 'bg-gym-blue text-white hover:bg-gym-dark-blue' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <LayoutList className="h-4 w-4 mr-1" />
            Box
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className={`px-3 py-1 ${
              viewMode === 'grid' 
                ? 'bg-gym-blue text-white hover:bg-gym-dark-blue' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <LayoutGrid className="h-4 w-4 mr-1" />
            Grid
          </Button>
        </div>
        
        <Button onClick={onAddClick} className="w-full sm:w-auto bg-gym-blue hover:bg-gym-dark-blue">
          <UserPlus className="h-4 w-4 mr-1" /> Register Walk-in Member
        </Button>
      </div>
    </div>
  );
};

export default MemberSearch;
