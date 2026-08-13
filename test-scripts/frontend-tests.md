# Frontend Manual Test Script

## Prerequisites
- Open https://9jai.web.app in browser
- Have Google account ready
- Open browser DevTools (F12)

---

## Test 1: Sidebar Functionality

### Steps:
1. [ ] Open https://9jai.web.app
2. [ ] Click "Sign in with Google"
3. [ ] Complete authentication
4. [ ] ✅ Verify sidebar is visible on left (260px width)
5. [ ] Click toggle button (top-left)
6. [ ] ✅ Verify sidebar collapses smoothly
7. [ ] Click toggle button again
8. [ ] ✅ Verify sidebar expands smoothly
9. [ ] Click "New Chat" button in sidebar
10. [ ] ✅ Verify new chat session starts
11. [ ] ✅ Verify chat history shows previous conversations

### Expected Results:
- Sidebar visible after login
- Toggle works smoothly
- New chat starts correctly
- History displays properly

### Pass Criteria: All checkboxes ✅

**Result**: ⏳ PENDING
**Notes**: _______________________

---

## Test 2: Mobile Responsiveness

### Steps:
1. [ ] Open DevTools (F12)
2. [ ] Click device toggle icon or press Ctrl+Shift+M
3. [ ] Select "iPhone 12 Pro" or similar
4. [ ] Reload page
5. [ ] ✅ Verify sidebar is hidden by default
6. [ ] Click hamburger menu (top-left)
7. [ ] ✅ Verify sidebar slides in from left
8. [ ] ✅ Verify dark overlay appears behind sidebar
9. [ ] Click overlay (outside sidebar)
10. [ ] ✅ Verify sidebar closes
11. [ ] Open sidebar again
12. [ ] Click "New Chat"
13. [ ] ✅ Verify sidebar closes automatically
14. [ ] Scroll chat area
15. [ ] ✅ Verify smooth scrolling

### Expected Results:
- Mobile layout activates <768px
- Sidebar hidden by default
- Overlay mode works
- Auto-close after actions

### Pass Criteria: All checkboxes ✅

**Result**: ⏳ PENDING
**Notes**: _______________________

---

## Test 3: Authentication Flow

### Steps:
1. [ ] Open https://9jai.web.app in incognito/private window
2. [ ] ✅ Verify login page/prompt shows
3. [ ] Click "Sign in with Google"
4. [ ] ✅ Verify redirected to Google OAuth
5. [ ] Select Google account
6. [ ] Grant permissions
7. [ ] ✅ Verify redirected back to app
8. [ ] ✅ Verify sidebar appears
9. [ ] ✅ Verify user email shows in sidebar footer
10. [ ] ✅ Verify profile icon/avatar shows
11. [ ] Click logout/sign out (if available)
12. [ ] ✅ Verify sidebar disappears
13. [ ] ✅ Verify redirected to login

### Expected Results:
- Smooth OAuth flow
- Proper redirects
- User info displays
- Logout works

### Pass Criteria: All checkboxes ✅

**Result**: ⏳ PENDING
**Notes**: _______________________

---

## Test 4: Chat Interface

### Steps:
1. [ ] Login to app
2. [ ] Type "Hello, this is a test" in chat input
3. [ ] Press Enter
4. [ ] ✅ Verify message appears in chat bubbleUser message displays
5. [ ] ✅ Verify loading indicator shows
6. [ ] Wait for response
7. [ ] ✅ Verify AI response appears
8. [ ] Type "Generate an image of a sunset"
9. [ ] Send message
10. [ ] ✅ Verify appropriate response (image or explanation)
11. [ ] Type "What time is it in Lagos?"
12. [ ] Send message
13. [ ] ✅ Verify appropriate response
14. [ ] Scroll up in chat history
15. [ ] ✅ Verify smooth scrolling
16. [ ] ✅ Verify messages persist

### Expected Results:
- Messages send correctly
- Responses appear
- Different request types handled
- Smooth UX

### Pass Criteria: All checkboxes ✅

**Result**: ⏳ PENDING
**Notes**: _______________________

---

## Test 5: System Status Indicator

### Steps:
1. [ ] Login to app
2. [ ] Look at bottom-right corner
3. [ ] ✅ Verify status indicator visible
4. [ ] ✅ Verify shows format like "8/10" or similar
5. [ ] ✅ Verify colored dot (green/yellow/red)
6. [ ] Click the status indicator
7. [ ] ✅ Verify panel expands
8. [ ] ✅ Verify shows list of features
9. [ ] ✅ Verify each feature has icon and status
10. [ ] ✅ Verify "Refresh Status" button visible
11. [ ] Click "Refresh Status"
12. [ ] ✅ Verify updates (shows loading)
13. [ ] Click outside panel
14. [ ] ✅ Verify panel closes

### Expected Results:
- Indicator visible and functional
- Expands/collapses smoothly
- Shows accurate feature list
- Refresh works

### Pass Criteria: All checkboxes ✅

**Result**: ⏳ PENDING
**Notes**: _______________________

---

## Additional Checks

### Performance
1. [ ] Open DevTools → Network tab
2. [ ] Reload page
3. [ ] ✅ Verify page loads in <3 seconds
4. [ ] ✅ Verify no 404 errors
5. [ ] ✅ Verify no console errors

### Accessibility
1. [ ] Press Tab key repeatedly
2. [ ] ✅ Verify focus moves logically
3. [ ] ✅ Verify focus visible
4. [ ] Press Enter on focused buttons
5. [ ] ✅ Verify actions trigger

### Browser Compatibility
Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (if Mac)
- [ ] Edge (if Windows)

---

## Summary

| Test | Status | Notes |
|------|--------|-------|
| 1. Sidebar | ⏳ | |
| 2. Mobile | ⏳ | |
| 3. Auth | ⏳ | |
| 4. Chat | ⏳ | |
| 5. Status | ⏳ | |
| Performance | ⏳ | |
| Accessibility | ⏳ | |

**Overall Frontend Status**: ⏳ PENDING

**Issues Found**:
1. _______________________
2. _______________________

**Recommendations**:
1. _______________________
2. _______________________

---

**Tester**: _______________________
**Date**: _______________________
**Sign-off**: [ ] All tests passed
