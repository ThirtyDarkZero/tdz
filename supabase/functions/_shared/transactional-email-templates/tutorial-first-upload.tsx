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
}

const steps = [
  ['01', 'Open the Studio', 'Everything you release lives in one place — uploads, artwork, splits, analytics.'],
  ['02', 'Drop your audio', 'WAV or high-bitrate MP3. We generate ISRC + UPC codes for you automatically.'],
  ['03', 'Add artwork & metadata', '3000x3000 cover, genre, credits. Clean metadata = better placement.'],
  ['04', 'Publish or schedule', 'Go live instantly or pick a release date and let Autopilot handle the rollout.'],
]

const Email = ({ name }: Props) => (
  <EmailShell
    preview="Your first upload, step by step — it takes about four minutes"
    kickerText="Tutorial · Your first release"
  >
    <Text style={h1}>UPLOAD YOUR FIRST TRACK</Text>
    <Text style={paragraph}>
      {name ? `${name}, you` : 'You'}'re set up — now let's get music on the platform. Every
      intentional play on your track pays you <strong style={{ color: '#ffffff' }}>$1</strong>, so the
      fastest path to earnings is a live release.
    </Text>

    {steps.map(([n, title, body]) => (
      <Section key={n} style={statCard}>
        <Text style={{ ...statLabel, color: '#ff6347' }}>{`STEP ${n}`}</Text>
        <Text style={{ color: '#ffffff', fontSize: '16px', fontWeight: 700, margin: '6px 0 6px' }}>
          {title}
        </Text>
        <Text style={{ ...paragraph, margin: 0, fontSize: '14px' }}>{body}</Text>
      </Section>
    ))}

    <Section style={{ margin: '26px 0 4px' }}>
      <Button href={`${SITE_URL}/studio`} style={buttonStyle}>
        Start Uploading
      </Button>
    </Section>
    <Text style={{ ...paragraph, fontSize: '13px', marginTop: '18px' }}>
      Prefer to read first? The full walkthrough lives at{' '}
      <a href={`${SITE_URL}/learn`} style={{ color: '#00c8ff' }}>
        thirtydarkzero.net/learn
      </a>
      .
    </Text>
  </EmailShell>
)

export const template = {
  component: Email,
  subject: 'How to upload your first track on TDZ',
  displayName: 'Tutorial — first upload',
  previewData: { name: 'Rob' },
} satisfies TemplateEntry
