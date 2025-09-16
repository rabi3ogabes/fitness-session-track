import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { QrCode, Smartphone, CheckCircle, AlertCircle, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface WhatsAppSession {
  sessionId: string;
  phoneNumber: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  qrCode?: string;
  lastActivity?: string;
}

const WhatsAppQRScanner = () => {
  const [session, setSession] = useState<WhatsAppSession | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load existing session from localStorage
    const savedSession = localStorage.getItem('whatsappSession');
    if (savedSession) {
      setSession(JSON.parse(savedSession));
    }
  }, []);

  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-qr-session', {
        body: {
          action: 'generate_qr'
        }
      });

      if (error) throw error;

      const newSession: WhatsAppSession = {
        sessionId: data.sessionId,
        phoneNumber: '',
        status: 'connecting',
        qrCode: data.qrCode,
        lastActivity: new Date().toISOString()
      };

      setSession(newSession);
      localStorage.setItem('whatsappSession', JSON.stringify(newSession));
      
      // Start polling for connection status
      pollConnectionStatus(data.sessionId);

      toast({
        title: "QR Code Generated",
        description: "Scan the QR code with your WhatsApp mobile app to connect.",
      });
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const pollConnectionStatus = async (sessionId: string) => {
    setIsConnecting(true);
    const maxAttempts = 30; // Poll for 5 minutes (30 * 10 seconds)
    let attempts = 0;

    const poll = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('whatsapp-qr-session', {
          body: {
            action: 'check_status',
            sessionId: sessionId
          }
        });

        if (error) throw error;

        if (data.status === 'connected') {
          const updatedSession: WhatsAppSession = {
            ...session!,
            status: 'connected',
            phoneNumber: data.phoneNumber,
            lastActivity: new Date().toISOString()
          };
          
          setSession(updatedSession);
          localStorage.setItem('whatsappSession', JSON.stringify(updatedSession));
          setIsConnecting(false);
          
          toast({
            title: "WhatsApp Connected",
            description: `Successfully connected with number: ${data.phoneNumber}`,
          });
          return;
        }

        if (data.status === 'error') {
          throw new Error(data.message || 'Connection failed');
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Poll every 10 seconds
        } else {
          setIsConnecting(false);
          toast({
            title: "Connection Timeout",
            description: "QR code scanning timed out. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Failed to check connection status:', error);
        setIsConnecting(false);
        const updatedSession: WhatsAppSession = {
          ...session!,
          status: 'error'
        };
        setSession(updatedSession);
        localStorage.setItem('whatsappSession', JSON.stringify(updatedSession));
        
        toast({
          title: "Connection Error",
          description: "Failed to connect WhatsApp. Please try again.",
          variant: "destructive",
        });
      }
    };

    poll();
  };

  const disconnect = async () => {
    if (!session) return;

    try {
      await supabase.functions.invoke('whatsapp-qr-session', {
        body: {
          action: 'disconnect',
          sessionId: session.sessionId
        }
      });

      setSession(null);
      localStorage.removeItem('whatsappSession');
      
      toast({
        title: "WhatsApp Disconnected",
        description: "Successfully disconnected from WhatsApp.",
      });
    } catch (error) {
      console.error('Failed to disconnect:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = () => {
    if (!session) return null;

    const statusConfig = {
      connecting: { variant: "secondary" as const, icon: QrCode, text: "Connecting" },
      connected: { variant: "default" as const, icon: CheckCircle, text: "Connected" },
      disconnected: { variant: "outline" as const, icon: AlertCircle, text: "Disconnected" },
      error: { variant: "destructive" as const, icon: AlertCircle, text: "Error" }
    };

    const config = statusConfig[session.status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              WhatsApp Web Connection
            </CardTitle>
            <CardDescription>
              Connect your WhatsApp to send messages directly from the admin panel
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!session || session.status === 'error' ? (
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Click the button below to generate a QR code and connect your WhatsApp account
            </p>
            <Button 
              onClick={generateQRCode} 
              disabled={isGenerating}
              className="w-full"
            >
              <QrCode className="h-4 w-4 mr-2" />
              {isGenerating ? "Generating..." : "Generate QR Code"}
            </Button>
          </div>
        ) : session.status === 'connecting' ? (
          <div className="text-center space-y-4">
            {session.qrCode && (
              <div className="flex justify-center">
                <div 
                  className="bg-white p-4 rounded-lg border inline-block"
                  dangerouslySetInnerHTML={{ __html: session.qrCode }}
                />
              </div>
            )}
            <div className="space-y-2">
              <p className="font-medium">Scan this QR code with WhatsApp</p>
              <p className="text-sm text-muted-foreground">
                1. Open WhatsApp on your phone<br/>
                2. Go to Menu → Linked Devices<br/>
                3. Tap "Link a Device"<br/>
                4. Scan this QR code
              </p>
              {isConnecting && (
                <p className="text-sm text-blue-600">
                  Waiting for connection... This may take a few moments.
                </p>
              )}
            </div>
            <Button 
              variant="outline" 
              onClick={generateQRCode}
              disabled={isGenerating}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Regenerate QR Code
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div>
                <p className="font-medium text-green-800">
                  WhatsApp Connected
                </p>
                <p className="text-sm text-green-600">
                  Phone: {session.phoneNumber}
                </p>
                {session.lastActivity && (
                  <p className="text-xs text-green-500">
                    Last activity: {new Date(session.lastActivity).toLocaleString()}
                  </p>
                )}
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Your WhatsApp is now connected and ready to send messages. You can send notifications
                directly from the admin panel.
              </p>
            </div>
            
            <Button 
              variant="destructive" 
              onClick={disconnect}
              className="w-full"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Disconnect WhatsApp
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WhatsAppQRScanner;