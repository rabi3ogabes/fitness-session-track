import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.1.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log("Resend API Key configured:", !!Deno.env.get("RESEND_API_KEY"));
console.log("Email notification function loaded successfully");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-application-name",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface EmailNotificationRequest {
  type?: string;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  memberName?: string;
  memberEmail?: string;
  requestedSessions?: number;
  newBalance?: number;
  notificationEmail: string;
  fromEmail?: string;
  fromName?: string;
  bookingDetails?: {
    className: string;
    schedule: string;
    startTime: string;
    endTime: string;
    trainer: string;
    location: string;
  };
  sessionRequestDetails?: {
    planName: string;
    sessions: number;
    requestDate: string;
  };
  cancellationDetails?: {
    className: string;
    classDate: string;
    classTime: string;
    currentEnrollment: number;
  };
}

interface EmailLogEntry {
  timestamp: string;
  to: string;
  subject: string;
  success: boolean;
  error?: string | null;
}

const emailLogs: EmailLogEntry[] = [];

const processPendingNotifications = async () => {
  console.log("Processing pending notifications...");
  
  try {
    const { data: pendingLogs, error: fetchError } = await supabase
      .from('notification_logs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error("Error fetching pending notifications:", fetchError);
      return;
    }

    console.log(`Found ${pendingLogs?.length || 0} pending notifications`);

    if (!pendingLogs || pendingLogs.length === 0) {
      return;
    }

    for (const log of pendingLogs) {
      try {
        console.log(`Processing notification ${log.id} of type ${log.notification_type}`);
        
        // Get admin settings to check for CC email and sender name
        const { data: adminSettings } = await supabase
          .from('admin_notification_settings')
          .select('notification_cc_email, from_name')
          .single();

        const ccEmails = adminSettings?.notification_cc_email ? [adminSettings.notification_cc_email] : [];
        const senderName = adminSettings?.from_name || "Gym System";

        const emailResponse = await resend.emails.send({
          from: `${senderName} <onboarding@resend.dev>`, // Use the sender name from admin settings
          to: [log.recipient_email],
          cc: ccEmails,
          subject: `[${senderName}] ${log.subject}`,
          html: generateNotificationHTML(log),
        });

        console.log(`Email sent successfully for ${log.id}:`, emailResponse);

        // Update status to sent
        await supabase
          .from('notification_logs')
          .update({ status: 'sent' })
          .eq('id', log.id);

      } catch (emailError: any) {
        console.error(`Error sending email for ${log.id}:`, emailError);
        
        await supabase
          .from('notification_logs')
          .update({ 
            status: 'error',
            error_message: emailError.message || 'Failed to send email'
          })
          .eq('id', log.id);
      }
    }
  } catch (error) {
    console.error("Error processing pending notifications:", error);
  }
};

const generateNotificationHTML = (log: any): string => {
  switch (log.notification_type) {
    case 'signup':
      return `
        <h2>🎉 New Member Registration</h2>
        <p><strong>Name:</strong> ${log.user_name}</p>
        <p><strong>Email:</strong> ${log.user_email}</p>
        <p><strong>Registration Date:</strong> ${new Date(log.created_at).toLocaleString()}</p>
        <p>A new member has successfully registered for your gym.</p>
      `;
    case 'booking':
      return `
        <h2>📅 New Class Booking</h2>
        <p><strong>Member:</strong> ${log.user_name}</p>
        <p><strong>Email:</strong> ${log.user_email}</p>
        <p><strong>Booking Date:</strong> ${new Date(log.created_at).toLocaleString()}</p>
        <p>A member has booked a class at your gym.</p>
      `;
    case 'session_request':
      return `
        <h2>💪 New Session Request</h2>
        <p><strong>Member:</strong> ${log.user_name}</p>
        <p><strong>Email:</strong> ${log.user_email}</p>
        <p><strong>Request Date:</strong> ${new Date(log.created_at).toLocaleString()}</p>
        <p>A member has requested additional sessions.</p>
      `;
    case 'membership_approval':
      return `
        <h2>✅ Membership Request Approved</h2>
        <p><strong>Member:</strong> ${log.user_name}</p>
        <p><strong>Email:</strong> ${log.user_email}</p>
        <p><strong>Approval Date:</strong> ${new Date(log.created_at).toLocaleString()}</p>
        <p>🎉 Congratulations! Your membership request has been approved and is now active.</p>
        <p>You can now start booking classes and using your gym sessions.</p>
        <p><strong>Next Steps:</strong></p>
        <ul>
          <li>Log into your account to view your available sessions</li>
          <li>Browse and book your first class</li>
          <li>Visit us at the gym with a valid ID</li>
        </ul>
        <p>Welcome to our gym family! 💪</p>
      `;
    default:
      return `
        <h2>📢 Gym Notification</h2>
        <p><strong>Member:</strong> ${log.user_name}</p>
        <p><strong>Email:</strong> ${log.user_email}</p>
        <p><strong>Date:</strong> ${new Date(log.created_at).toLocaleString()}</p>
      `;
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log("=== Email notification function called ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Headers:", Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Handle GET request for logs
    if (req.method === 'GET') {
      console.log("Returning email logs, count:", emailLogs.length);
      return new Response(
        JSON.stringify({ 
          logs: emailLogs.slice(-20).reverse(),
          totalLogs: emailLogs.length 
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Handle POST request for sending emails or processing pending notifications
    if (req.method === 'POST') {
      console.log("Processing POST request for email sending");
      
      let requestBody;
      try {
        requestBody = await req.json();
        console.log("Request body received:", requestBody);
      } catch (parseError) {
        console.error("Failed to parse request body:", parseError);
        return new Response(
          JSON.stringify({ error: 'Invalid JSON in request body' }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      // Check if this is a request to process pending notifications
      if (requestBody.action === 'process_pending') {
        console.log("Processing pending notifications...");
        await processPendingNotifications();
        return new Response(
          JSON.stringify({ success: true, message: 'Pending notifications processed' }),
          { 
            status: 200, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      const { 
        type, 
        userEmail, 
        userName, 
        userPhone, 
        memberName, 
        memberEmail, 
        requestedSessions, 
        newBalance, 
        notificationEmail, 
        fromEmail, 
        fromName, 
        bookingDetails, 
        sessionRequestDetails,
        cancellationDetails
      }: EmailNotificationRequest = requestBody;

      // Validate required fields
      if (!notificationEmail) {
        console.error("Validation failed: notificationEmail is required");
        const logEntry: EmailLogEntry = {
          timestamp: new Date().toISOString(),
          to: 'unknown',
          subject: 'Validation Failed',
          success: false,
          error: 'Notification email is required'
        };
        emailLogs.push(logEntry);
        
        return new Response(
          JSON.stringify({ error: 'Notification email is required' }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      const isTestEmail = userEmail === 'test@example.com';
      const isBookingNotification = !!bookingDetails;
      const isSessionRequestNotification = !!sessionRequestDetails;
      const isSessionRequestApproval = type === 'session_request_approved';
      const isCancellationNotification = type === 'cancellation';
      
      let emailSubject: string;
      let emailBody: string;
      let emailTo: string = notificationEmail;

      if (isSessionRequestApproval) {
        // Send to member's email for approval notifications
        emailTo = memberEmail || userEmail || notificationEmail;
        emailSubject = `🎉 Session Balance Request Approved`;
        emailBody = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #22c55e;">Great News! Your Session Request Has Been Approved</h2>
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
              <p><strong>Dear ${memberName || userName},</strong></p>
              <p>We're excited to inform you that your session balance request has been approved!</p>
              <p><strong>✅ Sessions Added:</strong> ${requestedSessions}</p>
              <p><strong>💪 Your New Balance:</strong> ${newBalance} sessions</p>
            </div>
            <p style="color: #666;">You can now book your classes using your updated session balance. Thank you for choosing our gym!</p>
            <p style="color: #888; font-size: 14px; margin-top: 30px;">Visit our website to book your next session.</p>
          </div>
        `;
      } else if (isTestEmail) {
        emailSubject = 'Email Test - Configuration Successful';
        emailBody = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">✅ Email Configuration Test Successful!</h2>
            <p>Congratulations! Your email notification system is working correctly.</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Test Details:</h3>
              <ul>
                <li><strong>Service:</strong> Resend Email API</li>
                <li><strong>Notification Email:</strong> ${notificationEmail}</li>
                <li><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
              </ul>
            </div>
            <p>Your gym management system is now ready to send email notifications for:</p>
            <ul>
              <li>New member registrations</li>
              <li>Class bookings</li>
              <li>Session balance requests</li>
            </ul>
            <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
              This email was sent automatically by your gym management system using Resend.
            </p>
          </div>
        `;
      } else if (isBookingNotification) {
        emailSubject = `New Class Booking: ${bookingDetails!.className}`;
        emailBody = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">📅 New Class Booking</h2>
            <p>A member has booked a new class session.</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Member Details:</h3>
              <ul>
                <li><strong>Name:</strong> ${userName}</li>
                <li><strong>Email:</strong> ${userEmail}</li>
                ${userPhone ? `<li><strong>Phone:</strong> ${userPhone}</li>` : ''}
              </ul>
            </div>
            <div style="background-color: #e0f2fe; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Class Details:</h3>
              <ul>
                <li><strong>Class:</strong> ${bookingDetails!.className}</li>
                <li><strong>Date:</strong> ${new Date(bookingDetails!.schedule).toLocaleDateString()}</li>
                <li><strong>Time:</strong> ${bookingDetails!.startTime} - ${bookingDetails!.endTime}</li>
                <li><strong>Trainer:</strong> ${bookingDetails!.trainer}</li>
                <li><strong>Location:</strong> ${bookingDetails!.location}</li>
                <li><strong>Booking Date:</strong> ${new Date().toLocaleString()}</li>
              </ul>
            </div>
            <p>Please review the new booking in your admin dashboard.</p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
              This email was sent automatically by your gym management system.
            </p>
          </div>
        `;
      } else if (isCancellationNotification) {
        emailSubject = `Class Booking Cancelled: ${cancellationDetails?.className || 'Unknown Class'}`;
        emailBody = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #dc2626;">❌ Class Booking Cancelled</h2>
            <p>A member has cancelled their class booking.</p>
            <div style="background-color: #fef2f2; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <h3 style="margin-top: 0;">Member Details:</h3>
              <ul>
                <li><strong>Name:</strong> ${userName}</li>
                <li><strong>Email:</strong> ${userEmail}</li>
              </ul>
            </div>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Class Details:</h3>
              <ul>
                <li><strong>Class:</strong> ${cancellationDetails?.className || 'Unknown Class'}</li>
                <li><strong>Date:</strong> ${cancellationDetails?.classDate ? new Date(cancellationDetails.classDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown date'}</li>
                <li><strong>Time:</strong> ${cancellationDetails?.classTime || 'Unknown time'}</li>
                <li><strong>Current Enrollment:</strong> ${cancellationDetails?.currentEnrollment || 0} members</li>
              </ul>
            </div>
            <p>The member's session has been restored to their account balance.</p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
              This email was sent automatically by your gym management system.
            </p>
          </div>
        `;
      } else if (isSessionRequestNotification) {
        emailSubject = `New Session Request: ${sessionRequestDetails!.planName}`;
        emailBody = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #f59e0b;">📋 New Session Request</h2>
            <p>A member has requested additional sessions.</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Member Details:</h3>
              <ul>
                <li><strong>Name:</strong> ${userName}</li>
                <li><strong>Email:</strong> ${userEmail}</li>
                ${userPhone ? `<li><strong>Phone:</strong> ${userPhone}</li>` : ''}
              </ul>
            </div>
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Session Request Details:</h3>
              <ul>
                <li><strong>Membership Type:</strong> ${sessionRequestDetails!.planName}</li>
                <li><strong>Requested Sessions:</strong> ${sessionRequestDetails!.sessions}</li>
                <li><strong>Request Date:</strong> ${sessionRequestDetails!.requestDate}</li>
                <li><strong>Status:</strong> Pending Review</li>
              </ul>
            </div>
            <p>Please review this session request in your admin dashboard and take appropriate action.</p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
              This email was sent automatically by your gym management system.
            </p>
          </div>
        `;
      } else if (type === 'signup') {
        // Welcome email for new members
        emailTo = memberEmail || userEmail || emailTo;
        emailSubject = `Welcome to our gym family!`;
        emailBody = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #22c55e;">🎉 Welcome to our gym family!</h1>
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
              <p><strong>Dear ${memberName || userName},</strong></p>
              <p>Thank you for joining us! We're excited to have you as part of our community.</p>
              <p><strong>Your Account Details:</strong></p>
              <ul>
                <li><strong>Email:</strong> ${memberEmail || userEmail}</li>
                <li><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</li>
              </ul>
            </div>
            <div style="background-color: #e0f2fe; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">What's Next?</h3>
              <ul>
                <li>Log in to your account to book fitness classes</li>
                <li>Explore our class schedule and trainers</li>
                <li>Contact us if you have any questions</li>
              </ul>
            </div>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
              Best regards,<br>The Gym Team
            </p>
          </div>
        `;
      } else if (type === 'existing_account') {
        // Notification for existing account signup attempt
        emailTo = memberEmail || userEmail || emailTo;
        emailSubject = `Account Already Exists - Gym Management System`;
        emailBody = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #f59e0b;">⚠️ Account Already Exists</h1>
            <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p><strong>Dear ${memberName || userName},</strong></p>
              <p>We received a signup request for this email address, but an account already exists in our system.</p>
              <p><strong>What this means:</strong></p>
              <ul>
                <li>You already have an account with us</li>
                <li>Your email: ${memberEmail || userEmail}</li>
                <li>Attempt date: ${new Date().toLocaleDateString()}</li>
              </ul>
            </div>
            <div style="background-color: #e0f2fe; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">What to do next:</h3>
              <ul>
                <li>Try logging in with your existing credentials</li>
                <li>Use "Forgot Password" if you can't remember your password</li>
                <li>Contact gym administration if you need assistance</li>
              </ul>
            </div>
            <p>If this wasn't you, you can safely ignore this email.</p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
              Best regards,<br>The Gym Team
            </p>
          </div>
        `;
      } else {
        // Admin notification for new registrations  
        emailSubject = `New User Registration: ${userName}`;
        emailBody = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">🎉 New User Registration</h2>
            <p>A new member has registered for your gym management system.</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Member Details:</h3>
              <ul>
                <li><strong>Name:</strong> ${userName}</li>
                <li><strong>Email:</strong> ${userEmail}</li>
                ${userPhone ? `<li><strong>Phone:</strong> ${userPhone}</li>` : ''}
                <li><strong>Registration Date:</strong> ${new Date().toLocaleString()}</li>
              </ul>
            </div>
            <p>Please review the new member registration and take any necessary actions in your admin dashboard.</p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
              This email was sent automatically by your gym management system.
            </p>
          </div>
        `;
      }

      try {
        console.log(`Attempting to send email to: ${emailTo}`);
        // Get admin settings for sender name and CC email
        const { data: adminSettings } = await supabase
          .from('admin_notification_settings')
          .select('notification_cc_email, from_name, from_email')
          .single();

        const ccEmails = adminSettings?.notification_cc_email ? [adminSettings.notification_cc_email] : [];
        const defaultSenderName = adminSettings?.from_name || "Gym Management";
        const defaultSenderEmail = adminSettings?.from_email || "onboarding@resend.dev";
        
        console.log(`From: ${fromEmail && fromName ? `${fromName} <${fromEmail}>` : `${defaultSenderName} <${defaultSenderEmail}>`}`);
        console.log(`Subject: ${emailSubject}`);
        
        const emailResponse = await resend.emails.send({
          from: fromEmail && fromName ? `${fromName} <${fromEmail}>` : `${defaultSenderName} <${defaultSenderEmail}>`,
          to: [emailTo],
          cc: ccEmails,
          subject: emailSubject,
          html: emailBody,
        });

        console.log("Email API response:", emailResponse);

        // Check if there's an error in the response
        if (emailResponse.error) {
          console.error("Email API error:", emailResponse.error);
          
          // Log failed email
          const logEntry: EmailLogEntry = {
            timestamp: new Date().toISOString(),
            to: emailTo,
            subject: emailSubject,
            success: false,
            error: emailResponse.error.message || JSON.stringify(emailResponse.error)
          };
          emailLogs.push(logEntry);
          
          return new Response(
            JSON.stringify({ 
              error: "Failed to send email",
              details: emailResponse.error.message || emailResponse.error
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }

        console.log("Email sent successfully!");

        // Send to n8n webhook if configured
        const { data: n8nSettings } = await supabase
          .from('admin_notification_settings')
          .select('n8n_webhook_url')
          .single();

        if (n8nSettings?.n8n_webhook_url) {
          console.log("Sending to n8n webhook:", n8nSettings.n8n_webhook_url);
          try {
            const webhookPayload = {
              type,
              timestamp: new Date().toISOString(),
              user: {
                name: userName || memberName,
                email: userEmail || memberEmail,
                phone: userPhone
              },
              notification: {
                subject: emailSubject,
                to: emailTo
              },
              ...(bookingDetails && { bookingDetails }),
              ...(sessionRequestDetails && { sessionRequestDetails }),
              ...(cancellationDetails && { cancellationDetails }),
              ...(requestedSessions && { requestedSessions }),
              ...(newBalance && { newBalance })
            };

            const webhookResponse = await fetch(n8nSettings.n8n_webhook_url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(webhookPayload)
            });

            console.log("n8n webhook response status:", webhookResponse.status);
            if (!webhookResponse.ok) {
              console.error("n8n webhook failed:", await webhookResponse.text());
            } else {
              console.log("n8n webhook sent successfully");
            }
          } catch (webhookError: any) {
            console.error("Error calling n8n webhook:", webhookError.message);
            // Don't fail the main email send if webhook fails
          }
        } else {
          console.log("No n8n webhook URL configured");
        }

        // Log successful email
        const logEntry: EmailLogEntry = {
          timestamp: new Date().toISOString(),
          to: emailTo,
          subject: emailSubject,
          success: true,
          error: null
        };
        emailLogs.push(logEntry);
        
        // Keep only last 100 logs
        if (emailLogs.length > 100) {
          emailLogs.splice(0, emailLogs.length - 100);
        }

        return new Response(
          JSON.stringify({ 
            success: true,
            message: isTestEmail 
              ? 'Test email sent successfully! Email notifications are working.'
              : 'New user registration notification sent successfully.',
            emailDetails: {
              id: emailResponse.data?.id,
              to: emailTo,
              subject: emailSubject,
              timestamp: new Date().toISOString()
            }
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      } catch (emailError: any) {
        console.error("Error sending email:", emailError);
        
        // Log failed email
        const logEntry: EmailLogEntry = {
          timestamp: new Date().toISOString(),
          to: emailTo,
          subject: emailSubject,
          success: false,
          error: emailError.message || 'Unknown error'
        };
        emailLogs.push(logEntry);
        
        return new Response(
          JSON.stringify({ 
            error: "Failed to send email notification",
            details: emailError.message || 'Unknown error'
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    // Method not allowed
    console.log(`Method ${req.method} not allowed`);
    return new Response(
      JSON.stringify({ error: `Method ${req.method} not allowed` }),
      { 
        status: 405, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error("=== UNEXPECTED ERROR ===");
    console.error("Error details:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    // Log the failed request
    const logEntry: EmailLogEntry = {
      timestamp: new Date().toISOString(),
      to: 'unknown',
      subject: 'Server Error',
      success: false,
      error: error.message || 'Unknown error'
    };
    emailLogs.push(logEntry);

    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error.message || 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(async (req) => {
  // Process pending notifications automatically on every call
  if (req.method === 'POST') {
    try {
      await processPendingNotifications();
    } catch (error) {
      console.error("Error auto-processing pending notifications:", error);
    }
  }
  
  return await handler(req);
});
