/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { LuxuryEmail } from '../luxury-layout.tsx'

interface Props {
  siteName?: string; confirmationUrl: string
  preheader?: string; heading?: string; intro?: string; body?: string
  buttonLabel?: string; footerText?: string; accentColor?: string
}
export const InviteEmail = (p: Props) => (
  <LuxuryEmail
    siteName={p.siteName}
    preheader={p.preheader || 'Your invitation is waiting'}
    heading={p.heading || "You're invited"}
    intro={p.intro || 'Welcome aboard.'}
    body={p.body || 'You have been invited to join us. Tap the button below to accept and set up your account.'}
    buttonLabel={p.buttonLabel || 'Accept Invitation'}
    buttonUrl={p.confirmationUrl}
    footerText={p.footerText || "If you weren't expecting this invitation, you can safely ignore this email."}
    accentColor={p.accentColor}
  />
)
export default InviteEmail
