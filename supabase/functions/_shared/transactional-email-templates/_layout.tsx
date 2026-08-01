/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

export const BRAND = {
  void: '#08081a',
  deep: '#0d0d24',
  surface: '#14142e',
  coral: '#ff6347',
  cyan: '#00c8ff',
  violet: '#8b5cf6',
  white: '#ffffff',
  dim: '#a5a5c0',
  border: '#242449',
}

export const SITE_URL = 'https://www.thirtydarkzero.net'

const main: React.CSSProperties = {
  backgroundColor: '#ffffff',
  fontFamily: "'Raleway', 'Helvetica Neue', Arial, sans-serif",
  margin: 0,
  padding: '24px 0',
}

const container: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '0 16px',
}

const panel: React.CSSProperties = {
  backgroundColor: BRAND.void,
  borderRadius: '16px',
  border: `1px solid ${BRAND.border}`,
  padding: '40px 32px',
}

const wordmark: React.CSSProperties = {
  color: BRAND.white,
  fontSize: '28px',
  letterSpacing: '6px',
  margin: '0 0 4px',
  fontWeight: 700,
}

const kicker: React.CSSProperties = {
  color: BRAND.coral,
  fontSize: '11px',
  letterSpacing: '3px',
  textTransform: 'uppercase',
  margin: '0 0 28px',
}

export const h1: React.CSSProperties = {
  color: BRAND.white,
  fontSize: '30px',
  lineHeight: '1.15',
  letterSpacing: '1px',
  margin: '0 0 14px',
  fontWeight: 700,
}

export const paragraph: React.CSSProperties = {
  color: BRAND.dim,
  fontSize: '15px',
  lineHeight: '1.7',
  margin: '0 0 16px',
}

export const buttonStyle: React.CSSProperties = {
  backgroundColor: BRAND.coral,
  color: '#ffffff',
  padding: '14px 28px',
  borderRadius: '999px',
  fontSize: '14px',
  fontWeight: 700,
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  textDecoration: 'none',
  display: 'inline-block',
}

export const statCard: React.CSSProperties = {
  backgroundColor: BRAND.surface,
  border: `1px solid ${BRAND.border}`,
  borderRadius: '12px',
  padding: '16px 18px',
  margin: '0 0 10px',
}

export const statValue: React.CSSProperties = {
  color: BRAND.cyan,
  fontSize: '30px',
  lineHeight: '1',
  margin: '0 0 4px',
  fontWeight: 700,
}

export const statLabel: React.CSSProperties = {
  color: BRAND.dim,
  fontSize: '11px',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  margin: 0,
}

const footerText: React.CSSProperties = {
  color: '#8b8ba7',
  fontSize: '11px',
  lineHeight: '1.6',
  textAlign: 'center',
  margin: '18px 0 0',
}

interface ShellProps {
  preview: string
  kickerText?: string
  children: React.ReactNode
}

export const EmailShell = ({ preview, kickerText, children }: ShellProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={panel}>
          <Text style={wordmark}>THIRTY DARK ZERO</Text>
          <Text style={kicker}>{kickerText || '$1 per intentional play'}</Text>
          {children}
          <Hr style={{ borderColor: BRAND.border, margin: '32px 0 16px' }} />
          <Text style={{ ...paragraph, fontSize: '12px', margin: 0 }}>
            <Link href={SITE_URL} style={{ color: BRAND.cyan }}>
              thirtydarkzero.net
            </Link>
          </Text>
        </Section>
        <Text style={footerText}>
          You're receiving this because you have a Thirty Dark Zero account.
        </Text>
      </Container>
    </Body>
  </Html>
)

export { Heading, Text, Section, Link }
