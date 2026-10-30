/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Button, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailShell, SITE_URL, buttonStyle, h1, paragraph } from './_layout.tsx'

interface Props {
  holderName?: string
  artistName?: string
  trackTitle?: string
  rightsType?: string
  share?: number
  confirmUrl?: string
}

const Email = ({ holderName, artistName, trackTitle, rightsType, share, confirmUrl }: Props) => (
  <EmailShell preview={`Confirm your ${share ?? ''}% split on ${trackTitle ?? 'a song'}`} kickerText="Split confirmation">
    <Text style={h1}>CONFIRM YOUR SPLIT</Text>
    <Text style={paragraph}>
      {holderName ? `Hi ${holderName}, ` : ''}{artistName || 'An artist'} listed you on{' '}
      <strong style={{ color: '#ffffff' }}>{trackTitle || 'a song'}</strong> with a{' '}
      <strong style={{ color: '#ffffff' }}>{share ?? '—'}%</strong> {rightsType || 'publishing'} share.
    </Text>
    <Text style={paragraph}>Check it and confirm, or tell them what's wrong. No account needed.</Text>
    <Section style={{ margin: '26px 0 4px' }}>
      <Button href={confirmUrl || SITE_URL} style={buttonStyle}>Review split</Button>
    </Section>
  </EmailShell>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Confirm your split on ${d?.trackTitle || 'a song'}`,
  displayName: 'Split confirmation',
  previewData: { holderName: 'Kay', artistName: 'Nova Reign', trackTitle: 'Co-write', rightsType: 'publishing', share: 33.33 },
} satisfies TemplateEntry
