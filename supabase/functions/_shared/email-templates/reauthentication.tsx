/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { LuxuryEmail } from '../luxury-layout.tsx'

interface Props {
  siteName?: string
  logoUrl?: string | null; token: string
  preheader?: string; heading?: string; intro?: string; body?: string
  footerText?: string; accentColor?: string
}
export const ReauthenticationEmail = (p: Props) => (
  <LuxuryEmail
    siteName={p.siteName}
    logoUrl={p.logoUrl}
    preheader={p.preheader || 'Your one-time verification code'}
    heading={p.heading || 'Verification code'}
    intro={p.intro || 'Use the code below to continue.'}
    body={p.body || "Enter this verification code in the application to confirm it's you."}
    code={p.token}
    footerText={p.footerText || "This code expires shortly. If you didn't request it, you can safely ignore this email."}
    accentColor={p.accentColor}
  />
)
export default ReauthenticationEmail
