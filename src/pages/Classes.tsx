
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface ClassModel {
  id: number;
  name: string;
  trainer: string;
  trainers?: string[];
  schedule: string;
  capacity: number;
  enrolled: number;
  status: string;
  gender: "Male" | "Female" | "All" | string;
  startTime?: string;
  endTime?: string;
}

const Classes = () => {
  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchClasses();
  }, [retryCount]);

  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      
      console.log("Fetching classes from Supabase...");
      
      const { data, error } = await supabase
        .from('classes')
        .select('*');
      
      if (error) {
        throw error;
      }

      console.log("Classes data received:", data);
      
      if (data && data.length > 0) {
        // Map Supabase fields to match our ClassModel structure
        const formattedClasses: ClassModel[] = data.map(cls => ({
          id: cls.id,
          name: cls.name || '',
          trainer: cls.trainer || '',
          trainers: cls.trainers || [],
          schedule: cls.schedule || '',
          capacity: cls.capacity || 0,
          enrolled: cls.enrolled || 0,
          status: cls.status || 'Active',
          gender: (cls.gender || 'All') as "All" | "Male" | "Female",
          startTime: cls.start_time || '',
          endTime: cls.end_time || ''
        }));
        
        setClasses(formattedClasses);
        
        toast({
          title: "Classes Loaded",
          description: "Successfully loaded classes from the database.",
        });
      } else {
        setClasses([]);
        toast({
          title: "No classes found",
          description: "There are currently no classes in the database.",
        });
      }
    } catch (error: any) {
      console.error("Error fetching classes:", error);
      setFetchError(error.message || "Failed to fetch classes");
      
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load classes. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    toast({
      title: "Retrying",
      description: "Attempting to reconnect to the database...",
    });
  };

  const handleAddClass = () => {
    toast({
      title: "Feature coming soon",
      description: "The add class functionality will be implemented soon.",
    });
  };

  const filteredClasses = classes.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cls.trainer && cls.trainer.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cls.trainers && cls.trainers.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <DashboardLayout title="Classes">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="w-full sm:w-auto">
          <Input
            placeholder="Search classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sm:w-80"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            className="w-full sm:w-auto bg-gym-blue hover:bg-gym-dark-blue"
            onClick={handleAddClass}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Class
          </Button>
          
          {fetchError && (
            <Button 
              variant="outline" 
              size="default" 
              onClick={handleRetry} 
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`mr-1 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> 
              {isLoading ? 'Retrying...' : 'Retry Connection'}
            </Button>
          )}
        </div>
      </div>

      {fetchError && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-800">Error loading classes</AlertTitle>
          <AlertDescription className="text-red-700">
            {fetchError}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetry} 
              className={`ml-2 border-red-300 text-red-700 hover:text-red-800 hover:bg-red-100 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isLoading}
            >
              <RefreshCw className={`mr-1 h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} /> 
              {isLoading ? 'Retrying...' : 'Retry'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class Name</TableHead>
                <TableHead>Trainer(s)</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    <div className="flex justify-center items-center">
                      <RefreshCw className="animate-spin mr-2 h-4 w-4" />
                      Loading classes...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredClasses.length > 0 ? (
                filteredClasses.map((cls) => (
                  <TableRow key={cls.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="font-medium text-gray-900">{cls.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-gray-500">
                        {cls.trainers && cls.trainers.length > 0 ? cls.trainers.join(", ") : cls.trainer || 'Not assigned'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-gray-500">{cls.schedule || 'Not scheduled'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {cls.startTime && cls.endTime 
                          ? `${cls.startTime} - ${cls.endTime}`
                          : "Not set"
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-gray-500">
                        {cls.enrolled} / {cls.capacity}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          cls.gender === "Male"
                            ? "bg-blue-100 text-blue-800"
                            : cls.gender === "Female"
                            ? "bg-pink-100 text-pink-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {cls.gender || "All"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          cls.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : cls.status === "Full"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {cls.status || 'Inactive'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    {searchTerm ? 
                      "No classes found matching your search criteria." : 
                      "No classes found. Click 'Add New Class' to create one."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Classes;
