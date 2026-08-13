# Tasks: Video Generation Activation

## Task Overview
Break down the video generation activation into concrete, sequential implementation tasks.

---

## Task 1: Redeploy Functions with Secret Access
**Priority**: Critical  
**Estimated Time**: 10 minutes  
**Dependencies**: None  
**Status**: Not Started

### Description
Redeploy all Cloud Functions to activate the HF_TOKEN secret that was configured in the previous session.

### Acceptance Criteria
- [ ] All 20 Cloud Functions successfully redeployed
- [ ] No deployment errors or warnings
- [ ] Functions can access HF_TOKEN secret
- [ ] Health check endpoint shows HuggingFace as "secret configured"
- [ ] No regression in existing features (image generation, chat)

### Implementation Steps
1. Verify current secret configuration:
   ```bash
   firebase functions:secrets:access HF_TOKEN
   ```

2. Deploy all functions:
   ```bash
   cd functions
   npm run build
   cd ..
   npx firebase deploy --only functions
   ```

3. Verify deployment success:
   - Check Firebase Console for deployment status
   - Verify all 20 functions show "Active" status

4. Test secret access:
   ```bash
   curl https://9jai.web.app/ai/health
   ```

### Validation
- Deployment completes without errors
- Health endpoint returns HuggingFace provider status
- Image generation still works (no regression)
- Chat functionality still works (no regression)

### Files Modified
- None (deployment only)

### Rollback Plan
- Firebase maintains previous version automatically
- If issues, use Firebase Console to roll back

---

## Task 2: Verify HuggingFace Provider Implementation
**Priority**: High  
**Estimated Time**: 30 minutes  
**Dependencies**: Task 1  
**Status**: Not Started

### Description
Check if `huggingfaceVideo()` function exists and is properly implemented in the HuggingFace provider file.

### Acceptance Criteria
- [ ] `functions/src/providers/huggingface.ts` contains `huggingfaceVideo()` function
- [ ] Function properly accesses HF_TOKEN secret
- [ ] Function handles API calls to HuggingFace Inference API
- [ ] Function returns correct response format
- [ ] Error handling implemented

### Implementation Steps
1. Read current HuggingFace provider implementation:
   ```bash
   cat functions/src/providers/huggingface.ts
   ```

2. Check for existing video generation functions

3. If missing or incomplete, implement `huggingfaceVideo()`:
   ```typescript
   export async function huggingfaceVideo(prompt: string): Promise<{
     videoUrl: string;
     model: string;
     duration?: number;
   }> {
     const token = HF_TOKEN.value();
     if (!token) {
       throw new Error('HF_TOKEN not configured');
     }

     const model = 'damo-vilab/text-to-video-ms-1.7b';
     const apiUrl = `https://api-inference.huggingface.co/models/${model}`;

     const response = await fetch(apiUrl, {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${token}`,
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         inputs: prompt,
         parameters: {
           num_frames: 16,
           num_inference_steps: 25,
         },
       }),
     });

     if (!response.ok) {
       const error = await response.text();
       throw new Error(`HuggingFace API error: ${response.status} - ${error}`);
     }

     const videoBlob = await response.blob();
     const arrayBuffer = await videoBlob.arrayBuffer();
     const base64 = Buffer.from(arrayBuffer).toString('base64');
     const videoUrl = `data:video/mp4;base64,${base64}`;

     return {
       videoUrl,
       model,
       duration: 0.5,
     };
   }
   ```

4. Add timeout wrapper for API calls

5. Add proper TypeScript types

### Validation
- TypeScript compilation succeeds
- Function signature matches design spec
- HF_TOKEN properly accessed via `defineSecret()`
- Error messages are clear and actionable

### Files Modified
- `functions/src/providers/huggingface.ts`

### Rollback Plan
- Git revert changes if compilation fails
- Keep backup of original file

---

## Task 3: Update Media Engine for Video Generation
**Priority**: High  
**Estimated Time**: 45 minutes  
**Dependencies**: Task 2  
**Status**: Not Started

### Description
Enhance `generateMedia()` function in media engine to handle video generation with multi-provider fallback.

### Acceptance Criteria
- [ ] `generateMedia()` handles `kind: 'text-to-video'` requests
- [ ] Multi-provider fallback implemented (HuggingFace → Together AI)
- [ ] Error handling for all failure scenarios
- [ ] Proper logging for debugging
- [ ] Response format matches design spec
- [ ] No breaking changes to existing image generation

### Implementation Steps
1. Open `functions/src/media/engine.ts`

2. Add video generation case after image generation:
   ```typescript
   if (request.kind === 'text-to-video' && request.prompt) {
     const providers = [
       { 
         name: 'huggingface', 
         fn: async () => {
           const result = await huggingfaceVideo(request.prompt!);
           return { videoUrl: result.videoUrl, model: result.model };
         }
       },
       { 
         name: 'together', 
         fn: async () => {
           // Together AI doesn't support video yet, will throw
           const result = await togetherVideo(request.prompt!);
           return { videoUrl: result.videoUrl, model: result.model };
         }
       },
     ];

     for (const provider of providers) {
       try {
         console.log(`[MediaEngine] Trying ${provider.name} for video generation`);
         const result = await provider.fn();
         
         if (result?.videoUrl) {
           const latencyMs = Date.now() - startTime;
           console.log(`[MediaEngine] Success with ${provider.name} in ${latencyMs}ms`);
           
           return {
             kind: 'text-to-video',
             provider: provider.name as ProviderId,
             model: result.model || provider.name,
             latencyMs,
             mediaUrl: result.videoUrl,
           };
         }
       } catch (error: any) {
         console.warn(`[MediaEngine] ${provider.name} failed:`, error.message);
         continue;
       }
     }
     
     // All providers failed
     throw new Error('Video generation unavailable - no providers available');
   }
   ```

3. Import necessary provider functions:
   ```typescript
   import { huggingfaceVideo } from '../providers/huggingface';
   import { togetherVideo } from '../providers/together';
   ```

4. Update response types if needed

5. Test compilation

### Validation
- TypeScript compilation succeeds
- No breaking changes to image generation
- Proper error propagation
- Logging statements added for debugging

### Files Modified
- `functions/src/media/engine.ts`

### Rollback Plan
- Git revert if breaking changes detected
- Run image generation tests to verify no regression

---

## Task 4: Add Together AI Video Support (Stub)
**Priority**: Low  
**Estimated Time**: 15 minutes  
**Dependencies**: Task 2  
**Status**: Not Started

### Description
Add a stub implementation for Together AI video generation that throws a clear error message. This enables the fallback chain even though Together AI doesn't support video yet.

### Acceptance Criteria
- [ ] `togetherVideo()` function exists in Together AI provider
- [ ] Function throws informative error message
- [ ] Error message indicates video not yet supported
- [ ] Function signature matches design spec

### Implementation Steps
1. Open `functions/src/providers/together.ts`

2. Add stub function:
   ```typescript
   export async function togetherVideo(prompt: string): Promise<{
     videoUrl: string;
     model: string;
     duration?: number;
   }> {
     throw new Error('Together AI video generation not yet supported - fallback unavailable');
   }
   ```

3. Update exports

4. Test compilation

### Validation
- TypeScript compilation succeeds
- Function can be imported by media engine
- Error message is clear

### Files Modified
- `functions/src/providers/together.ts`

### Rollback Plan
- Git revert if compilation fails
- Minimal risk (stub only)

---

## Task 5: Deploy Video Generation Implementation
**Priority**: Critical  
**Estimated Time**: 10 minutes  
**Dependencies**: Tasks 2, 3, 4  
**Status**: Not Started

### Description
Build and deploy the updated Cloud Functions with video generation support to production.

### Acceptance Criteria
- [ ] All functions compile successfully
- [ ] No TypeScript errors or warnings
- [ ] Deployment completes successfully
- [ ] All 20 functions show "Active" status
- [ ] No deployment errors in Firebase Console

### Implementation Steps
1. Run TypeScript compilation:
   ```bash
   cd functions
   npm run build
   ```

2. Verify no errors in build output

3. Deploy to production:
   ```bash
   cd ..
   npx firebase deploy --only functions
   ```

4. Monitor deployment progress

5. Verify deployment completion

### Validation
- Build succeeds with no errors
- Deployment completes in ~3-5 minutes
- Firebase Console shows all functions active
- No error logs in Functions logs

### Files Modified
- None (deployment only)

### Rollback Plan
- Firebase maintains previous version
- Can rollback via Firebase Console if needed
- Monitor error rates post-deployment

---

## Task 6: Test Video Generation End-to-End
**Priority**: Critical  
**Estimated Time**: 30 minutes  
**Dependencies**: Task 5  
**Status**: Not Started

### Description
Perform comprehensive testing of video generation functionality across different scenarios and prompts.

### Acceptance Criteria
- [ ] Simple prompt generates video successfully
- [ ] Complex prompt generates video successfully  
- [ ] Invalid prompt returns proper error
- [ ] Rate limiting works correctly
- [ ] Error messages are user-friendly
- [ ] Video plays in browser
- [ ] Latency is acceptable (< 3 minutes)

### Implementation Steps
1. **Test 1: Simple Prompt**
   ```bash
   curl -X POST https://9jai.web.app/ai/video \
     -H "Content-Type: application/json" \
     -d '{"prompt":"a sunset"}'
   ```
   Expected: 200 response with videoUrl

2. **Test 2: Complex Prompt**
   ```bash
   curl -X POST https://9jai.web.app/ai/video \
     -H "Content-Type: application/json" \
     -d '{"prompt":"a beautiful cinematic sunset over ocean with golden hour lighting"}'
   ```
   Expected: 200 response with videoUrl

3. **Test 3: Missing Prompt**
   ```bash
   curl -X POST https://9jai.web.app/ai/video \
     -H "Content-Type: application/json" \
     -d '{}'
   ```
   Expected: 400 error "prompt required"

4. **Test 4: Frontend Integration**
   - Open https://9jai.web.app
   - Type: "create video of lion cubs"
   - Verify video generates and plays

5. **Test 5: Rate Limiting**
   - Make 11 video requests rapidly
   - Verify 11th request returns 429 error

6. **Test 6: v1.0 API Compatibility**
   ```bash
   curl -X POST https://9jai.web.app/api/v1/video/process \
     -H "Content-Type: application/json" \
     -d '{"prompt":"a sunset"}'
   ```

### Validation
- All test cases pass
- Videos play correctly in browser
- Error messages are clear and helpful
- Performance meets requirements (< 3 min)
- No console errors in browser

### Test Results Documentation
Create test report with:
- Test case results (pass/fail)
- Sample prompts tested
- Average latency measurements
- Screenshots/recordings of successful videos
- Error messages encountered

### Files Modified
- None (testing only)

### Rollback Plan
- If critical issues found, disable video generation via feature flag
- Investigate and fix issues before re-enabling

---

## Task 7: Update Health Check Endpoint
**Priority**: Medium  
**Estimated Time**: 20 minutes  
**Dependencies**: Task 5  
**Status**: Not Started

### Description
Ensure the `/ai/health` endpoint correctly reports video generation provider status including HuggingFace readiness.

### Acceptance Criteria
- [ ] Health endpoint returns HuggingFace provider status
- [ ] Status indicates if HF_TOKEN is configured
- [ ] Status indicates if provider is operational
- [ ] Response includes video generation capability flag
- [ ] JSON format is consistent with existing health checks

### Implementation Steps
1. Review current health check implementation in `functions/src/index.ts`

2. Verify provider registry includes HuggingFace

3. Test health endpoint:
   ```bash
   curl https://9jai.web.app/ai/health | jq
   ```

4. Verify response includes:
   ```json
   {
     "providers": {
       "huggingface": {
         "status": "healthy",
         "secretConfigured": true,
         "capabilities": ["video"],
         "ready": true
       }
     }
   }
   ```

5. If missing, update provider registry to include video capability

### Validation
- Health endpoint returns 200 status
- Response includes HuggingFace in providers list
- Video capability correctly reported
- Response format is valid JSON

### Files Modified
- Potentially `functions/src/media/providerRegistry.ts`
- Potentially `functions/src/index.ts` (health endpoint)

### Rollback Plan
- Git revert if health endpoint breaks
- Low risk (read-only endpoint)

---

## Task 8: Monitor Production Performance
**Priority**: Medium  
**Estimated Time**: 1 hour (ongoing)  
**Dependencies**: Task 6  
**Status**: Not Started

### Description
Monitor production video generation performance, error rates, and costs for the first 24 hours after deployment.

### Acceptance Criteria
- [ ] Error rate < 20%
- [ ] Average latency < 180 seconds
- [ ] No critical errors in logs
- [ ] Cost within expected range (< $1 for 10 videos)
- [ ] No user complaints

### Implementation Steps
1. Open Firebase Console → Functions → Logs

2. Monitor for errors:
   - Filter by function: `aiVideo`
   - Look for ERROR level logs
   - Track error patterns

3. Check metrics:
   - Invocation count
   - Average execution time
   - Error rate
   - Memory usage

4. Monitor costs:
   - Firebase Console → Usage and billing
   - Track HuggingFace API usage
   - Calculate cost per video

5. Set up alerts (if not already configured):
   - Error rate > 20%
   - Latency > 180s (p95)
   - Cost > $10/day

### Validation
- Error rate within acceptable range
- Performance meets SLAs
- No cost overruns
- Users successfully generating videos

### Documentation
Create monitoring report with:
- Error rate statistics
- Latency percentiles (p50, p95, p99)
- Total requests processed
- Cost analysis
- Issues identified and resolved

### Files Modified
- None (monitoring only)

### Rollback Plan
- If error rate too high, disable video generation
- Investigate root cause before re-enabling

---

## Task 9: Update Documentation
**Priority**: Low  
**Estimated Time**: 30 minutes  
**Dependencies**: Tasks 6, 7  
**Status**: Not Started

### Description
Update project documentation to reflect video generation capabilities and usage instructions.

### Acceptance Criteria
- [ ] README.md updated with video generation feature
- [ ] API documentation updated
- [ ] Example usage added
- [ ] Troubleshooting section added
- [ ] Known limitations documented

### Implementation Steps
1. Update main README.md:
   - Add video generation to features list
   - Add example commands
   - Add usage instructions

2. Update API documentation (if separate file exists)

3. Add troubleshooting section:
   - Common errors and solutions
   - Rate limit information
   - Provider availability

4. Document limitations:
   - Video length: max 5 seconds
   - Rate limits: 10/hour
   - Quality limitations
   - Browser compatibility

5. Add examples:
   ```markdown
   ## Video Generation

   Generate videos from text prompts:

   ```bash
   curl -X POST https://9jai.web.app/ai/video \
     -H "Content-Type: application/json" \
     -d '{"prompt":"a beautiful sunset over ocean"}'
   ```

   Example prompts:
   - "a lion walking in savanna"
   - "sunrise over mountains"
   - "ocean waves on beach"
   ```

### Validation
- Documentation is clear and accurate
- Examples work correctly
- Links are valid
- Formatting is consistent

### Files Modified
- `README.md`
- Potentially other documentation files

### Rollback Plan
- Git revert if needed
- Low risk (documentation only)

---

## Task 10: Create Performance Baseline
**Priority**: Low  
**Estimated Time**: 1 hour  
**Dependencies**: Task 8  
**Status**: Not Started

### Description
Establish baseline performance metrics for video generation to track improvements and detect regressions over time.

### Acceptance Criteria
- [ ] Baseline metrics documented
- [ ] Test suite created for performance testing
- [ ] Metrics tracked in spreadsheet or dashboard
- [ ] Comparison with design targets

### Implementation Steps
1. Run standardized test suite:
   - 10 simple prompts (e.g., "a sunset")
   - 10 complex prompts (e.g., "cinematic sunset with golden hour lighting...")
   - Measure latency for each

2. Calculate statistics:
   - Average latency
   - P50, P95, P99 latencies
   - Success rate
   - Error types and frequencies

3. Compare with design targets:
   - Target: < 3 minutes average
   - Target: > 80% success rate

4. Document baseline:
   ```markdown
   ## Performance Baseline (August 10, 2026)

   ### Latency
   - Average: 125 seconds
   - P50: 115 seconds
   - P95: 168 seconds
   - P99: 195 seconds

   ### Reliability
   - Success rate: 87%
   - Error rate: 13%
     - API errors: 8%
     - Timeouts: 3%
     - Invalid prompts: 2%

   ### Cost
   - Average per video: $0.08
   - Daily projected: $4.80 (60 videos)
   ```

5. Create automated test script for future comparisons

### Validation
- Baseline metrics are comprehensive
- Test suite is repeatable
- Documentation is clear

### Files Modified
- Create `performance_baseline.md`
- Create `scripts/performance_test.sh` (optional)

### Rollback Plan
- N/A (documentation only)

---

## Summary

### Task Dependencies Graph
```
Task 1 (Deploy secrets)
  │
  ├─→ Task 2 (Verify HF provider)
  │     │
  │     ├─→ Task 3 (Update media engine)
  │     │
  │     └─→ Task 4 (Together AI stub)
  │           │
  └───────────┴─→ Task 5 (Deploy implementation)
                    │
                    ├─→ Task 6 (E2E testing)
                    │     │
                    │     ├─→ Task 8 (Monitor)
                    │     │     │
                    │     │     └─→ Task 10 (Baseline)
                    │     │
                    │     └─→ Task 9 (Documentation)
                    │
                    └─→ Task 7 (Health check)
```

### Estimated Timeline
- **Critical Path**: Tasks 1 → 2 → 3 → 5 → 6 = ~2 hours
- **Monitoring**: Task 8 = 1 hour ongoing
- **Documentation**: Tasks 7, 9, 10 = 1.5 hours
- **Total**: ~4.5 hours (includes testing and monitoring)

### Risk Assessment
- **Low Risk**: Tasks 1, 4, 7, 9, 10 (deployment, stubs, documentation)
- **Medium Risk**: Tasks 2, 3 (implementation)
- **High Risk**: Tasks 5, 6 (deployment, E2E testing)

### Success Criteria
- ✅ All tasks completed without critical errors
- ✅ Video generation working in production
- ✅ Performance meets design targets
- ✅ No regressions in existing features
- ✅ Documentation updated
- ✅ Monitoring in place

---

**Document Version**: 1.0  
**Last Updated**: August 10, 2026  
**Status**: Ready for Execution
