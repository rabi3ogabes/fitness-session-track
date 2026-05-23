/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { LuxuryEmail } from '../luxury-layout.tsx'

interface Props {
  siteName?: string
  logoUrl?: string | null; confirmationUrl: string
  oldEmail?: string; newEmail?: string; email?: string
  preheader?: string; heading?: string; intro?: string; body?: string
  buttonLabel?: string; footerText?: string; accentColor?: string
}
export const EmailChangeEmail = (p: Props) => {
  const details = []
  if (p.oldEmail) details.push({ label: 'Old', value: p.oldEmail })
  if (p.newEmail) details.push({ label: 'New', value: p.newEmail })
  return (
    <LuxuryEmail
      siteName={p.siteName}
    logoUrl={p.logoUrl}
      preheader={p.preheader || 'Confirm your new email address'}
      heading={p.heading || 'Confirm new email'}
      intro={p.intro || 'Almost done.'}
      body={p.body || "Tap the button below to confirm your new email address. The change won't take effect until you confirm."}
      buttonLabel={p.buttonLabel || 'Confirm New Email'}
      buttonUrl={p.confirmationUrl}
      details={details.length ? details : undefined}
      footerText={p.footerText || "If you didn't request this change, please secure your account immediately."}
      accentColor={p.accentColor}
    />
  )
}
export default EmailChangeEmail
