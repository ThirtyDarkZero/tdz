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
  releaseTitle?: string
  artistName?: string
  releaseType?: string
  trackCount?: number
  releaseUrl?: string
}

const Email = ({ releaseTitle, artistName, releaseType, trackCount, releaseUrl }: Props) => (
  <EmailShell
    preview={`${releaseTitle || 'Your release'} is live on Thirty Dark Zero`}
    kickerText="Release is live"
  >
    <Text style={h1}>IT'S LIVE</Text>
    <Text style={paragraph}>
      <strong style={{ color: '#ffffff' }}>{releaseTitle || 'Your release'}</strong>
      {artistName ? ` by ${artistName}` : ''} is now streaming on Thirty Dark Zero. Every
      intentional play from here pays you $1.
    </Text>

    <Section style={statCard}>
      <Text style={statValue}>{typeof trackCount === 'number' ? trackCount : 1}</Text>
      <Text style={statLabel}>
        {(releaseType || 'Release').toString()} · tracks earning $1 per play
      </Text>
    </Section>

    <Text style={paragraph}>
      Share your smart link, message your participants, and watch the impact land in real time.
    </Text>

    <Section style={{ margin: '26px 0 4px' }}>
      <Button href={releaseUrl || `${SITE_URL}/discover`} style={buttonStyle}>
        Listen &amp; Share
      </Button>
    </Section>
  </EmailShell>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `${data?.releaseTitle || 'Your release'} is live on Thirty Dark Zero`,
  displayName: 'Release is live',
  previewData: {
    releaseTitle: 'Last Stage Standing',
    artistName: 'Rob Hayes',
    releaseType: 'Album',
    trackCount: 9,
  },
} satisfies TemplateEntry
