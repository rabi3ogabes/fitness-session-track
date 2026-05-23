/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface MemberNotificationProps {
  eventType?: string
  memberName?: string
  className?: string
  classDate?: string
  classTime?: string
  trainerName?: string
  sessions?: number
  details?: string
}

const titleFor = (t?: string, name?: string) => {
  const greet = name ? `Hi ${name},` : 'Hello,'
  switch (t) {
    case 'booking': return { title: 'Booking confirmed', greet, body: 'Your class booking is confirmed. We look forward to seeing you!' }
    case 'cancellation': return { title: 'Booking cancelled', greet, body: 'Your class booking has been cancelled.' }
    case 'session_request': return { title: 'Session request received', greet, body: 'We received your session request and will process it shortly.' }
    default: return { title: 'Notification', greet, body: '' }
  }
}

const MemberNotificationEmail = ({
  eventType, memberName, className, classDate, classTime, trainerName, sessions, details,
}: MemberNotificationProps) => {
  const { title, greet, body } = titleFor(eventType, memberName)
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{title}</Heading>
          <Text style={text}>{greet}</Text>
          <Text style={text}>{body}</Text>
          {(className || classDate || classTime || trainerName || typeof sessions === 'number') && (
            <Section style={detailsBox}>
              {className && <Text style={detailsText}><strong>Class:</strong> {className}</Text>}
              {classDate && <Text style={detailsText}><strong>Date:</strong> {classDate}</Text>}
              {classTime && <Text style={detailsText}><strong>Time:</strong> {classTime}</Text>}
              {trainerName && <Text style={detailsText}><strong>Trainer:</strong> {trainerName}</Text>}
              {typeof sessions === 'number' && <Text style={detailsText}><strong>Sessions:</strong> {sessions}</Text>}
            </Section>
          )}
          {details && <Text style={text}>{details}</Text>}
          <Hr style={hr} />
          <Text style={footer}>— The FHB Fit team</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: MemberNotificationEmail,
  subject: (d: Record<string, any>) => titleFor(d?.eventType, d?.memberName).title,
  displayName: 'Member notification',
  previewData: {
    eventType: 'booking',
    memberName: 'Jane',
    className: 'HIIT',
    classDate: '2026-05-25',
    classTime: '18:00',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: '0 0 12px' }
const detailsBox = { backgroundColor: '#f8fafc', padding: '14px 16px', borderRadius: '8px', margin: '16px 0' }
const detailsText = { fontSize: '13px', color: '#475569', lineHeight: '1.5', margin: '0 0 4px' }
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: 0 }
