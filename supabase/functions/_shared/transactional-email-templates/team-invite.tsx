/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Button, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailShell, SITE_URL, buttonStyle, h1, paragraph } from './_layout.tsx'

interface Props {
  inviterName?: string
  kind?: 'collaborator' | 'roster'
  message?: string
  inviteUrl?: string
  expiresInDays?: number
}

const Email = ({ inviterName, kind, message, inviteUrl, expiresInDays }: Props) => {
  const who = inviterName || 'A TDZ artist'
  const roster = kind === 'roster'
  return (
    <EmailShell
      preview={roster ? `${who} wants to add you to their roster on TDZ` : `${who} invited you to their TDZ studio`}
      kickerText={roster ? 'Roster invite' : 'Team invite'}
    >
      <Text style={h1}>{roster ? 'JOIN THE ROSTER' : "YOU'RE INVITED"}</Text>
      <Text style={paragraph}>
        {roster
          ? `${who} wants to manage your music on TDZ Distribution: releases, promotion and analytics, with you keeping your $1 per play.`
          : `${who} invited you to work on their music in TDZ Studio.`}
      </Text>
      {message ? <Text style={{ ...paragraph, fontStyle: 'italic' }}>“{message}”</Text> : null}
      <Section style={{ margin: '26px 0 4px' }}>
        <Button href={inviteUrl || `${SITE_URL}/studio`} style={buttonStyle}>
          View invite
        </Button>
      </Section>
      <Text style={{ ...paragraph, fontSize: 13 }}>
        This invite expires in {expiresInDays ?? 7} days. If you weren't expecting it, you can ignore this email.
      </Text>
    </EmailShell>
  )
}

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    data?.kind === 'roster'
      ? `${data?.inviterName || 'A TDZ artist'} wants to add you to their roster`
      : `${data?.inviterName || 'A TDZ artist'} invited you to TDZ Studio`,
  displayName: 'Team invite',
  previewData: { inviterName: 'Rob Hayes', kind: 'roster', message: 'Let’s build this together.', inviteUrl: `${SITE_URL}/invite/demo` },
} satisfies TemplateEntry
