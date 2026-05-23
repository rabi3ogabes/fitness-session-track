/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface AdminNotificationProps {
  eventType?: string
  memberName?: string
  memberEmail?: string
  details?: string
  className?: string
  classDate?: string
  classTime?: string
  planName?: string
  sessions?: number
  price?: number
}

const labelFor = (t?: string) => {
  switch (t) {
    case 'signup': return 'New member signup'
    case 'login': return 'Member login'
    case 'booking': return 'New class booking'
    case 'cancellation': return 'Class booking cancelled'
    case 'session_request': return 'Session balance request'
    default: return 'New notification'
  }
}

const AdminNotificationEmail = ({
  eventType, memberName, memberEmail, details, className, classDate, classTime, planName, sessions, price,
}: AdminNotificationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{labelFor(eventType)}{memberName ? ` — ${memberName}` : ''}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{labelFor(eventType)}</Heading>
        {memberName && <Text style={text}><strong>Member:</strong> {memberName}</Text>}
        {memberEmail && <Text style={text}><strong>Email:</strong> {memberEmail}</Text>}
        {className && <Text style={text}><strong>Class:</strong> {className}</Text>}
        {classDate && <Text style={text}><strong>Date:</strong> {classDate}</Text>}
        {classTime && <Text style={text}><strong>Time:</strong> {classTime}</Text>}
        {planName && <Text style={text}><strong>Plan:</strong> {planName}</Text>}
        {typeof sessions === 'number' && <Text style={text}><strong>Sessions:</strong> {sessions}</Text>}
        {typeof price === 'number' && <Text style={text}><strong>Price:</strong> ${price}</Text>}
        {details && (
          <Section style={detailsBox}>
            <Text style={detailsText}>{details}</Text>
          </Section>
        )}
        <Hr style={hr} />
        <Text style={footer}>FHB Fit — admin notification</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AdminNotificationEmail,
  subject: (d: Record<string, any>) =>
    `${labelFor(d?.eventType)}${d?.memberName ? ` — ${d.memberName}` : ''}`,
  displayName: 'Admin notification',
  previewData: {
    eventType: 'booking',
    memberName: 'Jane Doe',
    memberEmail: 'jane@example.com',
    className: 'HIIT',
    classDate: '2026-05-25',
    classTime: '18:00',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.5', margin: '0 0 8px' }
const detailsBox = { backgroundColor: '#f8fafc', padding: '12px 14px', borderRadius: '8px', margin: '16px 0' }
const detailsText = { fontSize: '13px', color: '#475569', lineHeight: '1.5', margin: 0 }
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: 0 }
