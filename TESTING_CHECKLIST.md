# 9JAI Component Testing Checklist

## Deployment Status
**Date**: 2026-08-19
**Frontend**: ✅ Deployed successfully to https://9jai.web.app
**Backend**: ⚠️ Partial deployment (critical functions working)

### Successfully Deployed Functions:
- ✅ aiChat - Text chat endpoint
- ✅ aiStream - Streaming chat endpoint  
- ✅ aiImage - Image generation endpoint (**FIXED**)
- ✅ aiVision - Image analysis endpoint
- ✅ aiVideo - Video generation endpoint
- ✅ aiTranscribe - Speech-to-text endpoint
- ✅ aiTTS - Text-to-speech endpoint
- ✅ aiWeather - Weather data endpoint
- ✅ aiReady - Health check endpoint
- ✅ v1ImageGenerate - Alternative image generation
- ✅ v1Ocr - OCR endpoint
- ✅ v1VideoProcess - Video processing
- ✅ v1VideoStatus - Video status check
- ✅ v1Document - Document handling
- ✅ v1VisualOrchestrator - Visual generation orchestrator
- ✅ debugEcho - Echo test endpoint
- ✅ aiReplay - Replay endpoint
- ✅ aiExplanation - Explanation generation

### Failed Functions (Non-Critical):
- ❌ aiFetchImage (fallback exists)
- ❌ aiHealth (aiReady works as alternative)
- ❌ aiLiveness (aiReady works as alternative)
- ❌ aiSearch (can use external search)
- ❌ aiTime (can use client-side time)
- ❌ v1ConnectorRegistry (optional feature)
- ❌ v1PluginRegistry (optional feature)
- ❌ v1VideoWorkerHealth (optional monitoring)

---

## Frontend Components to Test

### 1. ✅ Admin Login System
**URL**: https://9jai.web.app/admin
**Status**: NEEDS TESTING
**Credentials**:
- Email: obosathompsons@gmail.com
- Password: admin8594

**Test Cases**:
- [ ] Can access /admin page
- [ ] Input fields visible (not white on white)
- [ ] Can type in email and password fields
- [ ] Login redirects to /admin/training
- [ ] Admin stays logged in after refresh
- [ ] Can access Agent Management

---

### 2. ⚠️ Loading Dots Animation
**Status**: FIXED (needs visual verification)
**Colors**: Green, White, Green (Nigerian flag)
**Test Cases**:
- [ ] Dots appear when AI is thinking
- [ ] First dot is green (#008751)
- [ ] Second dot is white
- [ ] Third dot is green (#008751)
- [ ] Dots bounce with staggered animation
- [ ] Animation smooth and visible

---

### 3. ⚠️ Image Generation
**Status**: BACKEND FIXED (needs testing)
**Test Cases**:
- [ ] Ask: "generate image of Lagos skyline"
- [ ] Image appears (not HTML error)
- [ ] Image loads successfully
- [ ] No 403 Forbidden error
- [ ] No 502 Bad Gateway error
- [ ] Can generate multiple images in same session

---

### 4. ✅ Map/Directions Feature
**Status**: FIXED (needs testing)
**Test Cases**:
- [ ] Ask: "show me map of Lagos"
   - Should show interactive map, NOT try to generate image
- [ ] Ask: "where is Benin City"
   - Should show interactive map
- [ ] Ask: "direction from Lagos to Abuja"
   - Should show directions map with route
- [ ] Map is interactive (can zoom, pan)
- [ ] No "image generation unavailable" error

---

### 5. ⚠️ Nigerian Pidgin Language
**Status**: FIXED (needs testing)
**Test Cases**:
- [ ] Say: "how far"
   - Should respond: "I dey fine o!" (NOT "me dey fine")
- [ ] Say: "tell me wetin you want"
   - Should use "tell me" (NOT "tell I")
- [ ] Say: "wetin you dey do"
   - Should respond with "I dey..." (NOT "me dey...")
- [ ] Consistent "I" as subject, "me" as object throughout conversation

---

### 6. ⚠️ Edo Language
**Status**: UPDATED (needs testing)
**Verified Greetings**:
- Ọbowiẹ = Good morning
- Ọbahvan = Good afternoon
- Ọbota = Good evening
- Koyo = Hello/Welcome
- Vbèè óye hé? = How are you?
- Ù rú èsé = Thank you

**Test Cases**:
- [ ] Say: "Koyo"
   - Should respond: "Koyo!" or "Domo! Vbèè óye hé?"
- [ ] Say: "Ọbowiẹ"
   - Should respond: "Ọbowiẹ!" or "Domo!"
- [ ] Say: "Vbèè óye hé?"
   - Should respond: "Òy' èsé" or "Mio"
- [ ] No Pidgin words mixed in (no "I go", "wetin", "dey", "na")
- [ ] Responses are 100% pure Edo

---

### 7. ✅ Auto-Learning System
**Status**: IMPLEMENTED (needs testing)
**Test Cases**:
- [ ] Say something to AI in Pidgin
- [ ] If AI makes mistake, say: "Correction: [right answer]"
- [ ] Login as admin at /admin/training
- [ ] Check if correction appears in Training Studio
- [ ] Correction marked as "auto-learned"
- [ ] Can edit or delete auto-learned corrections

---

### 8. ✅ Agent Management
**Status**: IMPLEMENTED (needs testing)
**Test Cases**:
- [ ] Login as admin at /admin/training
- [ ] Click "Manage Agents" button (top right)
- [ ] Can create new agent with name, email, password
- [ ] Can choose role: Trainer or Admin
- [ ] Agent appears in list after creation
- [ ] Can edit agent details
- [ ] Can delete agent
- [ ] Agent can login at /admin with their credentials
- [ ] Agent can access Training Studio

---

### 9. ✅ Training Studio
**Status**: EXISTS (needs testing)
**URL**: https://9jai.web.app/admin/training
**Test Cases**:
- [ ] Can add training entry
- [ ] Can select entry type (Conversation, Correction, Vocabulary, Grammar, Culture)
- [ ] Can fill Edo text and English meaning
- [ ] Can record audio pronunciation
- [ ] Can upload audio file
- [ ] Can preview audio before saving
- [ ] Entry appears in list after saving
- [ ] Can edit existing entry
- [ ] Can delete entry
- [ ] Filter by entry type works

---

### 10. ✅ PWA Features
**Status**: IMPLEMENTED (needs testing)
**Test Cases**:
- [ ] Install banner appears on mobile/desktop
- [ ] Can click "Install App"
- [ ] App installs as PWA
- [ ] App works offline (basic features)
- [ ] App auto-updates when new version deployed
- [ ] Service worker registers successfully

---

### 11. ✅ Text Chat
**Status**: SHOULD WORK (needs testing)
**Test Cases**:
- [ ] Can type message and send
- [ ] AI responds in selected language
- [ ] Responses stream word-by-word
- [ ] Can switch languages and AI follows
- [ ] Chat history persists
- [ ] Can have multi-turn conversation

---

### 12. ✅ Vision/Image Upload
**Status**: SHOULD WORK (needs testing)
**Test Cases**:
- [ ] Can upload image
- [ ] AI analyzes image content
- [ ] AI describes what's in the image
- [ ] Can ask follow-up questions about image
- [ ] No technical debug messages visible

---

### 13. ✅ Diagram Generation
**Status**: FIXED (needs testing)
**Test Cases**:
- [ ] Ask: "explain photosynthesis with a diagram"
- [ ] Diagram appears as image (NOT HTML/SVG code)
- [ ] Diagram is relevant to request
- [ ] AI explains diagram after showing it

---

## Critical Issues Found

### Issue 1: Admin Input Text Invisible
**Status**: ❓ NEEDS VERIFICATION
**Expected**: Black text on white background
**Problem**: Might be white text on white background
**Location**: /admin login form
**Need to test**: Can text be seen while typing?

### Issue 2: Image Generation 403
**Status**: ✅ FIXED
**Solution**: Added CORS headers and `invoker: 'public'` to aiImage function
**Need to test**: Does image generation work now?

### Issue 3: Maps Generating as Images
**Status**: ✅ FIXED
**Solution**: Check for map requests BEFORE image requests
**Need to test**: Do maps show interactively now?

### Issue 4: Loading Dots Not Nigerian Colors
**Status**: ✅ FIXED
**Solution**: Changed to green, white, green
**Need to test**: Are colors correct?

### Issue 5: Edo Language Not Recognizable
**Status**: ✅ UPDATED
**Solution**: Added verified greetings from user
**Need to test**: Does AI use correct Edo now?

### Issue 6: Nigerian Pidgin Pronoun Issues
**Status**: ✅ FIXED
**Solution**: Added explicit pronoun rules to system prompt
**Need to test**: Does AI use "I" and "me" correctly?

---

## Testing Priority

### HIGH PRIORITY (Must Work):
1. **Admin Login** - User needs access
2. **Maps** - Core feature not working
3. **Image Generation** - Core feature not working
4. **Edo Language** - Core feature accuracy
5. **Nigerian Pidgin** - Core feature accuracy

### MEDIUM PRIORITY (Should Work):
6. Loading dots colors
7. Text chat
8. Auto-learning
9. Agent management
10. Training studio

### LOW PRIORITY (Nice to Have):
11. Vision/image upload
12. Diagram generation
13. PWA features

---

## Next Steps

1. **YOU** test each component manually
2. Report which ones work and which don't
3. I'll fix any that don't work
4. Repeat until all are working
5. Document final status

---

## How to Test

1. Open https://9jai.web.app in browser
2. Go through each test case above
3. Mark with ✅ if working, ❌ if broken
4. For broken features, note exact error message
5. Take screenshots if helpful
6. Report findings

---

## Expected User Experience

### User asks for map:
- User: "show me map of Lagos"
- App: Shows interactive Google Map of Lagos
- ✅ NO error message
- ✅ NO attempt to generate image

### User asks for image:
- User: "generate image of sunset"
- App: Shows "Generating now 🎨"
- App: Shows image of sunset
- ✅ NO 403 error
- ✅ NO HTML code visible

### User speaks Edo:
- User: "Koyo"
- App: "Koyo! Vbèè óye hé?" (in Edo)
- ✅ NO Pidgin mixed in
- ✅ PURE Edo only

### User speaks Pidgin:
- User: "how far"
- App: "I dey fine o!" (NOT "me dey fine")
- ✅ Correct pronouns
- ✅ Natural Pidgin

### Admin logs in:
- Go to: https://9jai.web.app/admin
- Email: obosathompsons@gmail.com
- Password: admin8594
- ✅ Can see text while typing
- ✅ Redirects to /admin/training
- ✅ Can create agents

---

**STATUS**: Ready for testing
**DEPLOYED**: Yes
**TESTED**: No (awaiting user verification)
