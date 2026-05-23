/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { LuxuryEmail } from '../luxury-layout.tsx'

interface Props {
  siteName?: string; confirmationUrl: string
  preheader?: string; heading?: string; intro?: string; body?: string
  buttonLabel?: string; footerText?: string; accentColor?: string
}
export const SignupEmail = (p: Props) => (
  <LuxuryEmail
    siteName={p.siteName}
    preheader={p.preheader || 'Confirm your email address'}
    heading={p.heading || 'Welcome'}
    intro={p.intro || 'One last step before you begin.'}
    body={p.body || 'Tap the button below to confirm your email address and activate your account.'}
    buttonLabel={p.buttonLabel || 'Confirm Email'}
    buttonUrl={p.confirmationUrl}
    footerText={p.footerText || "If you didn't create this account, you can safely ignore this email."}
    accentColor={p.accentColor}
  />
)
export default SignupEmail
