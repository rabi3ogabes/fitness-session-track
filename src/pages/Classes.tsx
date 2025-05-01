
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

// Sample data to use as fallback when database connection fails
const sampleClasses: ClassModel[] = [
  {
    id: 1,
    name: "Morning Yoga",
    trainer: "Sarah Davis",
    trainers: ["Sarah Davis"],
    schedule: "Monday, Wednesday, Friday",
    capacity: 20,
    enrolled: 15,
    status: "Active",
    gender: "All",
    startTime: "06:00",
    endTime: "07:00"
  },
  {
    id: 2,
    name: "HIIT Training",
    trainer: "Mike Johnson",
    trainers: ["Mike Johnson"],
    schedule: "Tuesday, Thursday",
    capacity: 15,
    enrolled: 12,
    status: "Active",
    gender: "All",
    startTime: "18:00",
    endTime: "19:00"
  },
  {
    id: 3,
    name: "Women's Pilates",
    trainer: "Emma Wilson",
    trainers: ["Emma Wilson"],
    schedule: "Monday, Friday",
    capacity: 12,
    enrolled: 10,
    status: "Active",
    gender: "Female",
    startTime: "09:00",
    endTime: "10:00"
  },
  {
    id: 4,
    name: "Men's Boxing",
    trainer: "Robert Brown",
    trainers: ["Robert Brown"],
    schedule: "Tuesday, Thursday, Saturday",
    capacity: 15,
    enrolled: 15,
    status: "Full",
    gender: "Male",
    startTime: "19:30",
    endTime: "21:00"
  },
  {
    id: 5,
    name: "Strength Training",
    trainer: "David Miller",
    trainers: ["David Miller", "Lisa Garcia"],
    schedule: "Monday, Wednesday, Friday",
    capacity: 18,
    enrolled: 9,
    status: "Active",
    gender: "All",
    startTime: "17:00",
    endTime: "18:30"
  }
];

const Classes = () => {
  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [usingSampleData, setUsingSampleData] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchClasses();
  }, [retryCount]);

  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      setUsingSampleData(false);
      
      console.log("Fetching classes from Supabase...");
      
      // Use AbortController for timeout functionality
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 8000); // 8 second timeout
      
      const { data, error } = await Promise.race([
        supabase.from('classes').select('*'),
        new Promise<any>((_, reject) => 
          setTimeout(() => reject(new Error("Connection timed out")), 8000)
        )
      ]);
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
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
        // If no data from database, use sample data instead of empty array
        setClasses(sampleClasses);
        setUsingSampleData(true);
        
        toast({
          title: "Sample Data Loaded",
          description: "No classes found in database, showing sample data instead.",
        });
      }
    } catch (error: any) {
      console.error("Error fetching classes:", error);
      setFetchError(error.message || "Failed to fetch classes");
      
      // Use sample data as fallback when database connection fails
      setClasses(sampleClasses);
      setUsingSampleData(true);
      
      toast({
        title: "Using Sample Data",
        description: "Connection issue detected. Showing sample data.",
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
    if (usingSampleData) {
      toast({
        title: "Using sample data",
        description: "Cannot add classes while using sample data. Please reconnect to the database.",
        variant: "destructive",
      });
      return;
    }
    
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
          
          {usingSampleData && (
            <Button 
              variant="outline" 
              size="default" 
              onClick={handleRetry} 
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`mr-1 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> 
              {isLoading ? 'Connecting...' : 'Connect to Database'}
            </Button>
          )}
        </div>
      </div>

      {usingSampleData && (
        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <AlertTitle className="text-amber-800">Sample Data Mode</AlertTitle>
          <AlertDescription className="text-amber-700">
            You are viewing sample data because we couldn't connect to the database. 
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetry} 
              className={`ml-2 border-amber-300 text-amber-700 hover:text-amber-800 hover:bg-amber-100 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isLoading}
            >
              <RefreshCw className={`mr-1 h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} /> 
              {isLoading ? 'Connecting...' : 'Connect Now'}
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500">
                    <div className="flex justify-center items-center py-10">
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
                    <TableCell className="text-right">
                      <button
                        onClick={() => {
                          if (usingSampleData) {
                            toast({
                              title: "Using sample data",
                              description: "Actions are disabled while using sample data.",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          toast({
                            title: "Feature coming soon",
                            description: "This action will be available soon.",
                          });
                        }}
                        className="text-gym-blue hover:text-gym-dark-blue"
                      >
                        <Pencil className="h-4 w-4 inline-block" />
                        <span className="ml-1">Edit</span>
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500">
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
