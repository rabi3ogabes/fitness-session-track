/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { LuxuryEmail } from '../luxury-layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  eventType?: string
  summary?: string
  memberName?: string
  memberEmail?: string
  details?: string
  siteName?: string
  preheader?: string; heading?: string; intro?: string; body?: string
  footerText?: string; accentColor?: string
}

const AdminNotificationEmail = (p: Props) => {
  const detailsArr: { label: string; value: string }[] = []
  if (p.eventType) detailsArr.push({ label: 'Event', value: p.eventType })
  if (p.memberName) detailsArr.push({ label: 'Member', value: p.memberName })
  if (p.memberEmail) detailsArr.push({ label: 'Email', value: p.memberEmail })
  return (
    <LuxuryEmail
      siteName={p.siteName}
      preheader={p.preheader || 'A new event needs your attention'}
      heading={p.heading || 'New activity'}
      intro={p.intro || 'A new event has occurred on your platform.'}
      body={p.body || (p.summary || 'See details below and take action from the admin dashboard.')}
      details={detailsArr.length ? detailsArr : undefined}
      extraBody={p.details}
      footerText={p.footerText || '— FHB Fit admin notifications'}
      accentColor={p.accentColor}
    />
  )
}

export const template = {
  component: AdminNotificationEmail,
  subject: 'New activity on FHB Fit',
  displayName: 'Admin notification',
  previewData: { eventType: 'booking', memberName: 'Jane', memberEmail: 'jane@example.com' },
} satisfies TemplateEntry
