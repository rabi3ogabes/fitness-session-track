
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
import { CalendarIcon, AlertCircle, User, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'offline' | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("login");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showDemoHelp, setShowDemoHelp] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  
  const { login, signup, isAdmin, isTrainer, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Generate years for the year selector
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check if user is already logged in and redirect accordingly
  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) {
        navigate("/admin");
      } else if (isTrainer) {
        navigate("/trainer");
      } else {
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
    setShowDemoHelp(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setConnectionStatus('connecting');
    setLoginAttempts(prev => prev + 1);

    try {
      // Add console logs to help debug
      console.log("Starting login with:", identifier);
      
      // Set a timeout to detect slow connections
      const connectionTimeoutId = setTimeout(() => {
        if (connectionStatus === 'connecting') {
          toast({
            title: "Slow connection detected",
            description: "Connection is taking longer than expected. Please wait or try demo mode.",
            variant: "destructive",
          });
        }
      }, 5000);
      
      await login(identifier, password);
      clearTimeout(connectionTimeoutId);
      setConnectionStatus('connected');
      // Login success will be handled by the useEffect that watches isAuthenticated
    } catch (error) {
      clearTimeout(connectionTimeoutId);
      setConnectionStatus('offline');
      // Error is now handled in the AuthContext
      console.error("Login error caught in component:", error);
      
      // If multiple attempts fail, suggest demo mode
      if (loginAttempts >= 2 && !isOnline) {
        toast({
          title: "Connection issues detected",
          description: "Try using the demo accounts if you're having connection problems.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate phone number format
      if (!/^\d{8}$/.test(phone)) {
        toast({
          title: "Invalid phone number",
          description: "Please enter an 8-digit Qatar phone number",
          variant: "destructive",
        });
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
        setIsLoading(false);
        return;
      }

      const success = await signup(
        email, 
        signupPassword, 
        name, 
        phone, 
        selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined
      );
      
      if (success === true) {
        toast({
          title: "Signup successful",
          description: "Your account has been created. You can now log in.",
        });
        
        // Switch to login tab
        setActiveTab("login");
        setIdentifier(email);
        setPassword(signupPassword);
      }
    } catch (error) {
      // Error is now handled in the AuthContext
      console.error("Signup error caught in component:", error);
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
                <br />
                <span className="font-medium">Note:</span> Demo accounts will still work in offline mode.
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
        
        <OfflineWarning />
        
        {connectionStatus === 'connecting' && loginAttempts > 1 && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
            <p className="text-sm text-blue-700">
              Connection is taking longer than usual. Demo accounts will work even with connection issues.
            </p>
          </div>
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
                  <Label htmlFor="identifier">Phone Number or Email</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <User size={18} />
                    </span>
                    <Input
                      id="identifier"
                      placeholder="Enter 8-digit phone number or email"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    For example: 66666666 or user@example.com
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
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {connectionStatus === 'connecting' && loginAttempts > 1 ? "Connecting..." : "Signing in..."}
                    </div>
                  ) : "Sign in"}
                </Button>
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
                  <p className="text-xs text-gray-500">
                    By default, your phone number will be your password
                  </p>
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
