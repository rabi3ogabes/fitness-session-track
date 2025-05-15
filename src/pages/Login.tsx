import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, AlertCircle, User, Lock, Wifi, WifiOff, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase, checkSupabaseConnection, isOffline } from "@/integrations/supabase/client";

const Login = () => {
  // Login state
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  
  // Signup state
  const [phone, setPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [yearView, setYearView] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [isLoading, setIsLoading] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("login");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [supabaseConnected, setSupabaseConnected] = useState(true);
  const [checkingConnection, setCheckingConnection] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [connectionCheckCount, setConnectionCheckCount] = useState(0);
  
  const { login, signup, isAdmin, isTrainer, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Generate years for the year selector
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

  // Check online status and Supabase connection
  useEffect(() => {
    const checkSupabaseCon = async () => {
      if (!navigator.onLine) {
        setIsOnline(false);
        setSupabaseConnected(false);
        return;
      }

      setCheckingConnection(true);
      try {
        const result = await checkSupabaseConnection(3, 1000);
        setSupabaseConnected(result.connected);
        setConnectionCheckCount(prev => prev + 1);
        
        if (!result.connected && navigator.onLine) {
          console.log("Device is online but cannot connect to Supabase");
          setError("Cannot connect to the authentication service. Please try again later.");
        } else if (result.connected) {
          // Clear any previous connection errors when we're connected
          setError(prev => prev === "Cannot connect to the authentication service. Please try again later." ? null : prev);
        }
      } catch (err) {
        console.error("Error checking Supabase connection:", err);
        setSupabaseConnected(false);
      } finally {
        setCheckingConnection(false);
      }
    };
    
    const handleOnline = () => {
      setIsOnline(true);
      checkSupabaseCon();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setSupabaseConnected(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check connection on mount
    checkSupabaseCon();
    
    // Set up an interval to periodically check connection if the user is on the login page
    const connectionCheckInterval = setInterval(checkSupabaseCon, 30000); // Every 30 seconds
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(connectionCheckInterval);
    };
  }, []);

  // Check if user is already logged in and redirect accordingly
  useEffect(() => {
    if (isAuthenticated) {
      console.log("User is authenticated, redirecting...");
      if (isAdmin) {
        console.log("Redirecting to admin dashboard");
        navigate("/admin");
      } else if (isTrainer) {
        console.log("Redirecting to trainer dashboard");
        navigate("/trainer");
      } else {
        console.log("Redirecting to user dashboard");
        navigate("/dashboard");
      }
    }
  }, [isAuthenticated, isAdmin, isTrainer, navigate]);

  // Load logo from local storage
  useEffect(() => {
    const savedLogo = localStorage.getItem("gymLogo");
    if (savedLogo) {
      setLogo(savedLogo);
    }
  }, []);

  // Fill in admin credentials for quick testing
  const fillTestCredentials = () => {
    setIdentifier('admin@gym.com');
    setPassword('admin123');
    setError(null);
  };

  // Update the login function to ensure we're using the correct toast 
  // This doesn't change functionality, just ensures the toast is called correctly
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // First check if we're connected to the internet
      if (!navigator.onLine) {
        throw new Error("You appear to be offline. Please check your internet connection.");
      }

      // Re-check connection to Supabase before continuing
      const connectionCheck = await checkSupabaseConnection(3, 800);
      setSupabaseConnected(connectionCheck.connected);

      if (!connectionCheck.connected) {
        throw new Error(`Cannot connect to authentication server. Please try again in a few moments. Latency: ${connectionCheck.latency}ms`);
      }

      // Check if we're using proper email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
        throw new Error("Please enter a valid email address");
      }
      
      // Increment login attempts counter
      setLoginAttempts(prev => prev + 1);
      
      console.log("Using email for login:", identifier);
      
      await login(identifier, password);
      // Login success will be handled by the useEffect that watches isAuthenticated
      console.log("Login function completed successfully");
    } catch (error: any) {
      // Display error message
      console.error("Login error caught in component:", error);
      
      // Provide clear error messages based on common issues
      if (error.message?.includes("Invalid login credentials")) {
        setError("The email or password you entered is incorrect. Please check your credentials and try again.");
      } else if (!navigator.onLine) {
        setError("You appear to be offline. Please check your internet connection and try again.");
      } else if (error.message?.includes("Cannot connect")) {
        setError("Cannot connect to authentication server. Please try again later.");
      } else if (error.message?.includes("timeout")) {
        setError("Login request timed out. The server might be temporarily unavailable.");
      } else {
        setError(error?.message || "Failed to login. Please check your credentials and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // First check if we're connected to Supabase
      if (!isOnline) {
        throw new Error("You appear to be offline. Please check your internet connection.");
      }
      
      // Quick connection check before attempting signup
      if (!supabaseConnected) {
        const connection = await checkSupabaseConnection();
        if (!connection.connected) {
          throw new Error("Cannot connect to authentication server. Please try again later.");
        }
        // Update state since we can connect now
        setSupabaseConnected(true);
      }
      
      // Validate phone number format
      if (!/^\d{8}$/.test(phone)) {
        toast({
          title: "Invalid phone number",
          description: "Please enter an 8-digit Qatar phone number",
          variant: "destructive",
        });
        setError("Please enter an 8-digit Qatar phone number");
        setIsLoading(false);
        return;
      }

      // Check if passwords match
      if (signupPassword !== confirmPassword) {
        toast({
          title: "Passwords don't match",
          description: "Please ensure both passwords are the same",
          variant: "destructive",
        });
        setError("Passwords don't match. Please ensure both passwords are the same");
        setIsLoading(false);
        return;
      }

      // Check email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast({
          title: "Invalid email format",
          description: "Please enter a valid email address",
          variant: "destructive",
        });
        setError("Please enter a valid email address");
        setIsLoading(false);
        return;
      }

      // Check if name is provided
      if (!name.trim()) {
        toast({
          title: "Name is required",
          description: "Please enter your full name",
          variant: "destructive",
        });
        setError("Please enter your full name");
        setIsLoading(false);
        return;
      }

      console.log("Signup attempt for:", email);
      
      const success = await signup(
        email, 
        signupPassword, 
        name, 
        phone, 
        selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined
      );
      
      if (success === true) {
        console.log("Signup successful for:", email);
        
        toast({
          title: "Signup successful",
          description: "Your account has been created. You can now log in.",
        });
        
        // Switch to login tab
        setActiveTab("login");
        setIdentifier(email);
        setPassword(signupPassword);
      }
    } catch (error: any) {
      // Display error message
      console.error("Signup error caught in component:", error);
      setError(error?.message || "Failed to sign up. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualConnectionCheck = async () => {
    setCheckingConnection(true);
    setError(null);
    try {
      const result = await checkSupabaseConnection();
      setSupabaseConnected(result.connected);
      
      if (result.connected) {
        toast({
          title: "Connection successful",
          description: `Connected to authentication server. Latency: ${result.latency}ms`,
          variant: "default",
        });
      } else {
        setError("Cannot connect to authentication server. Please try again later.");
        toast({
          title: "Connection failed",
          description: "Cannot connect to authentication server. Please try again later.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error checking connection:", err);
      setSupabaseConnected(false);
      setError("Failed to check connection status. Please try again.");
    } finally {
      setCheckingConnection(false);
    }
  };

  // Function to handle year selection
  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    setYearView(false);
    // Set date to January 1st of the selected year to help with month view navigation
    const newDate = new Date(year, 0, 1);
    if (!selectedDate) {
      setSelectedDate(newDate);
    } else {
      // Keep the same month and day, just change the year
      const newDate = new Date(selectedDate);
      newDate.setFullYear(year);
      setSelectedDate(newDate);
    }
  };

  // Display connection status with improved visual feedback
  const ConnectionStatus = () => {
    return (
      <div className="flex items-center gap-2 justify-end mb-2 text-sm">
        <span>Connection status: </span>
        {isOnline ? (
          supabaseConnected ? (
            <span className="flex items-center text-green-600">
              <Wifi size={16} className="mr-1" />
              Online
            </span>
          ) : (
            <span className="flex items-center text-orange-500">
              <Wifi size={16} className="mr-1" />
              Limited
            </span>
          )
        ) : (
          <span className="flex items-center text-red-600">
            <WifiOff size={16} className="mr-1" />
            Offline
          </span>
        )}
        <Button 
          variant="outline" 
          size="icon"
          className="h-6 w-6 rounded-full"
          onClick={handleManualConnectionCheck}
          disabled={checkingConnection}
        >
          <RotateCw size={14} className={cn("text-gray-500", checkingConnection && "animate-spin")} />
        </Button>
      </div>
    );
  };

  // Display troubleshooting info when multiple connection checks fail
  const ConnectionTroubleshooting = () => {
    if (connectionCheckCount > 2 && !supabaseConnected) {
      return (
        <Alert variant="default" className="mb-4 bg-blue-50 border-blue-200">
          <AlertTitle className="flex items-center gap-2">
            <AlertCircle size={16} className="text-blue-600" />
            Connection Troubleshooting
          </AlertTitle>
          <AlertDescription className="text-sm">
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Ensure you have a stable internet connection</li>
              <li>Try refreshing the page (F5 or Ctrl+R)</li>
              <li>Try using a different network if available</li>
              <li>Check if any firewalls or VPNs might be blocking the connection</li>
            </ul>
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  };

  // Display offline warning
  const OfflineWarning = () => {
    if (!isOnline) {
      return (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You appear to be offline. Please check your internet connection.
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    // Show a different warning if we're online but can't connect to Supabase
    if (isOnline && !supabaseConnected) {
      return (
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-orange-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-orange-700">
                Cannot connect to authentication server. Please try again later or check your network.
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 self-center">
        <Link to="/">
          {logo ? (
            <div className="flex justify-center h-16">
              <img 
                src={logo} 
                alt="Gym Logo" 
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <h2 className="text-3xl font-bold text-gym-blue">
              FitTrack Pro
            </h2>
          )}
        </Link>
      </div>
      
      <div className="max-w-md w-full mx-auto space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Welcome to FitTrack Pro</h2>
          <div className="mt-2 text-sm text-gray-600">
            <p className="mb-2">
              Login with your credentials or create a new account
            </p>
            <div className="flex justify-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={fillTestCredentials}
              >
                Use Test Admin Credentials
              </Button>
            </div>
          </div>
        </div>
        
        <ConnectionStatus />
        <ConnectionTroubleshooting />
        
        {(!isOnline || !supabaseConnected) && <OfflineWarning />}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <form className="space-y-4" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <Label htmlFor="identifier">Email Address</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <User size={18} />
                    </span>
                    <Input
                      id="identifier"
                      placeholder="Enter your email address"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Lock size={18} />
                    </span>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gym-blue hover:bg-gym-dark-blue" 
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>

                {loginAttempts > 1 && error && (
                  <div className="mt-3 text-sm text-gray-600">
                    <p>Having trouble logging in?</p>
                    <ul className="list-disc pl-5 mt-1">
                      <li>Passwords are case sensitive</li>
                      <li>Check if you have a stable internet connection</li>
                      <li>Try refreshing the page</li>
                    </ul>
                  </div>
                )}
              </form>
            </div>
          </TabsContent>
          
          <TabsContent value="signup">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <form className="space-y-4" onSubmit={handleSignup}>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (8 digits)</Label>
                  <Input
                    id="phone"
                    placeholder="Enter 8-digit Qatar phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "dd/MM/yyyy") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <div className="p-2 flex justify-between items-center border-b">
                        <Button 
                          variant="outline" 
                          className="text-sm"
                          onClick={() => setYearView(!yearView)}
                        >
                          {yearView ? "Show Calendar" : "Select Year"}
                        </Button>
                        {!yearView && (
                          <div className="text-sm font-medium">
                            {selectedDate ? format(selectedDate, "yyyy") : new Date().getFullYear()}
                          </div>
                        )}
                      </div>
                      
                      {yearView ? (
                        <div className="p-2 h-64 overflow-y-auto grid grid-cols-3 gap-2">
                          {years.map((year) => (
                            <Button
                              key={year}
                              variant="ghost"
                              className={cn(
                                "text-sm",
                                selectedYear === year && "bg-primary text-primary-foreground"
                              )}
                              onClick={() => handleYearSelect(year)}
                            >
                              {year}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          defaultMonth={selectedDate || new Date(selectedYear, 0)}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signupPassword">Password</Label>
                  <Input
                    id="signupPassword"
                    type="password"
                    placeholder="Create a password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gym-blue hover:bg-gym-dark-blue" 
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Login;
