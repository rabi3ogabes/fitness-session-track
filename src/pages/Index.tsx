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
  featuresSection: string;
  testimonialsSection: string;
  ctaTitle: string;
  ctaDescription: string;
  ctaButton: string;
  companyName: string;
  copyright: string;
  footerLogin: string;
  footerAbout: string;
  footerContact: string;
  footerPrivacy: string;
}

const Index = () => {
  const { isAuthenticated } = useAuth();
  const [logo, setLogo] = useState<string | null>(null);
  const [headerColor, setHeaderColor] = useState<string>("#ffffff");
  const [footerColor, setFooterColor] = useState<string>("#000000");
  const [showTestimonials, setShowTestimonials] = useState(true);
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
    feature3Description: "Manage your membership, payments, and subscriptions all in one place.",
    featuresSection: "Our Features",
    testimonialsSection: "What Our Members Say",
    ctaTitle: "Ready to Transform Your Fitness Journey?",
    ctaDescription: "Join FitTrack Pro today and take control of your fitness goals with our comprehensive gym management system.",
    ctaButton: "Get Started Now",
    companyName: "FitTrack Pro",
    copyright: "© 2025 All rights reserved",
    footerLogin: "Login",
    footerAbout: "About",
    footerContact: "Contact",
    footerPrivacy: "Privacy"
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
  const [yearView, setYearView] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { toast } = useToast();

  // Generate years for the year selector
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

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
                {content.companyName}
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
              <Link
                to="/login"
                className="px-4 py-2 bg-gym-blue hover:bg-gym-dark-blue text-white rounded-md transition-colors"
              >
                Sign Up / Login
              </Link>
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
                Sign Up / Login
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
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{content.featuresSection}</h2>
        
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
      {showTestimonials && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{content.testimonialsSection}</h2>
            
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
      )}

      {/* CTA Section */}
      <section className="py-16 bg-gym-blue text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">{content.ctaTitle}</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">{content.ctaDescription}</p>
          <Link
            to="/login"
            className="px-8 py-4 bg-white text-gym-blue font-bold rounded-md hover:bg-gray-100 transition-colors inline-block"
          >
            {content.ctaButton}
          </Link>
        </div>
      </section>

      {/* Footer with dynamic background color */}
      <footer className="py-8 mt-auto" style={{ backgroundColor: footerColor }}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-bold text-gym-blue">{content.companyName}</h2>
              <p className="text-gray-400">{content.copyright}</p>
            </div>
            
            <div className="flex gap-6">
              <Link to="/login" className="text-gray-300 hover:text-white">{content.footerLogin}</Link>
              <a href="#" className="text-gray-300 hover:text-white">{content.footerAbout}</a>
              <a href="#" className="text-gray-300 hover:text-white">{content.footerContact}</a>
              <a href="#" className="text-gray-300 hover:text-white">{content.footerPrivacy}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
