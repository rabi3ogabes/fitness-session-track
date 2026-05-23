/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { LuxuryEmail } from '../luxury-layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  eventType?: string
  memberName?: string
  className?: string
  classDate?: string
  classTime?: string
  trainerName?: string
  sessions?: number
  details?: string
  // overrides
  siteName?: string
  logoUrl?: string | null
  preheader?: string; heading?: string; intro?: string; body?: string
  footerText?: string; accentColor?: string
}

const defaults = (t?: string, name?: string) => {
  const greet = name ? `Hi ${name},` : 'Hello,'
  switch (t) {
    case 'booking': return { heading: 'Booking confirmed', intro: greet, body: 'Your class booking is confirmed. We look forward to training with you.' }
    case 'cancellation': return { heading: 'Booking cancelled', intro: greet, body: 'Your class booking has been cancelled.' }
    case 'session_request': return { heading: 'Session request received', intro: greet, body: "Thanks — we've received your request and will process it shortly." }
    case 'password_changed': return { heading: 'Password updated', intro: greet, body: 'The password on your account was just changed. If this was not you, please contact us immediately.' }
    default: return { heading: 'Notification', intro: greet, body: '' }
  }
}

const MemberNotificationEmail = (p: Props) => {
  const d = defaults(p.eventType, p.memberName)
  const detailsArr: { label: string; value: string }[] = []
  if (p.className) detailsArr.push({ label: 'Class', value: p.className })
  if (p.classDate) detailsArr.push({ label: 'Date', value: p.classDate })
  if (p.classTime) detailsArr.push({ label: 'Time', value: p.classTime })
  if (p.trainerName) detailsArr.push({ label: 'Trainer', value: p.trainerName })
  if (typeof p.sessions === 'number') detailsArr.push({ label: 'Sessions', value: String(p.sessions) })

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
