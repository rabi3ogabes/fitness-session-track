/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface MemberWelcomeProps {
  name?: string
}

const MemberWelcomeEmail = ({ name }: MemberWelcomeProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to FHB Fit</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{name ? `Welcome, ${name}!` : 'Welcome to FHB Fit!'}</Heading>
        <Text style={text}>
          Your account is ready. You can now book classes and manage your sessions from your dashboard.
        </Text>
        <Text style={text}>See you in the gym 💪</Text>
        <Text style={footer}>— The FHB Fit team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: MemberWelcomeEmail,
  subject: 'Welcome to FHB Fit',
  displayName: 'Member welcome',
  previewData: { name: 'Jane' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: '0 0 12px' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '24px 0 0' }
