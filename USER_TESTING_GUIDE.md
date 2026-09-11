# 9JAI User Testing Guide
**For**: Obosa Thompson Emuze  
**Date**: 2026-08-19  
**Purpose**: Verify all features work in production

---

## 🎯 Quick Start (5 Critical Tests)

### Test 1: Admin Login ⏱️ 2 minutes
1. Open: https://9jai.web.app/admin
2. Type email: `obosathompsons@gmail.com`
3. Type password: `admin8594`
4. **Check**: Can you SEE the text while typing? (not white on white)
5. Click "Login"
6. **Expected**: Redirects to `/admin/training`
7. **If broken**: Take screenshot, note error message

**✅ Pass / ❌ Fail**: _____________

---

### Test 2: Interactive Maps ⏱️ 1 minute
1. Open: https://9jai.web.app
2. Type: `show me map of Lagos`
3. **Expected**: Interactive Google Map appears
4. **NOT Expected**: "Image generation unavailable" error
5. Try: `direction from Lagos to Abuja`
6. **Expected**: Route shown on map

**✅ Pass / ❌ Fail**: _____________

---

### Test 3: Image Generation ⏱️ 2 minutes
1. Open: https://9jai.web.app
2. Type: `generate image of Lagos skyline at sunset`
3. Wait for generation (30-60 seconds)
4. **Expected**: Image of Lagos skyline appears
5. **NOT Expected**: 403 error, 502 error, HTML code, or "unavailable"

**✅ Pass / ❌ Fail**: _____________

---

### Test 4: Edo Language ⏱️ 2 minutes
1. Switch language to "Edo" (dropdown top right)
2. Type: `Koyo`
3. **Expected Response**: Pure Edo like "Koyo! Vbèè óye hé?" or "Domo!"
4. **Check**: NO Pidgin words (no "I go", "wetin", "dey", "na")
5. Try: `Ọbowiẹ` (Good morning)
6. **Expected**: Edo response only

**✅ Pass / ❌ Fail**: _____________

---

### Test 5: Nigerian Pidgin ⏱️ 2 minutes
1. Switch language to "Nigerian Pidgin"
2. Type: `how far`
3. **Expected Response**: "I dey fine!" (NOT "me dey fine")
4. Try: `tell me wetin you know`
5. **Check**: AI uses "I" as subject, "me" as object
6. **Check**: NO "me go" or "me dey" anywhere

**✅ Pass / ❌ Fail**: _____________

---

## ⏰ TOTAL TIME: 10 minutes for critical tests

**If all 5 pass**: ✅ App is production-ready!  
**If any fail**: ❌ Report which one(s) failed with details

---

## 📋 Extended Testing (Optional - 30 minutes)

### Category 1: Languages (15 minutes)

Test each language:

**English** `Hello, how are you?`
- [ ] Responds in English
- [ ] Natural conversation

**Yoruba** `Bawo ni?`
- [ ] Responds in Yoruba with tone marks
- [ ] No language mixing

**Igbo** `Kedu?`
- [ ] Responds in Igbo
- [ ] Proper greetings

**Hausa** `Sannu`
- [ ] Responds in Hausa
- [ ] Northern dialect

**Esan** (Greeting in Esan)
- [ ] Responds in Esan
- [ ] No confusion with Edo

**Efik** (Greeting in Efik)
- [ ] Responds in Efik

**Tiv** (Greeting in Tiv)
- [ ] Responds in Tiv

**Fulfulde** (Greeting in Fulfulde)
- [ ] Responds in Fulfulde

**Kanuri** (Greeting in Kanuri)
- [ ] Responds in Kanuri

**Swahili** `Habari?`
- [ ] Responds in Swahili

**Language Detection**
- [ ] Type in different language without switching
- [ ] AI auto-detects and responds in same language

---

### Category 2: Visual Features (5 minutes)

**Image Upload & Analysis**
- [ ] Click camera icon
- [ ] Upload image
- [ ] Ask "what's in this image?"
- [ ] AI describes image content
- [ ] No technical error messages visible

**OCR (Text in Image)**
- [ ] Upload image with text
- [ ] Ask "read this image"
- [ ] AI extracts text correctly

**Diagram Generation**
- [ ] Ask "explain photosynthesis with a diagram"
- [ ] Diagram appears as image (NOT code)
- [ ] AI explains diagram afterward

**Video Generation**
- [ ] Ask "create video of busy Lagos street"
- [ ] Video generation starts
- [ ] Video appears or status shown

---

### Category 3: Voice Features (3 minutes)

**Speech-to-Text**
- [ ] Click microphone icon
- [ ] Speak: "Hello, how are you?"
- [ ] Text appears in input box
- [ ] Transcription accurate

**Text-to-Speech**
- [ ] Enable speaker icon (🔊)
- [ ] Send message
- [ ] AI speaks response aloud
- [ ] Voice is clear and natural
- [ ] Nigerian accent/personality

---

### Category 4: Admin Features (7 minutes)

**Training Studio** (after logging in)
- [ ] Can add new training entry
- [ ] Can select entry type (Conversation/Correction/Vocabulary)
- [ ] Can fill Edo text + English meaning
- [ ] Can record audio
- [ ] Entry saves successfully
- [ ] Entry appears in list
- [ ] Can edit entry
- [ ] Can delete entry

**Agent Management**
- [ ] Click "Manage Agents" button
- [ ] Can create new agent
- [ ] Enter name, email, password
- [ ] Choose role (Trainer/Admin)
- [ ] Agent saves successfully
- [ ] Agent appears in list
- [ ] Can edit agent
- [ ] Can delete agent

**Agent Login**
- [ ] Logout as admin
- [ ] Login with agent credentials
- [ ] Agent can access /admin/training
- [ ] Trainers CANNOT access /admin/agents
- [ ] Admins CAN access /admin/agents

**Auto-Learning**
- [ ] Have conversation in Pidgin
- [ ] If AI makes mistake, type: `correction: [right answer]`
- [ ] Go to Training Studio
- [ ] Check if correction appears
- [ ] Should be marked "auto-learned"

---

## 🐛 Bug Reporting Template

If something doesn't work, copy this template:

```
FEATURE: [e.g., Image Generation]
TEST: [e.g., "generate image of Lagos"]
EXPECTED: [e.g., Image appears]
ACTUAL: [e.g., "403 Forbidden" error]
ERROR MESSAGE: [copy exact error]
SCREENSHOT: [attach if possible]
BROWSER: [Chrome/Safari/Firefox]
DEVICE: [Desktop/Mobile/Tablet]
TIME: [when it happened]
```

---

## 🎨 Visual Checks

### Loading Animation
When AI is thinking:
- [ ] Three dots appear
- [ ] First dot is GREEN (#008751)
- [ ] Second dot is WHITE
- [ ] Third dot is GREEN (#008751)
- [ ] Dots bounce with animation
- [ ] Nigerian flag colors visible

### UI Elements
- [ ] Logo animates on startup
- [ ] Background shows network animation
- [ ] Messages stream word-by-word
- [ ] Chat history loads on refresh
- [ ] Sidebar opens/closes smoothly
- [ ] Language dropdown works
- [ ] Theme switching works

---

## 📱 PWA Testing (Optional)

**Desktop**
- [ ] Install banner appears
- [ ] Click "Install App"
- [ ] App installs as PWA
- [ ] App opens in window (not browser tab)
- [ ] App icon appears on desktop/taskbar

**Mobile**
- [ ] "Add to Home Screen" prompt appears
- [ ] Install app
- [ ] App opens fullscreen
- [ ] App icon on home screen
- [ ] Works offline (basic features)

**Auto-Update**
- [ ] Use app for a while
- [ ] New version deployed
- [ ] App shows update notification
- [ ] App updates without reinstall

---

## 🔍 Advanced Features Testing (Optional)

**Spreadsheet Generation**
```
Test: "create monthly expense budget for a Nigerian family"
Expected: Interactive spreadsheet appears
```

**Document Upload**
```
Test: Upload PDF document
Ask: "summarize this document"
Expected: AI reads and summarizes
```

**Weather** (if backend fixed)
```
Test: "what's the weather in Lagos?"
Expected: Current weather + forecast
```

**Web Search** (if backend fixed)
```
Test: "search for latest news about Nigeria"
Expected: Recent search results
```

**Theme Change**
```
Test: "change theme to dark"
Expected: UI switches to dark theme
```

**Session Management**
```
Test: Create multiple chat sessions
Expected: Can switch between sessions, history persists
```

---

## ✅ Testing Checklist Summary

### Must Test (Critical):
- [ ] Admin login
- [ ] Maps
- [ ] Image generation
- [ ] Edo language
- [ ] Nigerian Pidgin

### Should Test (Important):
- [ ] All 12 languages
- [ ] Vision/image upload
- [ ] Voice input/output
- [ ] Training studio
- [ ] Agent management

### Nice to Test (Optional):
- [ ] Video generation
- [ ] OCR
- [ ] Diagrams
- [ ] Documents
- [ ] PWA features

---

## 📊 Results Report Template

After testing, fill this out:

```
TESTING DATE: _____________
TESTER: Obosa Thompson Emuze

CRITICAL TESTS (5):
1. Admin Login: ✅ / ❌
2. Maps: ✅ / ❌
3. Image Generation: ✅ / ❌
4. Edo Language: ✅ / ❌
5. Nigerian Pidgin: ✅ / ❌

PASS RATE: ___/5 (___%)

ISSUES FOUND:
1. [Description]
2. [Description]
...

WORKS WELL:
1. [Description]
2. [Description]
...

OVERALL IMPRESSION:
[Your thoughts]

READY FOR LAUNCH: YES / NO
```

---

## 🚀 After Testing

### If Everything Works:
1. App is production-ready! 🎉
2. Can start onboarding users
3. Monitor for issues
4. Collect user feedback

### If Issues Found:
1. Report issues using bug template above
2. I'll fix them
3. Retest affected features
4. Repeat until all pass

---

## 💡 Testing Tips

1. **Use Incognito/Private Mode** - Fresh state, no cache
2. **Test on Different Browsers** - Chrome, Safari, Firefox
3. **Test on Mobile** - Different screen size, touch input
4. **Take Screenshots** - Easier to show issues
5. **Copy Error Messages** - Exact text helps debugging
6. **Test Edge Cases** - Very long messages, special characters
7. **Test Offline** - PWA offline features
8. **Clear Cache** - If something seems broken, try clearing cache first

---

## 📞 Support

If you get stuck or have questions:
1. Report issue in chat
2. Provide: Feature name, what you tried, what happened, error message
3. Screenshot helps a lot
4. I'll investigate and fix

---

## 🎯 Success Criteria

**Minimum for Launch**:
- ✅ Admin login works
- ✅ Chat works in all languages
- ✅ Image generation works
- ✅ Maps work
- ✅ Language detection works

**Ideal for Launch**:
- All above +
- ✅ Vision works
- ✅ Voice works
- ✅ Training works
- ✅ Auto-learning works
- ✅ PWA installs

---

**READY? START TESTING!** ⏰

Begin with the 5 critical tests (10 minutes), then report results.
