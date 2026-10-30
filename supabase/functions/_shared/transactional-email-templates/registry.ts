/// <reference types="npm:@types/react@18.3.1" />
import type * as React from 'npm:react@18.3.1'

import { template as welcome } from './welcome.tsx'
import { template as trackUploaded } from './track-uploaded.tsx'
import { template as releaseLive } from './release-live.tsx'
import { template as weeklyStats } from './weekly-stats.tsx'
import { template as tutorialFirstUpload } from './tutorial-first-upload.tsx'
import { template as tutorialSmartLink } from './tutorial-smart-link.tsx'
import { template as tutorialPayouts } from './tutorial-payouts.tsx'
import { template as tutorialDiscovery } from './tutorial-discovery.tsx'
import { template as teamInvite } from './team-invite.tsx'
import { template as splitConfirm } from './split-confirm.tsx'

export interface TemplateEntry {
  // deno-lint-ignore no-explicit-any
  component: React.ComponentType<any>
  // deno-lint-ignore no-explicit-any
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  // deno-lint-ignore no-explicit-any
  previewData?: Record<string, any>
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  welcome,
  'track-uploaded': trackUploaded,
  'release-live': releaseLive,
  'weekly-stats': weeklyStats,
  'tutorial-first-upload': tutorialFirstUpload,
  'tutorial-smart-link': tutorialSmartLink,
  'tutorial-payouts': tutorialPayouts,
  'tutorial-discovery': tutorialDiscovery,
  'team-invite': teamInvite,
  'split-confirm': splitConfirm,
}
