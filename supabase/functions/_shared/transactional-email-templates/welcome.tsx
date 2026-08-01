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
  name?: string
  role?: string
}

const Email = ({ name, role }: Props) => {
  const isArtist = role === 'artist' || role === 'verified_artist' || role === 'manager'
  return (
    <EmailShell preview="Welcome to Thirty Dark Zero — your journey starts now">
      <Text style={h1}>WELCOME{name ? `, ${name.toUpperCase()}` : ''}</Text>
      <Text style={paragraph}>
        You're in. Thirty Dark Zero is a streaming platform built on one idea: real plays
        should pay real money. Every intentional play pays artists <strong style={{ color: '#ffffff' }}>$1</strong> —
        not fractions of a cent.
      </Text>

      <Section style={statCard}>
        <Text style={statValue}>$1.00</Text>
        <Text style={statLabel}>Per intentional play</Text>
      </Section>

      <Text style={paragraph}>
        {isArtist
          ? 'Head into the Studio to upload your first release, set up payouts, and watch your impact build in real time.'
          : 'Jump into Discovery to find independent artists, build playlists, and know that your listening directly funds the people making the music.'}
      </Text>

      <Section style={{ margin: '26px 0 4px' }}>
        <Button href={isArtist ? `${SITE_URL}/studio` : `${SITE_URL}/discover`} style={buttonStyle}>
          {isArtist ? 'Open the Studio' : 'Start Listening'}
        </Button>
      </Section>
    </EmailShell>
  )
}

export const template = {
  component: Email,
  subject: 'Welcome to Thirty Dark Zero',
  displayName: 'Welcome email',
  previewData: { name: 'Rob', role: 'artist' },
} satisfies TemplateEntry
