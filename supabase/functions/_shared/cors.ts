// Shared CORS configuration for Edge Functions
// Restricts origins to trusted domains for security

const ALLOWED_ORIGINS = [
  'https://tdz.lovable.app',
  'https://www.thirtydarkzero.net',
  'https://id-preview--751ec7fc-ab3c-47c5-ae43-f222950f0df1.lovable.app',
  'https://lovable.app',
  'https://lovable.dev',
];

const ALLOWED_ORIGIN_SUFFIXES = [
  '.lovable.app',
  '.lovable.dev',
  '.lovableproject.com',
  '.thirtydarkzero.net',
];

const ALLOWED_HEADERS = [
  'authorization',
  'x-client-info',
  'apikey',
  'content-type',
  'x-supabase-client-platform',
  'x-supabase-client-platform-version',
  'x-supabase-client-runtime',
  'x-supabase-client-runtime-version',
].join(', ');

// Add development origins when in development mode
const DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:8080',
  'http://localhost:54321',
];

export function getCorsHeaders(origin: string | null): Record<string, string> {
  const isDev = Deno.env.get('ENVIRONMENT') === 'development';
  const allAllowedOrigins = isDev 
    ? [...ALLOWED_ORIGINS, ...DEV_ORIGINS] 
    : ALLOWED_ORIGINS;
  
  // Check if origin matches any allowed origin or is a preview URL
  const isAllowed = origin && (
    allAllowedOrigins.includes(origin) ||
    ALLOWED_ORIGIN_SUFFIXES.some((suffix) => origin.endsWith(suffix))
  );
  
  const allowedOrigin = isAllowed ? origin : ALLOWED_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': ALLOWED_HEADERS,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };
}

// Legacy wildcard CORS for truly public endpoints (read-only, no auth)
export const publicCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': ALLOWED_HEADERS,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Handle CORS preflight
export function handleCorsPreflightWithOrigin(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin');
    return new Response(null, { headers: getCorsHeaders(origin) });
  }
  return null;
}
