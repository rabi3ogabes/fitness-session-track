/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { LuxuryEmail } from '../luxury-layout.tsx'

interface Props {
  siteName?: string
  logoUrl?: string | null
  confirmationUrl: string
  preheader?: string; heading?: string; intro?: string; body?: string
  buttonLabel?: string; footerText?: string; accentColor?: string
}

export const RecoveryEmail = (p: Props) => (
  <LuxuryEmail
    siteName={p.siteName}
    logoUrl={p.logoUrl}
    preheader={p.preheader || 'A secure link to reset your password'}
    heading={p.heading || 'Reset your password'}
    intro={p.intro || 'We received a request to reset your password.'}
    body={p.body || 'Tap the button below to choose a new password. The link will expire shortly for your security.'}
    buttonLabel={p.buttonLabel || 'Reset Password'}
    buttonUrl={p.confirmationUrl}
    footerText={p.footerText || "If you didn't request a reset, you can safely ignore this email."}
    accentColor={p.accentColor}
  />
)
export default RecoveryEmail
