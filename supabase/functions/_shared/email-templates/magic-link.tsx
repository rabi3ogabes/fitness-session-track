/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { LuxuryEmail } from '../luxury-layout.tsx'

interface Props {
  siteName?: string; confirmationUrl: string
  preheader?: string; heading?: string; intro?: string; body?: string
  buttonLabel?: string; footerText?: string; accentColor?: string
}
export const MagicLinkEmail = (p: Props) => (
  <LuxuryEmail
    siteName={p.siteName}
    preheader={p.preheader || 'Your secure sign-in link'}
    heading={p.heading || 'Your sign-in link is ready'}
    intro={p.intro || 'Tap the button below to securely sign in to your account.'}
    body={p.body || 'This link will expire shortly for your security.'}
    buttonLabel={p.buttonLabel || 'Sign In'}
    buttonUrl={p.confirmationUrl}
    footerText={p.footerText || "If you didn't request this link, you can safely ignore this email."}
    accentColor={p.accentColor}
  />
)
export default MagicLinkEmail
