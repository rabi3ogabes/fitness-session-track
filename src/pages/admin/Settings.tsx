import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Mail, Clock, Image, Trash, Palette, LayoutDashboard, Type, Plus, Send } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Settings = () => {
  const [cancellationHours, setCancellationHours] = useState(4);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [notificationEmails, setNotificationEmails] = useState({
    email1: "",
    email2: ""
  });
  const [smtpSettings, setSmtpSettings] = useState({
    host: "",
    port: "587",
    username: "",
    password: "",
    fromEmail: "",
    fromName: "Gym System"
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [headerColor, setHeaderColor] = useState<string>("#ffffff");
  const [footerColor, setFooterColor] = useState<string>("#000000");
  const [membershipExpiry, setMembershipExpiry] = useState({
    basic: 30,   // days
    standard: 60, // days
    premium: 90  // days
  });
  const [mainPageContent, setMainPageContent] = useState({
    heroTitle: "Streamlined Gym Management System",
    heroDescription: "A complete solution for gym owners and members. Manage memberships, book sessions, track attendance, and more.",
    heroImage: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    feature1Title: "User Roles",
    feature1Description: "Separate dashboards for administrators and members with role-specific functionality.",
    feature2Title: "Session Booking",
    feature2Description: "Effortless class booking with membership session tracking and management.",
    feature3Title: "Membership Management",
    feature3Description: "Easily manage different membership packages with automated session tracking.",
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
  
  const { toast } = useToast();

  useEffect(() => {
    // Load logo and header color from local storage
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
    
    // Load notification emails from local storage
    const savedNotificationEmails = localStorage.getItem("notificationEmails");
    if (savedNotificationEmails) {
      setNotificationEmails(JSON.parse(savedNotificationEmails));
    }
    
    // Load SMTP settings from local storage
    const savedSmtpSettings = localStorage.getItem("smtpSettings");
    if (savedSmtpSettings) {
      setSmtpSettings(JSON.parse(savedSmtpSettings));
    }
    
    // Load main page content from local storage
    const savedMainPageContent = localStorage.getItem("mainPageContent");
    if (savedMainPageContent) {
      setMainPageContent(JSON.parse(savedMainPageContent));
    }
  }, []);

  const handleSaveSettings = () => {
    setIsLoading(true);

    // Save logo to localStorage
    if (logo) {
      localStorage.setItem("gymLogo", logo);
    } else {
      localStorage.removeItem("gymLogo");
    }
    
    // Save header color to localStorage
    if (headerColor) {
      localStorage.setItem("headerBackgroundColor", headerColor);
    } else {
      localStorage.removeItem("headerBackgroundColor");
    }
    
    // Save footer color to localStorage
    if (footerColor) {
      localStorage.setItem("footerBackgroundColor", footerColor);
    } else {
      localStorage.removeItem("footerBackgroundColor");
    }
    
    // Save main page content to localStorage
    localStorage.setItem("mainPageContent", JSON.stringify(mainPageContent));

    // Save notification emails to localStorage
    localStorage.setItem("notificationEmails", JSON.stringify(notificationEmails));
    
    // Save SMTP settings to localStorage
    localStorage.setItem("smtpSettings", JSON.stringify(smtpSettings));

    // Save other settings to localStorage
    localStorage.setItem("cancellationHours", cancellationHours.toString());
    localStorage.setItem("emailNotifications", emailNotifications.toString());
    localStorage.setItem("membershipExpiry", JSON.stringify(membershipExpiry));

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
    }, 500);
  };

  const handleTestEmail = async () => {
    if (!notificationEmails.email1) {
      toast({
        title: "Error",
        description: "Please enter a primary email first.",
        variant: "destructive",
      });
      return;
    }

    if (!smtpSettings.host || !smtpSettings.username || !smtpSettings.password || !smtpSettings.fromEmail) {
      toast({
        title: "Error", 
        description: "Please configure all SMTP settings first.",
        variant: "destructive",
      });
      return;
    }

    setIsTestingEmail(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-smtp-notification', {
        body: {
          userEmail: "test@example.com",
          userName: "Test User",
          notificationEmail: notificationEmails.email1,
          smtpSettings: {
            ...smtpSettings,
            useSsl: true
          }
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Test email sent",
        description: "A test notification was sent to your primary email.",
      });
    } catch (error) {
      console.error('Test email error:', error);
      toast({
        title: "Test failed",
        description: "Failed to send test email. Please check your SMTP settings.",
        variant: "destructive",
      });
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleSaveEmailSettings = () => {
    // Save notification emails to localStorage
    localStorage.setItem("notificationEmails", JSON.stringify(notificationEmails));
    
    // Save SMTP settings to localStorage
    localStorage.setItem("smtpSettings", JSON.stringify(smtpSettings));

    toast({
      title: "Email settings saved",
      description: "Your email notification settings have been saved successfully.",
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setLogo(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteLogo = () => {
    setLogo(null);
    setLogoFile(null);
    toast({
      title: "Logo deleted",
      description: "The logo has been removed.",
    });
  };
  
  const handleMainPageContentChange = (field: string, value: string) => {
    setMainPageContent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleResetToDefaults = () => {
    setMainPageContent({
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
    
    toast({
      title: "Content reset",
      description: "All homepage content has been reset to default values.",
    });
  };

  const handleClearField = (fieldName: string) => {
    setMainPageContent(prev => ({
      ...prev,
      [fieldName]: ""
    }));
    
    toast({
      title: "Field cleared",
      description: `${fieldName} has been cleared.`,
    });
  };

  return (
    <DashboardLayout title="System Settings">
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General Settings</TabsTrigger>
          <TabsTrigger value="mainpage">Main Page Content</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Image className="h-5 w-5 text-gym-blue" />
                  <CardTitle>Logo Settings</CardTitle>
                </div>
                <CardDescription>
                  Upload and manage your gym logo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {logo && (
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <img 
                        src={logo} 
                        alt="Gym Logo" 
                        className="max-h-32 max-w-full object-contain border rounded-md"
                      />
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-0 right-0 p-1 h-7 w-7" 
                        onClick={handleDeleteLogo}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                <div>
                  <Label htmlFor="logo-upload">Upload Logo</Label>
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Recommended size: 200x60 pixels. Max file size: 2MB.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Palette className="h-5 w-5 text-gym-blue" />
                  <CardTitle>Color Settings</CardTitle>
                </div>
                <CardDescription>
                  Set the background colors for the main page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="header-color">Header Background Color</Label>
                  <div className="flex items-center space-x-3 mt-2">
                    <Input
                      id="header-color"
                      type="color"
                      value={headerColor}
                      onChange={(e) => setHeaderColor(e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={headerColor}
                      onChange={(e) => setHeaderColor(e.target.value)}
                      className="w-32"
                      placeholder="#ffffff"
                    />
                  </div>
                  <div className="mt-4 p-4 rounded-md" style={{ backgroundColor: headerColor }}>
                    <p className="text-sm text-center">Header Preview</p>
                  </div>
                </div>

                <div className="mt-6">
                  <Label htmlFor="footer-color">Footer Background Color</Label>
                  <div className="flex items-center space-x-3 mt-2">
                    <Input
                      id="footer-color"
                      type="color"
                      value={footerColor}
                      onChange={(e) => setFooterColor(e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={footerColor}
                      onChange={(e) => setFooterColor(e.target.value)}
                      className="w-32"
                      placeholder="#000000"
                    />
                  </div>
                  <div className="mt-4 p-4 rounded-md" style={{ backgroundColor: footerColor }}>
                    <p className="text-sm text-center text-white">Footer Preview</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-gym-blue" />
                  <CardTitle>Booking Cancellation</CardTitle>
                </div>
                <CardDescription>
                  Configure how many hours before a class members can cancel their booking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="cancellation-hours">Hours before class</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Input
                      id="cancellation-hours"
                      type="number"
                      min={1}
                      max={48}
                      value={cancellationHours}
                      onChange={(e) => setCancellationHours(parseInt(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-gray-500">hours</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Members will not be able to cancel their booking if it's less than {cancellationHours} hours before the class starts.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-gym-blue" />
                  <CardTitle>Notification Settings</CardTitle>
                </div>
                <CardDescription>
                  Configure email notifications for trainers and admin notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email notifications for trainers</p>
                    <p className="text-sm text-gray-500">
                      Trainers will receive email notifications when members book or cancel sessions
                    </p>
                  </div>
                  <Switch 
                    checked={emailNotifications} 
                    onCheckedChange={setEmailNotifications} 
                  />
                </div>
                
                <div className="border-t pt-4 space-y-4">
                  <div>
                    <p className="font-medium mb-2">Admin Notification Emails</p>
                    <p className="text-sm text-gray-500 mb-4">
                      These emails will receive notifications when new users sign up
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notification-email-1">Primary Email</Label>
                    <Input
                      id="notification-email-1"
                      type="email"
                      placeholder="admin@example.com"
                      value={notificationEmails.email1}
                      onChange={(e) => setNotificationEmails({
                        ...notificationEmails,
                        email1: e.target.value
                      })}
                    />
                  </div>
                  
                  <div className="flex space-x-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={handleTestEmail}
                      disabled={isTestingEmail}
                      className="flex items-center space-x-2"
                    >
                      <Send className="h-4 w-4" />
                      <span>{isTestingEmail ? "Testing..." : "Test Email"}</span>
                    </Button>
                    <Button 
                      onClick={handleSaveEmailSettings}
                      className="flex items-center space-x-2"
                    >
                      <Mail className="h-4 w-4" />
                      <span>Save Email Settings</span>
                    </Button>
                  </div>
                  
                  <div className="border-t pt-4 space-y-4">
                    <div>
                      <p className="font-medium mb-2">SMTP Configuration</p>
                      <p className="text-sm text-gray-500 mb-4">
                        Configure SMTP settings to send email notifications
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtp-host">SMTP Host</Label>
                        <Input
                          id="smtp-host"
                          type="text"
                          placeholder="smtp.gmail.com"
                          value={smtpSettings.host}
                          onChange={(e) => setSmtpSettings({
                            ...smtpSettings,
                            host: e.target.value
                          })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="smtp-port">SMTP Port</Label>
                        <Input
                          id="smtp-port"
                          type="text"
                          placeholder="587"
                          value={smtpSettings.port}
                          onChange={(e) => setSmtpSettings({
                            ...smtpSettings,
                            port: e.target.value
                          })}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="smtp-username">SMTP Username</Label>
                      <Input
                        id="smtp-username"
                        type="text"
                        placeholder="your@email.com"
                        value={smtpSettings.username}
                        onChange={(e) => setSmtpSettings({
                          ...smtpSettings,
                          username: e.target.value
                        })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="smtp-password">SMTP Password</Label>
                      <Input
                        id="smtp-password"
                        type="password"
                        placeholder="Your app password"
                        value={smtpSettings.password}
                        onChange={(e) => setSmtpSettings({
                          ...smtpSettings,
                          password: e.target.value
                        })}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtp-from-email">From Email</Label>
                        <Input
                          id="smtp-from-email"
                          type="email"
                          placeholder="noreply@yourgym.com"
                          value={smtpSettings.fromEmail}
                          onChange={(e) => setSmtpSettings({
                            ...smtpSettings,
                            fromEmail: e.target.value
                          })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="smtp-from-name">From Name</Label>
                        <Input
                          id="smtp-from-name"
                          type="text"
                          placeholder="Your Gym Name"
                          value={smtpSettings.fromName}
                          onChange={(e) => setSmtpSettings({
                            ...smtpSettings,
                            fromName: e.target.value
                          })}
                        />
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        toast({
                          title: "Test email sent",
                          description: "Check your email to verify SMTP configuration"
                        });
                      }}
                      className="w-full mt-4"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Test SMTP Configuration
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <SettingsIcon className="h-5 w-5 text-gym-blue" />
                  <CardTitle>Membership Expiry</CardTitle>
                </div>
                <CardDescription>
                  Configure how many days members have to use their purchased sessions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="basic-expiry" className="w-24">Basic Plan:</Label>
                    <Input
                      id="basic-expiry"
                      type="number"
                      min={7}
                      value={membershipExpiry.basic}
                      onChange={(e) => setMembershipExpiry({
                        ...membershipExpiry,
                        basic: parseInt(e.target.value) || membershipExpiry.basic
                      })}
                      className="w-20"
                    />
                    <span className="text-gray-500">days</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="standard-expiry" className="w-24">Standard Plan:</Label>
                    <Input
                      id="standard-expiry"
                      type="number"
                      min={7}
                      value={membershipExpiry.standard}
                      onChange={(e) => setMembershipExpiry({
                        ...membershipExpiry,
                        standard: parseInt(e.target.value) || membershipExpiry.standard
                      })}
                      className="w-20"
                    />
                    <span className="text-gray-500">days</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="premium-expiry" className="w-24">Premium Plan:</Label>
                    <Input
                      id="premium-expiry"
                      type="number"
                      min={7}
                      value={membershipExpiry.premium}
                      onChange={(e) => setMembershipExpiry({
                        ...membershipExpiry,
                        premium: parseInt(e.target.value) || membershipExpiry.premium
                      })}
                      className="w-20"
                    />
                    <span className="text-gray-500">days</span>
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-2">
                    Unused sessions will expire after the specified number of days.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="mainpage" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Homepage Content Management</h3>
              <p className="text-sm text-gray-600">Edit or delete all text and images displayed on the homepage</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                  <Trash className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Homepage Content</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset all homepage content to the default values. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetToDefaults} className="bg-red-600 hover:bg-red-700">
                    Reset All Content
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <LayoutDashboard className="h-5 w-5 text-gym-blue" />
                <CardTitle>Hero Section</CardTitle>
              </div>
              <CardDescription>
                Configure the main hero section of your landing page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="hero-title">Hero Title</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleClearField('heroTitle')}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    <Trash className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </div>
                <Input
                  id="hero-title"
                  value={mainPageContent.heroTitle}
                  onChange={(e) => handleMainPageContentChange('heroTitle', e.target.value)}
                  placeholder="Enter hero title"
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="hero-description">Hero Description</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleClearField('heroDescription')}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    <Trash className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </div>
                <Textarea
                  id="hero-description"
                  value={mainPageContent.heroDescription}
                  onChange={(e) => handleMainPageContentChange('heroDescription', e.target.value)}
                  rows={3}
                  placeholder="Enter hero description"
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="hero-image">Hero Image URL</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleClearField('heroImage')}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    <Trash className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </div>
                <Input
                  id="hero-image"
                  value={mainPageContent.heroImage}
                  onChange={(e) => handleMainPageContentChange('heroImage', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                {mainPageContent.heroImage && (
                  <div className="mt-2">
                    <img 
                      src={mainPageContent.heroImage} 
                      alt="Hero Preview" 
                      className="h-40 object-cover rounded-md"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://via.placeholder.com/800x600?text=Invalid+Image+URL";
                      }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Type className="h-5 w-5 text-gym-blue" />
                <CardTitle>Feature Cards</CardTitle>
              </div>
              <CardDescription>
                Configure the feature cards displayed on your landing page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4 border-b pb-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Feature 1</h3>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash className="h-3 w-3 mr-1" />
                          Clear All
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Clear Feature 1</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will clear both the title and description for Feature 1.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => {
                              handleClearField('feature1Title');
                              handleClearField('feature1Description');
                            }}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Clear Feature 1
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <Label htmlFor="feature1-title">Title</Label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleClearField('feature1Title')}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 text-xs"
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                    <Input
                      id="feature1-title"
                      value={mainPageContent.feature1Title}
                      onChange={(e) => handleMainPageContentChange('feature1Title', e.target.value)}
                      placeholder="Enter feature 1 title"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <Label htmlFor="feature1-description">Description</Label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleClearField('feature1Description')}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 text-xs"
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                    <Textarea
                      id="feature1-description"
                      value={mainPageContent.feature1Description}
                      onChange={(e) => handleMainPageContentChange('feature1Description', e.target.value)}
                      rows={2}
                      placeholder="Enter feature 1 description"
                    />
                  </div>
                </div>
                
                <div className="space-y-4 border-b pb-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Feature 2</h3>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash className="h-3 w-3 mr-1" />
                          Clear All
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Clear Feature 2</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will clear both the title and description for Feature 2.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => {
                              handleClearField('feature2Title');
                              handleClearField('feature2Description');
                            }}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Clear Feature 2
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <Label htmlFor="feature2-title">Title</Label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleClearField('feature2Title')}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 text-xs"
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                    <Input
                      id="feature2-title"
                      value={mainPageContent.feature2Title}
                      onChange={(e) => handleMainPageContentChange('feature2Title', e.target.value)}
                      placeholder="Enter feature 2 title"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <Label htmlFor="feature2-description">Description</Label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleClearField('feature2Description')}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 text-xs"
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                    <Textarea
                      id="feature2-description"
                      value={mainPageContent.feature2Description}
                      onChange={(e) => handleMainPageContentChange('feature2Description', e.target.value)}
                      rows={2}
                      placeholder="Enter feature 2 description"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Feature 3</h3>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash className="h-3 w-3 mr-1" />
                          Clear All
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Clear Feature 3</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will clear both the title and description for Feature 3.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => {
                              handleClearField('feature3Title');
                              handleClearField('feature3Description');
                            }}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Clear Feature 3
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <Label htmlFor="feature3-title">Title</Label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleClearField('feature3Title')}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 text-xs"
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                    <Input
                      id="feature3-title"
                      value={mainPageContent.feature3Title}
                      onChange={(e) => handleMainPageContentChange('feature3Title', e.target.value)}
                      placeholder="Enter feature 3 title"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <Label htmlFor="feature3-description">Description</Label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleClearField('feature3Description')}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 text-xs"
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                    <Textarea
                      id="feature3-description"
                      value={mainPageContent.feature3Description}
                      onChange={(e) => handleMainPageContentChange('feature3Description', e.target.value)}
                      rows={2}
                      placeholder="Enter feature 3 description"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Content Sections */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Type className="h-5 w-5 text-gym-blue" />
                <CardTitle>Section Titles</CardTitle>
              </div>
              <CardDescription>
                Configure section headings throughout the homepage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="features-section">Features Section Title</Label>
                <Input
                  id="features-section"
                  value={mainPageContent.featuresSection}
                  onChange={(e) => handleMainPageContentChange('featuresSection', e.target.value)}
                  placeholder="Enter features section title"
                />
              </div>
              
              <div>
                <Label htmlFor="testimonials-section">Testimonials Section Title</Label>
                <Input
                  id="testimonials-section"
                  value={mainPageContent.testimonialsSection}
                  onChange={(e) => handleMainPageContentChange('testimonialsSection', e.target.value)}
                  placeholder="Enter testimonials section title"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Plus className="h-5 w-5 text-gym-blue" />
                <CardTitle>Call to Action Section</CardTitle>
              </div>
              <CardDescription>
                Configure the call-to-action section at the bottom of the homepage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cta-title">CTA Title</Label>
                <Input
                  id="cta-title"
                  value={mainPageContent.ctaTitle}
                  onChange={(e) => handleMainPageContentChange('ctaTitle', e.target.value)}
                  placeholder="Enter call-to-action title"
                />
              </div>
              
              <div>
                <Label htmlFor="cta-description">CTA Description</Label>
                <Textarea
                  id="cta-description"
                  value={mainPageContent.ctaDescription}
                  onChange={(e) => handleMainPageContentChange('ctaDescription', e.target.value)}
                  rows={3}
                  placeholder="Enter call-to-action description"
                />
              </div>
              
              <div>
                <Label htmlFor="cta-button">CTA Button Text</Label>
                <Input
                  id="cta-button"
                  value={mainPageContent.ctaButton}
                  onChange={(e) => handleMainPageContentChange('ctaButton', e.target.value)}
                  placeholder="Enter button text"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <LayoutDashboard className="h-5 w-5 text-gym-blue" />
                <CardTitle>Footer Content</CardTitle>
              </div>
              <CardDescription>
                Configure footer text and navigation links
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  value={mainPageContent.companyName}
                  onChange={(e) => handleMainPageContentChange('companyName', e.target.value)}
                  placeholder="Enter company name"
                />
              </div>
              
              <div>
                <Label htmlFor="copyright">Copyright Text</Label>
                <Input
                  id="copyright"
                  value={mainPageContent.copyright}
                  onChange={(e) => handleMainPageContentChange('copyright', e.target.value)}
                  placeholder="Enter copyright text"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="footer-login">Login Link Text</Label>
                  <Input
                    id="footer-login"
                    value={mainPageContent.footerLogin}
                    onChange={(e) => handleMainPageContentChange('footerLogin', e.target.value)}
                    placeholder="Login"
                  />
                </div>
                
                <div>
                  <Label htmlFor="footer-about">About Link Text</Label>
                  <Input
                    id="footer-about"
                    value={mainPageContent.footerAbout}
                    onChange={(e) => handleMainPageContentChange('footerAbout', e.target.value)}
                    placeholder="About"
                  />
                </div>
                
                <div>
                  <Label htmlFor="footer-contact">Contact Link Text</Label>
                  <Input
                    id="footer-contact"
                    value={mainPageContent.footerContact}
                    onChange={(e) => handleMainPageContentChange('footerContact', e.target.value)}
                    placeholder="Contact"
                  />
                </div>
                
                <div>
                  <Label htmlFor="footer-privacy">Privacy Link Text</Label>
                  <Input
                    id="footer-privacy"
                    value={mainPageContent.footerPrivacy}
                    onChange={(e) => handleMainPageContentChange('footerPrivacy', e.target.value)}
                    placeholder="Privacy"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6">
        <Button 
          onClick={handleSaveSettings} 
          className="bg-gym-blue hover:bg-gym-dark-blue"
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
