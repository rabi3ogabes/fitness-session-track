import { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, UserPlus, CalendarCheck, CalendarX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

type EmailKind = 'signup' | 'booking' | 'cancellation';

interface RecentEmail {
  kind: EmailKind;
  sent: boolean;
  subject: string;
  created_at: string;
  error?: string | null;
}

interface Member {
  id: number;
  name: string;
  email: string;
  created_at: string;
  membership: string;
  remaining_sessions: number;
  count_credit: boolean;
  hasRequest: boolean;
  recentEmails: RecentEmail[];
}

const kindFromType = (t: string | null | undefined): EmailKind | null => {
  if (!t) return null;
  const v = t.toLowerCase();
  if (v.includes('signup') || v.includes('welcome')) return 'signup';
  if (v.includes('cancel')) return 'cancellation';
  if (v.includes('booking')) return 'booking';
  return null;
};

const kindMeta: Record<EmailKind, { label: string; Icon: typeof UserPlus }> = {
  signup: { label: 'Signup', Icon: UserPlus },
  booking: { label: 'Booking', Icon: CalendarCheck },
  cancellation: { label: 'Cancel', Icon: CalendarX },
};

const RecentMembersWidget = () => {
  const [recentMembers, setRecentMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecentMembers = async () => {
    try {
      const { data: rawMembers } = await supabase
        .from('members')
        .select('id, name, email, created_at, membership, remaining_sessions, count_credit')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(25);

      // Dedupe by email (keep newest) so duplicate member rows don't
      // render the same signup email twice.
      const seenEmail = new Set<string>();
      const members = (rawMembers || [])
        .filter((m) => {
          const k = (m.email || '').toLowerCase();
          if (!k || seenEmail.has(k)) return false;
          seenEmail.add(k);
          return true;
        })
        .slice(0, 5);

      if (members) {
        const membersWithRequests = await Promise.all(
          members.map(async (member) => {
            const [requestsRes, logsRes] = await Promise.all([
              supabase
                .from('membership_requests')
                .select('id')
                .eq('email', member.email)
                .eq('status', 'Pending')
                .limit(1),
              supabase
                .from('notification_logs')
                .select('notification_type, status, subject, error_message, created_at')
                .eq('recipient_email', member.email)
                .order('created_at', { ascending: false })
                .limit(25),
            ]);

            const recentEmails: RecentEmail[] = [];
            const seen = new Set<EmailKind>();
            for (const log of logsRes.data || []) {
              const kind = kindFromType(log.notification_type);
              if (!kind || seen.has(kind)) continue;
              seen.add(kind);
              recentEmails.push({
                kind,
                sent: (log.status || '').toLowerCase() === 'sent',
                subject: log.subject || '',
                created_at: log.created_at,
                error: log.error_message,
              });
              if (recentEmails.length === 3) break;
            }

            return {
              ...member,
              remaining_sessions: member.remaining_sessions || 0,
              count_credit: member.count_credit ?? false,
              hasRequest: (requestsRes.data && requestsRes.data.length > 0) || false,
              recentEmails,
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

    const channel = supabase
      .channel('recent-members')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'members' },
        () => fetchRecentMembers()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notification_logs' },
        () => fetchRecentMembers()
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session Balance</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Has Request</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last 3 Emails</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentMembers.length > 0 ? (
                recentMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{member.name}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{member.email}</td>
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
                          Count Off
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
                    <td className="px-4 py-3 whitespace-nowrap">
                      {(member.recentEmails || []).length === 0 ? (
                        <span className="text-xs text-gray-400">No emails</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          {(member.recentEmails || []).map((e, i) => {
                            const { Icon, label } = kindMeta[e.kind];
                            const color = e.sent
                              ? 'text-green-600 border-green-300 bg-green-50'
                              : 'text-red-600 border-red-300 bg-red-50';
                            return (
                              <div
                                key={i}
                                className={`flex items-center gap-1 px-2 py-1 rounded-md border text-xs ${color}`}
                                title={`${label} • ${e.sent ? 'Sent' : 'Not sent'}${e.error ? ` • ${e.error}` : ''} • ${new Date(e.created_at).toLocaleString()}`}
                              >
                                <Icon className="h-3.5 w-3.5" />
                                <span className="font-medium">{label}</span>
                                {e.sent ? (
                                  <CheckCircle className="h-3.5 w-3.5" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
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
