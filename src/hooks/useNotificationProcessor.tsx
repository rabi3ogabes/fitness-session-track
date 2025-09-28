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
          
          // Note: notifications are now processed immediately when created
          // This listener is kept for future use or backup processing
          console.log('Notification logged - processing is now handled immediately when created');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);
};