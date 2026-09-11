# Image Generation Testing Plan - Physical Verification

## CRITICAL PRINCIPLE

**NEVER claim image generation works until you physically see REAL AI-generated images in the browser.**

SVG placeholders, stock photos, and retrieved images DO NOT count as "generated".

---

## PRE-DEPLOYMENT CHECKLIST

### ✅ Infrastructure Verification

- [ ] GPU server is running (check `nvidia-smi`)
- [ ] ComfyUI is accessible (open web UI in browser)
- [ ] Models are downloaded (check `models/checkpoints/` folder)
- [ ] Test workflow generates image in ComfyUI web UI
- [ ] API endpoint responds to `/system_stats` request
- [ ] Firebase secret `COMFYUI_ENDPOINT` is set correctly
- [ ] Backend deployed with updated code

### ✅ Backend Verification

- [ ] `nativeAIEngine.ts` compiles without errors
- [ ] `media/engine.ts` includes native-gpu provider
- [ ] Provider chain is: native-gpu → openrouter → pollinations
- [ ] Logs show "PRIMARY: Trying native GPU generation"

---

## PHYSICAL TESTING PROTOCOL

### Test 1: Simple Photorealistic Image

**Prompt**: "Beautiful landscape, mountains, lake, sunset, photorealistic"

**Expected Results**:
- ✅ Image loads in browser within 30 seconds
- ✅ Image is NOT an SVG (inspect element shows `<img src="data:image/png;base64..."`)
- ✅ Image file size is 200KB-2MB (not 5KB SVG)
- ✅ Image shows unique AI-generated landscape (not stock photo)
- ✅ Metadata shows `provider: "native-gpu"` and actual model name
- ✅ Backend logs show "Native GPU success"

**Failure Indicators**:
- ❌ SVG placeholder appears
- ❌ Stock photo from image search appears
- ❌ Image is generic/repeated from previous tests
- ❌ Metadata shows "pollinations" or "fallback"
- ❌ File size < 50KB

**Screenshot**: Take screenshot and save as `test1_landscape.png`

---

### Test 2: Logo Design

**Prompt**: "Logo for Nigerian restaurant, Jollof rice theme, minimalist, professional"

**Expected Results**:
- ✅ Unique logo design appears (not stock logo)
- ✅ Contains Nigerian cultural elements
- ✅ Looks professional (not random shapes)
- ✅ Image type detected as "logo"
- ✅ Appropriate model used (FLUX Dev or ControlNet)

**Failure Indicators**:
- ❌ Generic shapes with no cultural relevance
- ❌ Logo looks like it's from Google Images
- ❌ Text in logo is garbled/unreadable

**Screenshot**: `test2_logo.png`

---

### Test 3: 3D Render

**Prompt**: "3D render of futuristic Nigerian building, octane render, cyberpunk style"

**Expected Results**:
- ✅ Image shows 3D-rendered architecture
- ✅ Cyberpunk aesthetic visible
- ✅ High-quality raytracing effects
- ✅ Image type detected as "3d-render"
- ✅ FLUX model used (best for 3D)

**Failure Indicators**:
- ❌ Flat 2D illustration instead of 3D
- ❌ Low quality/blurry
- ❌ Stock architecture photo

**Screenshot**: `test3_3d_render.png`

---

### Test 4: Hybrid Design (Flyer)

**Prompt**: "Create flyer for Nigerian music festival, Lagos 2026, Afrobeats theme"

**Expected Results**:
- ✅ Image shows festival-appropriate artwork
- ✅ Vibrant colors, energetic composition
- ✅ Image type detected as "hybrid"
- ✅ Suitable for printing/posting

**Failure Indicators**:
- ❌ Generic party image
- ❌ No Nigerian cultural elements
- ❌ Low resolution/pixelated

**Screenshot**: `test4_flyer.png`

---

### Test 5: Scientific Illustration

**Prompt**: "Scientific diagram of malaria parasite lifecycle, educational, detailed, medical"

**Expected Results**:
- ✅ Shows biological/medical illustration
- ✅ Educational quality
- ✅ Image type detected as "scientific"
- ✅ Appropriate for learning materials

**Failure Indicators**:
- ❌ Random medical photo
- ❌ No educational value
- ❌ Completely inaccurate

**Screenshot**: `test5_scientific.png`

---

### Test 6: Portrait Photography

**Prompt**: "Professional portrait of young Nigerian woman, traditional attire, studio lighting"

**Expected Results**:
- ✅ AI-generated portrait (not real person)
- ✅ Nigerian cultural clothing visible
- ✅ Professional photography quality
- ✅ Image type detected as "photorealistic"

**Failure Indicators**:
- ❌ Stock photo of real person
- ❌ Generic Western clothing
- ❌ Distorted facial features (common AI artifact is OK if minor)

**Screenshot**: `test6_portrait.png`

---

### Test 7: Illustration/Artwork

**Prompt**: "Beautiful illustration of Nigerian folklore character, colorful, children's book style"

**Expected Results**:
- ✅ Artistic illustration appears
- ✅ Colorful and engaging
- ✅ Nigerian cultural elements
- ✅ Image type detected as "illustration"

**Failure Indicators**:
- ❌ Photorealistic instead of illustrated
- ❌ Generic cartoon with no cultural relevance

**Screenshot**: `test7_illustration.png`

---

### Test 8: Stress Test (Multiple Requests)

**Actions**:
1. Generate 5 images in quick succession
2. Different prompts each time
3. Monitor backend logs

**Expected Results**:
- ✅ All 5 images generate successfully
- ✅ Each image is unique (different content)
- ✅ No queue overflow errors
- ✅ Response time < 30 seconds each
- ✅ All use native-gpu provider

**Failure Indicators**:
- ❌ Timeout errors
- ❌ Duplicate images
- ❌ Falls back to external APIs
- ❌ Queue errors in ComfyUI

---

### Test 9: Fallback Chain

**Actions**:
1. Stop ComfyUI server
2. Try generating image
3. Restart ComfyUI
4. Try again

**Expected Results**:
- ✅ With GPU offline: Falls back to OpenRouter DALL-E 3
- ✅ Logs show "Native GPU not available" → "FALLBACK 1: OpenRouter"
- ✅ Image still generates (from DALL-E 3)
- ✅ Metadata shows `provider: "openrouter"`
- ✅ With GPU online: Uses native-gpu again

**Failure Indicators**:
- ❌ Complete failure when GPU offline
- ❌ No fallback attempt
- ❌ Doesn't recover when GPU comes back

---

### Test 10: Metadata Accuracy

**Actions**:
1. Generate any image
2. Inspect response metadata
3. Verify all fields are accurate

**Expected Metadata**:
```json
{
  "imageUrl": "data:image/png;base64,...",
  "provider": "native-gpu",
  "model": "Stable Diffusion XL Turbo",
  "latencyMs": 12000,
  "metadata": {
    "imageType": "photorealistic",
    "seed": 123456,
    "steps": 20,
    "cfg_scale": 7.5,
    "sampler": "euler_ancestral",
    "resolution": "1024x1024"
  }
}
```

**Verification**:
- ✅ `provider` matches actual source (not lie)
- ✅ `model` is real model name (not "auto" or "unknown")
- ✅ `latencyMs` is realistic (5000-30000ms for GPU)
- ✅ `imageType` is correctly classified
- ✅ `seed` is number (for reproducibility)

**Failure Indicators**:
- ❌ `provider: "native-gpu"` but actually used external API
- ❌ `model: "unknown"`
- ❌ Missing metadata fields
- ❌ Dishonest data

---

## VALIDATION CHECKLIST

After completing all tests, verify:

### ✅ Quality Standards
- [ ] All images are REAL AI generations (not stock photos)
- [ ] Image quality matches reference images (9JAI logo, Mama Africana)
- [ ] No SVG placeholders in successful cases
- [ ] Each image is unique (not duplicates)
- [ ] Images are usable for intended purpose

### ✅ Technical Standards
- [ ] Native GPU is PRIMARY provider (appears first in logs)
- [ ] Fallback chain works correctly (GPU → OpenRouter → Pollinations)
- [ ] Response times acceptable (<30s per image)
- [ ] Metadata is accurate and honest
- [ ] Image validation passes (not placeholder)

### ✅ User Experience
- [ ] Images display correctly in chat
- [ ] Download buttons work (PNG/JPG)
- [ ] Regenerate button works
- [ ] Quota system works (if enabled)
- [ ] Error messages are helpful

### ✅ Cost Verification
- [ ] >90% of requests use native-gpu (FREE)
- [ ] <10% fallback to OpenRouter ($0.04/image)
- [ ] Total monthly cost < $150 (GPU + fallback)
- [ ] Cost-per-image < $0.01 average

---

## BUG REPORTING TEMPLATE

If any test fails, document using this format:

```markdown
### Bug: [Short Description]

**Test**: Test 3: 3D Render
**Prompt**: "3D render of futuristic Nigerian building..."

**Expected**: High-quality 3D rendered image using FLUX model
**Actual**: Received SVG placeholder with generic building icon

**Screenshots**:
- [Attach screenshot of browser]
- [Attach screenshot of network tab showing response]

**Logs**:
```
[MediaEngine] PRIMARY: Trying native GPU generation
[NativeAI] Generation failed: CUDA out of memory
[MediaEngine] ✗ native-gpu failed: CUDA OOM
[MediaEngine] FALLBACK 1: Trying OpenRouter
[MediaEngine] ✗ openrouter failed: Rate limit
[MediaEngine] FALLBACK 2: Trying Pollinations
[MediaEngine] ✗ pollinations failed: 403 Forbidden
[MediaEngine] All providers exhausted
```

**Root Cause**: GPU ran out of VRAM (using 24GB model on 16GB GPU)

**Fix**: Switch to smaller model (SDXL Turbo instead of FLUX Dev)

**Status**: Fixed ✅ / In Progress 🔄 / Blocked 🚫
```

---

## SUCCESS CRITERIA

The image generation system is considered **WORKING** only when:

1. ✅ All 10 tests pass
2. ✅ 100% of successful generations use native-gpu provider
3. ✅ 0% SVG placeholders in successful cases
4. ✅ All images are physically verifiable as AI-generated
5. ✅ Metadata is accurate and honest
6. ✅ Fallback chain works when GPU offline
7. ✅ Cost per image < $0.01 average
8. ✅ User can see the difference between native and fallback generations

**DO NOT DEPLOY TO PRODUCTION UNTIL ALL CRITERIA ARE MET.**

---

## POST-DEPLOYMENT MONITORING

After deployment, monitor these metrics:

### Daily Checks
- [ ] Provider usage: native-gpu vs fallbacks
- [ ] Average generation time
- [ ] Error rate per provider
- [ ] Image validation pass rate
- [ ] User complaints about quality

### Weekly Checks
- [ ] Cost analysis (GPU hours vs API costs)
- [ ] GPU utilization (peak/average)
- [ ] Model performance (which models used most)
- [ ] Fallback frequency (should be <5%)

### Monthly Review
- [ ] Total cost vs budget
- [ ] Image quality feedback
- [ ] Model updates needed
- [ ] Infrastructure scaling needs

---

## REGRESSION TESTING

Run this test suite:
- After any backend code changes
- After model updates
- After GPU infrastructure changes
- Monthly as scheduled maintenance

**Automate where possible**:
```bash
# Test script example
npm run test:image-generation

# Should test:
# - Native AI engine compiles
# - ComfyUI endpoint responds
# - Image generation succeeds
# - Metadata is accurate
# - File size validation passes
```

---

## CONCLUSION

**The ONLY way to know image generation works is to:**

1. Generate an image
2. Open it in the browser
3. Verify it's NOT an SVG placeholder
4. Verify it's NOT a stock photo
5. Verify the metadata says "native-gpu"
6. Verify the backend logs show native GPU was used

**If ANY of these fail, the system is BROKEN and needs fixing before claiming it works.**

**NO SHORTCUTS. NO ASSUMPTIONS. PHYSICAL TESTING ONLY.**
