import "../_shared/fetchTimeout.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const AI_GATEWAY = 'https://ai.gateway.lovable.dev/v1/chat/completions';

interface DistributionRequest {
  action: 'analyze' | 'enrich' | 'validate' | 'optimize' | 'full-pipeline';
  trackId?: string;
  trackIds?: string[];
  metadata?: {
    title?: string;
    artistName?: string;
    genre?: string;
    lyrics?: string;
    duration?: number;
    audioQuality?: string;
    fileName?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) throw new Error('Unauthorized');

    const body: DistributionRequest = await req.json();
    const { action, trackId, trackIds, metadata } = body;

    console.log(`Quantum Distribution: ${action} for user ${user.id}`);

    let result: any;

    switch (action) {
      case 'analyze':
        result = await analyzeTrack(metadata);
        break;
      case 'enrich':
        result = await enrichMetadata(metadata, supabase, trackId);
        break;
      case 'validate':
        if (!trackId && !trackIds?.[0]) throw new Error('trackId required for validation');
        result = await validateDistribution(supabase, trackId || trackIds![0], user.id);
        break;
      case 'optimize':
        if (!trackId) throw new Error('trackId required for optimization');
        result = await optimizeRelease(supabase, trackId, user.id);
        break;
      case 'full-pipeline':
        if (!trackId) throw new Error('trackId required for full pipeline');
        result = await fullPipeline(supabase, trackId, user.id, metadata);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Quantum Distribution error:', error);
    
    const status = error instanceof Error && error.message.includes('Unauthorized') ? 401 :
                   error instanceof Error && error.message.includes('Rate limit') ? 429 : 500;

    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Distribution analysis failed'
    }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function callAI(messages: any[], tools?: any[], toolChoice?: any) {
  const body: any = {
    model: 'google/gemini-2.5-flash',
    messages,
    temperature: 0.7
  };

  if (tools) {
    body.tools = tools;
    if (toolChoice) body.tool_choice = toolChoice;
  }

  const response = await fetch(AI_GATEWAY, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error('Rate limit exceeded');
    if (response.status === 402) throw new Error('Payment required');
    throw new Error(`AI Gateway error: ${response.status}`);
  }

  return response.json();
}

async function analyzeTrack(metadata: any) {
  const systemPrompt = `You are the Quantum Distribution Intelligence, an expert music industry AI. 
Analyze the provided track metadata and provide comprehensive insights for optimal distribution.
Consider genre classification, market positioning, audience targeting, and release strategy.`;

  const userPrompt = `Analyze this track for distribution:
Title: ${metadata?.title || 'Unknown'}
Artist: ${metadata?.artistName || 'Unknown'}
Genre: ${metadata?.genre || 'Not specified'}
Duration: ${metadata?.duration ? `${Math.floor(metadata.duration / 60)}:${(metadata.duration % 60).toString().padStart(2, '0')}` : 'Unknown'}
Audio Quality: ${metadata?.audioQuality || 'standard'}
${metadata?.lyrics ? `Lyrics Preview: ${metadata.lyrics.slice(0, 500)}...` : ''}

Provide detailed analysis including:
1. Genre classification confidence and sub-genres
2. Mood and energy analysis
3. Target audience demographics
4. Similar artists and market positioning
5. Optimal release timing suggestions
6. Platform prioritization (Spotify, Apple Music, etc.)
7. Marketing angle recommendations`;

  const tools = [{
    type: 'function',
    function: {
      name: 'track_analysis',
      description: 'Comprehensive track analysis for distribution',
      parameters: {
        type: 'object',
        properties: {
          primaryGenre: { type: 'string' },
          subGenres: { type: 'array', items: { type: 'string' } },
          mood: { type: 'string', enum: ['energetic', 'melancholic', 'uplifting', 'aggressive', 'calm', 'romantic', 'dark', 'playful'] },
          energy: { type: 'number', minimum: 1, maximum: 10 },
          bpmEstimate: { type: 'number' },
          keyEstimate: { type: 'string' },
          targetAudience: {
            type: 'object',
            properties: {
              ageRange: { type: 'string' },
              demographics: { type: 'array', items: { type: 'string' } },
              listeningContexts: { type: 'array', items: { type: 'string' } }
            }
          },
          similarArtists: { type: 'array', items: { type: 'string' }, maxItems: 5 },
          marketPositioning: { type: 'string' },
          releaseTimingScore: {
            type: 'object',
            properties: {
              friday: { type: 'number', minimum: 1, maximum: 10 },
              holiday: { type: 'number', minimum: 1, maximum: 10 },
              summer: { type: 'number', minimum: 1, maximum: 10 }
            }
          },
          platformPriority: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                platform: { type: 'string' },
                priority: { type: 'number', minimum: 1, maximum: 10 },
                reason: { type: 'string' }
              }
            }
          },
          marketingAngles: { type: 'array', items: { type: 'string' } },
          distributionReadiness: { type: 'number', minimum: 0, maximum: 100 },
          recommendations: { type: 'array', items: { type: 'string' } }
        },
        required: ['primaryGenre', 'mood', 'energy', 'distributionReadiness']
      }
    }
  }];

  const result = await callAI(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    tools,
    { type: 'function', function: { name: 'track_analysis' } }
  );

  const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall?.function?.arguments) {
    return {
      success: true,
      analysis: JSON.parse(toolCall.function.arguments),
      timestamp: new Date().toISOString()
    };
  }

  throw new Error('Failed to parse AI analysis');
}

async function enrichMetadata(metadata: any, supabase: any, trackId?: string) {
  const systemPrompt = `You are the Quantum Metadata Enrichment Engine. 
Generate professional, industry-standard metadata for music distribution.
Ensure all suggestions are appropriate for major streaming platforms.`;

  const userPrompt = `Enrich metadata for this track:
Title: ${metadata?.title || 'Unknown'}
Artist: ${metadata?.artistName || 'Unknown'}
Current Genre: ${metadata?.genre || 'Not specified'}
${metadata?.lyrics ? `Lyrics: ${metadata.lyrics.slice(0, 1000)}` : ''}

Generate:
1. Optimized title (if needed)
2. Professional genre tags (primary + secondary)
3. Mood tags for playlist placement
4. AI-generated description for stores
5. Suggested hashtags for social media
6. Language detection
7. Explicit content flag recommendation
8. Recommended ISRC format`;

  const tools = [{
    type: 'function',
    function: {
      name: 'metadata_enrichment',
      description: 'Enrich track metadata for professional distribution',
      parameters: {
        type: 'object',
        properties: {
          optimizedTitle: { type: 'string' },
          primaryGenre: { type: 'string' },
          secondaryGenres: { type: 'array', items: { type: 'string' }, maxItems: 3 },
          moodTags: { type: 'array', items: { type: 'string' }, maxItems: 5 },
          storeDescription: { type: 'string', maxLength: 500 },
          socialHashtags: { type: 'array', items: { type: 'string' }, maxItems: 10 },
          detectedLanguage: { type: 'string' },
          isExplicit: { type: 'boolean' },
          explicitReason: { type: 'string' },
          suggestedKeywords: { type: 'array', items: { type: 'string' } },
          playlistSuggestions: { type: 'array', items: { type: 'string' }, maxItems: 5 }
        },
        required: ['primaryGenre', 'moodTags', 'storeDescription', 'isExplicit']
      }
    }
  }];

  const result = await callAI(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    tools,
    { type: 'function', function: { name: 'metadata_enrichment' } }
  );

  const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall?.function?.arguments) {
    const enrichment = JSON.parse(toolCall.function.arguments);

    // Update track if trackId provided
    if (trackId) {
      await supabase
        .from('tracks')
        .update({
          ai_tags: enrichment.moodTags,
          mood: enrichment.moodTags?.[0],
          genre: enrichment.primaryGenre,
          is_explicit: enrichment.isExplicit
        })
        .eq('id', trackId);
    }

    return {
      success: true,
      enrichment,
      applied: !!trackId,
      timestamp: new Date().toISOString()
    };
  }

  throw new Error('Failed to parse AI enrichment');
}

async function validateDistribution(supabase: any, trackId: string, userId: string) {
  // Fetch track with all required fields
  const { data: track, error } = await supabase
    .from('tracks')
    .select('*')
    .eq('id', trackId)
    .eq('user_id', userId)
    .single();

  if (error || !track) {
    throw new Error('Track not found');
  }

  const validationResults = {
    trackId,
    isValid: true,
    score: 100,
    checks: [] as any[],
    blockers: [] as string[],
    warnings: [] as string[],
    suggestions: [] as string[]
  };

  // Required field checks (blockers)
  const requiredFields = [
    { field: 'title', label: 'Track Title' },
    { field: 'artist_name', label: 'Artist Name' },
    { field: 'file_path', label: 'Audio File' },
    { field: 'duration', label: 'Duration' }
  ];

  for (const { field, label } of requiredFields) {
    const hasValue = !!track[field];
    validationResults.checks.push({
      field,
      label,
      status: hasValue ? 'pass' : 'fail',
      required: true
    });
    if (!hasValue) {
      validationResults.blockers.push(`Missing required: ${label}`);
      validationResults.score -= 25;
      validationResults.isValid = false;
    }
  }

  // Recommended field checks (warnings)
  const recommendedFields = [
    { field: 'genre', label: 'Genre', weight: 10 },
    { field: 'lyrics', label: 'Lyrics', weight: 5 },
    { field: 'isrc', label: 'ISRC Code', weight: 5 },
    { field: 'cover_art_path', label: 'Cover Art', weight: 15 },
    { field: 'ai_tags', label: 'AI Tags', weight: 5 }
  ];

  for (const { field, label, weight } of recommendedFields) {
    const hasValue = !!track[field];
    validationResults.checks.push({
      field,
      label,
      status: hasValue ? 'pass' : 'warning',
      required: false
    });
    if (!hasValue) {
      validationResults.warnings.push(`Recommended: Add ${label}`);
      validationResults.score -= weight;
    }
  }

  // Quality checks
  if (track.audio_quality === 'standard') {
    validationResults.suggestions.push('Consider uploading HD audio (FLAC/WAV) for premium placement');
  }

  if (track.duration && track.duration < 60) {
    validationResults.warnings.push('Track is under 1 minute - may not qualify for streaming royalties');
    validationResults.score -= 10;
  }

  // Generate ISRC if missing
  if (!track.isrc) {
    const generatedISRC = generateISRC();
    validationResults.suggestions.push(`Auto-generated ISRC available: ${generatedISRC}`);
    validationResults.checks.push({
      field: 'isrc_generated',
      label: 'ISRC Auto-Generation',
      status: 'available',
      value: generatedISRC
    });
  }

  validationResults.score = Math.max(0, validationResults.score);
  validationResults.isValid = validationResults.blockers.length === 0;

  return {
    success: true,
    validation: validationResults,
    timestamp: new Date().toISOString()
  };
}

async function optimizeRelease(supabase: any, trackId: string, userId: string) {
  const { data: track } = await supabase
    .from('tracks')
    .select('*, albums(*)')
    .eq('id', trackId)
    .eq('user_id', userId)
    .single();

  if (!track) throw new Error('Track not found');

  // Get artist stats for context
  const { data: artistStats } = await supabase
    .from('tracks')
    .select('play_count, created_at')
    .eq('user_id', userId)
    .eq('is_published', true);

  const systemPrompt = `You are the Quantum Release Optimizer, an AI specialized in music release strategy.
Analyze the track and artist context to provide optimal release recommendations.`;

  const userPrompt = `Optimize release strategy for:
Track: ${track.title}
Artist: ${track.artist_name}
Genre: ${track.genre || 'Unknown'}
Audio Quality: ${track.audio_quality}
Duration: ${track.duration}s

Artist Context:
- Total Published Tracks: ${artistStats?.length || 0}
- Average Play Count: ${artistStats?.reduce((sum: number, t: any) => sum + (t.play_count || 0), 0) / (artistStats?.length || 1)}

Provide:
1. Optimal release date/time
2. Pre-release strategy
3. Promotional timeline
4. Platform-specific tactics
5. Content calendar suggestions`;

  const tools = [{
    type: 'function',
    function: {
      name: 'release_optimization',
      description: 'Optimize release strategy',
      parameters: {
        type: 'object',
        properties: {
          recommendedReleaseDay: { type: 'string', enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
          recommendedReleaseTime: { type: 'string' },
          releaseReason: { type: 'string' },
          preReleaseStrategy: {
            type: 'object',
            properties: {
              daysBeforeRelease: { type: 'number' },
              teaserContent: { type: 'array', items: { type: 'string' } },
              preSaveEnabled: { type: 'boolean' }
            }
          },
          promotionalTimeline: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                day: { type: 'number' },
                action: { type: 'string' },
                platform: { type: 'string' }
              }
            }
          },
          platformTactics: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                platform: { type: 'string' },
                tactic: { type: 'string' },
                priority: { type: 'number' }
              }
            }
          },
          contentCalendar: { type: 'array', items: { type: 'string' } },
          estimatedReach: { type: 'string' },
          confidenceScore: { type: 'number', minimum: 0, maximum: 100 }
        },
        required: ['recommendedReleaseDay', 'recommendedReleaseTime', 'confidenceScore']
      }
    }
  }];

  const result = await callAI(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    tools,
    { type: 'function', function: { name: 'release_optimization' } }
  );

  const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall?.function?.arguments) {
    return {
      success: true,
      optimization: JSON.parse(toolCall.function.arguments),
      trackId,
      timestamp: new Date().toISOString()
    };
  }

  throw new Error('Failed to generate optimization');
}

async function fullPipeline(supabase: any, trackId: string, userId: string, metadata: any) {
  console.log(`Running full Quantum Distribution pipeline for track ${trackId}`);

  const results: any = {
    trackId,
    pipeline: 'full',
    stages: {}
  };

  // Stage 1: Analyze
  try {
    const { data: track } = await supabase
      .from('tracks')
      .select('*')
      .eq('id', trackId)
      .eq('user_id', userId)
      .single();

    if (!track) throw new Error('Track not found');

    const trackMetadata = {
      title: track.title,
      artistName: track.artist_name,
      genre: track.genre,
      lyrics: track.lyrics,
      duration: track.duration,
      audioQuality: track.audio_quality
    };

    results.stages.analysis = await analyzeTrack(trackMetadata);
    console.log('Stage 1 complete: Analysis');
  } catch (e) {
    results.stages.analysis = { error: e instanceof Error ? e.message : 'Analysis failed' };
  }

  // Stage 2: Enrich
  try {
    const { data: track } = await supabase
      .from('tracks')
      .select('*')
      .eq('id', trackId)
      .single();

    results.stages.enrichment = await enrichMetadata({
      title: track.title,
      artistName: track.artist_name,
      genre: track.genre,
      lyrics: track.lyrics
    }, supabase, trackId);
    console.log('Stage 2 complete: Enrichment');
  } catch (e) {
    results.stages.enrichment = { error: e instanceof Error ? e.message : 'Enrichment failed' };
  }

  // Stage 3: Validate
  try {
    results.stages.validation = await validateDistribution(supabase, trackId, userId);
    console.log('Stage 3 complete: Validation');
  } catch (e) {
    results.stages.validation = { error: e instanceof Error ? e.message : 'Validation failed' };
  }

  // Stage 4: Optimize
  try {
    results.stages.optimization = await optimizeRelease(supabase, trackId, userId);
    console.log('Stage 4 complete: Optimization');
  } catch (e) {
    results.stages.optimization = { error: e instanceof Error ? e.message : 'Optimization failed' };
  }

  // Calculate overall readiness
  const analysisReady = results.stages.analysis?.success;
  const enrichmentReady = results.stages.enrichment?.success;
  const validationPassed = results.stages.validation?.validation?.isValid;
  const optimizationReady = results.stages.optimization?.success;

  results.overallReadiness = {
    score: [analysisReady, enrichmentReady, validationPassed, optimizationReady].filter(Boolean).length * 25,
    stages: {
      analysis: analysisReady ? 'complete' : 'failed',
      enrichment: enrichmentReady ? 'complete' : 'failed',
      validation: validationPassed ? 'complete' : 'failed',
      optimization: optimizationReady ? 'complete' : 'failed'
    },
    readyForDistribution: validationPassed
  };

  results.timestamp = new Date().toISOString();

  return results;
}

function generateISRC(): string {
  const countryCode = 'US';
  const registrantCode = 'TDZ';
  const year = new Date().getFullYear().toString().slice(-2);
  const designation = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${countryCode}${registrantCode}${year}${designation}`;
}
