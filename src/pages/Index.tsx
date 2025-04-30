import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useRef } from "react";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselPrevious, 
  CarouselNext 
} from "@/components/ui/carousel";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogClose,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MainPageContent {
  heroTitle: string;
  heroDescription: string;
  heroImage: string;
  feature1Title: string;
  feature1Description: string;
  feature2Title: string;
  feature2Description: string;
  feature3Title: string;
  feature3Description: string;
}

const Index = () => {
  const { isAuthenticated } = useAuth();
  const [logo, setLogo] = useState<string | null>(null);
  const [headerColor, setHeaderColor] = useState<string>("#ffffff");
  const [footerColor, setFooterColor] = useState<string>("#000000");
  const closeDialogRef = useRef<HTMLButtonElement>(null);
  const [content, setContent] = useState<MainPageContent>({
    heroTitle: "FitTrack Pro",
    heroDescription: "The ultimate gym management system for trainers, members, and administrators. Track your fitness journey, manage classes, and achieve your goals.",
    heroImage: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    feature1Title: "Class Booking",
    feature1Description: "Book and manage your fitness classes with ease. Never miss a session with our reminder system.",
    feature2Title: "Progress Tracking",
    feature2Description: "Track your fitness journey with detailed statistics and visualizations to keep you motivated.",
    feature3Title: "Membership Management",
    feature3Description: "Manage your membership, payments, and subscriptions all in one place."
  });
  
  const [testimonials, setTestimonials] = useState([
    {
      name: "Sarah Johnson",
      role: "Fitness Enthusiast",
      comment: "FitTrack Pro has completely transformed how I manage my gym routine. The class booking system is so intuitive!",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3"
    },
    {
      name: "Michael Chen",
      role: "Personal Trainer",
      comment: "As a trainer, I can easily track all my clients' progress. The dashboard provides all the information I need at a glance.",
      image: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3"
    },
    {
      name: "Emma Wilson",
      role: "Gym Owner",
      comment: "Managing our gym has never been easier. The administrative tools save us hours every week!",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3"
    }
  ]);

  // States for the sign up form
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    phone: "",
    birthday: "",
    membership: "Basic",
    sessions: 4,
    remainingSessions: 4,
    status: "Active",
    canBeEditedByTrainers: true
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    // Load settings from localStorage
    const savedLogo = localStorage.getItem("gymLogo");
    if (savedLogo) {
      setLogo(savedLogo);
    }
    
    const savedHeaderColor = localStorage.getItem("headerBackgroundColor");
    if (savedHeaderColor) {
      setHeaderColor(savedHeaderColor);
    }
    
    const savedFooterColor = localStorage.getItem("footerBackgroundColor");
    if (savedFooterColor) {
      setFooterColor(savedFooterColor);
    }
    
    // Load main page content from localStorage
    const savedMainPageContent = localStorage.getItem("mainPageContent");
    if (savedMainPageContent) {
      setContent(JSON.parse(savedMainPageContent));
    }
  }, []);

  // Update birthday when date is selected
  useEffect(() => {
    if (selectedDate) {
      setNewMember({
        ...newMember,
        birthday: format(selectedDate, 'dd/MM/yyyy')
      });
    }
  }, [selectedDate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMember.name || !newMember.email) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // In a real app, this would make an API call to register the user
      // For now, we'll just simulate a successful registration
      
      // Store membership request in localStorage to show in admin/trainer interface
      const existingRequests = JSON.parse(localStorage.getItem("membershipRequests") || "[]");
      const newRequest = {
        id: Date.now(),
        name: newMember.name,
        email: newMember.email,
        phone: newMember.phone,
        membership: newMember.membership,
        requestDate: new Date().toISOString(),
        status: "Pending"
      };
      
      localStorage.setItem("membershipRequests", JSON.stringify([...existingRequests, newRequest]));
      
      // Show success message
      toast({
        title: "Sign up successful!",
        description: "Your membership request has been submitted. Our team will contact you shortly.",
      });
      
      // Reset form
      setNewMember({
        name: "",
        email: "",
        phone: "",
        birthday: "",
        membership: "Basic",
        sessions: 4,
        remainingSessions: 4,
        status: "Active",
        canBeEditedByTrainers: true
      });
      setSelectedDate(undefined);
      
      // Close the dialog by triggering the close button click
      if (closeDialogRef.current) {
        closeDialogRef.current.click();
      }
      
    } catch (error) {
      toast({
        title: "Sign up failed",
        description: "There was an error processing your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Header */}
      <div 
        className="sticky top-0 z-50 w-full border-b shadow-sm" 
        style={{ backgroundColor: headerColor }}
      >
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          {/* Logo on the left */}
          <div className="flex items-center">
            {logo ? (
              <Link to="/">
                <img 
                  src={logo} 
                  alt="Gym Logo" 
                  className="h-10 object-contain"
                />
              </Link>
            ) : (
              <Link to="/" className="font-bold text-xl text-gym-blue">
                FitTrack Pro
              </Link>
            )}
          </div>
          
          {/* Auth buttons on the right */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 bg-gym-blue hover:bg-gym-dark-blue text-white rounded-md transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-gym-blue hover:text-gym-dark-blue transition-colors"
                >
                  Login
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="px-4 py-2 bg-gym-blue hover:bg-gym-dark-blue text-white rounded-md transition-colors">
                      Sign Up
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Sign Up for Membership</AlertDialogTitle>
                    </AlertDialogHeader>
                    <form onSubmit={handleSignUp} className="mt-4 space-y-4">
                      <div className="grid gap-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label className="text-right text-sm font-medium col-span-1">
                            Name*
                          </label>
                          <Input
                            value={newMember.name}
                            onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                            className="col-span-3"
                            placeholder="Full Name"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label className="text-right text-sm font-medium col-span-1">
                            Email*
                          </label>
                          <Input
                            type="email"
                            value={newMember.email}
                            onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                            className="col-span-3"
                            placeholder="Email Address"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label className="text-right text-sm font-medium col-span-1">
                            Phone
                          </label>
                          <Input
                            value={newMember.phone}
                            onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                            className="col-span-3"
                            placeholder="Phone Number"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label className="text-right text-sm font-medium col-span-1">
                            Birthday
                          </label>
                          <div className="col-span-3">
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
                                <Calendar
                                  mode="single"
                                  selected={selectedDate}
                                  onSelect={setSelectedDate}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label className="text-right text-sm font-medium col-span-1">
                            Membership
                          </label>
                          <select
                            value={newMember.membership}
                            onChange={(e) => {
                              const membership = e.target.value;
                              let sessions = 4;
                              if (membership === "Standard") sessions = 8;
                              if (membership === "Premium") sessions = 12;
                              setNewMember({ ...newMember, membership, sessions, remainingSessions: sessions });
                            }}
                            className="col-span-3 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-gym-blue focus:border-transparent"
                          >
                            <option value="Basic">Basic (4 sessions)</option>
                            <option value="Standard">Standard (8 sessions)</option>
                            <option value="Premium">Premium (12 sessions)</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2 pt-4">
                        <AlertDialogClose ref={closeDialogRef} asChild>
                          <Button type="button" variant="outline">
                            Cancel
                          </Button>
                        </AlertDialogClose>
                        <Button 
                          type="submit" 
                          disabled={isProcessing}
                          className="bg-gym-blue hover:bg-gym-dark-blue text-white"
                        >
                          {isProcessing ? "Processing..." : "Submit"}
                        </Button>
                      </div>
                    </form>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section with dynamic background color */}
      <header 
        className="relative min-h-[80vh] flex flex-col items-center justify-center text-white overflow-hidden"
        style={{ backgroundColor: headerColor }}
      >
        {/* Background Image Overlay */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center" 
          style={{
            backgroundImage: `url(${content.heroImage || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2070"})`,
            opacity: 0.7
          }}
        ></div>
        
        {/* Dark Overlay for better text visibility */}
        <div className="absolute inset-0 bg-black opacity-50 z-10"></div>
        
        {/* Content */}
        <div className="container mx-auto px-4 py-20 flex flex-col items-center text-center relative z-20">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
            <span className="text-gym-blue">{content.heroTitle.split(' ')[0]}</span> {content.heroTitle.split(' ').slice(1).join(' ')}
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mb-10 animate-fade-in">
            {content.heroDescription}
          </p>
          
          {isAuthenticated ? (
            <div className="flex flex-wrap gap-4 justify-center animate-fade-in">
              <Link
                to="/dashboard"
                className="px-6 py-3 bg-gym-blue hover:bg-gym-dark-blue rounded-md font-medium transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 justify-center animate-fade-in">
              <Link
                to="/login"
                className="px-6 py-3 bg-gym-blue hover:bg-gym-dark-blue rounded-md font-medium transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 border border-white hover:bg-white hover:text-black rounded-md font-medium transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-20">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </header>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Our Features</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-800 p-6 rounded-lg transform transition-transform hover:scale-105">
            <h3 className="text-xl font-bold mb-4 text-gym-blue">{content.feature1Title}</h3>
            <p className="text-white">{content.feature1Description}</p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg transform transition-transform hover:scale-105">
            <h3 className="text-xl font-bold mb-4 text-gym-blue">{content.feature2Title}</h3>
            <p className="text-white">{content.feature2Description}</p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg transform transition-transform hover:scale-105">
            <h3 className="text-xl font-bold mb-4 text-gym-blue">{content.feature3Title}</h3>
            <p className="text-white">{content.feature3Description}</p>
          </div>
        </div>
      </section>

      {/* Testimonial Slider Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">What Our Members Say</h2>
          
          <Carousel className="max-w-4xl mx-auto">
            <CarouselContent>
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index}>
                  <div className="p-6 bg-white rounded-lg shadow-lg flex flex-col md:flex-row gap-6 items-center">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-lg italic mb-4">{testimonial.comment}</p>
                      <div>
                        <h4 className="font-bold">{testimonial.name}</h4>
                        <p className="text-gray-600">{testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-4 md:-left-12" />
            <CarouselNext className="-right-4 md:-right-12" />
          </Carousel>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gym-blue text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Fitness Journey?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">Join FitTrack Pro today and take control of your fitness goals with our comprehensive gym management system.</p>
          <Link
            to="/login"
            className="px-8 py-4 bg-white text-gym-blue font-bold rounded-md hover:bg-gray-100 transition-colors inline-block"
          >
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Footer with dynamic background color */}
      <footer className="py-8 mt-auto" style={{ backgroundColor: footerColor }}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-bold text-gym-blue">FitTrack Pro</h2>
              <p className="text-gray-400">© 2025 All rights reserved</p>
            </div>
            
            <div className="flex gap-6">
              <Link to="/login" className="text-gray-300 hover:text-white">Login</Link>
              <a href="#" className="text-gray-300 hover:text-white">About</a>
              <a href="#" className="text-gray-300 hover:text-white">Contact</a>
              <a href="#" className="text-gray-300 hover:text-white">Privacy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
