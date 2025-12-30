# TDZ API Reference

## Overview

TDZ uses Supabase Edge Functions for server-side logic. All functions are deployed automatically and accessible via the Supabase project URL.

**Base URL**: `https://rcjzvfskkoqygnlolrcs.supabase.co/functions/v1`

**Authentication**: Include the JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## Music Content APIs

### Record Stream
Records a music stream with fraud detection and artist payout.

```http
POST /record-stream
```

**Request Body:**
```json
{
  "trackId": "uuid",
  "durationPlayed": 180,
  "totalDuration": 240,
  "completionPercentage": 75,
  "focusMetrics": {
    "totalFocusTime": 170,
    "totalBlurTime": 10,
    "focusSwitches": 2
  }
}
```

**Response:**
```json
{
  "success": true,
  "recorded": true,
  "message": "Stream recorded successfully"
}
```

**Fraud Detection:**
- Requires minimum 30 seconds OR 25% completion
- Focus time must be > 80% of play time
- Self-streams not counted
- Rate limited per IP/device

---

### Validate Track Upload
Validates track before upload (file type, duration, subscription limits).

```http
POST /validate-track-upload
```

**Request Body:**
```json
{
  "fileName": "my-track.mp3",
  "fileSize": 15000000,
  "mimeType": "audio/mpeg"
}
```

**Response:**
```json
{
  "valid": true,
  "trackLimit": 50,
  "tracksUsed": 12,
  "remainingTracks": 38
}
```

---

### Create Upload Session
Get presigned URL for secure file upload.

```http
POST /create-upload-session
```

**Request Body:**
```json
{
  "fileName": "my-track.mp3",
  "contentType": "audio/mpeg",
  "category": "audio"
}
```

**Response:**
```json
{
  "uploadUrl": "https://...",
  "path": "audio/uuid/my-track.mp3",
  "expiresIn": 3600
}
```

---

### Get Recommendations
AI-powered track recommendations.

```http
GET /get-recommendations?trackId=uuid&limit=10
```

**Response:**
```json
{
  "recommendations": [
    {
      "id": "uuid",
      "title": "Similar Track",
      "artist_name": "Artist",
      "score": 0.95
    }
  ]
}
```

---

## Analytics APIs

### Track Listener Demographics
Records listener location and device info.

```http
POST /track-listener-demographics
```

**Request Body:**
```json
{
  "trackId": "uuid",
  "artistId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "location": {
    "country": "United States",
    "city": "Los Angeles"
  }
}
```

---

### Export Analytics
Export artist analytics as CSV/JSON.

```http
POST /export-analytics
```

**Request Body:**
```json
{
  "format": "csv",
  "dateRange": {
    "start": "2025-01-01",
    "end": "2025-12-31"
  },
  "metrics": ["streams", "revenue", "demographics"]
}
```

**Response:**
```json
{
  "downloadUrl": "https://...",
  "expiresAt": "2025-12-31T00:00:00Z"
}
```

---

## Payment APIs

### Create Square Subscription
Creates a new subscription for the user.

```http
POST /create-square-subscription
```

**Request Body:**
```json
{
  "plan": "pro",
  "sourceId": "cnon:card-nonce-ok",
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "subscriptionId": "sq_subscription_id",
  "status": "active"
}
```

---

### Process Download Purchase
Process a track download purchase.

```http
POST /process-download-purchase
```

**Request Body:**
```json
{
  "trackId": "uuid",
  "sourceId": "cnon:card-nonce-ok"
}
```

**Response:**
```json
{
  "success": true,
  "downloadUrl": "https://...",
  "purchaseId": "uuid"
}
```

---

### Process Artist Payout
Initiate payout to artist's linked bank account.

```http
POST /process-artist-payout
```

**Request Body:**
```json
{
  "artistId": "uuid",
  "amount": 150.00,
  "earningsIds": ["uuid1", "uuid2"]
}
```

**Response:**
```json
{
  "success": true,
  "payoutId": "uuid",
  "status": "processing"
}
```

---

## AI Feature APIs

### Generate Video (Motion Cover)
Generate AI video from image or prompt.

```http
POST /generate-video
```

**Request Body:**
```json
{
  "prompt": "Abstract flowing colors with music visualization",
  "imageUrl": "https://...",
  "provider": "kling",
  "duration": 5
}
```

**Response:**
```json
{
  "success": true,
  "videoUrl": "https://...",
  "creditsUsed": 1
}
```

---

### Analyze Lyrics
AI analysis of song lyrics.

```http
POST /analyze-lyrics
```

**Request Body:**
```json
{
  "lyrics": "Verse 1...\nChorus...",
  "analysisType": "sentiment"
}
```

**Response:**
```json
{
  "sentiment": "positive",
  "themes": ["love", "hope"],
  "mood": "uplifting"
}
```

---

### Exec Agent Chat
AI executive assistant conversation.

```http
POST /exec-agent-chat
```

**Request Body:**
```json
{
  "conversationId": "uuid",
  "message": "How should I market my new album?",
  "agentType": "marketing"
}
```

**Response:**
```json
{
  "response": "Based on your audience demographics...",
  "suggestions": [
    "Focus on TikTok promotion",
    "Collaborate with similar artists"
  ]
}
```

---

## YouTube Integration

### YouTube Search
Search YouTube for music content.

```http
POST /youtube-search
```

**Request Body:**
```json
{
  "query": "indie rock 2025",
  "maxResults": 20
}
```

**Response:**
```json
{
  "videos": [
    {
      "id": "youtube_video_id",
      "title": "Video Title",
      "channel": "Channel Name",
      "thumbnail": "https://...",
      "duration": "3:45"
    }
  ]
}
```

---

## System APIs

### System Diagnostics
Get system health and diagnostics (admin only).

```http
GET /system-diagnostics
```

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "storage": "available",
  "edgeFunctions": "operational",
  "metrics": {
    "totalUsers": 1500,
    "totalTracks": 5000,
    "totalStreams": 250000
  }
}
```

---

### Check Provider Health
Check external provider status.

```http
GET /check-provider-health
```

**Response:**
```json
{
  "square": "healthy",
  "youtube": "healthy",
  "aiProviders": {
    "kling": "healthy",
    "runway": "healthy"
  }
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": true,
  "message": "Description of the error",
  "code": "ERROR_CODE"
}
```

**Common Error Codes:**
- `UNAUTHORIZED` - Missing or invalid authentication
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `RATE_LIMITED` - Too many requests
- `VALIDATION_ERROR` - Invalid input data
- `SUBSCRIPTION_REQUIRED` - Feature requires subscription
- `INSUFFICIENT_CREDITS` - Not enough AI credits

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Record Stream | 100/hour per user |
| YouTube Search | 50/hour per user |
| AI Features | Based on subscription |
| General API | 1000/hour per user |

---

## Webhooks

TDZ can send webhooks for key events:

- `subscription.created`
- `subscription.cancelled`
- `payout.completed`
- `track.published`
- `milestone.achieved`

Configure webhooks in the CEO Dashboard.

---

*Last Updated: 2025-12-30*
