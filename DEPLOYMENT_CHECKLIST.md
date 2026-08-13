# 9JAI AI - Deployment Checklist
**FREE-FIRST Architecture - Phases 1-6 Complete**

---

## 🚀 PRE-DEPLOYMENT CHECKLIST

### 1. Install Dependencies
```bash
cd functions
npm install tesseract.js
npm run build
```

**Expected**: No errors, build succeeds

---

### 2. Install Ollama (Server/Local)

#### Linux/macOS
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

#### Windows
Download from: https://ollama.ai/download

#### Verify Installation
```bash
ollama --version
```

**Expected**: Version number displayed

---

### 3. Pull AI Models

#### Chat Model (Required)
```bash
ollama pull llama3.2
```
**Size**: ~2GB
**Purpose**: FREE chat (no API key)

#### Vision Model (Required)
```bash
ollama pull llava
```
**Size**: ~4GB
**Purpose**: FREE image understanding

#### Alternative Vision Model (Optional)
```bash
ollama pull bakllava
```
**Size**: ~4GB
**Purpose**: Fallback for llava

---

### 4. Start Ollama Service

#### Option A: Background Service (Production)
```bash
ollama serve &
```

#### Option B: Systemd (Linux Production)
```bash
sudo systemctl enable ollama
sudo systemctl start ollama
```

#### Verify Service
```bash
curl http://localhost:11434/api/tags
```

**Expected**: JSON response with model list

---

### 5. Configure Firebase (If Ollama on Different Server)

```bash
# Set Ollama URL if not localhost
firebase functions:config:set ollama.url="http://your-server:11434"
```

---

### 6. Deploy Firebase Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy specific functions
firebase deploy --only functions:aiChat,functions:aiTime,functions:aiWeather,functions:aiVision,functions:v1Ocr,functions:aiSearch
```

**Expected**: All functions deploy successfully

---

### 7. Verify Deployment

#### Test Health Endpoint
```bash
curl https://us-central1-YOUR-PROJECT.cloudfunctions.net/aiHealth
```

**Expected**: `{"status":"ok", ...}`

#### Test Time Endpoint
```bash
curl -X POST https://us-central1-YOUR-PROJECT.cloudfunctions.net/aiTime \
  -H "Content-Type: application/json" \
  -d '{"city":"Lagos"}'
```

**Expected**: Current time for Lagos

#### Test Weather Endpoint
```bash
curl -X POST https://us-central1-YOUR-PROJECT.cloudfunctions.net/aiWeather \
  -H "Content-Type: application/json" \
  -d '{"location":"Lagos"}'
```

**Expected**: Weather data for Lagos

#### Test Chat (Ollama)
```bash
curl -X POST https://us-central1-YOUR-PROJECT.cloudfunctions.net/aiChat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role":"user", "content":"Hello, who are you?"}]
  }'
```

**Expected**: Chat response from Ollama

#### Test Search (DuckDuckGo)
```bash
curl -X POST https://us-central1-YOUR-PROJECT.cloudfunctions.net/aiSearch \
  -H "Content-Type: application/json" \
  -d '{"query":"Nigeria population 2026"}'
```

**Expected**: Search results from DuckDuckGo

---

## ✅ FEATURE VERIFICATION

After deployment, verify each FREE feature:

| Feature | Endpoint | Provider | Status |
|---------|----------|----------|--------|
| Chat | `/aiChat` | Ollama llama3.2 | ⬜ |
| Time | `/aiTime` | Node.js Date | ⬜ |
| Weather | `/aiWeather` | Open-Meteo | ⬜ |
| Search | `/aiSearch` | DuckDuckGo | ⬜ |
| Vision | `/aiVision` | Ollama llava | ⬜ |
| OCR | `/v1Ocr` | Tesseract.js | ⬜ |
| Images | `/aiImage` | Pollinations | ⬜ |
| TTS | Client-side | Browser API | ⬜ |

---

## 🔧 TROUBLESHOOTING

### Issue: Ollama Connection Failed
**Error**: `ECONNREFUSED` or `Ollama is not available`

**Solution**:
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not running, start it
ollama serve

# Check firewall (if remote server)
sudo ufw allow 11434
```

---

### Issue: Model Not Found
**Error**: `model 'llama3.2' not found`

**Solution**:
```bash
# List installed models
ollama list

# Pull missing model
ollama pull llama3.2
ollama pull llava
```

---

### Issue: Tesseract Not Working
**Error**: `tesseract is not defined`

**Solution**:
```bash
cd functions
npm install tesseract.js
npm run build
firebase deploy --only functions
```

---

### Issue: Functions Timeout
**Error**: `Function timeout` or `504 Gateway Timeout`

**Solution**:
- Increase timeout in `functions/src/index.ts`:
  ```typescript
  setGlobalOptions({
    timeoutSeconds: 120, // Increase from 60
  });
  ```
- Redeploy: `firebase deploy --only functions`

---

### Issue: Memory Limit Exceeded
**Error**: `Memory limit exceeded`

**Solution**:
- Increase memory in `functions/src/index.ts`:
  ```typescript
  setGlobalOptions({
    memory: '512MiB', // Increase from 256MiB
  });
  ```
- Note: This may increase costs

---

## 📊 MONITORING

### Check Function Logs
```bash
# All functions
firebase functions:log

# Specific function
firebase functions:log --only aiChat

# Follow live logs
firebase functions:log --only aiChat --tail
```

### Check Ollama Logs
```bash
# Systemd
sudo journalctl -u ollama -f

# Direct process
# Check console where 'ollama serve' is running
```

### Monitor Function Performance
- Visit: https://console.firebase.google.com/project/YOUR-PROJECT/functions
- Check: Invocations, Errors, Latency

---

## 🎯 SUCCESS CRITERIA

Your deployment is successful when:

- ✅ All 8 features respond without errors
- ✅ Chat uses Ollama (check logs for "provider":"ollama")
- ✅ Search uses DuckDuckGo (check logs for "duckduckgo")
- ✅ Time/Weather return real data
- ✅ Vision/OCR process images correctly
- ✅ No API key errors in logs
- ✅ Response times < 5 seconds for most queries

---

## 🔐 SECURITY CHECKLIST

Before production:

- ✅ Enable CORS only for your domain
- ✅ Add rate limiting (already configured: 60/min)
- ✅ Enable Firebase App Check (optional)
- ✅ Secure Ollama endpoint (if remote):
  ```bash
  # Use reverse proxy with auth
  # Or use VPN/private network
  ```
- ✅ Review Firebase Functions permissions
- ✅ Enable Cloud Functions logs monitoring

---

## 💰 COST OPTIMIZATION

Free tier considerations:

**Firebase Functions (Free Tier)**:
- 2M invocations/month
- 400K GB-seconds
- 200K CPU-seconds
- 5GB egress

**Optimization Tips**:
1. Use caching (already implemented)
2. Optimize memory settings (256MiB → 512MiB only if needed)
3. Monitor with Firebase console
4. Set up budget alerts

**Expected Costs**:
- With FREE providers: $0-5/month (just Firebase hosting)
- Ollama: $0 (self-hosted)
- All APIs: $0 (free tier)

---

## 📞 SUPPORT

### Documentation
- Setup guide: `OLLAMA_SETUP_GUIDE.md`
- Phase 6 details: `PHASE_6_TIME_WEATHER_COMPLETE.md`
- Overall progress: `MASTER_RECONCILIATION_EXECUTION_SUMMARY.md`

### External Resources
- Ollama: https://ollama.ai/
- Tesseract.js: https://tesseract.projectnaptha.com/
- Open-Meteo: https://open-meteo.com/
- Firebase: https://firebase.google.com/docs/functions

---

## ✅ DEPLOYMENT COMPLETE

Once all checkboxes above are complete:

1. ✅ Frontend testing (test in browser)
2. ✅ Update README with deployment info
3. ✅ Share with users
4. ✅ Monitor for 24 hours
5. ✅ Proceed to Phase 7 (Minimal Sidebar)

**Congratulations! You now have a fully FREE AI system.** 🎉

---

**Last Updated**: After Phase 6 Completion
**Next Step**: Phase 7 - Minimal Sidebar (see `REMAINING_PHASES_IMPLEMENTATION_GUIDE.md`)
