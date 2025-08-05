import { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Payment {
  id: number;
  member: string;
  amount: number;
  date: string;
  status: string;
  membership: string;
  created_at: string;
}

const RecentPaymentsWidget = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecentPayments = async () => {
    try {
      const { data } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) {
        setPayments(data);
      }
    } catch (error) {
      console.error('Error fetching recent payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentPayments();

    // Set up real-time subscription for payments
    const channel = supabase
      .channel('recent-payments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments'
        },
        () => {
          fetchRecentPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Recent Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Recent Payments
        </CardTitle>
        <a href="/admin/payments" className="text-sm text-primary hover:underline">
          View All
        </a>
      </CardHeader>
      <CardContent>
        {payments.length > 0 ? (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div key={payment.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex-1">
                  <p className="font-medium">{payment.member}</p>
                  <p className="text-sm text-muted-foreground">{payment.membership}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(payment.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-semibold">QAR {payment.amount}</p>
                  <Badge className={`text-xs ${getStatusColor(payment.status)}`}>
                    {payment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            No recent payments
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentPaymentsWidget;