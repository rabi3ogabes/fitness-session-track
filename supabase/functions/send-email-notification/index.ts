import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.1.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

console.log("Resend API Key configured:", !!Deno.env.get("RESEND_API_KEY"));

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
}

interface EmailLogEntry {
  timestamp: string;
  to: string;
  subject: string;
  success: boolean;
  error?: string | null;
}

const emailLogs: EmailLogEntry[] = [];

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

    // Handle POST request for sending emails
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
        sessionRequestDetails 
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
      } else if (isSessionRequestNotification) {
        emailSubject = `New Session Request: ${sessionRequestDetails!.planName}`;
        emailBody = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">📋 New Session Request</h2>
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
        console.log(`From: ${fromEmail && fromName ? `${fromName} <${fromEmail}>` : "Gym Management <onboarding@resend.dev>"}`);
        console.log(`Subject: ${emailSubject}`);
        
        const emailResponse = await resend.emails.send({
          from: fromEmail && fromName ? `${fromName} <${fromEmail}>` : "Gym Management <onboarding@resend.dev>",
          to: [emailTo],
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

serve(handler);
