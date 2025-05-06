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
import { CalendarIcon, AlertCircle, User, Lock, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase, getConnectionStatus } from "@/integrations/supabase/client";

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
  const [error, setError] = useState<string | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<{
    deviceOnline: boolean;
    supabaseConnected: boolean;
    message?: string;
    latency?: number;
  }>({
    deviceOnline: navigator.onLine,
    supabaseConnected: false
  });
  const [checkingConnection, setCheckingConnection] = useState(false);
  
  const { login, signup, isAdmin, isTrainer, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Generate years for the year selector
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

  // Check online status and connection to Supabase
  const checkConnectionStatus = async () => {
    setCheckingConnection(true);
    try {
      const status = await getConnectionStatus();
      setConnectionStatus(status);
      
      // Only update isOnline to match deviceOnline status
      setIsOnline(status.deviceOnline);
      
      // If we can connect to Supabase but there was a previous error about connectivity,
      // clear that specific error
      if (status.supabaseConnected && error && 
         (error.includes("Unable to connect") || 
          error.includes("internet connection") || 
          error.includes("network"))) {
        setError(null);
      }
      
      // If we cannot connect to Supabase despite being online, show an error
      if (status.deviceOnline && !status.supabaseConnected && !error) {
        setError(status.message || "Unable to connect to the authentication service. The server might be down or unreachable.");
      }
    } catch (e) {
      console.error("Error checking connection status:", e);
    } finally {
      setCheckingConnection(false);
    }
  };

  // Check online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // When coming back online, check the actual connection to Supabase
      checkConnectionStatus();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setConnectionStatus({
        deviceOnline: false,
        supabaseConnected: false,
        message: "Your device appears to be offline. Please check your internet connection."
      });
      
      // Only set offline error if we're not already showing one
      if (!error) {
        setError("You appear to be offline. Please check your internet connection.");
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial connection check
    checkConnectionStatus();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [error]);

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

  useEffect(() => {
    // Load logo from local storage
    const savedLogo = localStorage.getItem("gymLogo");
    if (savedLogo) {
      setLogo(savedLogo);
    }
  }, []);

  const fillDemoCredentials = (type: 'admin' | 'user' | 'trainer') => {
    // Reset any previous errors
    setError(null);
    
    switch(type) {
      case 'admin':
        setIdentifier('admin@gym.com');
        setPassword('admin123');
        break;
      case 'user':
        setIdentifier('user@gym.com');
        setPassword('user123');
        break;
      case 'trainer':
        setIdentifier('trainer@gym.com');
        setPassword('trainer123');
        break;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Check connection to Supabase specifically before attempting login
      const status = await getConnectionStatus();
      setConnectionStatus(status);
      
      if (!status.deviceOnline) {
        throw new Error("You're currently offline. Please check your internet connection and try again.");
      }
      
      if (!status.supabaseConnected) {
        throw new Error(status.message || "Unable to connect to authentication service. Please check your internet connection.");
      }
      
      // Add more debugging
      console.log(`Starting login with: ${identifier}, password length: ${password.length}`);
      
      // Check for proper email format if it looks like an email
      if (identifier.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
        throw new Error("Please enter a valid email address");
      }
      
      // Increment login attempts counter
      setLoginAttempts(prev => prev + 1);
      
      // Determine if we need to append @gym.com for convenience
      let emailId = identifier;
      
      // If identifier doesn't include @ and is one of our demo account usernames,
      // automatically append @gym.com for convenience
      if (!identifier.includes('@') && 
          (identifier === 'admin' || identifier === 'user' || identifier === 'trainer')) {
        emailId = `${identifier}@gym.com`;
        console.log("Auto-appending @gym.com to demo account:", emailId);
        
        toast({
          title: "Using demo account format",
          description: `Logging in with ${emailId}`,
        });
      }
      
      console.log("Using email for login:", emailId);
      
      await login(emailId, password);
      // Login success will be handled by the useEffect that watches isAuthenticated
      console.log("Login function completed successfully");
    } catch (error: any) {
      // Display error message
      console.error("Login error caught in component:", error);
      
      // Special handling for demo accounts
      if ((identifier === 'admin' || identifier === 'user' || identifier === 'trainer') && 
          (password === 'admin123' || password === 'user123' || password === 'trainer123')) {
        // Auto-correct demo account format
        const correctedEmail = `${identifier}@gym.com`;
        setIdentifier(correctedEmail);
        toast({
          title: "Demo account format",
          description: `Using ${correctedEmail} as the email format`,
          variant: "default",
        });
        
        // Try again with corrected format
        try {
          await login(correctedEmail, password);
          setIsLoading(false);
          return; // Success case handled by useEffect
        } catch (retryError) {
          // Continue to show error below
          console.error("Retry login error:", retryError);
        }
      }
      
      // Provide clear error messages based on common issues
      if (!connectionStatus.deviceOnline) {
        setError("You appear to be offline. Please check your internet connection and try again.");
      } else if (!connectionStatus.supabaseConnected) {
        setError(connectionStatus.message || "Unable to connect to the authentication service. The server might be down or unreachable.");
      } else if (error.message?.includes("Invalid login credentials")) {
        setError("The email or password you entered is incorrect. Please check your credentials and try again.");
      } else if (error.message?.includes("NetworkError") || error.message?.includes("network") || error.message?.includes("fetch") || error.message?.includes("connect")) {
        setError("Unable to connect to the authentication service. Please check your internet connection.");
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
      // Check if we're offline
      if (!navigator.onLine) {
        throw new Error("You're currently offline. Please check your internet connection and try again.");
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
        
        // Also register in members table for admin/trainer view - Fix: Use a single object instead of an array
        try {
          const { error: memberError } = await supabase
            .from('members')
            .insert({
              name: name,
              email: email,
              phone: phone,
              birthday: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null,
              membership: "Basic",
              sessions: 4,
              remaining_sessions: 4,
              status: "Active",
              gender: "Male" // Default gender
            });
          
          if (memberError) {
            console.error("Error registering in members table:", memberError);
          }
        } catch (memberErr) {
          console.error("Error adding to members table:", memberErr);
        }
      }
    } catch (error: any) {
      // Display error message
      console.error("Signup error caught in component:", error);
      
      if (!navigator.onLine) {
        setError("You appear to be offline. Please check your internet connection and try again.");
      } else if (error.message?.includes("already registered")) {
        setError("This email is already registered. Please try logging in instead.");
      } else if (error.message?.includes("NetworkError") || error.message?.includes("network") || error.message?.includes("fetch") || error.message?.includes("connect")) {
        setError("Unable to connect to the authentication service. Please check your internet connection.");
      } else {
        setError(error?.message || "Failed to sign up. Please try again.");
      }
    } finally {
      setIsLoading(false);
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

  // Manual connection check button handler
  const handleCheckConnection = () => {
    checkConnectionStatus();
  };

  // Display connection status
  const ConnectionStatus = () => {
    const statusColor = connectionStatus.supabaseConnected ? "text-green-600" : "text-red-600";
    const icon = connectionStatus.deviceOnline ? 
      (connectionStatus.supabaseConnected ? <Wifi className="h-4 w-4 mr-1" /> : <WifiOff className="h-4 w-4 mr-1" />) : 
      <WifiOff className="h-4 w-4 mr-1" />;
    
    return (
      <div className="mb-3">
        <div className="flex items-center justify-center">
          <span className="mr-2">Connection status:</span>
          <span className={`flex items-center ${statusColor}`}>
            {icon}
            {connectionStatus.deviceOnline ? 
              (connectionStatus.supabaseConnected ? "Connected" : "Server unreachable") : 
              "Offline"}
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-2 h-7 px-2"
            onClick={handleCheckConnection}
            disabled={checkingConnection}
          >
            {checkingConnection ? "Checking..." : "Check"}
          </Button>
        </div>
        {connectionStatus.latency && (
          <div className="text-xs text-center mt-1">
            Latency: {connectionStatus.latency}ms
            {connectionStatus.latency > 1000 && " (High latency may cause delays)"}
          </div>
        )}
      </div>
    );
  };

  // Display offline warning
  const ConnectionWarning = () => {
    if (!connectionStatus.deviceOnline || (connectionStatus.deviceOnline && !connectionStatus.supabaseConnected)) {
      return (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <WifiOff className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                {connectionStatus.message || "You appear to be offline or unable to reach the server. Please check your internet connection."}
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
          <ConnectionStatus />
          <div className="mt-2 text-sm text-gray-600">
            <p className="mb-2">
              Demo accounts: admin@gym.com, user@gym.com, trainer@gym.com (password: admin123, user123, trainer123)
            </p>
            <div className="flex justify-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fillDemoCredentials('admin')}
              >
                Use Admin
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fillDemoCredentials('user')}
              >
                Use User
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fillDemoCredentials('trainer')}
              >
                Use Trainer
              </Button>
            </div>
          </div>
        </div>
        
        <ConnectionWarning />

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
                  <p className="text-xs text-gray-500">
                    For example: admin@gym.com, user@gym.com, trainer@gym.com
                  </p>
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
                  disabled={isLoading || !connectionStatus.supabaseConnected}
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>

                {loginAttempts > 1 && error && (
                  <div className="mt-3 text-sm text-gray-600">
                    <p>Having trouble logging in?</p>
                    <ul className="list-disc pl-5 mt-1">
                      <li>For demo accounts, use full email (e.g., admin@gym.com)</li>
                      <li>Passwords are case sensitive</li>
                      <li>Try one of the demo account buttons above</li>
                      <li>Check your internet connection</li>
                      <li>Click the "Check" button to verify connectivity</li>
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
                  <p className="text-xs text-gray-500">
                    Your phone number will be your username and default password
                  </p>
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
                  disabled={isLoading || !connectionStatus.supabaseConnected}
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
