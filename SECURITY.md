# Security Documentation

## Overview
This document outlines the security measures implemented in TDZ Distribution platform.

## Authentication & Authorization

### Password Security
- **Minimum Requirements**: 8 characters with uppercase, lowercase, and numbers
- **Leaked Password Protection**: Enabled (prevents use of compromised passwords)
- **Auto-confirm Email**: Enabled for development (should be disabled in production)
- **Rate Limiting**: Implemented via `auth_rate_limits` table

### Row Level Security (RLS)
All database tables have RLS enabled with the following policies:

#### User Data Protection
- **listener_profiles**: Only accessible to authenticated users (prevents public scraping)
- **artist_profiles**: Only verified artists or owners can view unverified profiles
- **user_roles**: Users can only view their own roles
- **audit_logs**: Users can only view their own audit logs

#### Content Protection
- **tracks**: Only published tracks or owner's tracks are visible
- **track_comments**: Require authentication to view
- **comment_likes**: Require authentication to view
- **artist_follows**: Require authentication to view

#### Upload Protection
- **tracks**: Rate limited (20 uploads per hour)
- **upload_sessions**: Users can only manage their own sessions
- **characters**: Users can only manage characters in their own projects

## Input Validation

### Client-Side Validation
All forms use Zod schemas for validation:
- Email: Valid email format, max 255 characters
- Password: Min 8 characters, max 72, requires uppercase, lowercase, and numbers
- Text inputs: Trimmed, length-limited, sanitized

### Server-Side Validation
- Edge functions validate all inputs
- SQL injection prevention through parameterized queries
- RLS policies provide additional access control

## Audit Logging

### What is Logged
- Track uploads
- Authentication attempts (via auth_rate_limits)
- Sensitive operations (extensible via `log_audit` function)

### Audit Log Storage
- Stored in `audit_logs` table
- Includes: user_id, action, resource_type, resource_id, metadata, timestamp
- Users can only view their own audit logs

## Rate Limiting

### Authentication
- Tracked in `auth_rate_limits` table
- Prevents brute force attacks
- Can block users temporarily

### File Uploads
- 20 uploads per hour per user
- Enforced via `check_upload_rate_limit` function
- Prevents abuse and resource exhaustion

## Data Privacy

### Personal Information
- **Email addresses**: Never publicly exposed
- **User profiles**: Require authentication to view
- **Location data**: In listening history, only accessible to user
- **Social graphs**: Follower relationships require authentication

### Public Data
- Published tracks and metadata
- Verified artist profiles
- Track play counts (aggregated)

## Edge Function Security

### JWT Verification
- All edge functions require valid JWT by default
- Public endpoints explicitly disable JWT (e.g., webhooks with signature validation)

### Input Sanitization
- All user inputs are validated
- SQL queries use parameterized statements
- File uploads are validated for type and size

## Storage Security

### Bucket Policies
- **track-files**: Public (for streaming)
- **album-covers**: Public (for display)
- **motion-covers**: Public (for display)
- **ai-twins**: Private (user-specific)
- **characters**: Private (user-specific)
- **artist-gallery**: Public (for display)

### File Upload Validation
- File type checking
- Size limits enforced
- Chunked uploads for large files
- Upload sessions tracked

## Security Headers

### Recommended Headers (to be configured in deployment)
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## Secrets Management

### Environment Variables
- All secrets stored in Supabase Secrets (encrypted at rest)
- Never committed to code
- Accessed only in Edge Functions with proper authorization

### API Keys
- LOVABLE_API_KEY: For AI features
- RUNWAY_API_KEY: For video generation
- FAL_API_KEY: For AI processing
- OPENAI_API_KEY: For AI features

## Monitoring & Incident Response

### Security Monitoring
1. Review audit logs regularly
2. Monitor failed authentication attempts
3. Check for unusual upload patterns
4. Review RLS policy effectiveness

### Incident Response
1. Identify and contain the breach
2. Review audit logs for extent
3. Revoke compromised tokens
4. Notify affected users if required
5. Update security measures

## Compliance

### GDPR Considerations
- Users can view their own data
- Audit trail for data access
- Data deletion capabilities (implement user data deletion)
- Privacy by design (RLS, authentication required)

### Best Practices
1. Regular security audits
2. Dependency updates
3. Penetration testing
4. User education on security

## Security Checklist

- [x] RLS enabled on all tables
- [x] Authentication with strong passwords
- [x] Input validation (client and server)
- [x] Rate limiting for uploads
- [x] Audit logging for sensitive operations
- [x] Leaked password protection
- [x] JWT verification on edge functions
- [x] Secure storage bucket policies
- [x] Generic error messages (prevent enumeration)
- [ ] HTTPS enforced in production
- [ ] Security headers configured
- [ ] Regular security audits
- [ ] User data deletion endpoint
- [ ] Two-factor authentication (future enhancement)

## Reporting Security Issues

If you discover a security vulnerability, please email: security@thirtydarkzero.com

Do not create public GitHub issues for security vulnerabilities.

## Last Updated
2025-11-02
