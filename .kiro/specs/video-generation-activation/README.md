# Video Generation Activation Spec

## 🎯 Overview
This spec guides the implementation of video generation functionality by activating the HuggingFace API integration that was configured but not yet deployed.

**Status**: 🟢 Ready for Implementation  
**Priority**: High  
**Estimated Effort**: 4.5 hours  
**Created**: August 10, 2026

---

## 📋 Quick Links

- **[Requirements](./requirements.md)** - What needs to be built and why
- **[Design](./design.md)** - Technical architecture and implementation approach
- **[Tasks](./tasks.md)** - Step-by-step implementation tasks
- **[Metadata](./metadata.json)** - Spec metadata and configuration

---

## 🎬 Current State

### ✅ What's Working
- Image generation fully functional (using Pollinations)
- HuggingFace API key configured as Firebase secret `HF_TOKEN`
- All 20 Cloud Functions deployed and operational
- Frontend detection for media requests working

### ❌ What Needs Fixing
- Video generation shows error: "Video generation requires Together AI or Hugging face API keys to be configured on the server"
- Functions need redeployment to load HF_TOKEN secret
- HuggingFace video provider implementation needs to be verified/completed
- Multi-provider fallback for video not yet implemented

---

## 🎯 Objectives

1. **Activate Secret Access** - Redeploy functions to load HF_TOKEN
2. **Implement Video Provider** - Complete HuggingFace video generation
3. **Add Fallback System** - Multi-provider fallback (HuggingFace → Together AI)
4. **Deploy to Production** - Full deployment with zero downtime
5. **Test & Monitor** - Comprehensive testing and performance monitoring

---

## 📊 Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Video Generation Success Rate | > 80% | 0% (not active) |
| Average Latency | < 3 minutes | N/A |
| Error Rate | < 20% | 100% (expected error) |
| Cost per Video | < $0.10 | N/A |

---

## 🛠️ Implementation Path

### Phase 1: Secret Activation (Immediate - 10 min)
**Goal**: Make HF_TOKEN available to Cloud Functions

```bash
# Deploy functions with secret access
npx firebase deploy --only functions
```

**Validation**: Health endpoint shows HuggingFace secret configured

### Phase 2: Provider Implementation (Development - 2 hours)
**Goal**: Implement HuggingFace video generation

**Files to Modify**:
- `functions/src/providers/huggingface.ts` - Add `huggingfaceVideo()`
- `functions/src/media/engine.ts` - Add video generation logic
- `functions/src/providers/together.ts` - Add stub for fallback

**Key Implementation**:
```typescript
// HuggingFace video generation
export async function huggingfaceVideo(prompt: string): Promise<{
  videoUrl: string;
  model: string;
  duration?: number;
}> {
  const token = HF_TOKEN.value();
  if (!token) throw new Error('HF_TOKEN not configured');

  const response = await fetch(
    'https://api-inference.huggingface.co/models/damo-vilab/text-to-video-ms-1.7b',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { num_frames: 16, num_inference_steps: 25 },
      }),
    }
  );

  // Convert blob to base64 and return
  const videoBlob = await response.blob();
  const arrayBuffer = await videoBlob.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  
  return {
    videoUrl: `data:video/mp4;base64,${base64}`,
    model: 'damo-vilab/text-to-video-ms-1.7b',
    duration: 0.5,
  };
}
```

### Phase 3: Production Deployment (5 min)
**Goal**: Deploy to production with monitoring

```bash
# Build and deploy
cd functions
npm run build
cd ..
npx firebase deploy --only functions
```

**Validation**: E2E test with real prompt

### Phase 4: Testing & Monitoring (1.5 hours)
**Goal**: Verify functionality and establish baselines

**Test Cases**:
- ✅ Simple prompt: "a sunset"
- ✅ Complex prompt: "cinematic sunset over ocean with golden hour lighting"
- ✅ Invalid prompt (empty) → 400 error
- ✅ Rate limiting (11 requests) → 429 error
- ✅ Frontend integration: "create video of lion cubs"

---

## 🏗️ Architecture Overview

```
User Browser
    │
    │ POST /ai/video {"prompt": "a sunset"}
    ▼
API Layer (aiVideo endpoint)
    │
    │ CORS, rate limiting, validation
    ▼
AI Intelligence Layer
    │
    │ Prompt optimization, provider selection
    ▼
Media Engine (generateMedia)
    │
    ├─→ Try HuggingFace (primary)
    │   │ Uses HF_TOKEN secret
    │   │ Calls HuggingFace Inference API
    │   └─ Returns video if successful ✓
    │
    └─→ Try Together AI (fallback)
        │ Uses TOGETHER_KEY secret
        └─ Returns video if HuggingFace failed
```

---

## 📦 Deliverables

### Code Changes
- [ ] `functions/src/providers/huggingface.ts` - Video generation implementation
- [ ] `functions/src/media/engine.ts` - Video orchestration logic
- [ ] `functions/src/providers/together.ts` - Fallback stub

### Testing
- [ ] Unit tests for HuggingFace provider
- [ ] Integration tests for media engine
- [ ] E2E tests for video generation API
- [ ] Manual testing checklist completed

### Documentation
- [ ] README.md updated with video features
- [ ] API documentation updated
- [ ] Performance baseline established
- [ ] Monitoring dashboard configured

---

## ⚠️ Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| HuggingFace API unreliable | High | Together AI fallback |
| Cost overrun | High | Strict rate limiting (10/hour) |
| Secret configuration fails | Medium | Test in health endpoint |
| Video quality issues | Medium | Test diverse prompts |

---

## 🔄 Rollback Plan

### Automatic Rollback
- Firebase maintains previous function version automatically
- If deployment fails, previous version remains active

### Manual Rollback
```bash
# Via Firebase Console
# Functions → Select function → Rollback to previous version
```

### Feature Flag Disable
```typescript
// In functions/src/index.ts
const VIDEO_GENERATION_ENABLED = false; // Quick disable
```

---

## 📈 Monitoring

### Key Metrics
- Request count (per hour)
- Success rate (target > 80%)
- Average latency (target < 180s)
- Error rate by type
- Cost per video (target < $0.10)

### Alerting Rules
- 🚨 Error rate > 20% in 5 minutes
- ⚠️ Latency p95 > 180 seconds
- 🚨 All providers unavailable
- ⚠️ Daily cost > $10

---

## 🚀 Getting Started

### For Implementers
1. Read [Requirements](./requirements.md) to understand what needs to be built
2. Review [Design](./design.md) for technical approach
3. Follow [Tasks](./tasks.md) in sequence
4. Test each task before proceeding to next

### For Reviewers
1. Verify requirements match user needs
2. Check design aligns with architecture
3. Review task breakdown for completeness
4. Approve before implementation begins

### For Testers
1. Use test cases from [Tasks](./tasks.md) Task 6
2. Verify all acceptance criteria met
3. Document any issues found
4. Confirm performance meets targets

---

## 📚 Reference Implementation

This spec follows the same pattern as the successful image generation implementation:

**Image Generation (Working)**:
```typescript
// Multi-provider fallback
const providers = [
  { name: 'pollinations', fn: pollinationsWithFallback },
  { name: 'openrouter', fn: openRouterImage },
  { name: 'together', fn: togetherImage },
];

for (const provider of providers) {
  try {
    const result = await provider.fn(prompt);
    if (result?.imageUrl || result?.imageBase64) {
      return { ...result, provider: provider.name };
    }
  } catch (error) {
    console.warn(`Provider ${provider.name} failed, trying next`);
    continue;
  }
}
```

**Video Generation (To Implement)**:
```typescript
// Same pattern for video
const providers = [
  { name: 'huggingface', fn: huggingfaceVideo },
  { name: 'together', fn: togetherVideo },
];

for (const provider of providers) {
  try {
    const result = await provider.fn(prompt);
    if (result?.videoUrl) {
      return { ...result, provider: provider.name };
    }
  } catch (error) {
    console.warn(`Provider ${provider.name} failed, trying next`);
    continue;
  }
}
```

---

## 🤝 Stakeholders

- **Product**: Video generation feature for user creativity
- **Engineering**: Clean implementation following existing patterns
- **DevOps**: Monitoring and cost control
- **Users**: Ability to generate videos from text prompts

---

## ✅ Approval

**Requirements Approved**: _[Pending]_  
**Design Approved**: _[Pending]_  
**Ready for Implementation**: _[Pending]_

---

## 📝 Changelog

### Version 1.0.0 (2026-08-10)
- Initial spec created
- Requirements defined based on current state analysis
- Design documented following image generation pattern
- Tasks broken down into 10 concrete steps
- Ready for implementation

---

## 🎓 Lessons from Image Generation Fix

### What Worked Well
✅ Multi-provider fallback provided resilience  
✅ Base64 encoding for instant display  
✅ Clear error messages helped debugging  
✅ Following Firebase patterns simplified implementation

### What to Improve
🔄 Add integration tests before deployment  
🔄 Monitor costs from day one  
🔄 Test secret configuration before full deployment  
🔄 Document API keys and setup process

### Applied to Video Generation
- Start with simple provider (HuggingFace)
- Add comprehensive error handling
- Test secret access immediately
- Monitor costs closely
- Follow same architectural patterns

---

**For questions or clarifications, refer to the detailed documents:**
- Requirements questions → See [requirements.md](./requirements.md)
- Technical questions → See [design.md](./design.md)
- Implementation questions → See [tasks.md](./tasks.md)

**Ready to implement? Start with Task 1 in [tasks.md](./tasks.md)!** 🚀
