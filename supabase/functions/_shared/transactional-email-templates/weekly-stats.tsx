/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Button, Column, Row, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import {
  BRAND,
  EmailShell,
  SITE_URL,
  buttonStyle,
  h1,
  paragraph,
  statCard,
  statLabel,
  statValue,
} from './_layout.tsx'

interface TopTrack {
  title: string
  plays: number
}

interface Props {
  name?: string
  plays?: number
  earnings?: number
  newFollowers?: number
  listeners?: number
  topTracks?: TopTrack[]
  weekLabel?: string
}

const money = (n?: number) =>
  `$${(typeof n === 'number' ? n : 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const Email = ({
  name,
  plays,
  earnings,
  newFollowers,
  listeners,
  topTracks,
  weekLabel,
}: Props) => (
  <EmailShell
    preview={`Your week on Thirty Dark Zero: ${plays ?? 0} plays, ${money(earnings)} earned`}
    kickerText={weekLabel || 'Weekly impact report'}
  >
    <Text style={h1}>YOUR WEEK{name ? `, ${name.toUpperCase()}` : ''}</Text>
    <Text style={paragraph}>
      Here's how your music moved over the last 7 days.
    </Text>

    <Row>
      <Column style={{ paddingRight: '6px', width: '50%' }}>
        <Section style={statCard}>
          <Text style={statValue}>{(plays ?? 0).toLocaleString('en-US')}</Text>
          <Text style={statLabel}>Intentional plays</Text>
        </Section>
      </Column>
      <Column style={{ paddingLeft: '6px', width: '50%' }}>
        <Section style={statCard}>
          <Text style={{ ...statValue, color: BRAND.coral }}>{money(earnings)}</Text>
          <Text style={statLabel}>Earned</Text>
        </Section>
      </Column>
    </Row>
    <Row>
      <Column style={{ paddingRight: '6px', width: '50%' }}>
        <Section style={statCard}>
          <Text style={statValue}>{(listeners ?? 0).toLocaleString('en-US')}</Text>
          <Text style={statLabel}>Participants</Text>
        </Section>
      </Column>
      <Column style={{ paddingLeft: '6px', width: '50%' }}>
        <Section style={statCard}>
          <Text style={statValue}>{(newFollowers ?? 0).toLocaleString('en-US')}</Text>
          <Text style={statLabel}>New follows</Text>
        </Section>
      </Column>
    </Row>

    {topTracks && topTracks.length > 0 && (
      <Section style={{ marginTop: '18px' }}>
        <Text style={{ ...statLabel, marginBottom: '10px' }}>Top tracks this week</Text>
        {topTracks.slice(0, 5).map((t, i) => (
          <Text
            key={`${t.title}-${i}`}
            style={{
              ...paragraph,
              color: '#ffffff',
              margin: '0 0 6px',
              fontSize: '14px',
            }}
          >
            {i + 1}. {t.title}{' '}
            <span style={{ color: BRAND.cyan }}>
              — {(t.plays ?? 0).toLocaleString('en-US')} plays
            </span>
          </Text>
        ))}
      </Section>
    )}

    <Section style={{ margin: '26px 0 4px' }}>
      <Button href={`${SITE_URL}/studio`} style={buttonStyle}>
        See full analytics
      </Button>
    </Section>
  </EmailShell>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `Your weekly impact: ${(data?.plays ?? 0).toLocaleString('en-US')} plays`,
  displayName: 'Weekly stats report',
  previewData: {
    name: 'Rob',
    plays: 1284,
    earnings: 1284,
    newFollowers: 63,
    listeners: 411,
    topTracks: [
      { title: 'Midnight Frequency', plays: 512 },
      { title: 'Last Stage Standing', plays: 398 },
      { title: 'Dark Zero', plays: 201 },
    ],
    weekLabel: 'Weekly impact report',
  },
} satisfies TemplateEntry
