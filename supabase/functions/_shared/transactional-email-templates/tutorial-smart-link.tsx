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
  trackTitle?: string
}

const Email = ({ name, trackTitle }: Props) => (
  <EmailShell
    preview="Turn your release into one link that converts"
    kickerText="Tutorial · Smart links"
  >
    <Text style={h1}>MAKE YOUR RELEASE SHAREABLE</Text>
    <Text style={paragraph}>
      {name ? `Nice work, ${name}. ` : ''}
      {trackTitle ? `"${trackTitle}" is up. ` : 'Your music is up. '}
      Now the job is getting people to press play. A TDZ smart link is a single branded URL you drop
      in every bio, story and DM — and it tracks every click.
    </Text>

    <Section style={statCard}>
      <Text style={statLabel}>Where to find it</Text>
      <Text style={{ ...paragraph, margin: '6px 0 0', fontSize: '14px' }}>
        Studio → Promote → Smart Links → New Link. Pick your release, choose a slug, done.
      </Text>
    </Section>
    <Section style={statCard}>
      <Text style={statLabel}>What to do with it</Text>
      <Text style={{ ...paragraph, margin: '6px 0 0', fontSize: '14px' }}>
        Instagram bio, TikTok profile, YouTube description, email signature. One link everywhere so
        your click data stays in one place.
      </Text>
    </Section>
    <Section style={statCard}>
      <Text style={statLabel}>Why it matters</Text>
      <Text style={{ ...paragraph, margin: '6px 0 0', fontSize: '14px' }}>
        Smart link clicks feed your Momentum score, which drives placement across Discovery.
      </Text>
    </Section>

    <Section style={{ margin: '26px 0 4px' }}>
      <Button href={`${SITE_URL}/studio`} style={buttonStyle}>
        Create a Smart Link
      </Button>
    </Section>
  </EmailShell>
)

export const template = {
  component: Email,
  subject: 'Next step: turn your release into a smart link',
  displayName: 'Tutorial — smart links',
  previewData: { name: 'Rob', trackTitle: 'Nightfall' },
} satisfies TemplateEntry
