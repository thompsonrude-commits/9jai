# 9jai Platform - Quick Reference Guide

## 🎯 CURRENT STATE (May 20, 2026)

### ✅ What's Working
- **Home Page:** White background, minimal design with Pidgin greeting
- **User Login:** Email/password + Gmail OAuth
- **Admin Login:** Separate `/admin` route with hardcoded credentials
- **Language Learning:** 24 languages with vocabularies (out of 127 total)
- **Chat Interface:** Typewriter effect, session persistence, auto-switch image generation
- **Mobile:** Fully responsive, 25% larger on mobile
- **Deployment:** Live at https://9jai.web.app

### 🔑 Key Credentials
- **Admin Email:** obosathompsons@gmail.com
- **Admin Password:** 1122@_maNN
- **Admin URL:** https://9jai.web.app/admin

---

## 📂 CRITICAL FILES TO KNOW

### Home Page & Routing
- `src/App.tsx` - Main routing and authentication
- `src/components/GeneralAssistant.tsx` - Home page (white background, minimal)

### Authentication
- `src/components/LoginPage.tsx` - User login with Gmail
- `src/components/AdminLogin.tsx` - Admin login at `/admin`
- `src/lib/firebase.ts` - Firebase config and auth functions

### Language Features
- `src/components/LanguageAssistant.tsx` - Chat interface with auto-switch image generation
- `src/lib/languageVocabularies.ts` - Main language vocabularies
- `src/lib/additionalLanguageVocabularies.ts` - Additional vocabularies
- `src/lib/nigerianLanguages.ts` - All 127 languages database

### Advanced Features
- `src/lib/sessionManager.ts` - Chat history persistence
- `src/lib/analyticsService.ts` - User tracking
- `src/components/ImageGenerator.tsx` - Image generation
- `src/components/EducationHub.tsx` - Learning materials
- `src/components/NewsHub.tsx` - News categories

---

## 🔄 BUILD & DEPLOY PROCESS

### Build
```bash
npm run build
```
- Takes ~12 seconds
- Outputs to `dist/` folder
- 0 errors expected

### Deploy
```bash
firebase deploy
```
- Takes ~30 seconds
- Deploys to https://9jai.web.app
- Updates Firestore rules, Storage rules, and Hosting

### Full Cycle
```bash
npm run build && firebase deploy
```

---

## 📊 LANGUAGE COVERAGE

### With Vocabularies (24 languages)
Pidgin, Yoruba, Igbo, Hausa, Efik, Ibibio, Ijaw, Urhobo, Isoko, Fulfulde, Kanuri, Tiv, Nupe, Idoma, Esan, Afemai, Igala, Ebira, Itsekiri, Ogoni, Kalabari, Nembe, Ogbia, Jukun

### Missing Vocabularies (103 languages)
- **HIGH PRIORITY:** Hausa dialects (11M+), Yoruba dialects (5M+), Igbo dialects (5M+)
- **MEDIUM PRIORITY:** Ikwerre, Berom, Bachama, Ijesa, Awori, Egba, etc.
- **LOWER PRIORITY:** Smaller languages with <300K speakers

---

## 🎨 UI COLORS & FONTS

### Colors
- **Primary Green:** #008751
- **Secondary Green:** #00A862
- **Background:** White
- **Text:** Gray-900

### Fonts
- **Headings:** Cormorant Garamond (serif)
- **Body:** Inter (sans-serif)

---

## 📱 RESPONSIVE BREAKPOINTS

- **Mobile:** 320px - 640px (sm:)
- **Tablet:** 640px - 1024px (md:)
- **Desktop:** 1024px+ (lg:)

---

## 🔧 COMMON TASKS

### Add a New Language Vocabulary
1. Edit `src/lib/additionalLanguageVocabularies.ts`
2. Add new vocabulary object with `languageId` and `languageName`
3. Run `npm run build && firebase deploy`

### Change Admin Credentials
1. Edit `src/App.tsx` - change `ADMIN_EMAIL`
2. Edit `src/components/AdminLogin.tsx` - change hardcoded password
3. Run `npm run build && firebase deploy`

### Update Home Page Text
1. Edit `src/components/GeneralAssistant.tsx`
2. Change heading or description text
3. Run `npm run build && firebase deploy`

### Add New Language to Database
1. Edit `src/lib/nigerianLanguages.ts`
2. Add language object to appropriate region
3. Run `npm run build && firebase deploy`

---

## 🐛 TROUBLESHOOTING

### Build Fails
- Check Node.js version: `node --version` (should be 16+)
- Clear cache: `rm -r node_modules && npm install`
- Check for TypeScript errors: `npm run lint`

### Deploy Fails
- Check Firebase login: `firebase login`
- Verify project: `firebase projects:list`
- Check Firestore rules: `firebase deploy --only firestore:rules`

### App Shows Blank Screen
- Check browser console for errors
- Verify Firebase config in `src/lib/firebase.ts`
- Check if user is authenticated

### Mobile Layout Issues
- Check Tailwind breakpoints in component
- Verify responsive classes (sm:, md:, lg:)
- Test on actual mobile device

---

## 📈 NEXT STEPS

### Immediate (This Week)
1. Add Hausa dialect vocabularies (11M+ speakers)
2. Add Yoruba dialect vocabularies (5M+ speakers)
3. Add Igbo dialect vocabularies (5M+ speakers)

### Short-term (This Month)
1. Add remaining high-priority languages (1M+ speakers)
2. Integrate real news API
3. Add voice recognition

### Long-term (This Quarter)
1. Create mobile app (React Native)
2. Add offline support
3. Implement user-generated content
4. Add language certification system

---

## 📞 CONTACT

**Admin Email:** obosathompsons@gmail.com  
**Platform:** https://9jai.web.app  
**Company:** 9aij Technology Limited  
**Designer:** Thompson Obosa

---

**Last Updated:** May 20, 2026  
**Status:** ✅ Live and Operational
