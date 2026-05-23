/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { LuxuryEmail } from '../luxury-layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  memberName?: string
  dashboardUrl?: string
  siteName?: string
  logoUrl?: string | null
  preheader?: string; heading?: string; intro?: string; body?: string
  buttonLabel?: string; footerText?: string; accentColor?: string
}

const MemberWelcomeEmail = (p: Props) => (
  <LuxuryEmail
    siteName={p.siteName}
    logoUrl={p.logoUrl}
    preheader={p.preheader || 'Your membership is active'}
    heading={p.heading || 'Welcome to FHB Fit'}
    intro={p.intro || (p.memberName ? `Hi ${p.memberName},` : 'Hello,')}
    body={p.body || 'Your membership is active. You can now book classes, track sessions, and manage your account from your member dashboard.'}
    buttonLabel={p.dashboardUrl ? (p.buttonLabel || 'Go to Dashboard') : null}
    buttonUrl={p.dashboardUrl}
    footerText={p.footerText || '— The FHB Fit team'}
    accentColor={p.accentColor}
  />
)

export const template = {
  component: MemberWelcomeEmail,
  subject: 'Welcome to FHB Fit',
  displayName: 'Member welcome',
  previewData: { memberName: 'Jane', dashboardUrl: 'https://fhbfit.com' },
} satisfies TemplateEntry
