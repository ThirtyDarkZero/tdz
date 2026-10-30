/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Button, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailShell, SITE_URL, buttonStyle, h1, paragraph } from './_layout.tsx'

interface Props { campaignName?: string; platform?: string; summary?: string }

const Email = ({ campaignName, platform, summary }: Props) => (
  <EmailShell preview={`Daily ad report: ${campaignName ?? 'your campaign'}`} kickerText="Daily ad report">
    <Text style={h1}>{(campaignName || 'YOUR CAMPAIGN').toUpperCase()}</Text>
    <Text style={{ ...paragraph, fontSize: 13 }}>{platform === 'google' ? 'Google Ads' : 'Meta (Instagram & Facebook)'}</Text>
    {(summary || '').split('\n').map((line, i) => <Text key={i} style={{ ...paragraph, margin: '0 0 8px' }}>{line}</Text>)}
    <Section style={{ margin: '20px 0 4px' }}>
      <Button href={`${SITE_URL}/studio`} style={buttonStyle}>Open campaign</Button>
    </Section>
  </EmailShell>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Ad report: ${d?.campaignName || 'your campaign'}`,
  displayName: 'Daily ad report',
  previewData: { campaignName: 'Midnight Run push', platform: 'meta', summary: 'Day 3 of 30 (test phase).\nYesterday: $12.34 spent.' },
} satisfies TemplateEntry
