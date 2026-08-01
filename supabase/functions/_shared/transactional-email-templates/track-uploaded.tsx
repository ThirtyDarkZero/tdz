/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Button, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import {
  EmailShell,
  SITE_URL,
  buttonStyle,
  h1,
  paragraph,
  statCard,
  statLabel,
  statValue,
} from './_layout.tsx'

interface Props {
  trackTitle?: string
  artistName?: string
  trackCount?: number
}

const Email = ({ trackTitle, artistName, trackCount }: Props) => (
  <EmailShell
    preview={`${trackTitle || 'Your track'} is uploaded and processing`}
    kickerText="Upload confirmed"
  >
    <Text style={h1}>UPLOAD LOCKED IN</Text>
    <Text style={paragraph}>
      {artistName ? `${artistName}, your` : 'Your'} track{' '}
      <strong style={{ color: '#ffffff' }}>{trackTitle || 'new upload'}</strong> landed on
      Thirty Dark Zero. It's processing now and will be live for listeners shortly.
    </Text>

    <Section style={statCard}>
      <Text style={statValue}>{typeof trackCount === 'number' ? trackCount : 1}</Text>
      <Text style={statLabel}>Tracks in your catalog</Text>
    </Section>

    <Text style={paragraph}>
      Next: add artwork, lyrics and territory rights in the Studio so the release hits with
      full impact.
    </Text>

    <Section style={{ margin: '26px 0 4px' }}>
      <Button href={`${SITE_URL}/studio`} style={buttonStyle}>
        Review in Studio
      </Button>
    </Section>
  </EmailShell>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `"${data?.trackTitle || 'Your track'}" is uploaded`,
  displayName: 'Track uploaded',
  previewData: { trackTitle: 'Midnight Frequency', artistName: 'Rob', trackCount: 12 },
} satisfies TemplateEntry
