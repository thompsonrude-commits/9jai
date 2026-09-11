# Quick Start: Native AI Image Generation

Get REAL AI image generation working in 1 hour.

---

## What Changed?

### ❌ OLD SYSTEM (BROKEN)
- Uses OpenRouter DALL-E 3 as PRIMARY ($0.04/image)
- Falls back to Pollinations (returns 403 errors)
- Returns SVG placeholders when APIs fail
- **RESULT**: Users get stock photos/placeholders, not AI generations

### ✅ NEW SYSTEM (CORRECT)
- Uses SELF-HOSTED GPU as PRIMARY (FREE)
- Falls back to OpenRouter only if GPU offline ($0.04/image)
- Validates images are REAL AI generations
- **RESULT**: Users get actual AI-generated images from your GPU

---

## Step-by-Step Setup (1 Hour)

### Step 1: Deploy GPU Pod (10 minutes)

1. Go to https://runpod.io → Sign up → Add $10 credit
2. **Pods** → **Deploy** → Search "ComfyUI"
3. Select **"ComfyUI + SDXL"** template
4. Choose **RTX 3090** GPU ($0.30/hour)
5. Volume: **50GB**
6. Click **Deploy On-Demand**
7. Wait 2 minutes for pod to start
8. Click **Connect** → **HTTP Service** (port 7860)
9. Copy the URL: `https://[POD_ID]-7860.proxy.runpod.net`

**Test**: Open URL in browser → You should see ComfyUI interface

---

### Step 2: Download Models (20 minutes)

In ComfyUI interface:

1. Go to **Manager** → **Model Manager**
2. Search: **"SDXL Turbo"**
3. Click **Install** (downloads 7GB model)
4. Wait ~15 minutes for download
5. Refresh page → Model should appear in checkpoint list

**Test**: Load default workflow → Enter prompt → Click "Queue Prompt" → Image generates ✅

---

### Step 3: Configure Backend (5 minutes)

```bash
# Navigate to functions directory
cd functions

# Set ComfyUI endpoint as Firebase secret
firebase functions:secrets:set COMFYUI_ENDPOINT
# Enter your RunPod URL when prompted:
# https://abc123-7860.proxy.runpod.net

# Build and deploy
npm run build
npm run deploy
```

Wait ~3 minutes for deployment.

**Test**: 
```bash
# Check function is deployed
firebase functions:list | grep aiimage
```

---

### Step 4: Test from App (10 minutes)

1. Open your 9JAI app: https://9jai.web.app
2. Log in with your account
3. In chat, type: **"Generate image of Nigerian Jollof rice, professional food photography"**
4. Wait 10-20 seconds
5. Image should appear!

**Verify it's REAL AI generation**:
- Right-click image → Inspect element
- Should show: `<img src="data:image/png;base64,..."`
- Should NOT be SVG (`data:image/svg+xml`)
- File size should be ~500KB-2MB (check network tab)

---

### Step 5: Check Logs (5 minutes)

```bash
# View Firebase Functions logs
firebase functions:log --only aiimage --lines 50

# Look for these lines:
# [MediaEngine] PRIMARY: Trying native GPU generation
# [NativeAI] Selected model: Stable Diffusion XL Turbo
# [NativeAI] ✓ Generation complete in 12000ms
# [MediaEngine] ✓ SUCCESS with native-gpu
```

If you see these logs AND image appeared in app → **SUCCESS!** 🎉

---

## Verification Checklist

Before claiming success, verify ALL of these:

- [ ] Image displays in browser
- [ ] Image is NOT an SVG placeholder
- [ ] Image looks AI-generated (unique, not stock photo)
- [ ] Inspect element shows `data:image/png;base64`
- [ ] File size is 200KB-2MB
- [ ] Backend logs show "native-gpu" success
- [ ] Metadata shows correct provider and model
- [ ] Can regenerate and get different result
- [ ] Multiple prompts work (landscapes, portraits, logos)

**If ANY fail → System is NOT working, needs debugging**

---

## Troubleshooting

### "Native GPU infrastructure not available"

**Problem**: Backend can't reach ComfyUI

**Fix**:
```bash
# Test endpoint manually
curl https://[POD_ID]-7860.proxy.runpod.net/system_stats

# If fails:
# 1. Check pod is running on RunPod dashboard
# 2. Restart pod if needed
# 3. Verify URL is correct
# 4. Check firewall/network
```

---

### "Image generation timed out"

**Problem**: ComfyUI is taking too long or stuck

**Fix**:
1. Check ComfyUI web interface → Any errors?
2. Try generating from web UI directly
3. Check GPU usage: Is it actually processing?
4. May need to increase timeout in code

---

### Getting SVG Placeholder

**Problem**: All providers failed, returned fallback

**Fix**:
1. Check logs to see which provider was tried
2. If native-gpu failed: Check ComfyUI endpoint
3. If OpenRouter failed: Check API key and credits
4. If Pollinations failed: Expected (it's unreliable)

---

### Wrong Provider in Metadata

**Problem**: Metadata says "native-gpu" but actually used external API

**This is a LIE and MUST BE FIXED**

**Fix**:
- Review `media/engine.ts` provider chain
- Ensure correct provider name is returned
- Never fake metadata

---

## Cost Monitoring

After setup, monitor costs:

```bash
# Check RunPod usage
# Dashboard → Billing → Current Usage

# Example costs:
# - 10 hours/day @ $0.30/hr = $90/month
# - 24/7 @ $0.30/hr = $220/month

# Compare to old system:
# - 100 users × 10 images/day × $0.04 = $1,200/month
# - Savings: $1,110/month! 💰
```

---

## Next Steps

### Today
- [x] Deploy GPU pod
- [x] Test generation works
- [x] Verify logs show native-gpu
- [ ] Test 10 different prompts
- [ ] Document any issues

### This Week
- [ ] Run full test suite (see IMAGE_GENERATION_TEST_PLAN.md)
- [ ] Monitor costs and performance
- [ ] Fine-tune model selection
- [ ] Add more models (FLUX, etc.)

### This Month
- [ ] Consider self-hosted GPU (RTX 4090)
- [ ] Set up monitoring dashboard
- [ ] Implement image type classification
- [ ] Build hybrid design pipeline

---

## Reference Documents

- **ARCHITECTURE_REBUILD_PLAN.md** - Full technical architecture
- **GPU_SETUP_GUIDE.md** - Detailed setup for all GPU options
- **IMAGE_GENERATION_TEST_PLAN.md** - Complete testing protocol
- **functions/src/media/nativeAIEngine.ts** - Native AI engine code

---

## Support

If you get stuck:

1. Check ComfyUI web interface for errors
2. Review Firebase Functions logs
3. Test endpoint with curl
4. Verify models are downloaded
5. Check GPU with `nvidia-smi` (if self-hosted)

**Most common issues:**
- Model not downloaded → Re-download from ComfyUI Manager
- Endpoint unreachable → Check pod is running and URL correct
- CUDA out of memory → Use smaller model or reduce resolution
- Timeout → Increase polling timeout or check GPU is working

---

## Success Criteria

✅ **System is working when:**
- Native GPU generates images successfully
- Logs show "native-gpu" provider
- Images are REAL AI generations (not placeholders)
- Metadata is accurate
- Cost per image < $0.01
- Response time < 30 seconds

❌ **System is NOT working if:**
- Getting SVG placeholders
- Logs show only external APIs used
- Metadata is dishonest
- Images are stock photos
- Cost per image > $0.02
- Constant timeouts

---

## Immediate Actions

**RIGHT NOW:**

1. ☐ Sign up for RunPod
2. ☐ Deploy ComfyUI pod
3. ☐ Test generation in ComfyUI web UI
4. ☐ Configure Firebase secrets
5. ☐ Deploy backend
6. ☐ Test from app
7. ☐ Verify logs
8. ☐ Celebrate! 🎉

**Don't wait. Don't overthink. Just follow the steps.**

The system is designed, code is written, you just need to:
1. Deploy GPU
2. Point backend to GPU
3. Test

That's it. 1 hour. Let's go! 🚀
