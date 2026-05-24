/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { LuxuryEmail } from '../luxury-layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  eventType?: string
  summary?: string
  memberName?: string
  memberEmail?: string
  memberPhone?: string
  details?: string
  siteName?: string
  logoUrl?: string | null
  preheader?: string; heading?: string; intro?: string; body?: string
  footerText?: string; accentColor?: string
}

// Build wa.me URL: digits only, no leading +/0/spaces
const waUrl = (phone: string) => {
  const digits = (phone || '').replace(/[^\d]/g, '').replace(/^0+/, '')
  return digits ? `https://wa.me/${digits}` : ''
}

const AdminNotificationEmail = (p: Props) => {
  const detailsArr: { label: string; value: string }[] = []
  if (p.eventType) detailsArr.push({ label: 'Event', value: p.eventType })
  if (p.memberName) detailsArr.push({ label: 'Member', value: p.memberName })
  if (p.memberEmail) detailsArr.push({ label: 'Email', value: p.memberEmail })

  const wa = p.memberPhone ? waUrl(p.memberPhone) : ''
  // Render the phone as a clickable WhatsApp link via raw HTML in extraBody
  // (the details rows are plain text; extraBody is rendered as HTML below).
  const phoneHtml = p.memberPhone
    ? `<p style="margin:8px 0;font:14px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#1a1a1a">
         <strong>Phone:</strong>
         ${wa
           ? `<a href="${wa}" target="_blank" rel="noopener" style="color:#25D366;text-decoration:underline;font-weight:600">${p.memberPhone}</a>
              <span style="color:#666"> &nbsp;·&nbsp; </span>
              <a href="${wa}" target="_blank" rel="noopener" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:6px 12px;border-radius:6px;font-weight:600">Chat on WhatsApp</a>`
           : `<span>${p.memberPhone}</span>`}
       </p>`
    : ''

  const extra = [phoneHtml, p.details || ''].filter(Boolean).join('')

  return (
    <LuxuryEmail
      siteName={p.siteName}
      logoUrl={p.logoUrl}
      preheader={p.preheader || 'A new event needs your attention'}
      heading={p.heading || 'New activity'}
      intro={p.intro || 'A new event has occurred on your platform.'}
      body={p.body || (p.summary || 'See details below and take action from the admin dashboard.')}
      details={detailsArr.length ? detailsArr : undefined}
      extraBody={p.details}
      htmlBlock={phoneHtml || undefined}
      footerText={p.footerText || '— FHB Fit admin notifications'}
      accentColor={p.accentColor}
    />
  )
}

export const template = {
  component: AdminNotificationEmail,
  subject: 'New activity on FHB Fit',
  displayName: 'Admin notification',
  previewData: { eventType: 'booking', memberName: 'Jane', memberEmail: 'jane@example.com', memberPhone: '97466793776' },
} satisfies TemplateEntry

