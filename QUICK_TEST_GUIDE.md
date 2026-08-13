# ⚡ QUICK TEST GUIDE

## 🎯 DO THIS FIRST

### Clear Your Browser Cache (REQUIRED!)

**Windows/Linux**:
```
Press: Ctrl + Shift + R
```

**Mac**:
```
Press: Cmd + Shift + R
```

**Alternative**:
1. Press `F12` (opens DevTools)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

---

## ✅ TEST CHECKLIST

Visit: **https://9jai.web.app**

### Test 1: Chat (Should Work)
**Type**: `Hello, how are you?`
**Expected**: Real AI response from Groq

**✅ Success**: You get a meaningful response
**❌ Failure**: You get generic/placeholder text

---

### Test 2: Image Generation (Should Work)
**Type**: `generate image of a lion`
**Expected**: Real AI-generated photo of a lion

**✅ Success**: You see a realistic lion image
**❌ Failure**: You see:
- Orange circle
- Green triangle
- Other placeholder SVG shapes

**If you see placeholders**: YOU DIDN'T CLEAR CACHE PROPERLY!
- Try again with DevTools open (F12)
- Use "Empty Cache and Hard Reload"

---

### Test 3: Vision Analysis (Expected to Fail)
**Action**: Upload any image
**Expected**: Error message "Vision analysis unavailable"

**✅ Success**: Clear error message (this is correct!)
**❌ Failure**: 503 error or crash

---

### Test 4: Research (Limited)
**Type**: `research the history of Nigeria`
**Expected**: Response based on AI knowledge (no live web data)

**✅ Success**: You get a response (even if limited)
**❌ Failure**: Error or no response

---

## 🔍 VERIFY BACKEND CONNECTION

### Check Network Tab (IMPORTANT!)

1. Press `F12` (DevTools)
2. Go to **Network** tab
3. Type a message or generate image
4. Look at the requests

**✅ GOOD - You should see**:
- `/api/v1/chat` → Status 200
- `/api/v1/image/generate` → Status 200

**❌ BAD - If you see**:
- `/api/ai/*` requests (OLD endpoints)
- 404 or 500 errors
- No API calls at all

**If you see BAD**: Clear cache again!

---

## 📊 EXPECTED RESULTS

| Feature | Status | What You See |
|---------|--------|--------------|
| Chat | ✅ Works | Real AI response |
| Image Gen | ✅ Works | Real photos, NOT placeholders |
| Vision | ⚠️ Error | "Vision unavailable" message |
| Research | ⚠️ Limited | Works but no web search |

---

## 🚨 IF IMAGES ARE STILL PLACEHOLDERS

This means your cache is NOT cleared. Try this:

### Method 1: Nuclear Option
1. Press `F12` (DevTools)
2. Click "Application" tab
3. Click "Clear storage" on left
4. Click "Clear site data" button
5. Refresh page

### Method 2: Incognito/Private Mode
1. Open Incognito/Private window
2. Go to: https://9jai.web.app
3. Test image generation
4. If it works in incognito → it's a cache issue

### Method 3: Different Browser
1. Try Chrome if you're on Firefox
2. Try Firefox if you're on Chrome
3. Fresh browser = no cache

---

## 📸 WHAT TO SCREENSHOT

If images still don't work, send me:

### Screenshot 1: Network Tab
1. F12 → Network tab
2. Generate image
3. Screenshot showing the API calls

### Screenshot 2: Console Tab
1. F12 → Console tab
2. Screenshot showing any errors (red text)

### Screenshot 3: Actual Result
1. Screenshot of what you see
2. If placeholder graphics, show them

---

## 💬 REPORT BACK

Tell me:

1. **Did chat work?** (Yes/No)
2. **Did you get REAL images?** (Yes/No/Still seeing placeholders)
3. **Did you clear cache?** (Yes/No)
4. **What browser?** (Chrome/Firefox/Edge/Safari)
5. **Any errors in console?** (Copy/paste if yes)

---

## 🎯 QUICK DECISION

After testing, answer:

### Question 1: Core Features Working?
- [ ] Yes, chat and images work perfectly
- [ ] No, still seeing placeholders (send screenshots)

### Question 2: Research Feature?
- [ ] Yes, I need web search capability (I'll configure Tavily)
- [ ] No, current chat-only is fine for now

### Question 3: Vision Analysis?
- [ ] Yes, I need this feature (need Ollama or OpenRouter)
- [ ] No, not needed right now

---

## ⚡ FASTEST PATH TO SUCCESS

1. Clear cache: `Ctrl + Shift + R`
2. Test chat: type "hello"
3. Test images: type "generate image of a lion"
4. If REAL lion appears → ✅ SUCCESS!
5. If placeholder shapes appear → Clear cache AGAIN!

---

**Test now and report back! 🚀**
