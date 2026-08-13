# 9jai AI - Quick Reference Card

## 🚀 URLs
- **Production**: https://9jai.web.app
- **Health Check**: https://9jai.web.app/api/ai/health
- **Firebase Console**: https://console.firebase.google.com/project/jatalk-1274b

## 🎨 Image Generation

### ✅ WORKS
```
a lion
a beautiful sunset
Nigerian skyline
logo for my company
draw me a car
generate image of Lagos
```

### ❌ DOESN'T TRIGGER
```
what is a lion
how does a lion look
generate a report
create a list
tell me about lions
```

## 💬 Chat Examples
```
How far?
Wetin be the weather?
Translate "Hello" to Yoruba
Explain quantum physics
Tell me about Nigeria
```

## 🎬 Video Generation
```
generate video of sunset
create video of dancing
animate a flying bird
```
*Note: Shows certification message (expected)*

## 🛠️ Development

### Build & Deploy
```bash
npm run build
npx firebase deploy --only hosting
npx firebase functions:list
```

### Check Status
```bash
npx firebase functions:list
curl https://9jai.web.app/api/ai/health
```

## 📊 System Status

### Backend Functions (20)
- ✅ aiChat, aiStream
- ✅ aiImage, aiVideo
- ✅ aiVision, aiTranscribe
- ✅ aiSearch, aiTTS
- ✅ v1ImageGenerate, v1VideoProcess
- ✅ And 10 more...

### Key Endpoints
```
POST /api/ai/chat        - Chat
POST /api/ai/image       - Image generation
POST /api/v1/video/process - Video generation
GET  /api/ai/health      - Health check
```

## 🐛 Troubleshooting

### Image Not Generating?
1. Check internet connection
2. Refresh page
3. Try: "generate image of [what you want]"
4. Clear cache

### Chat Not Working?
1. Refresh page
2. Check console for errors
3. Verify at /api/ai/health

## 📱 Features

### ✅ Working
- Image generation (multiple providers)
- Chat (Nigerian Pidgin + 100+ languages)
- Translation
- Web search
- Voice transcription
- Vision analysis
- Document processing

### 🔄 In Progress
- Video generation (provider certification)
- Enhanced analytics
- Mobile PWA

## 🔑 Key Files

### Frontend
- `src/components/SuperEcosystem.tsx` - Main chat
- `src/components/SystemStatusChecker.tsx` - Status monitor
- `src/lib/imageService.ts` - Image generation

### Backend
- `functions/src/index.ts` - All Cloud Functions
- `firebase.json` - Hosting config

### Docs
- `USER_GUIDE.md` - User documentation
- `IMPROVEMENTS.md` - Technical details
- `DEPLOYMENT_SUMMARY.md` - Session summary

## 💡 Pro Tips

### Better Images
- Be specific: "realistic portrait of Nigerian woman"
- Add style: "photorealistic", "cinematic"
- Include mood: "dramatic", "peaceful"
- Specify quality: "high quality", "detailed"

### Better Chat
- Ask follow-ups
- Provide context
- Be specific
- Use examples

## 🎯 Testing Checklist

1. ✅ Open https://9jai.web.app
2. ✅ Type "a lion" → Should generate image
3. ✅ Type "what is a lion" → Should chat
4. ✅ Type "generate video of sunset" → Should show message
5. ✅ Click status button (bottom-left) → Should show green
6. ✅ Test on mobile

## 📞 Support

### Self-Help
- Check USER_GUIDE.md
- View IMPROVEMENTS.md
- Check system status (bottom-left button)
- Visit /api/ai/health

### Common Issues
- **Slow loading**: Clear cache, check internet
- **Image failed**: Refresh and retry
- **Chat stuck**: Refresh page
- **Rate limited**: Wait 1 minute

## 🎊 Success Indicators

### Working System
- ✅ Status button shows green
- ✅ "a lion" generates image
- ✅ Chat responds in Pidgin
- ✅ /api/ai/health returns 200

### Problem Indicators
- ❌ Status button shows red
- ❌ Images timeout
- ❌ Chat errors
- ❌ /api/ai/health fails

---

**Last Updated**: August 10, 2026
**Version**: 2.0.0
**Status**: ✅ All Systems Operational
