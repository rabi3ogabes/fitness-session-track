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
import DeletedMembers from "./components/members/DeletedMembers";
import WebhookHealth from "./components/settings/WebhookHealth";
import NotificationsTab from "./components/NotificationsTab";
import ChangePasswordDialog from "@/components/ChangePasswordDialog";
import { useAuth } from "@/context/AuthContext";

const Settings = () => {
  const { user } = useAuth();
  const [adminPwOpen, setAdminPwOpen] = useState(false);
  const [cancellationHours, setCancellationHours] = useState(4);
  const [emailSettings, setEmailSettings] = useState({
    id: null as string | null,
    notification_email: "",
    notification_cc_email: "",
    from_email: "",
    from_name: "",
    resend_enabled: true,
    signup_notifications: true,
    login_notifications: true,
    booking_notifications: true,
    cancellation_notifications: true,
    session_request_notifications: true,
    n8n_webhook_url: "",
    n8n_signup_webhook_url: "",
    n8n_booking_webhook_url: "",
    n8n_cancellation_webhook_url: "",
    n8n_session_request_webhook_url: "",
    notification_provider: "n8n" as "n8n" | "twilio" | "email",
    twilio_channel: "whatsapp" as "whatsapp" | "sms",
    twilio_from_number: "",
    twilio_admin_number: "",
  });
  
  const [isLoading, setIsLoading] = useState(false);
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
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
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
  const [showClassDeleteIcon, setShowClassDeleteIcon] = useState(true);
  const [showBookingDeleteIcon, setShowBookingDeleteIcon] = useState(false);
  const [autoApproveBalanceRequests, setAutoApproveBalanceRequests] = useState(false);
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
    // Load all settings from database
    loadAllSettings();
    // Load email settings from database
    loadEmailSettings();
    // Load email logs on component mount
    loadEmailLogs();
  }, []);

  const handleSaveSettings = async () => {
    // Clear previous logs
    setOperationLog('');
    setOperationStatus('idle');
    
    setIsLoading(true);
    setOperationLog('Saving all settings to database...\nUpdating configuration...');

    try {
      console.log('=== SAVING SETTINGS ===');
      console.log('Current emailSettings state:', emailSettings);
      console.log('N8N Webhook URL from state:', emailSettings.n8n_webhook_url);
      
      // First, get existing settings to ensure we have the ID
      const { data: existingSettings } = await supabase
        .from('admin_notification_settings')
        .select('*')
        .limit(1)
        .single();

      console.log('Existing settings from DB:', existingSettings);

      // Always UPDATE the existing row, never INSERT
      const emailPayload: any = {
        id: existingSettings?.id, // Always use the existing ID
        from_email: emailSettings.from_email,
        from_name: emailSettings.from_name,
        notification_email: emailSettings.notification_email,
        notification_cc_email: emailSettings.notification_cc_email || null,
        resend_enabled: emailSettings.resend_enabled,
        email_provider: existingSettings?.email_provider || "resend",
        smtp_host: existingSettings?.smtp_host || "",
        smtp_port: existingSettings?.smtp_port || 587,
        smtp_username: existingSettings?.smtp_username || "",
        smtp_password: existingSettings?.smtp_password || "",
        smtp_use_tls: existingSettings?.smtp_use_tls ?? true,
        signup_notifications: emailSettings.signup_notifications,
        login_notifications: emailSettings.login_notifications,
        booking_notifications: emailSettings.booking_notifications,
        cancellation_notifications: emailSettings.cancellation_notifications,
        session_request_notifications: emailSettings.session_request_notifications,
        n8n_webhook_url: emailSettings.n8n_webhook_url || null,
        n8n_signup_webhook_url: emailSettings.n8n_signup_webhook_url || null,
        n8n_booking_webhook_url: emailSettings.n8n_booking_webhook_url || null,
        n8n_cancellation_webhook_url: emailSettings.n8n_cancellation_webhook_url || null,
        n8n_session_request_webhook_url: emailSettings.n8n_session_request_webhook_url || null,
        notification_provider: emailSettings.notification_provider,
        twilio_channel: emailSettings.twilio_channel,
        twilio_from_number: emailSettings.twilio_from_number || null,
        twilio_admin_number: emailSettings.twilio_admin_number || null,
      };

      console.log('Payload to save:', emailPayload);
      console.log('N8N Webhook URL in payload:', emailPayload.n8n_webhook_url);

      const { data: emailData, error: emailError } = await supabase
        .from('admin_notification_settings')
        .update(emailPayload)
        .eq('id', existingSettings.id)
        .select()
        .single();

      console.log('Save result:', { emailData, emailError });

      if (emailError) {
        throw emailError;
      }

      // Update state with the saved data
      if (emailData?.id) {
        setEmailSettings(prev => ({ ...prev, id: emailData.id }));
      }

      setOperationLog('Email settings saved...\nSaving admin settings to database...');

      // Get existing settings to ensure we have an ID
      const { data: existingAdminSettings } = await supabase
        .from('admin_settings')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const adminSettingsPayload: any = {
        cancellation_hours: cancellationHours,
        logo: logo,
        header_color: headerColor,
        footer_color: footerColor,
        membership_expiry_basic: membershipExpiry.basic,
        membership_expiry_standard: membershipExpiry.standard,
        membership_expiry_premium: membershipExpiry.premium,
        show_testimonials: showTestimonials,
        show_low_session_warning: showLowSessionWarning,
        show_member_delete_icon: showMemberDeleteIcon,
        show_class_delete_icon: showClassDeleteIcon,
        show_booking_delete_icon: showBookingDeleteIcon,
        auto_approve_balance_requests: autoApproveBalanceRequests,
        hero_title: mainPageContent.heroTitle,
        hero_description: mainPageContent.heroDescription,
        hero_image: mainPageContent.heroImage,
        feature1_title: mainPageContent.feature1Title,
        feature1_description: mainPageContent.feature1Description,
        feature2_title: mainPageContent.feature2Title,
        feature2_description: mainPageContent.feature2Description,
        feature3_title: mainPageContent.feature3Title,
        feature3_description: mainPageContent.feature3Description,
        features_section: mainPageContent.featuresSection,
        testimonials_section: mainPageContent.testimonialsSection,
        cta_title: mainPageContent.ctaTitle,
        cta_description: mainPageContent.ctaDescription,
        cta_button: mainPageContent.ctaButton,
        company_name: mainPageContent.companyName,
        copyright: mainPageContent.copyright,
        footer_login: mainPageContent.footerLogin,
        footer_about: mainPageContent.footerAbout,
        footer_contact: mainPageContent.footerContact,
        footer_privacy: mainPageContent.footerPrivacy
      };

      // If there's an existing ID, add it to the payload for upsert
      if (existingAdminSettings?.id) {
        adminSettingsPayload.id = existingAdminSettings.id;
      }

      // Save all other settings to admin_settings table
      const { data: settingsData, error: settingsError } = await supabase
        .from('admin_settings')
        .upsert(adminSettingsPayload, {
          onConflict: 'id'
        });

      if (settingsError) {
        throw settingsError;
      }

      setIsLoading(false);
      const successMsg = `✅ All settings saved successfully!\n\nTimestamp: ${new Date().toLocaleString()}\n\nSettings have been saved to the database and will persist across sessions.`;
      setOperationLog(successMsg);
      setOperationStatus('success');
      
      toast({
        title: "Settings saved",
        description: "All your settings have been saved successfully to the database.",
      });

    } catch (error) {
      console.error('Save settings error:', error);
      setIsLoading(false);
      const errorMsg = `❌ Failed to save settings!\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nTimestamp: ${new Date().toLocaleString()}\n\nPlease check your configuration and try again.`;
      setOperationLog(errorMsg);
      setOperationStatus('error');
      
      toast({
        title: "Save failed",
        description: `Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };



  const loadEmailLogs = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('email_send_log')
        .select('created_at, recipient_email, template_name, status, error_message')
        .order('created_at', { ascending: false })
        .limit(20);


      if (error) return;
      setEmailLogs((data || []).map((r: any) => ({
        timestamp: r.created_at,
        to: r.recipient_email,
        subject: r.template_name,
        status: r.status === 'sent' ? 'success' : 'failed',
        error: r.error_message || undefined,
      })));
    } catch (e) {
      console.error('Failed to load email logs:', e);
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
      setOperationLog(`Sending test email to ${testEmail} via Lovable Email...`);

      const { data, error } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'admin-notification',
          recipientEmail: testEmail,
          idempotencyKey: `test-${testEmail}-${Date.now()}`,
          templateData: {
            eventType: 'signup',
            memberName: 'Test User',
            memberEmail: 'test@example.com',
            details: 'This is a test notification from your admin settings.',
          },
        },
      });

      if (error) {
        const errorMsg = `Function Error: ${error.message || 'Unknown error'}`;
        setOperationLog(errorMsg);
        setOperationStatus('error');
        throw error;
      }

      const successMsg = `✅ Test email queued successfully!\n\nRecipient: ${testEmail}\nResponse: ${data?.message || 'Sent via Lovable Email'}`;
      setOperationLog(successMsg);
      setOperationStatus('success');

      toast({
        title: "Test email sent",
        description: "A test notification was queued via Lovable Email.",
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

  const loadAllSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        // Load all settings from database
        setCancellationHours(data.cancellation_hours || 4);
        setLogo(data.logo);
        setHeaderColor(data.header_color || "#ffffff");
        setFooterColor(data.footer_color || "#000000");
        setMembershipExpiry({
          basic: data.membership_expiry_basic || 30,
          standard: data.membership_expiry_standard || 60,
          premium: data.membership_expiry_premium || 90
        });
        setShowTestimonials(data.show_testimonials ?? true);
        setShowLowSessionWarning(data.show_low_session_warning ?? true);
        setShowMemberDeleteIcon(data.show_member_delete_icon ?? true);
        setShowClassDeleteIcon(data.show_class_delete_icon ?? true);
        setShowBookingDeleteIcon(data.show_booking_delete_icon ?? false);
        setAutoApproveBalanceRequests(data.auto_approve_balance_requests ?? false);
        setMainPageContent({
          heroTitle: data.hero_title || "Streamlined Gym Management System",
          heroDescription: data.hero_description || "A complete solution for gym owners and members. Manage memberships, book sessions, track attendance, and more.",
          heroImage: data.hero_image || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
          feature1Title: data.feature1_title || "User Roles",
          feature1Description: data.feature1_description || "Separate dashboards for administrators and members with role-specific functionality.",
          feature2Title: data.feature2_title || "Session Booking",
          feature2Description: data.feature2_description || "Effortless class booking with membership session tracking and management.",
          feature3Title: data.feature3_title || "Membership Management",
          feature3Description: data.feature3_description || "Easily manage different membership packages with automated session tracking.",
          featuresSection: data.features_section || "Our Features",
          testimonialsSection: data.testimonials_section || "What Our Members Say",
          ctaTitle: data.cta_title || "Ready to Transform Your Fitness Journey?",
          ctaDescription: data.cta_description || "Join us today and take control of your fitness goals with our comprehensive gym management system.",
          ctaButton: data.cta_button || "Get Started Now",
          companyName: data.company_name || "FitTrack Pro",
          copyright: data.copyright || "© 2025 All rights reserved",
          footerLogin: data.footer_login || "Login",
          footerAbout: data.footer_about || "About",
          footerContact: data.footer_contact || "Contact",
          footerPrivacy: data.footer_privacy || "Privacy"
        });
      } else {
        // Fallback to localStorage if no database settings
        loadFromLocalStorage();
      }
    } catch (error) {
      console.error('Failed to load settings from database:', error);
      loadFromLocalStorage();
    }
  };

  const loadFromLocalStorage = () => {
    // Load from localStorage as fallback
    const savedLogo = localStorage.getItem("gymLogo");
    if (savedLogo) setLogo(savedLogo);
    
    const savedHeaderColor = localStorage.getItem("headerBackgroundColor");
    if (savedHeaderColor) setHeaderColor(savedHeaderColor);
    
    const savedFooterColor = localStorage.getItem("footerBackgroundColor");
    if (savedFooterColor) setFooterColor(savedFooterColor);
    
    const savedMainPageContent = localStorage.getItem("mainPageContent");
    if (savedMainPageContent) setMainPageContent(JSON.parse(savedMainPageContent));
    
    const savedShowTestimonials = localStorage.getItem("showTestimonials");
    if (savedShowTestimonials !== null) setShowTestimonials(JSON.parse(savedShowTestimonials));
    
    const savedShowLowSessionWarning = localStorage.getItem("showLowSessionWarning");
    if (savedShowLowSessionWarning !== null) setShowLowSessionWarning(JSON.parse(savedShowLowSessionWarning));
    
    const savedShowMemberDeleteIcon = localStorage.getItem("showMemberDeleteIcon");
    if (savedShowMemberDeleteIcon !== null) setShowMemberDeleteIcon(JSON.parse(savedShowMemberDeleteIcon));
    
    const savedShowClassDeleteIcon = localStorage.getItem("showClassDeleteIcon");
    if (savedShowClassDeleteIcon !== null) setShowClassDeleteIcon(JSON.parse(savedShowClassDeleteIcon));
    
    const savedShowBookingDeleteIcon = localStorage.getItem("showBookingDeleteIcon");
    if (savedShowBookingDeleteIcon !== null) setShowBookingDeleteIcon(JSON.parse(savedShowBookingDeleteIcon));
  };

  const loadEmailSettings = async () => {
    try {
      console.log('=== LOADING EMAIL SETTINGS ===');
      const { data, error } = await supabase
        .from('admin_notification_settings')
        .select('*')
        .maybeSingle();

      console.log('Loaded from DB:', { data, error });
      console.log('N8N Webhook URL from DB:', data?.n8n_webhook_url);

      if (data && !error) {
        const loadedSettings = {
          id: data.id || null,
          from_email: data.from_email || "",
          from_name: data.from_name || "",
          notification_email: data.notification_email || "",
          notification_cc_email: data.notification_cc_email || "",
          resend_enabled: data.resend_enabled ?? true,
          signup_notifications: data.signup_notifications ?? true,
          login_notifications: (data as any).login_notifications ?? true,
          booking_notifications: data.booking_notifications ?? true,
          cancellation_notifications: data.cancellation_notifications ?? true,
          session_request_notifications: data.session_request_notifications ?? true,
          n8n_webhook_url: data.n8n_webhook_url || "",
          n8n_signup_webhook_url: data.n8n_signup_webhook_url || "",
          n8n_booking_webhook_url: data.n8n_booking_webhook_url || "",
          n8n_cancellation_webhook_url: data.n8n_cancellation_webhook_url || "",
          n8n_session_request_webhook_url: data.n8n_session_request_webhook_url || "",
          notification_provider: ((data as any).notification_provider || "n8n") as "n8n" | "twilio" | "email",
          twilio_channel: ((data as any).twilio_channel || "whatsapp") as "whatsapp" | "sms",
          twilio_from_number: (data as any).twilio_from_number || "",
          twilio_admin_number: (data as any).twilio_admin_number || "",
        };
        console.log('Setting state to:', loadedSettings);
        setEmailSettings(loadedSettings);
      } else {
        // Fallback to local storage if no database settings
        const savedEmailSettings = localStorage.getItem("emailSettings");
        if (savedEmailSettings) {
        const parsed = JSON.parse(savedEmailSettings);
        setEmailSettings({
          id: null,
          from_email: parsed.from_email || parsed.fromEmail || "",
          from_name: parsed.from_name || parsed.fromName || "",
          notification_email: parsed.notification_email || parsed.notificationEmail || "",
          notification_cc_email: parsed.notification_cc_email || "",
          resend_enabled: parsed.resend_enabled ?? true,
          signup_notifications: parsed.signup_notifications ?? parsed.notifySignup ?? true,
          login_notifications: parsed.login_notifications ?? true,
          booking_notifications: parsed.booking_notifications ?? parsed.notifyBooking ?? true,
          cancellation_notifications: parsed.cancellation_notifications ?? true,
          session_request_notifications: parsed.session_request_notifications ?? parsed.notifySessionRequest ?? true,
          n8n_webhook_url: parsed.n8n_webhook_url || "",
          n8n_signup_webhook_url: parsed.n8n_signup_webhook_url || "",
          n8n_booking_webhook_url: parsed.n8n_booking_webhook_url || "",
          n8n_cancellation_webhook_url: parsed.n8n_cancellation_webhook_url || "",
          n8n_session_request_webhook_url: parsed.n8n_session_request_webhook_url || "",
          notification_provider: (parsed.notification_provider || "n8n") as "n8n" | "twilio" | "email",
          twilio_channel: (parsed.twilio_channel || "whatsapp") as "whatsapp" | "sms",
          twilio_from_number: parsed.twilio_from_number || "",
          twilio_admin_number: parsed.twilio_admin_number || "",
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
          id: null,
          from_email: parsed.from_email || parsed.fromEmail || "",
          from_name: parsed.from_name || parsed.fromName || "",
          notification_email: parsed.notification_email || parsed.notificationEmail || "",
          notification_cc_email: parsed.notification_cc_email || "",
          resend_enabled: parsed.resend_enabled ?? true,
          signup_notifications: parsed.signup_notifications ?? parsed.notifySignup ?? true,
          login_notifications: parsed.login_notifications ?? true,
          booking_notifications: parsed.booking_notifications ?? parsed.notifyBooking ?? true,
          cancellation_notifications: parsed.cancellation_notifications ?? true,
          session_request_notifications: parsed.session_request_notifications ?? parsed.notifySessionRequest ?? true,
          n8n_webhook_url: parsed.n8n_webhook_url || "",
          n8n_signup_webhook_url: parsed.n8n_signup_webhook_url || "",
          n8n_booking_webhook_url: parsed.n8n_booking_webhook_url || "",
          n8n_cancellation_webhook_url: parsed.n8n_cancellation_webhook_url || "",
          n8n_session_request_webhook_url: parsed.n8n_session_request_webhook_url || "",
          notification_provider: (parsed.notification_provider || "n8n") as "n8n" | "twilio" | "email",
          twilio_channel: (parsed.twilio_channel || "whatsapp") as "whatsapp" | "sms",
          twilio_from_number: parsed.twilio_from_number || "",
          twilio_admin_number: parsed.twilio_admin_number || "",
        });
      }
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="mainpage">Main Page</TabsTrigger>
          <TabsTrigger value="webhooks">Webhook Health</TabsTrigger>
          <TabsTrigger value="deleted">Deleted Members</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-gym-blue" />
                <CardTitle>Account Security</CardTitle>
              </div>
              <CardDescription>
                Change the password used by your admin account ({user?.email}). A confirmation email will be sent.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => setAdminPwOpen(true)}>
                <Key className="h-4 w-4 mr-2" />
                Change my password
              </Button>
            </CardContent>
          </Card>

          <ChangePasswordDialog
            isOpen={adminPwOpen}
            onClose={() => setAdminPwOpen(false)}
            email={user?.email}
            name={user?.name}
          />

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
                 
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-class-delete-icon">Class Delete Icon</Label>
                      <p className="text-sm text-muted-foreground">
                        Show delete icon for classes in the class management page (with session refund)
                      </p>
                    </div>
                    <Switch
                      id="show-class-delete-icon"
                      checked={showClassDeleteIcon}
                      onCheckedChange={setShowClassDeleteIcon}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-booking-delete-icon">Recent Bookings Delete Icon</Label>
                      <p className="text-sm text-muted-foreground">
                        Show delete icon for recent bookings in the dashboard (cancel/delete bookings)
                      </p>
                    </div>
                    <Switch
                      id="show-booking-delete-icon"
                      checked={showBookingDeleteIcon}
                      onCheckedChange={setShowBookingDeleteIcon}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-approve-balance">Auto Approve Balance Requests</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically approve session balance requests when users submit them (no manual approval needed)
                      </p>
                    </div>
                    <Switch
                      id="auto-approve-balance"
                      checked={autoApproveBalanceRequests}
                      onCheckedChange={setAutoApproveBalanceRequests}
                    />
                  </div>
               </CardContent>
            </Card>

            {/* Notification Channel */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Channel</CardTitle>
                <CardDescription>
                  Choose how admin and customer notifications are delivered.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Channel</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button
                      type="button"
                      variant={emailSettings.notification_provider === 'email' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEmailSettings({ ...emailSettings, notification_provider: 'email' })}
                    >Email</Button>
                    <Button
                      type="button"
                      variant={emailSettings.notification_provider === 'n8n' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEmailSettings({ ...emailSettings, notification_provider: 'n8n' })}
                    >n8n Webhook</Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {emailSettings.notification_provider === 'email' && 'Notifications are sent by email from your verified domain (notify.fhbfit.com).'}
                    {emailSettings.notification_provider === 'n8n' && 'Notifications are dispatched to your configured n8n webhooks.'}
                  </p>
                </div>




                <div className="space-y-2 pt-3 border-t">
                  <h4 className="text-sm font-medium">Enable notification events</h4>
                  {[
                    { key: 'signup_notifications', label: 'Sign up' },
                    { key: 'login_notifications', label: 'Login' },
                    { key: 'booking_notifications', label: 'Booking' },
                    { key: 'cancellation_notifications', label: 'Booking cancelled' },
                    { key: 'session_request_notifications', label: 'Session request' },
                  ].map((row) => (
                    <div key={row.key} className="flex items-center justify-between">
                      <Label className="text-sm">{row.label}</Label>
                      <Switch
                        checked={(emailSettings as any)[row.key]}
                        onCheckedChange={(checked) => setEmailSettings({ ...emailSettings, [row.key]: checked } as any)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* N8N Webhook Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                  <CardTitle>N8N Webhook Integration</CardTitle>
                </div>
                <CardDescription>
                  Configure separate N8N webhook URLs for different notification types
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="admin-email">Admin Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@example.com"
                    value={emailSettings.notification_email}
                    onChange={(e) => setEmailSettings({...emailSettings, notification_email: e.target.value})}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Email address to receive admin notifications
                  </p>
                </div>
                
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium text-sm text-gray-700">Separate Webhook URLs by Notification Type</h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="n8n-signup-webhook">Signup Notifications Webhook</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Enable</span>
                        <Switch
                          checked={emailSettings.signup_notifications}
                          onCheckedChange={(checked) => setEmailSettings({...emailSettings, signup_notifications: checked})}
                        />
                      </div>
                    </div>
                    <Input
                      id="n8n-signup-webhook"
                      type="url"
                      placeholder="https://n8n.srv1058931.hstgr.cloud/webhook/signup..."
                      value={emailSettings.n8n_signup_webhook_url || ''}
                      onChange={(e) => setEmailSettings({...emailSettings, n8n_signup_webhook_url: e.target.value})}
                      disabled={!emailSettings.signup_notifications}
                    />
                    <p className="text-sm text-gray-600">
                      Webhook URL for new member signup notifications
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="n8n-booking-webhook">Booking Notifications Webhook</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Enable</span>
                        <Switch
                          checked={emailSettings.booking_notifications}
                          onCheckedChange={(checked) => setEmailSettings({...emailSettings, booking_notifications: checked})}
                        />
                      </div>
                    </div>
                    <Input
                      id="n8n-booking-webhook"
                      type="url"
                      placeholder="https://n8n.srv1058931.hstgr.cloud/webhook/booking..."
                      value={emailSettings.n8n_booking_webhook_url || ''}
                      onChange={(e) => setEmailSettings({...emailSettings, n8n_booking_webhook_url: e.target.value})}
                      disabled={!emailSettings.booking_notifications}
                    />
                    <p className="text-sm text-gray-600">
                      Webhook URL for class booking notifications
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="n8n-cancellation-webhook">Cancellation Notifications Webhook</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Enable</span>
                        <Switch
                          id="cancellation-notifications-switch"
                          checked={emailSettings.cancellation_notifications}
                          onCheckedChange={(checked) => setEmailSettings({...emailSettings, cancellation_notifications: checked})}
                        />
                      </div>
                    </div>
                    <Input
                      id="n8n-cancellation-webhook"
                      type="url"
                      placeholder="https://n8n.srv1058931.hstgr.cloud/webhook/cancellation..."
                      value={emailSettings.n8n_cancellation_webhook_url || ''}
                      onChange={(e) => setEmailSettings({...emailSettings, n8n_cancellation_webhook_url: e.target.value})}
                      disabled={!emailSettings.cancellation_notifications}
                    />
                    <p className="text-sm text-gray-600">
                      Webhook URL for booking cancellation notifications
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="n8n-session-webhook">Session Request Notifications Webhook</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Enable</span>
                        <Switch
                          checked={emailSettings.session_request_notifications}
                          onCheckedChange={(checked) => setEmailSettings({...emailSettings, session_request_notifications: checked})}
                        />
                      </div>
                    </div>
                    <Input
                      id="n8n-session-webhook"
                      type="url"
                      placeholder="https://n8n.srv1058931.hstgr.cloud/webhook/session..."
                      value={emailSettings.n8n_session_request_webhook_url || ''}
                      onChange={(e) => setEmailSettings({...emailSettings, n8n_session_request_webhook_url: e.target.value})}
                      disabled={!emailSettings.session_request_notifications}
                    />
                    <p className="text-sm text-gray-600">
                      Webhook URL for session balance request notifications
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div>
                    <Label htmlFor="n8n-webhook">Legacy Webhook URL (All Notifications)</Label>
                    <Input
                      id="n8n-webhook"
                      type="url"
                      placeholder="https://n8n.srv1058931.hstgr.cloud/webhook/..."
                      value={emailSettings.n8n_webhook_url || ''}
                      onChange={(e) => setEmailSettings({...emailSettings, n8n_webhook_url: e.target.value})}
                      className="mt-1"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Fallback webhook URL for all notifications (used if specific webhooks are not configured)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={handleSaveSettings}
              disabled={isLoading}
              className="px-8"
            >
              {isLoading ? 'Saving...' : 'Save All Settings'}
            </Button>
          </div>
          
          {operationLog && (
            <Card className={`mt-6 ${
              operationStatus === 'success' ? 'border-green-500' : 
              operationStatus === 'error' ? 'border-red-500' : 
              'border-gray-300'
            }`}>
              <CardHeader>
                <CardTitle className="text-sm">Operation Log</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded">
                  {operationLog}
                </pre>
              </CardContent>
            </Card>
          )}
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
          <NotificationsTab />
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

        <TabsContent value="webhooks" className="space-y-6">
          <WebhookHealth />
        </TabsContent>

        <TabsContent value="deleted" className="space-y-6">
          <DeletedMembers />
        </TabsContent>
      </Tabs>

    </DashboardLayout>
  );
};

export default Settings;
