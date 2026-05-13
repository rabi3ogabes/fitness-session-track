import { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, Mail, MailX, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface Member {
  id: number;
  name: string;
  email: string;
  created_at: string;
  membership: string;
  remaining_sessions: number;
  count_credit: boolean;
  hasRequest: boolean;
  webhookStatus: 'success' | 'failed' | 'pending';
  webhookError?: string | null;
  webhookStatusCode?: number | null;
}

const RecentMembersWidget = () => {
  const [recentMembers, setRecentMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecentMembers = async () => {
    try {
      // First get recent members with their session data
      const { data: members } = await supabase
        .from('members')
        .select('id, name, email, created_at, membership, remaining_sessions, count_credit')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (members) {
        // For each member, check pending requests + last signup webhook delivery
        const membersWithRequests = await Promise.all(
          members.map(async (member) => {
            const [requestsRes, webhookRes] = await Promise.all([
              supabase
                .from('membership_requests')
                .select('id')
                .eq('email', member.email)
                .eq('status', 'Pending')
                .limit(1),
              supabase
                .from('webhook_delivery_logs')
                .select('success, status_code, error_message, response_body, created_at')
                .eq('webhook_type', 'signup')
                .filter('payload->>email', 'eq', member.email)
                .order('created_at', { ascending: false })
                .limit(1),
            ]);

            const requests = requestsRes.data;
            const log = webhookRes.data?.[0];
            let webhookStatus: 'success' | 'failed' | 'pending' = 'pending';
            if (log) webhookStatus = log.success ? 'success' : 'failed';

            return {
              ...member,
              remaining_sessions: member.remaining_sessions || 0,
              count_credit: member.count_credit ?? false,
              hasRequest: (requests && requests.length > 0) || false,
              webhookStatus,
              webhookError: log?.error_message || log?.response_body || null,
              webhookStatusCode: log?.status_code ?? null,
            };
          })
        );

        setRecentMembers(membersWithRequests);
      }
    } catch (error) {
      console.error('Error fetching recent members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentMembers();

    // Set up real-time subscription for new members
    const channel = supabase
      .channel('recent-members')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'members'
        },
        () => {
          fetchRecentMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recent Members
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Recent Members
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Session Balance
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Has Request
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentMembers.length > 0 ? (
                recentMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{member.name}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {member.email}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {new Date(member.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {member.count_credit ? (
                        <Badge variant="outline" className="text-blue-800 border-blue-300">
                          {member.remaining_sessions} sessions
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500 border-gray-300">
                          Count Credit Off
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        {member.hasRequest ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No recent members found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentMembersWidget;