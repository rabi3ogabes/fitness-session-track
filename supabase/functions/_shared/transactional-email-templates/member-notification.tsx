/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { LuxuryEmail } from '../luxury-layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  eventType?: string
  memberName?: string
  memberPhone?: string
  className?: string
  classDate?: string
  classTime?: string
  trainerName?: string
  sessions?: number
  details?: string
  bookedByAdmin?: boolean
  // overrides
  siteName?: string
  logoUrl?: string | null
  preheader?: string; heading?: string; intro?: string; body?: string
  footerText?: string; accentColor?: string
}

const waUrl = (phone: string) => {
  const digits = (phone || '').replace(/[^\d]/g, '').replace(/^0+/, '')
  return digits ? `https://wa.me/${digits}` : ''
}

const defaults = (t?: string, name?: string, bookedByAdmin?: boolean) => {
  const greet = name ? `Hi ${name},` : 'Hello,'
  switch (t) {
    case 'booking': return {
      heading: bookedByAdmin ? 'A session has been booked for you' : 'Booking confirmed',
      intro: greet,
      body: bookedByAdmin
        ? 'Good news — our team has booked a session for you. The class details are below. We look forward to seeing you.'
        : 'Your class booking is confirmed. We look forward to training with you.',
    }
    case 'cancellation': return { heading: 'Booking cancelled', intro: greet, body: 'Your class booking has been cancelled.' }
    case 'session_request': return { heading: 'Session request received', intro: greet, body: "Thanks — we've received your request and will process it shortly." }
    case 'password_changed': return { heading: 'Password updated', intro: greet, body: 'The password on your account was just changed. If this was not you, please contact us immediately.' }
    default: return { heading: 'Notification', intro: greet, body: '' }
  }
}


const MemberNotificationEmail = (p: Props) => {
  const d = defaults(p.eventType, p.memberName, p.bookedByAdmin)

  const detailsArr: { label: string; value: string }[] = []
  if (p.className) detailsArr.push({ label: 'Class', value: p.className })
  if (p.classDate) detailsArr.push({ label: 'Date', value: p.classDate })
  if (p.classTime) detailsArr.push({ label: 'Time', value: p.classTime })
  if (p.trainerName) detailsArr.push({ label: 'Trainer', value: p.trainerName })
  if (typeof p.sessions === 'number') detailsArr.push({ label: 'Sessions', value: String(p.sessions) })

  const wa = p.memberPhone ? waUrl(p.memberPhone) : ''
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

  return (
    <LuxuryEmail
      siteName={p.siteName}
      logoUrl={p.logoUrl}
      preheader={p.preheader || d.heading}
      heading={p.heading || d.heading}
      intro={p.intro || d.intro}
      body={p.body || d.body}
      details={detailsArr.length ? detailsArr : undefined}
      extraBody={p.details}
      htmlBlock={phoneHtml || undefined}
      footerText={p.footerText || '— The FHB Fit team'}
      accentColor={p.accentColor}
    />
  )
}

export const template = {
  component: MemberNotificationEmail,
  subject: (d: Record<string, any>) => defaults(d?.eventType, d?.memberName).heading,
  displayName: 'Member notification',
  previewData: { eventType: 'booking', memberName: 'Jane', className: 'HIIT', classDate: '2026-05-25', classTime: '18:00' },
} satisfies TemplateEntry
