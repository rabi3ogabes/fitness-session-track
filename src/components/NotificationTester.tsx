import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface TestResult {
  type: 'signup' | 'booking' | 'session_request';
  status: 'pending' | 'success' | 'error';
  message: string;
}

export const NotificationTester: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const updateTestResult = (type: TestResult['type'], status: TestResult['status'], message: string) => {
    setTestResults(prev => {
      const filtered = prev.filter(r => r.type !== type);
      return [...filtered, { type, status, message }];
    });
  };

  const testSignupNotification = async () => {
    updateTestResult('signup', 'pending', 'Testing signup notification...');
    
    try {
      const { data: adminSettings } = await supabase
        .from('admin_notification_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!adminSettings?.signup_notifications) {
        throw new Error('Signup notifications are disabled in admin settings');
      }

      const response = await supabase.functions.invoke('send-email-notification', {
        body: {
          type: 'signup',
          notificationEmail: adminSettings.notification_email,
          userEmail: 'test.member@example.com',
          userName: 'Test Member',
          details: 'Test signup notification from NotificationTester'
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to send signup notification');
      }

      updateTestResult('signup', 'success', 'Signup notification sent successfully!');
    } catch (error: any) {
      updateTestResult('signup', 'error', `Signup notification failed: ${error.message}`);
    }
  };

  const testBookingNotification = async () => {
    updateTestResult('booking', 'pending', 'Testing booking notification...');
    
    try {
      const { data: adminSettings } = await supabase
        .from('admin_notification_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!adminSettings?.booking_notifications) {
        throw new Error('Booking notifications are disabled in admin settings');
      }

      const response = await supabase.functions.invoke('send-email-notification', {
        body: {
          type: 'booking',
          notificationEmail: adminSettings.notification_email,
          userEmail: 'test.member@example.com',
          userName: 'Test Member',
          details: 'Class: Test Yoga Class at 09:00 AM'
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to send booking notification');
      }

      updateTestResult('booking', 'success', 'Booking notification sent successfully!');
    } catch (error: any) {
      updateTestResult('booking', 'error', `Booking notification failed: ${error.message}`);
    }
  };

  const testSessionRequestNotification = async () => {
    updateTestResult('session_request', 'pending', 'Testing session request notification...');
    
    try {
      const { data: adminSettings } = await supabase
        .from('admin_notification_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!adminSettings?.session_request_notifications) {
        throw new Error('Session request notifications are disabled in admin settings');
      }

      const response = await supabase.functions.invoke('send-email-notification', {
        body: {
          type: 'session_request',
          notificationEmail: adminSettings.notification_email,
          userEmail: 'test.member@example.com',
          userName: 'Test Member',
          details: 'Requested 10 sessions of type: Premium Membership'
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to send session request notification');
      }

      updateTestResult('session_request', 'success', 'Session request notification sent successfully!');
    } catch (error: any) {
      updateTestResult('session_request', 'error', `Session request notification failed: ${error.message}`);
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      await testSignupNotification();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay between tests
      
      await testBookingNotification();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await testSessionRequestNotification();
      
      toast({
        title: "Tests Completed",
        description: "All notification tests have been executed. Check the results below.",
      });
    } catch (error) {
      toast({
        title: "Test Error",
        description: "An error occurred while running tests.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🧪 Email Notification Tester</CardTitle>
        <CardDescription>
          Test all three email notification types to verify they're working properly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-3 flex-wrap">
          <Button onClick={testSignupNotification} disabled={isLoading} variant="outline">
            Test Signup Notification
          </Button>
          <Button onClick={testBookingNotification} disabled={isLoading} variant="outline">
            Test Booking Notification
          </Button>
          <Button onClick={testSessionRequestNotification} disabled={isLoading} variant="outline">
            Test Session Request
          </Button>
          <Button onClick={runAllTests} disabled={isLoading} className="ml-auto">
            {isLoading ? 'Running Tests...' : 'Run All Tests'}
          </Button>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Test Results:</h3>
            {testResults.map((result) => (
              <div
                key={result.type}
                className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <div className="font-medium capitalize">
                      {result.type.replace('_', ' ')} Notification
                    </div>
                    <div className="text-sm">{result.message}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2">📋 Test Checklist</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>✅ <strong>Signup Notifications:</strong> Triggered when new users register</p>
            <p>✅ <strong>Booking Notifications:</strong> Triggered when members book classes</p>
            <p>✅ <strong>Session Request Notifications:</strong> Triggered when members request additional sessions</p>
            <p className="mt-2 font-medium">All notifications will be sent to: <code className="bg-blue-100 px-1 rounded">rabii.gym@gmail.com</code></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};