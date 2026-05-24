/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { LuxuryEmail } from '../luxury-layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  memberName?: string
  memberPhone?: string
  dashboardUrl?: string
  siteName?: string
  logoUrl?: string | null
  preheader?: string; heading?: string; intro?: string; body?: string
  buttonLabel?: string; footerText?: string; accentColor?: string
}

const waUrl = (phone: string) => {
  const digits = (phone || '').replace(/[^\d]/g, '').replace(/^0+/, '')
  return digits ? `https://wa.me/${digits}` : ''
}

const MemberWelcomeEmail = (p: Props) => {
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
      preheader={p.preheader || 'Your membership is active'}
      heading={p.heading || 'Welcome to FHB Fit'}
      intro={p.intro || (p.memberName ? `Hi ${p.memberName},` : 'Hello,')}
      body={p.body || 'Your membership is active. You can now book classes, track sessions, and manage your account from your member dashboard.'}
      buttonLabel={p.dashboardUrl ? (p.buttonLabel || 'Go to Dashboard') : null}
      buttonUrl={p.dashboardUrl}
      htmlBlock={phoneHtml || undefined}
      footerText={p.footerText || '— The FHB Fit team'}
      accentColor={p.accentColor}
    />
  )
}

export const template = {
  component: MemberWelcomeEmail,
  subject: 'Welcome to FHB Fit',
  displayName: 'Member welcome',
  previewData: { memberName: 'Jane', dashboardUrl: 'https://fhbfit.com' },
} satisfies TemplateEntry
