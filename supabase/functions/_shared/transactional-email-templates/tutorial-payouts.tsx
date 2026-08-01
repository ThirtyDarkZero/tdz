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

const Email = ({ name }: Props) => (
  <EmailShell
    preview="Your payout account is connected — here's exactly how you get paid"
    kickerText="Tutorial · Getting paid"
  >
    <Text style={h1}>HOW YOUR PAYOUTS WORK</Text>
    <Text style={paragraph}>
      {name ? `${name}, your` : 'Your'} payout account is connected. Here's the whole mechanic, with
      nothing hidden.
    </Text>

    <Section style={statCard}>
      <Text style={statValue}>$1.00</Text>
      <Text style={statLabel}>Per qualified intentional play</Text>
    </Section>

    <Section style={statCard}>
      <Text style={statLabel}>What counts</Text>
      <Text style={{ ...paragraph, margin: '6px 0 0', fontSize: '14px' }}>
        A play from an active paid subscriber, listened past 30 seconds (or half the track), with the
        tab in focus. Self-plays never count.
      </Text>
    </Section>
    <Section style={statCard}>
      <Text style={statLabel}>When it lands</Text>
      <Text style={{ ...paragraph, margin: '6px 0 0', fontSize: '14px' }}>
        Balances pay out automatically once you cross <strong style={{ color: '#ffffff' }}>$50</strong>.
        Transfers run hourly, straight to your connected bank account.
      </Text>
    </Section>
    <Section style={statCard}>
      <Text style={statLabel}>Where to watch it</Text>
      <Text style={{ ...paragraph, margin: '6px 0 0', fontSize: '14px' }}>
        Studio → Earnings shows live balance, pending transfers and every payout's status.
      </Text>
    </Section>

    <Section style={{ margin: '26px 0 4px' }}>
      <Button href={`${SITE_URL}/studio`} style={buttonStyle}>
        View Your Earnings
      </Button>
    </Section>
  </EmailShell>
)

export const template = {
  component: Email,
  subject: 'Your TDZ payouts, explained',
  displayName: 'Tutorial — payouts',
  previewData: { name: 'Rob' },
} satisfies TemplateEntry
