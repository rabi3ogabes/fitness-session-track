import { useState, useEffect } from "react";
import { NotificationTester } from "@/components/NotificationTester";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, MessageCircle, Clock, Image, Trash, Palette, LayoutDashboard, Type, Plus, Send, Mail, Key, User, Shield, Bell, FileText, Zap, Code, Globe } from "lucide-react";
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
  const [emailSettings, setEmailSettings] = useState({
    notification_email: "",
    from_email: "",
    from_name: "",
    email_provider: "smtp",
    smtp_host: "",
    smtp_port: 587,
    smtp_username: "",
    smtp_password: "",
    smtp_use_tls: true,
    signup_notifications: true,
    booking_notifications: true,
    session_request_notifications: true
  });
  const [whatsappSettings, setWhatsappSettings] = useState({
    enabled: false,
    instance_id: "",
    api_token: "",
    phone_numbers: "",
    signup_notifications: true,
    booking_notifications: true,
    session_request_notifications: true,
    templates: {
      signup: "🎉 New member signup!\n\nName: {userName}\nEmail: {userEmail}\nMembership: {membershipType}\nJoined: {joinDate}\n\nWelcome to our gym family! 💪",
      booking: "📅 New class booking!\n\nMember: {userName}\nClass: {className}\nDate: {classDate}\nTime: {classTime}\nTrainer: {trainerName}\n\nSee you at the gym! 🏋️‍♂️",
      session_request: "🔔 Session balance request!\n\nMember: {userName}\nCurrent Balance: {currentSessions}\nRequested: {requestedSessions}\nReason: {reason}\n\nPlease review and approve.",
      cancel: "❌ Class booking cancelled!\n\nMember: {memberName}\nClass: {className}\nDate: {classDate}\nTime: {classTime}\nTrainer: {trainerName}\n\nBooking has been cancelled."
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingWhatsapp, setIsTestingWhatsapp] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [operationLog, setOperationLog] = useState<string>('');
  const [operationStatus, setOperationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [testEmail, setTestEmail] = useState<string>('');
  const [emailLogs, setEmailLogs] = useState<Array<{
    timestamp: string;
    to: string;
    subject: string;
    status: 'success' | 'failed';
    error?: string;
  }>>([]);
  const [logo, setLogo] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [headerColor, setHeaderColor] = useState<string>("#ffffff");
  const [footerColor, setFooterColor] = useState<string>("#000000");
  const [membershipExpiry, setMembershipExpiry] = useState({
    basic: 30,   // days
    standard: 60, // days
    premium: 90  // days
  });
  const [showTestimonials, setShowTestimonials] = useState(true);
  const [showLowSessionWarning, setShowLowSessionWarning] = useState(true);
  const [showMemberDeleteIcon, setShowMemberDeleteIcon] = useState(true);
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
    ctaDescription: "Join us today and take control of your fitness goals with our comprehensive gym management system.",
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
    
    // Load email settings from database and fallback to local storage
    loadEmailSettings();
    
    // Load WhatsApp settings from local storage
    loadWhatsappSettings();
    
    
    
    // Load email logs on component mount
    loadEmailLogs();
    
    // Load main page content from local storage
    const savedMainPageContent = localStorage.getItem("mainPageContent");
    if (savedMainPageContent) {
      setMainPageContent(JSON.parse(savedMainPageContent));
    }
    
    // Load testimonials visibility setting
    const savedShowTestimonials = localStorage.getItem("showTestimonials");
    if (savedShowTestimonials !== null) {
      setShowTestimonials(JSON.parse(savedShowTestimonials));
    }
    
    // Load low session warning setting
    const savedShowLowSessionWarning = localStorage.getItem("showLowSessionWarning");
    if (savedShowLowSessionWarning !== null) {
      setShowLowSessionWarning(JSON.parse(savedShowLowSessionWarning));
    }
    
    // Load member delete icon visibility setting
    const savedShowMemberDeleteIcon = localStorage.getItem("showMemberDeleteIcon");
    if (savedShowMemberDeleteIcon !== null) {
      setShowMemberDeleteIcon(JSON.parse(savedShowMemberDeleteIcon));
    }
  }, []);

  const handleSaveSettings = async () => {
    // Clear previous logs
    setOperationLog('');
    setOperationStatus('idle');
    
    setIsLoading(true);
    setOperationLog('Saving email settings to database...\nUpdating configuration...');

    try {
      // Save email settings to Supabase database
      const { data, error } = await supabase
        .from('admin_notification_settings')
        .upsert({
          from_email: emailSettings.from_email,
          from_name: emailSettings.from_name,
          notification_email: emailSettings.notification_email,
          email_provider: emailSettings.email_provider,
          smtp_host: emailSettings.smtp_host,
          smtp_port: emailSettings.smtp_port,
          smtp_username: emailSettings.smtp_username,
          smtp_password: emailSettings.smtp_password,
          smtp_use_tls: emailSettings.smtp_use_tls,
          signup_notifications: emailSettings.signup_notifications,
          booking_notifications: emailSettings.booking_notifications,
          session_request_notifications: emailSettings.session_request_notifications
        }, {
          onConflict: 'id'
        });

      if (error) {
        throw error;
      }

      setOperationLog('Email settings saved to database...\nUpdating local storage...');

      // Also save to localStorage for backwards compatibility
      localStorage.setItem("emailSettings", JSON.stringify(emailSettings));

      // Save other settings to localStorage
      if (logo) {
        localStorage.setItem("gymLogo", logo);
      } else {
        localStorage.removeItem("gymLogo");
      }
      
      if (headerColor) {
        localStorage.setItem("headerBackgroundColor", headerColor);
      } else {
        localStorage.removeItem("headerBackgroundColor");
      }
      
      if (footerColor) {
        localStorage.setItem("footerBackgroundColor", footerColor);
      } else {
        localStorage.removeItem("footerBackgroundColor");
      }
      
      localStorage.setItem("mainPageContent", JSON.stringify(mainPageContent));
      localStorage.setItem("whatsappSettings", JSON.stringify(whatsappSettings));
      
      
      
      const systemSettings = {
        cancellationTimeLimit: cancellationHours,
        whatsappSettings: whatsappSettings
      };
      localStorage.setItem("systemSettings", JSON.stringify(systemSettings));
      localStorage.setItem("cancellationHours", cancellationHours.toString());
      localStorage.setItem("membershipExpiry", JSON.stringify(membershipExpiry));
      localStorage.setItem("showTestimonials", JSON.stringify(showTestimonials));
      localStorage.setItem("showLowSessionWarning", JSON.stringify(showLowSessionWarning));
      localStorage.setItem("showMemberDeleteIcon", JSON.stringify(showMemberDeleteIcon));

      setIsLoading(false);
      const successMsg = `✅ Email settings saved successfully!\n\nTimestamp: ${new Date().toLocaleString()}\n\nSettings have been saved to the database and will persist across sessions.`;
      setOperationLog(successMsg);
      setOperationStatus('success');
      
      toast({
        title: "Email settings saved",
        description: "Your email configuration has been saved successfully.",
      });

    } catch (error) {
      console.error('Save settings error:', error);
      setIsLoading(false);
      const errorMsg = `❌ Failed to save email settings!\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nTimestamp: ${new Date().toLocaleString()}\n\nPlease check your configuration and try again.`;
      setOperationLog(errorMsg);
      setOperationStatus('error');
      
      toast({
        title: "Save failed",
        description: `Failed to save email settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };



  const loadEmailLogs = async () => {
    try {
      const { data: response, error } = await supabase.functions.invoke('send-email-notification', {
        method: 'GET'
      });
      
      if (error) {
        console.error('Failed to load email logs:', error);
        return;
      }
      
      setEmailLogs(response?.logs || []);
    } catch (error) {
      console.error('Failed to load email logs:', error);
    }
  };

  const handleTestEmail = async () => {
    // Clear previous logs
    setOperationLog('');
    setOperationStatus('idle');
    
    // Validate required fields
    if (!testEmail) {
      const errorMsg = "Please enter a test email address.";
      setOperationLog(errorMsg);
      setOperationStatus('error');
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    setIsTestingEmail(true);
    setOperationLog('Sending test email...\nPlease wait...');
    setOperationStatus('idle');
    
    try {
      console.log("About to invoke edge function...");
      console.log("Email settings:", emailSettings);
      
      // Choose the appropriate function based on email provider
      const functionName = emailSettings.email_provider === 'smtp' ? 'send-smtp-notification' : 'send-email-notification';
      console.log("Using function:", functionName);
      
      setOperationLog(`Using ${functionName} function...\nPreparing request...`);
      
      const requestBody = emailSettings.email_provider === 'smtp' ? {
        userEmail: "test@example.com",
        userName: "Test User",
        notificationEmail: testEmail,
        smtpSettings: {
          smtpHost: emailSettings.smtp_host,
          smtpPort: emailSettings.smtp_port,
          smtpUsername: emailSettings.smtp_username,
          smtpPassword: emailSettings.smtp_password,
          fromEmail: emailSettings.from_email || emailSettings.notification_email,
          fromName: emailSettings.from_name || "Gym System",
          useSsl: emailSettings.smtp_use_tls
        }
      } : {
        userEmail: "test@example.com",
        userName: "Test User",
        notificationEmail: testEmail,
        fromEmail: emailSettings.from_email,
        fromName: emailSettings.from_name
      };
      
      setOperationLog(`Sending request to ${functionName}...\nRecipient: ${testEmail}`);
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: requestBody
      });

      console.log("Edge function response:", { data, error });

      if (error) {
        console.error("Edge function error details:", error);
        const errorMsg = `Function Error: ${error.message || 'Unknown error'}\n\nDetails: ${JSON.stringify(error, null, 2)}`;
        setOperationLog(errorMsg);
        setOperationStatus('error');
        throw error;
      }

      const successMsg = `✅ Test email sent successfully!\n\nRecipient: ${testEmail}\nFunction: ${functionName}\nResponse: ${data?.message || 'Email sent via ' + emailSettings.email_provider}`;
      setOperationLog(successMsg);
      setOperationStatus('success');

      toast({
        title: "Test email sent",
        description: data?.message || "A test notification was sent successfully!",
      });

      // Reload logs after successful test
      await loadEmailLogs();
    } catch (error) {
      console.error('Test email error:', error);
      const errorMsg = `❌ Test email failed!\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nTimestamp: ${new Date().toLocaleString()}\n\nCheck your email configuration and try again.`;
      setOperationLog(errorMsg);
      setOperationStatus('error');
      
      toast({
        title: "Test failed",
        description: `Failed to send test email: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsTestingEmail(false);
    }
  };

  const loadEmailSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_notification_settings')
        .select('*')
        .maybeSingle();

      if (data && !error) {
        setEmailSettings({
          from_email: data.from_email || "",
          from_name: data.from_name || "",
          notification_email: data.notification_email || "",
          email_provider: data.email_provider || "smtp",
          smtp_host: data.smtp_host || "",
          smtp_port: data.smtp_port || 587,
          smtp_username: data.smtp_username || "",
          smtp_password: data.smtp_password || "",
          smtp_use_tls: data.smtp_use_tls ?? true,
          signup_notifications: data.signup_notifications ?? true,
          booking_notifications: data.booking_notifications ?? true,
          session_request_notifications: data.session_request_notifications ?? true
        });
      } else {
        // Fallback to local storage if no database settings
        const savedEmailSettings = localStorage.getItem("emailSettings");
        if (savedEmailSettings) {
          const parsed = JSON.parse(savedEmailSettings);
          setEmailSettings({
            from_email: parsed.from_email || parsed.fromEmail || "",
            from_name: parsed.from_name || parsed.fromName || "",
            notification_email: parsed.notification_email || parsed.notificationEmail || "",
            email_provider: parsed.email_provider || "smtp",
            smtp_host: parsed.smtp_host || "",
            smtp_port: parsed.smtp_port || 587,
            smtp_username: parsed.smtp_username || "",
            smtp_password: parsed.smtp_password || "",
            smtp_use_tls: parsed.smtp_use_tls ?? true,
            signup_notifications: parsed.signup_notifications ?? parsed.notifySignup ?? true,
            booking_notifications: parsed.booking_notifications ?? parsed.notifyBooking ?? true,
            session_request_notifications: parsed.session_request_notifications ?? parsed.notifySessionRequest ?? true
          });
        }
      }
    } catch (error) {
      console.error('Failed to load email settings:', error);
      // Fallback to local storage
      const savedEmailSettings = localStorage.getItem("emailSettings");
      if (savedEmailSettings) {
        const parsed = JSON.parse(savedEmailSettings);
        setEmailSettings({
          from_email: parsed.from_email || parsed.fromEmail || "",
          from_name: parsed.from_name || parsed.fromName || "",
          notification_email: parsed.notification_email || parsed.notificationEmail || "",
          email_provider: parsed.email_provider || "smtp",
          smtp_host: parsed.smtp_host || "",
          smtp_port: parsed.smtp_port || 587,
          smtp_username: parsed.smtp_username || "",
          smtp_password: parsed.smtp_password || "",
          smtp_use_tls: parsed.smtp_use_tls ?? true,
          signup_notifications: parsed.signup_notifications ?? parsed.notifySignup ?? true,
          booking_notifications: parsed.booking_notifications ?? parsed.notifyBooking ?? true,
          session_request_notifications: parsed.session_request_notifications ?? parsed.notifySessionRequest ?? true
        });
      }
    }
  };

  const loadWhatsappSettings = () => {
    const savedWhatsappSettings = localStorage.getItem("whatsappSettings");
    if (savedWhatsappSettings) {
      const parsed = JSON.parse(savedWhatsappSettings);
      setWhatsappSettings({
        enabled: parsed.enabled ?? false,
        instance_id: parsed.instance_id || "",
        api_token: parsed.api_token || "",
        phone_numbers: parsed.phone_numbers || "",
        signup_notifications: parsed.signup_notifications ?? true,
        booking_notifications: parsed.booking_notifications ?? true,
        session_request_notifications: parsed.session_request_notifications ?? true,
        templates: parsed.templates || {
          signup: "🎉 New member signup!\n\nName: {userName}\nEmail: {userEmail}\nMembership: {membershipType}\nJoined: {joinDate}\n\nWelcome to our gym family! 💪",
          booking: "📅 New class booking!\n\nMember: {userName}\nClass: {className}\nDate: {classDate}\nTime: {classTime}\nTrainer: {trainerName}\n\nSee you at the gym! 🏋️‍♂️",
          session_request: "🔔 Session balance request!\n\nMember: {userName}\nCurrent Balance: {currentSessions}\nRequested: {requestedSessions}\nReason: {reason}\n\nPlease review and approve.",
          cancel: "❌ Class booking cancelled!\n\nMember: {memberName}\nClass: {className}\nDate: {classDate}\nTime: {classTime}\nTrainer: {trainerName}\n\nBooking has been cancelled."
        }
      });
    }
  };

  const handleSaveEmailSettings = async () => {
    try {
      // First try to update existing settings
      const { data: existingData } = await supabase
        .from('admin_notification_settings')
        .select('id')
        .single();

      const settingsData = {
        notification_email: emailSettings.notification_email,
        from_email: emailSettings.from_email,
        from_name: emailSettings.from_name || 'Gym System',
        email_provider: emailSettings.email_provider,
        signup_notifications: emailSettings.signup_notifications,
        booking_notifications: emailSettings.booking_notifications,
        session_request_notifications: emailSettings.session_request_notifications
      };

      let result;
      if (existingData) {
        // Update existing record
        result = await supabase
          .from('admin_notification_settings')
          .update(settingsData)
          .eq('id', existingData.id);
      } else {
        // Insert new record
        result = await supabase
          .from('admin_notification_settings')
          .insert(settingsData);
      }

      if (result.error) {
        throw result.error;
      }

      // Also save to local storage as backup
      localStorage.setItem("emailSettings", JSON.stringify(emailSettings));

      toast({
        title: "Email settings saved",
        description: "Your email configuration has been saved successfully.",
      });
    } catch (error) {
      console.error('Failed to save email settings:', error);
      
      // Fallback to local storage only
      localStorage.setItem("emailSettings", JSON.stringify(emailSettings));
      
      toast({
        title: "Settings saved locally",
        description: "Email settings saved to local storage. Database save failed.",
        variant: "destructive"
      });
    }
  };

  const handleSaveWhatsappSettings = () => {
    localStorage.setItem("whatsappSettings", JSON.stringify(whatsappSettings));
    toast({
      title: "WhatsApp settings saved",
      description: "Your WhatsApp configuration has been saved successfully.",
    });
  };

  const handleTestWhatsapp = async () => {
    if (!whatsappSettings.enabled) {
      toast({
        title: "Error",
        description: "Please enable WhatsApp notifications first.",
        variant: "destructive",
      });
      return;
    }

    if (!whatsappSettings.instance_id || !whatsappSettings.api_token || !whatsappSettings.phone_numbers) {
      toast({
        title: "Error",
        description: "Please fill in all WhatsApp configuration fields.",
        variant: "destructive",
      });
      return;
    }

    setIsTestingWhatsapp(true);

    try {
      console.log('Testing WhatsApp with settings:', {
        instanceId: whatsappSettings.instance_id,
        hasToken: !!whatsappSettings.api_token,
        phoneNumbers: whatsappSettings.phone_numbers
      });

      const phoneNumbers = whatsappSettings.phone_numbers.split(',').map(num => num.trim());
      
      console.log('Calling supabase function with data:', {
        userName: "Test User",
        userEmail: "test@example.com",
        phoneNumbers: phoneNumbers,
        apiToken: whatsappSettings.api_token,
        instanceId: whatsappSettings.instance_id
      });

      const { data, error } = await supabase.functions.invoke('send-whatsapp-notification', {
        body: {
          userName: "Test User",
          userEmail: "test@example.com",
          phoneNumbers: phoneNumbers,
          apiToken: whatsappSettings.api_token,
          instanceId: whatsappSettings.instance_id
        }
      });

      console.log('Supabase function response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      toast({
        title: "Test WhatsApp sent",
        description: data?.message || "Test WhatsApp notification sent successfully!",
      });
    } catch (error) {
      console.error('Test WhatsApp error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Check for specific error types
      if (errorMessage.includes('NetworkError') || errorMessage.includes('Failed to send a request')) {
        errorMessage = 'Network connection issue. Please check your internet connection and try again.';
      } else if (errorMessage.includes('CORS')) {
        errorMessage = 'CORS error. The WhatsApp service may be temporarily unavailable.';
      }
      
      toast({
        title: "Test failed",
        description: `Failed to send test WhatsApp: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsTestingWhatsapp(false);
    }
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
      heroTitle: "Streamlined Gym Management System",
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
      ctaDescription: "Join us today and take control of your fitness goals with our comprehensive gym management system.",
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="mainpage">Main Page</TabsTrigger>
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
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  <CardTitle>WhatsApp Notification System</CardTitle>
                </div>
                <CardDescription>
                  Configure WhatsApp notifications using Green API - 3000 free messages per month
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-6">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Send className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-900">Powered by Green API</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Free tier includes 3000 messages per month. Sign up at green-api.com to get your credentials.
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="whatsapp-enabled">Enable WhatsApp Notifications</Label>
                      <p className="text-sm text-muted-foreground">Turn on WhatsApp notifications for your gym</p>
                    </div>
                    <Switch
                      id="whatsapp-enabled"
                      checked={whatsappSettings.enabled}
                      onCheckedChange={(checked) => setWhatsappSettings(prev => ({ ...prev, enabled: checked }))}
                    />
                  </div>

                  {whatsappSettings.enabled && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="instance-id">Instance ID *</Label>
                          <Input
                            id="instance-id"
                            type="text"
                            placeholder="1101234567"
                            value={whatsappSettings.instance_id}
                            onChange={(e) => setWhatsappSettings(prev => ({ ...prev, instance_id: e.target.value }))}
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            Your Green API instance ID
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="api-token">API Token *</Label>
                          <Input
                            id="api-token"
                            type="password"
                            placeholder="Your Green API token"
                            value={whatsappSettings.api_token}
                            onChange={(e) => setWhatsappSettings(prev => ({ ...prev, api_token: e.target.value }))}
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            Your Green API access token
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="phone-numbers">Notification Phone Numbers *</Label>
                        <Input
                          id="phone-numbers"
                          type="text"
                          placeholder="1234567890, 0987654321"
                          value={whatsappSettings.phone_numbers}
                          onChange={(e) => setWhatsappSettings(prev => ({ ...prev, phone_numbers: e.target.value }))}
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Phone numbers to receive notifications (comma-separated, without + or country code)
                        </p>
                      </div>

                      <div>
                        <Label className="text-base font-medium">WhatsApp Notification Types</Label>
                        <div className="space-y-4 mt-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="whatsapp-notify-signup">New Member Signup</Label>
                              <p className="text-sm text-muted-foreground">Get WhatsApp notifications when new members register</p>
                            </div>
                            <Switch
                              id="whatsapp-notify-signup"
                              checked={whatsappSettings.signup_notifications}
                              onCheckedChange={(checked) => setWhatsappSettings(prev => ({ ...prev, signup_notifications: checked }))}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="whatsapp-notify-booking">Class Bookings</Label>
                              <p className="text-sm text-muted-foreground">Get WhatsApp notifications when members book classes</p>
                            </div>
                            <Switch
                              id="whatsapp-notify-booking"
                              checked={whatsappSettings.booking_notifications}
                              onCheckedChange={(checked) => setWhatsappSettings(prev => ({ ...prev, booking_notifications: checked }))}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="whatsapp-notify-session-request">Session Balance Requests</Label>
                              <p className="text-sm text-muted-foreground">Get WhatsApp notifications when members request additional sessions</p>
                            </div>
                            <Switch
                              id="whatsapp-notify-session-request"
                              checked={whatsappSettings.session_request_notifications}
                              onCheckedChange={(checked) => setWhatsappSettings(prev => ({ ...prev, session_request_notifications: checked }))}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-base font-medium">Message Templates</Label>
                        <p className="text-sm text-muted-foreground mb-4">
                          Customize the WhatsApp message templates. Available variables: {"{userName}"}, {"{userEmail}"}, {"{membershipType}"}, {"{joinDate}"}, {"{className}"}, {"{classDate}"}, {"{classTime}"}, {"{trainerName}"}, {"{currentSessions}"}, {"{requestedSessions}"}, {"{reason}"}
                        </p>
                        
                        <div className="space-y-6">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label htmlFor="signup-template">New Member Signup Template</Label>
                              <span className="text-xs text-muted-foreground">
                                {whatsappSettings.signup_notifications ? "Enabled" : "Disabled"}
                              </span>
                            </div>
                            <Textarea
                              id="signup-template"
                              value={whatsappSettings.templates.signup}
                              onChange={(e) => setWhatsappSettings(prev => ({
                                ...prev,
                                templates: { ...prev.templates, signup: e.target.value }
                              }))}
                              placeholder="Enter your signup notification template..."
                              className="min-h-[100px] resize-none"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Variables: {"{userName}"}, {"{userEmail}"}, {"{membershipType}"}, {"{joinDate}"}
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label htmlFor="booking-template">Class Booking Template</Label>
                              <span className="text-xs text-muted-foreground">
                                {whatsappSettings.booking_notifications ? "Enabled" : "Disabled"}
                              </span>
                            </div>
                            <Textarea
                              id="booking-template"
                              value={whatsappSettings.templates.booking}
                              onChange={(e) => setWhatsappSettings(prev => ({
                                ...prev,
                                templates: { ...prev.templates, booking: e.target.value }
                              }))}
                              placeholder="Enter your booking notification template..."
                              className="min-h-[100px] resize-none"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Variables: {"{userName}"}, {"{className}"}, {"{classDate}"}, {"{classTime}"}, {"{trainerName}"}
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label htmlFor="session-request-template">Session Request Template</Label>
                              <span className="text-xs text-muted-foreground">
                                {whatsappSettings.session_request_notifications ? "Enabled" : "Disabled"}
                              </span>
                            </div>
                            <Textarea
                              id="session-request-template"
                              value={whatsappSettings.templates.session_request}
                              onChange={(e) => setWhatsappSettings(prev => ({
                                ...prev,
                                templates: { ...prev.templates, session_request: e.target.value }
                              }))}
                              placeholder="Enter your session request notification template..."
                              className="min-h-[100px] resize-none"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Variables: {"{userName}"}, {"{currentSessions}"}, {"{requestedSessions}"}, {"{reason}"}
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label htmlFor="cancel-template">Cancellation Template</Label>
                              <span className="text-xs text-muted-foreground">
                                Always Enabled
                              </span>
                            </div>
                            <Textarea
                              id="cancel-template"
                              value={whatsappSettings.templates.cancel || "❌ Class booking cancelled!\n\nMember: {memberName}\nClass: {className}\nDate: {classDate}\nTime: {classTime}\nTrainer: {trainerName}\n\nBooking has been cancelled."}
                              onChange={(e) => setWhatsappSettings(prev => ({
                                ...prev,
                                templates: { ...prev.templates, cancel: e.target.value }
                              }))}
                              placeholder="Enter your cancellation notification template..."
                              className="min-h-[100px] resize-none"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Variables: {"{memberName}"}, {"{className}"}, {"{classDate}"}, {"{classTime}"}, {"{trainerName}"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {whatsappSettings.enabled && (
                  <div className="flex gap-3 pt-4">
                    <Button onClick={handleSaveWhatsappSettings} className="flex-1">
                      Save WhatsApp Settings
                    </Button>
                    <Button 
                      onClick={handleTestWhatsapp} 
                      variant="outline" 
                      disabled={isTestingWhatsapp}
                      className="flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {isTestingWhatsapp ? "Testing..." : "Test WhatsApp"}
                    </Button>
                  </div>
                )}
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

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <LayoutDashboard className="h-5 w-5 text-gym-blue" />
                  <CardTitle>Page Sections</CardTitle>
                </div>
                <CardDescription>
                  Show or hide sections on the main page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-testimonials">Testimonials Section</Label>
                    <p className="text-sm text-muted-foreground">
                      Show "What Our Members Say" section on the main page
                    </p>
                  </div>
                  <Switch
                    id="show-testimonials"
                    checked={showTestimonials}
                    onCheckedChange={setShowTestimonials}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-low-session-warning">Low Session Count Warning</Label>
                    <p className="text-sm text-muted-foreground">
                      Show warning message to users when they have 2 or fewer sessions remaining
                    </p>
                  </div>
                  <Switch
                    id="show-low-session-warning"
                    checked={showLowSessionWarning}
                    onCheckedChange={setShowLowSessionWarning}
                  />
                 </div>
                 
                 <div className="flex items-center justify-between">
                   <div className="space-y-0.5">
                     <Label htmlFor="show-member-delete-icon">Member Delete Icon</Label>
                     <p className="text-sm text-muted-foreground">
                       Show delete icon for members in the member management page
                     </p>
                   </div>
                   <Switch
                     id="show-member-delete-icon"
                     checked={showMemberDeleteIcon}
                     onCheckedChange={setShowMemberDeleteIcon}
                   />
                 </div>
               </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="auth" className="space-y-6">
          {/* Google OAuth Setup */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <CardTitle>Admin Authentication Setup</CardTitle>
              </div>
              <CardDescription>
                Set up Google OAuth for secure admin login using your Gmail account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">Setup Instructions</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
                  <li>Go to Google Cloud Console and create/select a project</li>
                  <li>Configure OAuth consent screen with domain: <code className="bg-blue-100 px-1 rounded">wlawjupusugrhojbywyq.supabase.co</code></li>
                  <li>Create OAuth Client ID for web application</li>
                  <li>Add redirect URL: <code className="bg-blue-100 px-1 rounded">https://wlawjupusugrhojbywyq.supabase.co/auth/v1/callback</code></li>
                  <li>Configure in Supabase Dashboard → Authentication → Providers</li>
                </ol>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => window.open('https://console.cloud.google.com/', '_blank')}>
                  <Key className="h-4 w-4 mr-2" />
                  Google Cloud Console
                </Button>
                <Button variant="outline" onClick={() => window.open('https://supabase.com/dashboard/project/wlawjupusugrhojbywyq/auth/providers', '_blank')}>
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Supabase Auth Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Current Admin Account */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-green-600" />
                <CardTitle>Current Admin Account</CardTitle>
              </div>
              <CardDescription>
                Currently logged in admin account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-800">admin@gym.com</p>
                    <p className="text-sm text-green-600">Administrator Access</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          {/* Email Provider Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <CardTitle>Email Configuration</CardTitle>
              </div>
              <CardDescription>
                Configure your email service provider for sending notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email-provider">Email Provider</Label>
                  <select
                    id="email-provider"
                    value={emailSettings.email_provider || 'smtp'}
                    onChange={(e) => setEmailSettings({...emailSettings, email_provider: e.target.value})}
                    className="w-full mt-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="smtp">SMTP Server</option>
                    <option value="resend">Resend Service</option>
                  </select>
                </div>

                {emailSettings.email_provider === 'smtp' ? (
                  <>
                    {/* SMTP Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="smtp-host">SMTP Host</Label>
                        <Input
                          id="smtp-host"
                          type="text"
                          placeholder="smtp.gmail.com"
                          value={emailSettings.smtp_host || ''}
                          onChange={(e) => setEmailSettings({...emailSettings, smtp_host: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="smtp-port">SMTP Port</Label>
                        <Input
                          id="smtp-port"
                          type="number"
                          placeholder="587"
                          value={emailSettings.smtp_port || 587}
                          onChange={(e) => setEmailSettings({...emailSettings, smtp_port: parseInt(e.target.value)})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="smtp-username">SMTP Username</Label>
                        <Input
                          id="smtp-username"
                          type="text"
                          placeholder="your-email@gmail.com"
                          value={emailSettings.smtp_username || ''}
                          onChange={(e) => setEmailSettings({...emailSettings, smtp_username: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="smtp-password">SMTP Password</Label>
                        <Input
                          id="smtp-password"
                          type="password"
                          placeholder="Your app password"
                          value={emailSettings.smtp_password || ''}
                          onChange={(e) => setEmailSettings({...emailSettings, smtp_password: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="smtp-tls"
                        checked={emailSettings.smtp_use_tls !== false}
                        onChange={(e) => setEmailSettings({...emailSettings, smtp_use_tls: e.target.checked})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="smtp-tls">Use TLS/SSL encryption</Label>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">SMTP Configuration Guide</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <p><strong>Gmail:</strong> Host: smtp.gmail.com, Port: 587, Use app passwords</p>
                        <p><strong>Outlook:</strong> Host: smtp-mail.outlook.com, Port: 587</p>
                        <p><strong>Yahoo:</strong> Host: smtp.mail.yahoo.com, Port: 587</p>
                        <p><strong>Custom:</strong> Check with your email provider for SMTP settings</p>
                      </div>
                    </div>
                  </>
                ) : emailSettings.email_provider === 'resend' ? (
                  <div className="space-y-4">
                    {emailSettings.from_email?.includes('@gmail.com') || emailSettings.from_email?.includes('@yahoo.com') || emailSettings.from_email?.includes('@hotmail.com') ? (
                      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h4 className="font-medium text-red-800 mb-2">❌ Invalid From Email</h4>
                        <p className="text-sm text-red-700 mb-3">
                          <strong>Error:</strong> You cannot use {emailSettings.from_email?.split('@')[1]} addresses with Resend. 
                          Public email domains (Gmail, Yahoo, Hotmail) cannot be verified.
                        </p>
                        <div className="text-sm text-red-700 mb-3">
                          <p><strong>Solutions:</strong></p>
                          <ul className="list-disc ml-4 mt-1">
                            <li>Use <code className="bg-red-100 px-1 rounded">onboarding@resend.dev</code> for testing</li>
                            <li>Or verify your own custom domain at resend.com/domains</li>
                          </ul>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEmailSettings(prev => ({ ...prev, from_email: 'onboarding@resend.dev' }));
                            }}
                          >
                            Use Test Email
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open('https://resend.com/domains', '_blank')}
                          >
                            Add Custom Domain
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-medium text-green-800 mb-2">✓ Resend Configuration</h4>
                        <p className="text-sm text-green-700 mb-3">
                          Resend is configured and ready to use! Your from email looks good.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open('https://resend.com/domains', '_blank')}
                          >
                            Manage Domains
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`https://supabase.com/dashboard/project/wlawjupusugrhojbywyq/functions/send-email-notification/logs`, '_blank')}
                          >
                            View Email Logs
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">How to Fix This</h4>
                      <div className="text-sm text-blue-800 space-y-2">
                        <p><strong>Option 1 (Quick):</strong> Use <code>onboarding@resend.dev</code> for testing</p>
                        <p><strong>Option 2 (Production):</strong> Add and verify your own domain at resend.com/domains</p>
                        <p><strong>Note:</strong> You cannot use gmail.com, yahoo.com, or other public email domains</p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="from-email">From Email</Label>
                    <Input
                      id="from-email"
                      type="email"
                      placeholder="noreply@yourdomain.com"
                      value={emailSettings.from_email || ''}
                      onChange={(e) => setEmailSettings({...emailSettings, from_email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="from-name">From Name</Label>
                    <Input
                      id="from-name"
                      type="text"
                      placeholder="Gym System"
                      value={emailSettings.from_name || 'Gym System'}
                      onChange={(e) => setEmailSettings({...emailSettings, from_name: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notification-email">Notification Email</Label>
                  <Input
                    id="notification-email"
                    type="email"
                    placeholder="admin@yourgym.com"
                    value={emailSettings.notification_email || ''}
                    onChange={(e) => setEmailSettings({...emailSettings, notification_email: e.target.value})}
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Email address that will receive all admin notifications
                  </p>
                 </div>
               </div>
               
               <div className="pt-4 border-t">
                 <Button 
                   onClick={handleSaveSettings}
                   disabled={saving}
                   className="w-full"
                 >
                   {saving ? 'Saving...' : 'Save Email Configuration'}
                 </Button>
               </div>
             </CardContent>
           </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-green-600" />
                <CardTitle>Notification Preferences</CardTitle>
              </div>
              <CardDescription>
                Choose which events trigger email notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">New Member Signups</h4>
                    <p className="text-sm text-gray-600">Get notified when new members register</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailSettings.signup_notifications !== false}
                    onChange={(e) => setEmailSettings({...emailSettings, signup_notifications: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Class Bookings</h4>
                    <p className="text-sm text-gray-600">Get notified when members book classes</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailSettings.booking_notifications !== false}
                    onChange={(e) => setEmailSettings({...emailSettings, booking_notifications: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Session Requests</h4>
                    <p className="text-sm text-gray-600">Get notified when members request additional sessions</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailSettings.session_request_notifications !== false}
                    onChange={(e) => setEmailSettings({...emailSettings, session_request_notifications: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <Button 
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? 'Saving...' : 'Save Email Settings'}
                </Button>
                
                {/* Test Email Section */}
                <div className="border-t pt-4">
                  <Label htmlFor="test-email">Test Email Address</Label>
                  <Input
                    id="test-email"
                    type="email"
                    placeholder="Enter email for testing"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Specify an email address to receive the test email
                  </p>
                </div>
                
                <Button
                  onClick={handleTestEmail}
                  disabled={!testEmail || emailSaving}
                  variant="outline"
                  className="w-full"
                >
                  {emailSaving ? 'Sending...' : 'Send Test Email'}
                </Button>
                
                {/* Operation Log Display */}
                {operationLog && (
                  <div className={`mt-4 p-3 rounded-lg border ${
                    operationStatus === 'success' 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : operationStatus === 'error'
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-gray-50 border-gray-200 text-gray-800'
                  }`}>
                    <div className="flex items-start space-x-2">
                      <div className="flex-shrink-0 mt-0.5">
                        {operationStatus === 'success' && (
                          <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                        {operationStatus === 'error' && (
                          <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                            <span className="text-white text-xs">✗</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {operationStatus === 'success' ? 'Success' : operationStatus === 'error' ? 'Error' : 'Info'}
                        </p>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{operationLog}</p>
                      </div>
                      <button
                        onClick={() => {
                          setOperationLog('');
                          setOperationStatus('idle');
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <span className="sr-only">Close</span>
                        ×
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Email Logs */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-purple-600" />
                <CardTitle>Email Logs</CardTitle>
              </div>
              <CardDescription>
                Recent email sending activity and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {emailLogs.length > 0 ? (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-green-800">Current Notification Email</p>
                      <p className="text-sm text-green-600">{emailSettings.notification_email}</p>
                      <p className="text-xs text-green-500 mt-1">
                        Sender: {emailSettings.from_name || 'Gym System'} &lt;{emailSettings.from_email || 'system@gym.com'}&gt;
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTestEmail}
                        disabled={isTestingEmail}
                      >
                        {isTestingEmail ? "Testing..." : "Test"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setEmailSettings(prev => ({
                            ...prev,
                            notification_email: "",
                            from_email: "",
                            from_name: ""
                          }));
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <p className="text-amber-800 font-medium">No notification email configured</p>
                    <p className="text-amber-600 text-sm">Add your email to receive admin notifications</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="notification_email">Your Email Address *</Label>
                      <Input
                        id="notification_email"
                        type="email"
                        placeholder="admin@example.com"
                        value={emailSettings.notification_email}
                        onChange={(e) => setEmailSettings(prev => ({ ...prev, notification_email: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="from_name">Sender Name</Label>
                      <Input
                        id="from_name"
                        placeholder="Gym Management System"
                        value={emailSettings.from_name}
                        onChange={(e) => setEmailSettings(prev => ({ ...prev, from_name: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="from_email">Sender Email (Optional)</Label>
                    <Input
                      id="from_email"
                      type="email"
                      placeholder="notifications@yourgym.com"
                      value={emailSettings.from_email}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, from_email: e.target.value }))}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to use default sender email
                    </p>
                  </div>
                </div>
              )}

              {/* Notification Types */}
              <div className="space-y-3">
                <h4 className="font-medium">Notification Types</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="signup_notifications">New Member Signups</Label>
                      <p className="text-sm text-gray-500">Get notified when new members register</p>
                    </div>
                    <Switch
                      id="signup_notifications"
                      checked={emailSettings.signup_notifications}
                      onCheckedChange={(checked) => setEmailSettings(prev => ({ ...prev, signup_notifications: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="booking_notifications">Class Bookings</Label>
                      <p className="text-sm text-gray-500">Get notified for new class bookings</p>
                    </div>
                    <Switch
                      id="booking_notifications"
                      checked={emailSettings.booking_notifications}
                      onCheckedChange={(checked) => setEmailSettings(prev => ({ ...prev, booking_notifications: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="session_request_notifications">Session Requests</Label>
                      <p className="text-sm text-gray-500">Get notified for membership session requests</p>
                    </div>
                    <Switch
                      id="session_request_notifications"
                      checked={emailSettings.session_request_notifications}
                      onCheckedChange={(checked) => setEmailSettings(prev => ({ ...prev, session_request_notifications: checked }))}
                    />
                  </div>
                    </div>
                    
                    {/* Notification Tester */}
                    <div className="mt-8">
                      <NotificationTester />
                    </div>
                  </div>

              <div className="flex justify-between">
                <Button onClick={handleSaveEmailSettings} disabled={isLoading}>
                  <Send className="h-4 w-4 mr-2" />
                  Save Email Settings
                </Button>
                
                {emailSettings.notification_email && (
                  <Button 
                    variant="outline" 
                    onClick={handleTestEmail}
                    disabled={isTestingEmail}
                  >
                    {isTestingEmail ? "Testing..." : "Send Test Email"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Email Logs */}
          {emailLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Email Notifications</CardTitle>
                <CardDescription>
                  Last 10 email notifications sent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {emailLogs.slice(0, 10).map((log, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{log.subject}</p>
                        <p className="text-xs text-gray-500">To: {log.to}</p>
                        <p className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString()}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        log.status === 'success' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-6">
          {/* Move existing WhatsApp content here */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5 text-green-600" />
                <CardTitle>WhatsApp Notification System</CardTitle>
              </div>
              <CardDescription>
                Configure WhatsApp notifications using Green API - 3000 free messages per month
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <p className="text-amber-800 font-medium">WhatsApp notifications temporarily disabled</p>
                <p className="text-amber-600 text-sm">Focus on email notifications for now. WhatsApp can be added later.</p>
              </div>
            </CardContent>
          </Card>
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
                <Type className="h-5 w-5 text-gym-blue" />
                <CardTitle>Application Name</CardTitle>
              </div>
              <CardDescription>
                Configure the main application name displayed throughout the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="app-name">Application Name</Label>
                <Input
                  id="app-name"
                  value={mainPageContent.companyName}
                  onChange={(e) => handleMainPageContentChange('companyName', e.target.value)}
                  placeholder="Enter your application name (e.g. FitTrack Pro)"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  This name will appear in the header, login page, and throughout the application
                </p>
              </div>
            </CardContent>
          </Card>

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
