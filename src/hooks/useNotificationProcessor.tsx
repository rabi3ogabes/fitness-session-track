import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export const useNotificationProcessor = () => {
  const { toast } = useToast();

  useEffect(() => {
    // Set up realtime listener for new notification logs
    const channel = supabase
      .channel('notification_logs_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_logs'
        },
        async (payload) => {
          console.log('New notification log created:', payload);
          
          // Process the notification by calling the edge function
          try {
            const { data, error } = await supabase.functions.invoke('process-pending-notifications');
            
            if (error) {
              console.error('Error processing notifications:', error);
              toast({
                title: "Notification Error",
                description: "Failed to process notification",
                variant: "destructive",
              });
            } else {
              console.log('Notifications processed:', data);
              if (data?.processed > 0) {
                toast({
                  title: "Notification Sent",
                  description: `Successfully sent ${data.processed} notification(s)`,
                });
              }
            }
          } catch (err) {
            console.error('Error calling notification processor:', err);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);
};