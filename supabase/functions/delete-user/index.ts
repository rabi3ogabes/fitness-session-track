import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const { email, memberId } = await req.json()

    if (!email && !memberId) {
      return new Response(
        JSON.stringify({ error: 'email or memberId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result: Record<string, unknown> = {}

    // Resolve member row (so we have both id and email)
    let resolvedEmail: string | null = email ?? null
    let resolvedMemberId: number | null = memberId ?? null
    let memberName: string | null = null

    if (resolvedMemberId || resolvedEmail) {
      const q = supabaseAdmin.from('members').select('id,email,name')
      const { data: memberRow } = resolvedMemberId
        ? await q.eq('id', resolvedMemberId).maybeSingle()
        : await q.eq('email', resolvedEmail!).maybeSingle()
      if (memberRow) {
        resolvedMemberId = memberRow.id
        resolvedEmail = memberRow.email
        memberName = memberRow.name
      }
    }

    // Find auth user across paginated list
    let authUserId: string | null = null
    if (resolvedEmail) {
      let page = 1
      const perPage = 1000
      while (true) {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage })
        if (error) { console.error('listUsers error', error); break }
        const u = data.users.find((x: any) => (x.email || '').toLowerCase() === resolvedEmail!.toLowerCase())
        if (u) { authUserId = u.id; break }
        if (data.users.length < perPage) break
        page += 1
        if (page > 50) break
      }
    }

    // Delete dependent data (best-effort, log per-table errors)
    const safeDelete = async (label: string, fn: () => Promise<{ error: any }>) => {
      try {
        const { error } = await fn()
        if (error) console.warn(`delete ${label}:`, error.message)
        result[label] = error ? `error: ${error.message}` : 'ok'
      } catch (e: any) {
        console.warn(`delete ${label} threw:`, e?.message)
        result[label] = `threw: ${e?.message}`
      }
    }

    if (resolvedMemberId != null) {
      await safeDelete('bookings_by_member_id', () =>
        supabaseAdmin.from('bookings').delete().eq('member_id', resolvedMemberId!) as any
      )
      await safeDelete('session_history', () =>
        supabaseAdmin.from('session_history').delete().eq('member_id', resolvedMemberId!) as any
      )
    }

    if (authUserId) {
      await safeDelete('bookings_by_user_id', () =>
        supabaseAdmin.from('bookings').delete().eq('user_id', authUserId!) as any
      )
      await safeDelete('notification_settings', () =>
        supabaseAdmin.from('notification_settings').delete().eq('user_id', authUserId!) as any
      )
      await safeDelete('user_roles', () =>
        supabaseAdmin.from('user_roles').delete().eq('user_id', authUserId!) as any
      )
      await safeDelete('profiles', () =>
        supabaseAdmin.from('profiles').delete().eq('id', authUserId!) as any
      )
    }

    if (resolvedEmail) {
      await safeDelete('membership_requests', () =>
        supabaseAdmin.from('membership_requests').delete().eq('email', resolvedEmail!) as any
      )
      await safeDelete('notification_logs', () =>
        supabaseAdmin.from('notification_logs').delete().eq('recipient_email', resolvedEmail!) as any
      )
      await safeDelete('email_unsubscribe_tokens', () =>
        supabaseAdmin.from('email_unsubscribe_tokens').delete().eq('email', resolvedEmail!) as any
      )
    }

    if (memberName) {
      await safeDelete('payments', () =>
        supabaseAdmin.from('payments').delete().eq('member', memberName!) as any
      )
    }

    if (resolvedMemberId != null) {
      await safeDelete('members', () =>
        supabaseAdmin.from('members').delete().eq('id', resolvedMemberId!) as any
      )
    } else if (resolvedEmail) {
      await safeDelete('members', () =>
        supabaseAdmin.from('members').delete().eq('email', resolvedEmail!) as any
      )
    }

    if (authUserId) {
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(authUserId)
      if (authDeleteError) {
        console.error('auth delete error', authDeleteError)
        result['auth_user'] = `error: ${authDeleteError.message}`
      } else {
        result['auth_user'] = 'ok'
      }
    } else {
      result['auth_user'] = 'not_found'
    }

    return new Response(
      JSON.stringify({ message: 'User purge complete', result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error in delete-user function:', error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
