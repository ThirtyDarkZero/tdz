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
} from './_layout.tsx'

interface Props {
  name?: string
}

const Email = ({ name }: Props) => (
  <EmailShell
    preview="Three things to try in Discovery on day one"
    kickerText="Tutorial · Getting started"
  >
    <Text style={h1}>YOUR FIRST HOUR ON TDZ</Text>
    <Text style={paragraph}>
      {name ? `${name}, welcome in. ` : 'Welcome in. '}
      Every play you make sends real money to the artist — a full dollar, not a fraction of a cent.
      Here's how to get the most out of it.
    </Text>

    <Section style={statCard}>
      <Text style={statLabel}>01 · Mood Morph</Text>
      <Text style={{ ...paragraph, margin: '6px 0 0', fontSize: '14px' }}>
        Describe a feeling in plain language and Discovery builds the mix around it. No genre boxes.
      </Text>
    </Section>
    <Section style={statCard}>
      <Text style={statLabel}>02 · The Live Pulse</Text>
      <Text style={{ ...paragraph, margin: '6px 0 0', fontSize: '14px' }}>
        See what the platform is listening to right now, and how much artists have earned today.
      </Text>
    </Section>
    <Section style={statCard}>
      <Text style={statLabel}>03 · Follow three artists</Text>
      <Text style={{ ...paragraph, margin: '6px 0 0', fontSize: '14px' }}>
        Following unlocks Inner Circle drops, early releases and direct updates from the artists.
      </Text>
    </Section>

    <Section style={{ margin: '26px 0 4px' }}>
      <Button href={`${SITE_URL}/discover`} style={buttonStyle}>
        Open Discovery
      </Button>
    </Section>
    <Text style={{ ...paragraph, fontSize: '13px', marginTop: '18px' }}>
      More walkthroughs at{' '}
      <a href={`${SITE_URL}/learn`} style={{ color: '#00c8ff' }}>
        thirtydarkzero.net/learn
      </a>
      .
    </Text>
  </EmailShell>
)

export const template = {
  component: Email,
  subject: 'Three things to try on TDZ today',
  displayName: 'Tutorial — discovery basics',
  previewData: { name: 'Alex' },
} satisfies TemplateEntry
