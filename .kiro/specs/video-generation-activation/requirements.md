# Requirements: Video Generation Activation

## Overview
Enable video generation functionality by activating the HuggingFace API integration and ensuring all backend services properly utilize the configured API secrets.

## Background
- Image generation is now fully functional using Pollinations (free provider)
- HuggingFace API key (`<REDACTED>`) has been set as Firebase secret `HF_TOKEN`
- Video generation currently shows error: "Video generation requires Together AI or Hugging face API keys to be configured on the server"
- Cloud Functions need redeployment to access the newly configured secret

## Current State

### What's Working ✅
1. **Image Generation**
   - Pollinations provider (free, primary)
   - OpenRouter fallback (paid)
   - Together AI last resort (paid)
   - Multi-provider fallback chain
   - Base64 encoding for instant display

2. **API Infrastructure**
   - All 20 Cloud Functions deployed
   - CORS configured for global access
   - Rate limiting implemented
   - Error handling and logging

3. **Frontend Detection**
   - Explicit image requests ("generate image of X")
   - Implicit visual patterns ("logo for X", "skyline")
   - Short visual phrases ("a lion", "a sunset")

### What Needs Fixing ❌
1. **Video Generation**
   - HuggingFace secret configured but not active
   - Functions need redeployment to load secret
   - No video provider currently operational
   - Error message correctly identifies missing configuration

2. **Secret Management**
   - `HF_TOKEN` secret created but not loaded by running functions
   - Functions deployed before secret was available

## Functional Requirements

### FR1: Video Generation Core Functionality
**Priority**: High  
**Description**: Users should be able to generate videos from text prompts using the HuggingFace API.

**Acceptance Criteria**:
- User can submit a text prompt for video generation
- System processes the request using HuggingFace provider
- System returns a valid video URL or error message within 5 minutes
- Video quality meets minimum standards (configurable resolution)

**Example User Flow**:
```
User: "create video of sunset over ocean"
System: [Processing with HuggingFace]
System: Returns video URL or base64 data
Frontend: Displays video player with generated content
```

### FR2: Multi-Provider Fallback for Video
**Priority**: Medium  
**Description**: If HuggingFace fails, system should attempt alternative providers.

**Acceptance Criteria**:
- Fallback chain: HuggingFace → Together AI → Error message
- Each provider attempt logged with latency metrics
- User receives clear error message if all providers fail
- System identifies which provider succeeded

### FR3: Secret Configuration Validation
**Priority**: High  
**Description**: System should validate API secrets are properly configured before attempting provider calls.

**Acceptance Criteria**:
- Health check endpoint reports secret configuration status
- Missing secrets identified by name (e.g., "HF_TOKEN not configured")
- Configured but invalid secrets identified separately
- Provider readiness status available via `/ai/health` endpoint

### FR4: Cost and Rate Management
**Priority**: Medium  
**Description**: Video generation should have appropriate rate limiting and cost controls.

**Acceptance Criteria**:
- Rate limit: 10 video requests per hour per IP
- Maximum video length: 5 seconds (HuggingFace free tier)
- Request queuing if provider is busy
- Clear messaging when rate limits are hit

## Non-Functional Requirements

### NFR1: Performance
- Video generation completion: < 5 minutes for 5-second video
- API response time (acknowledgment): < 2 seconds
- Health check endpoint: < 500ms response time

### NFR2: Reliability
- Video generation success rate: > 80% (with fallback)
- API uptime: > 99% (excluding provider outages)
- Graceful degradation when providers unavailable

### NFR3: Security
- API keys never exposed to frontend
- All secrets stored in Firebase Secret Manager
- Rate limiting prevents abuse
- CORS properly configured for authorized domains only

### NFR4: Observability
- Every video generation request logged with:
  - Request ID
  - User ID (if available)
  - Provider used
  - Latency
  - Success/failure status
  - Error details
- Metrics available for monitoring dashboard
- Provider health checks run every 5 minutes

## User Stories

### US1: Generate Video from Text Prompt
**As a** user  
**I want to** generate a video from a text description  
**So that** I can create visual content without video editing skills

**Acceptance Criteria**:
- Input field accepts text prompts up to 500 characters
- System provides progress indicator during generation
- Generated video displays in browser player
- User can download generated video

### US2: Understand Video Generation Status
**As a** user  
**I want to** know why video generation failed  
**So that** I can take corrective action or try again

**Acceptance Criteria**:
- Clear error messages (not technical jargon)
- Suggestions for resolution (e.g., "try again in a few minutes")
- Indication if issue is temporary vs permanent
- Option to report persistent issues

### US3: Experience Fast Video Generation
**As a** user  
**I want to** receive generated videos quickly  
**So that** I can iterate on my creative ideas efficiently

**Acceptance Criteria**:
- Progress indicator shows estimated time remaining
- System attempts fastest provider first
- Cancellation option during generation
- Notification when video is ready (if > 30 seconds)

## Dependencies

### Internal Dependencies
1. Firebase Cloud Functions infrastructure
2. Firebase Secret Manager with `HF_TOKEN`
3. Media generation engine (`functions/src/media/engine.ts`)
4. Provider implementations:
   - `functions/src/providers/huggingface.ts`
   - `functions/src/providers/together.ts`

### External Dependencies
1. HuggingFace API (video generation models)
2. Together AI API (fallback)
3. Firebase hosting (frontend deployment)
4. Cloud storage (if videos need persistent storage)

## Constraints

### Technical Constraints
- Firebase Cloud Functions timeout: 540 seconds (9 minutes max)
- Memory allocation: 512 MiB for video generation
- HuggingFace free tier limitations (rate limits, video length)
- Network bandwidth for video transfer

### Business Constraints
- Free tier usage (minimize costs)
- API quota limits from providers
- Terms of service compliance for all providers

### Time Constraints
- Deployment should complete in < 5 minutes
- Zero downtime for existing features (image generation, chat)

## Success Metrics

### Primary Metrics
1. **Video Generation Success Rate**: Target > 80%
2. **Average Latency**: Target < 3 minutes for 5-second video
3. **User Satisfaction**: No "missing API keys" errors
4. **Cost per Video**: < $0.10 (optimize for free tier usage)

### Secondary Metrics
1. **Provider Distribution**: 
   - HuggingFace: 90% of requests
   - Together AI: 10% (fallback only)
2. **Error Rate by Type**:
   - Provider failures: < 15%
   - Timeout errors: < 5%
   - Invalid prompts: < 2%
3. **Deployment Success**: 
   - All 20 functions deploy successfully
   - Zero regression in existing features

## Testing Requirements

### Test Scenarios

#### TS1: Basic Video Generation
**Given**: User is on the app homepage  
**When**: User types "create video of sunset"  
**Then**: System generates and displays a video of a sunset

#### TS2: Video Generation with Missing Secrets (Negative Test)
**Given**: HF_TOKEN secret is removed  
**When**: User requests video generation  
**Then**: System returns clear error message about missing configuration

#### TS3: Provider Fallback
**Given**: HuggingFace provider fails or is unavailable  
**When**: User requests video generation  
**Then**: System automatically tries Together AI provider

#### TS4: Rate Limiting
**Given**: User has made 10 video requests in past hour  
**When**: User makes 11th request  
**Then**: System returns rate limit error with retry-after time

#### TS5: Concurrent Requests
**Given**: Multiple users request videos simultaneously  
**When**: System processes requests  
**Then**: All requests are handled without interference

### Testing Strategy
1. **Unit Tests**: Provider integration, secret validation
2. **Integration Tests**: End-to-end video generation flow
3. **Manual Tests**: User experience, error messaging
4. **Load Tests**: Concurrent requests, rate limiting
5. **Smoke Tests**: Post-deployment verification

## Out of Scope

The following items are explicitly **not** included in this iteration:

1. ❌ Video editing capabilities (trim, merge, effects)
2. ❌ Custom video resolution/format selection
3. ❌ Video-to-video transformation
4. ❌ Audio generation or music overlays
5. ❌ Persistent storage of generated videos (currently ephemeral URLs)
6. ❌ User video gallery or history
7. ❌ Batch video generation
8. ❌ Video generation from images (image-to-video)
9. ❌ Advanced prompt engineering UI
10. ❌ Video analytics or view tracking

These features may be considered for future iterations.

## Risk Assessment

### High Risk
1. **HuggingFace API Reliability**: 
   - Risk: Provider may be slow or unreliable
   - Mitigation: Implement Together AI fallback

2. **Cost Overrun**:
   - Risk: Video generation is expensive at scale
   - Mitigation: Strict rate limiting, monitor costs daily

### Medium Risk
1. **Secret Configuration Issues**:
   - Risk: Deployment may not properly load secrets
   - Mitigation: Test secret access in health check endpoint

2. **Video Quality Issues**:
   - Risk: Generated videos may be low quality
   - Mitigation: Test with diverse prompts, adjust parameters

### Low Risk
1. **CORS Configuration**:
   - Risk: Video URLs may not be accessible from frontend
   - Mitigation: Already tested pattern with images

2. **Timeout Issues**:
   - Risk: Long video generation may hit function timeout
   - Mitigation: 540-second timeout is adequate for 5-second videos

## Questions & Assumptions

### Assumptions
1. ✅ HuggingFace API key is valid and has sufficient quota
2. ✅ Firebase Secret Manager is properly configured
3. ✅ Current backend architecture supports video generation
4. ✅ Frontend already has video display components
5. ✅ No breaking changes needed to existing APIs

### Open Questions
1. ❓ What video resolution should we target? (Default: 512x512)
2. ❓ Should videos be stored persistently or use ephemeral URLs?
3. ❓ What's the acceptable cost per video generation?
4. ❓ Do we need video generation analytics/metrics?
5. ❓ Should there be different rate limits for authenticated users?

### Answers Needed From
- **Product Team**: Video quality vs cost tradeoffs
- **DevOps Team**: Monitoring and alerting requirements
- **User Research**: Expected use cases and prompt patterns

## Approval

**Requirements Approved By**: _[Pending]_  
**Date**: _[Pending]_  
**Next Step**: Proceed to Design phase

---

**Document Version**: 1.0  
**Last Updated**: August 10, 2026  
**Status**: Draft - Awaiting Review
