/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
  token?: string
  siteUrl?: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
  token,
  siteUrl,
}: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your {siteName} password{token ? ` — code ${token}` : ''}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandMark}>TDZ</Text>
          <Text style={brandSub}>THIRTY DARK ZERO</Text>
        </Section>

        <Heading style={h1}>Reset your password</Heading>
        <Text style={text}>
          We received a request to reset the password for your{' '}
          <strong>{siteName.toUpperCase()}</strong> account.
        </Text>

        {token && (
          <>
            <Text style={text}>Use this 6-digit code if prompted:</Text>
            <Section style={codeBox}>
              <Text style={codeText}>{token}</Text>
            </Section>
          </>
        )}

        <Text style={text}>Or click the button below to choose a new password:</Text>
        <Button style={button} href={confirmationUrl}>
          Reset Password
        </Button>

        <Text style={muted}>
          If you didn't request this, you can safely ignore this email — your
          password will stay the same.
        </Text>

        <Hr style={hr} />
        <Text style={footer}>
          {siteUrl ? siteUrl.replace(/^https?:\/\//, '') : 'thirtydarkzero.net'}
          {' · '}Made for artists, powered by participants.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const brandBar = {
  borderBottom: '2px solid #FF6347',
  paddingBottom: '12px',
  marginBottom: '28px',
}
const brandMark = {
  fontSize: '34px',
  fontWeight: 900 as const,
  letterSpacing: '4px',
  color: '#0D0D0D',
  margin: '0',
  lineHeight: 1,
}
const brandSub = {
  fontSize: '10px',
  letterSpacing: '3px',
  color: '#FF6347',
  margin: '4px 0 0',
  fontWeight: 600 as const,
}
const h1 = {
  fontSize: '24px',
  fontWeight: 700 as const,
  color: '#0D0D0D',
  margin: '0 0 16px',
}
const text = {
  fontSize: '15px',
  color: '#3a3a3a',
  lineHeight: '1.6',
  margin: '0 0 18px',
}
const codeBox = {
  backgroundColor: '#0D0D0D',
  borderRadius: '12px',
  padding: '24px',
  textAlign: 'center' as const,
  margin: '8px 0 20px',
}
const codeText = {
  fontSize: '38px',
  fontWeight: 800 as const,
  letterSpacing: '12px',
  color: '#FF6347',
  margin: 0,
  fontFamily: "'Courier New', monospace",
}
const muted = { fontSize: '13px', color: '#888888', lineHeight: '1.5', margin: '16px 0 0' }
const button = {
  backgroundColor: '#FF6347',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 700 as const,
  borderRadius: '10px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block',
}
const hr = { borderColor: '#eaeaea', margin: '28px 0 16px' }
const footer = { fontSize: '12px', color: '#999999', margin: 0, textAlign: 'center' as const }
