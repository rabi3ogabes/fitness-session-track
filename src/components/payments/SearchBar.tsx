
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddClick: () => void;
}

const SearchBar = ({ searchTerm, onSearchChange, onAddClick }: SearchBarProps) => {
  return (
    <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="w-full sm:w-auto">
        <Input
          placeholder="Search payments..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="sm:w-80"
        />
      </div>
      <Button 
        onClick={onAddClick} 
        className="w-full sm:w-auto bg-gym-blue hover:bg-gym-dark-blue"
      >
        Record New Payment
      </Button>
    </div>
  );
};

export default SearchBar;
