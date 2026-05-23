/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Section, Text, Button, Hr,
} from 'npm:@react-email/components@0.0.22'

export interface LuxuryEmailProps {
  preheader?: string
  heading?: string
  intro?: string
  body?: string
  buttonLabel?: string | null
  buttonUrl?: string | null
  code?: string | null
  footerText?: string
  accentColor?: string
  siteName?: string
  logoUrl?: string | null
  details?: Array<{ label: string; value: string }>
  extraBody?: string
}

export const LuxuryEmail: React.FC<LuxuryEmailProps> = ({
  preheader,
  heading,
  intro,
  body,
  buttonLabel,
  buttonUrl,
  code,
  footerText,
  accentColor = '#c9a861',
  siteName = 'FHB Fit',
  details,
  extraBody,
}) => {
  const accent = accentColor || '#c9a861'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      {preheader && <Preview>{preheader}</Preview>}
      <Body style={main}>
        <Container style={wrapper}>
          {/* Brand bar */}
          <Section style={{ textAlign: 'center', padding: '36px 0 22px' }}>
            <Text style={{ ...brand, color: accent }}>{siteName.toUpperCase()}</Text>
            <div style={{ width: 36, height: 1, backgroundColor: accent, margin: '14px auto 0' }} />
          </Section>

          <Container style={card}>
            {heading && <Heading style={h1}>{heading}</Heading>}
            {intro && <Text style={lede}>{intro}</Text>}
            {body && <Text style={text}>{body}</Text>}

            {code && (
              <Section style={{ textAlign: 'center', margin: '28px 0' }}>
                <Text style={{ ...codeStyle, color: accent, borderColor: accent }}>{code}</Text>
              </Section>
            )}

            {buttonLabel && buttonUrl && (
              <Section style={{ textAlign: 'center', margin: '32px 0 8px' }}>
                <Button href={buttonUrl} style={{ ...button, backgroundColor: '#0f0f10' }}>
                  {buttonLabel}
                </Button>
              </Section>
            )}

            {details && details.length > 0 && (
              <Section style={{ ...detailsBox, borderLeftColor: accent }}>
                {details.map((d, i) => (
                  <Text key={i} style={detailsLine}>
                    <span style={detailsLabel}>{d.label}</span>{' '}
                    <span style={detailsValue}>{d.value}</span>
                  </Text>
                ))}
              </Section>
            )}

            {extraBody && <Text style={text}>{extraBody}</Text>}

            <Hr style={hr} />
            {footerText && <Text style={footer}>{footerText}</Text>}
          </Container>

          <Section style={{ textAlign: 'center', padding: '24px 0 40px' }}>
            <Text style={fineprint}>
              © {new Date().getFullYear()} {siteName}. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f4ef',
  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  margin: 0,
  padding: 0,
}
const wrapper = { maxWidth: 600, margin: '0 auto', padding: '0 16px' }
const card = {
  backgroundColor: '#ffffff',
  borderRadius: 4,
  padding: '44px 44px 32px',
  boxShadow: '0 1px 2px rgba(15,15,16,0.04)',
  border: '1px solid #ece8df',
}
const brand = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: 18,
  letterSpacing: '0.32em',
  margin: 0,
  fontWeight: 400,
}
const h1 = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: 30,
  fontWeight: 400,
  color: '#0f0f10',
  margin: '0 0 18px',
  lineHeight: 1.2,
  letterSpacing: '-0.01em',
}
const lede = {
  fontSize: 16,
  color: '#2a2a2c',
  lineHeight: 1.55,
  margin: '0 0 14px',
  fontWeight: 500,
}
const text = {
  fontSize: 15,
  color: '#4a4a4d',
  lineHeight: 1.65,
  margin: '0 0 14px',
}
const button = {
  color: '#ffffff',
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  borderRadius: 2,
  padding: '14px 32px',
  textDecoration: 'none',
  display: 'inline-block',
}
const codeStyle = {
  fontFamily: '"SF Mono", Menlo, Consolas, monospace',
  fontSize: 30,
  fontWeight: 600,
  letterSpacing: '0.4em',
  padding: '14px 22px',
  border: '1px solid',
  borderRadius: 4,
  display: 'inline-block',
  margin: 0,
}
const detailsBox = {
  backgroundColor: '#faf8f3',
  padding: '18px 20px',
  margin: '20px 0',
  borderLeft: '2px solid',
}
const detailsLine = { fontSize: 14, color: '#2a2a2c', margin: '0 0 6px', lineHeight: 1.5 }
const detailsLabel = { color: '#8a8a8d', fontSize: 12, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginRight: 8 }
const detailsValue = { color: '#0f0f10', fontWeight: 500 }
const hr = { borderColor: '#ece8df', margin: '28px 0 18px' }
const footer = { fontSize: 13, color: '#7a7a7d', lineHeight: 1.6, margin: 0 }
const fineprint = { fontSize: 11, color: '#9a9a9d', letterSpacing: '0.04em', margin: 0 }

export default LuxuryEmail
