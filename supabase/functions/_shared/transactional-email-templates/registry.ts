/// <reference types="npm:@types/react@18.3.1" />
import type * as React from 'npm:react@18.3.1'

import { template as welcome } from './welcome.tsx'
import { template as trackUploaded } from './track-uploaded.tsx'
import { template as releaseLive } from './release-live.tsx'
import { template as weeklyStats } from './weekly-stats.tsx'

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
}
